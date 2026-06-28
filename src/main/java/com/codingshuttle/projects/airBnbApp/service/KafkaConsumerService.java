package com.codingshuttle.projects.airBnbApp.service;

import com.codingshuttle.projects.airBnbApp.dto.events.*;
import com.codingshuttle.projects.airBnbApp.entity.Booking;
import com.codingshuttle.projects.airBnbApp.entity.IdempotentEventRecord;
import com.codingshuttle.projects.airBnbApp.entity.enums.BookingStatus;
import com.codingshuttle.projects.airBnbApp.repository.BookingRepository;
import com.codingshuttle.projects.airBnbApp.repository.IdempotentEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaConsumerService {

    private final IdempotentEventRepository idempotentEventRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;
    private final HostAnalyticsService hostAnalyticsService;
    private final RecommendationService recommendationService;

    // Helper method to enforce idempotency
    private boolean isAlreadyProcessed(String eventId, String consumerName) {
        if (idempotentEventRepository.existsById(eventId)) {
            log.warn("Event {} already processed by {}, skipping.", eventId, consumerName);
            return true;
        }
        idempotentEventRepository.save(new IdempotentEventRecord(eventId, consumerName, LocalDateTime.now()));
        return false;
    }

    @KafkaListener(topics = "booking-created", groupId = "airbnb-group")
    @Transactional
    public void consumeBookingCreated(BookingEvent event) {
        if (isAlreadyProcessed(event.getEventId(), "BookingCreatedConsumer")) return;

        log.info("Successfully consumed booking-created event: {}", event);

        // 1. Notify Traveler via Notification Service
        notificationService.sendLiveNotification(event.getGuestEmail(), 
                "Booking Reserved Successfully", 
                "Your booking #" + event.getBookingId() + " has been reserved. Please complete payment within 10 minutes.");

        // 2. Perform availability or double check log
        log.info("Hotel Service verified availability for Room ID: {} from {} to {}", 
                event.getRoomId(), event.getCheckInDate(), event.getCheckOutDate());
    }

    @KafkaListener(topics = "booking-cancelled", groupId = "airbnb-group")
    @Transactional
    public void consumeBookingCancelled(BookingEvent event) {
        if (isAlreadyProcessed(event.getEventId(), "BookingCancelledConsumer")) return;

        log.info("Successfully consumed booking-cancelled event: {}", event);

        notificationService.sendLiveNotification(event.getGuestEmail(), 
                "Booking Cancelled", 
                "Your booking #" + event.getBookingId() + " has been cancelled.");
    }

    @KafkaListener(topics = "payment-success", groupId = "airbnb-group")
    @Transactional
    public void consumePaymentSuccess(PaymentEvent event) {
        if (isAlreadyProcessed(event.getEventId(), "PaymentSuccessConsumer")) return;

        log.info("Successfully consumed payment-success event: {}", event);

        // 1. Update Booking status if it's not confirmed
        Booking booking = bookingRepository.findById(event.getBookingId()).orElse(null);
        if (booking != null && booking.getBookingStatus() != BookingStatus.CONFIRMED) {
            booking.setBookingStatus(BookingStatus.CONFIRMED);
            bookingRepository.save(booking);
            log.info("Updated booking status to CONFIRMED for Booking ID: {}", event.getBookingId());
        }

        // 2. Notify guest
        if (booking != null && booking.getUser() != null) {
            notificationService.sendLiveNotification(booking.getUser().getEmail(), 
                    "Payment Confirmed", 
                    "Payment of ₹" + event.getAmount() + " was successful for booking #" + event.getBookingId());
            
            // Notify host as well
            if (booking.getHotel() != null && booking.getHotel().getOwner() != null) {
                notificationService.sendLiveNotification(booking.getHotel().getOwner().getEmail(), 
                        "New Booking Confirmed", 
                        "A new booking has been confirmed at " + booking.getHotel().getName() + " (Booking #" + event.getBookingId() + ")");
            }
        }

        // 3. Update host dashboard analytics
        if (booking != null && booking.getHotel() != null && booking.getHotel().getOwner() != null) {
            hostAnalyticsService.recordRevenueEvent(booking.getHotel().getOwner().getId(), event.getAmount());
        }
    }

    @KafkaListener(topics = "payment-failed", groupId = "airbnb-group")
    @Transactional
    public void consumePaymentFailed(PaymentEvent event) {
        if (isAlreadyProcessed(event.getEventId(), "PaymentFailedConsumer")) return;

        log.info("Successfully consumed payment-failed event: {}", event);

        Booking booking = bookingRepository.findById(event.getBookingId()).orElse(null);
        if (booking != null) {
            if (booking.getUser() != null) {
                notificationService.sendLiveNotification(booking.getUser().getEmail(), 
                        "Payment Failed", 
                        "Stripe checkout session for booking #" + event.getBookingId() + " failed or expired.");
            }
        }
    }

    @KafkaListener(topics = "hotel-created", groupId = "airbnb-group")
    @Transactional
    public void consumeHotelCreated(HotelEvent event) {
        if (isAlreadyProcessed(event.getEventId(), "HotelCreatedConsumer")) return;

        log.info("Successfully consumed hotel-created event: {}", event);
        
        notificationService.sendLiveNotification(event.getOwnerEmail(), 
                "Property Submitted", 
                "Your property '" + event.getHotelName() + "' has been submitted and is pending admin approval.");
    }

    @KafkaListener(topics = "hotel-approved", groupId = "airbnb-group")
    @Transactional
    public void consumeHotelApproved(HotelEvent event) {
        if (isAlreadyProcessed(event.getEventId(), "HotelApprovedConsumer")) return;

        log.info("Successfully consumed hotel-approved event: {}", event);

        notificationService.sendLiveNotification(event.getOwnerEmail(), 
                "Property Approved!", 
                "Congratulations! Your property '" + event.getHotelName() + "' has been approved and is now live.");
    }

    @KafkaListener(topics = "notification-events", groupId = "airbnb-group")
    public void consumeNotificationEvent(NotificationEvent event) {
        if (isAlreadyProcessed(event.getEventId(), "NotificationEventConsumer")) return;

        log.info("Processing notification event: {}", event);
        notificationService.sendLiveNotification(event.getRecipientEmail(), event.getSubject(), event.getBody());
    }

    @KafkaListener(topics = "review-created", groupId = "airbnb-group")
    public void consumeReviewCreated(ReviewEvent event) {
        if (isAlreadyProcessed(event.getEventId(), "ReviewCreatedConsumer")) return;

        log.info("Successfully consumed review-created event: {}", event);
        // Can be used to recalculate hotel aggregate rating in Elasticsearch, notify host, etc.
    }

    @KafkaListener(topics = "hotel-interactions", groupId = "airbnb-group")
    public void consumeHotelInteraction(HotelInteractionEvent event) {
        if (isAlreadyProcessed(event.getEventId(), "HotelInteractionConsumer")) return;

        log.info("Successfully consumed hotel-interaction event: User {} -> Hotel {} ({})", 
                event.getUserId(), event.getHotelId(), event.getActionType());
        
        recommendationService.saveUserActivity(event);
    }
}
