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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String RESEND_URL = "https://api.resend.com/emails";
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$", Pattern.CASE_INSENSITIVE);
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    @Value("${RESEND_API_KEY:}")
    private String apiKey;

    @Value("${RESEND_FROM_EMAIL:CarCare <onboarding@resend.dev>}")
    private String fromEmail;

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public void enviar(String to, String subject, String html) throws Exception {
        if (!isConfigured()) {
            throw new RuntimeException("Servicio de email no disponible. Contacta al administrador del sistema.");
        }

        List<String> destinatarios = parseDestinatarios(to);
        String htmlEscaped = escapeJson(html).replace("\n", "\\n").replace("\r", "");
        String toJson = destinatarios.stream()
                .map(destino -> "\"" + escapeJson(destino) + "\"")
                .collect(Collectors.joining(","));

        String json = String.format(
                "{\"from\":\"%s\",\"to\":[%s],\"subject\":\"%s\",\"html\":\"%s\"}",
                escapeJson(fromEmail),
                toJson,
                escapeJson(subject),
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
            log.info("Email enviado exitosamente a {}", String.join(", ", destinatarios));
        } else {
            log.error("Error enviando email ({}): {}", response.statusCode(), response.body());
            throw new RuntimeException(resolveErrorMessage(response.body()));
        }
    }

    public String normalizarDestinatarios(String raw) {
        List<String> destinatarios = parseDestinatarios(raw);
        return destinatarios.isEmpty() ? "" : String.join(", ", destinatarios);
    }

    private List<String> parseDestinatarios(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }

        Set<String> destinatarios = new LinkedHashSet<>();
        for (String parte : raw.split("[,;\\n]+")) {
            String email = parte.trim();
            if (email.isEmpty()) {
                continue;
            }
            if (!EMAIL_PATTERN.matcher(email).matches()) {
                throw new IllegalArgumentException("Correo invalido: " + email);
            }
            destinatarios.add(email);
        }

        return List.copyOf(destinatarios);
    }

    private String escapeJson(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }

    private String resolveErrorMessage(String responseBody) {
        String body = responseBody == null ? "" : responseBody;
        if (body.contains("You can only send testing emails to your own email address")) {
            return "Resend esta en modo de prueba. Para enviar a otros correos debes verificar tu dominio en Resend y configurar RESEND_FROM_EMAIL con ese dominio.";
        }
        if (body.contains("domain is not verified")) {
            return "El dominio configurado para enviar emails no esta verificado en Resend.";
        }
        return "No se pudo enviar el email. Intenta de nuevo mas tarde.";
    }
}
