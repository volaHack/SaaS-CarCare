"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const CarIcon = L.divIcon({
    html: `<div style="background-color: #3bf63b; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,255,0,0.5);"></div>`,
    className: "custom-car-icon",
    iconSize: [20, 20],
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], map.getZoom());
    }, [lat, lng]);
    return null;
}

interface MapTrackingProps {
    origin: [number, number];
    destination: [number, number];
    current: [number, number];
    isDeviated?: boolean;
    routeCoordinates?: [number, number][]; // Ruta calculada dinámicamente
}

export default function MapTracking({ origin, destination, current, isDeviated, routeCoordinates }: MapTrackingProps) {
    console.log('[MapTracking] 🚨 COORDENADAS RECIBIDAS:');
    console.log('- Origin:', origin);
    console.log('- Destination:', destination);  
    console.log('- Current (GPS):', current);
    console.log('- Is Deviated:', isDeviated);
    console.log('- Route Coordinates length:', routeCoordinates?.length);

    // SIMPLIFICADO: Usar coordenadas directamente sin validaciones complejas
    const useCurrent = current && current[0] !== 0 && current[1] !== 0;
    const carPosition = useCurrent ? current : origin;

    console.log('[MapTracking] 🚗 POSICIÓN DEL COCHE USADA:', carPosition);
    console.log('[MapTracking] 📡 ¿Usando GPS real?:', useCurrent);

    // Calcular bounds para mostrar todo: origen, destino y posición actual
    const allPoints = [origin, destination, carPosition];
    const bounds: [[number, number], [number, number]] = [
        [
            Math.min(...allPoints.map(p => p[0])),
            Math.min(...allPoints.map(p => p[1]))
        ],
        [
            Math.max(...allPoints.map(p => p[0])),
            Math.max(...allPoints.map(p => p[1]))
        ]
    ];

    return (
        <MapContainer
            bounds={bounds}
            boundsOptions={{ padding: [50, 50] }}
            style={{ height: "100%", width: "100%", borderRadius: "12px", border: "2px solid rgba(255,255,255,0.1)" }}
            attributionControl={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {/* Starting point */}
            <Marker position={origin}>
                <Popup>
                    <div style={{ color: '#000', fontWeight: 'bold' }}>
                        📍 Origen<br />
                        <span style={{ fontSize: '0.8em', color: '#666' }}>
                            {origin[0].toFixed(4)}, {origin[1].toFixed(4)}
                        </span>
                    </div>
                </Popup>
            </Marker>

            {/* Destination point */}
            <Marker position={destination}>
                <Popup>
                    <div style={{ color: '#000', fontWeight: 'bold' }}>
                        🏁 Destino<br />
                        <span style={{ fontSize: '0.8em', color: '#666' }}>
                            {destination[0].toFixed(4)}, {destination[1].toFixed(4)}
                        </span>
                    </div>
                </Popup>
            </Marker>

            {/* Current location (The car) - POSICIÓN REAL DEL DISPOSITIVO */}
            <Marker position={carPosition} icon={CarIcon}>
                <Popup>
                    <div style={{ color: '#000', fontWeight: 'bold' }}>
                        {isDeviated ? "⚠️ ¡DESVIADO DEL CAMINO!" : 
                         useCurrent ? "🚗 POSICIÓN REAL DEL DISPOSITIVO" : 
                         "📍 POSICIÓN ORIGEN (sin GPS)"}<br />
                        <span style={{ fontSize: '0.8em', color: '#666' }}>
                            {carPosition[0].toFixed(4)}, {carPosition[1].toFixed(4)}
                            <div style={{ 
                                color: useCurrent ? '#22c55e' : '#f59e0b', 
                                fontWeight: 'bold', 
                                marginTop: '4px' 
                            }}>
                                {useCurrent ? '✅ GPS REAL RECIBIDO' : '⏳ ESPERANDO GPS'}
                            </div>
                        </span>
                    </div>
                </Popup>
            </Marker>

            {/* Ruta dinámica calculada por calles */}
            {routeCoordinates && routeCoordinates.length > 0 ? (
                <Polyline
                    positions={routeCoordinates}
                    color={isDeviated ? "#ef4444" : "#3bf63b"}
                    weight={4}
                    opacity={0.8}
                />
            ) : (
                // Fallback: LÍNEA DIRECTA DESDE POSICIÓN REAL DEL DISPOSITIVO hasta destino
                <Polyline
                    positions={[carPosition, destination]}
                    color={isDeviated ? "#ef4444" : "#3bf63b"}
                    weight={4}
                    opacity={0.4}
                    dashArray="10, 10"
                />
            )}

            <RecenterMap lat={carPosition[0]} lng={carPosition[1]} />
        </MapContainer>
    );
}
