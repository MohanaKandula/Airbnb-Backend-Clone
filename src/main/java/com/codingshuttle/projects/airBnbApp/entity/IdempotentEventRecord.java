package com.codingshuttle.projects.airBnbApp.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "idempotent_event_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IdempotentEventRecord {

    @Id
    private String eventId;

    private String consumerName;

    private LocalDateTime processedAt;
}
