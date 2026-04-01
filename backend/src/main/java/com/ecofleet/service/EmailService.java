package com.ecofleet.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String RESEND_URL = "https://api.resend.com/emails";
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    @Value("${RESEND_API_KEY:}")
    private String apiKey;

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public void enviar(String to, String subject, String html) throws Exception {
        if (!isConfigured()) {
            throw new RuntimeException("Servicio de email no disponible. Contacta al administrador del sistema.");
        }

        String htmlEscaped = html
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "");

        String json = String.format(
                "{\"from\":\"CarCare <onboarding@resend.dev>\",\"to\":[\"%s\"],\"subject\":\"%s\",\"html\":\"%s\"}",
                to,
                subject.replace("\"", "\\\""),
                htmlEscaped
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(RESEND_URL))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .timeout(Duration.ofSeconds(15))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            log.info("Email enviado exitosamente a {}", to);
        } else {
            log.error("Error enviando email ({}): {}", response.statusCode(), response.body());
            throw new RuntimeException("No se pudo enviar el email. Intenta de nuevo mas tarde.");
        }
    }
}
