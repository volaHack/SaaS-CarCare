package com.ecofleet.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    public void enviar(String apiKey, String to, String subject, String html) throws Exception {
        // Escapar comillas y newlines en el HTML para JSON
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
            String body = response.body();
            log.error("Error Resend ({}): {}", response.statusCode(), body);

            if (response.statusCode() == 401 || response.statusCode() == 403) {
                throw new RuntimeException("API Key de Resend inválida. Verificá que sea correcta.");
            } else if (response.statusCode() == 422 && body.contains("not verified")) {
                throw new RuntimeException("Dominio no verificado en Resend. Usá el plan gratuito con el remitente por defecto.");
            } else {
                throw new RuntimeException("Error al enviar email: " + body);
            }
        }
    }
}
