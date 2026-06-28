package com.codingshuttle.projects.airBnbApp.dto;

import com.codingshuttle.projects.airBnbApp.entity.enums.BookingStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ExperienceBookingDto {
    private Long id;
    private ExperienceDto experience;
    private UserDto user;
    private LocalDate bookingDate;
    private Integer guestsCount;
    private BigDecimal amount;
    private BookingStatus bookingStatus;
    private String paymentSessionId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
