package com.ecofleet.controller;

import com.ecofleet.model.Mantenimiento;
import com.ecofleet.model.MantenimientoCorrectivo;
import com.ecofleet.model.MantenimientoPreventivo;
import com.ecofleet.repository.MantenimientoCorrectivoRepository;
import com.ecofleet.repository.MantenimientoPreventivoRepository;
import com.ecofleet.repository.MantenimientoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/mantenimientos")
public class MantenimientoController {

    @Autowired
    private MantenimientoRepository mantenimientoRepository;

    @Autowired
    private MantenimientoPreventivoRepository preventivoRepository;

    @Autowired
    private MantenimientoCorrectivoRepository correctivoRepository;

    @GetMapping
    public List<Object> obtenerTodos() {
        List<Object> todos = new ArrayList<>();
        todos.addAll(mantenimientoRepository.findAll());
        todos.addAll(preventivoRepository.findAll());
        todos.addAll(correctivoRepository.findAll());
        return todos;
    }

    @GetMapping("/vehiculo/{vehiculoId}")
    public List<Object> obtenerPorVehiculo(@PathVariable String vehiculoId) {
        List<Object> todos = new ArrayList<>();
        // Legacy data
        todos.addAll(mantenimientoRepository.findByVehiculoIdOrderByFechaDesc(vehiculoId));
        // New data
        todos.addAll(preventivoRepository.findByVehiculoIdOrderByFechaDesc(vehiculoId));
        addAllCorrectivosSorted(todos, vehiculoId);

        // Simple sort by date descend (pseudo-code, in real Java we'd use a better way)
        return todos;
    }

    private void addAllCorrectivosSorted(List<Object> list, String vehiculoId) {
        list.addAll(correctivoRepository.findByVehiculoIdOrderByFechaDesc(vehiculoId));
    }

    @PostMapping("/preventivo")
    public MantenimientoPreventivo crearPreventivo(@RequestBody MantenimientoPreventivo m) {
        return preventivoRepository.save(m);
    }

    @PostMapping("/correctivo")
    public MantenimientoCorrectivo crearCorrectivo(@RequestBody MantenimientoCorrectivo m) {
        return correctivoRepository.save(m);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id) {
        if (mantenimientoRepository.existsById(id)) {
            mantenimientoRepository.deleteById(id);
        } else if (preventivoRepository.existsById(id)) {
            preventivoRepository.deleteById(id);
        } else if (correctivoRepository.existsById(id)) {
            correctivoRepository.deleteById(id);
        } else {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
