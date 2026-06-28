package com.codingshuttle.projects.airBnbApp.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ExperienceBookingRequest {
    private Long experienceId;
    private LocalDate bookingDate;
    private Integer guestsCount;
}
