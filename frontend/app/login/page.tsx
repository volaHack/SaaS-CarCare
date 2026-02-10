"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import styles from "./login.module.css";
// BackgroundMeteors removed for cleaner professional look

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://saas-carcare-production.up.railway.app";

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

const CarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.6-1.1-1-1.9-1H5c-.8 0-1.4.4-1.9 1L1 10l-.6 1c-.6.9-.4 2.1.5 2.6.2.1.5.2.8.2H3v1c0 .6.4 1 1 1h1" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
    </svg>
);

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem("user", JSON.stringify(data));
                toast.success("¡Bienvenido de nuevo!");
                window.dispatchEvent(new Event("storage"));
                router.push("/dashboard");
            } else {
                toast.error(data.error || "Error al iniciar sesión");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={styles.mainContainer}>
            {/* Visual Panel (Left) */}
            <div className={styles.visualPanel}>
                <div className={styles.bgImageContainer}>
                    <img
                        src="/login-bg.jpg"
                        alt="Fondo"
                        className={styles.bgImage}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>

                <div className={styles.visualContent}>
                    <div className={styles.brandLogo}>
                        <CarIcon />
                        <span>CarCare Tracker</span>
                    </div>

                    <div className={styles.quoteBox}>
                        <h1>Optimización inteligente para tu flota.</h1>
                        <p>Toma el control total de tus vehículos, rutas y combustible en tiempo real.</p>

                        <div className={styles.statsRow}>
                            <div className={styles.statItem}>
                                <span className={styles.statVal}>+20%</span>
                                <span className={styles.statLabel}>Ahorro</span>
                            </div>
                            <div className={styles.divider} />
                            <div className={styles.statItem}>
                                <span className={styles.statVal}>99%</span>
                                <span className={styles.statLabel}>Uptime</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.visualPattern} />
            </div>

            {/* Form Panel (Right) */}
            <div className={styles.formPanel}>
                <div className={styles.formContent}>
                    <div className={styles.mobileHeader}>
                        <CarIcon />
                    </div>

                    <div className={styles.header}>
                        <h2 className={styles.title}>Iniciar Sesión</h2>
                        <p className={styles.subtitle}>
                            ¿Nuevo aquí? <Link href="/register">Crear una cuenta gratis</Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email">Correo Electrónico</label>
                            <input
                                id="email"
                                type="email"
                                required
                                placeholder="nombre@empresa.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                autoComplete="email"
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <div className={styles.labelRow}>
                                <label htmlFor="password">Contraseña</label>
                                <a href="#" className={styles.forgotLink}>¿Olvidaste tu contraseña?</a>
                            </div>
                            <div className={styles.passwordWrapper}>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={styles.eyeBtn}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? (
                                <span className={styles.loadingDots}>
                                    <span>.</span><span>.</span><span>.</span>
                                </span>
                            ) : "Acceder al Panel"}
                        </button>
                    </form>

                    <div className={styles.footerLink}>
                        <Link href="/">
                            ← Volver al inicio
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}