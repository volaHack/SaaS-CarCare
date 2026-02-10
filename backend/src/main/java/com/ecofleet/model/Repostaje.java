package com.ecofleet.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "repostajes")
public class Repostaje {
    @Id
    private String id;

    private LocalDateTime fecha;
    private Double litros;
    private Double precioPorLitro;
    private Double costeTotal;
    private Double kilometrajeActual;

    // En Mongo almacenamos el ID del vehiculo como referencia
    private String vehiculoId;
}
