package com.ecofleet.controller;

import com.ecofleet.model.Usuario;
import com.ecofleet.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/configuracion")
@RequiredArgsConstructor
public class ConfiguracionController {

    private final UsuarioRepository usuarioRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getConfiguracion(HttpServletRequest request) {
        String empresaId = (String) request.getAttribute("userId");
        return usuarioRepository.findById(empresaId)
                .map(u -> ResponseEntity.ok(Map.of(
                        "emailCuenta", u.getEmail(),
                        "emailNotificaciones", u.getEmailNotificaciones() != null ? u.getEmailNotificaciones() : "",
                        "nombreEmpresa", u.getNombreEmpresa() != null ? u.getNombreEmpresa() : u.getNombre()
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/email-notificaciones")
    public ResponseEntity<Map<String, String>> actualizarEmailNotificaciones(
            HttpServletRequest request,
            @RequestBody Map<String, String> body) {
        String empresaId = (String) request.getAttribute("userId");
        String nuevoEmail = body.getOrDefault("emailNotificaciones", "").trim();

        return usuarioRepository.findById(empresaId)
                .map(u -> {
                    u.setEmailNotificaciones(nuevoEmail.isEmpty() ? null : nuevoEmail);
                    usuarioRepository.save(u);
                    return ResponseEntity.ok(Map.of("mensaje", "Email de notificaciones actualizado"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
