package com.codingshuttle.projects.airBnbApp.dto.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent {
    private String eventId;
    private String recipientEmail;
    private String subject;
    private String body;
    private String type;
}
