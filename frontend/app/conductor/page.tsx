"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import BackgroundMeteors from "@/componentes/BackgroundMeteors";
import styles from "../dashboard/page.module.css";
import ChatRuta from "@/componentes/ChatRuta";

interface Ruta {
    id: string;
    origen: string;
    destino: string;
    distanciaEstimadaKm: number;
    estado: string;
    vehiculoId: string;
    fecha: string;
}

// En desarrollo (móvil), usamos rutas relativas que Next.js redirigirá al backend de Railway
// En producción, usamos la URL directa del backend
const API_URL = typeof window !== 'undefined' && window.location.hostname === '10.0.2.2'
    ? '' // Ruta relativa para que Next.js haga de proxy
    : (process.env.NEXT_PUBLIC_API_URL || "https://saas-carcare-production.up.railway.app");

export default function ConductorDashboard() {
    const [rutas, setRutas] = useState<Ruta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter(); // Import useRouter at top level if not already imported, otherwise add it inside component

    // Helper to get auth headers
    const getAuthHeaders = (): Record<string, string> => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (typeof window === 'undefined') return headers;

        const userStr = localStorage.getItem("user");
        if (!userStr) return headers;

        try {
            const user = JSON.parse(userStr);
            // CRITICAL: If I am a driver, I must act on behalf of my company (empresaId)
            // If I am an admin (testing), I use my own ID.
            const tenantId = user.role === 'CONDUCTOR' ? user.empresaId : user.id;

            if (tenantId) {
                headers['X-User-Id'] = String(tenantId);
            }
        } catch (e) {
            console.error("Error parsing user from localStorage", e);
        }
        return headers;
    };

    const cargarRutas = async () => {
        try {
            setError(null);
            console.log('[ConductorDashboard] Iniciando carga de rutas desde:', API_URL);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log('[ConductorDashboard] Timeout alcanzado después de 8 segundos');
                controller.abort();
            }, 8000);

            const url = `${API_URL}/api/rutas`;
            console.log('[ConductorDashboard] Haciendo fetch a:', url);

            const res = await fetch(url, {
                signal: controller.signal,
                mode: 'cors',
                headers: getAuthHeaders()
            });
            clearTimeout(timeoutId);

            console.log('[ConductorDashboard] Respuesta recibida:', {
                status: res.status,
                ok: res.ok,
                statusText: res.statusText
            });

            if (res.ok) {
                const data = await res.json();
                console.log('[ConductorDashboard] Datos recibidos:', data.length, 'rutas');
                setRutas(data.filter((r: Ruta) => r.estado !== 'COMPLETADA'));
                setLoading(false);
            } else {
                if (res.status === 401 || res.status === 403) {
                    toast.error("Sesión expirada");
                    router.push("/conductor/login");
                    return;
                }
                throw new Error(`Error del servidor: ${res.status} ${res.statusText}`);
            }
        } catch (err: any) {
            console.error('[ConductorDashboard] Error cargando rutas:', {
                name: err.name,
                message: err.message,
                stack: err.stack
            });
            const errorMsg = err.name === 'AbortError'
                ? "Tiempo de espera agotado - El servidor no responde"
                : `Error de conexión: ${err.message}`;
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Verificar autenticación
        const userStr = localStorage.getItem("user");
        if (!userStr) {
            toast.error("Debes iniciar sesión para acceder al panel de conductor");
            router.push("/conductor/login");
            return;
        }

        cargarRutas();
        const interval = setInterval(cargarRutas, 10000);
        return () => {
            clearInterval(interval);
            stopBrowserGPS();
        };
    }, []);

    // GPS Fallback para navegador
    const [gpsInterval, setGpsInterval] = useState<NodeJS.Timeout | null>(null);

    const startBrowserGPS = (rutaId: string) => {
        if (!navigator.geolocation) {
            toast.error("GPS no disponible en este navegador");
            return;
        }

        gpsInterval && clearInterval(gpsInterval);

        // Primero solicitar permiso y obtener posición inicial
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                toast.success(`GPS encontrado: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);

                // Actualizar posición inicial inmediatamente
                try {
                    await fetch(`${API_URL}/api/rutas/${rutaId}`, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                            latitudActual: position.coords.latitude,
                            longitudActual: position.coords.longitude
                        })
                    });
                } catch (err) {
                    console.error("Error updating initial GPS:", err);
                }

                // Luego usar watchPosition para actualizaciones continuas
                const watchId = navigator.geolocation.watchPosition(
                    async (position) => {
                        console.log(`GPS Update: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
                        try {
                            await fetch(`${API_URL}/api/rutas/${rutaId}`, {
                                method: 'PUT',
                                headers: getAuthHeaders(),
                                body: JSON.stringify({
                                    latitudActual: position.coords.latitude,
                                    longitudActual: position.coords.longitude
                                })
                            });
                        } catch (err) {
                            console.error("Error updating GPS:", err);
                        }
                    },
                    (error) => {
                        console.error("GPS Watch Error:", error);
                        if (error.code === error.PERMISSION_DENIED) {
                            toast.error("Permiso de GPS denegado. Activa el GPS y recarga la página.");
                        } else if (error.code === error.POSITION_UNAVAILABLE) {
                            toast.error("GPS no disponible. Revisa tu conexión GPS.");
                        } else {
                            toast.error(`Error GPS: ${error.message}`);
                        }
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 0
                    }
                );

                // Guardar el watchId para poder limpiarlo después
                const interval = setInterval(() => { }, 1000);
                (interval as any).watchId = watchId;
                setGpsInterval(interval);
            },
            (error) => {
                console.error("GPS Initial Error:", error);
                if (error.code === error.PERMISSION_DENIED) {
                    toast.error("🚫 Permiso de GPS denegado. Activa el GPS en tu navegador y recarga.");
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    toast.error("📡 GPS no disponible. Revisa tu conexión.");
                } else {
                    toast.error(`❌ Error GPS: ${error.message}`);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 60000
            }
        );
    };

    const stopBrowserGPS = () => {
        if (gpsInterval) {
            // Limpiar el watchPosition si existe
            if ((gpsInterval as any).watchId) {
                navigator.geolocation.clearWatch((gpsInterval as any).watchId);
            }
            clearInterval(gpsInterval);
            setGpsInterval(null);
        }
    };

    const toggleRuta = async (ruta: Ruta) => {
        const nuevoEstado = ruta.estado === 'EN_CURSO' ? 'PLANIFICADA' : 'EN_CURSO';

        // Native GPS Trigger
        if (typeof window !== 'undefined' && (window as any).AndroidTracker) {
            if (nuevoEstado === 'EN_CURSO') {
                (window as any).AndroidTracker.startTracking(ruta.id);
            } else {
                (window as any).AndroidTracker.stopTracking();
            }
        } else {
            // Fallback GPS para navegador web
            if (nuevoEstado === 'EN_CURSO') {
                startBrowserGPS(ruta.id);
            } else {
                stopBrowserGPS();
            }
        }

        try {
            await fetch(`${API_URL}/api/rutas/${ruta.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ estado: nuevoEstado })
            });
            cargarRutas();
            toast.success(`Ruta ${nuevoEstado === 'EN_CURSO' ? 'Iniciada' : 'Detenida'}`);
        } catch (err) {
            toast.error("Error al actualizar estado");
        }
    };

    if (loading && !error) return (
        <BackgroundMeteors>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: '2rem',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Cargando Panel Conductor...</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Conectando a {API_URL}</div>
            </div>
        </BackgroundMeteors>
    );

    if (error) return (
        <BackgroundMeteors>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: '2rem',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#ef4444' }}>Error de Conexión</div>
                <div style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1rem' }}>{error}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '2rem', fontFamily: 'monospace' }}>
                    Intentando conectar a:<br />
                    {API_URL}/api/rutas
                </div>
                <button
                    onClick={() => {
                        setLoading(true);
                        setError(null);
                        cargarRutas();
                    }}
                    style={{
                        padding: '1rem 2rem',
                        background: 'var(--accent)',
                        color: '#000',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    🔄 Reintentar Conexión
                </button>
            </div>
        </BackgroundMeteors>
    );

    const rutaActiva = rutas.find(r => r.estado === 'EN_CURSO');
    const rutasPendientes = rutas.filter(r => r.estado === 'PLANIFICADA');

    return (
        <BackgroundMeteors>
            <main style={{ minHeight: '100vh', width: '100%', overflowY: 'auto', position: 'relative' }}>
                <div className={styles.container} style={{ padding: '0.5rem 1rem 2rem 1rem', maxWidth: '100%' }}>

                    {/* Header con Logo */}
                    <header className={styles.header} style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '2rem',
                        paddingBottom: '1.5rem',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <div style={{
                                width: '45px',
                                height: '45px',
                                background: 'linear-gradient(135deg, var(--accent), #3bf63b)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 16px rgba(59, 246, 59, 0.2)'
                            }}>
                                <span style={{ color: '#000', fontWeight: '900', fontSize: '1.2rem' }}>CC</span>
                            </div>
                            <div className={styles.title}>
                                <h1 style={{ fontSize: '1.4rem', margin: 0, letterSpacing: '-0.5px' }}>EcoFleet <span style={{ color: '#fff', opacity: 0.5, fontSize: '0.8rem', fontWeight: '400' }}>Mobile</span></h1>
                                <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Driver Edition</p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--accent)', padding: '2px' }}>
                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>JS</div>
                            </div>
                        </div>
                    </header>

                    {/* RUTA ACTIVA SECTION */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem', fontWeight: '700' }}>Trayecto en Curso</h3>
                        {rutaActiva ? (
                            <div className={styles.card} style={{
                                borderLeft: '6px solid #3bf63b',
                                background: 'linear-gradient(145deg, rgba(30,30,40,0.95), rgba(20,20,25,0.95))',
                                padding: '1.5rem',
                                boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3bf63b', animation: 'pulse 1.5s infinite' }}></div>
                                        <span style={{ fontSize: '0.7rem', color: '#3bf63b', fontWeight: '800' }}>RASTREO GPS ACTIVO</span>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', color: '#4b5563', fontFamily: 'monospace' }}>#{rutaActiva.id?.slice(-6).toUpperCase()}</span>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h2 style={{
                                        fontSize: '1.3rem',
                                        fontWeight: '900',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.8rem',
                                        overflow: 'hidden'
                                    }}>
                                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>{rutaActiva.origen}</span>
                                        <span style={{ color: 'var(--accent)', opacity: 0.5, flexShrink: 0 }}>➝</span>
                                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>{rutaActiva.destino}</span>
                                    </h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <svg width="14" height="14" fill="none" stroke="#6b7280" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Vehículo: <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{rutaActiva.vehiculoId?.length > 10 ? `...${rutaActiva.vehiculoId.slice(-6)}` : rutaActiva.vehiculoId}</span></span>
                                    </div>
                                </div>

                                {/* Telemetría rápida para conductor */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <span style={{ display: 'block', fontSize: '0.6rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Distancia</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>{rutaActiva.distanciaEstimadaKm} <span style={{ fontSize: '0.7rem', color: '#4b5563' }}>KM</span></span>
                                    </div>
                                    <div style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <span style={{ display: 'block', fontSize: '0.6rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Vel. Media</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>85 <span style={{ fontSize: '0.7rem', color: '#4b5563' }}>KM/H</span></span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleRuta(rutaActiva)}
                                    className={styles.submitButton}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        border: '1px solid #ef4444',
                                        height: '56px',
                                        fontSize: '0.9rem',
                                        letterSpacing: '1px',
                                        boxShadow: 'none'
                                    }}
                                >
                                    FINALIZAR TRAYECTO
                                </button>
                            </div>
                        ) : (
                            <div className={styles.card} style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.05)' }}>
                                <div style={{ opacity: 0.3, marginBottom: '1rem' }}>
                                    <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ margin: '0 auto' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                </div>
                                <p style={{ color: '#4b5563', fontSize: '0.9rem' }}>Esperando asignación de ruta...</p>
                                <p style={{ color: '#374151', fontSize: '0.75rem', marginTop: '0.5rem' }}>Mantén la app abierta para recibir actualizaciones.</p>
                            </div>
                        )}
                    </div>

                    {/* PENDING ROUTES SECTION */}
                    {!rutaActiva && rutasPendientes.length > 0 && (
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h3 style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem', fontWeight: '700' }}>Próximos Servicios</h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {rutasPendientes.map(r => (
                                    <div key={r.id} className={styles.card} style={{
                                        padding: '1.2rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ flex: 1, overflow: 'hidden', marginRight: '1rem' }}>
                                                <div style={{ fontSize: '0.65rem', color: '#4b5563', marginBottom: '0.4rem' }}>{r.fecha} • RUTA</div>
                                                <h4 style={{
                                                    fontSize: '0.95rem',
                                                    fontWeight: '700',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    overflow: 'hidden'
                                                }}>
                                                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{r.origen}</span>
                                                    <span style={{ opacity: 0.2 }}>➝</span>
                                                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{r.destino}</span>
                                                </h4>
                                            </div>
                                            <button
                                                onClick={() => toggleRuta(r)}
                                                className={styles.submitButton}
                                                style={{
                                                    width: 'auto',
                                                    padding: '0.6rem 1.2rem',
                                                    fontSize: '0.75rem',
                                                    background: 'var(--accent)',
                                                    color: '#000',
                                                    boxShadow: '0 4px 12px rgba(59, 246, 59, 0.2)'
                                                }}
                                            >
                                                INICIAR
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* CHAT SECTION */}
                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem', fontWeight: '700' }}>Comunicación Directa</h3>
                        <ChatRuta rutaId={rutaActiva?.id || (rutasPendientes.length > 0 ? rutasPendientes[0].id : "testing_room")} rol="CONDUCTOR" />
                    </div>

                    <footer style={{ marginTop: '4rem', textAlign: 'center', paddingBottom: '2rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Powered by EcoFleet Tech</div>
                        <div style={{ width: '20px', height: '2px', background: 'var(--accent)', margin: '0 auto', opacity: 0.3 }}></div>
                    </footer>
                </div>
            </main>
        </BackgroundMeteors>
    );
}
