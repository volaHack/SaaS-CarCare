"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./landing/landing.module.css";

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

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
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
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.523 15.34c-.5 0-.908-.406-.908-.907s.408-.907.908-.907c.502 0 .907.405.907.907 0 .502-.405.907-.907.907m-11.046 0c-.503 0-.908-.406-.908-.907s.405-.907.908-.907c.5 0 .907.405.907.907 0 .502-.407.907-.907.907M17.97 6.88l1.97-3.415c.11-.19.045-.434-.145-.544-.19-.11-.434-.045-.543.145L17.25 6.553c-1.543-.7-3.285-1.093-5.25-1.093s-3.707.393-5.25 1.093L4.748 3.066c-.11-.19-.354-.255-.543-.145-.19.11-.256.354-.145.544L6.03 6.88C2.57 8.55.27 11.945.07 16h23.86c-.2-4.055-2.5-7.45-5.96-9.12" />
  </svg>
);

const FloatingParticles = () => {
  const [particles, setParticles] = useState<Array<{ id: number; left: string; top: string; delay: string; duration: string }>>([]);

  useEffect(() => {
    // Generar partículas solo en el cliente para evitar hydration mismatch
    const newParticles = [...Array(50)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${3 + Math.random() * 4}s`,
    }));
    setParticles(newParticles);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className={styles.particles}>
      {particles.map((p) => (
        <div
          key={p.id}
          className={styles.particle}
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
};

// Componente de fondo con gradiente animado
const AnimatedBackground = () => {
  return (
    <div className={styles.animatedBg}>
      <div className={styles.gradientOrb1} />
      <div className={styles.gradientOrb2} />
      <div className={styles.gradientOrb3} />
      <div className={styles.gridOverlay} />
    </div>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setIsVisible(true);

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Rotación automática de features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
      title: "Analíticas Avanzadas",
      description: "Predicciones de consumo, tendencias mensuales y recomendaciones para optimizar costes.",
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
      title: "Eco-Friendly",
      description: "Métricas de sostenibilidad y ahorro de combustible para reducir tu huella de carbono.",
      color: "#22c55e"
    }
  ];

  const stats = [
    { number: "99.9%", label: "Uptime Garantizado" },
    { number: "3s", label: "Actualización GPS" },
    { number: "50+", label: "Flotas Gestionadas" },
    { number: "24/7", label: "Soporte Técnico" }
  ];

  return (
    <main className={styles.main}>
      <AnimatedBackground />
      <FloatingParticles />

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
            <span className={styles.tagIcon}><SparklesIcon /></span>
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
              <span className={styles.androidIcon}><SmartphoneIcon /></span>
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

        {/* Hero Visual */}
        <div className={styles.heroVisual}>
          <div className={styles.mockupContainer}>
            <div className={styles.dashboardMockup}>
              <div className={styles.mockupHeader}>
                <div className={styles.mockupDots}>
                  <span></span><span></span><span></span>
                </div>
                <span className={styles.mockupUrl}>carcare-tracker.app</span>
              </div>
              <div className={styles.mockupContent}>
                <div className={styles.mockupSidebar}>
                  <div className={styles.sidebarItem}></div>
                  <div className={styles.sidebarItem}></div>
                  <div className={styles.sidebarItem}></div>
                </div>
                <div className={styles.mockupMain}>
                  <div className={styles.mockupCard}></div>
                  <div className={styles.mockupCard}></div>
                  <div className={styles.mockupMap}>
                    <div className={styles.mapPin}></div>
                    <div className={styles.mapPin} style={{ left: '60%', top: '40%' }}></div>
                    <div className={styles.mapRoute}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.phoneMockup}>
              <div className={styles.phoneNotch}></div>
              <div className={styles.phoneContent}>
                <div className={styles.phoneHeader}>
                  <CarIcon />
                  <span>Ruta Activa</span>
                </div>
                <div className={styles.phoneMap}></div>
                <div className={styles.phoneStatus}>
                  <span className={styles.liveIndicator}></span>
                  <span>GPS Activo</span>
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
              className={`${styles.featureCard} ${activeFeature === index ? styles.activeCard : ''}`}
              onMouseEnter={() => setActiveFeature(index)}
              style={{ '--accent-color': feature.color } as React.CSSProperties}
            >
              <div className={styles.featureIcon}>
                {feature.icon}
              </div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.description}</p>
              <div className={styles.featureGlow} />
            </div>
          ))}
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
          <div className={styles.step}>
            <div className={styles.stepNumber}>01</div>
            <div className={styles.stepContent}>
              <h3>Registra tu Flota</h3>
              <p>Añade tus vehículos con sus datos: matrícula, modelo, kilometraje y tipo de combustible.</p>
            </div>
            <div className={styles.stepIcon}><CarIcon /></div>
          </div>

          <div className={styles.stepConnector}>
            <div className={styles.connectorLine}></div>
            <div className={styles.connectorDot}></div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>02</div>
            <div className={styles.stepContent}>
              <h3>Descarga la App</h3>
              <p>Tus conductores instalan la app Android para recibir rutas y enviar su ubicación GPS.</p>
            </div>
            <div className={styles.stepIcon}><SmartphoneIcon /></div>
          </div>

          <div className={styles.stepConnector}>
            <div className={styles.connectorLine}></div>
            <div className={styles.connectorDot}></div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>03</div>
            <div className={styles.stepContent}>
              <h3>Controla Todo</h3>
              <p>Monitoriza rutas en tiempo real, analiza datos y optimiza tu operación desde el panel web.</p>
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

          <div className={styles.downloadVisual}>
            <div className={styles.downloadPhone}>
              <div className={styles.phoneFrame}>
                <div className={styles.phoneNotch}></div>
                <div className={styles.phoneScreen}>
                  <div className={styles.appHeader}>
                    <span className={styles.appLogo}><CarIcon /></span>
                    <span>CarCare Driver</span>
                  </div>
                  <div className={styles.appRoute}>
                    <div className={styles.routeInfo}>
                      <span className={styles.routeLabel}>Ruta Activa</span>
                      <span className={styles.routeTitle}>Madrid → Barcelona</span>
                    </div>
                    <div className={styles.routeStatus}>
                      <span className={styles.liveIndicator}></span>
                      <span>En curso</span>
                    </div>
                  </div>
                  <div className={styles.appMap}>
                    <div className={styles.mapGradient}></div>
                  </div>
                  <div className={styles.appStats}>
                    <div className={styles.appStat}>
                      <span className={styles.appStatValue}>623</span>
                      <span className={styles.appStatLabel}>km restantes</span>
                    </div>
                    <div className={styles.appStat}>
                      <span className={styles.appStatValue}>5h 30m</span>
                      <span className={styles.appStatLabel}>tiempo est.</span>
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
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>
            ¿Listo para optimizar tu flota?
          </h2>
          <p className={styles.ctaSubtitle}>
            Comienza hoy mismo y descubre cómo CarCare Tracker puede transformar tu operación
          </p>
          <button
            className={styles.ctaButton}
            onClick={() => router.push('/login')}
          >
            <span>Comenzar Ahora</span>
            <span className={styles.ctaArrow}><ArrowRightIcon /></span>
          </button>
        </div>
        <div className={styles.ctaOrbs}>
          <div className={styles.ctaOrb1}></div>
          <div className={styles.ctaOrb2}></div>
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
