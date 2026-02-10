package com.ecofleet.repository;

import com.ecofleet.model.Conductor;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio para operaciones CRUD de conductores.
 * Colección: conductores
 */
public interface ConductorRepository extends MongoRepository<Conductor, String> {
    
    // Buscar conductor por email
    Optional<Conductor> findByEmail(String email);
    
    // Verificar si existe email
    boolean existsByEmail(String email);
    
    // Buscar todos los conductores de una empresa
    List<Conductor> findByEmpresaId(String empresaId);
    
    // Buscar conductores activos de una empresa
    List<Conductor> findByEmpresaIdAndActivoTrue(String empresaId);
    
    // Contar conductores de una empresa
    long countByEmpresaId(String empresaId);
}
