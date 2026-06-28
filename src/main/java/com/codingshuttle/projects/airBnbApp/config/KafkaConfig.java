package com.codingshuttle.projects.airBnbApp.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class KafkaConfig {

    // Topics definition
    @Bean
    public NewTopic bookingCreatedTopic() {
        return TopicBuilder.name("booking-created").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic bookingCreatedDlq() {
        return TopicBuilder.name("booking-created.DLQ").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic bookingCancelledTopic() {
        return TopicBuilder.name("booking-cancelled").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic bookingCancelledDlq() {
        return TopicBuilder.name("booking-cancelled.DLQ").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic paymentSuccessTopic() {
        return TopicBuilder.name("payment-success").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic paymentSuccessDlq() {
        return TopicBuilder.name("payment-success.DLQ").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic paymentFailedTopic() {
        return TopicBuilder.name("payment-failed").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic paymentFailedDlq() {
        return TopicBuilder.name("payment-failed.DLQ").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic hotelCreatedTopic() {
        return TopicBuilder.name("hotel-created").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic hotelCreatedDlq() {
        return TopicBuilder.name("hotel-created.DLQ").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic hotelApprovedTopic() {
        return TopicBuilder.name("hotel-approved").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic hotelApprovedDlq() {
        return TopicBuilder.name("hotel-approved.DLQ").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic notificationEventsTopic() {
        return TopicBuilder.name("notification-events").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic notificationEventsDlq() {
        return TopicBuilder.name("notification-events.DLQ").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic reviewCreatedTopic() {
        return TopicBuilder.name("review-created").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic reviewCreatedDlq() {
        return TopicBuilder.name("review-created.DLQ").partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic hotelInteractionsTopic() {
        return TopicBuilder.name("hotel-interactions").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic hotelInteractionsDlq() {
        return TopicBuilder.name("hotel-interactions.DLQ").partitions(1).replicas(1).build();
    }

    // Default Error Handler with 3 retries and Dead Letter Queue (DLQ) recovery
    @Bean
    public CommonErrorHandler kafkaErrorHandler(KafkaTemplate<Object, Object> template) {
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(template);
        // Retry 3 times with a 2-second fixed backoff delay
        return new DefaultErrorHandler(recoverer, new FixedBackOff(2000L, 3));
    }
}
