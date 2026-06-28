package com.codingshuttle.projects.airBnbApp.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ExperienceDto {
    private Long id;
    private String title;
    private String description;
    private String location;
    private BigDecimal price;
    private String duration;
    private String image;
    private Boolean isOnline;
    private Double rating;
    private Integer maxGuests;
    private UserDto host;
}
