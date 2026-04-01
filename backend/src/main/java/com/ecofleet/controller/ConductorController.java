package com.ecofleet.controller;

import com.ecofleet.model.Conductor;
import com.ecofleet.repository.ConductorRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/conductores")
@CrossOrigin(origins = "*")
public class ConductorController {

    @Autowired
    private ConductorRepository conductorRepository;

    /**
     * Lista los conductores activos de la empresa del administrador autenticado.
     * Solo accesible por rol ADMIN.
     */
    @GetMapping
    public ResponseEntity<?> listarConductores(HttpServletRequest request) {
        String role = (String) request.getAttribute("userRole");
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(Map.of("error", "Solo administradores pueden listar conductores"));
        }

        String empresaId = (String) request.getAttribute("userId");
        List<Conductor> conductores = conductorRepository.findByEmpresaIdAndActivoTrue(empresaId);

        List<Map<String, String>> result = conductores.stream()
                .map(c -> Map.of(
                        "id", c.getId(),
                        "nombre", c.getNombre() != null ? c.getNombre() : "",
                        "email", c.getEmail() != null ? c.getEmail() : ""
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
