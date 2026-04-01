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

    /**
     * GET /api/reportes/costes?vehiculoId=xxx&periodo=2026-03
     * Calcula el TCO (Total Cost of Ownership) de un vehículo:
     * combustible + mantenimiento + estimación de amortización.
     */
    @GetMapping("/costes")
    public ResponseEntity<?> getCostesVehiculo(
            HttpServletRequest request,
            @RequestParam String vehiculoId,
            @RequestParam(required = false) String periodo) {
        String empresaId = (String) request.getAttribute("userId");
        try {
            Map<String, Object> costes = reporteService.calcularCostesVehiculo(empresaId, vehiculoId, periodo);
            return ResponseEntity.ok(costes);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error calculando costes: " + e.getMessage()));
        }
    }

    /**
     * GET /api/reportes/flota/kpis
     * KPIs de la flota completa: coste/km por vehículo, tendencia mensual (últimos 6 meses),
     * ranking de vehículos más costosos.
     */
    @GetMapping("/flota/kpis")
    public ResponseEntity<?> getFlotaKpis(HttpServletRequest request) {
        String empresaId = (String) request.getAttribute("userId");
        try {
            Map<String, Object> kpis = reporteService.calcularFlotaKpis(empresaId);
            return ResponseEntity.ok(kpis);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error calculando KPIs de flota: " + e.getMessage()));
        }
    }
}
