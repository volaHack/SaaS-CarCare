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
    private Double combustibleActual;   // Porcentaje del depósito (0–100%)
    private Double capacidadDeposito;   // Litros totales del depósito (ej: 60L)
    private Double consumoPor100km;     // Litros consumidos por cada 100 km (ej: 8.0)
    private String tipoCombustible;
    
    
    private Boolean activo; 
}
