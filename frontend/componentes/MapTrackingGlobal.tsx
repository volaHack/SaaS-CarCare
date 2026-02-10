"use client";

import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";

// Fix for default marker icons
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom car icon for online drivers (GPS activo en últimos 30 segundos)
const OnlineIcon = L.divIcon({
    html: `<div style="
        background: linear-gradient(135deg, #3bf63b, #22c55e);
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 20px rgba(59, 246, 59, 0.8), 0 0 40px rgba(59, 246, 59, 0.4);
        animation: pulse 1.5s infinite;
        display: flex;
        align-items: center;
        justify-content: center;
    "><div style='color: white; font-size: 14px;'>🚗</div></div>`,
    className: "custom-online-icon",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
});

// Idle icon - sin señal reciente (más de 30 segundos)
const IdleIcon = L.divIcon({
    html: `<div style="
        background: linear-gradient(135deg, #f59e0b, #d97706);
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
    "><div style='color: white; font-size: 12px;'>⏳</div></div>`,
    className: "custom-idle-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

// Offline icon - sin señal hace más de 2 minutos
const OfflineIcon = L.divIcon({
    html: `<div style="
        background: linear-gradient(135deg, #6b7280, #4b5563);
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 5px rgba(107, 114, 128, 0.3);
        opacity: 0.7;
    "></div>`,
    className: "custom-offline-icon",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

interface RutaConConductor {
    id?: string;
    origen: string;
    destino: string;
    estado: string;
    vehiculoId: string;
    latitudActual?: number;
    longitudActual?: number;
    latitudOrigen?: number;
    longitudOrigen?: number;
    fecha: string;
    ultimaActualizacionGPS?: string;
}

interface MapTrackingGlobalProps {
    rutasActivas: RutaConConductor[];
    onRutaClick?: (rutaId: string) => void;
}

// Helper function para calcular tiempo transcurrido
// Si hay GPS activo pero no timestamp, significa que el conductor está online
function getTimeAgo(isoTimestamp: string | undefined, hasActiveGPS: boolean = false): { text: string; seconds: number; status: 'online' | 'idle' | 'offline' } {
    // Si hay GPS activo pero no hay timestamp, consideramos que está online
    if (!isoTimestamp && hasActiveGPS) {
        return { text: 'GPS Activo', seconds: 0, status: 'online' };
    }

    if (!isoTimestamp) {
        return { text: 'Sin señal', seconds: Infinity, status: 'offline' };
    }

    const now = new Date();
    const lastUpdate = new Date(isoTimestamp);
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    let status: 'online' | 'idle' | 'offline';
    if (diffSeconds <= 30) {
        status = 'online';
    } else if (diffSeconds <= 120) {
        status = 'idle';
    } else {
        status = 'offline';
    }

    let text: string;
    if (diffSeconds < 5) {
        text = 'Ahora mismo';
    } else if (diffSeconds < 60) {
        text = `Hace ${diffSeconds}s`;
    } else if (diffSeconds < 3600) {
        const mins = Math.floor(diffSeconds / 60);
        text = `Hace ${mins} min`;
    } else if (diffSeconds < 86400) {
        const hours = Math.floor(diffSeconds / 3600);
        text = `Hace ${hours}h`;
    } else {
        const days = Math.floor(diffSeconds / 86400);
        text = `Hace ${days}d`;
    }

    return { text, seconds: diffSeconds, status };
}

// Formato de hora legible
function formatTimestamp(isoTimestamp: string | undefined): string {
    if (!isoTimestamp) return 'N/A';
    const date = new Date(isoTimestamp);
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

function FitBounds({ positions }: { positions: [number, number][] }) {
    const map = useMap();

    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
    }, [positions, map]);

    return null;
}

export default function MapTrackingGlobal({ rutasActivas, onRutaClick }: MapTrackingGlobalProps) {
    // Filtrar rutas con coordenadas válidas
    const rutasConGPS = rutasActivas.filter(r =>
        (r.latitudActual && r.longitudActual) || (r.latitudOrigen && r.longitudOrigen)
    );

    // Obtener todas las posiciones para ajustar el mapa
    const allPositions: [number, number][] = rutasConGPS.map(r => {
        if (r.latitudActual && r.longitudActual) {
            return [r.latitudActual, r.longitudActual];
        }
        return [r.latitudOrigen || 40.4168, r.longitudOrigen || -3.7038];
    });

    // Centro por defecto (España)
    const defaultCenter: [number, number] = [40.4168, -3.7038];
    const center = allPositions.length > 0
        ? [
            allPositions.reduce((sum, p) => sum + p[0], 0) / allPositions.length,
            allPositions.reduce((sum, p) => sum + p[1], 0) / allPositions.length
        ] as [number, number]
        : defaultCenter;

    return (
        <MapContainer
            center={center}
            zoom={6}
            style={{
                height: "100%",
                width: "100%",
                borderRadius: "16px",
                border: "2px solid rgba(255,255,255,0.1)"
            }}
            attributionControl={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {rutasConGPS.map(ruta => {
                const hasRealGPS = !!(ruta.latitudActual && ruta.longitudActual);
                const position: [number, number] = hasRealGPS
                    ? [ruta.latitudActual!, ruta.longitudActual!]
                    : [ruta.latitudOrigen || 40.4168, ruta.longitudOrigen || -3.7038];

                const isEnCurso = ruta.estado === 'EN_CURSO';
                const timeAgo = getTimeAgo(ruta.ultimaActualizacionGPS, hasRealGPS);

                // Seleccionar icono según estado de conexión
                let icon = OfflineIcon;
                if (isEnCurso && hasRealGPS) {
                    if (timeAgo.status === 'online') {
                        icon = OnlineIcon;
                    } else if (timeAgo.status === 'idle') {
                        icon = IdleIcon;
                    }
                }

                // Color del estado
                const statusColors = {
                    online: '#22c55e',
                    idle: '#f59e0b',
                    offline: '#6b7280'
                };
                const statusLabels = {
                    online: '🟢 ONLINE',
                    idle: '🟡 ESPERANDO',
                    offline: '⚫ OFFLINE'
                };

                return (
                    <Marker
                        key={ruta.id}
                        position={position}
                        icon={icon}
                        eventHandlers={{
                            click: () => ruta.id && onRutaClick && onRutaClick(ruta.id)
                        }}
                    >
                        {/* Tooltip que aparece al hacer hover */}
                        <Tooltip
                            permanent={false}
                            direction="top"
                            offset={[0, -15]}
                            opacity={0.98}
                            className="custom-tooltip"
                        >
                            <div style={{
                                minWidth: '200px',
                                padding: '8px',
                                fontSize: '0.8rem',
                                lineHeight: '1.5',
                                background: 'white',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}>
                                {/* Estado con badge */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '8px',
                                    paddingBottom: '8px',
                                    borderBottom: `2px solid ${statusColors[timeAgo.status]}`
                                }}>
                                    <div style={{
                                        fontWeight: 'bold',
                                        color: '#1f2937',
                                        fontSize: '0.9rem'
                                    }}>
                                        {ruta.estado === 'EN_CURSO' ? '🚗 Conductor' : '📍 En Espera'}
                                    </div>
                                    <div style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        background: statusColors[timeAgo.status],
                                        color: 'white',
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase'
                                    }}>
                                        {timeAgo.status === 'online' ? 'ONLINE' :
                                            timeAgo.status === 'idle' ? 'INACTIVO' : 'OFFLINE'}
                                    </div>
                                </div>

                                {/* Ruta */}
                                <div style={{
                                    color: '#374151',
                                    marginBottom: '6px',
                                    fontSize: '0.85rem'
                                }}>
                                    <strong>{ruta.origen}</strong>
                                    <span style={{ margin: '0 4px', color: '#9ca3af' }}>→</span>
                                    <strong>{ruta.destino}</strong>
                                </div>

                                {/* Timestamp info */}
                                <div style={{
                                    marginTop: '8px',
                                    padding: '6px 8px',
                                    background: `${statusColors[timeAgo.status]}10`,
                                    borderRadius: '6px',
                                    borderLeft: `3px solid ${statusColors[timeAgo.status]}`
                                }}>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: '#6b7280',
                                        marginBottom: '2px'
                                    }}>
                                        📡 Última señal GPS
                                    </div>
                                    <div style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold',
                                        color: statusColors[timeAgo.status]
                                    }}>
                                        {timeAgo.text}
                                    </div>
                                    {ruta.ultimaActualizacionGPS && (
                                        <div style={{
                                            fontSize: '0.7rem',
                                            color: '#9ca3af',
                                            marginTop: '2px'
                                        }}>
                                            🕐 {formatTimestamp(ruta.ultimaActualizacionGPS)}
                                        </div>
                                    )}
                                </div>

                                {/* Indicador de GPS activo */}
                                {hasRealGPS && (
                                    <div style={{
                                        marginTop: '6px',
                                        fontSize: '0.7rem',
                                        color: '#22c55e',
                                        textAlign: 'center',
                                        fontWeight: '600'
                                    }}>
                                        ✓ GPS Conectado
                                    </div>
                                )}
                            </div>
                        </Tooltip>

                        {/* Popup con más detalles al hacer click */}
                        <Popup>
                            <div style={{ color: '#000', minWidth: '220px' }}>
                                {/* Header con estado */}
                                <div style={{
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    marginBottom: '0.6rem',
                                    borderBottom: '2px solid',
                                    borderColor: statusColors[timeAgo.status],
                                    paddingBottom: '0.5rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span>{isEnCurso ? '🚗 Conductor' : '📍 En Espera'}</span>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        background: statusColors[timeAgo.status],
                                        color: 'white'
                                    }}>
                                        {timeAgo.status.toUpperCase()}
                                    </span>
                                </div>

                                {/* Info de ruta */}
                                <div style={{ fontSize: '0.85rem', color: '#333', marginBottom: '0.5rem' }}>
                                    <div><strong>Ruta:</strong> {ruta.origen} → {ruta.destino}</div>
                                    <div><strong>Vehículo:</strong> #{ruta.vehiculoId?.slice(-6) || 'N/A'}</div>
                                    <div><strong>Estado:</strong>
                                        <span style={{
                                            color: isEnCurso ? '#22c55e' : '#f59e0b',
                                            fontWeight: 'bold'
                                        }}>
                                            {' '}{ruta.estado}
                                        </span>
                                    </div>
                                </div>

                                {/* Timestamp box */}
                                <div style={{
                                    marginTop: '0.6rem',
                                    padding: '0.5rem',
                                    background: 'linear-gradient(135deg, rgba(0,0,0,0.03), rgba(0,0,0,0.08))',
                                    borderRadius: '8px',
                                    border: `1px solid ${statusColors[timeAgo.status]}40`
                                }}>
                                    <div style={{
                                        fontSize: '0.7rem',
                                        color: '#666',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        marginBottom: '4px'
                                    }}>
                                        📡 Última Conexión Satelital
                                    </div>
                                    <div style={{
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold',
                                        color: statusColors[timeAgo.status]
                                    }}>
                                        {timeAgo.text}
                                    </div>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: '#888',
                                        marginTop: '2px'
                                    }}>
                                        {formatTimestamp(ruta.ultimaActualizacionGPS)}
                                    </div>
                                </div>

                                {/* Coordenadas GPS */}
                                {hasRealGPS && (
                                    <div style={{
                                        marginTop: '0.5rem',
                                        fontSize: '0.7rem',
                                        color: '#22c55e',
                                        background: 'rgba(34, 197, 94, 0.1)',
                                        padding: '0.4rem',
                                        borderRadius: '4px',
                                        textAlign: 'center',
                                        fontFamily: 'monospace'
                                    }}>
                                        📍 {position[0].toFixed(6)}, {position[1].toFixed(6)}
                                    </div>
                                )}

                                {/* Botón */}
                                <button
                                    onClick={() => ruta.id && onRutaClick && onRutaClick(ruta.id)}
                                    style={{
                                        marginTop: '0.6rem',
                                        width: '100%',
                                        padding: '0.5rem',
                                        background: 'linear-gradient(135deg, #3bf63b, #22c55e)',
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        boxShadow: '0 2px 8px rgba(59, 246, 59, 0.3)'
                                    }}
                                >
                                    Ver Detalles de la Ruta →
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}

            {allPositions.length > 1 && <FitBounds positions={allPositions} />}
        </MapContainer>
    );
}
