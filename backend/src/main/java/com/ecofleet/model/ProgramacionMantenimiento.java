package com.ecofleet.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@Document(collection = "programaciones_mantenimiento")
public class ProgramacionMantenimiento {
    @Id
    private String id;

    private String vehiculoId;
    private String empresaId;

    private String nombre;        // "Cambio de aceite", "Revisión de frenos", etc.
    private String descripcion;

    // POR_KM | POR_TIEMPO | AMBOS (el que llegue primero dispara la alerta)
    private String tipoIntervalo;

    // Intervalo por kilómetros
    private Double intervaloKm;          // Cada cuántos km (ej: 15000)
    private Double ultimoKmRealizado;    // Km del vehículo cuando se hizo la última vez

    // Intervalo por tiempo
    private Integer intervaloMeses;      // Cada cuántos meses (ej: 6)
    private LocalDate ultimaFechaRealizado;  // Fecha de la última realización

    private boolean activo = true;

    // Metadata desnormalizada para alertas
    private String vehiculoInfo;  // "Marca Modelo (matrícula)"

    // ── Cálculos para el scheduler ──────────────────────────────────────────

    /** Próximo km en el que toca mantenimiento */
    public Double getProximoKm() {
        if (intervaloKm == null || intervaloKm <= 0) return null;
        double base = (ultimoKmRealizado != null && ultimoKmRealizado > 0) ? ultimoKmRealizado : 0;
        return base + intervaloKm;
    }

    /** Próxima fecha en la que toca mantenimiento */
    public LocalDate getProximaFecha() {
        if (intervaloMeses == null || intervaloMeses <= 0) return null;
        LocalDate base = (ultimaFechaRealizado != null) ? ultimaFechaRealizado : LocalDate.now();
        return base.plusMonths(intervaloMeses);
    }
}
