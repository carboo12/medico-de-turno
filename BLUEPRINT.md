# BLUEPRINT — SNC Medic (Control de Médicos de Turno)

## 1. Visión General

Aplicación web para registrar y consultar los médicos de turno diarios de SILAIS Chinandega (Nicaragua). Permite a un operador seleccionar cada día qué médicos están de turno, asignados por unidad/municipio, y generar reportes, estadísticas y exportaciones.

---

## 2. Stack Tecnológico

| Capa          | Tecnología                          |
| ------------- | ----------------------------------- |
| Framework     | Next.js 14.1 (App Router)           |
| Lenguaje      | TypeScript 5 (strict)               |
| UI            | React 18 + Tailwind CSS             |
| Animaciones   | Framer Motion 11, tailwindcss-animate |
| Íconos        | Lucide React                        |
| Gráficas      | Recharts                            |
| ORM           | Prisma 5.10                         |
| Base de datos | SQLite (archivo local)              |
| Autenticación | JWT (HS256) via `jose` + bcryptjs   |
| Fechas        | date-fns + date-fns-tz              |
| Excel         | xlsx (sheetjs)                      |
| Cookies       | cookie                              |
| Procesos      | PM2 (producción Windows)            |

---

## 3. Arquitectura General

```
Navegador
   │
   ▼
Middleware (src/middleware.ts)
   │  ┌─ Protege /dashboard/*
   │  └─ Redirige según sesión
   ▼
Next.js Server (Server Components + Server Actions)
   │
   ├─ Server Components → fetch data → pasan props a Client Components
   ├─ Server Actions    → mutaciones (CRUD) → revalidatePath()
   │
   ▼
Prisma ORM → SQLite (prisma/dev.db)
```

### Patrón principal

```
[Server Component]
    │ llama Server Action (getXxx)
    │ pasa datos como props
    ▼
[Client Component]
    │ renderiza UI interactiva
    │ usuario acciona → Server Action
    ▼
[Server Action]
    1. Verifica sesión
    2. Valida operador en DB
    3. Ejecuta Prisma ($transaction)
    4. Registra auditoría (logAction)
    5. revalidatePath()
    6. Retorna resultado
```

---

## 4. Estructura de Archivos

```
/
├── prisma/
│   ├── schema.prisma          # Modelos de datos
│   ├── seed.ts                # Datos iniciales
│   ├── seed_unidades.ts       # Seed independiente de unidades
│   └── dev.db                 # BD SQLite (local)
│
├── src/
│   ├── middleware.ts           # Protección de rutas
│   │
│   ├── app/
│   │   ├── layout.tsx          # Layout raíz (Provider, fuente, CSS)
│   │   ├── globals.css         # Variables CSS, Tailwind, glass
│   │   ├── page.tsx            # Redirección raíz (/dashboard o /login)
│   │   ├── actions.ts          # Server Actions CRUD
│   │   ├── auth-actions.ts     # Server Actions de autenticación
│   │   │
│   │   ├── login/
│   │   │   ├── page.tsx        # Login (público)
│   │   │   └── LoginForm.tsx   # Formulario de login (cliente)
│   │   │
│   │   ├── setup/
│   │   │   ├── page.tsx        # Setup inicial (público, sin usuarios)
│   │   │   └── SetupForm.tsx   # Registro primer admin (cliente)
│   │   │
│   │   └── dashboard/
│   │       ├── page.tsx        # Dashboard principal
│   │       ├── medicos/        # CRUD de médicos
│   │       ├── unidades/       # CRUD de unidades
│   │       ├── reportes/       # Estadísticas y gráficas
│   │       ├── reporte-medicos/   # Catálogo de personal
│   │       ├── reporte-duplicados/ # Detección de duplicados
│   │       └── logs/           # Auditoría de acciones
│   │
│   ├── components/
│   │   ├── LoadingContext.tsx       # Context global de carga
│   │   ├── LoadingOverlay.tsx       # Overlay animado de carga
│   │   ├── ReportForm.tsx           # Formulario de turno
│   │   ├── ReportHistory.tsx        # Historial de reportes
│   │   ├── MedicoManager.tsx        # CRUD médicos + Excel
│   │   ├── UnidadManager.tsx        # CRUD unidades
│   │   └── StatsCharts.tsx          # Gráficas Recharts
│   │
│   └── lib/
│       ├── auth.ts              # JWT (encrypt/decrypt/session)
│       ├── prisma.ts            # Singleton Prisma Client
│       ├── utils.ts             # cn() (clsx + tailwind-merge)
│       ├── logger.ts            # Registro de auditoría
│       └── excel-utils.ts       # Utilidades Excel
│
├── scripts/
│   ├── db-backup.ts             # Backup de BD
│   └── db-restore.ts            # Restauración de BD
│
├── PRODUCCION/
│   ├── 1-INSTALAR-Y-DESPLEGAR.bat
│   ├── 2-REINICIAR-APP.bat
│   ├── 3-DETENER-APP.bat
│   ├── 4-BACKUP-BD.bat
│   ├── 5-RESTAURAR-BD.bat
│   └── 5-CONFIGURAR-FIREWALL.bat
│
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
└── ecosystem.config.cjs      # Config PM2
```

---

## 5. Árbol de Componentes

```
<RootLayout>
  <LoadingProvider>
    <LoadingOverlay />          ← overlay global animado
    [Page Content]
      │
      ├─ <LoginForm />          ← público
      ├─ <SetupForm />          ← público (solo sin usuarios)
      │
      └─ <DashboardLayout>      ← protegido
           ├─ <ReportForm />         ← crear/editar turno
           └─ <ReportHistory />      ← historial agrupado por fecha
                ├─ DeleteButton
                ├─ DeleteGroupButton
                └─ <ReportForm />    ← reutilizado para editar
           ├─ <MedicoManager />      ← CRUD médicos + Excel
           ├─ <UnidadManager />      ← CRUD unidades
           ├─ <StatsCharts />        ← gráficas Recharts
           ├─ <ReporteMedicos />     ← catálogo filtrable
           ├─ <ReporteDuplicados />  ← detección duplicados
           └─ <LogsTable />          ← tabla de auditoría
```

---

## 6. Base de Datos (Prisma + SQLite)

### Modelo Entidad-Relación

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   Operador   │       │  ReportePadre    │       │   Unidad     │
│──────────────│       │──────────────────│       │──────────────│
│ id           │──┐    │ id               │       │ id           │
│ nombre_comple│  │    │ fecha (indexada) │       │ nombre (uniq)│
│ usuario      │  │    │ operador_id ──────┘       └──────────────┘
│ password     │  │    └────────┬─────────┘              ▲
└──────────────┘  │             │                        │
                  │             │ 1:N                    │ 1:N
                  │             ▼                        │
                  │    ┌──────────────────┐              │
                  │    │ ReporteDetalle   │              │
                  │    │──────────────────│              │
                  │    │ id               │              │
                  │    │ reporte_id (FK)──┘              │
                  │    │ medico_id (FK)──┐               │
                  │    └──────────────────┘              │
                  │                                      │
                  │    ┌──────────────────┐              │
                  │    │ CatalogoMedico   │              │
                  │    │──────────────────│──────────────┘
                  │    │ id               │
                  │    │ nombre           │
                  │    │ telefono         │
                  │    │ tipo (GENERAL/   │
                  │    │       SOCIAL)    │
                  │    │ unidad_id (FK)───┘
                  │    └──────────────────┘
                  │
                  │    ┌──────────────────┐
                  │    │   LogAccion      │
                  │    │──────────────────│
                  │    │ id               │
                  │    │ fecha            │
                  │    │ usuario          │
                  │    │ accion           │
                  │    │ descripcion      │
                  │    └──────────────────┘
```

### Restricciones clave

- `CatalogoMedico`: unique en `[nombre + unidad_id + telefono]`
- `Unidad.nombre`: unique
- `ReporteDetalle` con `onDelete: Cascade` sobre `reporte_id`
- `fecha` en `ReportePadre` es indexed

---

## 7. Enrutamiento

| Ruta                      | Tipo     | Protección | Propósito                      |
| ------------------------- | -------- | ---------- | ------------------------------ |
| `/`                       | Server   | Pública    | Redirige según sesión          |
| `/login`                  | Server   | Pública    | Inicio de sesión               |
| `/setup`                  | Server   | Pública    | Registro primer admin          |
| `/dashboard`              | Server   | Protegida  | Dashboard principal            |
| `/dashboard/medicos`      | Server   | Protegida  | Gestión de médicos             |
| `/dashboard/unidades`     | Server   | Protegida  | Gestión de unidades            |
| `/dashboard/reportes`     | Client   | Protegida  | Estadísticas y gráficas        |
| `/dashboard/reporte-medicos` | Client | Protegida | Catálogo de personal         |
| `/dashboard/reporte-duplicados` | Client | Protegida | Duplicados               |
| `/dashboard/logs`         | Server   | Protegida  | Registro de auditoría          |

### Middleware (`middleware.ts`)

- `/login` + `/`: si hay sesión → redirect `/dashboard`
- `/dashboard/*`: si NO hay sesión → redirect `/login`
- Excluye: `_next/static`, `_next/image`, `favicon.ico`

---

## 8. Flujo de Autenticación

```
1. Primera ejecución (0 usuarios en BD):
   /login → detecta sin usuarios → redirect a /setup
   SetupForm → registerFirstUser() → crea admin → redirect /login

2. Usuarios existentes:
   /login → LoginForm → login() server action
      ├─ bcrypt.compare(password, hash)
      ├─ Crea JWT (HS256, 2h exp)
      ├─ Cookie httpOnly "session"
      └─ redirect /dashboard

3. Logout:
   logout() → limpia cookie → redirect /login
```

---

## 9. Funcionalidades por Pantalla

### Dashboard (`/dashboard`)
- **Columna izquierda**: formulario para crear nuevo reporte de turno (seleccionar fecha + médicos por checkboxes agrupados por unidad)
- **Columna derecha**: historial de reportes agrupados por fecha con:
  - Filtro por rango de fechas
  - Tarjetas expandibles con detalle de médicos
  - Botones para editar/eliminar individual o grupal
  - Indicador visual de unidades que faltan por reportar

### Gestión de Médicos (`/dashboard/medicos`)
- Tabla con todos los médicos (nombre, teléfono, tipo, unidad)
- Modal para crear/editar médico
- Eliminar con confirmación
- Importar desde Excel (.xlsx)
- Exportar a Excel
- Descargar plantilla Excel
- Advertencia si el médico ya existe

### Gestión de Unidades (`/dashboard/unidades`)
- Grid de tarjetas con nombre de unidad
- Modal para crear/editar unidad
- Eliminar (solo si no tiene médicos asignados)
- Muestra cantidad de médigos por unidad

### Reportes y Estadísticas (`/dashboard/reportes`)
- Filtro por rango de fechas
- **Gráfico de barras**: reportes por unidad
- **Gráfico circular**: distribución por tipo de médico
- **Ranking**: unidades con más y menos reportes
- **Tabla detallada**: operador, fecha, unidades, médicos
- Exportar a Excel
- Imprimir (versión optimizada)

### Catálogo de Personal (`/dashboard/reporte-medicos`)
- Búsqueda por nombre
- Filtros por unidad y tipo (GENERAL/SOCIAL)
- Exportar a Excel
- Imprimir (versión optimizada para A4)

### Reporte de Duplicados (`/dashboard/reporte-duplicados`)
- Detecta nombres duplicados
- Detecta teléfonos duplicados
- Filtros por tipo de duplicado
- Exportar a Excel
- Imprimir

### Log de Acciones (`/dashboard/logs`)
- Tabla con: fecha, usuario, acción, descripción
- Últimas 100 entradas
- Diseño compacto con scroll

---

## 10. Server Actions (API Interna)

Todas las mutaciones vía Server Actions de Next.js en `src/app/actions.ts` y `auth-actions.ts`:

| Acción                    | Archivo        | Input                              | Output         |
| ------------------------- | -------------- | ---------------------------------- | -------------- |
| `login()`                 | auth-actions   | usuario + password                 | redirect       |
| `logout()`                | auth-actions   | —                                  | redirect       |
| `registerFirstUser()`     | auth-actions   | datos operador                     | redirect       |
| `createReport()`          | actions        | fecha + IDs médicos                | ReportePadre   |
| `updateReport()`          | actions        | id + datos                         | ReportePadre   |
| `deleteReport()`          | actions        | id                                 | void           |
| `deleteReportsByDate()`   | actions        | fecha                              | void           |
| `getReports()`            | actions        | filtros (fechaDesde, fechaHasta)   | ReportePadre[] |
| `getUnidades()`           | actions        | —                                  | Unidad[]       |
| `createUnidad()`          | actions        | nombre                             | Unidad         |
| `updateUnidad()`          | actions        | id + nombre                        | Unidad         |
| `deleteUnidad()`          | actions        | id                                 | void           |
| `getMedicos()`            | actions        | —                                  | CatalogoMedico[]|
| `createMedico()`          | actions        | data médico                        | CatalogoMedico |
| `updateMedico()`          | actions        | id + data                          | CatalogoMedico |
| `deleteMedico()`          | actions        | id                                 | void           |
| `importMedicos()`         | actions        | array de médicos                   | count          |
| `getLogs()`               | actions        | —                                  | LogAccion[]    |

Todas verifican sesión activa y registran auditoría.

---

## 11. Utilidades Clave

| Utilidad                        | Archivo           | Propósito                                    |
| ------------------------------- | ----------------- | -------------------------------------------- |
| `cn(...)`                       | `lib/utils.ts`    | Merge condicional de clases Tailwind         |
| `encrypt(payload)` / `decrypt`  | `lib/auth.ts`     | JWT HS256 (2h exp)                           |
| `getSession()` / `updateSession`| `lib/auth.ts`     | Leer/refrescar sesión desde cookie           |
| `logAction(accion, descripcion)`| `lib/logger.ts`   | Escribe en LogAccion                         |
| `generateMedicoTemplate()`      | `lib/excel-utils` | Genera plantilla Excel                       |
| `parseMedicoExcel(file)`        | `lib/excel-utils` | Parsea Excel a JSON                          |
| `exportToExcel(data, name, hdr)`| `lib/excel-utils` | Descarga Excel desde el cliente              |
| `prisma` singleton              | `lib/prisma.ts`   | Cliente Prisma con hot-reload seguro         |
| `useLoading()`                  | `components/LoadingContext` | Controla overlay global de carga |

---

## 12. Producción y Despliegue

### Requisitos
- Node.js 18+
- npm
- PM2 global (`npm install -g pm2`)

### Scripts de despliegue (Windows `.bat`)

| Script                    | Función                                      |
| ------------------------- | -------------------------------------------- |
| `1-INSTALAR-Y-DESPLEGAR` | npm install → prisma generate → build → pm2 start |
| `2-REINICIAR-APP`        | pm2 reload snc-medic                         |
| `3-DETENER-APP`          | pm2 stop snc-medic                           |
| `4-BACKUP-BD`            | Copia `dev.db` a `backups/` con timestamp    |
| `5-RESTAURAR-BD`         | Detiene app → restaura backup → inicia app   |
| `5-CONFIGURAR-FIREWALL`  | Abre puerto 3000 en firewall                 |

### PM2
```
ecosystem.config.cjs → snc-medic, puerto 3000
```

### Backup automático de BD
- Script Node.js `scripts/db-backup.ts`
- Copia `prisma/dev.db` → `backups/respaldo_<timestamp>.db`
- Versión de restauración: `scripts/db-restore.ts`

---

## 13. Convenciones del Código

- **Server Components** para fetch de datos y páginas estáticas
- **Client Components** solo cuando hay interactividad (`'use client'`)
- **Server Actions** para toda mutación (`'use server'`)
- Para estilos solo se usa **Tailwind utility classes** (no CSS modules, no styled-components)
- **Alias `@/`** para importar desde `src/`
- Fechas en zona horaria `America/Managua`
- Sin librerías de estado externas — se usa React Context + estado local
- Animaciones con **Framer Motion** (`motion.div`, `AnimatePresence`) para modales y overlays

---

## 14. Plan de Desarrollo / Posibles Mejoras

- [ ] Filtros avanzados en reportes (por operador, por unidad específica)
- [ ] Paginación en logs y reportes
- [ ] Editar perfil de operador
- [ ] Roles (admin vs operador)
- [ ] Notificaciones de unidades faltantes
- [ ] Dashboard resumen con tarjetas KPI
- [ ] Modo oscuro completo
- [ ] Tests automatizados
- [ ] Migración a PostgreSQL/MySQL para escalar
- [ ] API REST para integración externa
