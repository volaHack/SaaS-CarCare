package com.ecofleet.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.List;

@Data
@Document(collection = "mantenimientos")
public class Mantenimiento {
    @Id
    private String id;

    private String vehiculoId; // Referencia al vehículo
    private String tipo; // "PREVENTIVO" o "CORRECTIVO"
    private String descripcion;
    private LocalDate fecha;
    private Double kilometrajeRealizado;
    private Double costo;
    private Taller taller;
    private List<Repuesto> repuestos;
    private String observaciones;
    private Double proximoMantenimiento; // Próximo mantenimiento en km

    @Data
    public static class Taller {
        private String nombre;
        private String direccion;
        private String telefono;
    }

    @Data
    public static class Repuesto {
        private String nombre;
        private Integer cantidad;
        private Double costoUnitario;
    }
}
