package com.codingshuttle.projects.airBnbApp.controller;

import com.codingshuttle.projects.airBnbApp.dto.HotelDto;
import com.codingshuttle.projects.airBnbApp.entity.User;
import com.codingshuttle.projects.airBnbApp.service.RecommendationService;
import com.codingshuttle.projects.airBnbApp.util.AppUtils;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/hotels")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/recommendations")
    @Operation(summary = "Get fallback AI recommendations by state", tags = {"Recommendations"})
    public ResponseEntity<List<HotelDto>> getAIRecommendations(@RequestParam(required = false, defaultValue = "Delhi") String state) {
        return ResponseEntity.ok(recommendationService.getAIRecommendations(state));
    }

    @GetMapping("/recommendations/personalized")
    @Operation(summary = "Get personalized hotel recommendations based on user history", tags = {"Recommendations"})
    public ResponseEntity<List<HotelDto>> getPersonalizedRecommendations() {
        User currentUser = AppUtils.getCurrentUser();
        return ResponseEntity.ok(recommendationService.getPersonalizedRecommendations(currentUser));
    }

    @GetMapping("/recommendations/trending")
    @Operation(summary = "Get trending hotels (most booked and highly rated)", tags = {"Recommendations"})
    public ResponseEntity<List<HotelDto>> getTrendingRecommendations() {
        return ResponseEntity.ok(recommendationService.getTrendingHotels());
    }

    @GetMapping("/recommendations/similar/{hotelId}")
    @Operation(summary = "Get similar hotels in same city and price range", tags = {"Recommendations"})
    public ResponseEntity<List<HotelDto>> getSimilarRecommendations(@PathVariable Long hotelId) {
        return ResponseEntity.ok(recommendationService.getSimilarRecommendations(hotelId));
    }
}
