package com.codingshuttle.projects.airBnbApp.dto;

import com.codingshuttle.projects.airBnbApp.entity.enums.Gender;
import lombok.Data;

import java.time.LocalDate;
import java.util.Set;

@Data
public class UserDto {
    private Long id;
    private String email;
    private String name;
    private Gender gender;
    private LocalDate dateOfBirth;
    private Boolean isVerifiedHost;
    private Set<String> roles;
}
