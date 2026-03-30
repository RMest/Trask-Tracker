package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest(
        properties = {
                "spring.autoconfigure.exclude="
                        + "org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration,"
                        + "org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration,"
                        + "org.springframework.boot.autoconfigure.data.mongo.MongoRepositoriesAutoConfiguration"
        })
class BlankCanvasApplicationTests {

    @MockBean
    private UserDocumentRepository userDocumentRepository;

    @Test
    void contextLoads() {
    }
}
