import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Application, SystemSettings, JobPosition, AdminUser, UserAccount } from '../types.js';
import { DEFAULT_JOBS, DEFAULT_SETTINGS, DEFAULT_INTERVIEW_POLICY } from '../constants/defaultData.js';

export { DEFAULT_JOBS, DEFAULT_SETTINGS, DEFAULT_INTERVIEW_POLICY };

export interface DBData {
  users: UserAccount[];
  applications: Application[];
  settings: SystemSettings;
  admin: AdminUser;
  jobs: JobPosition[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function initDB(): DBData {
  ensureDir(DATA_DIR);

  if (!fs.existsSync(DB_PATH)) {
    const salt = bcrypt.genSaltSync(10);
    const initialPasswordHash = bcrypt.hashSync('Sho2026@', salt);

    const initialData: DBData = {
      users: [],
      applications: [],
      settings: DEFAULT_SETTINGS,
      admin: {
        id: 'admin-1',
        username: 'umar',
        passwordHash: initialPasswordHash
      },
      jobs: DEFAULT_JOBS
    };

    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as DBData;
    // ensure missing keys or incomplete default jobs upgrade
    if (!parsed.users) parsed.users = [];
    if (!parsed.settings) parsed.settings = DEFAULT_SETTINGS;
    if (!parsed.settings.interviewPolicy) {
      parsed.settings.interviewPolicy = DEFAULT_INTERVIEW_POLICY;
      fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    if (!parsed.jobs || !Array.isArray(parsed.jobs) || parsed.jobs.length < 300 || parsed.jobs.some(j => !j || !j.id || !j.title || !j.minQualification)) {
      parsed.jobs = DEFAULT_JOBS;
      fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
    } else {
      // Sync job categories and qualifications from DEFAULT_JOBS for matching IDs
      const jobMap = new Map(DEFAULT_JOBS.map(j => [j.id, j]));
      let updated = false;
      parsed.jobs = parsed.jobs.map(j => {
        const canonical = jobMap.get(j.id);
        if (canonical && (canonical.category !== j.category || canonical.minQualification !== j.minQualification)) {
          updated = true;
          return { ...j, category: canonical.category, minQualification: canonical.minQualification };
        }
        return j;
      });
      if (updated) {
        fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
      }
    }
    if (!parsed.applications) parsed.applications = [];

    // Ensure admin credentials match umar / Sho2026@
    if (!parsed.admin || parsed.admin.username !== 'umar') {
      const salt = bcrypt.genSaltSync(10);
      parsed.admin = {
        id: 'admin-1',
        username: 'umar',
        passwordHash: bcrypt.hashSync('Sho2026@', salt)
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
    }

    return parsed;
  } catch (err) {
    console.error('Error reading DB, re-initializing', err);
    const salt = bcrypt.genSaltSync(10);
    const initialData: DBData = {
      users: [],
      applications: [],
      settings: DEFAULT_SETTINGS,
      admin: {
        id: 'admin-1',
        username: 'umar',
        passwordHash: bcrypt.hashSync('Sho2026@', salt)
      },
      jobs: DEFAULT_JOBS
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

export function saveDB(data: DBData): void {
  ensureDir(DATA_DIR);
  const tempPath = DB_PATH + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_PATH);
}

export function getDB(): DBData {
  return initDB();
}
