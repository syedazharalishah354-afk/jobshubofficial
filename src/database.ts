import { JobPosition, SystemSettings } from './types.js';
import { DEFAULT_JOBS, DEFAULT_SETTINGS, DEFAULT_INTERVIEW_POLICY } from './constants/defaultData.js';

/**
 * Scalable, persistent, and structured database export containing 325+ unique job positions.
 */
export const ALL_JOBS: JobPosition[] = DEFAULT_JOBS;
export const TOTAL_JOBS_COUNT: number = ALL_JOBS.length;

// Pre-indexed map for fast O(1) job lookup by ID
const JOB_BY_ID_MAP = new Map<string, JobPosition>(ALL_JOBS.map(job => [job.id, job]));

/**
 * Retrieve a specific job position by unique ID
 */
export function getJobById(id: string): JobPosition | undefined {
  return JOB_BY_ID_MAP.get(id);
}

/**
 * Retrieve jobs filtered by category
 */
export function getJobsByCategory(category: string): JobPosition[] {
  if (!category || category.toLowerCase() === 'all') return ALL_JOBS;
  return ALL_JOBS.filter(job => job.category === category);
}

/**
 * Retrieve jobs filtered by location
 */
export function getJobsByLocation(location: string): JobPosition[] {
  if (!location || location.toLowerCase() === 'all') return ALL_JOBS;
  return ALL_JOBS.filter(job => job.location === location);
}

/**
 * Retrieve jobs filtered by minimum qualification requirement
 */
export function getJobsByQualification(minQualification: string): JobPosition[] {
  if (!minQualification || minQualification.toLowerCase() === 'all') return ALL_JOBS;
  return ALL_JOBS.filter(job => job.minQualification === minQualification);
}

/**
 * Search jobs across titles, organizations, locations, categories, and required skills
 */
export function searchJobs(query: string): JobPosition[] {
  if (!query) return ALL_JOBS;
  const q = query.toLowerCase().trim();
  return ALL_JOBS.filter(j =>
    j.title.toLowerCase().includes(q) ||
    j.department.toLowerCase().includes(q) ||
    (j.organization && j.organization.toLowerCase().includes(q)) ||
    (j.location && j.location.toLowerCase().includes(q)) ||
    (j.category && j.category.toLowerCase().includes(q)) ||
    j.description.toLowerCase().includes(q) ||
    (j.requiredSkills && j.requiredSkills.some(s => s.toLowerCase().includes(q)))
  );
}

export { DEFAULT_JOBS, DEFAULT_SETTINGS, DEFAULT_INTERVIEW_POLICY };
