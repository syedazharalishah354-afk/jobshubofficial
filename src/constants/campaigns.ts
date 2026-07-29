export interface CampaignConfig {
  id: string;
  name: string;
  slug: string;
  description: string;
  heroTitle: string;
  heroSubtitle: string;
  badgeText: string;
  icon: string;
  categories: string[];
  isActive: boolean;
}

export const JOB_CAMPAIGNS: CampaignConfig[] = [
  {
    id: 'camp-freelancers',
    name: 'Freelancers',
    slug: 'freelancers',
    description: 'Work from home and remote freelance jobs across Pakistan.',
    heroTitle: 'Remote & Freelance Job Opportunities',
    heroSubtitle: 'Apply for verified online, typing, data entry, and remote projects with guaranteed payout options.',
    badgeText: 'Freelance & Work From Home',
    icon: '💼',
    categories: [
      'Data Entry & Typing',
      'Content Writing & SEO',
      'Graphic Design & Multimedia',
      'Web & Software Development',
      'Virtual Assistance & Admin Support',
      'Customer Support & Chat',
      'Digital Marketing & Social Media'
    ],
    isActive: true
  },
  {
    id: 'camp-suthra-punjab',
    name: 'Suthra Punjab',
    slug: 'suthra-punjab',
    description: 'Official recruitment portal for Suthra Punjab Project & allied roles.',
    heroTitle: 'Suthra Punjab Job Recruitment Portal',
    heroSubtitle: 'Official portal for Suthra Punjab field assistants, office coordinators, data entry staff, and supervisory posts.',
    badgeText: 'Suthra Punjab Project 2026',
    icon: '🧹',
    categories: [
      'Cleaner & Sweeper',
      'Sanitary Worker',
      'Supervisor & Inspector',
      'Foreman & Coordinator',
      'Field Staff',
      'Other Suthra Punjab Jobs'
    ],
    isActive: true
  },
  {
    id: 'camp-factory-workers',
    name: 'Factory Workers',
    slug: 'factory-workers',
    description: 'Industrial, store assistant, packaging, and logistics roles.',
    heroTitle: 'Factory & Industrial Staff Jobs',
    heroSubtitle: 'Apply for verified factory, inventory store, packaging, assembly, and industrial unit job vacancies.',
    badgeText: 'Factory & Industrial Recruitment',
    icon: '🏭',
    categories: [
      'Security',
      'Factory Workers',
      'Loading / Unloading',
      'Cleaning',
      'Driving',
      'Bike Delivery',
      'Machine Operators',
      'Supervisors',
      'Other Factory Jobs'
    ],
    isActive: true
  },
  {
    id: 'camp-government',
    name: 'Government Jobs',
    slug: 'government',
    description: 'Public sector & government department project jobs.',
    heroTitle: 'Government Department Project Recruitment',
    heroSubtitle: 'Official application portal for public sector IT, administration, research, healthcare, and support staff vacancies.',
    badgeText: 'Government Sector Jobs',
    icon: '🏛️',
    categories: [
      'Pakistan Army',
      'Pakistan Navy',
      'Pakistan Air Force',
      'Police',
      'Pakistan Rangers',
      'Frontier Corps / FC',
      'Pakistan Coast Guards',
      'ASF / Airport Security Force',
      'Airports / Civil Aviation',
      'Dolphin Police',
      'Rescue Services',
      'Government Hospitals & Healthcare',
      'Government Technical & Skilled Jobs',
      'Other Government Departments'
    ],
    isActive: true
  },
  {
    id: 'camp-private',
    name: 'Private Jobs',
    slug: 'private',
    description: 'Private sector corporate, agency, software house, medical stores, and store jobs.',
    heroTitle: 'Private Sector & Corporate Job Opportunities',
    heroSubtitle: 'Apply for corporate offices, software houses, private hospitals, medical stores, and private business roles.',
    badgeText: 'Private Sector Jobs',
    icon: '🏢',
    categories: [
      'Banking & Finance',
      'Office & Administration',
      'Sales & Marketing',
      'Customer Service',
      'Driving & Delivery',
      'Cleaning & Support',
      'Retail & Store',
      'Technical & Skilled Jobs',
      'Medical Stores & Pharmacy',
      'Private Hospitals & Clinics',
      'Factory & Industrial',
      'Hotels & Restaurants',
      'Schools & Education',
      'Other Private Sector Jobs'
    ],
    isActive: true
  }
];

export function getCampaignBySlug(slug: string): CampaignConfig | undefined {
  if (!slug) return undefined;
  const cleanSlug = slug.toLowerCase().trim().replace(/^\/jobs\//, '').replace(/^#\/jobs\//, '');
  return JOB_CAMPAIGNS.find(c => c.slug === cleanSlug);
}

export function getCampaignUrl(slug: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/jobs/${slug}`;
}
