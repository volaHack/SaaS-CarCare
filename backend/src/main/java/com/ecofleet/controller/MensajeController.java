package com.ecofleet.controller;

import com.ecofleet.model.Mensaje;
import com.ecofleet.repository.MensajeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mensajes")
@CrossOrigin(origins = "*")
public class MensajeController {

    @Autowired
    private MensajeRepository mensajeRepository;

    @GetMapping("/{rutaId}")
    public List<Mensaje> obtenerMensajes(@PathVariable String rutaId) {
        return mensajeRepository.findByRutaIdOrderByTimestampAsc(rutaId);
    }

    @PostMapping
    public Mensaje enviarMensaje(@RequestBody Mensaje mensaje, @RequestHeader(value = "X-User-Id", required = false) String usuarioId) {
        if (usuarioId != null) {
            mensaje.setUsuarioId(usuarioId);
        }
        return mensajeRepository.save(mensaje);
    }
}
