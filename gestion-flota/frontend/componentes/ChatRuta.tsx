"use client";

import { useState, useEffect, useRef } from "react";
import styles from "../app/dashboard/page.module.css";

interface Mensaje {
    id?: string;
    rutaId: string;
    remitente: "ADMIN" | "CONDUCTOR";
    contenido: string;
    timestamp?: string;
}

interface ChatProps {
    rutaId: string;
    rol: "ADMIN" | "CONDUCTOR";
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://saas-carcare-production.up.railway.app";

export default function ChatRuta({ rutaId, rol }: ChatProps) {
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Helper to get auth headers
    const getAuthHeaders = (): Record<string, string> => {
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
    };

    const cargarMensajes = async () => {
        try {
            const res = await fetch(`${API_URL}/api/mensajes/${rutaId}`, {
                headers: getAuthHeaders() as any
            });
            if (res.ok) setMensajes(await res.json());
        } catch {
            // Silenciar errores de polling para no llenar la consola
        }
    };

    useEffect(() => {
        cargarMensajes();
        const interval = setInterval(cargarMensajes, 3000);
        return () => clearInterval(interval);
    }, [rutaId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [mensajes]);

    const enviar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nuevoMensaje.trim()) return;

        const mensajeObj: Mensaje = {
            rutaId,
            remitente: rol,
            contenido: nuevoMensaje.trim()
        };

        try {
            const res = await fetch(`${API_URL}/api/mensajes`, {
                method: 'POST',
                headers: getAuthHeaders() as any,
                body: JSON.stringify(mensajeObj)
            });
            if (res.ok) {
                setNuevoMensaje("");
                cargarMensajes();
            }
        } catch (err) {
            console.error("Error enviando mensaje:", err);
        }
    };

    return (
        <div className={styles.card} style={{
            display: 'flex',
            flexDirection: 'column',
            height: '400px',
            padding: '1.2rem',
            background: 'rgba(20, 20, 25, 0.95)',
            border: '1px solid rgba(255,255,255,0.05)'
        }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#60a5fa' }}></span>
                Chat con {rol === 'ADMIN' ? 'Conductor' : 'Soporte Admin'}
            </h3>

            <div ref={scrollRef} style={{
                flex: 1,
                overflowY: 'auto',
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem',
                paddingRight: '0.5rem'
            }}>
                {mensajes.map((m, i) => {
                    const isMe = m.remitente === rol;
                    return (
                        <div key={i} style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            padding: '0.7rem 1rem',
                            borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            backgroundColor: isMe ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                            color: isMe ? '#000' : '#fff',
                            fontSize: '0.9rem',
                            boxShadow: isMe ? '0 4px 15px rgba(59, 246, 59, 0.2)' : 'none',
                            border: isMe ? 'none' : '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ fontSize: '0.6rem', opacity: 0.6, marginBottom: '2px', fontWeight: 'bold' }}>
                                {isMe ? 'Tú' : m.remitente}
                            </div>
                            {m.contenido}
                        </div>
                    );
                })}
                {mensajes.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#4b5563', fontSize: '0.8rem', marginTop: '2rem' }}>
                        No hay mensajes. ¡Di hola!
                    </div>
                )}
            </div>

            <form onSubmit={enviar} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        padding: '0.6rem 1rem',
                        color: '#fff',
                        outline: 'none'
                    }}
                />
                <button type="submit" style={{
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: '10px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                }}>
                    ➔
                </button>
            </form>
        </div>
    );
}
