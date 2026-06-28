package com.codingshuttle.projects.airBnbApp.service;

import com.codingshuttle.projects.airBnbApp.dto.BookingDto;
import com.codingshuttle.projects.airBnbApp.dto.BookingRequest;
import com.codingshuttle.projects.airBnbApp.dto.GuestDto;
import com.codingshuttle.projects.airBnbApp.dto.HotelReportDto;
import com.codingshuttle.projects.airBnbApp.entity.*;
import com.codingshuttle.projects.airBnbApp.entity.enums.BookingStatus;
import com.codingshuttle.projects.airBnbApp.exception.ResourceNotFoundException;
import com.codingshuttle.projects.airBnbApp.exception.UnAuthorisedException;
import com.codingshuttle.projects.airBnbApp.repository.*;
import com.codingshuttle.projects.airBnbApp.strategy.PricingService;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.Refund;
import com.stripe.model.checkout.Session;
import com.stripe.param.RefundCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import com.codingshuttle.projects.airBnbApp.dto.events.BookingEvent;
import com.codingshuttle.projects.airBnbApp.dto.events.PaymentEvent;
import com.codingshuttle.projects.airBnbApp.service.RecommendationService;

import static com.codingshuttle.projects.airBnbApp.util.AppUtils.getCurrentUser;

@Service
@Slf4j
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService{
    private final GuestRepository guestRepository;
    private final ModelMapper modelMapper;

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final InventoryRepository inventoryRepository;
    private final CheckoutService checkoutService;
    private final PricingService pricingService;
    private final KafkaProducerService kafkaProducerService;
    private final NotificationService notificationService;
    private final RecommendationService recommendationService;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Override
    @Transactional
    @CacheEvict(value = "hotelSearch", allEntries = true)
    public BookingDto initialiseBooking(BookingRequest bookingRequest) {

        log.info("Initialising booking for hotel : {}, room: {}, date {}-{}", bookingRequest.getHotelId(),
                bookingRequest.getRoomId(), bookingRequest.getCheckInDate(), bookingRequest.getCheckOutDate());

        Hotel hotel = hotelRepository.findById(bookingRequest.getHotelId()).orElseThrow(() ->
                new ResourceNotFoundException("Hotel not found with id: "+bookingRequest.getHotelId()));

        Room room = roomRepository.findById(bookingRequest.getRoomId()).orElseThrow(() ->
                new ResourceNotFoundException("Room not found with id: "+bookingRequest.getRoomId()));

        List<Inventory> inventoryList = inventoryRepository.findAndLockAvailableInventory(room.getId(),
                bookingRequest.getCheckInDate(), bookingRequest.getCheckOutDate(), bookingRequest.getRoomsCount());

        long daysCount = ChronoUnit.DAYS.between(bookingRequest.getCheckInDate(), bookingRequest.getCheckOutDate())+1;

        if (inventoryList.size() != daysCount) {
            throw new IllegalStateException("Room is not available anymore");
        }

        // Reserve the room/ update the booked count of inventories
        inventoryRepository.initBooking(room.getId(), bookingRequest.getCheckInDate(),
                bookingRequest.getCheckOutDate(), bookingRequest.getRoomsCount());

        BigDecimal priceForOneRoom = pricingService.calculateTotalPrice(inventoryList);
        BigDecimal totalPrice = priceForOneRoom.multiply(BigDecimal.valueOf(bookingRequest.getRoomsCount()));

        Booking booking = Booking.builder()
                .bookingStatus(BookingStatus.RESERVED)
                .hotel(hotel)
                .room(room)
                .checkInDate(bookingRequest.getCheckInDate())
                .checkOutDate(bookingRequest.getCheckOutDate())
                .user(getCurrentUser())
                .roomsCount(bookingRequest.getRoomsCount())
                .amount(totalPrice)
                .build();

        booking = bookingRepository.save(booking);

        // Publish booking-created Kafka event
        try {
            BookingEvent bookingCreatedEvent = BookingEvent.builder()
                    .bookingId(booking.getId())
                    .guestEmail(booking.getUser().getEmail())
                    .hotelId(booking.getHotel().getId())
                    .roomId(booking.getRoom().getId())
                    .checkInDate(booking.getCheckInDate())
                    .checkOutDate(booking.getCheckOutDate())
                    .amount(booking.getAmount())
                    .status(booking.getBookingStatus().name())
                    .build();
            kafkaProducerService.sendBookingCreated(bookingCreatedEvent);
        } catch (Exception e) {
            log.error("Failed to publish booking-created Kafka event for Booking ID {}: {}", booking.getId(), e.getMessage());
            if (booking.getUser() != null) {
                notificationService.sendLiveNotification(booking.getUser().getEmail(), 
                        "Booking Reserved Successfully", 
                        "Your booking #" + booking.getId() + " has been reserved. Please complete payment within 10 minutes.");
            }
        }

        // Publish BOOK interaction event for recommendation
        if (booking.getUser() != null) {
            com.codingshuttle.projects.airBnbApp.dto.events.HotelInteractionEvent recEvent = com.codingshuttle.projects.airBnbApp.dto.events.HotelInteractionEvent.builder()
                    .userId(booking.getUser().getId())
                    .hotelId(booking.getHotel().getId())
                    .actionType("BOOK")
                    .timestamp(java.time.LocalDateTime.now())
                    .build();
            try {
                kafkaProducerService.sendHotelInteraction(recEvent);
            } catch (Exception e) {
                log.warn("Kafka offline, saving BOOK interaction directly for user: {}, hotel: {}", booking.getUser().getId(), booking.getHotel().getId());
                recommendationService.saveUserActivityDirectly(booking.getUser().getId(), booking.getHotel().getId(), "BOOK");
            }
        }

        return modelMapper.map(booking, BookingDto.class);
    }

    @Override
    @Transactional
    public BookingDto addGuests(Long bookingId, List<Long> guestIdList) {

        log.info("Adding guests for booking with id: {}", bookingId);

        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() ->
                new ResourceNotFoundException("Booking not found with id: "+bookingId));
        User user = getCurrentUser();

        if (!user.equals(booking.getUser())) {
            throw new UnAuthorisedException("Booking does not belong to this user with id: "+user.getId());
        }

        if (hasBookingExpired(booking)) {
            throw new IllegalStateException("Booking has already expired");
        }

        if (booking.getBookingStatus() != BookingStatus.RESERVED && booking.getBookingStatus() != BookingStatus.GUESTS_ADDED) {
            throw new IllegalStateException("Booking is not in a valid state to add guests");
        }

        booking.getGuests().clear();

        for (Long guestId: guestIdList) {
            Guest guest = guestRepository.findById(guestId)
                    .orElseThrow(() -> new ResourceNotFoundException("Guest not found with id: "+guestId));
            booking.getGuests().add(guest);
        }

        booking.setBookingStatus(BookingStatus.GUESTS_ADDED);
        booking = bookingRepository.save(booking);
        return modelMapper.map(booking, BookingDto.class);
    }

    @Override
    @Transactional
    public String initiatePayments(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(
                () -> new ResourceNotFoundException("Booking not found with id: "+bookingId)
        );
        User user = getCurrentUser();
        if (!user.equals(booking.getUser())) {
            throw new UnAuthorisedException("Booking does not belong to this user with id: "+user.getId());
        }
        if (hasBookingExpired(booking)) {
            throw new IllegalStateException("Booking has already expired");
        }
        if (booking.getBookingStatus() == BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Booking has already been confirmed and paid");
        }
        if (booking.getBookingStatus() == BookingStatus.CANCELLED || booking.getBookingStatus() == BookingStatus.EXPIRED) {
            throw new IllegalStateException("Booking is in a terminal state (cancelled/expired)");
        }

        String sessionUrl = checkoutService.getCheckoutSession(booking,
                frontendUrl+"/booking-status/" +bookingId,
                frontendUrl+"/booking-status/" +bookingId);

        booking.setBookingStatus(BookingStatus.PAYMENTS_PENDING);
        bookingRepository.save(booking);

        return sessionUrl;
    }

    @Override
    @Transactional
    public void capturePayment(Event event) {
        if ("checkout.session.completed".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
            if (session == null) return;

            String sessionId = session.getId();
            Booking booking =
                    bookingRepository.findByPaymentSessionId(sessionId).orElseThrow(() ->
                            new ResourceNotFoundException("Booking not found for session ID: "+sessionId));

            booking.setBookingStatus(BookingStatus.CONFIRMED);
            bookingRepository.save(booking);

            inventoryRepository.findAndLockReservedInventory(booking.getRoom().getId(), booking.getCheckInDate(),
                    booking.getCheckOutDate(), booking.getRoomsCount());

            inventoryRepository.confirmBooking(booking.getRoom().getId(), booking.getCheckInDate(),
                    booking.getCheckOutDate(), booking.getRoomsCount());

            // Publish payment-success Kafka event
            try {
                PaymentEvent paymentSuccessEvent = PaymentEvent.builder()
                        .bookingId(booking.getId())
                        .amount(booking.getAmount())
                        .status("SUCCESS")
                        .transactionId(sessionId)
                        .build();
                kafkaProducerService.sendPaymentSuccess(paymentSuccessEvent);
            } catch (Exception e) {
                log.error("Failed to publish payment-success event: {}", e.getMessage());
                if (booking.getUser() != null) {
                    notificationService.sendLiveNotification(booking.getUser().getEmail(), 
                            "Payment Confirmed", 
                            "Payment of ₹" + booking.getAmount() + " was successful for booking #" + booking.getId());
                    if (booking.getHotel() != null && booking.getHotel().getOwner() != null) {
                        notificationService.sendLiveNotification(booking.getHotel().getOwner().getEmail(), 
                                "New Booking Confirmed", 
                                "A new booking has been confirmed at " + booking.getHotel().getName() + " (Booking #" + booking.getId() + ")");
                    }
                }
            }

            log.info("Successfully confirmed the booking for Booking ID: {}", booking.getId());
        } else {
            log.warn("Unhandled event type: {}", event.getType());
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = "hotelSearch", allEntries = true)
    public void cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(
                () -> new ResourceNotFoundException("Booking not found with id: "+bookingId)
        );
        User user = getCurrentUser();
        if (!user.equals(booking.getUser())) {
            throw new UnAuthorisedException("Booking does not belong to this user with id: "+user.getId());
        }

        BookingStatus originalStatus = booking.getBookingStatus();
        if (originalStatus == BookingStatus.CANCELLED || originalStatus == BookingStatus.EXPIRED) {
            throw new IllegalStateException("Booking is already in a terminal state (cancelled/expired)");
        }

        booking.setBookingStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);

        // Publish booking-cancelled Kafka event
        try {
            BookingEvent bookingCancelledEvent = BookingEvent.builder()
                    .bookingId(booking.getId())
                    .guestEmail(booking.getUser().getEmail())
                    .hotelId(booking.getHotel().getId())
                    .roomId(booking.getRoom().getId())
                    .checkInDate(booking.getCheckInDate())
                    .checkOutDate(booking.getCheckOutDate())
                    .amount(booking.getAmount())
                    .status("CANCELLED")
                    .build();
            kafkaProducerService.sendBookingCancelled(bookingCancelledEvent);
        } catch (Exception e) {
            log.error("Failed to publish booking-cancelled event: {}", e.getMessage());
            if (booking.getUser() != null) {
                notificationService.sendLiveNotification(booking.getUser().getEmail(), 
                        "Booking Cancelled", 
                        "Your booking #" + booking.getId() + " has been cancelled.");
            }
        }

        if (originalStatus == BookingStatus.CONFIRMED) {
            inventoryRepository.findAndLockReservedInventory(booking.getRoom().getId(), booking.getCheckInDate(),
                    booking.getCheckOutDate(), booking.getRoomsCount());

            inventoryRepository.cancelBooking(booking.getRoom().getId(), booking.getCheckInDate(),
                    booking.getCheckOutDate(), booking.getRoomsCount());

            // Handle the Stripe refund
            try {
                if (booking.getPaymentSessionId() != null) {
                    Session session = Session.retrieve(booking.getPaymentSessionId());
                    if (session.getPaymentIntent() != null) {
                        RefundCreateParams refundParams = RefundCreateParams.builder()
                                .setPaymentIntent(session.getPaymentIntent())
                                .build();
                        Refund.create(refundParams);
                    }
                }
            } catch (StripeException e) {
                log.error("Stripe refund failed for booking ID: {}", bookingId, e);
                throw new RuntimeException("Refund failed: " + e.getMessage());
            }
        } else {
            // For RESERVED (unpaid) bookings, we only release the reserved room count
            inventoryRepository.releaseReservation(booking.getRoom().getId(), booking.getCheckInDate(),
                    booking.getCheckOutDate(), booking.getRoomsCount());
        }
    }

    @Override
    public BookingStatus getBookingStatus(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(
                () -> new ResourceNotFoundException("Booking not found with id: "+bookingId)
        );
        User user = getCurrentUser();
        if (!user.equals(booking.getUser())) {
            throw new UnAuthorisedException("Booking does not belong to this user with id: "+user.getId());
        }
        checkAndSyncPaymentStatus(booking);
        return booking.getBookingStatus();
    }

    @Override
    public List<BookingDto> getAllBookingsByHotelId(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId).orElseThrow(() -> new ResourceNotFoundException("Hotel not " +
                "found with ID: "+hotelId));
        User user = getCurrentUser();

        log.info("Getting all booking for the hotel with ID: {}", hotelId);

        if(!user.equals(hotel.getOwner())) throw new AccessDeniedException("You are not the owner of hotel with id: "+hotelId);

        List<Booking> bookings = bookingRepository.findByHotel(hotel);

        return bookings.stream()
                .map((element) -> modelMapper.map(element, BookingDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public HotelReportDto getHotelReport(Long hotelId, LocalDate startDate, LocalDate endDate) {

        Hotel hotel = hotelRepository.findById(hotelId).orElseThrow(() -> new ResourceNotFoundException("Hotel not " +
                "found with ID: "+hotelId));
        User user = getCurrentUser();

        log.info("Generating report for hotel with ID: {}", hotelId);

        if(!user.equals(hotel.getOwner())) throw new AccessDeniedException("You are not the owner of hotel with id: "+hotelId);

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        List<Booking> bookings = bookingRepository.findByHotelAndCreatedAtBetween(hotel, startDateTime, endDateTime);

        Long totalConfirmedBookings = bookings
                .stream()
                .filter(booking -> booking.getBookingStatus() == BookingStatus.CONFIRMED)
                .count();

        BigDecimal totalRevenueOfConfirmedBookings = bookings.stream()
                .filter(booking -> booking.getBookingStatus() == BookingStatus.CONFIRMED)
                .map(Booking::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgRevenue = totalConfirmedBookings == 0 ? BigDecimal.ZERO :
                totalRevenueOfConfirmedBookings.divide(BigDecimal.valueOf(totalConfirmedBookings), RoundingMode.HALF_UP);

        return new HotelReportDto(totalConfirmedBookings, totalRevenueOfConfirmedBookings, avgRevenue);
    }

    @Override
    public List<BookingDto> getMyBookings() {
        User user = getCurrentUser();

        return bookingRepository.findByUser(user)
                .stream().
                map((element) -> modelMapper.map(element, BookingDto.class))
                .collect(Collectors.toList());
    }

    public boolean hasBookingExpired(Booking booking) {
        return booking.getCreatedAt().plusMinutes(10).isBefore(LocalDateTime.now());
    }

    @Override
    public BookingDto getBookingDetails(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(
                () -> new ResourceNotFoundException("Booking not found with id: " + bookingId)
        );
        User user = getCurrentUser();
        if (!user.equals(booking.getUser()) && !user.equals(booking.getHotel().getOwner())) {
            throw new UnAuthorisedException("Booking does not belong to this user with id: " + user.getId());
        }
        checkAndSyncPaymentStatus(booking);
        return modelMapper.map(booking, BookingDto.class);
    }

    private void checkAndSyncPaymentStatus(Booking booking) {
        if (booking.getBookingStatus() == BookingStatus.PAYMENTS_PENDING && booking.getPaymentSessionId() != null) {
            try {
                Session session = Session.retrieve(booking.getPaymentSessionId());
                if ("paid".equals(session.getPaymentStatus())) {
                    booking.setBookingStatus(BookingStatus.CONFIRMED);
                    bookingRepository.save(booking);
                    log.info("Booking ID {} status synced to CONFIRMED via Stripe Session lookup", booking.getId());
                } else if ("expired".equals(session.getStatus())) {
                    booking.setBookingStatus(BookingStatus.EXPIRED);
                    bookingRepository.save(booking);
                    log.info("Booking ID {} status synced to EXPIRED via Stripe Session lookup", booking.getId());
                }
            } catch (StripeException e) {
                log.warn("Failed to retrieve Stripe session for booking {}: {}", booking.getId(), e.getMessage());
            }
        }
    }

    @Override
    @Transactional
    public BookingDto rateBooking(Long bookingId, Integer ratingValue) {
        log.info("Submitting rating {} for booking ID {}", ratingValue, bookingId);
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        User currentUser = getCurrentUser();
        if (!booking.getUser().equals(currentUser)) {
            throw new UnAuthorisedException("Booking does not belong to this user with id: " + currentUser.getId());
        }

        if (booking.getBookingStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Only paid & confirmed bookings can be rated.");
        }

        if (booking.getRating() != null) {
            throw new IllegalStateException("This booking has already been rated.");
        }

        booking.setRating(ratingValue);
        booking = bookingRepository.save(booking);

        // Compute average rating of all rated bookings for this hotel
        Double newAvgRating = bookingRepository.findAverageRatingForHotel(booking.getHotel().getId());
        if (newAvgRating != null) {
            // Round to 1 decimal place (e.g. 4.75 -> 4.8)
            newAvgRating = Math.round(newAvgRating * 10.0) / 10.0;
            booking.getHotel().setRating(newAvgRating);
            hotelRepository.save(booking.getHotel());
            log.info("Hotel ID {} rating updated to {} based on new rating submission", booking.getHotel().getId(), newAvgRating);
        }

        return modelMapper.map(booking, BookingDto.class);
    }

    @Override
    @Transactional
    public BookingDto selectCashPaymentMethod(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(
                () -> new ResourceNotFoundException("Booking not found with id: "+bookingId)
        );
        User user = getCurrentUser();
        if (!user.equals(booking.getUser())) {
            throw new UnAuthorisedException("Booking does not belong to this user with id: "+user.getId());
        }
        if (hasBookingExpired(booking)) {
            throw new IllegalStateException("Booking has already expired");
        }
        if (booking.getBookingStatus() == BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Booking has already been confirmed and paid");
        }
        if (booking.getBookingStatus() == BookingStatus.CANCELLED || booking.getBookingStatus() == BookingStatus.EXPIRED) {
            throw new IllegalStateException("Booking is in a terminal state (cancelled/expired)");
        }

        // Active Cash Booking Cap Check: restrict to at most 1 pending cash booking
        if (hasActiveCashBooking(user.getId())) {
            throw new IllegalStateException("You already have a pending cash reservation. Please pay online or complete/cancel your other stay.");
        }

        // Set status to PAYMENTS_PENDING and mark session as "CASH"
        booking.setBookingStatus(BookingStatus.PAYMENTS_PENDING);
        booking.setPaymentSessionId("CASH");
        booking = bookingRepository.save(booking);

        return modelMapper.map(booking, BookingDto.class);
    }

    @Override
    @Transactional
    public BookingDto confirmCashPayment(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(
                () -> new ResourceNotFoundException("Booking not found with id: "+bookingId)
        );
        User manager = getCurrentUser();

        // Ensure the manager is the owner of the hotel
        if (!booking.getHotel().getOwner().equals(manager)) {
            throw new UnAuthorisedException("You are not authorized to confirm payments for this hotel");
        }

        if (booking.getBookingStatus() == BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Booking has already been confirmed");
        }
        if (booking.getBookingStatus() == BookingStatus.CANCELLED || booking.getBookingStatus() == BookingStatus.EXPIRED) {
            throw new IllegalStateException("Booking is in a terminal state (cancelled/expired)");
        }
        if (!"CASH".equals(booking.getPaymentSessionId())) {
            throw new IllegalStateException("This booking is not set to Pay at Property (Cash)");
        }

        booking.setBookingStatus(BookingStatus.CONFIRMED);
        booking = bookingRepository.save(booking);

        inventoryRepository.findAndLockReservedInventory(booking.getRoom().getId(), booking.getCheckInDate(),
                booking.getCheckOutDate(), booking.getRoomsCount());

        inventoryRepository.confirmBooking(booking.getRoom().getId(), booking.getCheckInDate(),
                booking.getCheckOutDate(), booking.getRoomsCount());

        // Publish live notifications to guest and host
        try {
            notificationService.sendLiveNotification(booking.getUser().getEmail(),
                    "Cash Payment Confirmed",
                    "Your cash payment of ₹" + booking.getAmount() + " was confirmed for booking #" + booking.getId());
            notificationService.sendLiveNotification(manager.getEmail(),
                    "Cash Booking Confirmed",
                    "Booking #" + booking.getId() + " confirmed. Cash payment received: ₹" + booking.getAmount());
        } catch (Exception e) {
            log.error("Failed to send cash payment notification: {}", e.getMessage());
        }

        return modelMapper.map(booking, BookingDto.class);
    }

    @Override
    public boolean hasActiveCashBooking(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() ->
                new ResourceNotFoundException("User not found with id: " + userId));
        List<Booking> userBookings = bookingRepository.findByUser(user);
        return userBookings.stream()
                .anyMatch(b -> b.getBookingStatus() == BookingStatus.PAYMENTS_PENDING
                        && "CASH".equals(b.getPaymentSessionId()));
    }
}

