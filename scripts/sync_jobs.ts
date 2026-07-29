import fs from 'fs';
import path from 'path';
import { AUDITED_JOBS } from '../src/constants/auditedJobs.js';

console.log(`[sync_jobs] Synchronizing ${AUDITED_JOBS.length} jobs to static JSON files and database...`);

// Ensure public directory exists
if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

// Write to public/jobs.json
fs.writeFileSync('./public/jobs.json', JSON.stringify(AUDITED_JOBS, null, 2), 'utf-8');

// Write to data/db.json if data directory exists or create it
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data', { recursive: true });
}

let dbContent: any = { jobs: AUDITED_JOBS, settings: {} };
if (fs.existsSync('./data/db.json')) {
  try {
    const existing = JSON.parse(fs.readFileSync('./data/db.json', 'utf-8'));
    dbContent = { ...existing, jobs: AUDITED_JOBS };
  } catch (err) {
    console.warn('[sync_jobs] Could not parse existing db.json, replacing with fresh jobs data.');
  }
}
fs.writeFileSync('./data/db.json', JSON.stringify(dbContent, null, 2), 'utf-8');

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads', { recursive: true });
}

// If dist directory exists, copy assets, .htaccess, database.sql, uploads
if (fs.existsSync('./dist')) {
  fs.writeFileSync('./dist/jobs.json', JSON.stringify(AUDITED_JOBS, null, 2), 'utf-8');
  if (fs.existsSync('./public/api')) {
    if (!fs.existsSync('./dist/api')) {
      fs.mkdirSync('./dist/api', { recursive: true });
    }
    const apiFiles = fs.readdirSync('./public/api');
    for (const f of apiFiles) {
      fs.copyFileSync(`./public/api/${f}`, `./dist/api/${f}`);
    }
  }
  if (fs.existsSync('./public/.htaccess')) {
    fs.copyFileSync('./public/.htaccess', './dist/.htaccess');
  }
  if (fs.existsSync('./database.sql')) {
    fs.copyFileSync('./database.sql', './dist/database.sql');
  }
  if (!fs.existsSync('./dist/uploads')) {
    fs.mkdirSync('./dist/uploads', { recursive: true });
  }
}

console.log('[sync_jobs] Synchronization complete!');
