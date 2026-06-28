package com.codingshuttle.projects.airBnbApp.repository;

import com.codingshuttle.projects.airBnbApp.entity.UserActivity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
    List<UserActivity> findByUserIdOrderByTimestampDesc(Long userId, Pageable pageable);
    long countByHotelId(Long hotelId);
}
