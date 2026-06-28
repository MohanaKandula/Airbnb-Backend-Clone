package com.codingshuttle.projects.airBnbApp.repository;

import com.codingshuttle.projects.airBnbApp.entity.Experience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExperienceRepository extends JpaRepository<Experience, Long> {
    List<Experience> findByLocationIgnoreCaseAndIsOnline(String location, Boolean isOnline);
    List<Experience> findByIsOnline(Boolean isOnline);
}
