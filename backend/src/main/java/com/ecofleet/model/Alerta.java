package com.ecofleet.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "alertas")
public class Alerta {

    @Id
    private String id;

    private String empresaId;

    // MANTENIMIENTO | RUTA_DETENIDA | RUTA_DESVIADA | GPS_PERDIDO
    private String tipo;

    // WARNING | CRITICAL | INFO
    private String severidad;

    private String titulo;
    private String descripcion;

    private String vehiculoId;   // nullable
    private String rutaId;       // nullable
    private String vehiculoInfo; // "Marca Modelo (matrícula)" — desnormalizado para el frontend

    // Clave única por condición activa — evita duplicados
    private String grupoKey;

    private LocalDateTime timestamp;

    private boolean leida;     // el admin la leyó/descartó
    private boolean resuelta;  // la condición que la causó ya no existe
}
