package com.codingshuttle.projects.airBnbApp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RoomPriceResponseDto {
    private Long id;
    private String type;
    private String[] photos;
    private String[] amenities;
    private Double price;
    private Double basePrice;
    private Double surgeFactor;
    private Boolean isHoliday;
    private Double occupancyRate;
    private String pricingLabel;
}
