package com.codingshuttle.projects.airBnbApp.service;

import com.codingshuttle.projects.airBnbApp.document.HotelDocument;
import com.codingshuttle.projects.airBnbApp.entity.Hotel;
import com.codingshuttle.projects.airBnbApp.repository.HotelRepository;
import com.codingshuttle.projects.airBnbApp.repository.elastic.HotelElasticRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

import org.springframework.context.annotation.Lazy;

@Service
@Slf4j
public class ElasticsearchIndexer {

    private final HotelRepository hotelRepository;
    private final HotelElasticRepository hotelElasticRepository;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    public ElasticsearchIndexer(HotelRepository hotelRepository, @Lazy HotelElasticRepository hotelElasticRepository) {
        this.hotelRepository = hotelRepository;
        this.hotelElasticRepository = hotelElasticRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void indexAllHotelsOnStartup() {
        executor.submit(() -> {
            log.info("Elasticsearch Startup Indexer: Starting index synchronization...");
            try {
                // Clear any existing indexed docs
                hotelElasticRepository.deleteAll();

                List<Hotel> databaseHotels = hotelRepository.findAll();
                List<HotelDocument> documents = databaseHotels.stream()
                        .map(this::mapToDocument)
                        .collect(Collectors.toList());

                hotelElasticRepository.saveAll(documents);
                log.info("Elasticsearch Startup Indexer: Successfully synchronized {} hotels.", documents.size());
            } catch (Exception e) {
                log.warn("Elasticsearch is offline or unreachable. Startup indexing skipped. Error: {}", e.getMessage());
            }
        });
    }

    public void indexHotel(Hotel hotel) {
        try {
            HotelDocument doc = mapToDocument(hotel);
            hotelElasticRepository.save(doc);
            log.info("Indexed hotel '{}' to Elasticsearch successfully.", hotel.getName());
        } catch (Exception e) {
            log.warn("Failed to index hotel to Elasticsearch: {}", e.getMessage());
        }
    }

    public void deleteHotelFromIndex(Long hotelId) {
        try {
            hotelElasticRepository.deleteById(String.valueOf(hotelId));
            log.info("Deleted hotel ID {} from Elasticsearch index.", hotelId);
        } catch (Exception e) {
            log.warn("Failed to delete hotel from Elasticsearch: {}", e.getMessage());
        }
    }

    private HotelDocument mapToDocument(Hotel hotel) {
        List<String> amenitiesList = hotel.getAmenities() != null
                ? Arrays.asList(hotel.getAmenities())
                : List.of();

        return HotelDocument.builder()
                .id(String.valueOf(hotel.getId()))
                .name(hotel.getName())
                .city(hotel.getCity())
                .state(hotel.getState())
                .address(hotel.getContactInfo() != null ? hotel.getContactInfo().getAddress() : "")
                .amenities(amenitiesList)
                .rating(hotel.getRating() != null ? hotel.getRating() : 0.0)
                .latitude(hotel.getLatitude())
                .longitude(hotel.getLongitude())
                .active(Boolean.TRUE.equals(hotel.getActive()))
                .build();
    }
}
