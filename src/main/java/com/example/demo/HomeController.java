package com.example.demo;

import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class HomeController {

    private final CalculatorService calculatorService;

    public HomeController(CalculatorService calculatorService) {
        this.calculatorService = calculatorService;
    }

    @PostMapping("/api/calculate")
    public Map<String, Object> calculate(
            @RequestParam String operation,
            @RequestParam double num1,
            @RequestParam double num2) {
        try {
            double result = calculatorService.calculate(operation, num1, num2);
            return Map.of("result", result);
        } catch (IllegalArgumentException ex) {
            return Map.of("error", ex.getMessage());
        }
    }
}
