package com.ecofleet.service;

import com.ecofleet.model.*;
import com.ecofleet.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class AlertaService {

    private static final Logger log = LoggerFactory.getLogger(AlertaService.class);

    @Autowired private AlertaRepository alertaRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private VehiculoRepository vehiculoRepository;
    @Autowired private RutaRepository rutaRepository;
    @Autowired private MantenimientoPreventivoRepository preventivoRepo;
    @Autowired private MantenimientoCorrectivoRepository correctivoRepo;

    // ═══════════════════════════════════════════════════════════════
    // SCHEDULER — corre cada 5 minutos
    // ═══════════════════════════════════════════════════════════════
    @Scheduled(fixedDelay = 300000, initialDelay = 15000)
    public void verificarCondiciones() {
        log.info("[Alertas] Iniciando verificación de condiciones...");
        List<Usuario> empresas = usuarioRepository.findAll();

        for (Usuario empresa : empresas) {
            try {
                procesarEmpresa(empresa);
            } catch (Exception e) {
                log.error("[Alertas] Error procesando empresa {}: {}", empresa.getId(), e.getMessage());
            }
        }

        // Limpiar alertas resueltas de más de 7 días
        alertaRepository.deleteByResueltaTrueAndTimestampBefore(LocalDateTime.now().minusDays(7));
        log.info("[Alertas] Verificación completada para {} empresas", empresas.size());
    }

    private void procesarEmpresa(Usuario empresa) {
        String empresaId = empresa.getId();
        List<Vehiculo> vehiculos = vehiculoRepository.findByUsuarioId(empresaId);
        List<Ruta> rutas = rutaRepository.findByUsuarioId(empresaId);

        // 1. Calcular las grupoKeys actualmente activas
        Set<String> grupoKeysActivos = new HashSet<>();

        for (Vehiculo v : vehiculos) {
            if (v.getKilometraje() == null) continue;

            // Buscar el mantenimiento preventivo más reciente con proximoMantenimiento
            List<MantenimientoPreventivo> preventivos =
                    preventivoRepo.findByVehiculoIdOrderByFechaDesc(v.getId());

            double proximoKm = -1;
            for (MantenimientoPreventivo p : preventivos) {
                if (p.getProximoMantenimiento() != null && p.getProximoMantenimiento() > 0) {
                    proximoKm = p.getProximoMantenimiento();
                    break;
                }
            }

            if (proximoKm > 0) {
                double km = v.getKilometraje();
                String info = v.getMarca() + " " + v.getModelo() + " (" + v.getMatricula() + ")";

                if (km >= proximoKm) {
                    String key = "mant_crit_" + v.getId();
                    grupoKeysActivos.add(key);
                    crearSiNoExiste(key, empresaId, "MANTENIMIENTO", "CRITICAL",
                            "Mantenimiento vencido — " + info,
                            String.format("Superó en %.0f km el límite de mantenimiento programado (%.0f km)", km - proximoKm, proximoKm),
                            v.getId(), null, info);
                    // Si había WARNING para este vehículo, resolverlo
                    resolverSiExiste("mant_warn_" + v.getId());

                } else if (km >= proximoKm - 1000) {
                    String key = "mant_warn_" + v.getId();
                    grupoKeysActivos.add(key);
                    crearSiNoExiste(key, empresaId, "MANTENIMIENTO", "WARNING",
                            "Mantenimiento próximo — " + info,
                            String.format("Quedan %.0f km para el próximo mantenimiento programado (%.0f km)", proximoKm - km, proximoKm),
                            v.getId(), null, info);
                }
            }
        }

        for (Ruta r : rutas) {
            if (r.getEstado() == null) continue;
            String label = r.getOrigen() + " → " + r.getDestino();

            if ("DETENIDO".equals(r.getEstado())) {
                String key = "detenida_" + r.getId();
                grupoKeysActivos.add(key);
                String duracion = "";
                if (r.getInicioDetencion() != null) {
                    try {
                        long secs = (Instant.now().toEpochMilli() - Instant.parse(r.getInicioDetencion()).toEpochMilli()) / 1000;
                        long mins = secs / 60;
                        duracion = mins > 0 ? " · " + mins + " minutos parado" : "";
                    } catch (Exception ignored) {}
                }
                crearSiNoExiste(key, empresaId, "RUTA_DETENIDA", "WARNING",
                        "Ruta detenida — " + label,
                        "El vehículo lleva tiempo parado sin movimiento" + duracion,
                        r.getVehiculoId(), r.getId(), label);
            } else {
                resolverSiExiste("detenida_" + r.getId());
            }

            if (Boolean.TRUE.equals(r.getDesviado()) && "EN_CURSO".equals(r.getEstado())) {
                String key = "desviada_" + r.getId();
                grupoKeysActivos.add(key);
                crearSiNoExiste(key, empresaId, "RUTA_DESVIADA", "WARNING",
                        "Conductor desviado — " + label,
                        "El vehículo se salió del corredor de la ruta planificada",
                        r.getVehiculoId(), r.getId(), label);
            } else {
                resolverSiExiste("desviada_" + r.getId());
            }

            if ("EN_CURSO".equals(r.getEstado()) && r.getUltimaActualizacionGPS() != null) {
                try {
                    long secsDesdeGPS = (Instant.now().toEpochMilli() -
                            Instant.parse(r.getUltimaActualizacionGPS()).toEpochMilli()) / 1000;
                    if (secsDesdeGPS > 600) { // Más de 10 minutos sin GPS
                        String key = "gps_" + r.getId();
                        grupoKeysActivos.add(key);
                        long mins = secsDesdeGPS / 60;
                        crearSiNoExiste(key, empresaId, "GPS_PERDIDO", "WARNING",
                                "Señal GPS perdida — " + label,
                                "Sin actualización GPS desde hace " + mins + " minutos",
                                r.getVehiculoId(), r.getId(), label);
                    } else {
                        resolverSiExiste("gps_" + r.getId());
                    }
                } catch (Exception ignored) {}
            } else if ("COMPLETADA".equals(r.getEstado())) {
                resolverSiExiste("gps_" + r.getId());
                resolverSiExiste("detenida_" + r.getId());
                resolverSiExiste("desviada_" + r.getId());
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════

    private void crearSiNoExiste(String grupoKey, String empresaId, String tipo, String severidad,
                                  String titulo, String descripcion,
                                  String vehiculoId, String rutaId, String vehiculoInfo) {
        if (alertaRepository.existsByGrupoKeyAndLeidaFalseAndResueltaFalse(grupoKey)) return;

        Alerta alerta = new Alerta();
        alerta.setGrupoKey(grupoKey);
        alerta.setEmpresaId(empresaId);
        alerta.setTipo(tipo);
        alerta.setSeveridad(severidad);
        alerta.setTitulo(titulo);
        alerta.setDescripcion(descripcion);
        alerta.setVehiculoId(vehiculoId);
        alerta.setRutaId(rutaId);
        alerta.setVehiculoInfo(vehiculoInfo);
        alerta.setTimestamp(LocalDateTime.now());
        alerta.setLeida(false);
        alerta.setResuelta(false);

        alertaRepository.save(alerta);
        log.info("[Alertas] Nueva alerta: {} — {}", severidad, titulo);
    }

    private void resolverSiExiste(String grupoKey) {
        Optional<Alerta> existing = alertaRepository.findByGrupoKeyAndResueltaFalse(grupoKey);
        existing.ifPresent(a -> {
            a.setResuelta(true);
            alertaRepository.save(a);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // ACCIONES DEL USUARIO
    // ═══════════════════════════════════════════════════════════════

    public List<Alerta> getAlertasActivas(String empresaId) {
        return alertaRepository.findByEmpresaIdAndResueltaFalseOrderByTimestampDesc(empresaId);
    }

    public long getNoLeidas(String empresaId) {
        return alertaRepository.countByEmpresaIdAndLeidaFalseAndResueltaFalse(empresaId);
    }

    public void marcarLeida(String alertaId) {
        alertaRepository.findById(alertaId).ifPresent(a -> {
            a.setLeida(true);
            alertaRepository.save(a);
        });
    }

    public void marcarTodasLeidas(String empresaId) {
        List<Alerta> noLeidas = alertaRepository.findByEmpresaIdAndLeidaFalseAndResueltaFalse(empresaId);
        noLeidas.forEach(a -> a.setLeida(true));
        alertaRepository.saveAll(noLeidas);
    }
}
