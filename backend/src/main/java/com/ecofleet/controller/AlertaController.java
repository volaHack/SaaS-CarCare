package com.ecofleet.controller;

import com.ecofleet.model.Alerta;
import com.ecofleet.service.AlertaService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alertas")
public class AlertaController {

    @Autowired
    private AlertaService alertaService;

    // GET /api/alertas — alertas activas de la empresa autenticada
    @GetMapping
    public List<Alerta> getAlertas(HttpServletRequest request) {
        String empresaId = (String) request.getAttribute("userId");
        return alertaService.getAlertasActivas(empresaId);
    }

    // GET /api/alertas/count — número de alertas no leídas (para el badge)
    @GetMapping("/count")
    public Map<String, Long> getCount(HttpServletRequest request) {
        String empresaId = (String) request.getAttribute("userId");
        return Map.of("noLeidas", alertaService.getNoLeidas(empresaId));
    }

    // PUT /api/alertas/{id}/leer — marcar una alerta como leída
    @PutMapping("/{id}/leer")
    public ResponseEntity<Void> marcarLeida(@PathVariable String id) {
        alertaService.marcarLeida(id);
        return ResponseEntity.ok().build();
    }

    // PUT /api/alertas/leer-todas — marcar todas como leídas
    @PutMapping("/leer-todas")
    public ResponseEntity<Void> marcarTodasLeidas(HttpServletRequest request) {
        String empresaId = (String) request.getAttribute("userId");
        alertaService.marcarTodasLeidas(empresaId);
        return ResponseEntity.ok().build();
    }
}
