export const QUALIFICATION_CATEGORIES = [
  'No Formal Education',
  'Primary',
  'Middle',
  'Matric',
  'Intermediate',
  'Diploma',
  'Bachelor',
  'Master',
  'MPhil',
  'PhD'
] as const;

export type QualificationLevel = typeof QUALIFICATION_CATEGORIES[number];

/**
 * Returns numeric rank for a user's selected education level:
 * 1: No Formal Education
 * 2: Primary
 * 3: Middle
 * 4: Matric
 * 5: Intermediate
 * 6: Diploma
 * 7: Bachelor
 * 8: Master
 * 9: MPhil
 * 10: PhD
 */
export function getQualificationRank(qual: string): number {
  if (!qual) return 1;
  const q = qual.trim().toLowerCase();

  if (q.includes('phd') || q.includes('doctorate') || q.includes('ph.d')) return 10;
  if (q.includes('mphil') || q.includes('m.phil') || q.includes('m-phil')) return 9;
  if (q.includes('master') || q.includes('msc') || q.includes('m.sc') || q.includes('m.com') || q.includes('mcom') || q.includes('mba') || /\bma\b/.test(q)) return 8;
  if (q.includes('bachelor') || q.includes('bsc') || q.includes('b.sc') || q.includes('graduation') || q.includes('graduate') || /\bba\b/.test(q) || /\bbs\b/.test(q)) return 7;
  if (q.includes('diploma') || q.includes('dae')) return 6;
  if (q.includes('intermediate') || q.includes('inter') || q.includes('hssc') || q.includes('12th') || q.includes('fsc') || q.includes('ics') || q.includes('i.com') || /\bfa\b/.test(q)) return 5;
  if (q.includes('matric') || q.includes('ssc') || q.includes('10th')) return 4;
  if (q.includes('middle') || q.includes('8th')) return 3;
  if (q.includes('primary') || q.includes('5th')) return 2;
  if (q.includes('no formal') || q.includes('uneducated') || q.includes('illiterate') || q.includes('none') || q.includes('not specified')) return 1;

  return 1;
}

/**
 * Returns minimum qualification rank required for a job.
 * Evaluates the lowest qualification requirement specified in string.
 */
export function getMinQualificationRank(minQual: string): number {
  if (!minQual) return 1;
  const q = minQual.trim().toLowerCase();

  if (q.includes('no formal') || q.includes('uneducated') || q.includes('illiterate') || q.includes('none') || q.includes('not specified') || q.includes('illiterate or literate')) return 1;
  if (q.includes('primary') || q.includes('5th')) return 2;
  if (q.includes('middle') || q.includes('8th')) return 3;
  if (q.includes('matric') || q.includes('ssc') || q.includes('10th')) return 4;
  if (q.includes('intermediate') || q.includes('inter') || q.includes('hssc') || q.includes('12th') || q.includes('fsc') || q.includes('ics') || q.includes('i.com') || /\bfa\b/.test(q)) return 5;
  if (q.includes('diploma') || q.includes('dae')) return 6;
  if (q.includes('bachelor') || q.includes('bsc') || q.includes('graduation') || q.includes('graduate') || /\bba\b/.test(q) || /\bbs\b/.test(q)) return 7;
  if (q.includes('master') || q.includes('msc') || q.includes('mba') || q.includes('mcom') || /\bma\b/.test(q)) return 8;
  if (q.includes('mphil') || q.includes('m.phil') || q.includes('m-phil')) return 9;
  if (q.includes('phd') || q.includes('doctorate') || q.includes('ph.d')) return 10;

  return 1;
}

/**
 * Determines whether a job is unlocked for a given user qualification.
 * Formula: USER EDUCATION LEVEL >= JOB MINIMUM EDUCATION LEVEL
 */
export function isJobUnlocked(userQual: string, jobMinQual: string, _jobCategory?: string): boolean {
  const userRank = getQualificationRank(userQual);
  const jobMinRank = getMinQualificationRank(jobMinQual);
  return userRank >= jobMinRank;
}

/**
 * Returns summary message based on qualification level
 */
export function getQualificationUnlockMessage(userQual: string): {
  message: string;
  unlockedCount: number;
  badgeType: 'primary' | 'matric' | 'intermediate';
} {
  const rank = getQualificationRank(userQual);
  if (rank === 1) {
    return {
      message: "Filter active: Showing entry-level jobs requiring No Formal Education.",
      unlockedCount: 0,
      badgeType: 'primary'
    };
  }
  if (rank === 2) {
    return {
      message: "Filter active: Showing jobs requiring Primary or lower education level.",
      unlockedCount: 0,
      badgeType: 'primary'
    };
  }
  if (rank === 3) {
    return {
      message: "Filter active: Showing jobs requiring Middle, Primary or No Formal Education.",
      unlockedCount: 0,
      badgeType: 'primary'
    };
  }
  if (rank === 4) {
    return {
      message: "Filter active: Showing jobs requiring up to Matric qualification level.",
      unlockedCount: 0,
      badgeType: 'matric'
    };
  }
  if (rank === 5 || rank === 6) {
    return {
      message: "Filter active: Showing jobs requiring up to Intermediate & Diploma level.",
      unlockedCount: 0,
      badgeType: 'intermediate'
    };
  }
  return {
    message: "Filter active: Showing higher education jobs (Bachelor, Master, MPhil & PhD level).",
    unlockedCount: 0,
    badgeType: 'intermediate'
  };
}

