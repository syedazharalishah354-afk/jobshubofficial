import fs from 'fs';

const auditedJobs = JSON.parse(fs.readFileSync('./scripts/audit_output.json', 'utf-8'));

console.log('Writing audited jobs to src/constants/auditedJobs.ts...');

const fileContent = `import { JobPosition } from '../types.js';

export const AUDITED_JOBS: JobPosition[] = ${JSON.stringify(auditedJobs, null, 2)};
`;

fs.writeFileSync('./src/constants/auditedJobs.ts', fileContent, 'utf-8');
fs.writeFileSync('./public/jobs.json', JSON.stringify(auditedJobs, null, 2), 'utf-8');

console.log(`Successfully written ${auditedJobs.length} audited jobs to src/constants/auditedJobs.ts and public/jobs.json`);
