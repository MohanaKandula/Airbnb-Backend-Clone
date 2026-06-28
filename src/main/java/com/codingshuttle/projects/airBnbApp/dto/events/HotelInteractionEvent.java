package com.codingshuttle.projects.airBnbApp.dto.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HotelInteractionEvent {
    private String eventId;
    private Long userId;
    private Long hotelId;
    private String actionType; // VIEW, WISHLIST, BOOK
    private LocalDateTime timestamp;
}
