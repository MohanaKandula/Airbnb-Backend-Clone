package com.codingshuttle.projects.airBnbApp.repository;

import com.codingshuttle.projects.airBnbApp.dto.HotelPriceDto;
import com.codingshuttle.projects.airBnbApp.entity.Hotel;
import com.codingshuttle.projects.airBnbApp.entity.HotelMinPrice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface HotelMinPriceRepository extends JpaRepository<HotelMinPrice, Long> {

    @Query("""
            SELECT new com.codingshuttle.projects.airBnbApp.dto.HotelPriceDto(i.hotel, AVG(i.price))
            FROM Inventory i
            WHERE (LOWER(i.hotel.city) = LOWER(:city) OR LOWER(i.hotel.state) = LOWER(:city))
                AND i.hotel.active = true
                AND i.closed = false
                AND i.date BETWEEN :startDate AND :endDate
                AND (i.totalCount - i.bookedCount - i.reservedCount) >= :roomsCount
                AND i.room.id IN (
                    SELECT available.room.id
                    FROM Inventory available
                    WHERE (LOWER(available.hotel.city) = LOWER(:city) OR LOWER(available.hotel.state) = LOWER(:city))
                        AND available.hotel.active = true
                        AND available.closed = false
                        AND available.date BETWEEN :startDate AND :endDate
                        AND (available.totalCount - available.bookedCount - available.reservedCount) >= :roomsCount
                    GROUP BY available.room.id
                    HAVING COUNT(DISTINCT available.date) = :dateCount
                )
           GROUP BY i.hotel
           """)
    Page<HotelPriceDto> findHotelsWithAvailableInventory(
            @Param("city") String city,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("roomsCount") Integer roomsCount,
            @Param("dateCount") Long dateCount,
            Pageable pageable
    );

    Optional<HotelMinPrice> findByHotelAndDate(Hotel hotel, LocalDate date);

    java.util.List<HotelMinPrice> findByHotelAndDateBetween(Hotel hotel, java.time.LocalDate startDate, java.time.LocalDate endDate);
}
