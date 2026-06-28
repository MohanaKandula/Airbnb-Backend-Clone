package com.codingshuttle.projects.airBnbApp.service;

import com.codingshuttle.projects.airBnbApp.dto.*;
import com.codingshuttle.projects.airBnbApp.entity.Hotel;
import com.codingshuttle.projects.airBnbApp.entity.Room;
import com.codingshuttle.projects.airBnbApp.entity.User;
import com.codingshuttle.projects.airBnbApp.exception.ResourceNotFoundException;
import com.codingshuttle.projects.airBnbApp.exception.UnAuthorisedException;
import com.codingshuttle.projects.airBnbApp.repository.HotelRepository;
import com.codingshuttle.projects.airBnbApp.repository.InventoryRepository;
import com.codingshuttle.projects.airBnbApp.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.math.BigDecimal;
import com.codingshuttle.projects.airBnbApp.entity.Inventory;
import java.util.List;
import java.util.stream.Collectors;
import com.codingshuttle.projects.airBnbApp.dto.events.HotelEvent;

import static com.codingshuttle.projects.airBnbApp.util.AppUtils.getCurrentUser;

@Service
@Slf4j
@RequiredArgsConstructor
public class HotelServiceImpl implements HotelService{

    private final HotelRepository hotelRepository;
    private final ModelMapper modelMapper;
    private final InventoryService inventoryService;
    private final RoomRepository roomRepository;
    private final InventoryRepository inventoryRepository;
    private final com.codingshuttle.projects.airBnbApp.strategy.PricingService pricingService;
    private final KafkaProducerService kafkaProducerService;
    private final ElasticsearchIndexer elasticsearchIndexer;
    private final NotificationService notificationService;

    @Override
    public HotelDto createNewHotel(HotelDto hotelDto) {
        log.info("Creating a new hotel with name: {}", hotelDto.getName());
        Hotel hotel = modelMapper.map(hotelDto, Hotel.class);
        hotel.setActive(false);

        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        hotel.setOwner(user);

        hotel = hotelRepository.save(hotel);
        log.info("Created a new hotel with ID: {}", hotel.getId());

        // Publish hotel-created Kafka event
        try {
            HotelEvent hotelEvent = HotelEvent.builder()
                    .hotelId(hotel.getId())
                    .hotelName(hotel.getName())
                    .ownerEmail(hotel.getOwner().getEmail())
                    .state(hotel.getState())
                    .status("PENDING_APPROVAL")
                    .build();
            kafkaProducerService.sendHotelCreated(hotelEvent);
        } catch (Exception e) {
            log.error("Failed to publish hotel-created event: {}", e.getMessage());
            if (hotel.getOwner() != null) {
                notificationService.sendLiveNotification(hotel.getOwner().getEmail(), 
                        "Property Submitted", 
                        "Your property '" + hotel.getName() + "' has been submitted and is pending admin approval.");
            }
        }

        return modelMapper.map(hotel, HotelDto.class);
    }

    @Override
    public HotelDto getHotelById(Long id) {
        log.info("Getting the hotel with ID: {}", id);
        Hotel hotel = hotelRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with ID: "+id));
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if(!user.equals(hotel.getOwner())) {
            throw new UnAuthorisedException("This user does not own this hotel with id: "+id);
        }

        return modelMapper.map(hotel, HotelDto.class);
    }

    @Override
    @Transactional
    @CacheEvict(value = "hotelSearch", allEntries = true)
    public HotelDto updateHotelById(Long id, HotelDto hotelDto) {
        log.info("Updating the hotel with ID: {}", id);
        Hotel hotel = hotelRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with ID: "+id));

        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if(!user.equals(hotel.getOwner())) {
            throw new UnAuthorisedException("This user does not own this hotel with id: "+id);
        }

        boolean wasActive = Boolean.TRUE.equals(hotel.getActive());

        modelMapper.map(hotelDto, hotel);
        hotel.setId(id);

        // If transitioning from inactive to active, initialize inventories for the rooms
        if (!wasActive && Boolean.TRUE.equals(hotel.getActive())) {
            for(Room room: hotel.getRooms()) {
                inventoryService.initializeRoomForAYear(room);
            }
        }

        hotel = hotelRepository.save(hotel);
        return modelMapper.map(hotel, HotelDto.class);
    }

    @Override
    @Transactional
    @CacheEvict(value = "hotelSearch", allEntries = true)
    public void deleteHotelById(Long id) {
        Hotel hotel = hotelRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with ID: "+id));

        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if(!user.equals(hotel.getOwner())) {
            throw new UnAuthorisedException("This user does not own this hotel with id: "+id);
        }


        for(Room room: hotel.getRooms()) {
            inventoryService.deleteAllInventories(room);
            roomRepository.deleteById(room.getId());
        }
        hotelRepository.deleteById(id);
    }

    @Override
    @Transactional
    @CacheEvict(value = "hotelSearch", allEntries = true)
    public void activateHotel(Long hotelId) {
        log.info("Toggling active status of hotel with ID: {}", hotelId);
        Hotel hotel = hotelRepository
                .findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with ID: "+hotelId));

        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if(!user.equals(hotel.getOwner())) {
            throw new UnAuthorisedException("This user does not own this hotel with id: "+hotelId);
        }

        boolean wasActive = Boolean.TRUE.equals(hotel.getActive());
        hotel.setActive(!wasActive);
        hotel = hotelRepository.save(hotel);

        // If transitioning from inactive to active, initialize inventories for the rooms
        if (!wasActive) {
            for(Room room: hotel.getRooms()) {
                inventoryService.initializeRoomForAYear(room);
            }

            // Publish hotel-approved Kafka event and index to Elasticsearch
            try {
                HotelEvent hotelApprovedEvent = HotelEvent.builder()
                        .hotelId(hotel.getId())
                        .hotelName(hotel.getName())
                        .ownerEmail(hotel.getOwner().getEmail())
                        .state(hotel.getState())
                        .status("APPROVED")
                        .build();
                kafkaProducerService.sendHotelApproved(hotelApprovedEvent);
                elasticsearchIndexer.indexHotel(hotel);
            } catch (Exception e) {
                log.error("Failed to publish hotel-approved event: {}", e.getMessage());
                if (hotel.getOwner() != null) {
                    notificationService.sendLiveNotification(hotel.getOwner().getEmail(), 
                            "Property Approved!", 
                            "Congratulations! Your property '" + hotel.getName() + "' has been approved and is now live.");
                }
            }
        } else {
            // Delete from Elasticsearch index when deactivated
            elasticsearchIndexer.deleteHotelFromIndex(hotelId);
        }
    }

//    public method
    @Override
    public HotelInfoDto getHotelInfoById(Long hotelId, HotelInfoRequestDto hotelInfoRequestDto) {
        Hotel hotel = hotelRepository
                .findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with ID: "+hotelId));

        long daysCount = ChronoUnit.DAYS.between(hotelInfoRequestDto.getStartDate(), hotelInfoRequestDto.getEndDate())+1;

        List<RoomPriceDto> roomPriceDtoList = inventoryRepository.findRoomAveragePrice(hotelId,
                hotelInfoRequestDto.getStartDate(), hotelInfoRequestDto.getEndDate(),
                hotelInfoRequestDto.getRoomsCount(), daysCount);

        List<RoomPriceResponseDto> rooms = roomPriceDtoList.stream()
                .map(roomPriceDto -> {
                    RoomPriceResponseDto roomPriceResponseDto = modelMapper.map(roomPriceDto.getRoom(),
                            RoomPriceResponseDto.class);
                    
                    if (roomPriceDto.getPrice() != null) {
                        List<Inventory> inventories = inventoryRepository.findByRoomIdAndDateBetween(
                                roomPriceDto.getRoom().getId(),
                                hotelInfoRequestDto.getStartDate(),
                                hotelInfoRequestDto.getEndDate()
                        );
                        
                        double avgDynamicPrice = inventories.stream()
                                .map(pricingService::calculateDynamicPricing)
                                .mapToDouble(BigDecimal::doubleValue)
                                .average()
                                .orElse(0.0);
                        
                        double avgSurgeFactor = inventories.stream()
                                .map(Inventory::getSurgeFactor)
                                .mapToDouble(BigDecimal::doubleValue)
                                .average()
                                .orElse(1.0);
                                
                        double avgOccupancy = inventories.stream()
                                .mapToDouble(inv -> inv.getTotalCount() == 0 ? 0.0 : (double) inv.getBookedCount() / inv.getTotalCount())
                                .average()
                                .orElse(0.0);

                        boolean isHoliday = true; // HolidayPricingStrategy is always active

                        String label = null;
                        if (avgOccupancy > 0.8) {
                            label = "High Demand";
                        } else if (avgSurgeFactor > 1.0) {
                            label = "Limited Rooms Left";
                        } else if (isHoliday) {
                            label = "Holiday Pricing Applied";
                        }
                        
                        roomPriceResponseDto.setPrice(avgDynamicPrice);
                        roomPriceResponseDto.setBasePrice(roomPriceDto.getRoom().getBasePrice().doubleValue());
                        roomPriceResponseDto.setSurgeFactor(avgSurgeFactor);
                        roomPriceResponseDto.setIsHoliday(isHoliday);
                        roomPriceResponseDto.setOccupancyRate(avgOccupancy);
                        roomPriceResponseDto.setPricingLabel(label);
                    } else {
                        roomPriceResponseDto.setPrice(null);
                    }
                    
                    return roomPriceResponseDto;
                })
                .collect(Collectors.toList());

        return new HotelInfoDto(modelMapper.map(hotel, HotelDto.class), rooms);
    }

    @Override
    public List<HotelDto> getAllHotels() {
        User user = getCurrentUser();
        log.info("Getting all hotels for the admin user with ID: {}", user.getId());
        List<Hotel> hotels = hotelRepository.findByOwner(user);

        return hotels
                .stream()
                .map((element) -> modelMapper.map(element, HotelDto.class))
                .collect(Collectors.toList());
    }


}
