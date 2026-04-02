package com.ecofleet.controller;

import com.ecofleet.model.ProgramacionMantenimiento;
import com.ecofleet.repository.ProgramacionMantenimientoRepository;
import com.ecofleet.repository.VehiculoRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/programaciones")
public class ProgramacionMantenimientoController {

    @Autowired
    private ProgramacionMantenimientoRepository programacionRepository;

    @Autowired
    private VehiculoRepository vehiculoRepository;

    // GET /api/programaciones/vehiculo/{vehiculoId}
    @GetMapping("/vehiculo/{vehiculoId}")
    public List<ProgramacionMantenimiento> obtenerPorVehiculo(@PathVariable String vehiculoId) {
        return programacionRepository.findByVehiculoIdOrderByNombreAsc(vehiculoId);
    }

    // POST /api/programaciones
    @PostMapping
    public ResponseEntity<ProgramacionMantenimiento> crear(@RequestBody ProgramacionMantenimiento prog,
                                                            HttpServletRequest request) {
        String empresaId = (String) request.getAttribute("userId");

        return vehiculoRepository.findById(prog.getVehiculoId())
                .filter(v -> empresaId.equals(v.getUsuarioId()))
                .map(v -> {
                    prog.setEmpresaId(empresaId);
                    prog.setVehiculoInfo(v.getMarca() + " " + v.getModelo() + " (" + v.getMatricula() + ")");
                    // Si no se indicó último km, usar el kilometraje actual del vehículo
                    if (prog.getUltimoKmRealizado() == null && v.getKilometraje() != null) {
                        prog.setUltimoKmRealizado(v.getKilometraje());
                    }
                    return ResponseEntity.ok(programacionRepository.save(prog));
                })
                .orElse(ResponseEntity.status(403).build());
    }

    // PUT /api/programaciones/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ProgramacionMantenimiento> actualizar(@PathVariable String id,
                                                                 @RequestBody ProgramacionMantenimiento datos,
                                                                 HttpServletRequest request) {
        String empresaId = (String) request.getAttribute("userId");

        return programacionRepository.findById(id)
                .filter(p -> empresaId.equals(p.getEmpresaId()))
                .map(p -> {
                    if (datos.getNombre() != null)              p.setNombre(datos.getNombre());
                    if (datos.getDescripcion() != null)         p.setDescripcion(datos.getDescripcion());
                    if (datos.getTipoIntervalo() != null)       p.setTipoIntervalo(datos.getTipoIntervalo());
                    if (datos.getIntervaloKm() != null)         p.setIntervaloKm(datos.getIntervaloKm());
                    if (datos.getUltimoKmRealizado() != null)   p.setUltimoKmRealizado(datos.getUltimoKmRealizado());
                    if (datos.getIntervaloMeses() != null)      p.setIntervaloMeses(datos.getIntervaloMeses());
                    if (datos.getUltimaFechaRealizado() != null) p.setUltimaFechaRealizado(datos.getUltimaFechaRealizado());
                    return ResponseEntity.ok(programacionRepository.save(p));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // PUT /api/programaciones/{id}/marcar-realizado — Marca como realizado y resetea contadores
    @PutMapping("/{id}/marcar-realizado")
    public ResponseEntity<ProgramacionMantenimiento> marcarRealizado(@PathVariable String id,
                                                                      HttpServletRequest request) {
        String empresaId = (String) request.getAttribute("userId");

        return programacionRepository.findById(id)
                .filter(p -> empresaId.equals(p.getEmpresaId()))
                .map(p -> {
                    // Actualizar referencia al vehículo actual
                    vehiculoRepository.findById(p.getVehiculoId()).ifPresent(v -> {
                        if (v.getKilometraje() != null) {
                            p.setUltimoKmRealizado(v.getKilometraje());
                        }
                    });
                    p.setUltimaFechaRealizado(java.time.LocalDate.now());
                    return ResponseEntity.ok(programacionRepository.save(p));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/programaciones/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id, HttpServletRequest request) {
        String empresaId = (String) request.getAttribute("userId");

        return programacionRepository.findById(id)
                .filter(p -> empresaId.equals(p.getEmpresaId()))
                .map(p -> {
                    programacionRepository.delete(p);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
