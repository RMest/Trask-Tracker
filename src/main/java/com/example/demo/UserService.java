package com.example.demo;

import java.time.Instant;
import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private static final int MIN_PASSWORD_LENGTH = 8;

    private final UserDocumentRepository userDocumentRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserDocumentRepository userDocumentRepository, PasswordEncoder passwordEncoder) {
        this.userDocumentRepository = userDocumentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User register(String name, String email, String password) {
        String sanitizedName = sanitizeName(name);
        String normalizedEmail = normalizeEmail(email);
        validatePassword(password);

        if (userDocumentRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("A user with this email already exists.");
        }

        UserDocument doc = new UserDocument();
        doc.setName(sanitizedName);
        doc.setEmail(normalizedEmail);
        doc.setPasswordHash(passwordEncoder.encode(password));
        doc.setCreatedAt(Instant.now().toString());

        UserDocument saved = userDocumentRepository.save(doc);
        return toUser(saved);
    }

    public User authenticate(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        validatePasswordPresent(password);

        UserDocument doc = userDocumentRepository
                .findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        String hash = doc.getPasswordHash();
        if (hash == null || hash.isBlank()) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        if (!passwordEncoder.matches(password, hash)) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        return toUser(doc);
    }

    private static User toUser(UserDocument saved) {
        return new User(saved.getId(), saved.getName(), saved.getEmail(), saved.getCreatedAt());
    }

    private void validatePassword(String password) {
        validatePasswordPresent(password);
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalArgumentException("Password must be at least " + MIN_PASSWORD_LENGTH + " characters.");
        }
    }

    private static void validatePasswordPresent(String password) {
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password is required.");
        }
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

    public record User(String id, String name, String email, String createdAt) {
    }
}
