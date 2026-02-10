package com.ecofleet.repository;

import com.ecofleet.model.Mantenimiento;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MantenimientoRepository extends MongoRepository<Mantenimiento, String> {
    List<Mantenimiento> findByVehiculoIdOrderByFechaDesc(String vehiculoId);
}
