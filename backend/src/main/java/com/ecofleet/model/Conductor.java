package com.ecofleet.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

/**
 * Modelo para conductores de la aplicación Android.
 * Se almacena en una colección separada de los administradores.
 */
@Data
@Document(collection = "conductores")
public class Conductor {
    
    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String password; // BCrypt encoded

    private String nombre;

    // ID del administrador/empresa al que pertenece
    private String empresaId;

    // Nombre de la empresa (denormalizado para UI)
    private String nombreEmpresa;

    private String fechaRegistro = java.time.LocalDate.now().toString();

    // Para poder desactivar conductores sin eliminarlos
    private boolean activo = true;

    // Licencia de conducir (opcional)
    private String licencia;

    // Teléfono de contacto (opcional)
    private String telefono;
}
