package com.codingshuttle.projects.airBnbApp.util;

import com.codingshuttle.projects.airBnbApp.entity.User;
import org.springframework.security.core.context.SecurityContextHolder;

public class AppUtils {

    public static User getCurrentUser() {
        org.springframework.security.core.Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        return (User) authentication.getPrincipal();
    }
}
