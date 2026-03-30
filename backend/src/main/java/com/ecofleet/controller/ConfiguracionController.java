package com.ecofleet.controller;

import com.ecofleet.model.Usuario;
import com.ecofleet.repository.UsuarioRepository;
import com.ecofleet.service.AlertaMantenimientoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/configuracion")
@CrossOrigin(origins = "*")
public class ConfiguracionController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AlertaMantenimientoService alertaService;

    @GetMapping
    public ResponseEntity<?> obtener(@RequestHeader(value = "X-User-Id", required = false) String usuarioId) {
        if (usuarioId == null) return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));

        return usuarioRepository.findById(usuarioId)
            .map(u -> ResponseEntity.ok(Map.of(
                "emailNotificaciones", u.getEmailNotificaciones() != null ? u.getEmailNotificaciones() : u.getEmail(),
                "alertasActivas",     u.isAlertasActivas(),
                "alertaITV",          u.isAlertaITV(),
                "alertaSeguro",       u.isAlertaSeguro(),
                "alertaRevision",     u.isAlertaRevision(),
                "alertaAceite",       u.isAlertaAceite(),
                "diasAlerta30",       u.getDiasAlerta30() > 0 ? u.getDiasAlerta30() : 30,
                "diasAlerta7",        u.getDiasAlerta7() > 0 ? u.getDiasAlerta7() : 7,
                "diasAlerta1",        u.getDiasAlerta1() > 0 ? u.getDiasAlerta1() : 1,
                "emailConfigured",    alertaService.isEmailConfigured()
            )))
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping
    public ResponseEntity<?> actualizar(
            @RequestHeader(value = "X-User-Id", required = false) String usuarioId,
            @RequestBody Map<String, Object> body) {

        if (usuarioId == null) return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));

        Optional<Usuario> opt = usuarioRepository.findById(usuarioId);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Usuario u = opt.get();

        if (body.containsKey("emailNotificaciones")) u.setEmailNotificaciones((String) body.get("emailNotificaciones"));
        if (body.containsKey("alertasActivas"))  u.setAlertasActivas((Boolean) body.get("alertasActivas"));
        if (body.containsKey("alertaITV"))       u.setAlertaITV((Boolean) body.get("alertaITV"));
        if (body.containsKey("alertaSeguro"))    u.setAlertaSeguro((Boolean) body.get("alertaSeguro"));
        if (body.containsKey("alertaRevision"))  u.setAlertaRevision((Boolean) body.get("alertaRevision"));
        if (body.containsKey("alertaAceite"))    u.setAlertaAceite((Boolean) body.get("alertaAceite"));
        if (body.containsKey("diasAlerta30"))    u.setDiasAlerta30(((Number) body.get("diasAlerta30")).intValue());
        if (body.containsKey("diasAlerta7"))     u.setDiasAlerta7(((Number) body.get("diasAlerta7")).intValue());
        if (body.containsKey("diasAlerta1"))     u.setDiasAlerta1(((Number) body.get("diasAlerta1")).intValue());

        usuarioRepository.save(u);
        return ResponseEntity.ok(Map.of("message", "Configuración guardada"));
    }

    @PostMapping("/test-email")
    public ResponseEntity<?> testEmail(@RequestHeader(value = "X-User-Id", required = false) String usuarioId) {
        if (usuarioId == null) return ResponseEntity.status(401).body(Map.of("error", "No autenticado"));

        Optional<Usuario> opt = usuarioRepository.findById(usuarioId);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Usuario u = opt.get();
        String destino = u.getEmailNotificaciones() != null ? u.getEmailNotificaciones() : u.getEmail();

        try {
            alertaService.enviarEmailPrueba(destino, u.getNombreEmpresa() != null ? u.getNombreEmpresa() : u.getNombre());
            return ResponseEntity.ok(Map.of("message", "Email de prueba enviado a " + destino));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error enviando email: " + e.getMessage()));
        }
    }
}
