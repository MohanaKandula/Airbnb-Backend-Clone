package com.codingshuttle.projects.airBnbApp.service;

import com.codingshuttle.projects.airBnbApp.dto.ExperienceDto;
import com.codingshuttle.projects.airBnbApp.dto.ExperienceBookingDto;
import com.codingshuttle.projects.airBnbApp.dto.ExperienceBookingRequest;
import com.codingshuttle.projects.airBnbApp.entity.enums.BookingStatus;

import java.util.List;

public interface ExperienceService {

    List<ExperienceDto> getAllExperiences(String city, Boolean isOnline);

    ExperienceDto getExperienceById(Long id);

    ExperienceBookingDto initialiseExperienceBooking(ExperienceBookingRequest request);

    String initiateExperiencePayment(Long bookingId, String successUrl, String failureUrl);

    List<ExperienceBookingDto> getMyExperienceBookings();

    void cancelExperienceBooking(Long bookingId);

    BookingStatus getExperienceBookingStatus(Long bookingId);

    ExperienceBookingDto getExperienceBookingDetails(Long bookingId);
}
