import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db');
const BACKUP_DIR = path.join(process.cwd(), 'backups');

async function restore() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.error('❌ Error: No existe la carpeta de respaldos.');
    return;
  }

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.db'))
    .sort((a, b) => fs.statSync(path.join(BACKUP_DIR, b)).mtime.getTime() - fs.statSync(path.join(BACKUP_DIR, a)).mtime.getTime());

  if (files.length === 0) {
    console.error('❌ Error: No se encontraron archivos de respaldo.');
    return;
  }

  const latestBackup = path.join(BACKUP_DIR, files[0]);

  try {
    // Importante: El servidor debe estar apagado para evitar bloqueos en Windows
    fs.copyFileSync(latestBackup, DB_PATH);
    console.log(`✅ Base de datos restaurada exitosamente desde: ${files[0]}`);
  } catch (error) {
    console.error('❌ Error al restaurar:', error);
  }
}

restore();
