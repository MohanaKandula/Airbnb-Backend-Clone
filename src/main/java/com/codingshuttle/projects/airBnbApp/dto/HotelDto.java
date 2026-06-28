package com.codingshuttle.projects.airBnbApp.dto;

import com.codingshuttle.projects.airBnbApp.entity.HotelContactInfo;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class HotelDto {
    private Long id;
    private String name;
    private String city;
    private String state;
    private Double rating;
    private String[] photos;
    private String[] amenities;
    private HotelContactInfo contactInfo;
    
    private Double latitude;
    private Double longitude;
    
    @JsonProperty("isActive")
    @JsonAlias("active")
    private Boolean active;
}

