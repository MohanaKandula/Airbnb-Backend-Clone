package com.codingshuttle.projects.airBnbApp.dto.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingEvent {
    private String eventId;
    private Long bookingId;
    private String guestEmail;
    private Long hotelId;
    private Long roomId;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private BigDecimal amount;
    private String status;
}
