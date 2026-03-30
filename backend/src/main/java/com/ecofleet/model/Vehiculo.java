package com.ecofleet.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "vehiculos")
public class Vehiculo {
    @Id
    private String id; // En Mongo los IDs suelen ser Strings (ObjectIds)

    private String usuarioId; // ID del usuario/empresa propietaria

    private String matricula;
    private String modelo;
    private String marca;
    private Double kilometraje;
    private Double combustibleActual;
    private String tipoCombustible;
    
    
    private Boolean activo;

    // ═══ MANTENIMIENTO ═══
    // Fechas en formato "YYYY-MM-DD"
    private String fechaITV;           // Próxima ITV obligatoria
    private String fechaSeguro;        // Vencimiento del seguro
    private String fechaRevision;      // Próxima revisión general
    private String fechaCambioAceite;  // Próximo cambio de aceite (por fecha)
    private Double kmCambioAceite;     // Próximo cambio de aceite (por km)
    private String notasMantenimiento;
}
