"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import BackgroundMeteors from "@/componentes/BackgroundMeteors";
import styles from "../../page.module.css";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://saas-carcare-production.up.railway.app";

export default function VehiculoDetalle() {
  const router = useRouter();
  const params = useParams();
  // Safe access to ID, ensuring it's a string
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

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

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resVehiculo, resMantenimientos] = await Promise.all([
        fetch(`${API_URL}/api/vehiculos/${id}`),
        fetch(`${API_URL}/api/mantenimientos/vehiculo/${id}`),
      ]);

      if (resVehiculo.ok) {
        const data = await resVehiculo.json();
        setVehiculo(data);
      }

      if (resMantenimientos.ok) {
        const data = await resMantenimientos.json();
        setMantenimientos(data);
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
      toast.error("Error al cargar los datos del vehículo");
    } finally {
      setLoading(false);
    }
  };

  const handleCrearMantenimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    const isPreventivo = nuevoMantenimiento.tipo === "PREVENTIVO";
    const endpoint = isPreventivo ? "/api/mantenimientos/preventivo" : "/api/mantenimientos/correctivo";

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nuevoMantenimiento, vehiculoId: id }),
      });
      if (res.ok) {
        toast.success(`${isPreventivo ? 'Mantenimiento Preventivo' : 'Mantenimiento Correctivo'} registrado`);
        setMostrarFormulario(false);
        cargarDatos();
        setNuevoMantenimiento({
          tipo: "PREVENTIVO",
          descripcion: "",
          fecha: new Date().toISOString().split("T")[0],
          kilometrajeRealizado: vehiculo?.kilometraje || 0,
          costo: 0,
          taller: { nombre: "", direccion: "", telefono: "" },
          repuestos: [],
          observaciones: "",
          proximoMantenimiento: (vehiculo?.kilometraje || 0) + 15000,
        });
      }
    } catch (error) {
      toast.error("Error al registrar mantenimiento");
    }
  };

  const handleEliminarMantenimiento = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/mantenimientos/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Mantenimiento eliminado");
        cargarDatos();
      }
    } catch (error) {
      toast.error("Error al eliminar mantenimiento");
    }
  };

  const agregarRepuesto = () => {
    setNuevoMantenimiento({
      ...nuevoMantenimiento,
      repuestos: [
        ...(nuevoMantenimiento.repuestos || []),
        { nombre: "", cantidad: 1, costoUnitario: 0 },
      ],
    });
  };

  const actualizarRepuesto = (index: number, campo: string, valor: any) => {
    const repuestosActualizados = [...(nuevoMantenimiento.repuestos || [])];
    repuestosActualizados[index] = { ...repuestosActualizados[index], [campo]: valor };
    setNuevoMantenimiento({ ...nuevoMantenimiento, repuestos: repuestosActualizados });
  };

  const eliminarRepuesto = (index: number) => {
    const repuestosActualizados = nuevoMantenimiento.repuestos?.filter((_, i) => i !== index);
    setNuevoMantenimiento({ ...nuevoMantenimiento, repuestos: repuestosActualizados });
  };

  const costoTotal = mantenimientos.reduce((sum, m) => sum + (m.costo || 0), 0);

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
              onClick={() => router.push("/")}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                color: "white",
                cursor: "pointer",
                marginBottom: "1rem",
              }}
            >
              ← Volver al Dashboard
            </button>
            <div className={styles.title}>
              <h1>
                {vehiculo.marca} {vehiculo.modelo}
              </h1>
              <p className={styles.subtitle}>Matrícula: {vehiculo.matricula}</p>
            </div>
          </header>

          {/* Info del Vehículo */}
          <div className={styles.card} style={{ marginBottom: "2rem" }}>
            <h3 className={styles.cardTitle}>Información del Vehículo</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Kilometraje</span>
                <span className={styles.statValue}>{vehiculo.kilometraje?.toLocaleString()} km</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Combustible</span>
                <span className={styles.statValue}>{vehiculo.tipoCombustible}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Estado</span>
                <span className={styles.statValue}>{vehiculo.activo ? "Activo" : "En Taller"}</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Gasto Total</span>
                <span className={styles.statValue} style={{ color: "#ef4444" }}>
                  {costoTotal.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>

          {/* Botón Nuevo Mantenimiento */}
          <div style={{ marginBottom: "2rem" }}>
            <button
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className={styles.submitButton}
              style={{ width: "auto" }}
            >
              {mostrarFormulario ? "Cancelar" : "+ Nuevo Mantenimiento"}
            </button>
          </div>

          {/* Formulario Nuevo Mantenimiento */}
          {mostrarFormulario && (
            <div className={styles.formContainer} style={{ marginBottom: "2rem" }}>
              <h3 style={{ marginBottom: "1rem" }}>Registrar Mantenimiento</h3>
              <form onSubmit={handleCrearMantenimiento}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tipo</label>
                    <select
                      className={styles.select}
                      value={nuevoMantenimiento.tipo}
                      onChange={(e) => setNuevoMantenimiento({ ...nuevoMantenimiento, tipo: e.target.value })}
                      required
                    >
                      <option value="PREVENTIVO">Preventivo</option>
                      <option value="CORRECTIVO">Correctivo</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Fecha</label>
                    <input
                      className={styles.input}
                      type="date"
                      value={nuevoMantenimiento.fecha}
                      onChange={(e) => setNuevoMantenimiento({ ...nuevoMantenimiento, fecha: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Descripción</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Ej: Cambio de aceite y filtros"
                    value={nuevoMantenimiento.descripcion}
                    onChange={(e) => setNuevoMantenimiento({ ...nuevoMantenimiento, descripcion: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label className={styles.label} style={{ marginBottom: 0 }}>Kilometraje Realizado</label>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{nuevoMantenimiento.kilometrajeRealizado?.toLocaleString()} km</span>
                    </div>
                    <input
                      className={styles.input}
                      type="range"
                      min="0"
                      max="1000000"
                      step="100"
                      style={{ padding: '0.5rem', cursor: 'pointer', height: '10px' }}
                      value={nuevoMantenimiento.kilometrajeRealizado}
                      onChange={(e) => setNuevoMantenimiento({ ...nuevoMantenimiento, kilometrajeRealizado: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label className={styles.label} style={{ marginBottom: 0 }}>Costo Total (€)</label>
                      <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{nuevoMantenimiento.costo} €</span>
                    </div>
                    <input
                      className={styles.input}
                      type="range"
                      min="0"
                      max="10000"
                      step="10"
                      style={{ padding: '0.5rem', cursor: 'pointer', height: '10px' }}
                      value={nuevoMantenimiento.costo}
                      onChange={(e) => setNuevoMantenimiento({ ...nuevoMantenimiento, costo: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                {nuevoMantenimiento.tipo === "PREVENTIVO" && (
                  <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <label className={styles.label} style={{ marginBottom: 0 }}>Próximo Mantenimiento (En Km)</label>
                      <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{nuevoMantenimiento.proximoMantenimiento?.toLocaleString()} km</span>
                    </div>
                    <input
                      className={styles.input}
                      type="range"
                      min={nuevoMantenimiento.kilometrajeRealizado || 0}
                      max={(nuevoMantenimiento.kilometrajeRealizado || 0) + 100000}
                      step="500"
                      style={{ padding: '0.5rem', cursor: 'pointer', height: '10px' }}
                      value={nuevoMantenimiento.proximoMantenimiento}
                      onChange={(e) => setNuevoMantenimiento({ ...nuevoMantenimiento, proximoMantenimiento: Number(e.target.value) })}
                    />
                  </div>
                )}

                <h4 style={{ marginTop: "1.5rem", marginBottom: "1rem", color: "var(--accent)" }}>Taller</h4>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nombre</label>
                    <input
                      className={styles.input}
                      type="text"
                      placeholder="Taller Mecánico S.L."
                      value={nuevoMantenimiento.taller?.nombre}
                      onChange={(e) =>
                        setNuevoMantenimiento({
                          ...nuevoMantenimiento,
                          taller: { ...nuevoMantenimiento.taller!, nombre: e.target.value },
                        })
                      }
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Dirección</label>
                    <input
                      className={styles.input}
                      type="text"
                      placeholder="Calle Principal 123"
                      value={nuevoMantenimiento.taller?.direccion}
                      onChange={(e) =>
                        setNuevoMantenimiento({
                          ...nuevoMantenimiento,
                          taller: { ...nuevoMantenimiento.taller!, direccion: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Teléfono</label>
                    <input
                      className={styles.input}
                      type="tel"
                      placeholder="123456789"
                      value={nuevoMantenimiento.taller?.telefono}
                      onChange={(e) =>
                        setNuevoMantenimiento({
                          ...nuevoMantenimiento,
                          taller: { ...nuevoMantenimiento.taller!, telefono: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <h4 style={{ marginTop: "1.5rem", marginBottom: "1rem", color: "var(--accent)" }}>Repuestos</h4>
                {nuevoMantenimiento.repuestos?.map((rep, index) => (
                  <div key={index} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "end" }}>
                    <div className={styles.formGroup} style={{ flex: 2 }}>
                      <label className={styles.label}>Nombre</label>
                      <input
                        className={styles.input}
                        type="text"
                        placeholder="Filtro de aceite"
                        value={rep.nombre}
                        onChange={(e) => actualizarRepuesto(index, "nombre", e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label className={styles.label}>Cantidad</label>
                      <input
                        className={styles.input}
                        type="number"
                        value={rep.cantidad}
                        onChange={(e) => actualizarRepuesto(index, "cantidad", Number(e.target.value))}
                      />
                    </div>
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label className={styles.label}>Costo (€)</label>
                      <input
                        className={styles.input}
                        type="number"
                        step="0.01"
                        value={rep.costoUnitario}
                        onChange={(e) => actualizarRepuesto(index, "costoUnitario", Number(e.target.value))}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarRepuesto(index)}
                      style={{
                        background: "#ef4444",
                        border: "none",
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={agregarRepuesto}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    color: "white",
                    cursor: "pointer",
                    marginTop: "0.5rem",
                  }}
                >
                  + Agregar Repuesto
                </button>

                <div className={styles.formGroup} style={{ marginTop: "1.5rem" }}>
                  <label className={styles.label}>Observaciones</label>
                  <textarea
                    className={styles.input}
                    rows={3}
                    placeholder="Notas adicionales..."
                    value={nuevoMantenimiento.observaciones}
                    onChange={(e) => setNuevoMantenimiento({ ...nuevoMantenimiento, observaciones: e.target.value })}
                  />
                </div>

                <button type="submit" className={styles.submitButton} style={{ marginTop: "1rem" }}>
                  Guardar Mantenimiento
                </button>
              </form>
            </div>
          )}

          {/* Historial de Mantenimientos */}
          <h2 style={{ marginBottom: "1rem" }}>Historial de Mantenimientos</h2>
          <div className={styles.grid}>
            {mantenimientos.map((m) => {
              const esPreventivo = m.tipo === "PREVENTIVO";
              return (
                <div
                  key={m.id}
                  className={styles.card}
                  style={{
                    borderLeft: `6px solid ${esPreventivo ? "#22c55e" : "#ef4444"}`,
                    background: 'linear-gradient(145deg, rgba(30,30,40,0.95), rgba(20,20,25,0.9))',
                    transform: 'translateY(0)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <div className={styles.cardHeader}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <span className={styles.badge} style={{
                          backgroundColor: esPreventivo ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: esPreventivo ? "#4ade80" : "#f87171",
                          border: `1px solid ${esPreventivo ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '20px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {m.tipo}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "#444", fontWeight: '600', fontFamily: 'monospace' }}>#{m.id?.slice(-6).toUpperCase()}</span>
                      </div>
                      <h4 className={styles.cardTitle} style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', marginBottom: '0.4rem' }}>
                        {m.descripcion}
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.8rem', color: "#9ca3af", fontSize: "0.8rem" }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {m.fecha}
                        </span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          {m.taller?.nombre || "Taller oficial"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => m.id && handleEliminarMantenimiento(m.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: 'none',
                        cursor: 'pointer',
                        color: "#ef4444",
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s'
                      }}
                      title="Eliminar Registro"
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>Recorrido</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff' }}>{m.kilometrajeRealizado?.toLocaleString()}<span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#4b5563', marginLeft: '0.2rem' }}>KM</span></span>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>Coste</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: '800', color: esPreventivo ? '#4ade80' : '#f87171' }}>{m.costo?.toFixed(2)}<span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#4b5563', marginLeft: '0.2rem' }}>€</span></span>
                    </div>
                  </div>

                  {esPreventivo && m.proximoMantenimiento && (
                    <div style={{ marginTop: '1rem', padding: '0.7rem 1rem', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '10px', border: '1px solid rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></div>
                      <span style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: '500' }}>
                        Próxima revisión: <strong style={{ color: '#fff' }}>{m.proximoMantenimiento.toLocaleString()} km</strong>
                      </span>
                    </div>
                  )}

                  {m.repuestos && m.repuestos.length > 0 && (
                    <div style={{ marginTop: "1.2rem" }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
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
                      <p style={{ fontSize: "0.8rem", color: "#6b7280", fontStyle: 'italic', lineHeight: '1.5' }}>
                        <span style={{ color: '#4b5563', marginRight: '0.3rem' }}>Notes:</span>
                        {m.observaciones}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            {mantenimientos.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>🛠️</div>
                <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Sin historial de mantenimientos</h3>
                <p style={{ color: "#6b7280", maxWidth: '300px', margin: '0 auto' }}>Aún no se han registrado intervenciones para este vehículo.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </BackgroundMeteors>
  );
}
