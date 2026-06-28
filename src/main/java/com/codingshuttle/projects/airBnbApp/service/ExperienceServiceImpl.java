package com.codingshuttle.projects.airBnbApp.service;

import com.codingshuttle.projects.airBnbApp.dto.ExperienceDto;
import com.codingshuttle.projects.airBnbApp.dto.ExperienceBookingDto;
import com.codingshuttle.projects.airBnbApp.dto.ExperienceBookingRequest;
import com.codingshuttle.projects.airBnbApp.entity.Experience;
import com.codingshuttle.projects.airBnbApp.entity.ExperienceBooking;
import com.codingshuttle.projects.airBnbApp.entity.User;
import com.codingshuttle.projects.airBnbApp.entity.enums.BookingStatus;
import com.codingshuttle.projects.airBnbApp.exception.ResourceNotFoundException;
import com.codingshuttle.projects.airBnbApp.exception.UnAuthorisedException;
import com.codingshuttle.projects.airBnbApp.repository.ExperienceRepository;
import com.codingshuttle.projects.airBnbApp.repository.ExperienceBookingRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.checkout.Session;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ExperienceServiceImpl implements ExperienceService {

    private final ExperienceRepository experienceRepository;
    private final ExperienceBookingRepository experienceBookingRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ExperienceDto> getAllExperiences(String city, Boolean isOnline) {
        log.info("Fetching experiences. City: {}, isOnline: {}", city, isOnline);
        List<Experience> experiences;

        if (isOnline != null && isOnline) {
            experiences = experienceRepository.findByIsOnline(true);
        } else if (city != null && !city.trim().isEmpty()) {
            experiences = experienceRepository.findByLocationIgnoreCaseAndIsOnline(city.trim(), false);
        } else {
            experiences = experienceRepository.findByIsOnline(false);
        }

        return experiences.stream()
                .map(exp -> modelMapper.map(exp, ExperienceDto.class))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ExperienceDto getExperienceById(Long id) {
        log.info("Fetching experience details for ID: {}", id);
        Experience experience = experienceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Experience not found with ID: " + id));
        return modelMapper.map(experience, ExperienceDto.class);
    }

    @Override
    public ExperienceBookingDto initialiseExperienceBooking(ExperienceBookingRequest request) {
        log.info("Initialising experience booking for Experience ID: {}", request.getExperienceId());
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Experience experience = experienceRepository.findById(request.getExperienceId())
                .orElseThrow(() -> new ResourceNotFoundException("Experience not found with ID: " + request.getExperienceId()));

        BigDecimal amount = experience.getPrice().multiply(BigDecimal.valueOf(request.getGuestsCount()));

        ExperienceBooking booking = new ExperienceBooking();
        booking.setExperience(experience);
        booking.setUser(user);
        booking.setBookingDate(request.getBookingDate());
        booking.setGuestsCount(request.getGuestsCount());
        booking.setAmount(amount);
        booking.setBookingStatus(BookingStatus.RESERVED);

        ExperienceBooking savedBooking = experienceBookingRepository.save(booking);
        return modelMapper.map(savedBooking, ExperienceBookingDto.class);
    }

    @Override
    public String initiateExperiencePayment(Long bookingId, String successUrl, String failureUrl) {
        log.info("Initiating payment for experience booking ID: {}", bookingId);
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        ExperienceBooking booking = experienceBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Experience booking not found with ID: " + bookingId));

        if (!booking.getUser().getId().equals(user.getId())) {
            throw new UnAuthorisedException("You do not own this booking session.");
        }

        if (booking.getBookingStatus() == BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Booking is already confirmed and paid.");
        }

        try {
            CustomerCreateParams customerParams = CustomerCreateParams.builder()
                    .setName(user.getName())
                    .setEmail(user.getEmail())
                    .build();
            Customer customer = Customer.create(customerParams);

            SessionCreateParams sessionParams = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setBillingAddressCollection(SessionCreateParams.BillingAddressCollection.REQUIRED)
                    .setCustomer(customer.getId())
                    .setSuccessUrl(successUrl)
                    .setCancelUrl(failureUrl)
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency("inr")
                                                    .setUnitAmount(booking.getAmount().multiply(BigDecimal.valueOf(100)).longValue())
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("Experience: " + booking.getExperience().getTitle())
                                                                    .setDescription("Booking ID: " + booking.getId() + " on " + booking.getBookingDate())
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .build()
                    )
                    .build();

            Session session = Session.create(sessionParams);
            booking.setPaymentSessionId(session.getId());
            booking.setBookingStatus(BookingStatus.PAYMENTS_PENDING);
            experienceBookingRepository.save(booking);

            log.info("Stripe session created for experience booking ID: {}", bookingId);
            return session.getUrl();

        } catch (StripeException e) {
            log.error("Failed to generate Stripe checkout session for experience booking ID: {}", bookingId, e);
            throw new RuntimeException("Stripe checkout error", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExperienceBookingDto> getMyExperienceBookings() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        log.info("Retrieving experience bookings for user: {}", user.getEmail());

        return experienceBookingRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(booking -> modelMapper.map(booking, ExperienceBookingDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public void cancelExperienceBooking(Long bookingId) {
        log.info("Cancelling experience booking ID: {}", bookingId);
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        ExperienceBooking booking = experienceBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Experience booking not found with ID: " + bookingId));

        if (!booking.getUser().getId().equals(user.getId())) {
            throw new UnAuthorisedException("You do not own this booking.");
        }

        booking.setBookingStatus(BookingStatus.CANCELLED);
        experienceBookingRepository.save(booking);
    }

    @Override
    public BookingStatus getExperienceBookingStatus(Long bookingId) {
        ExperienceBooking booking = experienceBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Experience booking not found with ID: " + bookingId));

        if (booking.getBookingStatus() == BookingStatus.PAYMENTS_PENDING && booking.getPaymentSessionId() != null) {
            try {
                Session session = Session.retrieve(booking.getPaymentSessionId());
                if ("paid".equals(session.getPaymentStatus())) {
                    booking.setBookingStatus(BookingStatus.CONFIRMED);
                    experienceBookingRepository.save(booking);
                } else if ("expired".equals(session.getStatus())) {
                    booking.setBookingStatus(BookingStatus.EXPIRED);
                    experienceBookingRepository.save(booking);
                }
            } catch (StripeException e) {
                log.warn("Stripe API exception retrieving checkout session for experience booking {}: {}", bookingId, e.getMessage());
            }
        }

        return booking.getBookingStatus();
    }

    @Override
    @Transactional(readOnly = true)
    public ExperienceBookingDto getExperienceBookingDetails(Long bookingId) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        ExperienceBooking booking = experienceBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Experience booking not found with ID: " + bookingId));

        if (!booking.getUser().getId().equals(user.getId())) {
            throw new UnAuthorisedException("You do not own this booking details.");
        }

        return modelMapper.map(booking, ExperienceBookingDto.class);
    }
}
