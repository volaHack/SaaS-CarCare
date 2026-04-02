package com.ecofleet.repository;

import com.ecofleet.model.DocumentoVehiculo;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;

public interface DocumentoVehiculoRepository extends MongoRepository<DocumentoVehiculo, String> {

    List<DocumentoVehiculo> findByVehiculoIdOrderByFechaVencimientoAsc(String vehiculoId);

    List<DocumentoVehiculo> findByEmpresaId(String empresaId);

    // Para el scheduler: documentos que vencen antes de una fecha dada
    List<DocumentoVehiculo> findByEmpresaIdAndFechaVencimientoBefore(String empresaId, LocalDate fecha);

    // Para el scheduler: documentos que vencen entre dos fechas
    List<DocumentoVehiculo> findByEmpresaIdAndFechaVencimientoBetween(String empresaId, LocalDate desde, LocalDate hasta);
}
