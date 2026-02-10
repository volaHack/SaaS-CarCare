package com.ecofleet.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
@Document(collection = "usuarios")
public class Usuario {
    @Id
    private String id;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es válido")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String password;

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    private String nombreEmpresa;
    
    private String fechaRegistro = java.time.LocalDate.now().toString();

    // Roles: STRICTLY "ADMIN" or "CONDUCTOR"
    private String role; 
    
    // For drivers, this stores the ID of the company (Admin) they belong to
    private String empresaId;
}
