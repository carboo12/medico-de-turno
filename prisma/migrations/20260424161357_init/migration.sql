-- CreateTable
CREATE TABLE "Operador" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre_completo" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "CatalogoMedico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "municipio_unidad" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ReportePadre" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operador_id" INTEGER NOT NULL,
    CONSTRAINT "ReportePadre_operador_id_fkey" FOREIGN KEY ("operador_id") REFERENCES "Operador" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReporteDetalle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reporte_id" INTEGER NOT NULL,
    "medico_id" INTEGER NOT NULL,
    CONSTRAINT "ReporteDetalle_reporte_id_fkey" FOREIGN KEY ("reporte_id") REFERENCES "ReportePadre" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReporteDetalle_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "CatalogoMedico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Operador_usuario_key" ON "Operador"("usuario");
