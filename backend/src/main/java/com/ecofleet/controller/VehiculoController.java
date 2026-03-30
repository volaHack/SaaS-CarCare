package com.ecofleet.controller;

import com.ecofleet.model.Vehiculo;
import com.ecofleet.repository.VehiculoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehiculos")
@CrossOrigin(origins = "*")
public class VehiculoController {

    @Autowired
    private VehiculoRepository vehiculoRepository;

    @GetMapping
    public List<Vehiculo> obtenerTodos(@RequestHeader(value = "X-User-Id", required = false) String usuarioId) {
        if (usuarioId != null) {
            return vehiculoRepository.findByUsuarioId(usuarioId);
        }
        return vehiculoRepository.findAll();
    }

    @PostMapping
    public Vehiculo crearVehiculo(@RequestBody Vehiculo vehiculo, 
                                 @RequestHeader(value = "X-User-Id", required = false) String usuarioId) {
        if (usuarioId != null) {
            vehiculo.setUsuarioId(usuarioId);
        }
        return vehiculoRepository.save(vehiculo);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vehiculo> obtenerVehiculo(@PathVariable String id) {
        return vehiculoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vehiculo> actualizarVehiculo(@PathVariable String id, @RequestBody Vehiculo datos) {
        return vehiculoRepository.findById(id).map(v -> {
            if (datos.getMatricula() != null)         v.setMatricula(datos.getMatricula());
            if (datos.getMarca() != null)             v.setMarca(datos.getMarca());
            if (datos.getModelo() != null)            v.setModelo(datos.getModelo());
            if (datos.getKilometraje() != null)       v.setKilometraje(datos.getKilometraje());
            if (datos.getCombustibleActual() != null) v.setCombustibleActual(datos.getCombustibleActual());
            if (datos.getTipoCombustible() != null)   v.setTipoCombustible(datos.getTipoCombustible());
            if (datos.getActivo() != null)            v.setActivo(datos.getActivo());
            // Mantenimiento
            v.setFechaITV(datos.getFechaITV());
            v.setFechaSeguro(datos.getFechaSeguro());
            v.setFechaRevision(datos.getFechaRevision());
            v.setFechaCambioAceite(datos.getFechaCambioAceite());
            v.setKmCambioAceite(datos.getKmCambioAceite());
            v.setNotasMantenimiento(datos.getNotasMantenimiento());
            return ResponseEntity.ok(vehiculoRepository.save(v));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarVehiculo(@PathVariable String id) {
        if (vehiculoRepository.existsById(id)) {
            vehiculoRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
