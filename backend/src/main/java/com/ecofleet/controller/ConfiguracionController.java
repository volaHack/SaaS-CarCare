package com.ecofleet.controller;

import com.ecofleet.model.ConfiguracionEmail;
import com.ecofleet.repository.ConfiguracionEmailRepository;
import com.ecofleet.repository.UsuarioRepository;
import com.ecofleet.service.EmailService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/configuracion")
public class ConfiguracionController {

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ConfiguracionEmailRepository configEmailRepo;
    @Autowired private EmailService emailService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getConfiguracion(HttpServletRequest request) {
        String empresaId = (String) request.getAttribute("userId");
        return usuarioRepository.findById(empresaId)
                .map(u -> {
                    Map<String, Object> resp = new HashMap<>();
                    resp.put("emailCuenta", u.getEmail());
                    resp.put("nombreEmpresa", u.getNombreEmpresa() != null ? u.getNombreEmpresa() : u.getNombre());

                    ConfiguracionEmail cfg = configEmailRepo.findByEmpresaId(empresaId).orElse(null);
                    boolean apiKeyConfigurada = cfg != null && cfg.getResendApiKey() != null && !cfg.getResendApiKey().isBlank();
                    resp.put("apiKeyConfigurada", apiKeyConfigurada);
                    resp.put("emailNotificaciones", cfg != null && cfg.getEmailNotificaciones() != null ? cfg.getEmailNotificaciones() : "");
                    return ResponseEntity.ok(resp);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/email")
    public ResponseEntity<Map<String, String>> actualizarConfig(
            HttpServletRequest request,
            @RequestBody Map<String, String> body) {
        String empresaId = (String) request.getAttribute("userId");

        ConfiguracionEmail cfg = configEmailRepo.findByEmpresaId(empresaId)
                .orElseGet(() -> {
                    ConfiguracionEmail c = new ConfiguracionEmail();
                    c.setEmpresaId(empresaId);
                    return c;
                });

        if (body.containsKey("resendApiKey")) {
            String val = body.get("resendApiKey").trim();
            cfg.setResendApiKey(val.isEmpty() ? null : val);
        }
        if (body.containsKey("emailNotificaciones")) {
            String val = body.get("emailNotificaciones").trim();
            cfg.setEmailNotificaciones(val.isEmpty() ? null : val);
        }

        configEmailRepo.save(cfg);
        return ResponseEntity.ok(Map.of("mensaje", "Configuracion actualizada"));
    }

    @PostMapping("/test-email")
    public ResponseEntity<Map<String, String>> testEmail(HttpServletRequest request) {
        String empresaId = (String) request.getAttribute("userId");
        ConfiguracionEmail cfg = configEmailRepo.findByEmpresaId(empresaId).orElse(null);

        if (cfg == null || cfg.getResendApiKey() == null || cfg.getResendApiKey().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Primero configura la API Key de Resend"));
        }

        String destino = cfg.getEmailNotificaciones() != null && !cfg.getEmailNotificaciones().isBlank()
                ? cfg.getEmailNotificaciones()
                : usuarioRepository.findById(empresaId).map(u -> u.getEmail()).orElse("");

        if (destino.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No hay email destino configurado"));
        }

        try {
            String html = "<div style='font-family:sans-serif;padding:2rem;background:#0d1117;color:#fff;border-radius:12px;'>" +
                    "<h2 style='color:#22c55e;'>Conexion exitosa</h2>" +
                    "<p>Tu configuracion de email en CarCare funciona correctamente.</p>" +
                    "<p style='color:#6b7280;font-size:0.85rem;'>Los reportes mensuales se enviaran a esta direccion.</p></div>";
            emailService.enviar(cfg.getResendApiKey(), destino, "CarCare - Test de conexion de email", html);
            return ResponseEntity.ok(Map.of("mensaje", "Email de prueba enviado a " + destino));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
