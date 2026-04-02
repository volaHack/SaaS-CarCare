package com.ecofleet.controller;

import com.ecofleet.model.Repostaje;
import com.ecofleet.model.Vehiculo;
import com.ecofleet.repository.ConductorRepository;
import com.ecofleet.repository.RepostajeRepository;
import com.ecofleet.repository.VehiculoRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/repostajes")
@CrossOrigin(origins = "*")
public class RepostajeController {

    @Autowired private RepostajeRepository repostajeRepository;
    @Autowired private VehiculoRepository vehiculoRepository;
    @Autowired private ConductorRepository conductorRepository;

    /**
     * GET /api/repostajes
     * Devuelve todos los repostajes de la empresa autenticada,
     * recopilando por vehículo para garantizar el scope multi-tenant.
     */
    @GetMapping
    public List<Repostaje> obtenerRepostajes(HttpServletRequest request) {
        String usuarioId = (String) request.getAttribute("userId");
        List<Vehiculo> vehiculos = vehiculoRepository.findByUsuarioId(usuarioId);
        List<Repostaje> todos = new ArrayList<>();
        for (Vehiculo v : vehiculos) {
            todos.addAll(repostajeRepository.findByVehiculoId(v.getId()));
        }
        return todos;
    }

    /**
     * GET /api/repostajes/vehiculo/{vehiculoId}
     * Devuelve los repostajes de un vehículo específico.
     * Valida que el vehículo pertenezca a la empresa del token.
     */
    @GetMapping("/vehiculo/{vehiculoId}")
    public ResponseEntity<?> obtenerRepostajesPorVehiculo(
            @PathVariable String vehiculoId,
            HttpServletRequest request) {
        String usuarioId = (String) request.getAttribute("userId");

        Optional<Vehiculo> vehiculoOpt = vehiculoRepository.findById(vehiculoId);
        if (vehiculoOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!vehiculoOpt.get().getUsuarioId().equals(usuarioId)) {
            return ResponseEntity.status(403).body("Acceso denegado");
        }

        return ResponseEntity.ok(repostajeRepository.findByVehiculoId(vehiculoId));
    }

    /**
     * POST /api/repostajes
     * Registra un nuevo repostaje.
     * - Valida que el vehículo pertenezca a la empresa del token.
     * - Si el token es de un CONDUCTOR, asigna su ID automáticamente.
     * - Auto-computa costeTotal si no se envía.
     * - Actualiza combustibleActual y kilometraje del vehículo.
     */
    @PostMapping
    public ResponseEntity<?> crearRepostaje(
            @RequestBody Repostaje repostaje,
            HttpServletRequest request) {
        String usuarioId = (String) request.getAttribute("userId");
        String role      = (String) request.getAttribute("userRole");
        String conductorId = (String) request.getAttribute("conductorId");

        if (repostaje.getVehiculoId() == null || repostaje.getVehiculoId().isBlank()) {
            return ResponseEntity.badRequest().body("El campo vehiculoId es requerido");
        }

        Optional<Vehiculo> vehiculoOpt = vehiculoRepository.findById(repostaje.getVehiculoId());
        if (vehiculoOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Vehiculo vehiculo = vehiculoOpt.get();
        if (!vehiculo.getUsuarioId().equals(usuarioId)) {
            return ResponseEntity.status(403).body("Acceso denegado: el vehículo no pertenece a esta empresa");
        }

        // Si es CONDUCTOR, el conductorId siempre viene del JWT (no del body)
        if ("CONDUCTOR".equals(role) && conductorId != null) {
            repostaje.setConductorId(conductorId);
            // Enriquecer con nombre del conductor
            conductorRepository.findById(conductorId).ifPresent(c ->
                repostaje.setConductorNombre(c.getNombre())
            );
        }

        // Auto-calcular costeTotal si se proporcionan litros y precio
        if (repostaje.getCosteTotal() == null
                && repostaje.getLitros() != null
                && repostaje.getPrecioPorLitro() != null) {
            double coste = Math.round(repostaje.getLitros() * repostaje.getPrecioPorLitro() * 100.0) / 100.0;
            repostaje.setCosteTotal(coste);
        }

        if (repostaje.getFecha() == null) {
            repostaje.setFecha(LocalDateTime.now());
        }

        Repostaje saved = repostajeRepository.save(repostaje);

        // ── Actualizar vehículo ──────────────────────────────────────────────
        boolean vehiculoModificado = false;

        // 1. Sumar litros al combustible actual
        if (repostaje.getLitros() != null && repostaje.getLitros() > 0) {
            double combustibleActual = vehiculo.getCombustibleActual() != null ? vehiculo.getCombustibleActual() : 0;
            vehiculo.setCombustibleActual(combustibleActual + repostaje.getLitros());
            vehiculoModificado = true;
        }

        // 2. Actualizar kilometraje si el repostaje reporta uno mayor al actual
        if (repostaje.getKilometrajeActual() != null && repostaje.getKilometrajeActual() > 0) {
            double kmActual = vehiculo.getKilometraje() != null ? vehiculo.getKilometraje() : 0;
            if (repostaje.getKilometrajeActual() > kmActual) {
                vehiculo.setKilometraje(repostaje.getKilometrajeActual());
                vehiculoModificado = true;
            }
        }

        if (vehiculoModificado) {
            vehiculoRepository.save(vehiculo);
        }

        return ResponseEntity.ok(saved);
    }

    /**
     * DELETE /api/repostajes/{id}
     * Elimina un repostaje. Valida que pertenezca a la empresa del token.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarRepostaje(
            @PathVariable String id,
            HttpServletRequest request) {
        String usuarioId = (String) request.getAttribute("userId");
        String role      = (String) request.getAttribute("userRole");

        Optional<Repostaje> repostajeOpt = repostajeRepository.findById(id);
        if (repostajeOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Repostaje repostaje = repostajeOpt.get();

        // Verificar propiedad a través del vehículo
        if (repostaje.getVehiculoId() != null) {
            Optional<Vehiculo> vehiculoOpt = vehiculoRepository.findById(repostaje.getVehiculoId());
            if (vehiculoOpt.isPresent() && !vehiculoOpt.get().getUsuarioId().equals(usuarioId)) {
                return ResponseEntity.status(403).body("Acceso denegado");
            }
        }

        // Conductores solo pueden eliminar sus propios registros
        if ("CONDUCTOR".equals(role)) {
            String conductorId = (String) request.getAttribute("conductorId");
            if (conductorId == null || !conductorId.equals(repostaje.getConductorId())) {
                return ResponseEntity.status(403).body("Solo puedes eliminar tus propios repostajes");
            }
        }

        repostajeRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
