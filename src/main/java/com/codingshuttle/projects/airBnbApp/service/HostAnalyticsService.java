package com.codingshuttle.projects.airBnbApp.service;

import com.codingshuttle.projects.airBnbApp.dto.HostAnalyticsDto;
import com.codingshuttle.projects.airBnbApp.entity.Booking;
import com.codingshuttle.projects.airBnbApp.entity.Hotel;
import com.codingshuttle.projects.airBnbApp.entity.Inventory;
import com.codingshuttle.projects.airBnbApp.entity.enums.BookingStatus;
import com.codingshuttle.projects.airBnbApp.repository.BookingRepository;
import com.codingshuttle.projects.airBnbApp.repository.HotelRepository;
import com.codingshuttle.projects.airBnbApp.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class HostAnalyticsService {

    private final HotelRepository hotelRepository;
    private final BookingRepository bookingRepository;
    private final InventoryRepository inventoryRepository;

    // Helper map to record real-time revenue events from Kafka consumer
    private final Map<Long, BigDecimal> kafkaRecordedRevenue = new HashMap<>();

    public void recordRevenueEvent(Long hostId, BigDecimal amount) {
        kafkaRecordedRevenue.put(hostId, kafkaRecordedRevenue.getOrDefault(hostId, BigDecimal.ZERO).add(amount));
        log.info("Recorded real-time Kafka revenue update for Host {}: +₹{}", hostId, amount);
    }

    public HostAnalyticsDto getHostAnalytics(Long hostId) {
        log.info("Compiling dashboard analytics for Host ID: {}", hostId);

        List<Hotel> hostHotels = hotelRepository.findByOwnerId(hostId);
        if (hostHotels.isEmpty()) {
            return HostAnalyticsDto.builder()
                    .occupancyRate(0.0)
                    .totalRevenue(BigDecimal.ZERO)
                    .totalBookings(0)
                    .confirmedBookings(0)
                    .pendingBookings(0)
                    .monthlyRevenue(new HashMap<>())
                    .build();
        }

        BigDecimal dbRevenue = BigDecimal.ZERO;
        long totalBookings = 0;
        long confirmedBookings = 0;
        long pendingBookings = 0;
        Map<String, BigDecimal> monthlyRevenue = new HashMap<>();

        // Aggregate across all hotels owned by host
        for (Hotel hotel : hostHotels) {
            List<Booking> bookings = bookingRepository.findByHotel(hotel);
            totalBookings += bookings.size();

            for (Booking booking : bookings) {
                if (booking.getBookingStatus() == BookingStatus.CONFIRMED) {
                    confirmedBookings++;
                    dbRevenue = dbRevenue.add(booking.getAmount());

                    // Parse month
                    String month = booking.getCheckInDate()
                            .getMonth()
                            .getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
                    monthlyRevenue.put(month, monthlyRevenue.getOrDefault(month, BigDecimal.ZERO).add(booking.getAmount()));
                } else if (booking.getBookingStatus() == BookingStatus.RESERVED || booking.getBookingStatus() == BookingStatus.PAYMENTS_PENDING) {
                    pendingBookings++;
                }
            }
        }

        // Add real-time Kafka-recorded changes (just to demonstrate real-time event updates)
        BigDecimal totalRevenue = dbRevenue.add(kafkaRecordedRevenue.getOrDefault(hostId, BigDecimal.ZERO));

        // Calculate occupancy rate (average occupancy of all active inventories in current range)
        LocalDate today = LocalDate.now();
        LocalDate nextWeek = today.plusDays(7);
        double totalOccupancySum = 0.0;
        long inventoryRecordCount = 0;

        for (Hotel hotel : hostHotels) {
            List<Inventory> inventories = inventoryRepository.findByHotelAndDateBetween(hotel, today, nextWeek);
            for (Inventory inv : inventories) {
                if (inv.getTotalCount() > 0) {
                    totalOccupancySum += (double) inv.getBookedCount() / inv.getTotalCount();
                    inventoryRecordCount++;
                }
            }
        }

        double occupancyRate = inventoryRecordCount == 0 ? 0.0 : (totalOccupancySum / inventoryRecordCount) * 100.0;

        // Rounded values
        occupancyRate = Math.round(occupancyRate * 100.0) / 100.0;

        return HostAnalyticsDto.builder()
                .occupancyRate(occupancyRate)
                .totalRevenue(totalRevenue)
                .totalBookings(totalBookings)
                .confirmedBookings(confirmedBookings)
                .pendingBookings(pendingBookings)
                .monthlyRevenue(monthlyRevenue)
                .build();
    }
}
