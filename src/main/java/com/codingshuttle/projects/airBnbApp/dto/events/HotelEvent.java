package com.codingshuttle.projects.airBnbApp.dto.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HotelEvent {
    private String eventId;
    private Long hotelId;
    private String hotelName;
    private String ownerEmail;
    private String state;
    private String status;
}
