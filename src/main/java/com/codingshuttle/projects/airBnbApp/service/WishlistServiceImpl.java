package com.codingshuttle.projects.airBnbApp.service;

import com.codingshuttle.projects.airBnbApp.dto.HotelDto;
import com.codingshuttle.projects.airBnbApp.entity.Hotel;
import com.codingshuttle.projects.airBnbApp.entity.User;
import com.codingshuttle.projects.airBnbApp.entity.Wishlist;
import com.codingshuttle.projects.airBnbApp.exception.ResourceNotFoundException;
import com.codingshuttle.projects.airBnbApp.repository.HotelRepository;
import com.codingshuttle.projects.airBnbApp.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.codingshuttle.projects.airBnbApp.util.AppUtils.getCurrentUser;

@Service
@RequiredArgsConstructor
@Slf4j
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final HotelRepository hotelRepository;
    private final ModelMapper modelMapper;
    private final KafkaProducerService kafkaProducerService;
    private final RecommendationService recommendationService;

    @Override
    @Transactional
    public boolean toggleWishlist(Long hotelId) {
        User user = getCurrentUser();
        log.info("User {} toggling hotel with ID: {}", user.getEmail(), hotelId);

        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with ID: " + hotelId));

        Optional<Wishlist> existing = wishlistRepository.findByUserAndHotel(user, hotel);

        if (existing.isPresent()) {
            wishlistRepository.delete(existing.get());
            log.info("Removed hotel {} from User {} wishlist", hotelId, user.getEmail());
            return false;
        } else {
            Wishlist entry = new Wishlist();
            entry.setUser(user);
            entry.setHotel(hotel);
            wishlistRepository.save(entry);
            log.info("Added hotel {} to User {} wishlist", hotelId, user.getEmail());

            // Publish WISHLIST event
            com.codingshuttle.projects.airBnbApp.dto.events.HotelInteractionEvent event = com.codingshuttle.projects.airBnbApp.dto.events.HotelInteractionEvent.builder()
                    .userId(user.getId())
                    .hotelId(hotelId)
                    .actionType("WISHLIST")
                    .timestamp(java.time.LocalDateTime.now())
                    .build();
            try {
                kafkaProducerService.sendHotelInteraction(event);
            } catch (Exception e) {
                log.warn("Kafka offline, saving WISHLIST interaction directly for user: {}, hotel: {}", user.getId(), hotelId);
                recommendationService.saveUserActivityDirectly(user.getId(), hotelId, "WISHLIST");
            }

            return true;
        }
    }

    @Override
    public List<HotelDto> getMyWishlist() {
        User user = getCurrentUser();
        log.info("Fetching wishlist for user: {}", user.getEmail());

        List<Wishlist> entries = wishlistRepository.findByUser(user);

        return entries.stream()
                .map(wishlist -> modelMapper.map(wishlist.getHotel(), HotelDto.class))
                .collect(Collectors.toList());
    }

    @Override
    public List<Long> getWishlistedHotelIds() {
        User user = getCurrentUser();
        log.info("Fetching wishlisted hotel IDs for user: {}", user.getEmail());

        List<Wishlist> entries = wishlistRepository.findByUser(user);

        return entries.stream()
                .map(wishlist -> wishlist.getHotel().getId())
                .collect(Collectors.toList());
    }
}
