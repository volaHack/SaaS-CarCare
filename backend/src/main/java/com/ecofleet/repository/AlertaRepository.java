package com.ecofleet.repository;

import com.ecofleet.model.Alerta;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AlertaRepository extends MongoRepository<Alerta, String> {

    // Todas las alertas activas (no resueltas) de una empresa, más recientes primero
    List<Alerta> findByEmpresaIdAndResueltaFalseOrderByTimestampDesc(String empresaId);

    // Alertas activas no leídas (para el badge de la campanita)
    long countByEmpresaIdAndLeidaFalseAndResueltaFalse(String empresaId);

    // Todas las alertas activas no resueltas (para el scheduler)
    List<Alerta> findByEmpresaIdAndResueltaFalse(String empresaId);

    // Comprobar si ya existe una alerta activa no resuelta para esta condición
    boolean existsByGrupoKeyAndLeidaFalseAndResueltaFalse(String grupoKey);

    // Para marcar como resuelta cuando la condición desaparece
    Optional<Alerta> findByGrupoKeyAndResueltaFalse(String grupoKey);

    // Para marcar todas las no leídas de una empresa como leídas
    List<Alerta> findByEmpresaIdAndLeidaFalseAndResueltaFalse(String empresaId);

    // Limpieza: eliminar alertas resueltas antiguas (>7 días)
    void deleteByResueltaTrueAndTimestampBefore(LocalDateTime cutoff);
}
