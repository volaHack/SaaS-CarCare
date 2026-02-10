package com.ecofleet.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "mensajes")
public class Mensaje {
    @Id
    private String id;
    private String usuarioId; // ID del usuario/empresa propietaria
    private String rutaId;
    private String remitente; // "ADMIN" o "CONDUCTOR"
    private String contenido;
    private LocalDateTime timestamp = LocalDateTime.now();
}
