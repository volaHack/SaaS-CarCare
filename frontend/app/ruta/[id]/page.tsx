"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import BackgroundMeteors from "@/componentes/BackgroundMeteors";
import styles from "../../dashboard/page.module.css";
import dynamic from "next/dynamic";
import ChatRuta from "@/componentes/ChatRuta";

const MapTracking = dynamic(() => import("@/componentes/MapTracking"), {
    ssr: false,
    loading: () => <div style={{ height: "400px", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>Cargando Mapa...</div>
});

interface Ruta {
    id: string;
    origen: string;
    destino: string;
    distanciaEstimadaKm: number;
    estado: string;
    vehiculoId: string;
    fecha: string;
    latitudOrigen: number;
    longitudOrigen: number;
    latitudDestino: number;
    longitudDestino: number;
    latitudActual: number;
    longitudActual: number;
    desviado: boolean;
    velocidadActualKmh?: number;
    distanciaRestanteKm?: number;
}

const API_URL = typeof window !== 'undefined' && window.location.hostname === '10.0.2.2'
    ? ''
    : (process.env.NEXT_PUBLIC_API_URL || "https://saas-carcare-production.up.railway.app");

export default function RutaTracking() {
    const router = useRouter();
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [ruta, setRuta] = useState<Ruta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null); // null = sin error, string = mensaje de error
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
    const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

    // useRef para mantener referencias correctamente entre renders
    const isMountedRef = useRef(true);
    const abortControllerRef = useRef<AbortController | null>(null);
    const previousStateRef = useRef<string | undefined>(undefined);

    // Helper to get auth headers
    const getAuthHeaders = useCallback((): Record<string, string> => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (typeof window === 'undefined') return headers;

        const userStr = localStorage.getItem("user");
        if (!userStr) return headers;

        try {
            const user = JSON.parse(userStr);
            if (user && user.id) {
                headers['X-User-Id'] = String(user.id);
            }
        } catch (e) {
            console.error("Error parsing user from localStorage", e);
        }
        return headers;
    }, []);

    const calcularRutaDinamica = useCallback(async (currentLat: number, currentLng: number, destLat: number, destLng: number) => {
        try {
            setIsCalculatingRoute(true);
            console.log('[RutaTracking] Calculando ruta dinámica desde:', { currentLat, currentLng }, 'hasta:', { destLat, destLng });

            const url = `https://router.project-osrm.org/route/v1/driving/${currentLng},${currentLat};${destLng},${destLat}?overview=full&geometries=geojson`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const coordinates = data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                console.log('[RutaTracking] Ruta calculada con', coordinates.length, 'puntos');
                setRouteCoordinates(coordinates);
            } else {
                console.warn('[RutaTracking] No se pudo calcular la ruta, usando línea directa');
                setRouteCoordinates([[currentLat, currentLng], [destLat, destLng]]);
            }
        } catch (error) {
            console.error('[RutaTracking] Error calculando ruta:', error);
            setRouteCoordinates([[currentLat, currentLng], [destLat, destLng]]);
        } finally {
            setIsCalculatingRoute(false);
        }
    }, []);

    const cargarDatos = useCallback(async () => {
        if (!isMountedRef.current) return;

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        try {
            console.log('[RutaTracking] Cargando datos de ruta:', id);
            const res = await fetch(`${API_URL}/api/rutas/${id}`, {
                signal: abortControllerRef.current.signal,
                headers: getAuthHeaders() as any
            });

            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('NOT_FOUND');
                }
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();

            // Si no hay datos, no es una ruta válida
            if (!data || !data.id) {
                throw new Error('NOT_FOUND');
            }

            console.log('[RutaTracking] Datos recibidos - Estado:', data.estado, '- GPS:', !!(data.latitudActual && data.longitudActual));

            // Calcular ruta según el estado
            if (data.estado === 'EN_CURSO') {
                if (data.latitudActual && data.longitudActual && data.latitudDestino && data.longitudDestino) {
                    console.log('[RutaTracking] ✅ GPS REAL detectado');
                    await calcularRutaDinamica(
                        data.latitudActual,
                        data.longitudActual,
                        data.latitudDestino,
                        data.longitudDestino
                    );
                } else {
                    console.log('[RutaTracking] ⏳ Esperando GPS...');
                    setRouteCoordinates([]);
                }
            } else if (data.estado === 'PLANIFICADA' && data.latitudOrigen && data.longitudOrigen && data.latitudDestino && data.longitudDestino) {
                await calcularRutaDinamica(
                    data.latitudOrigen,
                    data.longitudOrigen,
                    data.latitudDestino,
                    data.longitudDestino
                );
            }

            if (isMountedRef.current) {
                if (previousStateRef.current && previousStateRef.current !== 'EN_CURSO' && data.estado === 'EN_CURSO') {
                    console.log('🚀 ¡RUTA INICIADA!');
                }
                previousStateRef.current = data.estado;
                setRuta(data);
                setError(null); // Limpiar cualquier error previo
                setLoading(false);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                // Ignorar errores de abort, son normales al cancelar requests
                return;
            }

            console.error('[RutaTracking] Error cargando ruta:', err);

            if (isMountedRef.current) {
                // Solo establecer error si es un error real (no abort)
                if (err.message === 'NOT_FOUND') {
                    setError('Ruta no encontrada');
                } else {
                    // Para otros errores, no mostrar "no encontrada" inmediatamente
                    // puede ser un error de red temporal
                    console.warn('[RutaTracking] Error temporal, reintentando...');
                }
                setLoading(false);
            }
        }
    }, [id, calcularRutaDinamica, getAuthHeaders]);

    useEffect(() => {
        isMountedRef.current = true;

        // Cargar datos inmediatamente
        cargarDatos();

        // Actualizar cada 2 segundos
        const intervalId = setInterval(() => {
            if (isMountedRef.current) {
                cargarDatos();
            }
        }, 2000);

        return () => {
            isMountedRef.current = false;
            if (intervalId) clearInterval(intervalId);
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, [cargarDatos]);

    // Mostrar cargando mientras se obtienen datos por primera vez
    if (loading || (!ruta && !error)) {
        return (
            <BackgroundMeteors>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid rgba(59, 246, 59, 0.3)',
                        borderTop: '3px solid #3bf63b',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <span style={{ color: '#9ca3af' }}>Cargando ruta...</span>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </BackgroundMeteors>
        );
    }

    // Mostrar error solo si hay un error real (404)
    if (error) {
        return (
            <BackgroundMeteors>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    gap: '1rem'
                }}>
                    <span style={{ fontSize: '3rem' }}>🔍</span>
                    <span style={{ color: '#ef4444', fontSize: '1.2rem' }}>{error}</span>
                    <button
                        onClick={() => router.push('/')}
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #3bf63b, #22c55e)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Volver al Dashboard
                    </button>
                </div>
            </BackgroundMeteors>
        );
    }

    // Si llegamos aquí, ruta existe y no hay error
    if (!ruta) return null;

    return (
        <BackgroundMeteors>
            <main style={{ height: "100%", width: "100%", overflowY: "auto", position: "relative", zIndex: 20 }}>
                <div className={styles.container}>
                    <header className={styles.header} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <button
                                onClick={() => router.push("/")}
                                className={styles.navButton}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    width: '40px',
                                    height: '40px',
                                    padding: '0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '12px'
                                }}
                            >
                                ←
                            </button>
                            <div className={styles.title}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
                                    <span className={styles.badge} style={{
                                        background: ruta.estado === 'EN_CURSO' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(156, 163, 175, 0.1)',
                                        color: ruta.estado === 'EN_CURSO' ? '#60a5fa' : '#9ca3af',
                                        fontSize: '0.65rem'
                                    }}>
                                        RUTA #{ruta.id?.slice(-6).toUpperCase()}
                                    </span>

                                    {ruta.estado === 'EN_CURSO' && (
                                        <span className={styles.badge} style={{
                                            background: (ruta.latitudActual && ruta.longitudActual) ?
                                                'rgba(34, 197, 94, 0.2)' :
                                                'rgba(251, 191, 36, 0.2)',
                                            color: (ruta.latitudActual && ruta.longitudActual) ?
                                                '#22c55e' : '#f59e0b',
                                            fontSize: '0.6rem',
                                            fontWeight: '700'
                                        }}>
                                            {(ruta.latitudActual && ruta.longitudActual) ?
                                                '📡 GPS ACTIVO' :
                                                '⏳ ESPERANDO GPS'}
                                        </span>
                                    )}

                                    <span style={{ color: '#4b5563', fontSize: '0.8rem' }}>•</span>
                                    <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{ruta.fecha}</span>
                                </div>
                                <h1 style={{ fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-0.02em' }}>
                                    {ruta.origen} <span style={{ color: 'var(--accent)', opacity: 0.5 }}>➝</span> {ruta.destino}
                                </h1>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Vehículo Asignado</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3bf63b' }}></div>
                                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{ruta.vehiculoId}</span>
                            </div>
                        </div>
                    </header>

                    <div className={styles.rutasContainer} style={{ gridTemplateColumns: '1fr 350px', gap: '2rem', marginTop: '2rem' }}>
                        {/* Map Section */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className={styles.card} style={{ height: '600px', padding: '0', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                                <MapTracking
                                    origin={[ruta.latitudOrigen, ruta.longitudOrigen]}
                                    destination={[ruta.latitudDestino, ruta.longitudDestino]}
                                    current={[ruta.latitudActual, ruta.longitudActual]}
                                    isDeviated={ruta.desviado}
                                    routeCoordinates={routeCoordinates}
                                />
                            </div>

                            {/* Botón para Android */}
                            {typeof window !== 'undefined' && (window as any).AndroidTracker ? (
                                <button
                                    onClick={async () => {
                                        if (ruta?.estado === 'EN_CURSO') {
                                            (window as any).AndroidTracker.stopTracking();
                                            toast.success('📱 Tracking GPS detenido');
                                        } else {
                                            (window as any).AndroidTracker.startTracking(id);
                                            toast.success('📱 Tracking GPS iniciado');
                                        }
                                    }}
                                    style={{
                                        padding: '1.2rem 1.5rem',
                                        background: ruta?.estado === 'EN_CURSO'
                                            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))'
                                            : 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))',
                                        border: ruta?.estado === 'EN_CURSO'
                                            ? '2px solid rgba(239, 68, 68, 0.5)'
                                            : '2px solid rgba(34, 197, 94, 0.5)',
                                        borderRadius: '16px',
                                        fontSize: '1.1rem',
                                        color: ruta?.estado === 'EN_CURSO' ? '#ef4444' : '#22c55e',
                                        cursor: 'pointer',
                                        marginBottom: '1rem',
                                        width: '100%',
                                        fontWeight: '800'
                                    }}
                                >
                                    {ruta?.estado === 'EN_CURSO'
                                        ? '📱 DETENER TRACKING GPS ANDROID'
                                        : '📱 INICIAR TRACKING GPS ANDROID'}
                                </button>
                            ) : null}

                            {/* Indicador GPS */}
                            {ruta?.latitudActual && ruta?.longitudActual && (
                                <div style={{
                                    padding: '1rem 1.2rem',
                                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1))',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                    fontSize: '0.9rem',
                                    color: '#22c55e',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        backgroundColor: '#22c55e',
                                        animation: 'pulse 2s infinite'
                                    }}></div>
                                    <div>
                                        <div style={{ fontWeight: '700' }}>📡 GPS ACTIVO</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                            {ruta.latitudActual.toFixed(6)}, {ruta.longitudActual.toFixed(6)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className={styles.card} style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '600' }}>PROGRESS TRACKER</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: '700' }}>65% COMPLETE</span>
                                </div>
                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '65%', background: 'linear-gradient(to right, var(--accent), #3bf63b)', borderRadius: '4px', boxShadow: '0 0 15px var(--accent)' }}></div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem', fontSize: '0.75rem', color: '#4b5563' }}>
                                    <span>SALIDA: {ruta.origen}</span>
                                    <span>LLEGADA ESTIMADA: 45 MIN</span>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Stats */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className={styles.card} style={{ background: 'linear-gradient(145deg, rgba(30,30,40,0.95), rgba(20,20,25,0.95))' }}>
                                <h3 className={styles.cardTitle} style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                    Telemetría Real
                                </h3>

                                {ruta.desviado && (
                                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)', animation: 'pulse 2s infinite' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', fontSize: '0.85rem' }}>
                                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                            ALERTA DE DESVÍO
                                        </div>
                                        <p style={{ fontSize: '0.75rem', marginTop: '0.4rem', opacity: 0.8 }}>Trayectoria fuera de parámetros.</p>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {/* Velocidad Actual - DATOS REALES */}
                                    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <span style={{ display: 'block', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Velocidad Actual</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff' }}>
                                            {ruta.velocidadActualKmh !== undefined && ruta.velocidadActualKmh !== null
                                                ? ruta.velocidadActualKmh.toFixed(0)
                                                : '--'}
                                            {' '}
                                            <span style={{ fontSize: '0.8rem', color: '#4b5563' }}>KM/H</span>
                                        </span>
                                        {ruta.velocidadActualKmh === 0 && (
                                            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.3rem' }}>
                                                🟡 Vehículo detenido
                                            </div>
                                        )}
                                    </div>

                                    {/* Distancia Restante - DATOS REALES */}
                                    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <span style={{ display: 'block', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Distancia Restante</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff' }}>
                                            {ruta.distanciaRestanteKm !== undefined && ruta.distanciaRestanteKm !== null
                                                ? ruta.distanciaRestanteKm.toFixed(1)
                                                : (ruta.latitudActual && ruta.latitudDestino
                                                    ? ruta.distanciaEstimadaKm.toFixed(1)
                                                    : '--')}
                                            {' '}
                                            <span style={{ fontSize: '0.8rem', color: '#4b5563' }}>KM</span>
                                        </span>
                                        {ruta.distanciaRestanteKm !== undefined && ruta.distanciaRestanteKm < 1 && (
                                            <div style={{ fontSize: '0.7rem', color: '#22c55e', marginTop: '0.3rem' }}>
                                                🎯 Llegando al destino
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <span style={{ display: 'block', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Estado del Canal</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', animation: 'pulse 1s infinite' }}></div>
                                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#4ade80' }}>Conectado</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <button
                                        className={styles.submitButton}
                                        style={{
                                            height: '54px',
                                            fontSize: '1rem',
                                            backgroundColor: ruta.estado === 'EN_CURSO' ? 'rgba(239, 68, 68, 0.1)' : '#3bf63b',
                                            color: ruta.estado === 'EN_CURSO' ? '#ef4444' : '#000',
                                            border: ruta.estado === 'EN_CURSO' ? '1px solid #ef4444' : 'none',
                                            boxShadow: ruta.estado === 'EN_CURSO' ? 'none' : '0 10px 20px -5px rgba(59, 246, 59, 0.3)'
                                        }}
                                        onClick={async () => {
                                            const nuevoEstado = ruta.estado === 'EN_CURSO' ? 'PLANIFICADA' : 'EN_CURSO';

                                            if (typeof window !== 'undefined' && (window as any).AndroidTracker) {
                                                if (nuevoEstado === 'EN_CURSO') {
                                                    (window as any).AndroidTracker.startTracking(id);
                                                } else {
                                                    (window as any).AndroidTracker.stopTracking();
                                                }
                                            }

                                            await fetch(`${API_URL}/api/rutas/${id}`, {
                                                method: 'PUT',
                                                headers: getAuthHeaders() as any,
                                                body: JSON.stringify({ estado: nuevoEstado })
                                            });
                                            setRuta({ ...ruta, estado: nuevoEstado });
                                            toast.info(`Sistema ${nuevoEstado === 'EN_CURSO' ? 'Activado' : 'Desactivado'}`);
                                        }}
                                    >
                                        {ruta.estado === 'EN_CURSO' ? 'DETENER RASTREO' : 'ACTIVAR GPS / INICIAR'}
                                    </button>

                                    <button
                                        className={styles.navButton}
                                        style={{
                                            height: '50px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#fff',
                                            borderRadius: '12px',
                                            fontSize: '0.9rem',
                                            fontWeight: '600'
                                        }}
                                        onClick={() => toast.info("Canal de voz abierto con conductor...")}
                                    >
                                        Llamar al Conductor
                                    </button>
                                </div>
                            </div>

                            <div className={styles.card} style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <h4 style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.8rem' }}>NOTAS DE RUTA</h4>
                                <p style={{ fontSize: '0.8rem', color: '#4b5563', lineHeight: '1.6' }}>
                                    Asegúrese de que el conductor mantenga el dispositivo en un lugar con visibilidad satelital óptima para evitar errores de geolocalización.
                                </p>
                            </div>

                            <ChatRuta rutaId={id as string} rol="ADMIN" />
                        </div>
                    </div>
                </div>
            </main>
        </BackgroundMeteors>
    );
}
