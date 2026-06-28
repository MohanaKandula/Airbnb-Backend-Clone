package com.codingshuttle.projects.airBnbApp.repository;

import com.codingshuttle.projects.airBnbApp.entity.ExperienceBooking;
import com.codingshuttle.projects.airBnbApp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExperienceBookingRepository extends JpaRepository<ExperienceBooking, Long> {
    List<ExperienceBooking> findByUserOrderByCreatedAtDesc(User user);
    Optional<ExperienceBooking> findByPaymentSessionId(String paymentSessionId);
}
