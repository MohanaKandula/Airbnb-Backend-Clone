package com.codingshuttle.projects.airBnbApp.service;

import com.codingshuttle.projects.airBnbApp.dto.ProfileUpdateRequestDto;
import com.codingshuttle.projects.airBnbApp.dto.UserDto;
import com.codingshuttle.projects.airBnbApp.entity.User;
import com.codingshuttle.projects.airBnbApp.entity.Hotel;
import com.codingshuttle.projects.airBnbApp.entity.Wishlist;
import com.codingshuttle.projects.airBnbApp.entity.Guest;
import com.codingshuttle.projects.airBnbApp.exception.ResourceNotFoundException;
import com.codingshuttle.projects.airBnbApp.repository.UserRepository;
import com.codingshuttle.projects.airBnbApp.repository.WishlistRepository;
import com.codingshuttle.projects.airBnbApp.repository.GuestRepository;
import com.codingshuttle.projects.airBnbApp.repository.HotelRepository;
import com.codingshuttle.projects.airBnbApp.entity.Booking;
import com.codingshuttle.projects.airBnbApp.entity.ExperienceBooking;
import com.codingshuttle.projects.airBnbApp.entity.enums.BookingStatus;
import com.codingshuttle.projects.airBnbApp.repository.BookingRepository;
import com.codingshuttle.projects.airBnbApp.repository.InventoryRepository;
import com.codingshuttle.projects.airBnbApp.repository.ExperienceBookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.codingshuttle.projects.airBnbApp.util.AppUtils.getCurrentUser;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService, UserDetailsService {

    private final UserRepository userRepository;
    private final WishlistRepository wishlistRepository;
    private final GuestRepository guestRepository;
    private final HotelRepository hotelRepository;
    private final ModelMapper modelMapper;
    private final BookingRepository bookingRepository;
    private final InventoryRepository inventoryRepository;
    private final ExperienceBookingRepository experienceBookingRepository;

    @Autowired
    @Lazy
    private PasswordEncoder passwordEncoder;

    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found with id: "+id));
    }

    @Override
    public void updateProfile(ProfileUpdateRequestDto profileUpdateRequestDto) {
        User user = getCurrentUser();

        if(profileUpdateRequestDto.getDateOfBirth() != null) user.setDateOfBirth(profileUpdateRequestDto.getDateOfBirth());
        if(profileUpdateRequestDto.getGender() != null) user.setGender(profileUpdateRequestDto.getGender());
        if (profileUpdateRequestDto.getName() != null) user.setName(profileUpdateRequestDto.getName());

        userRepository.save(user);
    }

    @Override
    public UserDto getMyProfile() {
        User user = getCurrentUser();
        log.info("Getting the profile for user with id: {}", user.getId());
        UserDto userDto = modelMapper.map(user, UserDto.class);
        if (user.getRoles() != null) {
            userDto.setRoles(user.getRoles().stream()
                    .map(role -> "ROLE_" + role.name())
                    .collect(java.util.stream.Collectors.toSet()));
        }
        return userDto;
    }

    @Override
    public UserDto verifyHost() {
        User user = getCurrentUser();
        log.info("Verifying user as a host: {}", user.getEmail());
        user.setIsVerifiedHost(true);
        userRepository.save(user);
        return getMyProfile();
    }

    @Override
    @Transactional
    public void deleteMyAccount() {
        User user = getCurrentUser();
        log.info("Deleting/Anonymizing user account with ID: {}", user.getId());

        // 1. Delete all wishlist items associated with this user
        List<Wishlist> wishlists = wishlistRepository.findByUser(user);
        if (!wishlists.isEmpty()) {
            wishlistRepository.deleteAll(wishlists);
            log.info("Deleted {} wishlist items for user ID: {}", wishlists.size(), user.getId());
        }

        // 2. Disassociate all guest entries in the user's guest roster (do not delete them as they are referenced by historical bookings)
        List<Guest> guests = guestRepository.findByUser(user);
        if (!guests.isEmpty()) {
            for (Guest guest : guests) {
                guest.setUser(null);
            }
            guestRepository.saveAll(guests);
            log.info("Disassociated {} guest list items for user ID: {}", guests.size(), user.getId());
        }

        // 2.5 Delete pending/reserved bookings and experience bookings (releasing room inventory if reserved)
        List<Booking> bookings = bookingRepository.findByUser(user);
        for (Booking booking : bookings) {
            BookingStatus status = booking.getBookingStatus();
            if (status == BookingStatus.RESERVED || status == BookingStatus.GUESTS_ADDED || status == BookingStatus.PAYMENTS_PENDING) {
                try {
                    inventoryRepository.releaseReservation(
                            booking.getRoom().getId(),
                            booking.getCheckInDate(),
                            booking.getCheckOutDate(),
                            booking.getRoomsCount()
                    );
                } catch (Exception e) {
                    log.error("Failed to release inventory reservation for booking ID: {}", booking.getId(), e);
                }
                bookingRepository.deletePaymentsByBookingId(booking.getId());
                bookingRepository.delete(booking);
                log.info("Permanently deleted pending/reserved booking ID: {} for user ID: {}", booking.getId(), user.getId());
            }
        }

        List<ExperienceBooking> expBookings = experienceBookingRepository.findByUserOrderByCreatedAtDesc(user);
        for (ExperienceBooking expBooking : expBookings) {
            BookingStatus status = expBooking.getBookingStatus();
            if (status == BookingStatus.RESERVED || status == BookingStatus.GUESTS_ADDED || status == BookingStatus.PAYMENTS_PENDING) {
                experienceBookingRepository.delete(expBooking);
                log.info("Permanently deleted pending/reserved experience booking ID: {} for user ID: {}", expBooking.getId(), user.getId());
            }
        }

        // 3. Deactivate any hotels owned by this host
        List<Hotel> hotels = hotelRepository.findByOwner(user);
        for (Hotel hotel : hotels) {
            hotel.setActive(false);
            hotelRepository.save(hotel);
        }
        if (!hotels.isEmpty()) {
            log.info("Deactivated {} hotels owned by host user ID: {}", hotels.size(), user.getId());
        }

        // 4. Anonymize user personal data and clear roles
        user.setName("Deleted User");
        user.setEmail("deleted_" + user.getId() + "_" + System.currentTimeMillis() + "@deleted.com");
        user.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
        user.setDateOfBirth(null);
        user.setGender(null);
        user.setIsVerifiedHost(false);
        user.setRoles(java.util.Collections.emptySet());

        userRepository.save(user);
        log.info("Successfully anonymized user ID: {}", user.getId());
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByEmail(username).orElse(null);
    }
}
