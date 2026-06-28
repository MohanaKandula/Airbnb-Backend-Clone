package com.codingshuttle.projects.airBnbApp.controller;

import com.codingshuttle.projects.airBnbApp.dto.HotelDto;
import com.codingshuttle.projects.airBnbApp.service.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @PostMapping("/toggle/{hotelId}")
    @Operation(summary = "Toggle a hotel in the user's wishlist", tags = {"Wishlist"})
    public ResponseEntity<Boolean> toggleWishlist(@PathVariable Long hotelId) {
        return ResponseEntity.ok(wishlistService.toggleWishlist(hotelId));
    }

    @GetMapping
    @Operation(summary = "Get current user's complete wishlist hotels", tags = {"Wishlist"})
    public ResponseEntity<List<HotelDto>> getMyWishlist() {
        return ResponseEntity.ok(wishlistService.getMyWishlist());
    }

    @GetMapping("/ids")
    @Operation(summary = "Get list of all wishlisted hotel IDs for the user", tags = {"Wishlist"})
    public ResponseEntity<List<Long>> getWishlistedHotelIds() {
        return ResponseEntity.ok(wishlistService.getWishlistedHotelIds());
    }
}
