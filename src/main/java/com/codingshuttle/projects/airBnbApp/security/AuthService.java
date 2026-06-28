package com.codingshuttle.projects.airBnbApp.security;

import com.codingshuttle.projects.airBnbApp.dto.LoginDto;
import com.codingshuttle.projects.airBnbApp.dto.SignUpRequestDto;
import com.codingshuttle.projects.airBnbApp.dto.UserDto;
import com.codingshuttle.projects.airBnbApp.entity.User;
import com.codingshuttle.projects.airBnbApp.entity.enums.Role;
import com.codingshuttle.projects.airBnbApp.exception.ResourceNotFoundException;
import com.codingshuttle.projects.airBnbApp.repository.UserRepository;
import com.codingshuttle.projects.airBnbApp.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JWTService jwtService;
    private final NotificationService notificationService;

    public UserDto signUp(SignUpRequestDto signUpRequestDto) {

        User user = userRepository.findByEmail(signUpRequestDto.getEmail()).orElse(null);

        if (user != null) {
            throw new RuntimeException("User is already present with same email id");
        }

        User newUser = modelMapper.map(signUpRequestDto, User.class);
        
        String requestedRole = signUpRequestDto.getRole();
        if (requestedRole != null && requestedRole.equals("ROLE_HOTEL_MANAGER")) {
            newUser.setRoles(Set.of(Role.HOTEL_MANAGER, Role.GUEST));
        } else {
            newUser.setRoles(Set.of(Role.GUEST));
        }
        
        newUser.setPassword(passwordEncoder.encode(signUpRequestDto.getPassword()));
        
        // Generate random 6-digit OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(1000000));
        newUser.setVerificationOtp(otp);
        newUser.setOtpExpiryTime(java.time.LocalDateTime.now().plusMinutes(5));
        newUser.setEmailVerified(false);
        
        newUser = userRepository.save(newUser);

        // Send OTP email
        try {
            notificationService.sendLiveNotification(
                    newUser.getEmail(),
                    "Verify Your Airbnb Account",
                    "Welcome to Airbnb! Your verification OTP is: " + otp + ". This code expires in 5 minutes."
            );
        } catch (Exception e) {
            log.error("Failed to send signup verification email: {}", e.getMessage());
        }

        UserDto userDto = modelMapper.map(newUser, UserDto.class);
        if (newUser.getRoles() != null) {
            userDto.setRoles(newUser.getRoles().stream()
                    .map(role -> "ROLE_" + role.name())
                    .collect(java.util.stream.Collectors.toSet()));
        }
        return userDto;
    }

    public String[] login(LoginDto loginDto) {
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                loginDto.getEmail(), loginDto.getPassword()
        ));

        User user = (User) authentication.getPrincipal();

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new org.springframework.security.authentication.BadCredentialsException("Email not verified. Please verify your email first.");
        }

        String[] arr = new String[2];
        arr[0] = jwtService.generateAccessToken(user);
        arr[1] = jwtService.generateRefreshToken(user);

        return arr;
    }

    public void verifyOtp(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new IllegalStateException("Email is already verified.");
        }

        if (user.getVerificationOtp() == null || !user.getVerificationOtp().equals(otp)) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid OTP code.");
        }

        if (user.getOtpExpiryTime() == null || user.getOtpExpiryTime().isBefore(java.time.LocalDateTime.now())) {
            throw new org.springframework.security.authentication.BadCredentialsException("OTP code has expired.");
        }

        user.setEmailVerified(true);
        user.setVerificationOtp(null);
        user.setOtpExpiryTime(null);
        userRepository.save(user);
        log.info("Email verified successfully for user: {}", email);
    }

    public void resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new IllegalStateException("Email is already verified.");
        }

        // Generate new OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(1000000));
        user.setVerificationOtp(otp);
        user.setOtpExpiryTime(java.time.LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        // Send OTP email
        try {
            notificationService.sendLiveNotification(
                    user.getEmail(),
                    "Verify Your Airbnb Account",
                    "Your new Airbnb verification OTP is: " + otp + ". This code expires in 5 minutes."
            );
            log.info("Resent OTP email to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send resend OTP email: {}", e.getMessage());
        }
    }

    public String refreshToken(String refreshToken) {
        Long id = jwtService.getUserIdFromToken(refreshToken);

        User user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found with id: "+id));
        return jwtService.generateAccessToken(user);
    }

}
