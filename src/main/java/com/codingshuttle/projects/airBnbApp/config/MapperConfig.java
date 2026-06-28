package com.codingshuttle.projects.airBnbApp.config;

import org.modelmapper.ModelMapper;
import com.codingshuttle.projects.airBnbApp.dto.GuestDto;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MapperConfig {

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();

        // Guest -> GuestDto: Calculate age from dateOfBirth
        modelMapper.typeMap(com.codingshuttle.projects.airBnbApp.entity.Guest.class, GuestDto.class).setPostConverter(context -> {
            com.codingshuttle.projects.airBnbApp.entity.Guest source = context.getSource();
            GuestDto destination = context.getDestination();
            if (source != null && destination != null) {
                if (source.getDateOfBirth() != null) {
                    destination.setAge(java.time.Period.between(source.getDateOfBirth(), java.time.LocalDate.now()).getYears());
                }
                destination.setIsPrimary(source.getIsPrimary());
            }
            return destination;
        });

        // GuestDto -> Guest: Calculate dateOfBirth from age if DOB not specified
        modelMapper.typeMap(GuestDto.class, com.codingshuttle.projects.airBnbApp.entity.Guest.class).setPostConverter(context -> {
            GuestDto source = context.getSource();
            com.codingshuttle.projects.airBnbApp.entity.Guest destination = context.getDestination();
            if (source != null && destination != null) {
                if (source.getAge() != null && destination.getDateOfBirth() == null) {
                    destination.setDateOfBirth(java.time.LocalDate.now().minusYears(source.getAge()));
                }
                if (source.getIsPrimary() != null) {
                    destination.setIsPrimary(source.getIsPrimary());
                }
            }
            return destination;
        });

        return modelMapper;
    }
}
