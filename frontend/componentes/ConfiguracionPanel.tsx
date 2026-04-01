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
  // SMTP config
  const [smtpEmail, setSmtpEmail] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpConfigurado, setSmtpConfigurado] = useState(false);
  // Email destino
  const [emailNotif, setEmailNotif] = useState("");
  // UI
  const [guardando, setGuardando] = useState(false);
  const [testeando, setTesteando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setMsg(null);
    fetch(`${apiUrl}/api/configuracion`, { headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setEmailCuenta(data.emailCuenta ?? "");
        setSmtpEmail(data.smtpEmail ?? "");
        setSmtpConfigurado(data.smtpConfigurado ?? false);
        setEmailNotif(data.emailNotificaciones ?? "");
        setSmtpPassword("");
      })
      .catch(() => {});
  }, [open, apiUrl, getAuthHeaders]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const guardar = async () => {
    setGuardando(true);
    setMsg(null);
    try {
      const body: Record<string, string> = { emailNotificaciones: emailNotif };
      if (smtpEmail) body.smtpEmail = smtpEmail;
      if (smtpPassword) body.smtpPassword = smtpPassword;

      const res = await fetch(`${apiUrl}/api/configuracion/email`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSmtpConfigurado(!!smtpEmail);
        setSmtpPassword("");
        setMsg({ tipo: "ok", texto: "Configuracion guardada" });
        setTimeout(() => setMsg(null), 4000);
      } else {
        const data = await res.json().catch(() => ({}));
        setMsg({ tipo: "error", texto: data.error || "Error al guardar" });
      }
    } catch {
      setMsg({ tipo: "error", texto: "Error de conexion" });
    } finally {
      setGuardando(false);
    }
  };

  const testEmail = async () => {
    setTesteando(true);
    setMsg(null);
    try {
      const res = await fetch(`${apiUrl}/api/configuracion/test-email`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({ tipo: "ok", texto: data.mensaje || "Email de prueba enviado" });
      } else {
        setMsg({ tipo: "error", texto: data.error || "Error al enviar test" });
      }
    } catch {
      setMsg({ tipo: "error", texto: "Error de conexion" });
    } finally {
      setTesteando(false);
    }
  };

  return (
    <div className={styles.wrapper} ref={panelRef}>
      <button
        className={`${styles.btn} ${open ? styles.btnActive : ""}`}
        onClick={() => setOpen(v => !v)}
        title="Configuracion"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>

      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <span className={styles.title}>Configuracion</span>
            <button className={styles.closeBtn} onClick={() => setOpen(false)}>x</button>
          </div>

          <div className={styles.body}>
            {/* Info de cuenta */}
            <div className={styles.infoRow}>
              <span className={styles.label}>Email de cuenta</span>
              <span className={styles.value}>{emailCuenta || "..."}</span>
            </div>

            <div className={styles.divider} />

            {/* ── Seccion SMTP ──────────────────────────────────── */}
            <div className={styles.section}>
              <label className={styles.sectionTitle}>Email remitente (Gmail)</label>
              <p className={styles.sectionDesc}>
                Necesario para que CarCare pueda enviar reportes. Usa una cuenta Gmail con
                {" "}<strong>Contrasena de Aplicacion</strong> (no tu clave normal).
              </p>

              <input
                className={styles.input}
                type="email"
                placeholder="tucorreo@gmail.com"
                value={smtpEmail}
                onChange={e => setSmtpEmail(e.target.value)}
              />
              <input
                className={styles.input}
                type="password"
                placeholder={smtpConfigurado ? "••••••••••••••••  (ya configurada)" : "Contrasena de aplicacion (16 caracteres)"}
                value={smtpPassword}
                onChange={e => setSmtpPassword(e.target.value)}
              />

              {smtpConfigurado && (
                <div className={styles.currentEmail}>
                  <span className={styles.dot} />
                  Remitente configurado: <strong>{smtpEmail}</strong>
                </div>
              )}
              {!smtpConfigurado && (
                <div className={styles.currentEmail} style={{ color: "rgba(239,68,68,0.7)" }}>
                  <span className={styles.dot} style={{ background: "#ef4444", boxShadow: "0 0 6px #ef4444" }} />
                  No configurado — los reportes no se pueden enviar
                </div>
              )}

              <div className={styles.helpBox}>
                <strong>Como obtener la contrasena:</strong>
                <ol>
                  <li>Entra a <em>myaccount.google.com/security</em></li>
                  <li>Activa <em>Verificacion en 2 pasos</em></li>
                  <li>Busca <em>Contrasenas de aplicaciones</em></li>
                  <li>Crea una nueva con nombre &quot;CarCare&quot;</li>
                  <li>Copia el codigo de 16 letras</li>
                </ol>
              </div>
            </div>

            <div className={styles.divider} />

            {/* ── Email destino ─────────────────────────────────── */}
            <div className={styles.section}>
              <label className={styles.sectionTitle}>Email destino (donde llegan los reportes)</label>
              <p className={styles.sectionDesc}>
                Si lo dejas vacio, los reportes se envian al email de tu cuenta.
              </p>
              <input
                className={styles.input}
                type="email"
                placeholder={emailCuenta || "otro@email.com"}
                value={emailNotif}
                onChange={e => setEmailNotif(e.target.value)}
              />
            </div>

            {/* Feedback */}
            {msg && (
              <div className={`${styles.msg} ${msg.tipo === "ok" ? styles.msgOk : styles.msgError}`}>
                {msg.tipo === "ok" ? "v" : "x"} {msg.texto}
              </div>
            )}

            {/* Acciones */}
            <div className={styles.actions}>
              <button
                className={styles.btnSecondary}
                onClick={testEmail}
                disabled={testeando || !smtpConfigurado}
                title={!smtpConfigurado ? "Primero guarda la configuracion SMTP" : ""}
              >
                {testeando ? "Enviando..." : "Enviar test"}
              </button>
              <button
                className={styles.btnPrimary}
                onClick={guardar}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
