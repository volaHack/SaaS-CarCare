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

    // Resend API key (https://resend.com)
    private String resendApiKey;

    // Destination email for reports (overrides account email)
    private String emailNotificaciones;
}
