import fs from 'fs';
import bcrypt from 'bcryptjs';
import { AUDITED_JOBS } from '../src/constants/auditedJobs.js';
import { DEFAULT_SETTINGS } from '../src/constants/defaultData.js';

function escapeSqlStr(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return "'" + str.replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
}

function escapeSqlJson(obj: any): string {
  if (obj === null || obj === undefined) return 'NULL';
  return escapeSqlStr(JSON.stringify(obj));
}

let sql = `-- JobsHubOfficial Hostinger MySQL Database Schema & Seed Data
-- Import this SQL file into your Hostinger phpMyAdmin database.

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  full_name VARCHAR(128) NOT NULL,
  email VARCHAR(128) NOT NULL UNIQUE,
  cnic VARCHAR(32) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(16) DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS jobs (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  department VARCHAR(255) DEFAULT '',
  organization VARCHAR(255) DEFAULT '',
  company_name VARCHAR(255) DEFAULT '',
  company_logo TEXT,
  category VARCHAR(128) DEFAULT 'Government Jobs',
  country VARCHAR(64) DEFAULT 'Pakistan',
  employment_type VARCHAR(64) DEFAULT 'Full-time',
  min_qualification VARCHAR(64) DEFAULT 'Primary',
  qualification_required VARCHAR(255) DEFAULT '',
  medical_qualification VARCHAR(255) DEFAULT '',
  experience_required VARCHAR(255) DEFAULT '',
  job_type VARCHAR(64) DEFAULT 'Full-time',
  age_limit VARCHAR(64) DEFAULT '18 - 45 Years',
  vacancies INT DEFAULT 10,
  location VARCHAR(255) DEFAULT 'Remote / Anywhere in Pakistan',
  salary_range VARCHAR(128) DEFAULT 'Market Competitive',
  deadline VARCHAR(32) DEFAULT '2026-12-31',
  description TEXT,
  responsibilities TEXT,
  requirements TEXT,
  required_skills JSON,
  application_method VARCHAR(64) DEFAULT 'online',
  application_url TEXT,
  posted_date VARCHAR(32) DEFAULT '',
  status VARCHAR(32) DEFAULT 'published',
  campaigns JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS applications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NULL,
  reference_no VARCHAR(64) NOT NULL UNIQUE,
  full_name VARCHAR(128) NOT NULL,
  father_name VARCHAR(128) NOT NULL,
  cnic VARCHAR(32) NOT NULL,
  email VARCHAR(128) NOT NULL,
  mobile VARCHAR(32) NOT NULL,
  qualification VARCHAR(128) NOT NULL,
  address TEXT NOT NULL,
  postal_code VARCHAR(32) NOT NULL,
  job_position VARCHAR(255) NOT NULL,
  job_id VARCHAR(64) NULL,
  cnic_front_url TEXT NOT NULL,
  cnic_back_url TEXT NOT NULL,
  payment_screenshot_url TEXT NULL,
  payment_method VARCHAR(32) NULL,
  payment_txn_id VARCHAR(128) NULL,
  status VARCHAR(64) DEFAULT 'Payment Pending',
  rejection_reason TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(64) PRIMARY KEY,
  setting_value JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Admin User (username: umar, pass: Sho2026@)
`;

const adminPassHash = bcrypt.hashSync('Sho2026@', bcrypt.genSaltSync(10));
sql += `INSERT INTO admin_users (id, username, password_hash) VALUES ('admin-1', 'umar', ${escapeSqlStr(adminPassHash)}) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);\n\n`;

// Seed System Settings
sql += `-- Seed System Settings\n`;
sql += `INSERT INTO settings (setting_key, setting_value) VALUES ('app_settings', ${escapeSqlJson(DEFAULT_SETTINGS)}) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);\n\n`;

// Seed Jobs
sql += `-- Seed Job Vacancies (${AUDITED_JOBS.length} positions)\n`;
for (const j of AUDITED_JOBS) {
  const deptVal = j.companyName || j.department || 'General';
  sql += `INSERT INTO jobs (
    id, title, department, organization, company_name, company_logo, category, country,
    employment_type, min_qualification, qualification_required, medical_qualification,
    experience_required, job_type, age_limit, vacancies, location, salary_range, deadline,
    description, responsibilities, requirements, required_skills, application_method,
    application_url, posted_date, status, campaigns
  ) VALUES (
    ${escapeSqlStr(j.id)},
    ${escapeSqlStr(j.title)},
    ${escapeSqlStr(deptVal)},
    ${escapeSqlStr(j.organization || deptVal)},
    ${escapeSqlStr(deptVal)},
    ${escapeSqlStr(j.companyLogo || '')},
    ${escapeSqlStr(j.category || 'Government Jobs')},
    ${escapeSqlStr(j.country || 'Pakistan')},
    ${escapeSqlStr(j.employmentType || j.jobType || 'Full-time')},
    ${escapeSqlStr(j.minQualification || 'Primary')},
    ${escapeSqlStr(j.qualificationRequired || (j.minQualification + ' or Higher'))},
    ${escapeSqlStr(j.medicalQualification || '')},
    ${escapeSqlStr(j.experienceRequired || 'Fresh / Not Required')},
    ${escapeSqlStr(j.jobType || j.employmentType || 'Full-time')},
    ${escapeSqlStr(j.ageLimit || '18 - 45 Years')},
    ${j.vacancies || 10},
    ${escapeSqlStr(j.location || 'Remote / Anywhere in Pakistan')},
    ${escapeSqlStr(j.salaryRange || 'Market Competitive')},
    ${escapeSqlStr(j.deadline || '2026-12-31')},
    ${escapeSqlStr(j.description || '')},
    ${escapeSqlStr(j.responsibilities || '')},
    ${escapeSqlStr(j.requirements || '')},
    ${escapeSqlJson(j.requiredSkills || [])},
    ${escapeSqlStr(j.applicationMethod || 'online')},
    ${escapeSqlStr(j.applicationUrl || '')},
    ${escapeSqlStr(j.postedDate || '2026-01-01')},
    ${escapeSqlStr(j.status || 'published')},
    ${escapeSqlJson(j.campaigns || [])}
  ) ON DUPLICATE KEY UPDATE
    title=VALUES(title), department=VALUES(department), category=VALUES(category),
    min_qualification=VALUES(min_qualification), qualification_required=VALUES(qualification_required),
    vacancies=VALUES(vacancies), location=VALUES(location), salary_range=VALUES(salary_range),
    deadline=VALUES(deadline), description=VALUES(description), status=VALUES(status), campaigns=VALUES(campaigns);\n`;
}

sql += `\nSET FOREIGN_KEY_CHECKS = 1;\n`;

fs.writeFileSync('./database.sql', sql, 'utf-8');
if (fs.existsSync('./dist')) {
  fs.writeFileSync('./dist/database.sql', sql, 'utf-8');
}

console.log('[generate_sql] Successfully generated database.sql with schema and seed data!');
