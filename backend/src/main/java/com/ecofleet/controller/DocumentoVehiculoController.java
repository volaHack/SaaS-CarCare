package com.ecofleet.controller;

import com.ecofleet.model.DocumentoVehiculo;
import com.ecofleet.repository.DocumentoVehiculoRepository;
import com.ecofleet.repository.VehiculoRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documentos")
public class DocumentoVehiculoController {

    @Autowired
    private DocumentoVehiculoRepository documentoRepository;

    @Autowired
    private VehiculoRepository vehiculoRepository;

    // GET /api/documentos/vehiculo/{vehiculoId}
    @GetMapping("/vehiculo/{vehiculoId}")
    public List<DocumentoVehiculo> obtenerPorVehiculo(@PathVariable String vehiculoId) {
        return documentoRepository.findByVehiculoIdOrderByFechaVencimientoAsc(vehiculoId);
    }

    // POST /api/documentos
    @PostMapping
    public ResponseEntity<DocumentoVehiculo> crear(@RequestBody DocumentoVehiculo doc,
                                                    HttpServletRequest request) {
        String empresaId = (String) request.getAttribute("userId");

        // Verificar que el vehículo pertenece a esta empresa
        return vehiculoRepository.findById(doc.getVehiculoId())
                .filter(v -> empresaId.equals(v.getUsuarioId()))
                .map(v -> {
                    doc.setEmpresaId(empresaId);
                    doc.setVehiculoInfo(v.getMarca() + " " + v.getModelo() + " (" + v.getMatricula() + ")");
                    return ResponseEntity.ok(documentoRepository.save(doc));
                })
                .orElse(ResponseEntity.status(403).build());
    }

    // PUT /api/documentos/{id}
    @PutMapping("/{id}")
    public ResponseEntity<DocumentoVehiculo> actualizar(@PathVariable String id,
                                                         @RequestBody DocumentoVehiculo datos,
                                                         HttpServletRequest request) {
        String empresaId = (String) request.getAttribute("userId");

        return documentoRepository.findById(id)
                .filter(d -> empresaId.equals(d.getEmpresaId()))
                .map(d -> {
                    if (datos.getTipoDocumento() != null)    d.setTipoDocumento(datos.getTipoDocumento());
                    if (datos.getDescripcion() != null)      d.setDescripcion(datos.getDescripcion());
                    if (datos.getNumeroReferencia() != null) d.setNumeroReferencia(datos.getNumeroReferencia());
                    if (datos.getFechaEmision() != null)     d.setFechaEmision(datos.getFechaEmision());
                    if (datos.getFechaVencimiento() != null) d.setFechaVencimiento(datos.getFechaVencimiento());
                    if (datos.getNotas() != null)            d.setNotas(datos.getNotas());
                    return ResponseEntity.ok(documentoRepository.save(d));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE /api/documentos/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable String id, HttpServletRequest request) {
        String empresaId = (String) request.getAttribute("userId");

        return documentoRepository.findById(id)
                .filter(d -> empresaId.equals(d.getEmpresaId()))
                .map(d -> {
                    documentoRepository.delete(d);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
