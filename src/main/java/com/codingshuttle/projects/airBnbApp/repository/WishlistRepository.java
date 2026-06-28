package com.codingshuttle.projects.airBnbApp.repository;

import com.codingshuttle.projects.airBnbApp.entity.Hotel;
import com.codingshuttle.projects.airBnbApp.entity.User;
import com.codingshuttle.projects.airBnbApp.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    Optional<Wishlist> findByUserAndHotel(User user, Hotel hotel);
    List<Wishlist> findByUser(User user);
    boolean existsByUserAndHotel(User user, Hotel hotel);
}
