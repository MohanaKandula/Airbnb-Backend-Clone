package com.codingshuttle.projects.airBnbApp.service;

import com.codingshuttle.projects.airBnbApp.dto.HotelDto;
import java.util.List;

public interface WishlistService {
    boolean toggleWishlist(Long hotelId);
    List<HotelDto> getMyWishlist();
    List<Long> getWishlistedHotelIds();
}
