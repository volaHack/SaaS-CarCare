package com.ecofleet.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@Document(collection = "documentos_vehiculo")
public class DocumentoVehiculo {
    @Id
    private String id;

    private String vehiculoId;
    private String empresaId;

    // ITV | SEGURO | PERMISO_CIRCULACION | TARJETA_TRANSPORTE | OTRO
    private String tipoDocumento;

    private String descripcion;       // "Seguro a todo riesgo — Mapfre", etc.
    private String numeroReferencia;  // Número de póliza, expediente, etc.

    private LocalDate fechaEmision;
    private LocalDate fechaVencimiento;

    private String notas;

    // Metadata desnormalizada para alertas (evita joins en el scheduler)
    private String vehiculoInfo;  // "Marca Modelo (matrícula)"
}
