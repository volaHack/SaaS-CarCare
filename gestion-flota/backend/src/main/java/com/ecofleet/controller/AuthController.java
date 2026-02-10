package com.ecofleet.controller;

import com.ecofleet.model.Usuario;
import com.ecofleet.model.Conductor;
import com.ecofleet.repository.UsuarioRepository;
import com.ecofleet.repository.ConductorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Controlador de autenticación.
 * 
 * ENDPOINTS:
 * - POST /api/auth/register → Registro de ADMINS (colección: usuarios)
 * - POST /api/auth/login → Login de ADMINS (colección: usuarios)
 * - POST /api/auth/register/conductor → Registro de CONDUCTORES (colección:
 * conductores)
 * - POST /api/auth/login/conductor → Login de CONDUCTORES (colección:
 * conductores)
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ConductorRepository conductorRepository;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // ═══════════════════════════════════════════════════════════════════════════
    // ADMINISTRADORES (Colección: usuarios)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Registro de administradores/empresas.
     * Guarda en colección: usuarios
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerAdmin(@Valid @RequestBody Usuario usuario) {
        logger.info("═══ REGISTRO ADMIN ═══");
        logger.info("Email: {}", usuario.getEmail());

        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            logger.warn("Email ya registrado: {}", usuario.getEmail());
            return ResponseEntity.badRequest().body(Map.of("error", "El email ya está registrado"));
        }

        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        usuario.setRole("ADMIN");

        Usuario saved = usuarioRepository.save(usuario);
        logger.info("✓ Admin registrado | ID: {}", saved.getId());

        return ResponseEntity.ok(Map.of(
                "message", "Empresa registrada correctamente",
                "id", saved.getId()));
    }

    /**
     * Login de administradores.
     * Busca en colección: usuarios
     */
    @PostMapping("/login")
    public ResponseEntity<?> loginAdmin(@RequestBody Map<String, String> credentials) {
        logger.info("═══ LOGIN ADMIN ═══");

        String email = credentials.get("email");
        String password = credentials.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email y contraseña son obligatorios"));
        }

        logger.info("Buscando admin: {}", email);
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email.trim());

        if (usuarioOpt.isEmpty()) {
            logger.warn("Admin no encontrado: {}", email);
            return ResponseEntity.status(401).body(Map.of("error", "Credenciales inválidas"));
        }

        Usuario usuario = usuarioOpt.get();

        if (passwordEncoder.matches(password, usuario.getPassword())) {
            logger.info("✓ Login admin exitoso: {}", email);

            Map<String, Object> response = new HashMap<>();
            response.put("id", usuario.getId());
            response.put("email", usuario.getEmail());
            response.put("nombre", usuario.getNombre());
            response.put("nombreEmpresa", usuario.getNombreEmpresa());
            response.put("role", "ADMIN");
            response.put("empresaId", null);

            return ResponseEntity.ok(response);
        } else {
            logger.warn("Contraseña incorrecta para admin: {}", email);
            return ResponseEntity.status(401).body(Map.of("error", "Credenciales inválidas"));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CONDUCTORES (Colección: conductores)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Registro de conductores.
     * Guarda en colección: conductores
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "UP", "version", "1.0.1", "collection", "conductores"));
    }

    /**
     * Registro de conductores.
     * Guarda en colección: conductores
     */
    @PostMapping("/register/conductor")
    public ResponseEntity<?> registerConductor(@RequestBody Map<String, String> payload) {
        try {
            logger.info("═══ REGISTRO CONDUCTOR ═══");

            String email = payload.get("email");
            String password = payload.get("password");
            String nombre = payload.get("nombre");
            String empresaEmail = payload.get("empresaEmail");

            // Validaciones
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El email es obligatorio"));
            }
            if (password == null || password.length() < 6) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "La contraseña debe tener mínimo 6 caracteres"));
            }
            if (nombre == null || nombre.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El nombre es obligatorio"));
            }
            if (empresaEmail == null || empresaEmail.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El email de la empresa es obligatorio"));
            }

            email = email.trim().toLowerCase();
            empresaEmail = empresaEmail.trim().toLowerCase();

            // Verificar que no exista
            if (conductorRepository.existsByEmail(email)) {
                logger.warn("Conductor ya existe: {}", email);
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Este email ya está registrado como conductor"));
            }

            // Buscar la empresa (admin)
            logger.info("Buscando empresa: {}", empresaEmail);
            Optional<Usuario> adminOpt = usuarioRepository.findByEmail(empresaEmail);
            if (adminOpt.isEmpty()) {
                logger.error("Empresa no encontrada: {}", empresaEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "No existe ninguna empresa con ese email"));
            }

            Usuario admin = adminOpt.get();
            if (admin.getRole() != null && !admin.getRole().equalsIgnoreCase("ADMIN")) {
                logger.warn("Usuario encontrado pero rol incorrecto: {}", admin.getRole());
                // Permisivo: si está en la tabla de usuarios, lo tratamos como empresa
                // return ResponseEntity.badRequest().body(Map.of("error", "El email no
                // corresponde a una cuenta de empresa"));
            }

            // Crear conductor
            Conductor conductor = new Conductor();
            conductor.setEmail(email);
            conductor.setPassword(passwordEncoder.encode(password));
            conductor.setNombre(nombre.trim());
            conductor.setEmpresaId(admin.getId());
            conductor.setNombreEmpresa(admin.getNombreEmpresa());
            conductor.setActivo(true);

            Conductor saved = conductorRepository.save(conductor);

            logger.info("✓ CONDUCTOR REGISTRADO");
            logger.info("  ID: {}", saved.getId());
            logger.info("  Email: {}", saved.getEmail());
            logger.info("  Empresa: {}", saved.getNombreEmpresa());

            return ResponseEntity.ok(Map.of(
                    "message", "Conductor registrado correctamente",
                    "conductorId", saved.getId(),
                    "nombreEmpresa", saved.getNombreEmpresa() != null ? saved.getNombreEmpresa() : ""));
        } catch (Exception e) {
            logger.error("Error en registro de conductor: ", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }

    /**
     * Login de conductores (Android).
     * Busca en colección: conductores
     */
    @PostMapping("/login/conductor")
    public ResponseEntity<?> loginConductor(@RequestBody Map<String, String> credentials) {
        logger.info("═══ LOGIN CONDUCTOR ═══");

        String email = credentials.get("email");
        String password = credentials.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email y contraseña son obligatorios"));
        }

        email = email.trim().toLowerCase();
        logger.info("Buscando conductor: {}", email);

        Optional<Conductor> conductorOpt = conductorRepository.findByEmail(email);

        if (conductorOpt.isEmpty()) {
            logger.warn("Conductor no encontrado: {}", email);
            return ResponseEntity.status(401).body(Map.of("error", "Credenciales inválidas"));
        }

        Conductor conductor = conductorOpt.get();

        // Verificar si está activo
        if (!conductor.isActivo()) {
            logger.warn("Conductor desactivado: {}", email);
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Tu cuenta ha sido desactivada. Contacta a tu empresa."));
        }

        if (passwordEncoder.matches(password, conductor.getPassword())) {
            logger.info("✓ Login conductor exitoso: {}", email);

            Map<String, Object> response = new HashMap<>();
            response.put("id", conductor.getId());
            response.put("email", conductor.getEmail());
            response.put("nombre", conductor.getNombre());
            response.put("nombreEmpresa", conductor.getNombreEmpresa());
            response.put("role", "CONDUCTOR");
            response.put("empresaId", conductor.getEmpresaId());

            return ResponseEntity.ok(response);
        } else {
            logger.warn("Contraseña incorrecta para conductor: {}", email);
            return ResponseEntity.status(401).body(Map.of("error", "Credenciales inválidas"));
        }
    }
}
