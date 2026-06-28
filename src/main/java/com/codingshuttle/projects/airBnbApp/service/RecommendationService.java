package com.codingshuttle.projects.airBnbApp.service;

import com.codingshuttle.projects.airBnbApp.dto.HotelDto;
import com.codingshuttle.projects.airBnbApp.entity.Hotel;
import com.codingshuttle.projects.airBnbApp.entity.User;
import com.codingshuttle.projects.airBnbApp.entity.UserActivity;
import com.codingshuttle.projects.airBnbApp.dto.events.HotelInteractionEvent;
import com.codingshuttle.projects.airBnbApp.repository.HotelRepository;
import com.codingshuttle.projects.airBnbApp.repository.UserActivityRepository;
import com.codingshuttle.projects.airBnbApp.repository.UserRepository;
import com.codingshuttle.projects.airBnbApp.repository.elastic.HotelElasticRepository;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class RecommendationService {

    private final HotelRepository hotelRepository;
    private final HotelElasticRepository hotelElasticRepository;
    private final ModelMapper modelMapper;
    private final UserActivityRepository userActivityRepository;
    private final UserRepository userRepository;

    public RecommendationService(HotelRepository hotelRepository, 
                                 @Lazy HotelElasticRepository hotelElasticRepository, 
                                 ModelMapper modelMapper,
                                 UserActivityRepository userActivityRepository,
                                 UserRepository userRepository) {
        this.hotelRepository = hotelRepository;
        this.hotelElasticRepository = hotelElasticRepository;
        this.modelMapper = modelMapper;
        this.userActivityRepository = userActivityRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void saveUserActivity(HotelInteractionEvent event) {
        User user = userRepository.findById(event.getUserId()).orElse(null);
        Hotel hotel = hotelRepository.findById(event.getHotelId()).orElse(null);
        if (user != null && hotel != null) {
            UserActivity activity = UserActivity.builder()
                    .user(user)
                    .hotel(hotel)
                    .actionType(event.getActionType())
                    .timestamp(event.getTimestamp() != null ? event.getTimestamp() : LocalDateTime.now())
                    .build();
            userActivityRepository.save(activity);
            log.info("Saved user interaction event in DB: User {} -> Hotel {} ({})", user.getEmail(), hotel.getName(), event.getActionType());
        }
    }

    @Transactional
    public void saveUserActivityDirectly(Long userId, Long hotelId, String actionType) {
        User user = userRepository.findById(userId).orElse(null);
        Hotel hotel = hotelRepository.findById(hotelId).orElse(null);
        if (user != null && hotel != null) {
            UserActivity activity = UserActivity.builder()
                    .user(user)
                    .hotel(hotel)
                    .actionType(actionType)
                    .timestamp(LocalDateTime.now())
                    .build();
            userActivityRepository.save(activity);
            log.info("Saved user interaction directly in DB: User {} -> Hotel {} ({})", user.getEmail(), hotel.getName(), actionType);
        }
    }

    public List<HotelDto> getPersonalizedRecommendations(User user) {
        if (user == null) {
            log.info("Anonymous user requested recommendations, returning trending stays.");
            return getTrendingHotels();
        }

        List<UserActivity> activities = userActivityRepository.findByUserIdOrderByTimestampDesc(user.getId(), PageRequest.of(0, 20));
        if (activities.isEmpty()) {
            log.info("No activity history for user {}, returning trending stays.", user.getEmail());
            return getTrendingHotels();
        }

        log.info("Computing personalized recommendations for user {} based on recent activities", user.getEmail());

        // 1. Compile state preferences and average price range
        Map<String, Double> stateWeights = new HashMap<>();
        double totalPriceSum = 0;
        int hotelPriceCount = 0;

        for (UserActivity act : activities) {
            Hotel hotel = act.getHotel();
            if (hotel == null) continue;

            double weight = 1.0;
            if ("BOOK".equalsIgnoreCase(act.getActionType())) {
                weight = 10.0;
            } else if ("WISHLIST".equalsIgnoreCase(act.getActionType())) {
                weight = 3.0;
            }

            if (hotel.getState() != null) {
                String state = hotel.getState().toLowerCase();
                stateWeights.put(state, stateWeights.getOrDefault(state, 0.0) + weight);
            }

            double basePrice = hotel.getRooms() != null && !hotel.getRooms().isEmpty()
                    ? hotel.getRooms().stream().map(r -> r.getBasePrice().doubleValue()).min(Double::compare).orElse(2500.0)
                    : 2500.0;

            totalPriceSum += basePrice;
            hotelPriceCount++;
        }

        final double avgPreferredPrice = hotelPriceCount > 0 ? (totalPriceSum / hotelPriceCount) : 2500.0;

        // 2. Score all active hotels
        List<Hotel> activeHotels = hotelRepository.findAll().stream()
                .filter(hotel -> Boolean.TRUE.equals(hotel.getActive()))
                .collect(Collectors.toList());

        class ScoredHotel {
            final Hotel hotel;
            final double score;

            ScoredHotel(Hotel hotel, double score) {
                this.hotel = hotel;
                this.score = score;
            }
        }

        List<ScoredHotel> scoredList = new ArrayList<>();

        for (Hotel hotel : activeHotels) {
            double score = 0;

            // Metric 1: Rating score (max 30 points)
            double rating = hotel.getRating() != null ? hotel.getRating() : 3.0;
            score += rating * 6.0;

            // Metric 2: Preferred Location/State Match (max 30 points)
            if (hotel.getState() != null) {
                String hotelState = hotel.getState().toLowerCase();
                double statePrefWeight = stateWeights.getOrDefault(hotelState, 0.0);
                score += Math.min(statePrefWeight * 3.0, 30.0);
            }

            // Metric 3: Price Proximity Match (max 20 points)
            double hotelPrice = hotel.getRooms() != null && !hotel.getRooms().isEmpty()
                    ? hotel.getRooms().stream().map(r -> r.getBasePrice().doubleValue()).min(Double::compare).orElse(2500.0)
                    : 2500.0;
            double priceDiffPct = Math.abs(hotelPrice - avgPreferredPrice) / avgPreferredPrice;
            if (priceDiffPct <= 0.20) {
                score += 20.0;
            } else if (priceDiffPct <= 0.50) {
                score += 10.0;
            } else if (priceDiffPct <= 1.0) {
                score += 5.0;
            }

            // Metric 4: General Popularity Match (max 20 points)
            long interactionCount = userActivityRepository.countByHotelId(hotel.getId());
            score += Math.min(interactionCount * 2.0, 20.0);

            scoredList.add(new ScoredHotel(hotel, score));
        }

        // 3. Sort by highest score and limit to 6
        return scoredList.stream()
                .sorted((a, b) -> Double.compare(b.score, a.score))
                .limit(6)
                .map(sh -> modelMapper.map(sh.hotel, HotelDto.class))
                .collect(Collectors.toList());
    }

    public List<HotelDto> getTrendingHotels() {
        List<Hotel> databaseHotels = hotelRepository.findAll();
        return databaseHotels.stream()
                .filter(hotel -> Boolean.TRUE.equals(hotel.getActive()))
                .sorted((a, b) -> {
                    double rA = a.getRating() != null ? a.getRating() : 3.0;
                    double rB = b.getRating() != null ? b.getRating() : 3.0;
                    if (Double.compare(rB, rA) != 0) {
                        return Double.compare(rB, rA);
                    }

                    long countA = userActivityRepository.countByHotelId(a.getId());
                    long countB = userActivityRepository.countByHotelId(b.getId());
                    return Long.compare(countB, countA);
                })
                .limit(6)
                .map(hotel -> modelMapper.map(hotel, HotelDto.class))
                .collect(Collectors.toList());
    }

    public List<HotelDto> getSimilarRecommendations(Long hotelId) {
        Hotel currentHotel = hotelRepository.findById(hotelId).orElse(null);
        if (currentHotel == null) return Collections.emptyList();

        double currentPrice = currentHotel.getRooms() != null && !currentHotel.getRooms().isEmpty()
                ? currentHotel.getRooms().stream().map(r -> r.getBasePrice().doubleValue()).min(Double::compare).orElse(2500.0)
                : 2500.0;

        List<Hotel> allHotels = hotelRepository.findAll();
        return allHotels.stream()
                .filter(hotel -> Boolean.TRUE.equals(hotel.getActive()))
                .filter(hotel -> !hotel.getId().equals(hotelId))
                .filter(hotel -> currentHotel.getCity() != null && currentHotel.getCity().equalsIgnoreCase(hotel.getCity()))
                .sorted((a, b) -> {
                    double priceA = a.getRooms() != null && !a.getRooms().isEmpty()
                            ? a.getRooms().stream().map(r -> r.getBasePrice().doubleValue()).min(Double::compare).orElse(2500.0)
                            : 2500.0;
                    double priceB = b.getRooms() != null && !b.getRooms().isEmpty()
                            ? b.getRooms().stream().map(r -> r.getBasePrice().doubleValue()).min(Double::compare).orElse(2500.0)
                            : 2500.0;

                    double diffA = Math.abs(priceA - currentPrice);
                    double diffB = Math.abs(priceB - currentPrice);

                    if (Double.compare(diffA, diffB) != 0) {
                        return Double.compare(diffA, diffB);
                    }

                    double rA = a.getRating() != null ? a.getRating() : 3.0;
                    double rB = b.getRating() != null ? b.getRating() : 3.0;
                    return Double.compare(rB, rA);
                })
                .limit(4)
                .map(hotel -> modelMapper.map(hotel, HotelDto.class))
                .collect(Collectors.toList());
    }

    // Keep compatibility for existing AI recommendations (if any other part of code depends on it)
    public List<HotelDto> getAIRecommendations(String preferedState) {
        log.info("Computing AI recommendations for state preference: {}", preferedState);
        try {
            var esDocs = hotelElasticRepository.findByStateIgnoreCase(preferedState);
            if (!esDocs.isEmpty()) {
                return esDocs.stream()
                        .filter(doc -> doc.isActive())
                        .sorted((a, b) -> Double.compare(b.getRating(), a.getRating()))
                        .limit(5)
                        .map(doc -> {
                            HotelDto dto = new HotelDto();
                            dto.setId(Long.valueOf(doc.getId()));
                            dto.setName(doc.getName());
                            dto.setCity(doc.getCity());
                            dto.setState(doc.getState());
                            dto.setRating(doc.getRating());
                            dto.setAmenities(doc.getAmenities().toArray(new String[0]));
                            dto.setActive(doc.isActive());
                            return dto;
                        })
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.warn("Elasticsearch offline, falling back to DB for AI recommendations.");
        }

        List<Hotel> databaseHotels = hotelRepository.findAll();
        return databaseHotels.stream()
                .filter(hotel -> Boolean.TRUE.equals(hotel.getActive()))
                .filter(hotel -> preferedState == null || preferedState.equalsIgnoreCase(hotel.getState()))
                .sorted((a, b) -> {
                    double rA = a.getRating() != null ? a.getRating() : 0.0;
                    double rB = b.getRating() != null ? b.getRating() : 0.0;
                    return Double.compare(rB, rA);
                })
                .limit(5)
                .map(hotel -> modelMapper.map(hotel, HotelDto.class))
                .collect(Collectors.toList());
    }
}
