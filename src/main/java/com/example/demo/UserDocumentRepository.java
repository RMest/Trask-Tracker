package com.example.demo;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserDocumentRepository extends MongoRepository<UserDocument, String> {

    boolean existsByEmail(String email);

    Optional<UserDocument> findByEmail(String email);
}
