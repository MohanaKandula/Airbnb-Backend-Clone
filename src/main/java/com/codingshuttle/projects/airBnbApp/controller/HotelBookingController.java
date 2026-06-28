package com.codingshuttle.projects.airBnbApp.controller;

import com.codingshuttle.projects.airBnbApp.dto.*;
import com.codingshuttle.projects.airBnbApp.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/bookings")
public class HotelBookingController {

    private final BookingService bookingService;

    @PostMapping("/init")
    @Operation(summary = "Initiate the booking", tags = {"Booking Flow"})
    public ResponseEntity<BookingDto> initialiseBooking(@RequestBody BookingRequest bookingRequest) {
        return ResponseEntity.ok(bookingService.initialiseBooking(bookingRequest));
    }

    @PostMapping("/{bookingId}/addGuests")
    @Operation(summary = "Add guest Ids to the booking", tags = {"Booking Flow"})
    public ResponseEntity<BookingDto> addGuests(@PathVariable Long bookingId,
                                                @RequestBody List<Long> guestIdList) {
        return ResponseEntity.ok(bookingService.addGuests(bookingId, guestIdList));
    }

    @PostMapping("/{bookingId}/payments")
    @Operation(summary = "Initiate payments flow for the booking", tags = {"Booking Flow"})
    public ResponseEntity<BookingPaymentInitResponseDto> initiatePayment(@PathVariable Long bookingId) {
        String sessionUrl = bookingService.initiatePayments(bookingId);
        return ResponseEntity.ok(new BookingPaymentInitResponseDto(sessionUrl));
    }

    @PostMapping("/{bookingId}/cancel")
    @Operation(summary = "Cancel the booking", tags = {"Booking Flow"})
    public ResponseEntity<Void> cancelBooking(@PathVariable Long bookingId) {
        bookingService.cancelBooking(bookingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{bookingId}/status")
    @Operation(summary = "Check the status of the booking", tags = {"Booking Flow"})
    public ResponseEntity<BookingStatusResponseDto> getBookingStatus(@PathVariable Long bookingId) {
        return ResponseEntity.ok(new BookingStatusResponseDto(bookingService.getBookingStatus(bookingId)));
    }

    @GetMapping("/{bookingId}")
    @Operation(summary = "Get the details of the booking", tags = {"Booking Flow"})
    public ResponseEntity<BookingDto> getBookingDetails(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.getBookingDetails(bookingId));
    }

    @PostMapping("/{bookingId}/rate")
    @Operation(summary = "Rate a stay / hotel from a booking", tags = {"Booking Flow"})
    public ResponseEntity<BookingDto> rateBooking(@PathVariable Long bookingId,
                                                  @RequestBody java.util.Map<String, Integer> ratingMap) {
        Integer rating = ratingMap.get("rating");
        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5.");
        }
        return ResponseEntity.ok(bookingService.rateBooking(bookingId, rating));
    }

    @PostMapping("/{bookingId}/cash")
    @Operation(summary = "Select cash payment method at property", tags = {"Booking Flow"})
    public ResponseEntity<BookingDto> selectCashPaymentMethod(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.selectCashPaymentMethod(bookingId));
    }

    @PostMapping("/{bookingId}/confirm-cash")
    @Operation(summary = "Host manager confirms physical cash payment", tags = {"Booking Flow"})
    public ResponseEntity<BookingDto> confirmCashPayment(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.confirmCashPayment(bookingId));
    }

    @GetMapping("/has-active-cash")
    @Operation(summary = "Check if user has an active pending cash booking", tags = {"Booking Flow"})
    public ResponseEntity<Boolean> hasActiveCashBooking() {
        return ResponseEntity.ok(bookingService.hasActiveCashBooking(com.codingshuttle.projects.airBnbApp.util.AppUtils.getCurrentUser().getId()));
    }
}

