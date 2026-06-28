package com.codingshuttle.projects.airBnbApp.service;

import com.codingshuttle.projects.airBnbApp.entity.Hotel;
import com.codingshuttle.projects.airBnbApp.entity.HotelMinPrice;
import com.codingshuttle.projects.airBnbApp.entity.Inventory;
import com.codingshuttle.projects.airBnbApp.repository.HotelMinPriceRepository;
import com.codingshuttle.projects.airBnbApp.repository.HotelRepository;
import com.codingshuttle.projects.airBnbApp.repository.InventoryRepository;
import com.codingshuttle.projects.airBnbApp.strategy.PricingService;
import com.codingshuttle.projects.airBnbApp.strategy.PricingStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PricingUpdateService {

    // Scheduler to update the inventory and HotelMinPrice tables every hour

    private final HotelRepository hotelRepository;
    private final InventoryRepository inventoryRepository;
    private final HotelMinPriceRepository hotelMinPriceRepository;
    private final PricingService pricingService;

    @Autowired
    @Lazy
    private PricingUpdateService self;

//    @Scheduled(cron = "*/5 * * * * *")
    @Scheduled(cron = "0 0 * * * *")
    @CacheEvict(value = "hotelSearch", allEntries = true)
    public void updatePrices() {
        int page = 0;
        int batchSize = 100;

        while(true) {
            Page<Hotel> hotelPage = hotelRepository.findAll(PageRequest.of(page, batchSize));
            if(hotelPage.isEmpty()) {
                break;
            }
            hotelPage.getContent().forEach(self::updateHotelPrices);

            page++;
        }
    }

    @Transactional
    public void updateHotelPrices(Hotel hotel) {
        log.info("Updating hotel prices for hotel ID: {}", hotel.getId());
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = LocalDate.now().plusYears(1);

        List<Inventory> inventoryList = inventoryRepository.findByHotelAndDateBetween(hotel, startDate, endDate);

        updateInventoryPrices(inventoryList);

        updateHotelMinPrice(hotel, inventoryList, startDate, endDate);
    }

    private void updateHotelMinPrice(Hotel hotel, List<Inventory> inventoryList, LocalDate startDate, LocalDate endDate) {
        // Compute minimum price per day for the hotel
        Map<LocalDate, BigDecimal> dailyMinPrices = inventoryList.stream()
                .collect(Collectors.groupingBy(
                        Inventory::getDate,
                        Collectors.mapping(Inventory::getPrice, Collectors.minBy(Comparator.naturalOrder()))
                ))
                .entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().orElse(BigDecimal.ZERO)));

        // Fetch all existing minimum prices for this hotel in the date range in one query
        List<HotelMinPrice> existingPrices = hotelMinPriceRepository.findByHotelAndDateBetween(hotel, startDate, endDate);
        Map<LocalDate, HotelMinPrice> existingPricesMap = existingPrices.stream()
                .collect(Collectors.toMap(HotelMinPrice::getDate, hp -> hp));

        // Prepare HotelPrice entities in bulk
        List<HotelMinPrice> hotelPrices = new ArrayList<>();
        dailyMinPrices.forEach((date, price) -> {
            HotelMinPrice hotelPrice = existingPricesMap.get(date);
            if (hotelPrice == null) {
                hotelPrice = new HotelMinPrice(hotel, date);
            }
            hotelPrice.setPrice(price);
            hotelPrices.add(hotelPrice);
        });

        // Save all HotelPrice entities in bulk
        hotelMinPriceRepository.saveAll(hotelPrices);
    }

    private void updateInventoryPrices(List<Inventory> inventoryList) {
        inventoryList.forEach(inventory -> {
            BigDecimal dynamicPrice = pricingService.calculateDynamicPricing(inventory);
            inventory.setPrice(dynamicPrice);
        });
        inventoryRepository.saveAll(inventoryList);
    }

}
