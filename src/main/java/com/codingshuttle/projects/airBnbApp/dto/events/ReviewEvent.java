package com.codingshuttle.projects.airBnbApp.dto.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewEvent {
    private String eventId;
    private Long reviewId;
    private Long hotelId;
    private Double rating;
    private String authorName;
    private String content;
}
