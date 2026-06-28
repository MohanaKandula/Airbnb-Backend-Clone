package com.codingshuttle.projects.airBnbApp.repository;

import com.codingshuttle.projects.airBnbApp.entity.Booking;
import com.codingshuttle.projects.airBnbApp.entity.Hotel;
import com.codingshuttle.projects.airBnbApp.entity.User;
import com.codingshuttle.projects.airBnbApp.entity.enums.BookingStatus;
import com.codingshuttle.projects.airBnbApp.entity.enums.PayoutStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByPaymentSessionId(String sessionId);

    List<Booking> findByHotel(Hotel hotel);

    List<Booking> findByHotelAndCreatedAtBetween(Hotel hotel, LocalDateTime startDateTime, LocalDateTime endDateTime);

    List<Booking> findByUser(User user);

    List<Booking> findByBookingStatusAndPayoutStatusAndCheckInDateLessThanEqual(
            BookingStatus bookingStatus, PayoutStatus payoutStatus, LocalDate checkInDate
    );

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM payment WHERE booking_id = :bookingId", nativeQuery = true)
    void deletePaymentsByBookingId(@org.springframework.data.repository.query.Param("bookingId") Long bookingId);

    @org.springframework.data.jpa.repository.Query("SELECT AVG(b.rating) FROM Booking b WHERE b.hotel.id = :hotelId AND b.rating IS NOT NULL")
    Double findAverageRatingForHotel(@org.springframework.data.repository.query.Param("hotelId") Long hotelId);
}

