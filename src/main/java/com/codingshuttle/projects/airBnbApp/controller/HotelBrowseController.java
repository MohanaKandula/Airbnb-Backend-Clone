package com.codingshuttle.projects.airBnbApp.controller;

import com.codingshuttle.projects.airBnbApp.dto.*;
import com.codingshuttle.projects.airBnbApp.dto.events.HotelInteractionEvent;
import com.codingshuttle.projects.airBnbApp.entity.User;
import com.codingshuttle.projects.airBnbApp.service.HotelService;
import com.codingshuttle.projects.airBnbApp.service.InventoryService;
import com.codingshuttle.projects.airBnbApp.service.KafkaProducerService;
import com.codingshuttle.projects.airBnbApp.service.RecommendationService;
import com.codingshuttle.projects.airBnbApp.util.AppUtils;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/hotels")
@RequiredArgsConstructor
@Slf4j
public class HotelBrowseController {

    private final InventoryService inventoryService;
    private final HotelService hotelService;
    private final KafkaProducerService kafkaProducerService;
    private final RecommendationService recommendationService;

    @GetMapping("/search")
    @Operation(summary = "Search hotels", tags = {"Browse Hotels"})
    public ResponseEntity<Page<HotelPriceResponseDto>> searchHotels(HotelSearchRequest hotelSearchRequest) {

        var page = inventoryService.searchHotels(hotelSearchRequest);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{hotelId}/info")
    @Operation(summary = "Get a hotel info by hotelId", tags = {"Browse Hotels"})
    public ResponseEntity<HotelInfoDto> getHotelInfo(@PathVariable Long hotelId, HotelInfoRequestDto hotelInfoRequestDto) {
        User currentUser = AppUtils.getCurrentUser();
        if (currentUser != null) {
            HotelInteractionEvent event = HotelInteractionEvent.builder()
                    .userId(currentUser.getId())
                    .hotelId(hotelId)
                    .actionType("VIEW")
                    .timestamp(LocalDateTime.now())
                    .build();
            try {
                kafkaProducerService.sendHotelInteraction(event);
            } catch (Exception e) {
                log.warn("Kafka offline, saving VIEW interaction directly for user: {}, hotel: {}", currentUser.getId(), hotelId);
                recommendationService.saveUserActivityDirectly(currentUser.getId(), hotelId, "VIEW");
            }
        }
        return ResponseEntity.ok(hotelService.getHotelInfoById(hotelId, hotelInfoRequestDto));
    }

}
