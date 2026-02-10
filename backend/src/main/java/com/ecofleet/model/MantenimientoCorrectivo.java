package com.ecofleet.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.util.List;

@Data
@Document(collection = "mantenimientos_correctivos")
public class MantenimientoCorrectivo {
    @Id
    private String id;

    private String vehiculoId;
    private String tipo = "CORRECTIVO";
    private String descripcion;
    private LocalDate fecha;
    private Double kilometrajeRealizado;
    private Double costo;
    private Mantenimiento.Taller taller;
    private List<Mantenimiento.Repuesto> repuestos;
    private String observaciones;
}
