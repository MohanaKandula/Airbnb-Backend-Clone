package com.codingshuttle.projects.airBnbApp.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class NotificationService {

    @Autowired
    private JavaMailSender mailSender;

    // Map of userEmail -> SseEmitter for real-time SSE notifications
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String email) {
        // Set timeout to 1 hour
        SseEmitter emitter = new SseEmitter(3600000L);
        
        emitters.put(email, emitter);
        log.info("Client subscribed for SSE notifications: {}", email);

        emitter.onCompletion(() -> {
            log.info("SSE emitter completed for: {}", email);
            emitters.remove(email);
        });

        emitter.onTimeout(() -> {
            log.info("SSE emitter timed out for: {}", email);
            emitters.remove(email);
        });

        emitter.onError((e) -> {
            log.warn("SSE emitter error for: {}, removing connection.", email);
            emitters.remove(email);
        });

        // Send initial heartbeat connection event
        try {
            emitter.send(SseEmitter.event()
                    .name("INIT")
                    .data("Connected to real-time notification service"));
        } catch (IOException e) {
            emitters.remove(email);
        }

        return emitter;
    }

    public void sendLiveNotification(String userEmail, String title, String body) {
        log.info("Sending notification event [To: {}, Title: '{}', Body: '{}']", userEmail, title, body);
        
        SseEmitter emitter = emitters.get(userEmail);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("NOTIFICATION")
                        .data(Map.of(
                                "title", title,
                                "body", body,
                                "timestamp", System.currentTimeMillis()
                        )));
                log.info("Real-time notification delivered successfully to {}", userEmail);
            } catch (IOException e) {
                log.warn("Failed to deliver real-time SSE notification, connection closed.");
                emitters.remove(userEmail);
            }
        } else {
            log.info("No active SSE subscription found for {}, logged notification to system.", userEmail);
        }

        // Asynchronously send Gmail notification
        CompletableFuture.runAsync(() -> {
            try {
                log.info("Attempting to send email notification to {}", userEmail);
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(userEmail);
                message.setSubject(title);
                message.setText(body);
                mailSender.send(message);
                log.info("Email notification sent successfully to {}", userEmail);
            } catch (Exception e) {
                log.error("Failed to send email notification to {}: {}", userEmail, e.getMessage());
            }
        });
    }
}
