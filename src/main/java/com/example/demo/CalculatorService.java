package com.example.demo;

import org.springframework.stereotype.Service;

@Service
public class CalculatorService {

    public double calculate(String operation, double num1, double num2) {
        return switch (operation) {
            case "add" -> num1 + num2;
            case "subtract" -> num1 - num2;
            case "multiply" -> num1 * num2;
            case "divide" -> divide(num1, num2);
            default -> throw new IllegalArgumentException("Unsupported operation: " + operation);
        };
    }

    private double divide(double num1, double num2) {
        if (num2 == 0) {
            throw new IllegalArgumentException("Cannot divide by zero.");
        }
        return num1 / num2;
    }
}
