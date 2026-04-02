"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import BackgroundMeteors from "@/componentes/BackgroundMeteors";
import styles from "../../dashboard/page.module.css";

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

interface Taller {
  nombre: string;
  direccion: string;
  telefono: string;
}

interface Repuesto {
  nombre: string;
  cantidad: number;
  costoUnitario: number;
}

interface Mantenimiento {
  id?: string;
  vehiculoId: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  kilometrajeRealizado: number;
  costo: number;
  taller: Taller;
  repuestos: Repuesto[];
  observaciones: string;
  proximoMantenimiento?: number;
}

interface Repostaje {
  id?: string;
  vehiculoId: string;
  fecha?: string;
  litros: number;
  precioPorLitro: number;
  costeTotal?: number;
  kilometrajeActual?: number;
  estacion?: string;
  notas?: string;
  conductorId?: string;
  conductorNombre?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://saas-carcare-production-54f9.up.railway.app";
const DASHBOARD_ROUTE = "/dashboard";

export default function VehiculoDetalle() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [repostajes, setRepostajes] = useState<Repostaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'mantenimientos' | 'repostajes'>('mantenimientos');
  const [mostrarFormMantenimiento, setMostrarFormMantenimiento] = useState(false);
  const [mostrarFormRepostaje, setMostrarFormRepostaje] = useState(false);

  const [nuevoMantenimiento, setNuevoMantenimiento] = useState<Partial<Mantenimiento>>({
    tipo: "PREVENTIVO",
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
    kilometrajeRealizado: 0,
    costo: 0,
    taller: { nombre: "", direccion: "", telefono: "" },
    repuestos: [],
    observaciones: "",
    proximoMantenimiento: 0,
  });

  const [nuevoRepostaje, setNuevoRepostaje] = useState<Partial<Repostaje>>({
    litros: 0,
    precioPorLitro: 1.65,
    kilometrajeActual: 0,
    estacion: "",
    notas: "",
    fecha: new Date().toISOString().split("T")[0],
  });

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window === 'undefined') return headers;
    const token = localStorage.getItem("token");
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resVehiculo, resMantenimientos, resRepostajes] = await Promise.all([
        fetch(`${API_URL}/api/vehiculos/${id}`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/mantenimientos/vehiculo/${id}`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/repostajes/vehiculo/${id}`, { headers: getAuthHeaders() }),
      ]);

      if (resVehiculo.ok) setVehiculo(await resVehiculo.json());
      if (resMantenimientos.ok) setMantenimientos(await resMantenimientos.json());
      if (resRepostajes.ok) setRepostajes(await resRepostajes.json());
    } catch (err) {
      toast.error("Error al cargar los datos del vehículo");
    } finally {
      setLoading(false);
    }
  };

  // ── Mantenimiento handlers ─────────────────────────────────────────────────

  const handleCrearMantenimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    const isPreventivo = nuevoMantenimiento.tipo === "PREVENTIVO";
    const endpoint = isPreventivo ? "/api/mantenimientos/preventivo" : "/api/mantenimientos/correctivo";
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...nuevoMantenimiento, vehiculoId: id }),
      });
      if (res.ok) {
        toast.success(`${isPreventivo ? 'Mantenimiento Preventivo' : 'Mantenimiento Correctivo'} registrado`);
        setMostrarFormMantenimiento(false);
        cargarDatos();
        setNuevoMantenimiento({
          tipo: "PREVENTIVO", descripcion: "",
          fecha: new Date().toISOString().split("T")[0],
          kilometrajeRealizado: vehiculo?.kilometraje || 0,
          costo: 0, taller: { nombre: "", direccion: "", telefono: "" },
          repuestos: [], observaciones: "",
          proximoMantenimiento: (vehiculo?.kilometraje || 0) + 15000,
        });
      }
    } catch { toast.error("Error al registrar mantenimiento"); }
  };

  const handleEliminarMantenimiento = async (manId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/mantenimientos/${manId}`, { method: "DELETE" });
      if (res.ok) { toast.success("Mantenimiento eliminado"); cargarDatos(); }
    } catch { toast.error("Error al eliminar mantenimiento"); }
  };

  const agregarRepuesto = () => {
    setNuevoMantenimiento({
      ...nuevoMantenimiento,
      repuestos: [...(nuevoMantenimiento.repuestos || []), { nombre: "", cantidad: 1, costoUnitario: 0 }],
    });
  };

  const actualizarRepuesto = (index: number, campo: string, valor: any) => {
    const repuestosActualizados = [...(nuevoMantenimiento.repuestos || [])];
    repuestosActualizados[index] = { ...repuestosActualizados[index], [campo]: valor };
    setNuevoMantenimiento({ ...nuevoMantenimiento, repuestos: repuestosActualizados });
  };

  const eliminarRepuesto = (index: number) => {
    setNuevoMantenimiento({
      ...nuevoMantenimiento,
      repuestos: nuevoMantenimiento.repuestos?.filter((_, i) => i !== index),
    });
  };

  // ── Repostaje handlers ──────────────────────────────────────────────────────

  const handleCrearRepostaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoRepostaje.litros || nuevoRepostaje.litros <= 0) {
      toast.warning("Ingresá la cantidad de litros");
      return;
    }
    if (!nuevoRepostaje.precioPorLitro || nuevoRepostaje.precioPorLitro <= 0) {
      toast.warning("Ingresá el precio por litro");
      return;
    }
    const costeTotal = Math.round((nuevoRepostaje.litros * nuevoRepostaje.precioPorLitro) * 100) / 100;
    try {
      const res = await fetch(`${API_URL}/api/repostajes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...nuevoRepostaje,
          vehiculoId: id,
          costeTotal,
          // LocalDateTime en el backend requiere formato con hora — "2026-04-02" sola da 400
          fecha: nuevoRepostaje.fecha ? `${nuevoRepostaje.fecha}T00:00:00` : undefined,
          kilometrajeActual: nuevoRepostaje.kilometrajeActual && nuevoRepostaje.kilometrajeActual > 0
            ? nuevoRepostaje.kilometrajeActual : undefined,
        }),
      });
      if (res.ok) {
        toast.success(`Repostaje registrado — €${costeTotal.toFixed(2)}`);
        setMostrarFormRepostaje(false);
        cargarDatos();
        setNuevoRepostaje({
          litros: 0, precioPorLitro: 1.65, kilometrajeActual: 0,
          estacion: "", notas: "",
          fecha: new Date().toISOString().split("T")[0],
        });
      } else {
        const errBody = await res.text().catch(() => '');
        if (res.status === 403) toast.error("Sin permiso para este vehículo");
        else if (res.status === 400) toast.error("Datos inválidos — revisá los campos");
        else toast.error(`Error al registrar repostaje (${res.status})`);
        console.error('Repostaje error:', res.status, errBody);
      }
    } catch { toast.error("Error de conexión"); }
  };

  const handleEliminarRepostaje = async (repId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/repostajes/${repId}`, {
        method: "DELETE", headers: getAuthHeaders(),
      });
      if (res.ok) { toast.success("Repostaje eliminado"); cargarDatos(); }
    } catch { toast.error("Error al eliminar repostaje"); }
  };

  // ── Métricas ────────────────────────────────────────────────────────────────

  const costoTotalMantenimiento = mantenimientos.reduce((sum, m) => sum + (m.costo || 0), 0);
  const costoTotalCombustible = repostajes.reduce((sum, r) => sum + (r.costeTotal || 0), 0);
  const litrosTotales = repostajes.reduce((sum, r) => sum + (r.litros || 0), 0);
  const costoTotalVehiculo = costoTotalMantenimiento + costoTotalCombustible;

  const ultimoRepostaje = repostajes.length > 0
    ? repostajes.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))[0]
    : null;

  const costeTotal = nuevoRepostaje.litros && nuevoRepostaje.precioPorLitro
    ? Math.round((nuevoRepostaje.litros * nuevoRepostaje.precioPorLitro) * 100) / 100
    : 0;

  if (loading) {
    return (
      <BackgroundMeteors>
        <div style={{ padding: "2rem", color: "white" }}>Cargando...</div>
      </BackgroundMeteors>
    );
  }

  if (!vehiculo) {
    return (
      <BackgroundMeteors>
        <div style={{ padding: "2rem", color: "white" }}>Vehículo no encontrado</div>
      </BackgroundMeteors>
    );
  }

  return (
    <BackgroundMeteors>
      <main style={{ height: "100%", width: "100%", overflowY: "auto", position: "relative", zIndex: 20, paddingBottom: "100px" }}>
        <div className={styles.container}>
          <header className={styles.header}>
            <button
              onClick={() => router.push(DASHBOARD_ROUTE)}
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", padding: "0.5rem 1rem", borderRadius: "8px", color: "white", cursor: "pointer", marginBottom: "1rem" }}
            >
              ← Volver al Dashboard
            </button>
            <div className={styles.title}>
              <h1>{vehiculo.marca} {vehiculo.modelo}</h1>
              <p className={styles.subtitle}>Matrícula: {vehiculo.matricula}</p>
            </div>
          </header>

          {/* ── Resumen financiero del vehículo ──────────────────────────── */}
          <div className={styles.card} style={{ marginBottom: "2rem" }}>
            <h3 className={styles.cardTitle} style={{ marginBottom: '1.25rem' }}>Resumen del Vehículo</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ display: 'block', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>Kilometraje</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff' }}>{vehiculo.kilometraje?.toLocaleString()}</span>
                <span style={{ fontSize: '0.75rem', color: '#4b5563', marginLeft: '0.3rem' }}>km</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ display: 'block', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>Combustible</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f59e0b' }}>{vehiculo.combustibleActual?.toLocaleString('es-ES', { maximumFractionDigits: 1 })}</span>
                <span style={{ fontSize: '0.75rem', color: '#4b5563', marginLeft: '0.3rem' }}>L</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ display: 'block', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>Coste Combustible</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f59e0b' }}>{costoTotalCombustible.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span style={{ fontSize: '0.75rem', color: '#4b5563', marginLeft: '0.3rem' }}>€ · {litrosTotales.toFixed(0)}L total</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ display: 'block', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>Coste Mantenimiento</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ef4444' }}>{costoTotalMantenimiento.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span style={{ fontSize: '0.75rem', color: '#4b5563', marginLeft: '0.3rem' }}>€</span>
              </div>

              <div style={{ background: 'rgba(59, 246, 59, 0.05)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(59, 246, 59, 0.15)' }}>
                <span style={{ display: 'block', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>Coste Total Acumulado</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#3bf63b' }}>{costoTotalVehiculo.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span style={{ fontSize: '0.75rem', color: '#4b5563', marginLeft: '0.3rem' }}>€</span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ display: 'block', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>Estado</span>
                <span style={{ fontSize: '1rem', fontWeight: '700', color: vehiculo.activo ? '#3bf63b' : '#f87171' }}>
                  {vehiculo.activo ? 'Activo' : 'En Taller'}
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#4b5563', marginTop: '0.2rem' }}>{vehiculo.tipoCombustible}</span>
              </div>
            </div>
          </div>

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#0d1117', padding: '0.35rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', width: 'fit-content' }}>
            <button
              onClick={() => setActiveTab('mantenimientos')}
              style={{
                padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.2s',
                background: activeTab === 'mantenimientos' ? 'linear-gradient(135deg, #3bf63b, #22c55e)' : 'transparent',
                color: activeTab === 'mantenimientos' ? '#000' : 'rgba(255,255,255,0.5)',
                boxShadow: activeTab === 'mantenimientos' ? '0 2px 12px rgba(59,246,59,0.35)' : 'none',
              }}
            >
              🔧 Mantenimientos ({mantenimientos.length})
            </button>
            <button
              onClick={() => setActiveTab('repostajes')}
              style={{
                padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.2s',
                background: activeTab === 'repostajes' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                color: activeTab === 'repostajes' ? '#000' : 'rgba(255,255,255,0.5)',
                boxShadow: activeTab === 'repostajes' ? '0 2px 12px rgba(245,158,11,0.35)' : 'none',
              }}
            >
              ⛽ Repostajes ({repostajes.length})
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              TAB: MANTENIMIENTOS
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'mantenimientos' && (
            <>
              <div style={{ marginBottom: "2rem" }}>
                <button
                  onClick={() => setMostrarFormMantenimiento(!mostrarFormMantenimiento)}
                  className={styles.submitButton}
                  style={{ width: "auto" }}
                >
                  {mostrarFormMantenimiento ? "Cancelar" : "+ Nuevo Mantenimiento"}
                </button>
              </div>

              {mostrarFormMantenimiento && (
                <div className={styles.formContainer} style={{ marginBottom: "2rem" }}>
                  <h3 style={{ marginBottom: "1rem" }}>Registrar Mantenimiento</h3>
                  <form onSubmit={handleCrearMantenimiento}>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Tipo</label>
                        <select className={styles.select} value={nuevoMantenimiento.tipo}
                          onChange={(e) => setNuevoMantenimiento({ ...nuevoMantenimiento, tipo: e.target.value })} required>
                          <option value="PREVENTIVO">Preventivo</option>
                          <option value="CORRECTIVO">Correctivo</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Fecha</label>
                        <input className={styles.input} type="date" value={nuevoMantenimiento.fecha}
                          onChange={(e) => setNuevoMantenimiento({ ...nuevoMantenimiento, fecha: e.target.value })} required />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Descripción</label>
                      <input className={styles.input} type="text" placeholder="Ej: Cambio de aceite y filtros"
                        value={nuevoMantenimiento.descripcion}
                        onChange={(e) => setNuevoMantenimiento({ ...nuevoMantenimiento, descripcion: e.target.value })} required />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <label className={styles.label} style={{ marginBottom: 0 }}>Kilometraje Realizado</label>
                          <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{nuevoMantenimiento.kilometrajeRealizado?.toLocaleString()} km</span>
                        </div>
                        <input className={styles.input} type="range" min="0" max="1000000" step="100"
                          style={{ padding: '0.5rem', cursor: 'pointer', height: '10px' }}
                          value={nuevoMantenimiento.kilometrajeRealizado}
                          onChange={(e) => setNuevoMantenimiento({ ...nuevoMantenimiento, kilometrajeRealizado: Number(e.target.value) })} required />
                      </div>
                      <div className={styles.formGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <label className={styles.label} style={{ marginBottom: 0 }}>Costo Total (€)</label>
                          <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{nuevoMantenimiento.costo} €</span>
                        </div>
                        <input className={styles.input} type="range" min="0" max="10000" step="10"
                          style={{ padding: '0.5rem', cursor: 'pointer', height: '10px' }}
                          value={nuevoMantenimiento.costo}
                          onChange={(e) => setNuevoMantenimiento({ ...nuevoMantenimiento, costo: Number(e.target.value) })} required />
                      </div>
                    </div>

                    {nuevoMantenimiento.tipo === "PREVENTIVO" && (
                      <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <label className={styles.label} style={{ marginBottom: 0 }}>Próximo Mantenimiento (En Km)</label>
                          <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{nuevoMantenimiento.proximoMantenimiento?.toLocaleString()} km</span>
                        </div>
                        <input className={styles.input} type="range"
                          min={nuevoMantenimiento.kilometrajeRealizado || 0}
                          max={(nuevoMantenimiento.kilometrajeRealizado || 0) + 100000} step="500"
                          style={{ padding: '0.5rem', cursor: 'pointer', height: '10px' }}
                          value={nuevoMantenimiento.proximoMantenimiento}
                          onChange={(e) => setNuevoMantenimiento({ ...nuevoMantenimiento, proximoMantenimiento: Number(e.target.value) })} />
                      </div>
                    )}

                    <h4 style={{ marginTop: "1.5rem", marginBottom: "1rem", color: "var(--accent)" }}>Taller</h4>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Nombre</label>
                        <input className={styles.input} type="text" placeholder="Taller Mecánico S.L."
                          value={nuevoMantenimiento.taller?.nombre}
                          onChange={(e) => setNuevoMantenimiento({ ...nuevoMantenimiento, taller: { ...nuevoMantenimiento.taller!, nombre: e.target.value } })} required />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Dirección</label>
                        <input className={styles.input} type="text" placeholder="Calle Principal 123"
                          value={nuevoMantenimiento.taller?.direccion}
                          onChange={(e) => setNuevoMantenimiento({ ...nuevoMantenimiento, taller: { ...nuevoMantenimiento.taller!, direccion: e.target.value } })} />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Teléfono</label>
                        <input className={styles.input} type="tel" placeholder="123456789"
                          value={nuevoMantenimiento.taller?.telefono}
                          onChange={(e) => setNuevoMantenimiento({ ...nuevoMantenimiento, taller: { ...nuevoMantenimiento.taller!, telefono: e.target.value } })} />
                      </div>
                    </div>

                    <h4 style={{ marginTop: "1.5rem", marginBottom: "1rem", color: "var(--accent)" }}>Repuestos</h4>
                    {nuevoMantenimiento.repuestos?.map((rep, index) => (
                      <div key={index} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "end" }}>
                        <div className={styles.formGroup} style={{ flex: 2 }}>
                          <label className={styles.label}>Nombre</label>
                          <input className={styles.input} type="text" placeholder="Filtro de aceite"
                            value={rep.nombre} onChange={(e) => actualizarRepuesto(index, "nombre", e.target.value)} />
                        </div>
                        <div className={styles.formGroup} style={{ flex: 1 }}>
                          <label className={styles.label}>Cantidad</label>
                          <input className={styles.input} type="number" value={rep.cantidad}
                            onChange={(e) => actualizarRepuesto(index, "cantidad", Number(e.target.value))} />
                        </div>
                        <div className={styles.formGroup} style={{ flex: 1 }}>
                          <label className={styles.label}>Costo (€)</label>
                          <input className={styles.input} type="number" step="0.01" value={rep.costoUnitario}
                            onChange={(e) => actualizarRepuesto(index, "costoUnitario", Number(e.target.value))} />
                        </div>
                        <button type="button" onClick={() => eliminarRepuesto(index)}
                          style={{ background: "#ef4444", border: "none", padding: "0.5rem 1rem", borderRadius: "6px", color: "white", cursor: "pointer" }}>✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={agregarRepuesto}
                      style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", padding: "0.5rem 1rem", borderRadius: "6px", color: "white", cursor: "pointer", marginTop: "0.5rem" }}>
                      + Agregar Repuesto
                    </button>

                    <div className={styles.formGroup} style={{ marginTop: "1.5rem" }}>
                      <label className={styles.label}>Observaciones</label>
                      <textarea className={styles.input} rows={3} placeholder="Notas adicionales..."
                        value={nuevoMantenimiento.observaciones}
                        onChange={(e) => setNuevoMantenimiento({ ...nuevoMantenimiento, observaciones: e.target.value })} />
                    </div>
                    <button type="submit" className={styles.submitButton} style={{ marginTop: "1rem" }}>
                      Guardar Mantenimiento
                    </button>
                  </form>
                </div>
              )}

              <h2 style={{ marginBottom: "1rem" }}>Historial de Mantenimientos</h2>
              <div className={styles.grid}>
                {mantenimientos.map((m) => {
                  const esPreventivo = m.tipo === "PREVENTIVO";
                  return (
                    <div key={m.id} className={styles.card}
                      style={{ borderLeft: `6px solid ${esPreventivo ? "#22c55e" : "#ef4444"}`, background: 'linear-gradient(145deg, rgba(30,30,40,0.95), rgba(20,20,25,0.9))' }}>
                      <div className={styles.cardHeader}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                            <span className={styles.badge} style={{
                              backgroundColor: esPreventivo ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                              color: esPreventivo ? "#4ade80" : "#f87171",
                              border: `1px solid ${esPreventivo ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                            }}>{m.tipo}</span>
                            <span style={{ fontSize: "0.7rem", color: "#444", fontFamily: 'monospace' }}>#{m.id?.slice(-6).toUpperCase()}</span>
                          </div>
                          <h4 className={styles.cardTitle} style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>{m.descripcion}</h4>
                          <div style={{ display: 'flex', gap: '0.8rem', color: "#9ca3af", fontSize: "0.8rem" }}>
                            <span>📅 {m.fecha}</span>
                            <span>🏭 {m.taller?.nombre || "Taller oficial"}</span>
                          </div>
                        </div>
                        <button onClick={() => m.id && handleEliminarMantenimiento(m.id)}
                          style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', color: "#ef4444", width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>Recorrido</span>
                          <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff' }}>{m.kilometrajeRealizado?.toLocaleString()} <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>KM</span></span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>Coste</span>
                          <span style={{ fontSize: '1.15rem', fontWeight: '800', color: esPreventivo ? '#4ade80' : '#f87171' }}>{m.costo?.toFixed(2)} <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>€</span></span>
                        </div>
                      </div>

                      {esPreventivo && m.proximoMantenimiento && (
                        <div style={{ marginTop: '1rem', padding: '0.7rem 1rem', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '10px', border: '1px solid rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                          <span style={{ fontSize: '0.8rem', color: '#4ade80' }}>
                            Próxima revisión: <strong style={{ color: '#fff' }}>{m.proximoMantenimiento.toLocaleString()} km</strong>
                          </span>
                        </div>
                      )}

                      {m.repuestos && m.repuestos.length > 0 && (
                        <div style={{ marginTop: "1.2rem" }}>
                          <div style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
                            {m.repuestos.length} Repuestos instalados
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {m.repuestos.map((rep, index) => (
                              <span key={index} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', color: '#9ca3af' }}>
                                {rep.nombre} <small style={{ color: '#4b5563' }}>x{rep.cantidad}</small>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {m.observaciones && (
                        <div style={{ marginTop: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem' }}>
                          <p style={{ fontSize: "0.8rem", color: "#6b7280", fontStyle: 'italic' }}>
                            <span style={{ color: '#4b5563', marginRight: '0.3rem' }}>Notas:</span>{m.observaciones}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
                {mantenimientos.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>🔧</div>
                    <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Sin historial de mantenimientos</h3>
                    <p style={{ color: "#6b7280" }}>Aún no se han registrado intervenciones para este vehículo.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB: REPOSTAJES
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'repostajes' && (
            <>
              {/* Stats de combustible */}
              {repostajes.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>Total Gastado</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f59e0b' }}>€{costoTotalCombustible.toFixed(2)}</div>
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>Litros Totales</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f59e0b' }}>{litrosTotales.toFixed(1)} L</div>
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>Precio Medio</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f59e0b' }}>
                      €{litrosTotales > 0 ? (costoTotalCombustible / litrosTotales).toFixed(3) : '—'}
                      <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>/L</span>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>Repostajes</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f59e0b' }}>{repostajes.length}</div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: "2rem" }}>
                <button
                  onClick={() => setMostrarFormRepostaje(!mostrarFormRepostaje)}
                  style={{ padding: '0.875rem 1.5rem', background: mostrarFormRepostaje ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: mostrarFormRepostaje ? 'white' : '#000', border: mostrarFormRepostaje ? '1px solid rgba(255,255,255,0.2)' : 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {mostrarFormRepostaje ? "Cancelar" : "⛽ Registrar Repostaje"}
                </button>
              </div>

              {mostrarFormRepostaje && (
                <div className={styles.formContainer} style={{ marginBottom: "2rem" }}>
                  <h3 style={{ marginBottom: "1.25rem", color: '#f59e0b' }}>Registrar Repostaje</h3>
                  <form onSubmit={handleCrearRepostaje}>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Fecha</label>
                        <input className={styles.input} type="date"
                          value={nuevoRepostaje.fecha}
                          onChange={(e) => setNuevoRepostaje({ ...nuevoRepostaje, fecha: e.target.value })} required />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Estación de Servicio <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>(opcional)</span></label>
                        <input className={styles.input} type="text" placeholder="Ej: Repsol Av. Principal"
                          value={nuevoRepostaje.estacion}
                          onChange={(e) => setNuevoRepostaje({ ...nuevoRepostaje, estacion: e.target.value })} />
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <label className={styles.label} style={{ marginBottom: 0 }}>Litros</label>
                          <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{nuevoRepostaje.litros} L</span>
                        </div>
                        <input className={styles.input} type="number" step="0.1" min="0.1" placeholder="45.0"
                          value={nuevoRepostaje.litros || ''}
                          onChange={(e) => setNuevoRepostaje({ ...nuevoRepostaje, litros: parseFloat(e.target.value) || 0 })} required />
                      </div>
                      <div className={styles.formGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <label className={styles.label} style={{ marginBottom: 0 }}>Precio / Litro (€)</label>
                          <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>€{nuevoRepostaje.precioPorLitro?.toFixed(3)}/L</span>
                        </div>
                        <input className={styles.input} type="number" step="0.001" min="0.001" placeholder="1.650"
                          value={nuevoRepostaje.precioPorLitro || ''}
                          onChange={(e) => setNuevoRepostaje({ ...nuevoRepostaje, precioPorLitro: parseFloat(e.target.value) || 0 })} required />
                      </div>
                    </div>

                    {/* Preview del coste */}
                    {costeTotal > 0 && (
                      <div style={{ marginBottom: '1.25rem', padding: '0.875rem 1rem', background: 'rgba(245,158,11,0.1)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Coste total del repostaje</span>
                        <span style={{ color: '#f59e0b', fontWeight: '800', fontSize: '1.25rem' }}>€{costeTotal.toFixed(2)}</span>
                      </div>
                    )}

                    <div className={styles.formGroup}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <label className={styles.label} style={{ marginBottom: 0 }}>
                          Km actuales del vehículo <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>(opcional)</span>
                        </label>
                        {nuevoRepostaje.kilometrajeActual && nuevoRepostaje.kilometrajeActual > 0 &&
                          <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{nuevoRepostaje.kilometrajeActual?.toLocaleString()} km</span>
                        }
                      </div>
                      <input className={styles.input} type="number" min="0" placeholder="Ej: 125000 — actualiza automáticamente el odómetro"
                        value={nuevoRepostaje.kilometrajeActual || ''}
                        onChange={(e) => setNuevoRepostaje({ ...nuevoRepostaje, kilometrajeActual: parseInt(e.target.value) || 0 })} />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Notas <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>(opcional)</span></label>
                      <textarea className={styles.input} rows={2} placeholder="Ej: Repostaje completo, tarjeta empresa"
                        value={nuevoRepostaje.notas}
                        onChange={(e) => setNuevoRepostaje({ ...nuevoRepostaje, notas: e.target.value })} />
                    </div>

                    <button type="submit"
                      style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', marginTop: '0.5rem' }}>
                      Guardar Repostaje
                    </button>
                  </form>
                </div>
              )}

              <h2 style={{ marginBottom: "1rem" }}>Historial de Repostajes</h2>
              <div className={styles.grid}>
                {repostajes
                  .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
                  .map((r) => (
                    <div key={r.id} className={styles.card}
                      style={{ borderLeft: '6px solid #f59e0b', background: 'linear-gradient(145deg, rgba(30,30,40,0.95), rgba(20,20,25,0.9))' }}>
                      <div className={styles.cardHeader}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            <span className={styles.badge} style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                              REPOSTAJE
                            </span>
                            {r.estacion && (
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>⛽ {r.estacion}</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                            📅 {r.fecha ? new Date(r.fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                          </div>
                          {r.conductorNombre && (
                            <div style={{ fontSize: '0.8rem', color: '#60a5fa', marginTop: '0.2rem' }}>
                              👤 {r.conductorNombre}
                            </div>
                          )}
                        </div>
                        <button onClick={() => r.id && handleEliminarRepostaje(r.id)}
                          style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', color: "#ef4444", width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.875rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.6rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>Litros</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f59e0b' }}>{r.litros?.toFixed(1)} <span style={{ fontSize: '0.7rem', color: '#4b5563' }}>L</span></span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.6rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>€/Litro</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>€{r.precioPorLitro?.toFixed(3)}</span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.6rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>Total</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f59e0b' }}>€{r.costeTotal?.toFixed(2)}</span>
                        </div>
                      </div>

                      {r.kilometrajeActual && r.kilometrajeActual > 0 && (
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.875rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.8rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ color: '#6b7280' }}>Odómetro:</span>
                          <span style={{ color: '#fff', fontWeight: '600' }}>{r.kilometrajeActual.toLocaleString()} km</span>
                        </div>
                      )}

                      {r.notas && (
                        <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.6rem' }}>
                          <p style={{ fontSize: "0.8rem", color: "#6b7280", fontStyle: 'italic', margin: 0 }}>
                            <span style={{ color: '#4b5563', marginRight: '0.3rem' }}>Notas:</span>{r.notas}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                {repostajes.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '2px dashed rgba(245,158,11,0.15)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.4 }}>⛽</div>
                    <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Sin repostajes registrados</h3>
                    <p style={{ color: "#6b7280" }}>Registrá el primer repostaje para empezar a rastrear el gasto en combustible.</p>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </main>
    </BackgroundMeteors>
  );
}
