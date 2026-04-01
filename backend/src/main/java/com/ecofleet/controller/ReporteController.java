package com.ecofleet.controller;

import com.ecofleet.service.ReporteService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

    @Autowired
    private ReporteService reporteService;

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
