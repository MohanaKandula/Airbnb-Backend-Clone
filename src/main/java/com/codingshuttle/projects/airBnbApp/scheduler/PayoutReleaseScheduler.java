package com.codingshuttle.projects.airBnbApp.scheduler;

import com.codingshuttle.projects.airBnbApp.entity.Booking;
import com.codingshuttle.projects.airBnbApp.entity.enums.BookingStatus;
import com.codingshuttle.projects.airBnbApp.entity.enums.PayoutStatus;
import com.codingshuttle.projects.airBnbApp.repository.BookingRepository;
import com.codingshuttle.projects.airBnbApp.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PayoutReleaseScheduler {

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    // Run every 30 seconds for test/local-development responsiveness
    @Scheduled(fixedRate = 30000)
    @Transactional
    public void releaseEligibleEscrowPayouts() {
        log.info("Starting automated escrow payout release scan...");

        LocalDate today = LocalDate.now();
        List<Booking> eligibleBookings = bookingRepository.findByBookingStatusAndPayoutStatusAndCheckInDateLessThanEqual(
                BookingStatus.CONFIRMED, PayoutStatus.HELD_IN_ESCROW, today
        );

        if (eligibleBookings.isEmpty()) {
            log.info("No bookings eligible for escrow payout release at this time.");
            return;
        }

        log.info("Found {} bookings eligible for escrow payout processing.", eligibleBookings.size());

        for (Booking booking : eligibleBookings) {
            String guestEmail = booking.getUser() != null ? booking.getUser().getEmail() : "traveler@airbnb.com";
            
            if (booking.getHotel() == null || booking.getHotel().getOwner() == null) {
                log.warn("Skipping booking #{} due to missing hotel/owner metadata.", booking.getId());
                continue;
            }

            String hostEmail = booking.getHotel().getOwner().getEmail();
            boolean isVerified = Boolean.TRUE.equals(booking.getHotel().getOwner().getIsVerifiedHost());

            if (isVerified) {
                booking.setPayoutStatus(PayoutStatus.RELEASED);
                bookingRepository.save(booking);

                log.info("Released escrow payout for Booking ID #{} to Host {} bank account 8333017713", booking.getId(), hostEmail);

                // Notify host
                notificationService.sendLiveNotification(hostEmail,
                        "Earnings Payout Released!",
                        "Your payout of ₹" + booking.getAmount() + " for stay #" + booking.getId() + " has been successfully released to your bank account 8333017713.");

                // Notify guest
                notificationService.sendLiveNotification(guestEmail,
                        "Host Payout Completed",
                        "The payment of ₹" + booking.getAmount() + " for stay #" + booking.getId() + " has been released to the host's bank account 8333017713.");
            } else {
                log.warn("Payout for booking #{} is held. Host {} is unverified.", booking.getId(), hostEmail);

                // Send live warning notification to the host
                notificationService.sendLiveNotification(hostEmail,
                        "Payout Locked (Action Required)",
                        "Your payout of ₹" + booking.getAmount() + " for booking #" + booking.getId() + " is ready but locked. Please complete identity verification.");
            }
        }
    }
}
