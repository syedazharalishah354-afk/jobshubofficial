import React, { useState, useEffect } from 'react';
import { SystemSettings, Application, ApplicationStats, JobPosition } from '../types';
import { QUALIFICATION_CATEGORIES, getMinQualificationRank, getQualificationRank } from '../utils/qualification';
import { JOB_CAMPAIGNS, getCampaignUrl } from '../constants/campaigns';
import {
  adminLogin,
  fetchAdminStats,
  fetchAdminApplications,
  verifyApplicationPayment,
  updateApplicationStatus,
  updateSystemSettings,
  changeAdminPassword,
  fetchJobs,
  fetchAdminJobs,
  createAdminJob,
  updateAdminJob,
  deleteAdminJob,
  togglePublishAdminJob,
  bulkPublishAdminJobs,
  bulkUnpublishAdminJobs,
  bulkDeleteAdminJobs
} from '../services/api';
import { validateWhatsAppNumber } from '../utils/whatsapp';
import {
  Lock,
  LogOut,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  MessageCircle,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  Settings,
  Key,
  DollarSign,
  Upload,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  X,
  Plus,
  Trash2,
  Edit3,
  Briefcase,
  GraduationCap,
  MapPin,
  Share2,
  Copy,
  Check,
  Building2,
  Globe,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Layers,
  Sparkles,
  Printer
} from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshConfig?: () => void;
  onViewSlip?: (app: Application) => void;
}

function getValidMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('blob:')) return '';
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) return trimmed;
  return `/${trimmed}`;
}

function isPdfOrDocFile(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.endsWith('.pdf') ||
         lower.endsWith('.doc') ||
         lower.endsWith('.docx') ||
         lower.includes('application/pdf') ||
         lower.includes('application/msword') ||
         lower.includes('application/vnd.openxmlformats');
}

interface DocPreviewCardProps {
  title: string;
  url: string | null | undefined;
  cnic?: string;
  filenamePrefix: string;
}

const DocPreviewCard: React.FC<DocPreviewCardProps> = ({ title, url, cnic, filenamePrefix }) => {
  const [imgError, setImgError] = useState(false);
  const cleanUrl = getValidMediaUrl(url);

  if (!cleanUrl) {
    return (
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center flex flex-col justify-between h-full min-h-[120px]">
        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{title}</span>
        <div className="my-auto py-2">
          <span className="text-slate-400 italic text-[10px]">Not Uploaded</span>
        </div>
      </div>
    );
  }

  const isDoc = isPdfOrDocFile(cleanUrl) || imgError;
  const fileName = `${filenamePrefix}_${cnic || 'Candidate'}.${isDoc ? 'pdf' : 'jpg'}`;

  return (
    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center flex flex-col justify-between h-full min-h-[120px]">
      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{title}</span>

      {!isDoc ? (
        <div className="space-y-1.5 my-auto">
          <img
            src={cleanUrl}
            alt={title}
            onError={() => setImgError(true)}
            className="h-20 w-full object-cover rounded border border-slate-300 bg-white"
          />
          <div className="flex flex-col gap-1">
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-600 font-bold block hover:underline"
            >
              View Full &rarr;
            </a>
            <a
              href={cleanUrl}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-slate-700 font-bold bg-slate-200 px-2 py-0.5 rounded hover:bg-slate-300 block transition-colors text-center"
            >
              Download 📥
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-2 my-auto p-2 bg-white rounded-lg border border-slate-200">
          <div className="flex items-center justify-center gap-1.5 text-blue-700">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-[10px] font-bold uppercase">Document File</span>
          </div>
          <div className="flex flex-col gap-1 pt-1">
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] bg-blue-600 text-white font-bold py-1 px-2 rounded hover:bg-blue-700 block transition-colors text-center"
            >
              View Document &rarr;
            </a>
            <a
              href={cleanUrl}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-slate-700 font-bold bg-slate-200 px-2 py-0.5 rounded hover:bg-slate-300 block transition-colors text-center"
            >
              Download 📥
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentProofPreview: React.FC<{ url: string | null | undefined; cnic?: string }> = ({ url, cnic }) => {
  const [imgError, setImgError] = useState(false);
  const cleanUrl = getValidMediaUrl(url);

  if (!cleanUrl) {
    return <span className="text-slate-400 italic text-xs">No payment screenshot attached.</span>;
  }

  const isDoc = isPdfOrDocFile(cleanUrl) || imgError;
  const fileName = `Payment_Proof_${cnic || 'Applicant'}.${isDoc ? 'pdf' : 'jpg'}`;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      {!isDoc ? (
        <img
          src={cleanUrl}
          alt="Payment Screenshot Proof"
          onError={() => setImgError(true)}
          className="h-28 w-full sm:w-48 object-cover rounded-lg border border-slate-300 shadow-xs bg-white"
        />
      ) : (
        <div className="h-28 w-full sm:w-48 bg-slate-100 rounded-lg border border-slate-300 flex flex-col items-center justify-center p-2 text-center">
          <FileText className="w-8 h-8 text-blue-600 mb-1" />
          <span className="text-[10px] font-bold text-slate-700">Payment Document</span>
        </div>
      )}
      <div className="flex flex-col gap-2 w-full sm:w-auto">
        <a
          href={cleanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg text-center transition-colors shadow-xs"
        >
          View Full Screenshot &rarr;
        </a>
        <a
          href={cleanUrl}
          download={fileName}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg text-center transition-colors shadow-xs"
        >
          Download Screenshot 📥
        </a>
      </div>
    </div>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, onRefreshConfig, onViewSlip }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [adminUsername, setAdminUsername] = useState<string>('umar');

  // Login Form State
  const [loginUser, setLoginUser] = useState('umar');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'jobs' | 'campaigns' | 'settings' | 'security'>('dashboard');

  // Stats & Applications State
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Job Management State
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [jobCategoryFilter, setJobCategoryFilter] = useState('all');
  const [jobQualFilter, setJobQualFilter] = useState('all');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [jobStatusFilter, setJobStatusFilter] = useState('all');
  const [jobCampaignFilter, setJobCampaignFilter] = useState('all');

  // Selection & Modals
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Partial<JobPosition> | null>(null);
  const [savingJob, setSavingJob] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Deletion Modals
  const [deletingJob, setDeletingJob] = useState<JobPosition | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [deletingProcess, setDeletingProcess] = useState(false);

  // Duplicate Warning State
  const [duplicateWarning, setDuplicateWarning] = useState<{ message: string; jobData: Partial<JobPosition> } | null>(null);

  // Selected Application for Review Modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<SystemSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  // Password Form State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);
  const [changingPass, setChangingPass] = useState(false);

  // Helper functions defined before useEffect to prevent TDZ initialization errors
  const loadAdminJobs = async () => {
    if (!token) return;
    setLoadingJobs(true);
    try {
      const data = await fetchAdminJobs(token);
      setJobs(data);
    } catch (err) {
      console.error('Error fetching jobs in admin', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadStats = async () => {
    if (!token) return;
    try {
      const data = await fetchAdminStats(token);
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadApplications = async () => {
    if (!token) return;
    setLoadingApps(true);
    try {
      const data = await fetchAdminApplications(token, selectedStatusFilter, searchQuery);
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApps(false);
    }
  };

  const loadSettings = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettingsForm(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load Admin Data on Auth
  useEffect(() => {
    if (token) {
      loadStats();
      loadApplications();
      loadSettings();
      loadAdminJobs();
    }
  }, [token, selectedStatusFilter]);

  const handleOpenAddJob = () => {
    setEditingJob({
      title: '',
      department: 'Digital Support Services',
      companyName: 'JobsHub Official',
      companyLogo: '',
      category: 'Private Jobs',
      minQualification: 'Primary',
      qualificationRequired: 'Primary / Middle or Higher',
      jobType: 'Full-time',
      employmentType: 'Full-time',
      country: 'Pakistan',
      ageLimit: '18 - 40 Years',
      vacancies: 10,
      location: 'Remote / Online',
      salaryRange: 'PKR 35,000 - 55,000 / month',
      deadline: '2026-12-31',
      description: '',
      responsibilities: 'Assist in daily operational, technical, or administrative workflows accurately.',
      requirements: 'Basic qualification, strong dedication, and adherence to company policies.',
      requiredSkills: ['Basic Computer', 'Data Entry', 'Communication'],
      applicationMethod: 'online',
      applicationUrl: '',
      postedDate: new Date().toISOString().split('T')[0],
      status: 'published',
      campaigns: ['federal-govt', 'pak-navy']
    });
    setDuplicateWarning(null);
    setIsJobModalOpen(true);
  };

  const handleOpenEditJob = (job: JobPosition) => {
    setEditingJob({ ...job });
    setDuplicateWarning(null);
    setIsJobModalOpen(true);
  };

  const handleSaveJobSubmit = async (e?: React.FormEvent, allowDuplicate = false) => {
    if (e) e.preventDefault();
    if (!token || !editingJob || !editingJob.title) return;

    setSavingJob(true);
    try {
      const payload = { ...editingJob, allowDuplicate };
      if (editingJob.id) {
        await updateAdminJob(token, editingJob.id, payload);
      } else {
        await createAdminJob(token, payload);
      }
      setIsJobModalOpen(false);
      setEditingJob(null);
      setDuplicateWarning(null);
      await loadAdminJobs();
      await loadStats();
      if (onRefreshConfig) onRefreshConfig();
    } catch (err: any) {
      if (err.isDuplicate) {
        setDuplicateWarning({
          message: err.message,
          jobData: editingJob
        });
      } else {
        alert(err.message || 'Failed to save job vacancy');
      }
    } finally {
      setSavingJob(false);
    }
  };

  const handleTogglePublishStatus = async (job: JobPosition) => {
    if (!token) return;
    const isCurrentlyPublished = job.status === 'published' || job.status === 'active' || !job.status;
    const nextStatus = isCurrentlyPublished ? 'unpublished' : 'published';
    try {
      await togglePublishAdminJob(token, job.id, nextStatus);
      await loadAdminJobs();
      await loadStats();
      if (onRefreshConfig) onRefreshConfig();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleConfirmDeleteSingle = async () => {
    if (!token || !deletingJob) return;
    setDeletingProcess(true);
    try {
      await deleteAdminJob(token, deletingJob.id);
      setDeletingJob(null);
      setSelectedJobIds(prev => prev.filter(id => id !== deletingJob.id));
      await loadAdminJobs();
      await loadStats();
      if (onRefreshConfig) onRefreshConfig();
    } catch (err: any) {
      alert(err.message || 'Failed to delete job');
    } finally {
      setDeletingProcess(false);
    }
  };

  const handleBulkPublish = async () => {
    if (!token || selectedJobIds.length === 0) return;
    try {
      await bulkPublishAdminJobs(token, selectedJobIds);
      setSelectedJobIds([]);
      await loadAdminJobs();
      await loadStats();
      if (onRefreshConfig) onRefreshConfig();
    } catch (err: any) {
      alert(err.message || 'Failed to bulk publish');
    }
  };

  const handleBulkUnpublish = async () => {
    if (!token || selectedJobIds.length === 0) return;
    try {
      await bulkUnpublishAdminJobs(token, selectedJobIds);
      setSelectedJobIds([]);
      await loadAdminJobs();
      await loadStats();
      if (onRefreshConfig) onRefreshConfig();
    } catch (err: any) {
      alert(err.message || 'Failed to bulk unpublish');
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (!token || selectedJobIds.length === 0) return;
    setDeletingProcess(true);
    try {
      await bulkDeleteAdminJobs(token, selectedJobIds);
      setSelectedJobIds([]);
      setIsBulkDeleteOpen(false);
      await loadAdminJobs();
      await loadStats();
      if (onRefreshConfig) onRefreshConfig();
    } catch (err: any) {
      alert(err.message || 'Failed to bulk delete');
    } finally {
      setDeletingProcess(false);
    }
  };

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await adminLogin(loginUser, loginPass);
      if (res && res.token) {
        localStorage.setItem('admin_token', res.token);
        setToken(res.token);
        const uname = (res.user && res.user.username) ? res.user.username : 'umar';
        setAdminUsername(uname);
      } else {
        setLoginError('Invalid username or password.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Invalid username or password.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setSelectedApp(null);
  };

  const handleVerify = async (action: 'approve' | 'reject') => {
    if (!token || !selectedApp) return;
    if (action === 'reject' && !rejectionReason.trim()) {
      alert('Please provide a reason for payment rejection.');
      return;
    }

    setVerifying(true);
    try {
      const res = await verifyApplicationPayment(token, selectedApp.id, action, rejectionReason);
      setSelectedApp(res.application);
      setRejectionReason('');
      await loadStats();
      await loadApplications();
      alert(res.message);
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !settingsForm) return;

    if (settingsForm.whatsappNumber) {
      const waCheck = validateWhatsAppNumber(settingsForm.whatsappNumber);
      if (!waCheck.isValid) {
        alert(waCheck.message || 'Invalid WhatsApp number.');
        return;
      }
    }

    setSavingSettings(true);
    setSettingsSuccess(null);

    try {
      await updateSystemSettings(token, settingsForm);
      setSettingsSuccess('Settings & official WhatsApp support number updated successfully.');
      if (onRefreshConfig) onRefreshConfig();
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setChangingPass(true);
    setPassError(null);
    setPassSuccess(null);

    try {
      await changeAdminPassword(token, currentPass, newPass);
      setPassSuccess('Admin password updated successfully.');
      setCurrentPass('');
      setNewPass('');
    } catch (err: any) {
      setPassError(err.message || 'Password update failed.');
    } finally {
      setChangingPass(false);
    }
  };

  // Filtered Jobs Array
  const filteredJobs = jobs.filter(j => {
    const q = jobSearchQuery.toLowerCase().trim();
    const matchesQuery = !q ||
      j.title.toLowerCase().includes(q) ||
      (j.companyName && j.companyName.toLowerCase().includes(q)) ||
      j.department.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q) ||
      (j.country && j.country.toLowerCase().includes(q)) ||
      (j.requiredSkills && j.requiredSkills.some(s => s.toLowerCase().includes(q)));

    if (!matchesQuery) return false;

    if (jobCategoryFilter !== 'all') {
      if (jobCategoryFilter === 'Government Jobs' && j.category !== 'Government Jobs') return false;
      if (jobCategoryFilter === 'Private Jobs' && j.category !== 'Private Jobs') return false;
      if (jobCategoryFilter === 'Factory Worker' && j.category !== 'Factory Worker') return false;
      if (jobCategoryFilter === 'Freelancer' && j.category !== 'Freelancer') return false;
      if (jobCategoryFilter === 'Other' && ['Government Jobs', 'Private Jobs', 'Factory Worker', 'Freelancer'].includes(j.category || '')) return false;
      if (!['Government Jobs', 'Private Jobs', 'Factory Worker', 'Freelancer', 'Other'].includes(jobCategoryFilter) && j.category !== jobCategoryFilter) return false;
    }

    if (jobQualFilter !== 'all') {
      const targetRank = getQualificationRank(jobQualFilter);
      const jobRank = getMinQualificationRank(j.minQualification);
      if (targetRank !== jobRank) return false;
    }

    if (jobTypeFilter !== 'all') {
      const typeStr = (j.employmentType || j.jobType || '').toLowerCase();
      if (!typeStr.includes(jobTypeFilter.toLowerCase())) return false;
    }

    if (jobStatusFilter !== 'all') {
      const isPub = j.status === 'published' || j.status === 'active' || !j.status;
      if (jobStatusFilter === 'published' && !isPub) return false;
      if (jobStatusFilter === 'unpublished' && isPub) return false;
    }

    if (jobCampaignFilter !== 'all') {
      const inCamp = (j.campaigns && j.campaigns.includes(jobCampaignFilter)) || (j as any).campaign === jobCampaignFilter;
      if (!inCamp) return false;
    }

    return true;
  });

  const isAllSelected = filteredJobs.length > 0 && filteredJobs.every(j => selectedJobIds.includes(j.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(filteredJobs.map(j => j.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedJobIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">JobsHubOfficial Admin Control Portal</h3>
              <p className="text-xs text-slate-400">Real-Time Job Vacancy Management &amp; Application Verification</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {token && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= LOGIN FORM IF NOT AUTHENTICATED ================= */}
        {!token ? (
          <div className="p-8 max-w-md mx-auto w-full space-y-6 my-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-extrabold text-slate-900">Administrator Login</h4>
              <p className="text-xs text-slate-500 mt-1">Authorized personnel authentication required</p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Admin Username</label>
                <input
                  type="text"
                  required
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="Enter password"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Login to Admin Panel</span>
              </button>
            </form>
          </div>
        ) : (
          /* ================= MAIN ADMIN DASHBOARD CONTENT ================= */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Admin Tabs Bar */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex gap-2 overflow-x-auto text-xs font-semibold shrink-0">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-white text-blue-900 shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Dashboard Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('applications')}
                className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'applications' ? 'bg-white text-blue-900 shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Manage Applications</span>
              </button>

              <button
                onClick={() => setActiveTab('jobs')}
                className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'jobs' ? 'bg-white text-blue-900 shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Manage Job Vacancies ({jobs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('campaigns')}
                className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'campaigns' ? 'bg-white text-blue-900 shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Share2 className="w-4 h-4 text-blue-600" />
                <span>Ad Campaigns ({JOB_CAMPAIGNS.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'settings' ? 'bg-white text-blue-900 shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Payment &amp; Fee Setup</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'security' ? 'bg-white text-blue-900 shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Security Settings</span>
              </button>
            </div>

            {/* Scrollable Tab Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">

              {/* ----------------- TAB 1: DASHBOARD STATS ----------------- */}
              {activeTab === 'dashboard' && stats && (
                <div className="space-y-6">
                  
                  {/* Real-time Job Database Summary Banner */}
                  <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                        <Briefcase className="w-4 h-4 text-blue-400" />
                        <span>Live Database Job Management Counters</span>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-extrabold text-[11px] rounded-full border border-emerald-500/30 w-fit">
                        Real-Time Persistent Sync
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-slate-100">
                      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Jobs</span>
                        <div className="text-xl font-black text-white mt-1">{jobs.length}</div>
                      </div>
                      <div className="bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/50">
                        <span className="text-[10px] text-emerald-400 block font-bold uppercase">Published</span>
                        <div className="text-xl font-black text-emerald-300 mt-1">
                          {jobs.filter(j => j.status === 'published' || j.status === 'active' || !j.status).length}
                        </div>
                      </div>
                      <div className="bg-amber-950/60 p-3 rounded-xl border border-amber-800/50">
                        <span className="text-[10px] text-amber-400 block font-bold uppercase">Unpublished</span>
                        <div className="text-xl font-black text-amber-300 mt-1">
                          {jobs.filter(j => j.status === 'unpublished' || j.status === 'draft').length}
                        </div>
                      </div>
                      <div className="bg-blue-950/60 p-3 rounded-xl border border-blue-800/50">
                        <span className="text-[10px] text-blue-300 block font-bold uppercase">Government</span>
                        <div className="text-xl font-black text-blue-200 mt-1">
                          {jobs.filter(j => j.category === 'Government Jobs').length}
                        </div>
                      </div>
                      <div className="bg-indigo-950/60 p-3 rounded-xl border border-indigo-800/50">
                        <span className="text-[10px] text-indigo-300 block font-bold uppercase">Private Jobs</span>
                        <div className="text-xl font-black text-indigo-200 mt-1">
                          {jobs.filter(j => j.category === 'Private Jobs').length}
                        </div>
                      </div>
                      <div className="bg-teal-950/60 p-3 rounded-xl border border-teal-800/50">
                        <span className="text-[10px] text-teal-300 block font-bold uppercase">Factory</span>
                        <div className="text-xl font-black text-teal-200 mt-1">
                          {jobs.filter(j => j.category === 'Factory Worker').length}
                        </div>
                      </div>
                      <div className="bg-purple-950/60 p-3 rounded-xl border border-purple-800/50">
                        <span className="text-[10px] text-purple-300 block font-bold uppercase">Freelancer</span>
                        <div className="text-xl font-black text-purple-200 mt-1">
                          {jobs.filter(j => j.category === 'Freelancer').length}
                        </div>
                      </div>
                      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Other Sectors</span>
                        <div className="text-xl font-black text-slate-200 mt-1">
                          {jobs.filter(j => !['Government Jobs', 'Private Jobs', 'Factory Worker', 'Freelancer'].includes(j.category || '')).length}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                      <span className="text-[11px] font-semibold text-indigo-800 block">Total Registered Users</span>
                      <div className="text-2xl font-black text-indigo-950 mt-1">{stats.totalUsers || 0}</div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                      <span className="text-[11px] font-semibold text-purple-800 block">Total Job Openings</span>
                      <div className="text-2xl font-black text-purple-950 mt-1">{stats.totalJobs || jobs.length || 0}</div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-semibold text-slate-500 block">Total Applications</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalApplications}</div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                      <span className="text-[11px] font-semibold text-amber-800 block">Pending Payments</span>
                      <div className="text-2xl font-black text-amber-950 mt-1">{stats.pendingPayments}</div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <span className="text-[11px] font-semibold text-blue-800 block">Approved Payments</span>
                      <div className="text-2xl font-black text-blue-950 mt-1">{stats.approvedPayments}</div>
                    </div>

                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
                      <span className="text-[11px] font-semibold text-rose-800 block">Rejected Payments</span>
                      <div className="text-2xl font-black text-rose-950 mt-1">{stats.rejectedPayments}</div>
                    </div>

                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 col-span-2">
                      <span className="text-[11px] font-semibold text-emerald-800 block">Submitted Successfully</span>
                      <div className="text-2xl font-black text-emerald-950 mt-1">{stats.submittedSuccessfully}</div>
                    </div>

                  </div>

                  {/* Quick Action Banner */}
                  <div className="bg-blue-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-base">Pending Verification Queue</h4>
                      <p className="text-xs text-blue-200 mt-1">
                        There are {stats.pendingPayments} applications waiting for payment screenshot verification.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStatusFilter('pending');
                        setActiveTab('applications');
                      }}
                      className="px-5 py-2.5 bg-white text-blue-950 font-bold text-xs rounded-xl shadow-md hover:bg-blue-50 transition-colors cursor-pointer shrink-0"
                    >
                      Review Pending Applications
                    </button>
                  </div>

                </div>
              )}

              {/* ----------------- TAB 2: APPLICATIONS MANAGEMENT ----------------- */}
              {activeTab === 'applications' && (
                <div className="space-y-4">
                  
                  {/* Application Filters */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto text-xs font-semibold">
                      {['all', 'pending', 'approved', 'rejected'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setSelectedStatusFilter(st)}
                          className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                            selectedStatusFilter === st
                              ? 'bg-blue-600 text-white font-bold shadow-2xs'
                              : 'bg-white text-slate-700 hover:bg-slate-200/60 border border-slate-200'
                          }`}
                        >
                          {st} Applications
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search CNIC, Roll No, Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  {/* Applications List Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                          <tr>
                            <th className="p-3">Roll No &amp; Date</th>
                            <th className="p-3">Candidate Info</th>
                            <th className="p-3">Applied Job Position</th>
                            <th className="p-3">Payment Method</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {loadingApps ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-500">
                                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                                <span>Loading applications list...</span>
                              </td>
                            </tr>
                          ) : applications.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                                No applications match the selected status filter.
                              </td>
                            </tr>
                          ) : (
                            applications.map((app) => (
                              <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-3 font-mono">
                                  <div className="font-bold text-blue-900">{app.rollNumber || app.id.slice(0, 8)}</div>
                                  <div className="text-[10px] text-slate-400">
                                    {new Date(app.createdAt).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-slate-900">{app.candidateName}</div>
                                  <div className="text-[10px] text-slate-500">CNIC: {app.cnic}</div>
                                  <div className="text-[10px] text-slate-500">Mobile: {app.mobileNumber}</div>
                                </td>
                                <td className="p-3 font-medium text-slate-800">
                                  {app.jobTitle}
                                </td>
                                <td className="p-3">
                                  <div className="font-bold capitalize text-slate-800">{app.paymentMethod}</div>
                                  <div className="text-[10px] text-slate-500">TRX: {app.transactionId}</div>
                                </td>
                                <td className="p-3">
                                  {app.paymentStatus === 'approved' && (
                                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Approved
                                    </span>
                                  )}
                                  {app.paymentStatus === 'pending' && (
                                    <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] inline-flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      Pending Verification
                                    </span>
                                  )}
                                  {app.paymentStatus === 'rejected' && (
                                    <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px] inline-flex items-center gap-1">
                                      <XCircle className="w-3 h-3 text-rose-600" />
                                      Rejected
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => setSelectedApp(app)}
                                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Review</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* ----------------- TAB 3: JOB VACANCIES MANAGEMENT ----------------- */}
              {activeTab === 'jobs' && (
                <div className="space-y-4">
                  
                  {/* Top Action & Multi-Filter Header */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                      
                      {/* Search Bar */}
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search title, company, location, or skills..."
                          value={jobSearchQuery}
                          onChange={(e) => setJobSearchQuery(e.target.value)}
                          className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                        />
                      </div>

                      {/* Add Job Button */}
                      <button
                        onClick={handleOpenAddJob}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Job Vacancy</span>
                      </button>
                    </div>

                    {/* Filter Selects Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      
                      {/* Category Filter */}
                      <div>
                        <select
                          value={jobCategoryFilter}
                          onChange={(e) => setJobCategoryFilter(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-800"
                        >
                          <option value="all">All Categories ({jobs.length})</option>
                          <option value="Government Jobs">Government Jobs ({jobs.filter(j => j.category === 'Government Jobs').length})</option>
                          <option value="Private Jobs">Private Jobs ({jobs.filter(j => j.category === 'Private Jobs').length})</option>
                          <option value="Factory Worker">Factory Worker ({jobs.filter(j => j.category === 'Factory Worker').length})</option>
                          <option value="Freelancer">Freelancer ({jobs.filter(j => j.category === 'Freelancer').length})</option>
                          <option value="Office Jobs">Office Jobs ({jobs.filter(j => j.category === 'Office Jobs').length})</option>
                          <option value="Healthcare">Healthcare ({jobs.filter(j => j.category === 'Healthcare').length})</option>
                          <option value="IT & Software">IT &amp; Software ({jobs.filter(j => j.category === 'IT & Software').length})</option>
                          <option value="Sales & Marketing">Sales &amp; Marketing ({jobs.filter(j => j.category === 'Sales & Marketing').length})</option>
                          <option value="Teaching">Teaching ({jobs.filter(j => j.category === 'Teaching').length})</option>
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <select
                          value={jobStatusFilter}
                          onChange={(e) => setJobStatusFilter(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-800"
                        >
                          <option value="all">All Statuses</option>
                          <option value="published">Published Only ({jobs.filter(j => j.status === 'published' || j.status === 'active' || !j.status).length})</option>
                          <option value="unpublished">Unpublished Only ({jobs.filter(j => j.status === 'unpublished' || j.status === 'draft').length})</option>
                        </select>
                      </div>

                      {/* Employment Type Filter */}
                      <div>
                        <select
                          value={jobTypeFilter}
                          onChange={(e) => setJobTypeFilter(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
                        >
                          <option value="all">All Job Types</option>
                          <option value="Full-time">Full-Time</option>
                          <option value="Part-time">Part-Time</option>
                          <option value="Contract">Contract</option>
                          <option value="Remote">Remote</option>
                          <option value="Freelance">Freelance</option>
                        </select>
                      </div>

                      {/* Qualification Filter */}
                      <div>
                        <select
                          value={jobQualFilter}
                          onChange={(e) => setJobQualFilter(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
                        >
                          <option value="all">All Qualifications</option>
                          {QUALIFICATION_CATEGORIES.map(qual => (
                            <option key={qual} value={qual}>{qual}</option>
                          ))}
                        </select>
                      </div>

                      {/* Campaign Filter */}
                      <div>
                        <select
                          value={jobCampaignFilter}
                          onChange={(e) => setJobCampaignFilter(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-blue-900"
                        >
                          <option value="all">All Campaigns</option>
                          {JOB_CAMPAIGNS.map(c => (
                            <option key={c.slug} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                    </div>
                  </div>

                  {/* Bulk Action Bar (Visible when items selected) */}
                  {selectedJobIds.length > 0 && (
                    <div className="bg-blue-900 text-white p-3 rounded-xl flex items-center justify-between gap-4 shadow-md animate-fade-in text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Selected <strong>{selectedJobIds.length}</strong> job(s)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleBulkPublish}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                        >
                          Publish Selected
                        </button>
                        <button
                          onClick={handleBulkUnpublish}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                        >
                          Unpublish Selected
                        </button>
                        <button
                          onClick={() => setIsBulkDeleteOpen(true)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[11px] cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Selected
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Jobs List Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                          <tr>
                            <th className="p-3 w-8">
                              <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={toggleSelectAll}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                            </th>
                            <th className="p-3">Job Title &amp; Company</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Location &amp; Country</th>
                            <th className="p-3">Qualification &amp; Type</th>
                            <th className="p-3">Salary &amp; Posts</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {loadingJobs ? (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-slate-500">
                                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                                <span>Loading job positions...</span>
                              </td>
                            </tr>
                          ) : filteredJobs.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                                No job vacancies found matching current filters.
                              </td>
                            </tr>
                          ) : (
                            filteredJobs.map(job => {
                              const isPublished = job.status === 'published' || job.status === 'active' || !job.status;
                              const isChecked = selectedJobIds.includes(job.id);

                              return (
                                <tr key={job.id} className={`hover:bg-slate-50 transition-colors ${isChecked ? 'bg-blue-50/40' : ''}`}>
                                  <td className="p-3">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleSelectOne(job.id)}
                                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      {job.companyLogo ? (
                                        <img src={job.companyLogo} alt={job.companyName || job.department} className="w-7 h-7 rounded object-cover border border-slate-200" />
                                      ) : (
                                        <div className="w-7 h-7 rounded bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200 shrink-0">
                                          {(job.companyName || job.department || 'J')[0]}
                                        </div>
                                      )}
                                      <div>
                                        <div className="font-bold text-slate-900">{job.title}</div>
                                        <div className="text-[10px] text-slate-500">{job.companyName || job.department}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-indigo-50 text-indigo-900 border border-indigo-200 inline-block">
                                      {job.category || 'General Jobs'}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <div className="text-slate-800 font-medium">{job.location}</div>
                                    <div className="text-[10px] text-slate-400">{job.country || 'Pakistan'}</div>
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-900 font-bold rounded text-[10px] border border-blue-100">
                                      {job.minQualification}
                                    </span>
                                    <div className="text-[10px] text-slate-500 mt-0.5">{job.employmentType || job.jobType}</div>
                                  </td>
                                  <td className="p-3">
                                    <div className="font-bold text-emerald-800 text-[11px]">{job.salaryRange}</div>
                                    <div className="text-[10px] text-slate-500">{job.vacancies} Posts</div>
                                  </td>
                                  <td className="p-3">
                                    <button
                                      onClick={() => handleTogglePublishStatus(job)}
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors ${
                                        isPublished
                                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                                          : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                                      }`}
                                    >
                                      {isPublished ? (
                                        <>
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                          <span>Published</span>
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="w-3 h-3 text-amber-600" />
                                          <span>Unpublished</span>
                                        </>
                                      )}
                                    </button>
                                  </td>
                                  <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                    <button
                                      onClick={() => handleOpenEditJob(job)}
                                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Edit3 className="w-3 h-3 text-blue-600" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => setDeletingJob(job)}
                                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3 text-rose-600" />
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------- TAB 4: AD CAMPAIGNS MANAGEMENT ----------------- */}
              {activeTab === 'campaigns' && (
                <div className="space-y-6">
                  <div className="bg-blue-900 text-white p-6 rounded-2xl space-y-2">
                    <h4 className="text-base font-extrabold flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-blue-300" />
                      Multi-Campaign Landing Page URLs
                    </h4>
                    <p className="text-xs text-blue-200 leading-relaxed max-w-3xl">
                      Each ad campaign has a unique landing page URL with custom branding, government logos, and relevant job filters tailored for social media advertising (TikTok, Facebook, Instagram, Google Ads).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {JOB_CAMPAIGNS.map(camp => {
                      const campUrl = getCampaignUrl(camp.slug);
                      const isCopied = copiedSlug === camp.slug;
                      const count = jobs.filter(j => (j.campaigns && j.campaigns.includes(camp.slug)) || (j as any).campaign === camp.slug).length;

                      const handleCopy = () => {
                        navigator.clipboard.writeText(campUrl);
                        setCopiedSlug(camp.slug);
                        setTimeout(() => setCopiedSlug(null), 2000);
                      };

                      return (
                        <div key={camp.slug} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-lg">{camp.icon}</span>
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 font-extrabold text-[10px] border border-blue-200">
                                {count} Active Jobs
                              </span>
                            </div>
                            <h5 className="font-extrabold text-slate-900 text-sm">{camp.name}</h5>
                            <p className="text-xs text-slate-500 mt-1">{camp.description}</p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono text-slate-600 truncate max-w-[220px]">
                              {campUrl}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={handleCopy}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                                <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                              </button>
                              <a
                                href={campUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg cursor-pointer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ----------------- TAB 5: PAYMENT & FEE SETUP ----------------- */}
              {activeTab === 'settings' && settingsForm && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  
                  {settingsSuccess && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{settingsSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        Application Fee Settings
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">Configure the fee amount charged for all online registration slips.</p>
                      
                      <div className="mt-3">
                        <label className="block font-bold text-slate-700 text-xs mb-1">Application Fee (PKR)</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={settingsForm.applicationFee}
                          onChange={(e) => setSettingsForm({ ...settingsForm, applicationFee: Number(e.target.value) })}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        Official Support WhatsApp Number
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Candidates will automatically be routed to this WhatsApp number when clicking the "Contact on WhatsApp" button after submitting an application.
                      </p>

                      <div>
                        <label className="block font-bold text-slate-700 text-xs mb-1">Official WhatsApp Number</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 0301-8899771 or 923018899771"
                          value={settingsForm.whatsappNumber || ''}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            whatsappNumber: e.target.value
                          })}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 font-mono"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Accepts Pakistani standard format (e.g. <code className="bg-slate-100 px-1 rounded">0301-8899771</code>) or international format (e.g. <code className="bg-slate-100 px-1 rounded">+923018899771</code>).
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <Upload className="w-4 h-4 text-blue-600" />
                        JazzCash Merchant Account
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Account Title</label>
                          <input
                            type="text"
                            required
                            value={settingsForm.jazzcash.accountTitle}
                            onChange={(e) => setSettingsForm({
                              ...settingsForm,
                              jazzcash: { ...settingsForm.jazzcash, accountTitle: e.target.value }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Account Number</label>
                          <input
                            type="text"
                            required
                            value={settingsForm.jazzcash.accountNumber}
                            onChange={(e) => setSettingsForm({
                              ...settingsForm,
                              jazzcash: { ...settingsForm.jazzcash, accountNumber: e.target.value }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <Upload className="w-4 h-4 text-emerald-600" />
                        Easypaisa Merchant Account
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Account Title</label>
                          <input
                            type="text"
                            required
                            value={settingsForm.easypaisa.accountTitle}
                            onChange={(e) => setSettingsForm({
                              ...settingsForm,
                              easypaisa: { ...settingsForm.easypaisa, accountTitle: e.target.value }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Account Number</label>
                          <input
                            type="text"
                            required
                            value={settingsForm.easypaisa.accountNumber}
                            onChange={(e) => setSettingsForm({
                              ...settingsForm,
                              easypaisa: { ...settingsForm.easypaisa, accountNumber: e.target.value }
                            })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Save Settings &amp; Update WhatsApp Number</span>
                    </button>
                  </form>

                </div>
              )}

              {/* ----------------- TAB 6: SECURITY SETTINGS ----------------- */}
              {activeTab === 'security' && (
                <div className="space-y-6 max-w-md mx-auto">
                  
                  {passSuccess && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{passSuccess}</span>
                    </div>
                  )}

                  {passError && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{passError}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePass} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Key className="w-4 h-4 text-blue-600" />
                      Change Admin Credentials
                    </h4>
                    
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        required
                        value={currentPass}
                        onChange={(e) => setCurrentPass(e.target.value)}
                        placeholder="Enter existing password"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">New Admin Password</label>
                      <input
                        type="password"
                        required
                        min={6}
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="Enter new strong password"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={changingPass}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {changingPass ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      <span>Update Password</span>
                    </button>
                  </form>

                </div>
              )}

            </div>
          </div>
        )}

        {/* ================= REVIEW APPLICATION MODAL ================= */}
        {selectedApp && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
              
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="font-bold text-sm tracking-tight">
                      Applicant Profile &amp; Verification — Ref #{selectedApp.referenceNo || selectedApp.rollNumber || selectedApp.id.slice(0, 8)}
                    </h4>
                    <p className="text-[11px] text-slate-400">Application Date: {new Date(selectedApp.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 text-xs overflow-y-auto flex-1">
                
                {/* Status & Quick Action Bar */}
                <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-blue-800 uppercase block">Current Application Status</span>
                    <strong className="text-sm font-black text-blue-950">{selectedApp.status || selectedApp.paymentStatus}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Direct WhatsApp Contact Button */}
                    <a
                      href={`https://wa.me/92${(selectedApp.whatsapp || selectedApp.mobile || selectedApp.mobileNumber || '').replace(/\D/g, '').replace(/^0/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>WhatsApp Candidate</span>
                    </a>

                    {/* View Official Slip CTA */}
                    {onViewSlip && (
                      <button
                        onClick={() => {
                          onViewSlip(selectedApp);
                          setSelectedApp(null);
                        }}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Printer className="w-4 h-4" />
                        <span>View Official Slip</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Full Applicant Information Grid */}
                <div className="space-y-3">
                  <h5 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">1. Applicant Profile Details</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">Full Name</span>
                      <strong className="text-slate-900 text-xs">{selectedApp.fullName || selectedApp.candidateName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">Father's Name</span>
                      <strong className="text-slate-800">{selectedApp.fatherName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">CNIC / ID Number</span>
                      <strong className="font-mono text-blue-900">{selectedApp.cnic}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">Date of Birth</span>
                      <strong className="text-slate-800">{selectedApp.dob || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">Gender</span>
                      <strong className="text-slate-800">{selectedApp.gender || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">Email Address</span>
                      <strong className="text-slate-800 truncate block">{selectedApp.email || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">Mobile Number</span>
                      <strong className="text-slate-900 font-mono">{selectedApp.mobile || selectedApp.mobileNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">WhatsApp Number</span>
                      <strong className="text-slate-900 font-mono">{selectedApp.whatsapp || selectedApp.mobile || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">City / District</span>
                      <strong className="text-slate-900">{selectedApp.city || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">Education Qualification</span>
                      <strong className="text-blue-900 font-bold">{selectedApp.qualification}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">Total Experience</span>
                      <strong className="text-slate-800">{selectedApp.experience || 'Fresh'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">Key Skills</span>
                      <strong className="text-slate-800">{selectedApp.skills || 'N/A'}</strong>
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">Applied Job Title &amp; Category</span>
                      <strong className="text-blue-950 font-black text-xs block">{selectedApp.jobPosition || selectedApp.jobTitle} ({selectedApp.jobCategory || 'General'})</strong>
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">Complete Address</span>
                      <strong className="text-slate-800">{selectedApp.address || 'N/A'}</strong>
                    </div>
                  </div>
                </div>

                {/* Payment & Transaction Proof Details */}
                <div className="space-y-3 bg-blue-50/70 p-4 rounded-xl border border-blue-200">
                  <h5 className="font-black text-blue-950 uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>2. Fee Payment &amp; Screenshot Proof</span>
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] rounded font-bold">
                      {selectedApp.paymentMethod || 'JazzCash'}
                    </span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                    <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Payment Method</span>
                      <strong className="text-blue-900 font-black text-xs block">{selectedApp.paymentMethod || 'JazzCash'}</strong>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Transaction ID / Sender</span>
                      <strong className="text-slate-900 font-mono font-bold text-xs block select-all">
                        {selectedApp.paymentTxnId || selectedApp.transactionId || 'N/A'}
                      </strong>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Payment Status</span>
                      <strong className="text-emerald-700 font-extrabold text-xs block">
                        {selectedApp.status === 'Submitted Successfully' ? 'Auto-Approved / Fee Received' : selectedApp.status}
                      </strong>
                    </div>
                  </div>

                  {/* Fee Payment Screenshot Image Preview & Download */}
                  <div className="bg-white p-3 rounded-xl border border-blue-200">
                    <span className="text-[10px] font-extrabold text-slate-600 uppercase block mb-2">Fee Payment Screenshot Proof</span>
                    <PaymentProofPreview url={selectedApp.paymentScreenshotUrl} cnic={selectedApp.cnic} />
                  </div>
                </div>

                {/* Uploaded Documents List & Image Previews */}
                <div className="space-y-3">
                  <h5 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">3. Uploaded Candidate Documents</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <DocPreviewCard title="CNIC Front" url={selectedApp.cnicFrontUrl} cnic={selectedApp.cnic} filenamePrefix="CNIC_Front" />
                    <DocPreviewCard title="CNIC Back" url={selectedApp.cnicBackUrl} cnic={selectedApp.cnic} filenamePrefix="CNIC_Back" />
                    <DocPreviewCard title="Passport Photo" url={selectedApp.passportPhotoUrl} cnic={selectedApp.cnic} filenamePrefix="Passport_Photo" />
                    <DocPreviewCard title="Educational Certificate" url={selectedApp.educationCertUrl} cnic={selectedApp.cnic} filenamePrefix="Education_Cert" />
                    <DocPreviewCard title="Experience Certificate" url={selectedApp.experienceCertUrl} cnic={selectedApp.cnic} filenamePrefix="Experience_Cert" />
                    <DocPreviewCard title="CV / Resume" url={selectedApp.resumeUrl} cnic={selectedApp.cnic} filenamePrefix="CV_Resume" />
                    <DocPreviewCard title="Other Document" url={selectedApp.otherDocUrl} cnic={selectedApp.cnic} filenamePrefix="Other_Document" />
                  </div>
                </div>

                {/* Admin Status Management Control */}
                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h5 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">3. Change Application Status &amp; Administrative Review</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Select New Application Status</label>
                      <select
                        value={selectedApp.status || 'Submitted Successfully'}
                        onChange={async (e) => {
                          const newSt = e.target.value;
                          if (!token || !selectedApp) return;
                          setVerifying(true);
                          try {
                            const res = await updateApplicationStatus(token, selectedApp.id, newSt, rejectionReason);
                            setSelectedApp(res.application);
                            await loadStats();
                            await loadApplications();
                          } catch (err: any) {
                            alert(err.message || 'Failed to update status');
                          } finally {
                            setVerifying(false);
                          }
                        }}
                        className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      >
                        <option value="Auto-Approved / Preliminary Approval">Auto-Approved / Preliminary Approval</option>
                        <option value="Auto-Approved">Auto-Approved</option>
                        <option value="Submitted Successfully">Submitted Successfully</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interview Scheduled">Interview Scheduled</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Preliminary Approved">Preliminary Approved</option>
                        <option value="Payment Verification Pending">Payment Verification Pending</option>
                        <option value="Payment Rejected">Payment Rejected</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Rejection Reason / Review Note</label>
                      <input
                        type="text"
                        placeholder="e.g. Document image blur / Rejection details..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ================= SINGLE JOB DELETION CONFIRMATION MODAL ================= */}
        {deletingJob && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">Delete Job Vacancy?</h4>
                  <p className="text-xs text-slate-500">This action cannot be undone.</p>
                </div>
              </div>

              <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 text-xs space-y-1">
                <div className="font-extrabold text-slate-900">{deletingJob.title}</div>
                <div className="text-slate-600 font-medium">{deletingJob.companyName || deletingJob.department}</div>
                {deletingJob.category && (
                  <div className="text-[10px] font-bold text-indigo-900 mt-1">Category: {deletingJob.category}</div>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete this job position from the persistent database?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingJob(null)}
                  className="px-4 py-2 text-slate-600 font-semibold text-xs hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteSingle}
                  disabled={deletingProcess}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {deletingProcess ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= BULK DELETION CONFIRMATION MODAL ================= */}
        {isBulkDeleteOpen && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">Delete {selectedJobIds.length} Selected Jobs?</h4>
                  <p className="text-xs text-slate-500">Bulk action permanently removes data.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                You are about to permanently remove <strong>{selectedJobIds.length}</strong> selected job vacancies from the public website and admin database.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold text-xs hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkDelete}
                  disabled={deletingProcess}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {deletingProcess ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Delete {selectedJobIds.length} Jobs</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= DUPLICATE JOB WARNING MODAL ================= */}
        {duplicateWarning && (
          <div className="fixed inset-0 z-80 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-amber-200 p-6 space-y-4">
              <div className="flex items-center gap-3 text-amber-600">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">Possible Duplicate Job Detected</h4>
                  <p className="text-xs text-slate-500">Duplicate Title &amp; Company combination</p>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs space-y-2">
                <p className="font-semibold text-amber-900">{duplicateWarning.message}</p>
                <div className="text-slate-700">
                  <strong>Title:</strong> {duplicateWarning.jobData.title} <br />
                  <strong>Company / Dept:</strong> {duplicateWarning.jobData.companyName || duplicateWarning.jobData.department}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Would you like to modify the job information or publish it anyway?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  className="px-4 py-2 text-slate-600 font-semibold text-xs hover:text-slate-900 cursor-pointer"
                >
                  Cancel &amp; Edit Fields
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveJobSubmit(undefined, true)}
                  disabled={savingJob}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {savingJob ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Publish / Save Anyway</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= ADD / EDIT JOB VACANCY MODAL ================= */}
        {isJobModalOpen && editingJob && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
              
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                  <h4 className="font-bold text-sm">
                    {editingJob.id ? 'Edit Job Vacancy Details' : 'Add New Job Vacancy'}
                  </h4>
                </div>
                <button
                  onClick={() => setIsJobModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => handleSaveJobSubmit(e, false)} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Job Title */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">Job Title *</label>
                    <input
                      type="text"
                      required
                      value={editingJob.title || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                      placeholder="e.g. Computer Operator, Staff Nurse, Security Guard"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Company / Department Name */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Company / Department Name *</label>
                    <input
                      type="text"
                      required
                      value={editingJob.companyName || editingJob.department || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, companyName: e.target.value, department: e.target.value })}
                      placeholder="e.g. National Logistics Cell, Civil Defence, Private IT Agency"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Company Logo URL */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Company Logo URL (optional)</label>
                    <input
                      type="url"
                      value={editingJob.companyLogo || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, companyLogo: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Job Category */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Job Category *</label>
                    <select
                      value={editingJob.category || 'Government Jobs'}
                      onChange={(e) => setEditingJob({ ...editingJob, category: e.target.value })}
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-blue-900"
                    >
                      <option value="Government Jobs">Government Jobs</option>
                      <option value="Private Jobs">Private Jobs</option>
                      <option value="Factory Worker">Factory Worker</option>
                      <option value="Freelancer">Freelancer</option>
                      <option value="Office Jobs">Office Jobs</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="IT & Software">IT &amp; Software</option>
                      <option value="Sales & Marketing">Sales &amp; Marketing</option>
                      <option value="Teaching">Teaching</option>
                      <option value="Driver">Driver / Transport</option>
                      <option value="Security">Security Guard</option>
                    </select>
                  </div>

                  {/* Employment Type */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Employment / Job Type</label>
                    <select
                      value={editingJob.employmentType || editingJob.jobType || 'Full-time'}
                      onChange={(e) => setEditingJob({ ...editingJob, employmentType: e.target.value, jobType: e.target.value })}
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 font-medium"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Remote">Remote</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>

                  {/* Location & Country */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Location *</label>
                    <input
                      type="text"
                      required
                      value={editingJob.location || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                      placeholder="e.g. Islamabad, Lahore, All Pakistan, Remote"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Country</label>
                    <input
                      type="text"
                      value={editingJob.country || 'Pakistan'}
                      onChange={(e) => setEditingJob({ ...editingJob, country: e.target.value })}
                      placeholder="e.g. Pakistan, UAE, Remote"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Minimum Qualification Dropdown */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Minimum Qualification Tier *</label>
                    <select
                      value={editingJob.minQualification || 'No Formal Education'}
                      onChange={(e) => setEditingJob({ ...editingJob, minQualification: e.target.value })}
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 font-bold"
                    >
                      {QUALIFICATION_CATEGORIES.map(qual => (
                        <option key={qual} value={qual}>{qual}</option>
                      ))}
                    </select>
                  </div>

                  {/* Displayed Required Qualification */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Displayed Required Qualification</label>
                    <input
                      type="text"
                      value={editingJob.qualificationRequired || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, qualificationRequired: e.target.value })}
                      placeholder="e.g. Primary / Middle or Higher"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Salary Range */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Salary Range</label>
                    <input
                      type="text"
                      value={editingJob.salaryRange || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, salaryRange: e.target.value })}
                      placeholder="e.g. PKR 35,000 - 55,000 / month"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-emerald-800"
                    />
                  </div>

                  {/* Vacancies */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Vacancies Count</label>
                    <input
                      type="number"
                      min={1}
                      value={editingJob.vacancies || 10}
                      onChange={(e) => setEditingJob({ ...editingJob, vacancies: Number(e.target.value) })}
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Deadline & Posted Date */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Application Deadline</label>
                    <input
                      type="text"
                      value={editingJob.deadline || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, deadline: e.target.value })}
                      placeholder="2026-12-31"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Posted Date</label>
                    <input
                      type="text"
                      value={editingJob.postedDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setEditingJob({ ...editingJob, postedDate: e.target.value })}
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Required Skills */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">Required Skills (comma separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(editingJob.requiredSkills) ? editingJob.requiredSkills.join(', ') : (editingJob.requiredSkills || '')}
                      onChange={(e) => setEditingJob({ ...editingJob, requiredSkills: e.target.value.split(',').map(s => s.trim()) })}
                      placeholder="e.g. Computer Operating, Data Verification, Communication"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Job Description */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">Job Description *</label>
                    <textarea
                      rows={3}
                      required
                      value={editingJob.description || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                      placeholder="Detailed overview of job vacancy..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Responsibilities */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">Key Responsibilities</label>
                    <textarea
                      rows={2}
                      value={editingJob.responsibilities || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, responsibilities: e.target.value })}
                      placeholder="Key daily duties..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Requirements */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">Requirements</label>
                    <textarea
                      rows={2}
                      value={editingJob.requirements || ''}
                      onChange={(e) => setEditingJob({ ...editingJob, requirements: e.target.value })}
                      placeholder="Eligibility requirements..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-300"
                    />
                  </div>

                  {/* Status Toggle */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Publish Status</label>
                    <select
                      value={editingJob.status || 'published'}
                      onChange={(e) => setEditingJob({ ...editingJob, status: e.target.value as 'published' | 'unpublished' })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-bold"
                    >
                      <option value="published">Published (Visible on Website)</option>
                      <option value="unpublished">Unpublished (Draft / Hidden)</option>
                    </select>
                  </div>

                  {/* Application Method & URL */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Application Method</label>
                    <select
                      value={editingJob.applicationMethod || 'online'}
                      onChange={(e) => setEditingJob({ ...editingJob, applicationMethod: e.target.value as any })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-medium"
                    >
                      <option value="online">Online Registration Slip (JobsHub)</option>
                      <option value="email">Direct Email Application</option>
                      <option value="portal">External Career Portal</option>
                      <option value="walk-in">Walk-in Interview</option>
                    </select>
                  </div>

                  {/* Assigned Ad Campaigns */}
                  <div className="sm:col-span-2 bg-blue-50/70 p-4 rounded-xl border border-blue-200 space-y-2">
                    <label className="block font-bold text-blue-950 text-xs">Assigned Ad Campaigns (Multi-Select) *</label>
                    <p className="text-[11px] text-blue-800">Check which public campaign pages this job vacancy should appear on:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {JOB_CAMPAIGNS.map(camp => {
                        const currentCampaigns = editingJob.campaigns || [];
                        const isChecked = currentCampaigns.includes(camp.slug);

                        const toggleCampaign = () => {
                          let updated: string[];
                          if (isChecked) {
                            updated = currentCampaigns.filter(c => c !== camp.slug);
                          } else {
                            updated = [...currentCampaigns, camp.slug];
                          }
                          setEditingJob({ ...editingJob, campaigns: updated });
                        };

                        return (
                          <label key={camp.slug} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer hover:border-blue-300">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={toggleCampaign}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{camp.icon} {camp.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsJobModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingJob}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    {savingJob && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingJob.id ? 'Update Job Vacancy' : 'Create Job Vacancy'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
