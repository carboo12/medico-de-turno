import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db');
const BACKUP_DIR = path.join(process.cwd(), 'backups');

async function backup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `respaldo_${timestamp}.db`);

  try {
    if (!fs.existsSync(DB_PATH)) {
      console.error('Error: No se encontró la base de datos en', DB_PATH);
      return;
    }

    fs.copyFileSync(DB_PATH, backupPath);
    console.log('✅ Respaldo creado exitosamente en:');
    console.log(backupPath);
  } catch (error) {
    console.error('❌ Error al crear el respaldo:', error);
  }
}

backup();
