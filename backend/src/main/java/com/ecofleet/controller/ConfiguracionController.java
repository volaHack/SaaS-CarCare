package com.ecofleet.controller;

import com.ecofleet.model.ConfiguracionEmail;
import com.ecofleet.repository.ConfiguracionEmailRepository;
import com.ecofleet.repository.UsuarioRepository;
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

    @GetMapping
    public ResponseEntity<Map<String, Object>> getConfiguracion(HttpServletRequest request) {
        String empresaId = (String) request.getAttribute("userId");
        return usuarioRepository.findById(empresaId)
                .map(u -> {
                    Map<String, Object> resp = new HashMap<>();
                    resp.put("emailCuenta", u.getEmail());
                    resp.put("nombreEmpresa", u.getNombreEmpresa() != null ? u.getNombreEmpresa() : u.getNombre());

                    ConfiguracionEmail cfg = configEmailRepo.findByEmpresaId(empresaId).orElse(null);
                    resp.put("smtpEmail", cfg != null && cfg.getSmtpEmail() != null ? cfg.getSmtpEmail() : "");
                    resp.put("smtpConfigurado", cfg != null && cfg.getSmtpEmail() != null && !cfg.getSmtpEmail().isBlank());
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

        if (body.containsKey("smtpEmail")) {
            String val = body.get("smtpEmail").trim();
            cfg.setSmtpEmail(val.isEmpty() ? null : val);
        }
        if (body.containsKey("smtpPassword")) {
            String val = body.get("smtpPassword").trim();
            cfg.setSmtpPassword(val.isEmpty() ? null : val);
        }
        if (body.containsKey("emailNotificaciones")) {
            String val = body.get("emailNotificaciones").trim();
            cfg.setEmailNotificaciones(val.isEmpty() ? null : val);
        }

        configEmailRepo.save(cfg);
        return ResponseEntity.ok(Map.of("mensaje", "Configuración actualizada"));
    }

    @PostMapping("/test-email")
    public ResponseEntity<Map<String, String>> testEmail(HttpServletRequest request) {
        String empresaId = (String) request.getAttribute("userId");
        ConfiguracionEmail cfg = configEmailRepo.findByEmpresaId(empresaId).orElse(null);

        if (cfg == null || cfg.getSmtpEmail() == null || cfg.getSmtpPassword() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Primero configurá el email y la contraseña de aplicación"));
        }

        try {
            org.springframework.mail.javamail.JavaMailSenderImpl sender = new org.springframework.mail.javamail.JavaMailSenderImpl();
            sender.setHost("smtp.gmail.com");
            sender.setPort(587);
            sender.setUsername(cfg.getSmtpEmail());
            sender.setPassword(cfg.getSmtpPassword());
            java.util.Properties props = sender.getJavaMailProperties();
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
            props.put("mail.smtp.connectiontimeout", "5000");
            props.put("mail.smtp.timeout", "5000");

            String destino = cfg.getEmailNotificaciones() != null && !cfg.getEmailNotificaciones().isBlank()
                    ? cfg.getEmailNotificaciones()
                    : usuarioRepository.findById(empresaId).map(u -> u.getEmail()).orElse(cfg.getSmtpEmail());

            jakarta.mail.internet.MimeMessage msg = sender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper =
                    new org.springframework.mail.javamail.MimeMessageHelper(msg, true, "UTF-8");
            helper.setTo(destino);
            helper.setSubject("✅ CarCare — Test de conexión de email");
            helper.setText("<div style='font-family:sans-serif;padding:2rem;background:#0d1117;color:#fff;border-radius:12px;'>" +
                    "<h2 style='color:#22c55e;'>✅ Conexión exitosa</h2>" +
                    "<p>Tu configuración de email en CarCare funciona correctamente.</p>" +
                    "<p style='color:#6b7280;font-size:0.85rem;'>Los reportes mensuales se enviarán a esta dirección.</p></div>", true);
            sender.send(msg);
            return ResponseEntity.ok(Map.of("mensaje", "Email de prueba enviado a " + destino));
        } catch (Exception e) {
            String causa = e.getMessage();
            if (causa != null && causa.contains("AuthenticationFailedException")) {
                causa = "Credenciales incorrectas. Verificá el email y la contraseña de aplicación.";
            }
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error al enviar: " + causa));
        }
    }
}
