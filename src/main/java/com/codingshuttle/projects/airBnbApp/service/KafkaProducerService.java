package com.codingshuttle.projects.airBnbApp.service;

import com.codingshuttle.projects.airBnbApp.dto.events.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendBookingCreated(BookingEvent event) {
        if (event.getEventId() == null) event.setEventId(UUID.randomUUID().toString());
        log.info("Publishing booking-created event: {}", event);
        kafkaTemplate.send("booking-created", event.getEventId(), event);
    }

    public void sendBookingCancelled(BookingEvent event) {
        if (event.getEventId() == null) event.setEventId(UUID.randomUUID().toString());
        log.info("Publishing booking-cancelled event: {}", event);
        kafkaTemplate.send("booking-cancelled", event.getEventId(), event);
    }

    public void sendPaymentSuccess(PaymentEvent event) {
        if (event.getEventId() == null) event.setEventId(UUID.randomUUID().toString());
        log.info("Publishing payment-success event: {}", event);
        kafkaTemplate.send("payment-success", event.getEventId(), event);
    }

    public void sendPaymentFailed(PaymentEvent event) {
        if (event.getEventId() == null) event.setEventId(UUID.randomUUID().toString());
        log.info("Publishing payment-failed event: {}", event);
        kafkaTemplate.send("payment-failed", event.getEventId(), event);
    }

    public void sendHotelCreated(HotelEvent event) {
        if (event.getEventId() == null) event.setEventId(UUID.randomUUID().toString());
        log.info("Publishing hotel-created event: {}", event);
        kafkaTemplate.send("hotel-created", event.getEventId(), event);
    }

    public void sendHotelApproved(HotelEvent event) {
        if (event.getEventId() == null) event.setEventId(UUID.randomUUID().toString());
        log.info("Publishing hotel-approved event: {}", event);
        kafkaTemplate.send("hotel-approved", event.getEventId(), event);
    }

    public void sendNotificationEvent(NotificationEvent event) {
        if (event.getEventId() == null) event.setEventId(UUID.randomUUID().toString());
        log.info("Publishing notification-events: {}", event);
        kafkaTemplate.send("notification-events", event.getEventId(), event);
    }

    public void sendReviewCreated(ReviewEvent event) {
        if (event.getEventId() == null) event.setEventId(UUID.randomUUID().toString());
        log.info("Publishing review-created event: {}", event);
        kafkaTemplate.send("review-created", event.getEventId(), event);
    }

    public void sendHotelInteraction(HotelInteractionEvent event) {
        if (event.getEventId() == null) event.setEventId(UUID.randomUUID().toString());
        log.info("Publishing hotel-interactions event: {}", event);
        kafkaTemplate.send("hotel-interactions", event.getEventId(), event);
    }
}
