package com.ecofleet.controller;

import com.ecofleet.model.Repostaje;
import com.ecofleet.model.Vehiculo;
import com.ecofleet.repository.RepostajeRepository;
import com.ecofleet.repository.VehiculoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/repostajes")
public class RepostajeController {

    @Autowired
    private RepostajeRepository repostajeRepository;

    @Autowired
    private VehiculoRepository vehiculoRepository;

    // Obtener todos los repostajes del usuario (via sus vehículos)
    @GetMapping
    public List<Repostaje> obtenerRepostajes(@RequestHeader(value = "X-User-Id", required = false) String usuarioId) {
        if (usuarioId != null) {
            List<Vehiculo> vehiculos = vehiculoRepository.findByUsuarioId(usuarioId);
            List<Repostaje> todos = new ArrayList<>();
            for (Vehiculo v : vehiculos) {
                todos.addAll(repostajeRepository.findByVehiculoId(v.getId()));
            }
            return todos;
        }
        return repostajeRepository.findAll();
    }

    @GetMapping("/vehiculo/{vehiculoId}")
    public List<Repostaje> obtenerRepostajesPorVehiculo(@PathVariable String vehiculoId) {
        return repostajeRepository.findByVehiculoId(vehiculoId);
    }

    @PostMapping
    public Repostaje crearRepostaje(@RequestBody Repostaje repostaje) {
        if (repostaje.getFecha() == null) {
            repostaje.setFecha(LocalDateTime.now());
        }
        return repostajeRepository.save(repostaje);
    }
}
