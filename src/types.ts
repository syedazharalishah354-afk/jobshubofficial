export type ApplicationStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Preliminary Approved'
  | 'Auto-Approved'
  | 'Auto-Approved / Preliminary Approval'
  | 'Shortlisted'
  | 'Rejected'
  | 'Selected'
  | 'Final Verification Required'
  | 'Information Incomplete'
  | 'Payment Pending'
  | 'Payment Verification Pending'
  | 'Payment Rejected'
  | 'Payment Approved'
  | 'Submitted Successfully';

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  cnic: string;
  passwordHash: string;
  createdAt: string;
  role: 'user';
}

export interface Application {
  id: string;
  userId?: string | null;
  referenceNo: string;
  rollNumber?: string;
  fullName: string;
  candidateName?: string;
  fatherName: string;
  cnic: string;
  dob?: string;
  gender?: string;
  mobile: string;
  mobileNumber?: string;
  whatsapp?: string;
  email: string;
  address: string;
  city?: string;
  postalCode?: string;
  qualification: string;
  experience?: string;
  skills?: string;
  jobPosition: string;
  jobTitle?: string;
  jobCategory?: string;
  jobId?: string | null;
  cnicFrontUrl: string;
  cnicBackUrl: string;
  passportPhotoUrl?: string | null;
  educationCertUrl?: string | null;
  experienceCertUrl?: string | null;
  resumeUrl?: string | null;
  otherDocUrl?: string | null;
  processingCompleted?: boolean;
  paymentScreenshotUrl?: string | null;
  paymentScreenshot?: string | null;
  paymentMethod?: 'JazzCash' | 'Easypaisa' | null;
  paymentTxnId?: string | null;
  transactionId?: string | null;
  paymentStatus?: string | null;
  status: ApplicationStatus;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodConfig {
  accountTitle: string;
  accountNumber: string;
  instructions: string;
}

export interface SystemSettings {
  applicationFee: number;
  whatsappNumber?: string;
  jazzcash: PaymentMethodConfig;
  easypaisa: PaymentMethodConfig;
  interviewPolicy?: string;
}

export interface JobPosition {
  id: string;
  title: string;
  department: string;
  organization?: string;
  companyName?: string;
  companyLogo?: string;
  category?: string;
  country?: string;
  employmentType?: string;
  minQualification: string;
  qualificationRequired: string;
  qualification?: string;
  medicalQualification?: string;
  experienceRequired?: string;
  experience?: string;
  jobType?: string;
  ageLimit?: string;
  vacancies: number;
  location: string;
  salaryRange: string;
  deadline: string;
  description: string;
  responsibilities?: string;
  requirements?: string;
  requiredSkills?: string[];
  applicationMethod?: string;
  applicationUrl?: string;
  postedDate?: string;
  status?: 'active' | 'closed' | 'published' | 'unpublished' | 'draft';
  campaigns?: string[];
  unlocked?: boolean;
}

export interface ApplicationStats {
  totalUsers: number;
  totalJobs: number;
  publishedJobs?: number;
  unpublishedJobs?: number;
  govtJobs?: number;
  privateJobs?: number;
  factoryJobs?: number;
  freelancerJobs?: number;
  otherCategoryJobs?: number;
  totalApplications: number;
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
  submittedSuccessfully: number;
}

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
}
