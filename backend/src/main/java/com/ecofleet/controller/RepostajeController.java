package com.ecofleet.controller;

import com.ecofleet.model.Repostaje;
import com.ecofleet.repository.RepostajeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/repostajes")
public class RepostajeController {

    @Autowired
    private RepostajeRepository repostajeRepository;

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
