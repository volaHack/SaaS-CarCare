package com.ecofleet.controller;

import com.ecofleet.service.ReporteService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService reporteService;

    @PostMapping("/enviar")
    public ResponseEntity<Map<String, String>> enviarReporte(HttpServletRequest request) {
        String empresaId = (String) request.getAttribute("userId");
        try {
            reporteService.enviarReporte(empresaId);
            return ResponseEntity.ok(Map.of("mensaje", "Reporte enviado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "No se pudo enviar el reporte: " + e.getMessage()));
        }
    }
}
