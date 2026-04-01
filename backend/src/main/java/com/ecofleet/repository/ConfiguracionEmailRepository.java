package com.ecofleet.repository;

import com.ecofleet.model.ConfiguracionEmail;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ConfiguracionEmailRepository extends MongoRepository<ConfiguracionEmail, String> {
    Optional<ConfiguracionEmail> findByEmpresaId(String empresaId);
}
