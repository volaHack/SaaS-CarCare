"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./ConfiguracionPanel.module.css";

interface Props {
  apiUrl: string;
  getAuthHeaders: () => Record<string, string>;
}

export default function ConfiguracionPanel({ apiUrl, getAuthHeaders }: Props) {
  const [open, setOpen] = useState(false);
  const [emailCuenta, setEmailCuenta] = useState("");
  const [emailNotif, setEmailNotif] = useState("");
  const [input, setInput] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Cargar config al abrir
  useEffect(() => {
    if (!open) return;
    fetch(`${apiUrl}/api/configuracion`, { headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setEmailCuenta(data.emailCuenta ?? "");
        setEmailNotif(data.emailNotificaciones ?? "");
        setInput(data.emailNotificaciones ?? "");
      })
      .catch(() => {});
  }, [open, apiUrl, getAuthHeaders]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const guardar = async () => {
    setGuardando(true);
    setMsg(null);
    try {
      const res = await fetch(`${apiUrl}/api/configuracion/email-notificaciones`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ emailNotificaciones: input }),
      });
      if (res.ok) {
        setEmailNotif(input);
        setMsg({ tipo: "ok", texto: "Guardado correctamente" });
        setTimeout(() => setMsg(null), 3000);
      } else {
        setMsg({ tipo: "error", texto: "Error al guardar" });
      }
    } catch {
      setMsg({ tipo: "error", texto: "Error de conexión" });
    } finally {
      setGuardando(false);
    }
  };

  const limpiar = async () => {
    setInput("");
    setGuardando(true);
    setMsg(null);
    try {
      const res = await fetch(`${apiUrl}/api/configuracion/email-notificaciones`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ emailNotificaciones: "" }),
      });
      if (res.ok) {
        setEmailNotif("");
        setMsg({ tipo: "ok", texto: "Restaurado al email de cuenta" });
        setTimeout(() => setMsg(null), 3000);
      }
    } catch {
      setMsg({ tipo: "error", texto: "Error de conexión" });
    } finally {
      setGuardando(false);
    }
  };

  const emailActivo = emailNotif || emailCuenta;

  return (
    <div className={styles.wrapper} ref={panelRef}>
      {/* Botón engranaje */}
      <button
        className={`${styles.btn} ${open ? styles.btnActive : ""}`}
        onClick={() => setOpen(v => !v)}
        title="Configuración"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>

      {/* Overlay */}
      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      {/* Panel */}
      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <span className={styles.title}>⚙️ Configuración</span>
            <button className={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className={styles.body}>
            {/* Email actual */}
            <div className={styles.infoRow}>
              <span className={styles.label}>Email de cuenta</span>
              <span className={styles.value}>{emailCuenta || "—"}</span>
            </div>

            <div className={styles.divider} />

            {/* Email notificaciones */}
            <div className={styles.section}>
              <label className={styles.sectionTitle}>📧 Email para reportes y alertas</label>
              <p className={styles.sectionDesc}>
                Los reportes mensuales se envían aquí. Si lo dejás vacío, se usa el email de tu cuenta.
              </p>

              <div className={styles.inputRow}>
                <input
                  className={styles.input}
                  type="email"
                  placeholder={emailCuenta || "otro@email.com"}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") guardar(); }}
                />
              </div>

              {/* Email activo actual */}
              <div className={styles.currentEmail}>
                <span className={styles.dot} />
                Activo: <strong>{emailActivo || "—"}</strong>
              </div>

              {msg && (
                <div className={`${styles.msg} ${msg.tipo === "ok" ? styles.msgOk : styles.msgError}`}>
                  {msg.tipo === "ok" ? "✓" : "✕"} {msg.texto}
                </div>
              )}

              <div className={styles.actions}>
                {emailNotif && (
                  <button className={styles.btnSecondary} onClick={limpiar} disabled={guardando}>
                    Usar email de cuenta
                  </button>
                )}
                <button
                  className={styles.btnPrimary}
                  onClick={guardar}
                  disabled={guardando || input === emailNotif}
                >
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
