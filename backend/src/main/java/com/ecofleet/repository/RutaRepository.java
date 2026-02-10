package com.ecofleet.repository;

import com.ecofleet.model.Ruta;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RutaRepository extends MongoRepository<Ruta, String> {
    List<Ruta> findByUsuarioId(String usuarioId);
    List<Ruta> findByVehiculoId(String vehiculoId);
}
