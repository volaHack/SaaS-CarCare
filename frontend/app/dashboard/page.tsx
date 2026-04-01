"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import styles from "./page.module.css";
import BackgroundMeteors from "@/componentes/BackgroundMeteors";
import LocationInput from "@/componentes/LocationInput";
import AlertasPanel from "@/componentes/AlertasPanel";
import ConfiguracionPanel from "@/componentes/ConfiguracionPanel";
import dynamic from "next/dynamic";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

interface Vehiculo {
  id: string;
  matricula: string;
  marca: string;
  modelo: string;
  kilometraje: number;
  tipoCombustible: string;
  combustibleActual: number;
  activo: boolean;
}

interface Ruta {
  id?: string;
  origen: string;
  destino: string;
  distanciaEstimadaKm: number;
  estado: string;
  vehiculoId: string;
  conductorId?: string;
  conductorNombre?: string;
  fecha: string;
  latitudOrigen?: number;
  longitudOrigen?: number;
  latitudDestino?: number;
  longitudDestino?: number;
  latitudActual?: number;
  longitudActual?: number;
  ultimaActualizacionGPS?: string;
}

interface Repostaje {
  id: string;
  fecha: string;
  litros: number;
  precioPorLitro: number;
  costeTotal: number;
  kilometrajeActual: number;
  vehiculoId: string;
}

interface Conductor {
  id: string;
  nombre: string;
  email: string;
}

// Dynamic import para el mapa de tracking global (evitar SSR)
const MapTrackingGlobal = dynamic(() => import("@/componentes/MapTrackingGlobal"), {
  ssr: false,
  loading: () => (
    <div style={{
      height: "500px",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "16px",
      color: "#888"
    }}>
      Cargando Mapa de Tracking...
    </div>
  )
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://saas-carcare-production.up.railway.app";

export default function Dashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'flota' | 'nuevo' | 'rutas' | 'estadisticas' | 'tracking'>('flota');
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [repostajes, setRepostajes] = useState<Repostaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviandoReporte, setEnviandoReporte] = useState(false);

  // Helper to get auth headers
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window === 'undefined') return headers;

    const token = localStorage.getItem("token");
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }, []);

  // Check auth
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    // Check if user is conductor to redirect correctly
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        toast.info("Sesión cerrada");
        if (user.role === 'CONDUCTOR') {
          router.push("/conductor/login");
          return;
        }
      }
    } catch (e) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }

    router.push("/login");
  };

  // Helper para calcular estado de conexión del conductor
  const getConnectionStatus = (timestamp: string | undefined, hasActiveGPS: boolean = false) => {
    if (!timestamp && hasActiveGPS) {
      return { status: 'online' as const, text: 'GPS Activo', color: '#22c55e' };
    }

    if (!timestamp) return { status: 'offline' as const, text: 'Sin señal', color: '#6b7280' };

    const now = new Date();
    const lastUpdate = new Date(timestamp);
    const diffSeconds = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);

    if (diffSeconds <= 30) {
      return {
        status: 'online' as const,
        text: diffSeconds < 5 ? 'Ahora' : `Hace ${diffSeconds}s`,
        color: '#22c55e'
      };
    } else if (diffSeconds <= 120) {

      const mins = Math.floor(diffSeconds / 60);
      return {
        status: 'idle' as const,
        text: mins > 0 ? `Hace ${mins}m ${diffSeconds % 60}s` : `Hace ${diffSeconds}s`,
        color: '#f59e0b'
      };
    } else {
      const mins = Math.floor(diffSeconds / 60);
      return {
        status: 'offline' as const,
        text: mins < 60 ? `Hace ${mins} min` : `Hace ${Math.floor(mins / 60)}h`,
        color: '#6b7280'
      };
    }
  };

  // ═══ DATOS PARA ESTADÍSTICAS ═══
  // Datos manuales persistidos en localStorage (el usuario puede editar desde la UI)
  const [datosManual, setDatosManual] = useState<number[]>(() => {
    if (typeof window === 'undefined') return new Array(12).fill(0);
    try {
      const saved = localStorage.getItem('carcare_consumo_manual');
      return saved ? JSON.parse(saved) : new Array(12).fill(0);
    } catch { return new Array(12).fill(0); }
  });

  const [editandoMes, setEditandoMes] = useState<number | null>(null);
  const [inputConsumo, setInputConsumo] = useState('');

  const guardarDatoManual = (mesIndex: number, valor: number) => {
    const nuevo = [...datosManual];
    nuevo[mesIndex] = valor;
    setDatosManual(nuevo);
    localStorage.setItem('carcare_consumo_manual', JSON.stringify(nuevo));
    setEditandoMes(null);
    setInputConsumo('');
    toast.success(`Consumo de ${nombresMeses[mesIndex]} actualizado`);
  };

  const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const mesActual = new Date().getMonth();

  const datosGrafico = useMemo(() => {
    const añoActual = new Date().getFullYear();
    const consumoPorMes = new Array(12).fill(0);

    // 1. Datos reales desde repostajes
    repostajes.forEach(rep => {
      if (!rep.fecha) return;
      const d = new Date(rep.fecha);
      if (d.getFullYear() === añoActual) {
        consumoPorMes[d.getMonth()] += rep.litros || 0;
      }
    });

    // 2. Datos estimados desde rutas completadas (si no hay repostajes ese mes)
    rutas.forEach(r => {
      if (!r.fecha || r.estado !== 'COMPLETADA') return;
      const d = new Date(r.fecha);
      if (d.getFullYear() === añoActual) {
        // Solo estimar si no hay repostajes reales ese mes
        if (consumoPorMes[d.getMonth()] === 0) {
          consumoPorMes[d.getMonth()] += (r.distanciaEstimadaKm / 100) * 8;
        }
      }
    });

    // 3. Datos manuales (sobreescriben si el usuario los puso)
    datosManual.forEach((val, i) => {
      if (val > 0) consumoPorMes[i] = val;
    });

    // 4. Generar predicción (media móvil de 3 meses anteriores con datos)
    return nombresMeses.map((mes, i) => {
      const consumo = Math.round(consumoPorMes[i] * 10) / 10;

      // Predicción: promedio de los últimos 3 meses con datos
      const mesesAnteriores: number[] = [];
      for (let j = 1; j <= 3; j++) {
        if (i - j >= 0 && consumoPorMes[i - j] > 0) {
          mesesAnteriores.push(consumoPorMes[i - j]);
        }
      }

      let prediccion = 0;
      if (mesesAnteriores.length > 0) {
        prediccion = mesesAnteriores.reduce((a, b) => a + b, 0) / mesesAnteriores.length;
      }

      // Para el mes actual: proyectar el consumo parcial al mes completo
      if (i === mesActual && consumo > 0) {
        const diaActual = new Date().getDate();
        const diasEnMes = new Date(new Date().getFullYear(), i + 1, 0).getDate();
        const proyeccion = (consumo / Math.max(1, diaActual)) * diasEnMes;
        if (proyeccion > prediccion) prediccion = proyeccion;
      }

      return {
        mes,
        consumo,
        prediccion: Math.round(prediccion * 10) / 10,
        esMesActual: i === mesActual,
        esManual: datosManual[i] > 0,
      };
    });
  }, [rutas, repostajes, datosManual, mesActual, nombresMeses]);

  // KPIs calculados
  const consumoTotal = datosGrafico.reduce((a, d) => a + d.consumo, 0);
  const mesesConDatos = datosGrafico.filter(d => d.consumo > 0).length;
  const consumoMedio = mesesConDatos > 0 ? Math.round(consumoTotal / mesesConDatos) : 0;
  const consumoMesActual = datosGrafico[mesActual]?.consumo || 0;
  const prediccionMesActual = datosGrafico[mesActual]?.prediccion || 0;
  const ahorroPotencial = prediccionMesActual > consumoMesActual
    ? Math.round(prediccionMesActual - consumoMesActual) : 0;

  const [nuevoVehiculo, setNuevoVehiculo] = useState<Partial<Vehiculo>>({
    marca: '', modelo: '', matricula: '', kilometraje: 0, combustibleActual: 50, activo: true
  });
  const [nuevaRuta, setNuevaRuta] = useState<Partial<Ruta>>({
    origen: '', destino: '', distanciaEstimadaKm: 0, vehiculoId: '', conductorId: '', conductorNombre: '', fecha: new Date().toISOString().split('T')[0]
  });

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [resVehiculos, resRutas, resRepostajes, resConductores] = await Promise.all([
        fetch(`${API_URL}/api/vehiculos`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/rutas`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/repostajes`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/conductores`, { headers: getAuthHeaders() })
      ]);

      if (resVehiculos.ok) {
        const dataV = await resVehiculos.json();
        setVehiculos(dataV);
      } else {
        console.error("Error fetching vehicles");
      }

      if (resRutas.ok) {
        const dataR = await resRutas.json();
        setRutas(dataR);
      }

      if (resRepostajes.ok) {
        const dataRep = await resRepostajes.json();
        setRepostajes(dataRep);
      }

      if (resConductores.ok) {
        const dataC = await resConductores.json();
        setConductores(dataC);
      } else if (resConductores.status === 403) {
        setConductores([]);
      }
    } catch (err) {
      console.error("Error conectando con el Backend:", err);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) { // Only load data if user is logged in
      cargarDatos();
    }

    let intervalId: NodeJS.Timeout | null = null;
    if (activeTab === 'tracking') {
      intervalId = setInterval(() => {
        cargarDatos();
      }, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTab, cargarDatos]);

  const handleCrearVehiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/vehiculos`, {
        method: 'POST',
        headers: getAuthHeaders() as any, // Cast to any to satisfy TS for now or define stricter HeadersInit
        body: JSON.stringify(nuevoVehiculo)
      });
      if (res.ok) {
        toast.success("Vehículo añadido a la flota correctamente");
        setActiveTab('flota');
        cargarDatos();
        setNuevoVehiculo({ marca: '', modelo: '', matricula: '', kilometraje: 0, combustibleActual: 50, activo: true });
      }
    } catch (error) {
      toast.error("Error al crear vehículo");
    }
  };

  const handleCrearRuta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaRuta.vehiculoId) {
      toast.warning("⚠️ Debes asignar un vehículo a la ruta");
      return;
    }
    const conductorSeleccionado = conductores.find(c => c.id === nuevaRuta.conductorId);
    const geocode = async (query: string) => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
      } catch (error) {
        console.error("Error en geocodificación:", error);
      }
      return null;
    };

    toast.promise(
      (async () => {
        let originCoords = { lat: nuevaRuta.latitudOrigen, lng: nuevaRuta.longitudOrigen };
        let destCoords = { lat: nuevaRuta.latitudDestino, lng: nuevaRuta.longitudDestino };

        if (!originCoords.lat || !originCoords.lng) {
          const res = await geocode(nuevaRuta.origen || "");
          if (res) originCoords = res;
        }
        if (!destCoords.lat || !destCoords.lng) {
          const res = await geocode(nuevaRuta.destino || "");
          if (res) destCoords = res;
        }

        if (!originCoords.lat || !destCoords.lat) {
          throw new Error("No se pudo localizar el origen o el destino. Por favor, selecciona una sugerencia.");
        }

        const res = await fetch(`${API_URL}/api/rutas`, {
          method: 'POST',
          headers: getAuthHeaders() as any,
          body: JSON.stringify({
            ...nuevaRuta,
            estado: 'PLANIFICADA',
            conductorId: conductorSeleccionado?.id || "",
            conductorNombre: conductorSeleccionado?.nombre || "",
            latitudOrigen: originCoords.lat,
            longitudOrigen: originCoords.lng,
            latitudDestino: destCoords.lat,
            longitudDestino: destCoords.lng,
            latitudActual: originCoords.lat,
            longitudActual: originCoords.lng
          })
        });

        if (!res.ok) throw new Error("Error al guardar la ruta en el servidor");

        cargarDatos();
        setNuevaRuta({
          origen: "",
          destino: "",
          distanciaEstimadaKm: 0,
          fecha: new Date().toISOString().split("T")[0],
          vehiculoId: "",
          conductorId: "",
          conductorNombre: ""
        });
        return res.json();
      })(),
      {
        loading: 'Procesando ubicaciones...',
        success: 'Ruta planificada con éxito con coordenadas precisas',
        error: (err) => `Error: ${err.message}`,
      }
    );
  };

  const handleCambioEstadoRuta = async (ruta: Ruta, nuevoEstado: string) => {
    const rutasPrevias = [...rutas];
    setRutas(prev => prev.map(r => r.id === ruta.id ? { ...r, estado: nuevoEstado } : r));

    try {
      await fetch(`${API_URL}/api/rutas/${ruta.id}`, {
        method: 'PUT',
        headers: getAuthHeaders() as any,
        body: JSON.stringify({ ...ruta, estado: nuevoEstado })
      }).catch(e => console.warn("Backend no respondió, usando estado local"));

      toast.success(`Ruta marcada como ${nuevoEstado}`);
    } catch (error) {
      setRutas(rutasPrevias);
      toast.error("Error al actualizar estado");
    }
  };

  const handleEliminarRuta = async (ruta: Ruta) => {
    const rutasPrevias = [...rutas];
    setRutas(prev => prev.filter(r => r.id !== ruta.id));

    try {
      await fetch(`${API_URL}/api/rutas/${ruta.id}`, { method: 'DELETE', headers: getAuthHeaders() as any })
        .catch(e => console.warn("Backend no respondió, usando estado local"));
      toast.success("Ruta eliminada correctamente");
    } catch (error) {
      setRutas(rutasPrevias);
      toast.error("Error al eliminar ruta");
    }
  };

  const handleEliminarVehiculo = (id: string) => {
    toast("¿Estás seguro?", {
      description: "Esta acción eliminará el vehículo permanentemente de la flota.",
      action: {
        label: "Eliminar",
        onClick: async () => {
          try {
            const res = await fetch(`${API_URL}/api/vehiculos/${id}`, { method: 'DELETE', headers: getAuthHeaders() as any });
            if (res.ok) {
              toast.success("Vehículo eliminado correctamente");
              setVehiculos((prev) => prev.filter(v => v.id !== id));
            }
          } catch (error) {
            toast.error("Error al eliminar vehículo");
          }
        }
      },
      cancel: {
        label: "Cancelar",
        onClick: () => console.log("Cancelado"),
      },
    });
  };

  const getFuelColor = (level: number) => {
    if (level > 50) return '#22c55e';
    if (level > 20) return '#eab308';
    return '#ef4444';
  };

  return (
    <BackgroundMeteors>
      <main style={{ height: '100%', width: '100%', overflowY: 'auto', position: 'relative', zIndex: 20, paddingBottom: '100px' }}>
        <div className={styles.container}>
          <header className={styles.header}>
            <div className={styles.title}>
              <h1>./CarCare Tracker</h1>
              <p className={styles.subtitle}>Gestion de Flota de mano de CarCare Tracker para la Organización y Sostenibilidad de la flota de coches de una empresa</p>
            </div>
            <div className={styles.status} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
              <AlertasPanel
                apiUrl={API_URL}
                getAuthHeaders={getAuthHeaders}
                onNavigate={(rutaId, vehiculoId) => {
                  if (rutaId) { router.push(`/ruta/${rutaId}`); }
                  else if (vehiculoId) { router.push(`/vehiculo/${vehiculoId}`); }
                }}
              />
              <ConfiguracionPanel apiUrl={API_URL} getAuthHeaders={getAuthHeaders} />
              <button
                onClick={handleLogout}
                className={styles.submitButton}
                style={{
                  width: 'auto',
                  padding: '0.5rem 1.5rem',
                  fontSize: '0.875rem'
                }}
              >
                Cerrar Sesión
              </button>
            </div>
          </header>

          <nav className={styles.nav}>
            <button
              className={`${styles.navButton} ${activeTab === 'flota' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('flota')}
            >
              Flota de coches
            </button>
            <button
              className={`${styles.navButton} ${activeTab === 'rutas' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('rutas')}
            >
              Rutas y Logística
            </button>
            <button
              className={`${styles.navButton} ${activeTab === 'estadisticas' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('estadisticas')}
            >
              Estadísticas
            </button>
            <button
              className={`${styles.navButton} ${activeTab === 'tracking' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('tracking')}
            >
              Tracking en Vivo
            </button>
            <button
              className={`${styles.navButton} ${activeTab === 'nuevo' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('nuevo')}
            >
              + Nuevo Vehículo
            </button>
          </nav>

          {activeTab === 'flota' && (
            <div className={styles.grid}>
              {vehiculos.map((v) => (
                <div
                  key={v.id}
                  className={styles.card}
                  onClick={() => router.push(`/vehiculo/${v.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.cardHeader}>
                    <div>
                      <h2 className={styles.cardTitle}>{v.marca} {v.modelo}</h2>
                      <span className={styles.cardSubtitle}>Matrícula: {v.matricula}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminarVehiculo(v.id);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.2rem' }}
                      title="Eliminar Vehículo"
                    >
                      X
                    </button>
                  </div>

                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Kilometraje total</span>
                    <span className={styles.statValue}>{v.kilometraje.toLocaleString()} km</span>
                  </div>

                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Tipo de combustible</span>
                    <span className={styles.statValue}>{v.tipoCombustible}</span>
                  </div>

                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Combustible</span>
                    <span className={styles.statValue}>{v.combustibleActual} L</span>
                  </div>

                  <div className={styles.fuelBarBg}>
                    <div
                      className={styles.fuelBarFill}
                      style={{
                        width: `${Math.min(v.combustibleActual, 100)}%`,
                        backgroundColor: getFuelColor(v.combustibleActual)
                      }}
                    />
                  </div>
                  <div style={{ marginTop: '1rem' }}>
                    {(() => {
                      const estaOcupado = rutas.some(r => r.vehiculoId === v.id && r.estado !== 'COMPLETADA');
                      return (
                        <span
                          className={styles.badge}
                          style={{
                            backgroundColor: !v.activo ? 'rgba(239, 68, 68, 0.2)' : (estaOcupado ? 'rgba(234, 179, 8, 0.2)' : 'rgba(34, 197, 94, 0.2)'),
                            color: !v.activo ? '#f87171' : (estaOcupado ? '#facc15' : '#03f844'),
                            boxShadow: !v.activo ? 'none' : (estaOcupado ? '0 0 10px rgba(234, 179, 8, 0.2)' : '0 0 10px rgba(34, 197, 94, 0.2)'),
                          }}
                        >
                          {!v.activo ? "TALLER" : (estaOcupado ? "OCUPADO" : "ACTIVO")}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              ))}
              {vehiculos.length === 0 && !loading && <p>No hay vehículos registrados.</p>}
            </div>
          )}

          {activeTab === 'nuevo' && (
            <div className={styles.formContainer}>
              <h2 style={{ marginBottom: '1.5rem' }}>Dar de alta nuevo vehículo</h2>
              <form onSubmit={handleCrearVehiculo}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Marca</label>
                  <input className={styles.input} type="text" placeholder="Ej: Toyota" required
                    value={nuevoVehiculo.marca} onChange={e => setNuevoVehiculo({ ...nuevoVehiculo, marca: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Modelo</label>
                  <input className={styles.input} type="text" placeholder="Ej: Prius" required
                    value={nuevoVehiculo.modelo} onChange={e => setNuevoVehiculo({ ...nuevoVehiculo, modelo: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Matrícula</label>
                  <input className={styles.input} type="text" placeholder="1234-XYZ" required
                    value={nuevoVehiculo.matricula} onChange={e => setNuevoVehiculo({ ...nuevoVehiculo, matricula: e.target.value })} />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label className={styles.label} style={{ marginBottom: 0 }}>Km Iniciales</label>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{nuevoVehiculo.kilometraje?.toLocaleString()} km</span>
                    </div>
                    <input
                      className={styles.input}
                      type="range"
                      min="0"
                      max="1000000"
                      step="500"
                      style={{ padding: '0.5rem', cursor: 'pointer' }}
                      value={nuevoVehiculo.kilometraje}
                      onChange={e => setNuevoVehiculo({ ...nuevoVehiculo, kilometraje: Number(e.target.value) })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label className={styles.label} style={{ marginBottom: 0 }}>Combustible</label>
                      <span style={{ fontWeight: 'bold', color: getFuelColor(nuevoVehiculo.combustibleActual || 0) }}>
                        {nuevoVehiculo.combustibleActual}%
                      </span>
                    </div>
                    <input
                      className={styles.input}
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      style={{ padding: '0.5rem', cursor: 'pointer' }}
                      value={nuevoVehiculo.combustibleActual}
                      onChange={e => setNuevoVehiculo({ ...nuevoVehiculo, combustibleActual: Number(e.target.value) })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tipo de combustible</label>
                    <select className={styles.select} required
                      value={nuevoVehiculo.tipoCombustible} onChange={e => setNuevoVehiculo({ ...nuevoVehiculo, tipoCombustible: e.target.value })}>
                      <option value="">Seleccionar Combustible</option>
                      <option value="gasolina">Gasolina</option>
                      <option value="diesel">Diesel</option>
                      <option value="hibrido">Híbrido</option>
                      <option value="electrico">Eléctrico</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className={styles.submitButton}>Guardar Vehículo</button>
              </form>
            </div>
          )}

          {activeTab === 'rutas' && (
            <div className={styles.rutasContainer}>
              <div className={styles.formContainer}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Nueva Ruta</h3>
                <form onSubmit={handleCrearRuta}>
                  <LocationInput
                    label="Origen"
                    placeholder="Ej: Madrid, Calle Mayor..."
                    value={nuevaRuta.origen || ""}
                    onChange={(val, coords) => setNuevaRuta({
                      ...nuevaRuta,
                      origen: val,
                      latitudOrigen: coords?.lat,
                      longitudOrigen: coords?.lng
                    })}
                  />

                  <LocationInput
                    label="Destino"
                    placeholder="Ej: Barcelona, Puerto..."
                    value={nuevaRuta.destino || ""}
                    onChange={(val, coords) => setNuevaRuta({
                      ...nuevaRuta,
                      destino: val,
                      latitudDestino: coords?.lat,
                      longitudDestino: coords?.lng
                    })}
                  />
                  <div className={styles.formGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label className={styles.label} style={{ marginBottom: 0 }}>Distancia Estimada</label>
                      <span style={{ fontWeight: 'bold', color: 'green' }}>{nuevaRuta.distanciaEstimadaKm?.toLocaleString() || 0} km</span>
                    </div>
                    <input
                      className={styles.input}
                      type="range"
                      min="0"
                      max="2000"
                      step="1"
                      style={{ padding: '0.5rem', cursor: 'pointer' }}
                      value={nuevaRuta.distanciaEstimadaKm || 0}
                      onChange={e => setNuevaRuta({ ...nuevaRuta, distanciaEstimadaKm: Number(e.target.value) })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Fecha Salida</label>
                    <input className={styles.input} type="date" required
                      value={nuevaRuta.fecha} onChange={e => setNuevaRuta({ ...nuevaRuta, fecha: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Vehículo Asignado</label>
                    <select className={styles.select} required
                      value={nuevaRuta.vehiculoId} onChange={e => setNuevaRuta({ ...nuevaRuta, vehiculoId: e.target.value })}>
                      <option value="">-- Seleccionar Vehículo --</option>
                      {vehiculos.map(v => (
                        <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.matricula})</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Conductor Asignado</label>
                    <select
                      className={styles.select}
                      value={nuevaRuta.conductorId || ""}
                      onChange={e => {
                        const conductor = conductores.find(c => c.id === e.target.value);
                        setNuevaRuta({
                          ...nuevaRuta,
                          conductorId: e.target.value,
                          conductorNombre: conductor?.nombre || ""
                        });
                      }}
                    >
                      <option value="">-- Sin asignar --</option>
                      {conductores.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre} ({c.email})</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className={styles.submitButton}>Planificar Ruta</button>
                </form>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3>Rutas Activas</h3>
                  <button
                    onClick={cargarDatos}
                    className={styles.submitButton}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    title="Recargar rutas"
                  >
                    🔄 Recargar
                  </button>
                </div>
                <div className={styles.grid}>
                  {rutas.map(r => {
                    const esEnCurso = r.estado === 'EN_CURSO';
                    const esDetenido = r.estado === 'DETENIDO';
                    const esCompletada = r.estado === 'COMPLETADA';

                    return (
                      <div
                        key={r.id}
                        className={styles.card}
                        onClick={() => router.push(`/ruta/${r.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={styles.cardHeader}>
                          <div>
                            <h2 className={styles.cardTitle}>{r.origen} → {r.destino}</h2>
                            <span className={styles.cardSubtitle}>#{r.id?.slice(-6).toUpperCase()} • {r.fecha}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEliminarRuta(r);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.2rem' }}
                            title="Eliminar Ruta"
                          >
                            X
                          </button>
                        </div>

                        <div className={styles.statRow}>
                          <span className={styles.statLabel}>Distancia total</span>
                          <span className={styles.statValue}>{r.distanciaEstimadaKm} km</span>
                        </div>

                        <div className={styles.statRow}>
                          <span className={styles.statLabel}>Vehículo asignado</span>
                          <span className={styles.statValue}>
                            {r.vehiculoId?.length > 10 ? `...${r.vehiculoId.slice(-8)}` : r.vehiculoId}
                          </span>
                        </div>

                        <div className={styles.statRow}>
                          <span className={styles.statLabel}>Conductor</span>
                          <span className={styles.statValue}>{r.conductorNombre || "Sin asignar"}</span>
                        </div>

                        <div className={styles.statRow}>
                          <span className={styles.statLabel}>Estado</span>
                          <span className={styles.statValue}>{r.estado}</span>
                        </div>

                        <div className={styles.fuelBarBg}>
                          <div
                            className={styles.fuelBarFill}
                            style={{
                              width: esCompletada ? '100%' : ((esEnCurso || esDetenido) ? '60%' : '30%'),
                              backgroundColor: esCompletada ? '#22c55e' : (esDetenido ? '#f97316' : (esEnCurso ? '#06b6d4' : '#6b7280'))
                            }}
                          />
                        </div>

                        {(esEnCurso || esDetenido) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem' }}>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: esDetenido ? '#f97316' : '#3bf63b',
                              boxShadow: esDetenido ? '0 0 10px #f97316' : '0 0 10px #3bf63b',
                              animation: esDetenido ? 'none' : 'pulse 1.5s infinite'
                            }}></span>
                            <span style={{ fontSize: '0.7rem', color: esDetenido ? '#f97316' : '#3bf63b', fontWeight: '800', letterSpacing: '0.05em' }}>
                              {esDetenido ? 'VEHÍCULO DETENIDO' : 'RASTREO ACTIVO'}
                            </span>
                          </div>
                        )}

                        <div style={{ marginTop: '1rem' }}>
                          <span
                            className={styles.badge}
                            style={{
                              backgroundColor: esCompletada ? 'rgba(34, 197, 94, 0.2)' : (esDetenido ? 'rgba(249, 115, 22, 0.2)' : (esEnCurso ? 'rgba(6, 182, 212, 0.2)' : 'rgba(107, 114, 128, 0.2)')),
                              color: esCompletada ? '#4ade80' : (esDetenido ? '#f97316' : (esEnCurso ? '#22d3ee' : '#9ca3af')),
                              boxShadow: esCompletada ? '0 0 10px rgba(34, 197, 94, 0.2)' : ((esEnCurso || esDetenido) ? `0 0 10px ${esDetenido ? 'rgba(249, 115, 22, 0.2)' : 'rgba(6, 182, 212, 0.2)'}` : 'none'),
                            }}
                          >
                            {esCompletada ? "COMPLETADA" : (esDetenido ? "DETENIDO" : (esEnCurso ? "EN CURSO" : "PLANIFICADA"))}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {rutas.length === 0 && <p>No hay rutas planificadas.</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'estadisticas' && (
            <div className={styles.rutasContainer} style={{ gridTemplateColumns: "1fr", gap: "2rem" }}>
              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                <div className={styles.card} style={{ position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, right: 0, padding: "1rem", opacity: 0.1 }}>
                    <svg width="60" height="60" fill="#22c55e" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" /></svg>
                  </div>
                  <h3 style={{ color: "#94a3b8", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Consumo Este Mes</h3>
                  <div style={{ fontSize: "2.5rem", fontWeight: "800", color: "#fff", margin: "0.5rem 0" }}>
                    {consumoMesActual > 0 ? `${consumoMesActual} L` : '—'}
                  </div>
                  {ahorroPotencial > 0 && (
                    <span style={{ color: "#22c55e", background: "rgba(34, 197, 94, 0.1)", padding: "2px 8px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "600" }}>
                      {ahorroPotencial}L bajo predicción
                    </span>
                  )}
                  {consumoMesActual === 0 && <span style={{ color: "#4b5563", fontSize: "0.8rem" }}>Añade datos con el botón +</span>}
                </div>

                <div className={styles.card}>
                  <h3 style={{ color: "#94a3b8", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Media Mensual</h3>
                  <div style={{ fontSize: "2.5rem", fontWeight: "800", color: "#fff", margin: "0.5rem 0" }}>
                    {consumoMedio > 0 ? `${consumoMedio} L` : '—'}
                  </div>
                  <span style={{ color: "var(--accent)", fontSize: "0.9rem" }}>
                    {mesesConDatos > 0 ? `Basado en ${mesesConDatos} mes${mesesConDatos > 1 ? 'es' : ''}` : 'Sin datos aún'}
                  </span>
                </div>

                <div className={styles.card}>
                  <h3 style={{ color: "#94a3b8", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Predicción {nombresMeses[mesActual]}</h3>
                  <div style={{ fontSize: "2.5rem", fontWeight: "800", color: "#fff", margin: "0.5rem 0" }}>
                    {prediccionMesActual > 0 ? `${prediccionMesActual} L` : '—'}
                  </div>
                  <span style={{ color: "#8884d8", fontSize: "0.9rem" }}>
                    {prediccionMesActual > 0 ? 'Media móvil 3 meses' : 'Necesita historial previo'}
                  </span>
                </div>
              </div>

              {/* Gráfico Principal — AreaChart original */}
              <div className={styles.card} style={{ minHeight: "450px", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h3 className={styles.cardTitle}>Análisis de Consumo y Predicción</h3>
                    <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
                      Datos reales vs. tendencia — {new Date().getFullYear()}
                      <span style={{ marginLeft: "0.5rem", background: "rgba(59,246,59,0.1)", color: "#3bf63b", padding: "2px 8px", borderRadius: "8px", fontSize: "0.75rem" }}>
                        Mes actual: {nombresMeses[mesActual]}
                      </span>
                    </p>
                  </div>
                </div>

                <div style={{ flex: 1, width: "100%", height: "100%", minHeight: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={datosGrafico}>
                      <defs>
                        <linearGradient id="colorConsumo" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3bf63b" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3bf63b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPrediccion" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="mes" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}L`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
                        itemStyle={{ color: "#e2e8f0" }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Area type="monotone" dataKey="consumo" name="Consumo Real (L)" stroke="#3bf63b" fillOpacity={1} fill="url(#colorConsumo)" strokeWidth={3} />
                      <Area type="monotone" dataKey="prediccion" name="Predicción (L)" stroke="#8884d8" strokeDasharray="5 5" fillOpacity={0.4} fill="url(#colorPrediccion)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabla editable de datos mensuales */}
              <div className={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <div>
                    <h3 className={styles.cardTitle}>Datos Mensuales</h3>
                    <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Clickea en un mes para editar el consumo manualmente. Los datos de rutas y repostajes se calculan automáticamente.</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem" }}>
                  {datosGrafico.map((d, i) => (
                    <div
                      key={d.mes}
                      onClick={() => { setEditandoMes(i); setInputConsumo(d.consumo > 0 ? String(d.consumo) : ''); }}
                      style={{
                        padding: "0.75rem",
                        background: d.esMesActual ? "rgba(59,246,59,0.08)" : "rgba(255,255,255,0.02)",
                        border: d.esMesActual ? "1px solid rgba(59,246,59,0.3)" : "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "10px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        position: "relative",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: "700", color: d.esMesActual ? "#3bf63b" : "#94a3b8", textTransform: "uppercase" }}>
                          {d.mes}
                        </span>
                        {d.esManual && <span style={{ fontSize: "0.55rem", background: "rgba(139,92,246,0.2)", color: "#a78bfa", padding: "1px 5px", borderRadius: "4px" }}>manual</span>}
                        {d.esMesActual && <span style={{ fontSize: "0.55rem", background: "rgba(59,246,59,0.2)", color: "#3bf63b", padding: "1px 5px", borderRadius: "4px" }}>actual</span>}
                      </div>

                      {editandoMes === i ? (
                        <form
                          onSubmit={(e) => { e.preventDefault(); guardarDatoManual(i, parseFloat(inputConsumo) || 0); }}
                          style={{ marginTop: "0.4rem" }}
                        >
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            background: "rgba(0,0,0,0.5)",
                            border: "1px solid rgba(59,246,59,0.4)",
                            borderRadius: "8px",
                            overflow: "hidden",
                            boxShadow: "0 0 0 3px rgba(59,246,59,0.08)"
                          }}>
                            <input
                              autoFocus
                              type="number"
                              step="0.1"
                              min="0"
                              value={inputConsumo}
                              onChange={(e) => setInputConsumo(e.target.value)}
                              onBlur={() => { guardarDatoManual(i, parseFloat(inputConsumo) || 0); }}
                              placeholder="0.0"
                              style={{
                                flex: 1,
                                width: "100%",
                                minWidth: 0,
                                padding: "0.45rem 0.5rem",
                                background: "transparent",
                                border: "none",
                                color: "#fff",
                                fontSize: "1rem",
                                fontWeight: "700",
                                outline: "none",
                                textAlign: "center",
                              }}
                            />
                            <span style={{
                              padding: "0.45rem 0.6rem",
                              background: "rgba(59,246,59,0.12)",
                              color: "#3bf63b",
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              letterSpacing: "0.05em",
                              borderLeft: "1px solid rgba(59,246,59,0.2)",
                              whiteSpace: "nowrap",
                            }}>L</span>
                          </div>
                          <p style={{ fontSize: "0.6rem", color: "#4b5563", marginTop: "0.3rem", textAlign: "center" }}>Enter o clic fuera</p>
                        </form>
                      ) : (
                        <div style={{ fontSize: "1.2rem", fontWeight: "800", color: d.consumo > 0 ? "#fff" : "#374151", marginTop: "0.2rem" }}>
                          {d.consumo > 0 ? `${d.consumo}L` : '—'}
                        </div>
                      )}

                      {d.prediccion > 0 && editandoMes !== i && (
                        <div style={{ fontSize: "0.65rem", color: "#8884d8", marginTop: "0.25rem" }}>
                          ↗ {d.prediccion}L pred.
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {datosManual.some(v => v > 0) && (
                  <button
                    onClick={() => { setDatosManual(new Array(12).fill(0)); localStorage.removeItem('carcare_consumo_manual'); toast.success('Datos manuales eliminados'); }}
                    style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#ef4444", cursor: "pointer", fontSize: "0.8rem" }}
                  >
                    Limpiar datos manuales
                  </button>
                )}
              </div>

              {/* ── Reporte Mensual ──────────────────────────────────────────── */}
              <div className={styles.card} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h3 style={{ color: "#fff", fontSize: "1rem", marginBottom: "0.25rem" }}>📧 Reporte Mensual por Email</h3>
                <p style={{ color: "#6b7280", fontSize: "0.82rem", margin: 0 }}>
                  Recibí un resumen con KPIs de flota, combustible y mantenimiento en tu email.
                </p>
              </div>
              <button
                disabled={enviandoReporte}
                onClick={async () => {
                  setEnviandoReporte(true);
                  try {
                    const res = await fetch(`${API_URL}/api/reportes/enviar`, {
                      method: "POST",
                      headers: getAuthHeaders(),
                    });
                    if (res.ok) {
                      toast.success("Reporte enviado a tu email correctamente");
                    } else {
                      const data = await res.json().catch(() => ({}));
                      toast.error(data.error || "No se pudo enviar el reporte");
                    }
                  } catch {
                    toast.error("Error de conexión al enviar el reporte");
                  } finally {
                    setEnviandoReporte(false);
                  }
                }}
                style={{
                  padding: "0.6rem 1.4rem",
                  background: enviandoReporte ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.4)",
                  borderRadius: "10px",
                  color: enviandoReporte ? "#9ca3af" : "#a5b4fc",
                  cursor: enviandoReporte ? "not-allowed" : "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                }}
              >
                {enviandoReporte ? "Enviando..." : "Enviar Reporte"}
              </button>
              </div>
            </div>
          )}

          {activeTab === 'tracking' && (
            <div className={styles.rutasContainer} style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
              {/* Mapa Tracking Global */}
              <div className={styles.card} style={{ height: '600px', padding: 0, overflow: 'hidden', position: 'relative', border: '1px solid rgba(59, 246, 59, 0.3)', boxShadow: '0 0 50px rgba(59, 246, 59, 0.1)' }}>
                <MapTrackingGlobal
                  rutasActivas={rutas}
                  onRutaClick={(rutaId) => router.push(`/ruta/${rutaId}`)}
                />

                <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(0,0,0,0.8)', padding: '1rem', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', zIndex: 1000 }}>
                  <h3 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }}></span>
                    En Vivo
                  </h3>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent)' }}>
                    {rutas.filter(r => r.estado === 'EN_CURSO' || r.estado === 'DETENIDO').length}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Vehículos en ruta</div>
                </div>
              </div>

              {/* Lista de Vehículos en Ruta */}
              <div>
                <h3 style={{ marginBottom: '1rem', color: '#fff' }}>Estado de la Flota Activa</h3>
                <div className={styles.grid}>
                  {rutas.filter(r => r.estado === 'EN_CURSO' || r.estado === 'DETENIDO').map(r => {
                    const status = getConnectionStatus(r.ultimaActualizacionGPS, !!(r.latitudActual && r.longitudActual));

                    return (
                      <div
                        key={r.id}
                        className={styles.card}
                        onClick={() => router.push(`/ruta/${r.id}`)}
                        style={{ cursor: 'pointer', borderLeft: `4px solid ${status.color}` }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div>
                            <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.2rem' }}>{r.vehiculoId?.slice(-8) || 'Desconocido'}</h4>
                            <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Ruta #{r.id?.slice(-6).toUpperCase()}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '12px',
                              background: `${status.color}20`,
                              color: status.color,
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              border: `1px solid ${status.color}40`
                            }}>
                              {status.text.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className={styles.statRow}>
                          <span className={styles.statLabel}>Ubicación Actual</span>
                          <span className={styles.statValue} style={{ fontSize: '0.85rem' }}>
                            {r.latitudActual?.toFixed(4)}, {r.longitudActual?.toFixed(4)}
                          </span>
                        </div>

                        <div className={styles.statRow}>
                          <span className={styles.statLabel}>Velocidad</span>
                          <span className={styles.statValue} style={{ color: '#fff', fontWeight: 'bold' }}>
                            0 km/h
                          </span>
                        </div>

                        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                          <span>
                            {r.estado === 'DETENIDO' ? '🟠 Vehículo detenido' : (status.status === 'online' ? '🟢 Transmitiendo datos' : (status.status === 'idle' ? '🟠 Conexión inestable' : '🔴 Sin conexión'))}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {rutas.filter(r => r.estado === 'EN_CURSO' || r.estado === 'DETENIDO').length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                      <p style={{ color: '#6b7280' }}>No hay vehículos activos en este momento.</p>
                      <button onClick={() => setActiveTab('rutas')} style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>
                        Planificar una ruta
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </BackgroundMeteors>
  );
}
