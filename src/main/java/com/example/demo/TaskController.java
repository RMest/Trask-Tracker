package com.example.demo;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class TaskController {

    private final TaskDocumentRepository taskDocumentRepository;

    public TaskController(TaskDocumentRepository taskDocumentRepository) {
        this.taskDocumentRepository = taskDocumentRepository;
    }

    @GetMapping("/api/tasks")
    public ResponseEntity<?> listTasks(@RequestParam("email") String email) {
        try {
            String normalizedEmail = normalizeEmail(email);
            List<TaskItem> items = taskDocumentRepository.findByUserEmailOrderByDateAsc(normalizedEmail)
                    .stream()
                    .map(TaskController::toItem)
                    .toList();
            return ResponseEntity.ok(items);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/api/tasks")
    public ResponseEntity<?> saveTasks(@RequestParam("email") String email, @RequestBody List<TaskItem> items) {
        try {
            String normalizedEmail = normalizeEmail(email);
            taskDocumentRepository.deleteByUserEmail(normalizedEmail);

            List<TaskDocument> docs = items.stream().map((item) -> {
                TaskDocument doc = new TaskDocument();
                doc.setId(item.id());
                doc.setUserEmail(normalizedEmail);
                doc.setTitle(item.title());
                doc.setDate(item.date());
                doc.setStart(item.start());
                doc.setEnd(item.end());
                doc.setTimeLabel(item.timeLabel());
                doc.setColor(item.color());
                doc.setCompleted(Boolean.TRUE.equals(item.completed()));
                doc.setEditable(item.editable() == null || item.editable());
                doc.setDurationEditable(Boolean.TRUE.equals(item.durationEditable()));
                return doc;
            }).toList();

            List<TaskItem> savedItems = taskDocumentRepository.saveAll(docs).stream()
                    .map(TaskController::toItem)
                    .toList();
            return ResponseEntity.ok(savedItems);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    private static TaskItem toItem(TaskDocument doc) {
        return new TaskItem(
                doc.getId(),
                doc.getTitle(),
                doc.getDate(),
                doc.getStart(),
                doc.getEnd(),
                doc.getTimeLabel(),
                doc.getColor(),
                doc.isCompleted(),
                doc.isEditable(),
                doc.isDurationEditable());
    }

    private static String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        if (!normalized.contains("@")) {
            throw new IllegalArgumentException("Email format is invalid.");
        }
        return normalized;
    }

    public record TaskItem(
            String id,
            String title,
            String date,
            String start,
            String end,
            String timeLabel,
            String color,
            Boolean completed,
            Boolean editable,
            Boolean durationEditable) {
    }
}
