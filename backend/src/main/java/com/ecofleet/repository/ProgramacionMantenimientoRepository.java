package com.ecofleet.repository;

import com.ecofleet.model.ProgramacionMantenimiento;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ProgramacionMantenimientoRepository extends MongoRepository<ProgramacionMantenimiento, String> {

    List<ProgramacionMantenimiento> findByVehiculoIdAndActivoTrueOrderByNombreAsc(String vehiculoId);

    List<ProgramacionMantenimiento> findByVehiculoIdOrderByNombreAsc(String vehiculoId);

    List<ProgramacionMantenimiento> findByEmpresaIdAndActivoTrue(String empresaId);
}
