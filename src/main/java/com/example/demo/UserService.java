package com.example.demo;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final AtomicLong idGenerator = new AtomicLong(1);
    private final Map<String, User> usersByEmail = new ConcurrentHashMap<>();

    public User createUser(String name, String email) {
        String sanitizedName = sanitizeName(name);
        String normalizedEmail = normalizeEmail(email);

        if (usersByEmail.containsKey(normalizedEmail)) {
            throw new IllegalArgumentException("A user with this email already exists.");
        }

        User user = new User(
                idGenerator.getAndIncrement(),
                sanitizedName,
                normalizedEmail,
                Instant.now().toString());

        usersByEmail.put(normalizedEmail, user);
        return user;
    }

    private String sanitizeName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name is required.");
        }
        return name.trim();
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        if (!normalized.contains("@")) {
            throw new IllegalArgumentException("Email format is invalid.");
        }
        return normalized;
    }

    public record User(long id, String name, String email, String createdAt) {
    }
}
