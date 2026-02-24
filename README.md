<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Android-SDK_34-3DDC84?style=for-the-badge&logo=android&logoColor=white" />
  <img src="https://img.shields.io/badge/Railway-Deployed-0B0D0E?style=for-the-badge&logo=railway&logoColor=white" />
</p>

<h1 align="center">🚗 CarCare Tracker — SaaS de Gestión de Flotas</h1>

<p align="center">
  <strong>Trabajo de Fin de Grado (TFG)</strong><br/>
  Plataforma SaaS para la gestión inteligente de flotas de vehículos con tracking GPS en tiempo real, analíticas avanzadas y comunicación conductor-empresa.
</p>

<p align="center">
  <a href="#-características">Características</a> •
  <a href="#-arquitectura-del-sistema">Arquitectura</a> •
  <a href="#-tecnologías">Tecnologías</a> •
  <a href="#-instalación-y-configuración">Instalación</a> •
  <a href="#-variables-de-entorno">Variables de Entorno</a> •
  <a href="#-despliegue">Despliegue</a>
</p>

---

## 📸 Vista General

| Landing Page | Dashboard | App Android |
|:---:|:---:|:---:|
| Página de presentación con diseño premium y animaciones | Panel de control con flota, rutas, estadísticas y tracking GPS | App nativa para conductores con GPS en tiempo real |

---

## ✨ Características

### 🖥️ Panel Web (Frontend)
- **Gestión de Flota** — Alta, baja y monitorización de vehículos (marca, modelo, matrícula, combustible, kilometraje)
- **Planificación de Rutas** — Creación de rutas con geocodificación automática via OpenStreetMap (Nominatim)
- **Tracking GPS en Vivo** — Mapa interactivo (Leaflet) con actualización cada 3 segundos
- **Estadísticas y Analíticas** — Gráficos de consumo de combustible, predicciones de tendencia y KPIs (Recharts)
- **Chat en Tiempo Real** — Comunicación directa entre panel web y conductores
- **Historial de Mantenimiento** — Registro de mantenimiento preventivo y correctivo por vehículo
- **Autenticación multirol** — Login separado para administradores y conductores
- **Seguridad anti-bot** — Cloudflare Turnstile integrado en formularios de login y registro
- **Landing Page profesional** — Página de marketing con animaciones, partículas y diseño responsive

### 📱 App Android (Conductores)
- **Login de conductor** — Autenticación asociada a su empresa/flota
- **Tracking GPS** — Servicio en segundo plano que envía ubicación al backend cada pocos segundos
- **Recepción de rutas** — Visualización de rutas asignadas por el administrador
- **Interfaz nativa** — Material Design con soporte para Android 7.0+ (SDK 24)

### ⚙️ Backend (API REST)
- **API RESTful** — Endpoints para vehículos, rutas, usuarios, conductores, mensajes, repostajes y mantenimientos
- **Autenticación** — Registro e inicio de sesión con contraseñas encriptadas (BCrypt)
- **Base de datos** — MongoDB Atlas con colecciones separadas para usuarios (admins) y conductores
- **Multi-tenant** — Los datos de cada empresa están aislados por `empresaId`
- **CORS abierto** — Permite conexiones desde cualquier origen (web, Android, etc.)

---

## 🏗️ Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────────┐
│                       CLIENTE                                │
│                                                              │
│   ┌─────────────┐            ┌──────────────────┐            │
│   │  Next.js    │            │  Android App     │            │
│   │  (Panel Web)│            │  (Conductores)   │            │
│   │  :3000      │            │  GPS + Login     │            │
│   └──────┬──────┘            └────────┬─────────┘            │
│          │                            │                      │
└──────────┼────────────────────────────┼──────────────────────┘
           │          HTTPS             │
           ▼                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    BACKEND (Railway)                          │
│                                                              │
│   ┌──────────────────────────────────────────────────┐       │
│   │           Spring Boot 3.2 (Java 17)              │       │
│   │                                                  │       │
│   │  /api/auth     → Autenticación (Admin+Conductor) │       │
│   │  /api/vehiculos → CRUD de vehículos              │       │
│   │  /api/rutas    → Gestión de rutas + GPS          │       │
│   │  /api/mensajes → Chat en tiempo real             │       │
│   │  /api/repostajes → Registro de combustible       │       │
│   │  /api/mantenimientos → Historial de mantenimiento│       │
│   │                                                  │       │
│   │  Puerto: 8080                                    │       │
│   └──────────────────┬───────────────────────────────┘       │
│                      │                                       │
└──────────────────────┼───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                  BASE DE DATOS                               │
│                                                              │
│   ┌──────────────────────────────────────────────────┐       │
│   │              MongoDB Atlas (Cloud)                │       │
│   │                                                  │       │
│   │  📁 usuarios      → Admins / Empresas            │       │
│   │  📁 conductores   → Conductores vinculados       │       │
│   │  📁 vehiculos     → Flota de vehículos           │       │
│   │  📁 rutas         → Rutas con coordenadas GPS    │       │
│   │  📁 mensajes      → Chat conductor ↔ empresa     │       │
│   │  📁 repostajes    → Registros de combustible     │       │
│   │  📁 mantenimientos→ Historial por vehículo       │       │
│   └──────────────────────────────────────────────────┘       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tecnologías

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | Next.js (React + TypeScript) | 16.1.6 |
| **Estilos** | Tailwind CSS + CSS Modules | 4.1.18 |
| **Gráficos** | Recharts | 3.6 |
| **Mapas** | Leaflet + React-Leaflet | 1.9 / 5.0 |
| **Animaciones** | Framer Motion | 12.x |
| **Backend** | Spring Boot (Java) | 3.2.1 |
| **Base de Datos** | MongoDB Atlas | - |
| **Seguridad** | BCrypt (Spring Security Crypto) | - |
| **Anti-bot** | Cloudflare Turnstile | v0 |
| **Android** | Android SDK (Java) | API 34 |
| **GPS** | Google Play Services Location | 21.0.1 |
| **Despliegue** | Railway | - |

---

## 📁 Estructura del Proyecto

```
SaaS-CarCare/
│
├── frontend/                      # 🖥️ Panel Web (Next.js)
│   ├── app/
│   │   ├── page.tsx               # Landing Page
│   │   ├── login/                 # Login de administradores
│   │   ├── register/              # Registro de empresas
│   │   ├── dashboard/             # Panel principal (flota, rutas, stats, tracking)
│   │   ├── conductor/             # Login y vista de conductor
│   │   ├── vehiculo/[id]/         # Detalle de vehículo + mantenimientos
│   │   └── ruta/[id]/             # Detalle de ruta + chat + mapa
│   ├── componentes/
│   │   ├── MapTrackingGlobal.tsx   # Mapa de tracking global
│   │   ├── ChatRuta.tsx            # Chat en tiempo real
│   │   ├── LocationInput.tsx       # Input con autocompletado geográfico
│   │   ├── CloudflareTurnstile.tsx # Widget anti-bot de Cloudflare
│   │   └── BackgroundMeteors.tsx   # Efectos visuales del dashboard
│   ├── .env.local                 # ⚠️ Variables de entorno (no incluido en git)
│   ├── next.config.ts
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/                       # ⚙️ API REST (Spring Boot)
│   ├── src/main/java/com/ecofleet/
│   │   ├── GestionFlotaApplication.java  # Punto de entrada
│   │   ├── config/
│   │   │   ├── WebConfig.java            # Configuración CORS
│   │   │   └── CargadorDatos.java        # Datos iniciales
│   │   ├── controller/
│   │   │   ├── AuthController.java       # Login y registro (admin + conductor)
│   │   │   ├── VehiculoController.java   # CRUD de vehículos
│   │   │   ├── RutaController.java       # Gestión de rutas
│   │   │   ├── MensajeController.java    # Chat
│   │   │   ├── RepostajeController.java  # Repostajes
│   │   │   └── MantenimientoController.java # Mantenimientos
│   │   ├── model/                        # Entidades MongoDB
│   │   └── repository/                   # Repositorios Spring Data
│   ├── application.properties
│   └── pom.xml
│
└── android/                       # 📱 App para Conductores
    └── app/src/main/java/com/carcare/app/
        ├── MainActivity.java      # Actividad principal
        └── TrackingService.java   # Servicio GPS en segundo plano
```

---

## 🚀 Instalación y Configuración

### Requisitos Previos

| Herramienta | Versión mínima |
|------------|---------------|
| Node.js | 18+ |
| npm | 9+ |
| Java JDK | 17+ |
| Maven | 3.8+ |
| Android Studio | 2023+ (para la app Android) |
| MongoDB Atlas | Cuenta gratuita |

### 1. Clonar el repositorio

```bash
git clone https://github.com/volitancrooss/SaaS-CarCare.git
cd SaaS-CarCare
```

### 2. Configurar el Frontend

```bash
cd frontend
npm install
```

Crear el archivo `.env.local` en la carpeta `frontend/`:

```env
# URL del backend (Railway o local)
NEXT_PUBLIC_API_URL=https://saas-carcare-production.up.railway.app

# MongoDB connection string (referencia, lo usa el backend)
MONGO_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/<database>

# Cloudflare Turnstile (opcional, protección anti-bot)
# NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=tu_site_key
# CLOUDFLARE_TURNSTILE_SECRET_KEY=tu_secret_key
```

Lanzar en modo desarrollo:

```bash
npm run dev
```

La aplicación se abrirá en **http://localhost:3000**

### 3. Configurar el Backend (desarrollo local)

```bash
cd backend
```

Configurar la variable de entorno `MONGO_URI` antes de arrancar:

**Windows (PowerShell):**
```powershell
$env:MONGO_URI="mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/<database>"
mvn spring-boot:run
```

**Linux/macOS:**
```bash
export MONGO_URI="mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/<database>"
mvn spring-boot:run
```

El backend arranca en **http://localhost:8080**

> **Nota:** Para desarrollo local, cambia `NEXT_PUBLIC_API_URL` a `http://localhost:8080` en el `.env.local` del frontend.

### 4. App Android

1. Abre la carpeta `android/` con **Android Studio**
2. Sincroniza el proyecto con Gradle
3. Conecta un dispositivo o usa un emulador (API 24+)
4. Ejecuta la app

---

## 🔐 Variables de Entorno

### Frontend (`frontend/.env.local`)

| Variable | Obligatoria | Descripción |
|----------|:-----------:|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | URL del backend (Railway o localhost) |
| `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` | ❌ | Clave pública de Cloudflare Turnstile |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | ❌ | Clave secreta de Cloudflare Turnstile |

### Backend (Railway / Variables de sistema)

| Variable | Obligatoria | Descripción |
|----------|:-----------:|-------------|
| `MONGO_URI` | ✅ | URI de conexión a MongoDB Atlas |

---

## ☁️ Despliegue

### Backend en Railway

1. Conecta el repositorio a [Railway](https://railway.app)
2. Configura el servicio backend apuntando a la carpeta `backend/`
3. Añade la variable de entorno:
   - `MONGO_URI` → tu URI de MongoDB Atlas
4. Railway detecta automáticamente Maven y despliega el JAR

### Frontend en Vercel / Railway

1. Configura el servicio apuntando a `frontend/`
2. Añade las variables de entorno:
   - `NEXT_PUBLIC_API_URL` → URL del backend desplegado
3. Build command: `npm run build`
4. Output: `.next/`

---

## 📡 Endpoints de la API

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Registro de admin/empresa |
| `POST` | `/api/auth/login` | Login de admin |
| `POST` | `/api/auth/register/conductor` | Registro de conductor |
| `POST` | `/api/auth/login/conductor` | Login de conductor |
| `GET` | `/api/auth/health` | Health check |

### Vehículos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/vehiculos` | Listar vehículos |
| `POST` | `/api/vehiculos` | Crear vehículo |
| `PUT` | `/api/vehiculos/:id` | Actualizar vehículo |
| `DELETE` | `/api/vehiculos/:id` | Eliminar vehículo |

### Rutas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/rutas` | Listar rutas |
| `POST` | `/api/rutas` | Crear ruta |
| `PUT` | `/api/rutas/:id` | Actualizar ruta (estado, GPS) |
| `DELETE` | `/api/rutas/:id` | Eliminar ruta |

### Mensajes (Chat)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/mensajes/ruta/:rutaId` | Obtener mensajes de una ruta |
| `POST` | `/api/mensajes` | Enviar mensaje |

### Mantenimientos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/mantenimientos/vehiculo/:id` | Historial por vehículo |
| `POST` | `/api/mantenimientos` | Registrar mantenimiento |

---

## 🔒 Seguridad

- **Contraseñas** — Encriptadas con BCrypt (Spring Security Crypto)
- **CORS** — Configurado en `WebConfig.java` para permitir conexiones desde el frontend
- **Cloudflare Turnstile** — Protección anti-bot en formularios de login y registro (opcional)
- **Multi-tenant** — Datos aislados por empresa mediante `empresaId`
- **Validación** — Jakarta Validation en el backend para validar datos de entrada

---

## 👤 Autor

**Trabajo de Fin de Grado (TFG)**

---

## 📄 Licencia

Este proyecto es un trabajo académico realizado como Trabajo de Fin de Grado.

---

<p align="center">
  <sub>Desarrollado con ❤️ usando Next.js, Spring Boot y MongoDB</sub>
</p>
