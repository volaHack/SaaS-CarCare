package com.ecofleet.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "configuracion_email")
public class ConfiguracionEmail {
    @Id
    private String id;

    private String empresaId;

    // SMTP sender credentials (Gmail App Password)
    private String smtpEmail;
    private String smtpPassword;

    // Destination email for reports (overrides account email)
    private String emailNotificaciones;
}
