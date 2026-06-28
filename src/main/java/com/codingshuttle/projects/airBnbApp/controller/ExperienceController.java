package com.codingshuttle.projects.airBnbApp.controller;

import com.codingshuttle.projects.airBnbApp.dto.*;
import com.codingshuttle.projects.airBnbApp.entity.enums.BookingStatus;
import com.codingshuttle.projects.airBnbApp.service.ExperienceService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/experiences")
public class ExperienceController {

    private final ExperienceService experienceService;

    @GetMapping
    @Operation(summary = "Get all experiences", tags = {"Experiences"})
    public ResponseEntity<List<ExperienceDto>> getAllExperiences(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Boolean isOnline) {
        return ResponseEntity.ok(experienceService.getAllExperiences(city, isOnline));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get experience by ID", tags = {"Experiences"})
    public ResponseEntity<ExperienceDto> getExperienceById(@PathVariable Long id) {
        return ResponseEntity.ok(experienceService.getExperienceById(id));
    }

    @PostMapping("/bookings")
    @Operation(summary = "Initialise an experience booking", tags = {"Experiences Booking"})
    public ResponseEntity<ExperienceBookingDto> initialiseExperienceBooking(
            @RequestBody ExperienceBookingRequest request) {
        return ResponseEntity.ok(experienceService.initialiseExperienceBooking(request));
    }

    @PostMapping("/bookings/{bookingId}/payments")
    @Operation(summary = "Initiate payments for an experience booking", tags = {"Experiences Booking"})
    public ResponseEntity<BookingPaymentInitResponseDto> initiatePayment(
            @PathVariable Long bookingId,
            @RequestParam String successUrl,
            @RequestParam String failureUrl) {
        String sessionUrl = experienceService.initiateExperiencePayment(bookingId, successUrl, failureUrl);
        return ResponseEntity.ok(new BookingPaymentInitResponseDto(sessionUrl));
    }

    @GetMapping("/bookings/my-bookings")
    @Operation(summary = "Get current user's experience bookings", tags = {"Experiences Booking"})
    public ResponseEntity<List<ExperienceBookingDto>> getMyExperienceBookings() {
        return ResponseEntity.ok(experienceService.getMyExperienceBookings());
    }

    @PostMapping("/bookings/{bookingId}/cancel")
    @Operation(summary = "Cancel an experience booking", tags = {"Experiences Booking"})
    public ResponseEntity<Void> cancelExperienceBooking(@PathVariable Long bookingId) {
        experienceService.cancelExperienceBooking(bookingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/bookings/{bookingId}/status")
    @Operation(summary = "Get experience booking status", tags = {"Experiences Booking"})
    public ResponseEntity<BookingStatusResponseDto> getExperienceBookingStatus(@PathVariable Long bookingId) {
        BookingStatus status = experienceService.getExperienceBookingStatus(bookingId);
        return ResponseEntity.ok(new BookingStatusResponseDto(status));
    }

    @GetMapping("/bookings/{bookingId}")
    @Operation(summary = "Get details of an experience booking", tags = {"Experiences Booking"})
    public ResponseEntity<ExperienceBookingDto> getExperienceBookingDetails(@PathVariable Long bookingId) {
        return ResponseEntity.ok(experienceService.getExperienceBookingDetails(bookingId));
    }
}
