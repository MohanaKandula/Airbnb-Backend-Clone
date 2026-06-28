package com.codingshuttle.projects.airBnbApp.controller;

import com.codingshuttle.projects.airBnbApp.dto.HostAnalyticsDto;
import com.codingshuttle.projects.airBnbApp.entity.User;
import com.codingshuttle.projects.airBnbApp.service.HostAnalyticsService;
import com.codingshuttle.projects.airBnbApp.util.AppUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class HostAnalyticsController {

    private final HostAnalyticsService hostAnalyticsService;

    @GetMapping("/admin/analytics")
    public ResponseEntity<HostAnalyticsDto> getHostAnalytics() {
        User user = AppUtils.getCurrentUser();
        return ResponseEntity.ok(hostAnalyticsService.getHostAnalytics(user.getId()));
    }
}
