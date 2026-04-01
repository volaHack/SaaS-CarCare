"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./AlertasPanel.module.css";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface Alerta {
  id: string;
  grupoKey?: string;
  tipo: "MANTENIMIENTO" | "RUTA_DETENIDA" | "RUTA_DESVIADA" | "GPS_PERDIDO";
  severidad: "CRITICAL" | "WARNING" | "INFO";
  titulo: string;
  descripcion: string;
  vehiculoId?: string;
  rutaId?: string;
  vehiculoInfo?: string;
  timestamp: string;
  leida: boolean;
  resuelta: boolean;
}

interface Props {
  apiUrl: string;
  getAuthHeaders: () => Record<string, string>;
  onNavigate?: (rutaId?: string, vehiculoId?: string) => void;
}

// ─── Helpers visuales ────────────────────────────────────────────────────────

const COLOR: Record<string, string> = {
  CRITICAL: "#ef4444",
  WARNING:  "#f59e0b",
  INFO:     "#3b82f6",
};

const BG: Record<string, string> = {
  CRITICAL: "rgba(239,68,68,0.12)",
  WARNING:  "rgba(245,158,11,0.12)",
  INFO:     "rgba(59,130,246,0.12)",
};

function tiempoAtras(timestamp: string): string {
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60)   return "Hace un momento";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  return `Hace ${Math.floor(diff / 86400)}d`;
}

function formatearDuracionDesdeMinutos(minutosTotales: number): string {
  const minutos = Math.max(1, Math.floor(minutosTotales));
  const dias = Math.floor(minutos / 1440);
  const horas = Math.floor((minutos % 1440) / 60);
  const mins = minutos % 60;

  if (dias > 0) return horas > 0 ? `${dias}d ${horas}h` : `${dias}d`;
  if (horas > 0) return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  return `${mins} min`;
}

function normalizarDescripcionTiempo(descripcion: string): string {
  return descripcion.replace(/(\d+)\s*minutos?/gi, (_, mins: string) =>
    formatearDuracionDesdeMinutos(Number(mins))
  );
}

function deduplicarAlertas(alertas: Alerta[]): Alerta[] {
  const ordenadas = [...alertas].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const vistas = new Set<string>();
  const resultado: Alerta[] = [];

  for (const alerta of ordenadas) {
    const clave = alerta.grupoKey?.trim()
      ? `grupo:${alerta.grupoKey}`
      : `${alerta.tipo}|${alerta.rutaId ?? ""}|${alerta.vehiculoId ?? ""}|${alerta.titulo.trim().toLowerCase()}`;
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    resultado.push({
      ...alerta,
      descripcion: normalizarDescripcionTiempo(alerta.descripcion),
    });
  }

  return resultado;
}

// ─── Iconos SVG ──────────────────────────────────────────────────────────────

const IconMantenimiento = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const IconDetenida = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <rect x="9" y="9" width="6" height="6" rx="1"/>
  </svg>
);

const IconDesviada = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/><path d="M12 17h.01"/>
  </svg>
);

const IconGPS = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/>
    <circle cx="12" cy="9" r="2.5"/>
    <path d="M16.5 19.5 21 21l-1.5-4.5"/>
    <line x1="2" y1="2" x2="22" y2="22"/>
  </svg>
);

const IconBell = ({ hasAlertas }: { hasAlertas: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={hasAlertas ? "none" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    {hasAlertas && <circle cx="18" cy="5" r="0" fill="#ef4444" stroke="none"/>}
  </svg>
);

function getIcono(tipo: string) {
  switch (tipo) {
    case "MANTENIMIENTO": return <IconMantenimiento />;
    case "RUTA_DETENIDA": return <IconDetenida />;
    case "RUTA_DESVIADA": return <IconDesviada />;
    case "GPS_PERDIDO":   return <IconGPS />;
    default: return <IconDesviada />;
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AlertasPanel({ apiUrl, getAuthHeaders, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  const noLeidas = alertas.filter(a => !a.leida && !a.resuelta).length;

  // Cargar alertas
  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/alertas`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data: Alerta[] = await res.json();
        setAlertas(deduplicarAlertas(data));
      }
    } catch { /* silent */ }
  }, [apiUrl, getAuthHeaders]);

  // Poll cada 30s
  useEffect(() => {
    const primerCargaId = window.setTimeout(() => {
      void cargar();
    }, 0);
    const id = window.setInterval(() => {
      void cargar();
    }, 30000);
    return () => {
      window.clearTimeout(primerCargaId);
      window.clearInterval(id);
    };
  }, [cargar]);

  // Marcar una como leída
  const marcarLeida = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await fetch(`${apiUrl}/api/alertas/${id}/leer`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, leida: true } : a));
  };

  // Marcar todas como leídas
  const marcarTodas = async () => {
    await fetch(`${apiUrl}/api/alertas/leer-todas`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });
    setAlertas(prev => prev.map(a => ({ ...a, leida: true })));
  };

  const handleClickAlerta = (alerta: Alerta) => {
    if (!alerta.leida) {
      fetch(`${apiUrl}/api/alertas/${alerta.id}/leer`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      setAlertas(prev => prev.map(a => a.id === alerta.id ? { ...a, leida: true } : a));
    }
    if (onNavigate) onNavigate(alerta.rutaId, alerta.vehiculoId);
    setOpen(false);
  };

  const activas = alertas.filter(a => !a.resuelta);

  return (
    <div className={styles.bellWrapper}>
      {/* Botón campanita */}
      <button
        className={`${styles.bellBtn} ${noLeidas > 0 ? styles.hasAlertas : ""}`}
        onClick={() => setOpen(v => !v)}
        title="Centro de alertas"
      >
        <IconBell hasAlertas={noLeidas > 0} />
        {noLeidas > 0 && (
          <span className={styles.badge}>{noLeidas > 99 ? "99+" : noLeidas}</span>
        )}
      </button>

      {/* Overlay para cerrar al hacer click fuera */}
      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      {/* Panel dropdown */}
      {open && (
        <div className={styles.panel}>
          {/* Header */}
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>
              🔔 Alertas
              <span className={`${styles.panelCount} ${noLeidas === 0 ? styles.panelCountOk : ""}`}>
                {noLeidas === 0 ? "Todo OK" : `${noLeidas} sin leer`}
              </span>
            </span>
            {noLeidas > 0 && (
              <button className={styles.marcarTodasBtn} onClick={marcarTodas}>
                ✓ Marcar todas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className={styles.lista}>
            {activas.length === 0 ? (
              <div className={styles.empty}>
                <svg className={styles.emptyIcon} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <p className={styles.emptyText}>Todo en orden</p>
                <p className={styles.emptySubtext}>No hay alertas activas en tu flota</p>
              </div>
            ) : (
              activas.map(alerta => {
                const color = COLOR[alerta.severidad] ?? "#f59e0b";
                const bg    = BG[alerta.severidad]    ?? BG.WARNING;
                return (
                  <div
                    key={alerta.id}
                    className={`${styles.item} ${alerta.leida ? styles.leida : ""}`}
                    onClick={() => handleClickAlerta(alerta)}
                  >
                    {/* Borde izquierdo de color */}
                    <div className={styles.itemBorde} style={{ background: color }} />

                    {/* Icono */}
                    <div className={styles.iconWrap} style={{ background: bg, color }}>
                      {getIcono(alerta.tipo)}
                    </div>

                    {/* Contenido */}
                    <div className={styles.itemBody}>
                      <div className={styles.itemTitulo}>{alerta.titulo}</div>
                      <div className={styles.itemDesc}>{alerta.descripcion}</div>
                      <div className={styles.itemMeta}>
                        <span className={styles.itemTiempo}>{tiempoAtras(alerta.timestamp)}</span>
                      </div>
                    </div>

                    {/* Dismiss */}
                    {!alerta.leida && (
                      <button
                        className={styles.dismissBtn}
                        onClick={e => marcarLeida(e, alerta.id)}
                        title="Marcar como leída"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
