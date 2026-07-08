# SNC Medic — Control de Médicos de Turno

<p align="center">
  <strong>Sistema web para el registro y consulta diaria de médicos de turno</strong>
  <br />
  SILAIS Chinandega, Nicaragua
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.1-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PM2-2B2B2B?style=flat-square&logo=pm2" alt="PM2" />
</p>

---

## Tabla de Contenidos

- [Descripción](#descripción)
- [Stack Tecnológico](#stack-tecnológico)
- [Funcionalidades](#funcionalidades)
- [Capturas de Pantalla](#capturas-de-pantalla)
- [Instalación y Desarrollo](#instalación-y-desarrollo)
- [Despliegue en Producción](#despliegue-en-producción)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Base de Datos](#base-de-datos)
- [Licencia](#licencia)

---

## Descripción

**SNC Medic** es una aplicación web diseñada para el **Sistema Local de Atención Integral en Salud (SILAIS) de Chinandega**, Nicaragua. Permite al personal operativo registrar diariamente qué médicos se encuentran de turno en cada unidad/municipio, y a los supervisores consultar reportes históricos, generar estadísticas, detectar duplicados en el catálogo de personal y exportar datos a Excel.

### Problema que resuelve

Antes de SNC Medic, el registro de médicos de turno se realizaba de forma manual en hojas de cálculo y papel, lo que dificultaba la consulta histórica, la generación de reportes y la detección de inconsistencias en los datos del personal.

### Usuarios principales

- **Operadores**: registran el médico de turno de cada unidad a diario.
- **Supervisores/Administradores**: consultan reportes, estadísticas y gestionan el catálogo de personal.

---

## Stack Tecnológico

| Categoría          | Tecnología                                                  |
| ------------------ | ----------------------------------------------------------- |
| **Framework**      | Next.js 14.1 (App Router, Server Components, Server Actions)|
| **Lenguaje**       | TypeScript 5 (strict mode)                                  |
| **UI**             | React 18 + Tailwind CSS + Framer Motion                     |
| **Base de Datos**  | SQLite vía Prisma ORM 5                                     |
| **Autenticación**  | JWT (HS256) con `jose` + bcryptjs                           |
| **Gráficas**       | Recharts (barras + circular)                                |
| **Exportación**    | XLSX (SheetJS)                                              |
| **Íconos**         | Lucide React                                                |
| **Fechas**         | date-fns + date-fns-tz (zona: America/Managua)              |
| **Procesos**       | PM2 (producción en Windows)                                 |

---

## Funcionalidades

### Gestión principal
- **Registro de turno diario**: formulario con selección de médicos agrupados por unidad.
- **Historial de reportes**: vista agrupada por fecha con filtros, edición y eliminación.
- **Indicador de unidades faltantes**: resalta visualmente las unidades que no han reportado turno.

### Catálogos
- **Gestión de médicos**: CRUD completo con importación/exportación desde Excel y detección de duplicados.
- **Gestión de unidades**: CRUD de municipios/establecimientos con conteo de médicos asignados.

### Reportes y estadísticas
- **Dashboard de reportes**: gráficos de barras (reportes por unidad) y circular (distribución por tipo de médico).
- **Rankings**: unidades con más y menos reportes en un rango de fechas.
- **Catálogo de personal**: vista filtrable e imprimible de todos los médicos.
- **Detección de duplicados**: encuentra nombres y teléfonos repetidos en el catálogo.

### Administración
- **Registro de auditoría (log)**: todas las acciones quedan registradas con usuario y timestamp.
- **Autenticación segura**: JWT con expiración de 2 horas y contraseñas hasheadas con bcrypt.
- **Setup inicial**: pantalla de registro del primer administrador cuando la base de datos está vacía.

### Exportación e impresión
- Exportar cualquier reporte a **Excel** (.xlsx).
- **Impresión** optimizada para papel (oculta navegación, formato A4).

---

## Instalación y Desarrollo

### Requisitos previos

- Node.js 18 o superior
- npm

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd medico-de-turno

# 2. Instalar dependencias
npm install

# 3. Generar el cliente de Prisma
npx prisma generate

# 4. (Opcional) Sembrar la base de datos con datos de ejemplo
npx prisma db seed

# 5. Iniciar en modo desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

> **Primer inicio**: al no encontrar usuarios, el sistema redirigirá automáticamente a la pantalla de configuración inicial para crear el primer administrador.

### Comandos disponibles

| Comando                 | Descripción                                   |
| ----------------------- | --------------------------------------------- |
| `npm run dev`           | Inicia servidor de desarrollo                 |
| `npm run build`         | Compila la aplicación para producción         |
| `npm start`             | Inicia el servidor de producción              |
| `npm run db-backup`     | Ejecuta backup manual de la base de datos     |
| `npm run db-restore`    | Restaura el backup más reciente               |

---

## Despliegue en Producción

SNC Medic está diseñado para ejecutarse en un entorno **Windows** local con **PM2**.

### Despliegue automatizado

Ejecutar los scripts `.bat` en orden:

```bash
# 1. Instalar dependencias, compilar e iniciar con PM2
.\PRODUCCION\1-INSTALAR-Y-DESPLEGAR.bat

# 2. La app corre en http://localhost:3000
```

### Scripts de producción disponibles

| Script                                     | Función                              |
| ------------------------------------------ | ------------------------------------ |
| `1-INSTALAR-Y-DESPLEGAR.bat`              | Instalación completa + despliegue    |
| `2-REINICIAR-APP.bat`                     | Recargar la aplicación               |
| `3-DETENER-APP.bat`                       | Detener la aplicación                |
| `4-BACKUP-BD.bat`                         | Backup de la base de datos           |
| `5-RESTAURAR-BD.bat`                      | Restaurar base de datos desde backup |
| `5-CONFIGURAR-FIREWALL.bat`               | Abrir puerto 3000 en el firewall     |

### Respaldo de base de datos

Los backups se almacenan en `backups/` con formato `respaldo_<timestamp>.db`. Se pueden programar backups periódicos mediante el script `4-BACKUP-BD.bat`.

---

## Estructura del Proyecto

```
medico-de-turno/
├── prisma/                  # Schema, migraciones y seed de BD
├── scripts/                 # Utilidades de backup/restauración
├── PRODUCCION/              # Scripts .bat para despliegue
├── backups/                 # Archivos de respaldo de BD
├── src/
│   ├── app/                 # Páginas y Server Actions
│   │   ├── login/           # Inicio de sesión
│   │   ├── setup/           # Configuración inicial
│   │   └── dashboard/       # Módulo principal (protegido)
│   │       ├── medicos/     # CRUD de médicos
│   │       ├── unidades/    # CRUD de unidades
│   │       ├── reportes/    # Estadísticas y gráficas
│   │       ├── reporte-medicos/     # Catálogo de personal
│   │       ├── reporte-duplicados/  # Duplicados
│   │       └── logs/        # Auditoría
│   ├── components/          # Componentes React reutilizables
│   ├── lib/                 # Utilidades (auth, prisma, excel)
│   └── middleware.ts        # Protección de rutas
├── README.md
├── BLUEPRINT.md             # Documentación técnica completa
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Base de Datos

SNC Medic utiliza **SQLite** como motor de base de datos local. El archivo de base de datos se encuentra en `prisma/dev.db`.

### Modelos principales

| Modelo           | Descripción                                      |
| ---------------- | ------------------------------------------------ |
| `Operador`       | Usuarios del sistema                             |
| `Unidad`         | Municipios o establecimientos de salud           |
| `CatalogoMedico` | Médicos registrados, asignados a una unidad      |
| `ReportePadre`   | Reporte diario de turno (fecha + operador)       |
| `ReporteDetalle` | Médicos incluidos en cada reporte                |
| `LogAccion`      | Registro de auditoría de todas las operaciones   |

Para más detalles sobre el esquema y las relaciones, consultar [`BLUEPRINT.md`](BLUEPRINT.md).

---

## Licencia

Uso interno — SILAIS Chinandega, Ministerio de Salud, Nicaragua.
