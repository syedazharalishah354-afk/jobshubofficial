import { DEFAULT_JOBS } from '../src/constants/defaultData.ts';
import fs from 'fs';

const ALLOWED_CATEGORIES = [
  'Government Jobs',
  'Private Jobs',
  'Factory Worker',
  'Freelancer',
  'Teaching',
  'Healthcare',
  'IT & Software',
  'Sales & Marketing',
  'Driver',
  'Security',
  'Office Jobs',
  'Other'
];

const VALID_QUALIFICATIONS = [
  'No Formal Education',
  'Primary',
  'Middle',
  'Matric',
  'Intermediate',
  'Diploma',
  'Bachelor',
  'Master',
  'MPhil',
  'PhD',
  'Not Specified'
];

function determineCategory(job: any): string {
  const title = (job.title || '').trim();
  const lowerTitle = title.toLowerCase();
  const org = (job.organization || '').trim().toLowerCase();
  const dept = (job.department || '').trim().toLowerCase();
  const cat = (job.category || '').trim().toLowerCase();
  const jobType = (job.jobType || '').trim().toLowerCase();
  const desc = (job.description || '').trim().toLowerCase();

  // 1. GOVERNMENT JOBS (First priority for public-sector and BPS roles)
  const isGovtOrg =
    org.includes('pakistan army') || org.includes('pakistan navy') || org.includes('pakistan air force') ||
    org.includes('pakistan police') || org.includes('pakistan rangers') || org.includes('frontier corps') ||
    org.includes('airport security force') || org.includes('rescue 1122') || org.includes('civil aviation authority') ||
    org.includes('dolphin police') || org.includes('fpsc') || org.includes('ppsc') || org.includes('spsc') || org.includes('bpsc') || org.includes('kppsc') ||
    org.includes('nadra') || org.includes('fbr') || org.includes('nab') || org.includes('anf') || org.includes('fia') ||
    org.includes('excise') || org.includes('board of revenue') || org.includes('punjab food authority') ||
    org.includes('district headquarter hospital') || org.includes('primary & secondary healthcare dept') ||
    org.includes('department of health') || org.includes('public works department') || org.includes('suthra punjab') ||
    org.includes('ministry') || org.includes('department of') || org.includes('government') || org.includes('govt');

  const isGovtDept =
    dept.includes('bps-') || dept.includes('bps ') || dept.includes('government') || dept.includes('govt') ||
    dept.includes('armed forces') || dept.includes('police') || dept.includes('public sector');

  const isGovtTitle =
    lowerTitle.includes('(bps-') || lowerTitle.includes('(bps ') || lowerTitle.includes('commissioner') ||
    lowerTitle.includes('inspector') || lowerTitle.includes('sub inspector') || lowerTitle.includes('constable') ||
    lowerTitle.includes('asi (bps') || lowerTitle.includes('naib qasid (bps') || lowerTitle.includes('patwari');

  const isGovtCat =
    cat.includes('govt') || cat.includes('government') || cat.includes('police') || cat.includes('army') ||
    cat.includes('navy') || cat.includes('air force') || cat.includes('rangers') || cat.includes('frontier corps') ||
    cat.includes('rescue 1122') || cat.includes('airport security force') || cat.includes('civil aviation');

  if (isGovtOrg || isGovtDept || isGovtTitle || isGovtCat) {
    return 'Government Jobs';
  }

  // 2. TEACHING
  if (
    cat.includes('teach') || cat.includes('education') ||
    lowerTitle.includes('teacher') || lowerTitle.includes('lecturer') || lowerTitle.includes('professor') ||
    lowerTitle.includes('montessori') || lowerTitle.includes('educator') || lowerTitle.includes('tutor') ||
    lowerTitle.includes('instructor') || lowerTitle.includes('principal') || lowerTitle.includes('headmaster')
  ) {
    return 'Teaching';
  }

  // 3. HEALTHCARE
  if (
    cat.includes('health') || cat.includes('nursing') || cat.includes('pharmacy') || cat.includes('hospital') ||
    lowerTitle.includes('doctor') || lowerTitle.includes('nurse') || lowerTitle.includes('pharmacist') ||
    lowerTitle.includes('medical officer') || lowerTitle.includes('physician') || lowerTitle.includes('surgeon') ||
    lowerTitle.includes('radiographer') || lowerTitle.includes('ultrasound') || lowerTitle.includes('dental assistant') ||
    lowerTitle.includes('emt') || lowerTitle.includes('lab technician') || lowerTitle.includes('paramedic') ||
    lowerTitle.includes('dispenser')
  ) {
    return 'Healthcare';
  }

  // 4. FREELANCER (Strict requirement: Title MUST explicitly contain 'freelance' or 'freelancer', or be genuine independent contract work)
  if (
    lowerTitle.includes('freelance') ||
    lowerTitle.includes('freelancer')
  ) {
    return 'Freelancer';
  }

  // 5. IT & SOFTWARE
  if (
    lowerTitle.includes('developer') || lowerTitle.includes('software') || lowerTitle.includes('programmer') ||
    lowerTitle.includes('devops') || lowerTitle.includes('cyber security') || lowerTitle.includes('node.js') ||
    lowerTitle.includes('react') || lowerTitle.includes('flutter') || lowerTitle.includes('python') ||
    lowerTitle.includes('full stack') || lowerTitle.includes('frontend') || lowerTitle.includes('backend') ||
    lowerTitle.includes('database administrator') || lowerTitle.includes('system admin') || lowerTitle.includes('ui/ux') ||
    lowerTitle.includes('wordpress') || lowerTitle.includes('webmaster')
  ) {
    return 'IT & Software';
  }

  // 6. SALES & MARKETING
  if (
    lowerTitle.includes('sales') || lowerTitle.includes('marketing') || lowerTitle.includes('seo') ||
    lowerTitle.includes('telesales') || lowerTitle.includes('cold caller') || lowerTitle.includes('ads manager') ||
    lowerTitle.includes('brand ambassador') || lowerTitle.includes('business development') || lowerTitle.includes('social media')
  ) {
    return 'Sales & Marketing';
  }

  // 7. DRIVER
  if (
    lowerTitle.includes('driver') || lowerTitle.includes('rider') || lowerTitle.includes('courier') ||
    lowerTitle.includes('van delivery') || lowerTitle.includes('ambulance driver') || lowerTitle.includes('chauffeur')
  ) {
    return 'Driver';
  }

  // 8. SECURITY
  if (
    lowerTitle.includes('security guard') || lowerTitle.includes('watchman') || lowerTitle.includes('security supervisor') ||
    lowerTitle.includes('bouncer')
  ) {
    return 'Security';
  }

  // 9. OFFICE JOBS
  if (
    lowerTitle.includes('data entry') || lowerTitle.includes('typing') || lowerTitle.includes('form filling') ||
    lowerTitle.includes('receptionist') || lowerTitle.includes('clerk') || lowerTitle.includes('bookkeeper') ||
    lowerTitle.includes('accounts') || lowerTitle.includes('accountant') || lowerTitle.includes('call center') ||
    lowerTitle.includes('chat support') || lowerTitle.includes('customer support') || lowerTitle.includes('hr executive') ||
    lowerTitle.includes('admin officer') || lowerTitle.includes('content writer') || lowerTitle.includes('copywriter') ||
    lowerTitle.includes('virtual assistant') || lowerTitle.includes('office assistant') || lowerTitle.includes('computer operator') ||
    lowerTitle.includes('store keeper') || lowerTitle.includes('office boy') || lowerTitle.includes('product listing') ||
    lowerTitle.includes('survey') || lowerTitle.includes('e-commerce store assistant') || lowerTitle.includes('upload assistant') ||
    lowerTitle.includes('voice over') || lowerTitle.includes('graphic design assistant') || lowerTitle.includes('video editing assistant') ||
    lowerTitle.includes('cashier')
  ) {
    return 'Office Jobs';
  }

  // 10. FACTORY WORKER
  if (
    lowerTitle.includes('operator') || lowerTitle.includes('welder') || lowerTitle.includes('pipefitter') ||
    lowerTitle.includes('fabricator') || lowerTitle.includes('looms') || lowerTitle.includes('spinner') ||
    lowerTitle.includes('doffer') || lowerTitle.includes('packing staff') || lowerTitle.includes('forklift') ||
    lowerTitle.includes('factory worker') || lowerTitle.includes('mason') || lowerTitle.includes('carpenter') ||
    lowerTitle.includes('lathe operator') || lowerTitle.includes('sweeper') || lowerTitle.includes('janitor') ||
    lowerTitle.includes('cleaner') || lowerTitle.includes('sanitary worker') || lowerTitle.includes('helper') ||
    lowerTitle.includes('assembly worker') || lowerTitle.includes('maintenance technician') || lowerTitle.includes('field worker')
  ) {
    return 'Factory Worker';
  }

  // 11. PRIVATE JOBS
  return 'Private Jobs';
}

// Perform Audit
console.log('--- RUNNING AUDIT & CLEANUP ---');

const seenUniqueKeys = new Map<string, any>();
const duplicates: any[] = [];
const cleanedJobs: any[] = [];

DEFAULT_JOBS.forEach((job) => {
  // Normalize title, company, location for strict duplicate check
  const titleNorm = job.title.trim().toLowerCase();
  const orgNorm = (job.organization || '').trim().toLowerCase();
  const locNorm = (job.location || '').trim().toLowerCase();
  const key = `${titleNorm}|${orgNorm}|${locNorm}`;

  if (seenUniqueKeys.has(key)) {
    duplicates.push(job);
  } else {
    seenUniqueKeys.set(key, job);

    // Audit category
    const correctedCategory = determineCategory(job);

    // Audit qualification
    let qual = job.minQualification || 'Not Specified';
    if (!VALID_QUALIFICATIONS.includes(qual)) {
      if (qual.toLowerCase().includes('matric')) qual = 'Matric';
      else if (qual.toLowerCase().includes('inter')) qual = 'Intermediate';
      else if (qual.toLowerCase().includes('bachelor') || qual.toLowerCase().includes('bs')) qual = 'Bachelor';
      else if (qual.toLowerCase().includes('master')) qual = 'Master';
      else if (qual.toLowerCase().includes('middle')) qual = 'Middle';
      else if (qual.toLowerCase().includes('primary')) qual = 'Primary';
      else qual = 'Not Specified';
    }

    cleanedJobs.push({
      ...job,
      category: correctedCategory,
      minQualification: qual
    });
  }
});

// Category counts breakdown
const categoryCounts: Record<string, number> = {};
ALLOWED_CATEGORIES.forEach(c => categoryCounts[c] = 0);
cleanedJobs.forEach(j => {
  categoryCounts[j.category] = (categoryCounts[j.category] || 0) + 1;
});

console.log('\n--- FINAL AUDIT SUMMARY ---');
console.log('Total Jobs Found:', DEFAULT_JOBS.length);
console.log('Duplicate Jobs Detected:', duplicates.length);
console.log('Total Clean Unique Jobs:', cleanedJobs.length);
console.log('\nBreakdown by Category:');
Object.entries(categoryCounts).forEach(([cat, count]) => {
  console.log(` - ${cat}: ${count} jobs`);
});

fs.writeFileSync('./scripts/audit_output.json', JSON.stringify(cleanedJobs, null, 2), 'utf-8');
