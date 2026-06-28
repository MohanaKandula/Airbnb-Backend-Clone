package com.codingshuttle.projects.airBnbApp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HostAnalyticsDto {
    private double occupancyRate;      // Percentage of rooms booked
    private BigDecimal totalRevenue;   // Sum of confirmed revenues
    private long totalBookings;        // Total bookings count
    private long confirmedBookings;    // Confirmed bookings count
    private long pendingBookings;      // Unpaid bookings count
    private Map<String, BigDecimal> monthlyRevenue; // Month -> Revenue breakdown
}
