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

    // Google OAuth - stores Google sub (unique user ID)
    private String googleId;

    // ═══ CONFIGURACIÓN DE NOTIFICACIONES ═══
    private String emailNotificaciones;       // Email donde recibir alertas (puede diferir del email de login)
    private boolean alertasActivas = true;    // Activar/desactivar todas las alertas
    private boolean alertaITV = true;
    private boolean alertaSeguro = true;
    private boolean alertaRevision = true;
    private boolean alertaAceite = true;
    private int diasAlerta30 = 30;            // Umbrales configurables
    private int diasAlerta7 = 7;
    private int diasAlerta1 = 1;
}
