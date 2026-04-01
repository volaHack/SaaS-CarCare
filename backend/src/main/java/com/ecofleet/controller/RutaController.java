package com.ecofleet.controller;

import com.ecofleet.model.Conductor;
import com.ecofleet.model.Ruta;
import com.ecofleet.repository.ConductorRepository;
import com.ecofleet.repository.RutaRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.time.Instant;

@RestController
@RequestMapping("/api/rutas")
@CrossOrigin(origins = "*")
public class RutaController {

    @Autowired
    private RutaRepository rutaRepository;

    @Autowired
    private ConductorRepository conductorRepository;

    @GetMapping
    public List<Ruta> listarRutas(HttpServletRequest request) {
        String usuarioId = (String) request.getAttribute("userId");
        String role = (String) request.getAttribute("userRole");
        String conductorId = (String) request.getAttribute("conductorId");

        if ("CONDUCTOR".equals(role) && conductorId != null && !conductorId.isBlank()) {
            return rutaRepository.findByUsuarioIdAndConductorId(usuarioId, conductorId);
        }

        return rutaRepository.findByUsuarioId(usuarioId);
    }

    @PostMapping
    public Ruta crearRuta(@RequestBody Ruta ruta, HttpServletRequest request) {
        String usuarioId = (String) request.getAttribute("userId");
        String role = (String) request.getAttribute("userRole");
        if ("CONDUCTOR".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Los conductores no pueden crear rutas");
        }
        ruta.setUsuarioId(usuarioId);
        if (ruta.getEstado() == null) {
            ruta.setEstado("PLANIFICADA");
        }
        aplicarAsignacionConductor(ruta, ruta.getConductorId(), usuarioId);
        return rutaRepository.save(ruta);
    }
    
    @GetMapping("/vehiculo/{vehiculoId}")
    public List<Ruta> obtenerRutasPorVehiculo(@PathVariable String vehiculoId) {
        return rutaRepository.findByVehiculoId(vehiculoId);
    }

    @PutMapping("/{id}")
    public Ruta actualizarRuta(@PathVariable String id, @RequestBody Ruta rutaActualizada, HttpServletRequest request) {
        String usuarioId = (String) request.getAttribute("userId");
        String role = (String) request.getAttribute("userRole");
        String conductorId = (String) request.getAttribute("conductorId");

        return rutaRepository.findById(id)
                .map(ruta -> {
                    validarAccesoRuta(ruta, usuarioId, role, conductorId);

                    if (!"CONDUCTOR".equals(role)) {
                        if (rutaActualizada.getOrigen() != null) ruta.setOrigen(rutaActualizada.getOrigen());
                        if (rutaActualizada.getDestino() != null) ruta.setDestino(rutaActualizada.getDestino());
                        if (rutaActualizada.getDistanciaEstimadaKm() != null) ruta.setDistanciaEstimadaKm(rutaActualizada.getDistanciaEstimadaKm());
                        if (rutaActualizada.getVehiculoId() != null) ruta.setVehiculoId(rutaActualizada.getVehiculoId());
                        if (rutaActualizada.getFecha() != null) ruta.setFecha(rutaActualizada.getFecha());
                        if (rutaActualizada.getLatitudOrigen() != null) ruta.setLatitudOrigen(rutaActualizada.getLatitudOrigen());
                        if (rutaActualizada.getLongitudOrigen() != null) ruta.setLongitudOrigen(rutaActualizada.getLongitudOrigen());
                        if (rutaActualizada.getLatitudDestino() != null) ruta.setLatitudDestino(rutaActualizada.getLatitudDestino());
                        if (rutaActualizada.getLongitudDestino() != null) ruta.setLongitudDestino(rutaActualizada.getLongitudDestino());
                        if (rutaActualizada.getConductorId() != null || rutaActualizada.getConductorNombre() != null) {
                            aplicarAsignacionConductor(ruta, rutaActualizada.getConductorId(), usuarioId);
                        }
                    }

                    // Si se está iniciando la ruta (cambio a EN_CURSO) y no tiene posición GPS actual
                    // Inicializar con la posición de origen
                    if (rutaActualizada.getEstado() != null && 
                        "EN_CURSO".equals(rutaActualizada.getEstado()) && 
                        ruta.getLatitudActual() == null) {
                       
                        System.out.println("[RutaController] Iniciando ruta - ESPERANDO GPS REAL del dispositivo");
                        ruta.setLatitudActual(null);
                        ruta.setLongitudActual(null);
                    }
                    
                    if (rutaActualizada.getEstado() != null) {
                        ruta.setEstado(rutaActualizada.getEstado());
                        // Resetear detención al cambiar estado manualmente
                        if ("EN_CURSO".equals(rutaActualizada.getEstado())) {
                            ruta.setInicioDetencion(null);
                        }
                    }
                    
                    // Calcular velocidad y distancia si se reciben nuevas coordenadas GPS
                    if (rutaActualizada.getLatitudActual() != null && rutaActualizada.getLongitudActual() != null) {
                        Double latitudAnterior = ruta.getLatitudActual();
                        Double longitudAnterior = ruta.getLongitudActual();
                        String timestampAnterior = ruta.getUltimaActualizacionGPS();
                        
                        ruta.setLatitudActual(rutaActualizada.getLatitudActual());
                        ruta.setLongitudActual(rutaActualizada.getLongitudActual());
                        
                        String timestampActual = Instant.now().toString();
                        ruta.setUltimaActualizacionGPS(timestampActual);
                        
                        // Calcular velocidad si tenemos posición anterior
                        if (latitudAnterior != null && longitudAnterior != null && timestampAnterior != null) {
                            try {
                                double distanciaRecorrida = calcularDistancia(
                                    latitudAnterior, longitudAnterior,
                                    rutaActualizada.getLatitudActual(), rutaActualizada.getLongitudActual()
                                );
                                
                                Instant instanteAnterior = Instant.parse(timestampAnterior);
                                Instant instanteActual = Instant.parse(timestampActual);
                                double segundosTranscurridos = (instanteActual.toEpochMilli() - instanteAnterior.toEpochMilli()) / 1000.0;
                                double horasTranscurridas = segundosTranscurridos / 3600.0;
                                
                                if (horasTranscurridas > 0 && distanciaRecorrida > 0.001) {
                                    double velocidad = distanciaRecorrida / horasTranscurridas;
                                    velocidad = Math.max(0, Math.min(200, velocidad));
                                    ruta.setVelocidadActualKmh(velocidad);
                                } else {
                                    ruta.setVelocidadActualKmh(0.0);
                                }
                            } catch (Exception e) {
                                System.err.println("[RutaController] Error calculando velocidad en PUT: " + e.getMessage());
                                ruta.setVelocidadActualKmh(0.0);
                            }
                        } else {
                            ruta.setVelocidadActualKmh(0.0);
                        }
                        
                        // Calcular distancia restante al destino
                        if (ruta.getLatitudDestino() != null && ruta.getLongitudDestino() != null) {
                            double distanciaRestante = calcularDistancia(
                                rutaActualizada.getLatitudActual(), rutaActualizada.getLongitudActual(),
                                ruta.getLatitudDestino(), ruta.getLongitudDestino()
                            );
                            ruta.setDistanciaRestanteKm(distanciaRestante);
                        }
                        
                        // Calcular si está desviado
                        if (ruta.getLatitudOrigen() != null && ruta.getLongitudOrigen() != null &&
                            ruta.getLatitudDestino() != null && ruta.getLongitudDestino() != null &&
                            ruta.getDistanciaRestanteKm() != null) {
                            
                            double distanciaTotal = calcularDistancia(
                                ruta.getLatitudOrigen(), ruta.getLongitudOrigen(),
                                ruta.getLatitudDestino(), ruta.getLongitudDestino()
                            );
                            ruta.setDesviado(ruta.getDistanciaRestanteKm() > (distanciaTotal * 1.2));
                        }
                    }
                    
                    if (rutaActualizada.getDesviado() != null) ruta.setDesviado(rutaActualizada.getDesviado());
                    
                    return rutaRepository.save(ruta);
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ruta no encontrada"));
    }

    @GetMapping("/{id}")
    public Ruta obtenerRuta(@PathVariable String id, HttpServletRequest request) {
        String usuarioId = (String) request.getAttribute("userId");
        String role = (String) request.getAttribute("userRole");
        String conductorId = (String) request.getAttribute("conductorId");

        Ruta ruta = rutaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ruta no encontrada"));
        validarAccesoRuta(ruta, usuarioId, role, conductorId);
        return ruta;
    }

    // Endpoint específico para que Android envíe actualizaciones de GPS en tiempo real
    @PostMapping("/{id}/gps")
    public Ruta actualizarGPS(@PathVariable String id, @RequestBody GPSCoordinates gps) {
        System.out.println("[RutaController] 📱 GPS RECIBIDO de Android: " + gps);
        return rutaRepository.findById(id)
                .map(ruta -> {
                    // Guardar posición anterior para calcular velocidad
                    Double latitudAnterior = ruta.getLatitudActual();
                    Double longitudAnterior = ruta.getLongitudActual();
                    String timestampAnterior = ruta.getUltimaActualizacionGPS();

                    // Actualizar posición actual
                    ruta.setLatitudActual(gps.getLatitud());
                    ruta.setLongitudActual(gps.getLongitud());

                    // Guardar timestamp actual
                    String timestampActual = Instant.now().toString();
                    ruta.setUltimaActualizacionGPS(timestampActual);

                    // Calcular distancia recorrida desde última posición
                    double distanciaRecorrida = 0;

                    // Calcular velocidad si tenemos posición y timestamp anterior
                    if (latitudAnterior != null && longitudAnterior != null && timestampAnterior != null) {
                        try {
                            distanciaRecorrida = calcularDistancia(
                                latitudAnterior, longitudAnterior,
                                gps.getLatitud(), gps.getLongitud()
                            );

                            Instant instanteAnterior = Instant.parse(timestampAnterior);
                            Instant instanteActual = Instant.parse(timestampActual);
                            double segundosTranscurridos = (instanteActual.toEpochMilli() - instanteAnterior.toEpochMilli()) / 1000.0;
                            double horasTranscurridas = segundosTranscurridos / 3600.0;

                            if (horasTranscurridas > 0 && distanciaRecorrida > 0.001) {
                                double velocidad = distanciaRecorrida / horasTranscurridas;
                                velocidad = Math.max(0, Math.min(200, velocidad));
                                ruta.setVelocidadActualKmh(velocidad);
                            } else {
                                ruta.setVelocidadActualKmh(0.0);
                            }
                        } catch (Exception e) {
                            System.err.println("[RutaController] Error calculando velocidad: " + e.getMessage());
                            ruta.setVelocidadActualKmh(0.0);
                        }
                    } else {
                        ruta.setVelocidadActualKmh(0.0);
                    }

                    // ═══ DETECCIÓN DE INACTIVIDAD (5 min sin moverse) ═══
                    // Si la ruta está EN_CURSO o DETENIDO, evaluar movimiento
                    if ("EN_CURSO".equals(ruta.getEstado()) || "DETENIDO".equals(ruta.getEstado())) {
                        if (distanciaRecorrida > 0.005) { // Más de 5 metros = movimiento real
                            // Hay movimiento → si estaba DETENIDO, reactivar
                            if ("DETENIDO".equals(ruta.getEstado())) {
                                ruta.setEstado("EN_CURSO");
                                System.out.println("[RutaController] ▶ Ruta REACTIVADA - movimiento detectado");
                            }
                            // Resetear el timestamp de inicio de parada
                            ruta.setInicioDetencion(null);
                        } else {
                            // Sin movimiento significativo
                            if (ruta.getInicioDetencion() == null) {
                                // Primera detección de parada: marcar inicio
                                ruta.setInicioDetencion(timestampActual);
                            } else {
                                // Ya estaba parado: verificar si pasaron 5 minutos
                                try {
                                    Instant inicioParada = Instant.parse(ruta.getInicioDetencion());
                                    Instant ahora = Instant.parse(timestampActual);
                                    long segundosDetenido = (ahora.toEpochMilli() - inicioParada.toEpochMilli()) / 1000;

                                    if (segundosDetenido >= 300 && "EN_CURSO".equals(ruta.getEstado())) {
                                        ruta.setEstado("DETENIDO");
                                        System.out.println("[RutaController] ⏸ Ruta DETENIDA - " + segundosDetenido + "s sin movimiento");
                                    }
                                } catch (Exception e) {
                                    System.err.println("[RutaController] Error evaluando detencion: " + e.getMessage());
                                }
                            }
                        }
                    }

                    // Calcular distancia restante al destino
                    if (ruta.getLatitudDestino() != null && ruta.getLongitudDestino() != null) {
                        double distanciaRestante = calcularDistancia(
                            gps.getLatitud(), gps.getLongitud(),
                            ruta.getLatitudDestino(), ruta.getLongitudDestino()
                        );
                        ruta.setDistanciaRestanteKm(distanciaRestante);
                    }

                    // Calcular si está desviado
                    if (ruta.getLatitudOrigen() != null && ruta.getLongitudOrigen() != null &&
                        ruta.getLatitudDestino() != null && ruta.getLongitudDestino() != null) {

                        double distanciaTotal = calcularDistancia(
                            ruta.getLatitudOrigen(), ruta.getLongitudOrigen(),
                            ruta.getLatitudDestino(), ruta.getLongitudDestino()
                        );
                        double distanciaActualADestino = ruta.getDistanciaRestanteKm();

                        ruta.setDesviado(distanciaActualADestino > (distanciaTotal * 1.2));
                    }

                    return rutaRepository.save(ruta);
                })
                .orElse(null);
    }

    // Endpoint para obtener última ubicación conocida
    @GetMapping("/{id}/last-location")
    public GPSCoordinates obtenerUltimaUbicacion(@PathVariable String id) {
        return rutaRepository.findById(id)
                .map(ruta -> {
                    GPSCoordinates gps = new GPSCoordinates();
                    gps.setLatitud(ruta.getLatitudActual());
                    gps.setLongitud(ruta.getLongitudActual());
                    return gps;
                })
                .orElse(null);
    }

    // Endpoint para solicitar actualización de GPS al dispositivo móvil
    @PostMapping("/{id}/request-gps")
    public String solicitarGPSMovil(@PathVariable String id) {
        return "GPS_REQUEST_SENT";
    }

    @DeleteMapping("/{id}")
    public void eliminarRuta(@PathVariable String id, HttpServletRequest request) {
        String usuarioId = (String) request.getAttribute("userId");
        String role = (String) request.getAttribute("userRole");
        if ("CONDUCTOR".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Los conductores no pueden eliminar rutas");
        }
        Ruta ruta = rutaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ruta no encontrada"));
        validarAccesoRuta(ruta, usuarioId, role, null);
        rutaRepository.deleteById(id);
    }

    private void validarAccesoRuta(Ruta ruta, String usuarioId, String role, String conductorId) {
        if (ruta == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ruta no encontrada");
        }
        if (usuarioId == null || !usuarioId.equals(ruta.getUsuarioId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ruta fuera del alcance de la sesión");
        }
        if ("CONDUCTOR".equals(role)) {
            if (conductorId == null || conductorId.isBlank()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conductor no identificado");
            }
            if (!conductorId.equals(ruta.getConductorId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ruta no asignada a este conductor");
            }
        }
    }

    private void aplicarAsignacionConductor(Ruta ruta, String conductorId, String usuarioId) {
        if (conductorId == null) {
            return;
        }

        String conductorIdNormalizado = conductorId.trim();
        if (conductorIdNormalizado.isEmpty()) {
            ruta.setConductorId(null);
            ruta.setConductorNombre(null);
            return;
        }

        Conductor conductor = conductorRepository.findById(conductorIdNormalizado)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Conductor no encontrado"));

        if (!usuarioId.equals(conductor.getEmpresaId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El conductor no pertenece a esta empresa");
        }

        ruta.setConductorId(conductor.getId());
        ruta.setConductorNombre(conductor.getNombre());
    }

    // Clase interna para recibir coordenadas GPS
    public static class GPSCoordinates {
        private Double latitud;
        private Double longitud;
        
        public Double getLatitud() { return latitud; }
        public void setLatitud(Double latitud) { this.latitud = latitud; }
        public Double getLongitud() { return longitud; }
        public void setLongitud(Double longitud) { this.longitud = longitud; }
        
        @Override
        public String toString() {
            return String.format("GPS[lat=%.6f, lng=%.6f]", latitud, longitud);
        }
    }

    // Método para calcular distancia entre dos puntos GPS (fórmula de Haversine)
    private double calcularDistancia(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radio de la Tierra en kilómetros
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // distancia en kilómetros
    }
}
