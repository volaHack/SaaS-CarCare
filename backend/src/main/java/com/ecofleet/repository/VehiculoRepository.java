package com.ecofleet.repository;

import com.ecofleet.model.Vehiculo;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VehiculoRepository extends MongoRepository<Vehiculo, String> {
    java.util.List<Vehiculo> findByUsuarioId(String usuarioId);
}
