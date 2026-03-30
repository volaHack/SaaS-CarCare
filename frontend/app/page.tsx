"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./landing/landing.module.css";
import BackgroundMeteors from "@/componentes/BackgroundMeteors";

// SVG Icons
const CarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.6-1.1-1-1.9-1H5c-.8 0-1.4.4-1.9 1L1 10l-.6 1c-.6.9-.4 2.1.5 2.6.2.1.5.2.8.2H3v1c0 .6.4 1 1 1h1" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

const RouteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="19" r="3" />
    <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
    <circle cx="18" cy="5" r="3" />
  </svg>
);

const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const LeafIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);



const SmartphoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
    <path d="M12 18h.01" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const PackageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4 7.55 4.24" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.29 7 12 12 20.71 7" />
    <line x1="12" x2="12" y1="22" y2="12" />
  </svg>
);

const AndroidIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5Z" fill="#4285F4"/>
    <path d="M16.81 15.12L6.05 21.34L13.69 12L16.81 15.12Z" fill="#EA4335"/>
    <path d="M20.16 10.81C20.5 11.08 20.5 11.57 20.5 12C20.5 12.43 20.38 12.78 20.16 13.19L17.89 14.5L14.5 12L17.89 9.5L20.16 10.81Z" fill="#FBBC05"/>
    <path d="M6.05 2.66L16.81 8.88L13.69 12L6.05 2.66Z" fill="#34A853"/>
  </svg>
);



export default function LandingPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Refs for scroll-triggered animations
  const heroVisualRef = useRef<HTMLDivElement>(null);
  const downloadVisualRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setIsVisible(true);

    const updateScroll = () => {
      setScrollY(window.scrollY);
      rafRef.current = null;
    };

    const handleScroll = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(updateScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    const observerOptions = {
      threshold: [0, 0.1, 0.2, 0.3],
      rootMargin: '0px 0px -80px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          el.classList.add(styles.scrollVisible);
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll(`.${styles.scrollReveal}`);
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [isVisible]);

  const features = [
    {
      icon: <CarIcon />,
      title: "Gestión de Flota",
      description: "Controla todos tus vehículos desde un solo panel. Monitoriza kilometraje, combustible y estado en tiempo real.",
      color: "#22c55e"
    },
    {
      icon: <LocationIcon />,
      title: "Tracking GPS en Vivo",
      description: "Rastrea la ubicación exacta de tus conductores en tiempo real con actualizaciones cada 3 segundos.",
      color: "#3bf63b"
    },
    {
      icon: <ChartIcon />,
      title: "Control de Consumo",
      description: "Registra cada repostaje con litros, precio y coste. Historial completo por vehículo para analizar el consumo real.",
      color: "#0ee936"
    },
    {
      icon: <RouteIcon />,
      title: "Planificación de Rutas",
      description: "Crea y gestiona rutas con geocodificación automática. Visualiza origen, destino y progreso.",
      color: "#04e13f"
    },
    {
      icon: <MessageIcon />,
      title: "Chat en Tiempo Real",
      description: "Comunicación directa con los conductores desde la app móvil y el panel web.",
      color: "#25eb7b"
    },
    {
      icon: <LeafIcon />,
      title: "Mantenimiento Integral",
      description: "Preventivo y correctivo por vehículo. Taller, repuestos, costes y programación del próximo servicio.",
      color: "#22c55e"
    }
  ];

  const stats = [
    { number: "6", label: "Módulos" },
    { number: "3s", label: "Refresh GPS" },
    { number: "∞", label: "Sin límite" },
    { number: "24/7", label: "Monitorización" }
  ];

  return (
    <main className={styles.main} ref={mainRef}>
      <BackgroundMeteors fixed />
      {/* Subtle background gradient */}
      <div className={styles.bgGradient} />

      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}><CarIcon /></span>
            <span className={styles.logoText}>./CarCare Tracker</span>
          </div>
          <div className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>Características</a>
            <a href="#how-it-works" className={styles.navLink}>Cómo Funciona</a>
            <a href="#download" className={styles.navLink}>Descargar</a>
            <button
              className={styles.navCta}
              onClick={() => router.push('/login')}
            >
              Iniciar Sesión
            </button>
          </div>
          {/* Botón CTA móvil */}
          <button
            className={styles.navCtaMobile}
            onClick={() => router.push('/login')}
          >
            Iniciar Sesión
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={`${styles.heroContent} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.heroTag}>
            <span>La revolución en gestión de flotas</span>
          </div>

          <h1 className={styles.heroTitle}>
            Gestiona tu flota
            <span className={styles.gradientText}> con inteligencia</span>
          </h1>

          <p className={styles.heroSubtitle}>
            CarCare Tracker es la solución completa para empresas que quieren
            optimizar sus flotas, reducir costes y tener control total sobre
            sus vehículos y conductores en tiempo real.
          </p>

          <div className={styles.heroCtas}>
            <button
              className={styles.primaryCta}
              onClick={() => router.push('/login')}
            >
              <span>Iniciar Sesión</span>
              <span className={styles.ctaArrow}><ArrowRightIcon /></span>
            </button>
            <a href="#download" className={styles.secondaryCta}>
              <span className={styles.androidIcon}><AndroidIcon /></span>
              <span>Descargar para Android</span>
            </a>
          </div>

          <div className={styles.heroStats}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.statItem}>
                <span className={styles.statNumber}>{stat.number}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Visual - 3D Dashboard with Parallax */}
        <div
          className={styles.heroVisual}
          ref={heroVisualRef}
          style={{
            transform: `translateY(${scrollY * -0.08}px)`,
          }}
        >
          <div className={styles.dashCardsWrap}>

            {/* Main map card - large */}
            <div className={`${styles.dashCard} ${styles.dashCardMap} ${styles.scrollReveal}`} style={{ '--delay': '0s' } as React.CSSProperties}>
              <div className={styles.dashCardHead}>
                <span className={styles.dashCardLabel}>Mapa en vivo</span>
                <div className={styles.dashLiveBadge}>
                  <span className={styles.liveIndicator}></span>
                  <span>3 vehiculos activos</span>
                </div>
              </div>
              <div className={styles.dashMapBody}>
                <svg className={styles.dashMapRoads} viewBox="0 0 420 180">
                  <path d="M 0 140 Q 80 120 150 80 Q 220 40 300 55 Q 380 70 420 30" stroke="rgba(255,255,255,0.05)" strokeWidth="14" fill="none" />
                  <path d="M 0 90 Q 60 110 140 60 Q 220 10 320 40 Q 380 55 420 20" stroke="rgba(255,255,255,0.04)" strokeWidth="9" fill="none" />
                  <path d="M 40 180 Q 100 150 200 130 Q 300 110 420 100" stroke="rgba(255,255,255,0.03)" strokeWidth="7" fill="none" />
                  {/* Route trace */}
                  <path d="M 50 130 C 120 100 180 50 260 55 C 340 60 370 35 400 25" stroke="rgba(59,246,59,0.12)" strokeWidth="10" fill="none" strokeLinecap="round" />
                  <path d="M 50 130 C 120 100 180 50 260 55 C 340 60 370 35 400 25" stroke="#3bf63b" strokeWidth="2.5" fill="none" strokeLinecap="round" className={styles.dashRoutePath} />
                  {/* Pins */}
                  <circle cx="50" cy="130" r="6" fill="#0f172a" stroke="#3bf63b" strokeWidth="2" />
                  <circle cx="50" cy="130" r="2.5" fill="#3bf63b" />
                  <circle cx="260" cy="55" r="5" fill="#0f172a" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="260" cy="55" r="2" fill="rgba(255,255,255,0.5)" />
                  <circle cx="400" cy="25" r="6" fill="#0f172a" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <circle cx="400" cy="25" r="2.5" fill="rgba(255,255,255,0.5)" />
                </svg>
                {/* Vehicle on route */}
                <div className={styles.dashVehicle}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#3bf63b"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" /></svg>
                </div>
              </div>
            </div>

            {/* Stats cards row */}
            <div className={styles.dashStatsRow}>
              <div className={`${styles.dashCard} ${styles.dashCardStat} ${styles.scrollReveal}`} style={{ '--delay': '0.15s' } as React.CSSProperties}>
                <div className={styles.dashStatIcon}>
                  <CarIcon />
                </div>
                <div className={styles.dashStatData}>
                  <span className={styles.dashStatNum}>24</span>
                  <span className={styles.dashStatLabel}>Vehiculos</span>
                </div>
              </div>
              <div className={`${styles.dashCard} ${styles.dashCardStat} ${styles.scrollReveal}`} style={{ '--delay': '0.25s' } as React.CSSProperties}>
                <div className={styles.dashStatIcon}>
                  <RouteIcon />
                </div>
                <div className={styles.dashStatData}>
                  <span className={styles.dashStatNum}>18</span>
                  <span className={styles.dashStatLabel}>En ruta</span>
                </div>
              </div>
              <div className={`${styles.dashCard} ${styles.dashCardStat} ${styles.scrollReveal}`} style={{ '--delay': '0.35s' } as React.CSSProperties}>
                <div className={styles.dashStatIcon}>
                  <ChartIcon />
                </div>
                <div className={styles.dashStatData}>
                  <span className={styles.dashStatNum}>98%</span>
                  <span className={styles.dashStatLabel}>Eficiencia</span>
                </div>
              </div>
            </div>

            {/* Bottom row - activity + chart */}
            <div className={styles.dashBottomRow}>
              <div className={`${styles.dashCard} ${styles.dashCardActivity} ${styles.scrollReveal}`} style={{ '--delay': '0.45s' } as React.CSSProperties}>
                <span className={styles.dashCardLabel}>Actividad reciente</span>
                <div className={styles.dashActivityList}>
                  <div className={styles.dashActivityItem}>
                    <span className={styles.dashActivityDot} style={{ background: '#3bf63b' }}></span>
                    <span className={styles.dashActivityTxt}>Vehiculo #07 en ruta</span>
                    <span className={styles.dashActivityTime}>hace 2m</span>
                  </div>
                  <div className={styles.dashActivityItem}>
                    <span className={styles.dashActivityDot} style={{ background: '#eab308' }}></span>
                    <span className={styles.dashActivityTxt}>Mantenimiento #12</span>
                    <span className={styles.dashActivityTime}>hace 15m</span>
                  </div>
                  <div className={styles.dashActivityItem}>
                    <span className={styles.dashActivityDot} style={{ background: '#3bf63b' }}></span>
                    <span className={styles.dashActivityTxt}>Ruta completada #19</span>
                    <span className={styles.dashActivityTime}>hace 1h</span>
                  </div>
                </div>
              </div>
              <div className={`${styles.dashCard} ${styles.dashCardChart} ${styles.scrollReveal}`} style={{ '--delay': '0.55s' } as React.CSSProperties}>
                <span className={styles.dashCardLabel}>Consumo semanal</span>
                <div className={styles.dashChartBars}>
                  <div className={styles.dashBar} style={{ '--bar-h': '45%' } as React.CSSProperties}><span>L</span></div>
                  <div className={styles.dashBar} style={{ '--bar-h': '70%' } as React.CSSProperties}><span>M</span></div>
                  <div className={styles.dashBar} style={{ '--bar-h': '55%' } as React.CSSProperties}><span>X</span></div>
                  <div className={styles.dashBar} style={{ '--bar-h': '85%' } as React.CSSProperties}><span>J</span></div>
                  <div className={`${styles.dashBar} ${styles.dashBarActive}`} style={{ '--bar-h': '65%' } as React.CSSProperties}><span>V</span></div>
                  <div className={styles.dashBar} style={{ '--bar-h': '30%' } as React.CSSProperties}><span>S</span></div>
                  <div className={styles.dashBar} style={{ '--bar-h': '20%' } as React.CSSProperties}><span>D</span></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Características</span>
          <h2 className={styles.sectionTitle}>
            Todo lo que necesitas para tu flota
          </h2>
          <p className={styles.sectionSubtitle}>
            Herramientas potentes diseñadas para optimizar cada aspecto de tu operación
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div
              key={index}
              className={`${styles.featureCard} ${styles.scrollReveal}`}
              style={{ '--delay': `${index * 0.1}s` } as React.CSSProperties}
            >
              <div className={styles.featureIcon}>
                {feature.icon}
              </div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Metrics Section */}
      <section className={styles.metricsSection}>
        <div className={styles.metricsInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Módulos integrados</span>
            <h2 className={styles.sectionTitle}>Todo lo que tu flota necesita</h2>
            <p className={styles.sectionSubtitle}>Cada módulo resuelve un problema específico de la gestión de flotas. Una sola plataforma, control total.</p>
          </div>
          <div className={styles.metricsGrid}>
            {[
              { icon: <CarIcon />, number: '6', title: 'Módulos integrados', desc: 'Flota, rutas GPS, conductores, mantenimiento, combustible y mensajería en una sola plataforma.' },
              { icon: <LocationIcon />, number: '3s', title: 'Refresh GPS', desc: 'Posición calculada con fórmula Haversine. Velocidad, distancia restante y detección de desvíos (+20%).' },
              { icon: <RouteIcon />, number: '2', title: 'Tipos de mantenimiento', desc: 'Preventivo con programación del próximo y correctivo. Registra taller, repuestos y costes.' },
              { icon: <ChartIcon />, number: 'L/km', title: 'Control de consumo', desc: 'Historial de repostajes con litros, precio/litro, coste total y kilometraje del vehículo.' },
            ].map((m, i) => (
              <div key={i} className={`${styles.metricCard} ${styles.scrollReveal}`} style={{ '--delay': `${i * 0.12}s` } as React.CSSProperties}>
                <div className={styles.metricIconWrap}>{m.icon}</div>
                <div className={styles.metricNumber}>{m.number}</div>
                <div className={styles.metricTitle}>{m.title}</div>
                <div className={styles.metricDesc}>{m.desc}</div>
              </div>
            ))}
          </div>

          <div className={styles.testimonialRow}>
            <div className={`${styles.useCaseCard} ${styles.scrollReveal}`} style={{ '--delay': '0.1s' } as React.CSSProperties}>
              <div className={styles.useCaseTitle}>Panel Web — Empresa</div>
              <div className={styles.useCaseList}>
                {[
                  { title: 'Dashboard completo', desc: 'Resumen visual de toda tu flota: vehículos activos, rutas en curso, mantenimientos pendientes.' },
                  { title: 'Mapa global en vivo', desc: 'Todos los vehículos en un mapa con posición GPS, velocidad y estado de cada ruta.' },
                  { title: 'Gestión de rutas', desc: 'Crea rutas con origen y destino, asigna vehículo y monitoriza el progreso en tiempo real.' },
                  { title: 'Historial de mantenimientos', desc: 'Preventivos y correctivos por vehículo, con taller, repuestos y coste detallado.' },
                  { title: 'Chat por ruta', desc: 'Comunicación directa con el conductor asociada a cada ruta específica.' },
                ].map((uc, i) => (
                  <div key={i} className={styles.useCaseItem}>
                    <div className={styles.useCaseDot} />
                    <div className={styles.useCaseItemText}>
                      <strong>{uc.title}</strong>
                      <span>{uc.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${styles.useCaseCard} ${styles.scrollReveal}`} style={{ '--delay': '0.2s' } as React.CSSProperties}>
              <div className={styles.useCaseTitle}>App Android — Conductor</div>
              <div className={styles.useCaseList}>
                {[
                  { title: 'Recibir rutas asignadas', desc: 'El conductor ve la ruta con origen, destino y distancia estimada directamente en la app.' },
                  { title: 'GPS automático', desc: 'La app envía coordenadas al servidor cada pocos segundos sin intervención del conductor.' },
                  { title: 'Progreso en tiempo real', desc: 'Barra de progreso con distancia restante, velocidad actual y tiempo estimado de llegada.' },
                  { title: 'Detección de desvíos', desc: 'El sistema avisa si el vehículo se desvía más del 20% de la ruta directa planificada.' },
                  { title: 'Mensajería con la central', desc: 'Chat en tiempo real vinculado a la ruta activa para coordinar con la empresa.' },
                ].map((uc, i) => (
                  <div key={i} className={styles.useCaseItem}>
                    <div className={styles.useCaseDot} />
                    <div className={styles.useCaseItemText}>
                      <strong>{uc.title}</strong>
                      <span>{uc.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Cómo Funciona</span>
          <h2 className={styles.sectionTitle}>
            Tres pasos para comenzar
          </h2>
        </div>

        <div className={styles.stepsContainer}>
          <div className={`${styles.step} ${styles.scrollReveal}`} style={{ '--delay': '0s' } as React.CSSProperties}>
            <div className={styles.stepNumber}>01</div>
            <div className={styles.stepContent}>
              <h3>Registra tu Flota</h3>
              <p>Añade tus vehículos con matrícula, modelo, kilometraje y tipo de combustible. Importación masiva disponible.</p>
              <div className={styles.stepOutcome}>
                <CheckIcon /> Panel listo en menos de 15 minutos
              </div>
            </div>
            <div className={styles.stepIcon}><CarIcon /></div>
          </div>

          <div className={styles.stepConnector}>
            <div className={styles.connectorLine}></div>
            <div className={styles.connectorDot}></div>
          </div>

          <div className={`${styles.step} ${styles.scrollReveal}`} style={{ '--delay': '0.1s' } as React.CSSProperties}>
            <div className={styles.stepNumber}>02</div>
            <div className={styles.stepContent}>
              <h3>Descarga la App</h3>
              <p>Tus conductores instalan la app Android. Reciben rutas asignadas, envían GPS cada 3 segundos y chatean contigo.</p>
              <div className={styles.stepOutcome}>
                <CheckIcon /> Conductores conectados al instante
              </div>
            </div>
            <div className={styles.stepIcon}><SmartphoneIcon /></div>
          </div>

          <div className={styles.stepConnector}>
            <div className={styles.connectorLine}></div>
            <div className={styles.connectorDot}></div>
          </div>

          <div className={`${styles.step} ${styles.scrollReveal}`} style={{ '--delay': '0.2s' } as React.CSSProperties}>
            <div className={styles.stepNumber}>03</div>
            <div className={styles.stepContent}>
              <h3>Controla Todo</h3>
              <p>Monitoriza rutas en tiempo real, analiza consumos, gestiona mantenimientos y optimiza tu operación completa.</p>
              <div className={styles.stepOutcome}>
                <CheckIcon /> -30% costes en los primeros 6 meses
              </div>
            </div>
            <div className={styles.stepIcon}><ChartIcon /></div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className={styles.download}>
        <div className={styles.downloadContent}>
          <div className={styles.downloadInfo}>
            <span className={styles.sectionTag}>Disponible ahora</span>
            <h2 className={styles.downloadTitle}>
              Descarga la app para{" "}
              <span className={styles.gradientText}>Android</span>
            </h2>
            <p className={styles.downloadDesc}>
              La aplicación para conductores permite recibir rutas asignadas,
              enviar ubicación GPS en tiempo real y comunicarse con el panel central.
            </p>

            <div className={styles.appFeatures}>
              <div className={styles.appFeature}>
                <span className={styles.checkIcon}><CheckIcon /></span>
                <span>GPS en tiempo real</span>
              </div>
              <div className={styles.appFeature}>
                <span className={styles.checkIcon}><CheckIcon /></span>
                <span>Notificaciones de rutas</span>
              </div>
              <div className={styles.appFeature}>
                <span className={styles.checkIcon}><CheckIcon /></span>
                <span>Chat integrado</span>
              </div>
              <div className={styles.appFeature}>
                <span className={styles.checkIcon}><CheckIcon /></span>
                <span>Modo offline</span>
              </div>
            </div>

            <div className={styles.downloadButtons}>
              <button className={styles.downloadBtn}>
                <div className={styles.downloadBtnContent}>
                  <span className={styles.downloadBtnIcon}><AndroidIcon /></span>
                  <div className={styles.downloadBtnText}>
                    <span className={styles.downloadBtnLabel}>Descargar para</span>
                    <span className={styles.downloadBtnPlatform}>Android</span>
                  </div>
                </div>
              </button>
              <div className={styles.downloadNote}>
                <PackageIcon />
                <span>APK disponible para descarga directa</span>
              </div>
            </div>
          </div>

          <div className={styles.downloadVisual} ref={downloadVisualRef}>
            <div className={`${styles.downloadPhone} ${styles.scrollReveal}`} style={{ '--delay': '0s' } as React.CSSProperties}>
              <div className={styles.phoneFrame}>
                <div className={styles.phoneNotch}></div>
                <div className={styles.phoneScreen}>

                  {/* Status bar */}
                  <div className={styles.phoneStatusBar}>
                    <span className={styles.phoneTime}>9:41</span>
                    <div className={styles.phoneSignals}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 0 0-6 0zm-4-4l2 2a7.074 7.074 0 0 1 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" /></svg>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" /></svg>
                    </div>
                  </div>

                  {/* App header */}
                  <div className={`${styles.appHeader} ${styles.scrollReveal}`} style={{ '--delay': '0.15s' } as React.CSSProperties}>
                    <div className={styles.appHeaderLeft}>
                      <span className={styles.appLogo}><CarIcon /></span>
                      <div className={styles.appHeaderText}>
                        <span className={styles.appHeaderTitle}>CarCare Driver</span>
                        <span className={styles.appHeaderSub}>Conductor activo</span>
                      </div>
                    </div>
                    <div className={styles.appHeaderStatus}>
                      <span className={styles.liveIndicator}></span>
                      <span>Online</span>
                    </div>
                  </div>

                  {/* Route card */}
                  <div className={`${styles.appRoute} ${styles.scrollReveal}`} style={{ '--delay': '0.3s' } as React.CSSProperties}>
                    <div className={styles.routeTimeline}>
                      <div className={styles.routeDotOrigin}></div>
                      <div className={styles.routeLine}></div>
                      <div className={styles.routeDotDest}></div>
                    </div>
                    <div className={styles.routeDetails}>
                      <div className={styles.routePoint}>
                        <span className={styles.routeCity}>Madrid</span>
                        <span className={styles.routeTime}>06:30 - Salida</span>
                      </div>
                      <div className={styles.routePoint}>
                        <span className={styles.routeCity}>Barcelona</span>
                        <span className={styles.routeTime}>12:00 - Llegada est.</span>
                      </div>
                    </div>
                    <div className={styles.routeBadge}>
                      <span className={styles.liveIndicator}></span>
                      En curso
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className={`${styles.appProgress} ${styles.scrollReveal}`} style={{ '--delay': '0.4s' } as React.CSSProperties}>
                    <div className={styles.progressHeader}>
                      <span className={styles.progressLabel}>Progreso de ruta</span>
                      <span className={styles.progressPct}>38%</span>
                    </div>
                    <div className={styles.progressTrack}>
                      <div className={styles.progressFill}></div>
                      <div className={styles.progressDot}></div>
                    </div>
                  </div>

                  {/* Map area */}
                  <div className={`${styles.appMap} ${styles.scrollReveal}`} style={{ '--delay': '0.45s' } as React.CSSProperties}>
                    {/* Road network background */}
                    <svg className={styles.mapRoads} viewBox="0 0 250 150" preserveAspectRatio="none">
                      <path d="M 0 120 Q 40 110 80 90 Q 120 70 160 75 Q 200 80 250 50" stroke="rgba(255,255,255,0.06)" strokeWidth="12" fill="none" />
                      <path d="M 0 80 Q 50 95 100 60 Q 150 25 200 40 Q 230 48 250 30" stroke="rgba(255,255,255,0.04)" strokeWidth="8" fill="none" />
                      <path d="M 30 150 Q 60 130 100 120 Q 160 105 250 90" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="none" />
                    </svg>
                    {/* Main route */}
                    <svg className={styles.appMapRoute} viewBox="0 0 250 150">
                      <path d="M 25 125 C 70 105 100 60 140 55 C 180 50 200 35 225 25" stroke="rgba(59,246,59,0.15)" strokeWidth="8" fill="none" strokeLinecap="round" />
                      <path d="M 25 125 C 70 105 100 60 140 55 C 180 50 200 35 225 25" stroke="#3bf63b" strokeWidth="2.5" fill="none" strokeLinecap="round" className={styles.appMapRoutePath} />
                      {/* Origin pin */}
                      <circle cx="25" cy="125" r="6" fill="#0f172a" stroke="#3bf63b" strokeWidth="2.5" />
                      <circle cx="25" cy="125" r="2.5" fill="#3bf63b" />
                      {/* Destination pin */}
                      <circle cx="225" cy="25" r="6" fill="#0f172a" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                      <circle cx="225" cy="25" r="2.5" fill="rgba(255,255,255,0.6)" />
                    </svg>
                    {/* Vehicle indicator */}
                    <div className={styles.mapVehicle}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#3bf63b"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" /></svg>
                    </div>
                    <span className={styles.appMapLabel} style={{ bottom: '8px', left: '12px' }}>Madrid</span>
                    <span className={styles.appMapLabel} style={{ top: '6px', right: '12px' }}>BCN</span>
                  </div>

                  {/* Stats row */}
                  <div className={`${styles.appStats} ${styles.scrollReveal}`} style={{ '--delay': '0.6s' } as React.CSSProperties}>
                    <div className={styles.appStat}>
                      <span className={styles.appStatIcon}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                      </span>
                      <span className={styles.appStatValue}>623</span>
                      <span className={styles.appStatUnit}>km</span>
                      <span className={styles.appStatLabel}>restantes</span>
                    </div>
                    <div className={styles.appStat}>
                      <span className={styles.appStatIcon}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      </span>
                      <span className={styles.appStatValue}>5h 30m</span>
                      <span className={styles.appStatLabel}>tiempo est.</span>
                    </div>
                    <div className={styles.appStat}>
                      <span className={styles.appStatIcon}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                      </span>
                      <span className={styles.appStatValue}>82</span>
                      <span className={styles.appStatUnit}>km/h</span>
                      <span className={styles.appStatLabel}>velocidad</span>
                    </div>
                  </div>

                </div>
              </div>
              <div className={styles.phoneGlow}></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaBenefitGrid}>
            {[
              {
                icon: <CarIcon />,
                title: 'Multi-empresa',
                desc: 'Cada empresa gestiona su propia flota con datos completamente aislados. Vehículos, conductores y rutas independientes.',
              },
              {
                icon: <LocationIcon />,
                title: 'GPS sin hardware extra',
                desc: 'La app Android envía coordenadas automáticamente. Sin dispositivos GPS externos ni instalaciones complejas.',
              },
              {
                icon: <RouteIcon />,
                title: 'Detección de desvíos',
                desc: 'El sistema calcula automáticamente si un vehículo se desvía más del 20% de la ruta directa planificada.',
              },
            ].map((b, i) => (
              <div key={i} className={`${styles.ctaBenefitCard} ${styles.scrollReveal}`} style={{ '--delay': `${i * 0.1}s` } as React.CSSProperties}>
                <div className={styles.ctaBenefitIconWrap}>{b.icon}</div>
                <div className={styles.ctaBenefitText}>
                  <strong>{b.title}</strong>
                  <p>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>
              Empieza a gestionar tu flota hoy
            </h2>
            <p className={styles.ctaSubtitle}>
              Panel web para la empresa, app Android para los conductores.
              Todo conectado en tiempo real, desde el primer momento.
            </p>
            <button
              className={styles.ctaButton}
              onClick={() => router.push('/login')}
            >
              <span>Comenzar Ahora</span>
              <span className={styles.ctaArrow}><ArrowRightIcon /></span>
            </button>
            <div className={styles.ctaTrustLine}>
              <span className={styles.ctaTrustItem}>
                <CheckIcon /> Registro en minutos
              </span>
              <span className={styles.ctaTrustItem}>
                <CheckIcon /> Datos aislados por empresa
              </span>
              <span className={styles.ctaTrustItem}>
                <CheckIcon /> Multiplataforma web + Android
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}><CarIcon /></span>
              <span className={styles.logoText}>./CarCare Tracker</span>
            </div>
            <p className={styles.footerDesc}>
              Gestión de flotas inteligente para empresas modernas.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerColumn}>
              <h4>Producto</h4>
              <a href="#features">Características</a>
              <a href="#download">Descargar App</a>
              <a href="#how-it-works">Cómo Funciona</a>
            </div>
            <div className={styles.footerColumn}>
              <h4>Empresa</h4>
              <a href="#">Sobre Nosotros</a>
              <a href="#">Contacto</a>
              <a href="#">Blog</a>
            </div>
            <div className={styles.footerColumn}>
              <h4>Legal</h4>
              <a href="#">Privacidad</a>
              <a href="#">Términos</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 CarCare Tracker. Todos los derechos reservados.</span>
        </div>
      </footer>
    </main>
  );
}
