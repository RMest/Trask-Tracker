package com.example.demo;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface TaskDocumentRepository extends MongoRepository<TaskDocument, String> {

    List<TaskDocument> findByUserEmailOrderByDateAsc(String userEmail);

    void deleteByUserEmail(String userEmail);
}
