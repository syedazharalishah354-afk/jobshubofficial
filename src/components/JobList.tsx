import React, { useState, useEffect } from 'react';
import { JobPosition } from '../types.js';
import {
  QUALIFICATION_CATEGORIES,
  isJobUnlocked,
  getQualificationUnlockMessage,
  getQualificationRank
} from '../utils/qualification.js';
import {
  Briefcase,
  MapPin,
  GraduationCap,
  Users,
  Calendar,
  ArrowRight,
  Search,
  Clock,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Filter,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface JobListProps {
  jobs: JobPosition[];
  onApplyPosition: (positionTitle: string, qualification?: string) => void;
}

export const JobList: React.FC<JobListProps> = ({ jobs, onApplyPosition }) => {
  // Store user's selected qualification in state & localStorage
  const [selectedQualification, setSelectedQualification] = useState<string>(() => {
    return localStorage.getItem('user_qualification') || 'Matric';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedJobType, setSelectedJobType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'vacancies'>('newest');
  const [visibleCount, setVisibleCount] = useState<number>(24);
  const [detailModalJob, setDetailModalJob] = useState<JobPosition | null>(null);

  // Extract unique categories, locations, and job types
  const availableCategories = Array.from(
    new Set(jobs.map(j => j.category).filter((c): c is string => Boolean(c)))
  ).sort();

  const availableLocations = Array.from(
    new Set(jobs.map(j => j.location).filter((l): l is string => Boolean(l)))
  ).sort();

  const availableJobTypes = Array.from(
    new Set(jobs.map(j => j.jobType).filter((t): t is string => Boolean(t)))
  ).sort();

  // Sync selection to localStorage
  useEffect(() => {
    localStorage.setItem('user_qualification', selectedQualification);
  }, [selectedQualification]);

  // Reset pagination when search/filter options change
  useEffect(() => {
    setVisibleCount(24);
  }, [searchTerm, filterType, selectedCategory, selectedLocation, selectedJobType, sortOrder, selectedQualification]);

  const unlockInfo = getQualificationUnlockMessage(selectedQualification);

  // Filter jobs by search, category, location, job type, and unlock status
  const processedJobs = jobs.map(job => ({
    ...job,
    unlocked: isJobUnlocked(selectedQualification, job.minQualification)
  }));

  let filteredJobs = processedJobs.filter(job => {
    const s = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !s ||
      job.title.toLowerCase().includes(s) ||
      job.department.toLowerCase().includes(s) ||
      (job.organization && job.organization.toLowerCase().includes(s)) ||
      (job.location && job.location.toLowerCase().includes(s)) ||
      (job.category && job.category.toLowerCase().includes(s)) ||
      job.description.toLowerCase().includes(s) ||
      (job.requiredSkills && job.requiredSkills.some(sk => sk.toLowerCase().includes(s)));

    if (!matchesSearch) return false;

    if (selectedCategory !== 'all' && job.category !== selectedCategory) {
      return false;
    }

    if (selectedLocation !== 'all' && job.location !== selectedLocation) {
      return false;
    }

    if (selectedJobType !== 'all' && job.jobType !== selectedJobType) {
      return false;
    }

    if (filterType === 'unlocked') return job.unlocked;
    if (filterType === 'locked') return !job.unlocked;
    return true;
  });

  // Apply Sorting
  filteredJobs = [...filteredJobs].sort((a, b) => {
    if (sortOrder === 'title-asc') return a.title.localeCompare(b.title);
    if (sortOrder === 'title-desc') return b.title.localeCompare(a.title);
    if (sortOrder === 'vacancies') return (b.vacancies || 0) - (a.vacancies || 0);
    if (sortOrder === 'oldest') return a.id.localeCompare(b.id);
    return b.id.localeCompare(a.id);
  });

  const displayedJobs = filteredJobs.slice(0, visibleCount);

  const unlockedCount = processedJobs.filter(j => j.unlocked).length;
  const lockedCount = processedJobs.filter(j => !j.unlocked).length;

  const handleApplyClick = (job: JobPosition & { unlocked: boolean }) => {
    if (!job.unlocked) return;
    setDetailModalJob(null);
    onApplyPosition(job.title, selectedQualification);
  };

  return (
    <section id="vacancies" className="py-12 bg-slate-50/50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Section Title Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold mb-2">
              <Briefcase className="w-3.5 h-3.5 text-blue-700" />
              <span>JobsHubOfficial Freelance Marketplace 2026</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Qualification-Based Job Unlocking System
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl">
              Select your education level to automatically unlock available freelance jobs suited to your qualification.
            </p>
          </div>
        </div>

        {/* ================= STEP 1: QUALIFICATION SELECTION BOX ================= */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                1
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Select Your Qualification
                </h3>
                <p className="text-xs text-slate-500">
                  Choose your level of education to unlock available job vacancies
                </p>
              </div>
            </div>

            <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
              Active Selection: <strong className="text-blue-900">{selectedQualification}</strong>
            </span>
          </div>

          {/* Qualification Options Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {QUALIFICATION_CATEGORIES.map((qual) => {
              const isSelected = selectedQualification === qual;
              return (
                <button
                  key={qual}
                  onClick={() => setSelectedQualification(qual)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between border cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-600/30'
                      : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <span className="truncate">{qual}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= DYNAMIC QUALIFICATION UNLOCK BANNER ================= */}
        <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs ${
          unlockInfo.badgeType === 'primary'
            ? 'bg-amber-50/90 border-amber-200 text-amber-950'
            : unlockInfo.badgeType === 'matric'
            ? 'bg-blue-50/90 border-blue-200 text-blue-950'
            : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              unlockInfo.badgeType === 'primary'
                ? 'bg-amber-500 text-white'
                : unlockInfo.badgeType === 'matric'
                ? 'bg-blue-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider opacity-80">
                {selectedQualification} Qualified Status
              </div>
              <h4 className="text-base font-extrabold mt-0.5">
                {unlockInfo.message}
              </h4>
              <p className="text-xs opacity-90 mt-0.5">
                {unlockedCount} unlocked positions ready for application &bull; {lockedCount} locked positions require higher qualifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 font-bold text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
              <Unlock className="w-3.5 h-3.5" /> {unlockedCount} Unlocked
            </span>
            {lockedCount > 0 && (
              <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" /> {lockedCount} Locked
              </span>
            )}
          </div>
        </div>

        {/* ================= FILTER AND SEARCH BAR ================= */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 space-y-3.5 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="relative md:col-span-5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search job title, company, location, skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Location Select */}
            <div className="md:col-span-2">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full py-2 px-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="all">All Locations ({jobs.length})</option>
                {availableLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Job Type Select */}
            <div className="md:col-span-2">
              <select
                value={selectedJobType}
                onChange={(e) => setSelectedJobType(e.target.value)}
                className="w-full py-2 px-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="all">All Job Types</option>
                {availableJobTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="md:col-span-3">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full py-2 px-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="title-asc">Sort: Title (A-Z)</option>
                <option value="title-desc">Sort: Title (Z-A)</option>
                <option value="vacancies">Sort: Vacancies (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Status Filter Pills & Quick Resets */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                All Vacancies ({filteredJobs.length})
              </button>

              <button
                onClick={() => setFilterType('unlocked')}
                className={`px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                  filterType === 'unlocked'
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                    : 'bg-white text-emerald-800 border-slate-200 hover:bg-emerald-50'
                }`}
              >
                Unlocked ({unlockedCount})
              </button>

              <button
                onClick={() => setFilterType('locked')}
                className={`px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                  filterType === 'locked'
                    ? 'bg-slate-800 text-white border-slate-800 font-bold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Locked ({lockedCount})
              </button>
            </div>

            {(searchTerm || selectedCategory !== 'all' || selectedLocation !== 'all' || selectedJobType !== 'all' || filterType !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedLocation('all');
                  setSelectedJobType('all');
                  setFilterType('all');
                  setSortOrder('newest');
                }}
                className="text-xs font-extrabold text-red-600 hover:text-red-700 underline self-end sm:self-auto cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear All Filters
              </button>
            )}
          </div>

          {/* Category Filter Pills Bar */}
          {availableCategories.length > 0 && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" /> Category:
              </span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-900'
                }`}
              >
                All ({jobs.length})
              </button>
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ================= JOB CARDS GRID ================= */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No vacancies match your search filter</h3>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search term or choosing a different category/location.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedLocation('all');
                setSelectedJobType('all');
                setFilterType('all');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
              <span>
                Showing <strong className="text-slate-900">{displayedJobs.length}</strong> of <strong className="text-slate-900">{filteredJobs.length}</strong> available job listings
              </span>
              <span>Total Listings: {jobs.length} Unique Jobs</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedJobs.map((job) => {
              if (job.unlocked) {
                // UNLOCKED JOB CARD
                return (
                  <div
                    key={job.id}
                    className="bg-white rounded-2xl border border-blue-200 p-5 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Top Status Tag */}
                    <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-2xs">
                      <Unlock className="w-3 h-3" /> Unlocked
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-3 pr-20">
                        {job.category && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 border border-indigo-200">
                            {job.category}
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-100">
                          {job.department}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          {job.vacancies} Posts
                        </span>
                      </div>

                      <h3
                        onClick={() => setDetailModalJob(job)}
                        className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{job.title}</span>
                      </h3>

                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>

                      {/* Skills Tags */}
                      {job.requiredSkills && job.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {job.requiredSkills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-700">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Required: <strong className="text-slate-900">{job.qualificationRequired}</strong></span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-emerald-700 font-bold">{job.salaryRange}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{job.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setDetailModalJob(job)}
                        className="text-xs font-bold text-slate-600 hover:text-blue-600 underline flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>

                      <button
                        onClick={() => handleApplyClick(job)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <span>Apply Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              } else {
                // LOCKED JOB CARD
                return (
                  <div
                    key={job.id}
                    className="bg-slate-100/70 rounded-2xl border border-slate-300/80 p-5 shadow-2xs flex flex-col justify-between opacity-80 hover:opacity-95 transition-all relative overflow-hidden"
                  >
                    {/* Top Status Tag */}
                    <div className="absolute top-0 right-0 bg-slate-800 text-slate-200 text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" /> Locked Job
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3 pr-20">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-700">
                          {job.department}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>{job.title}</span>
                      </h3>

                      <div className="mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 font-medium space-y-1">
                        <div className="font-extrabold text-amber-900 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Qualification Required</span>
                        </div>
                        <p className="text-[11px] leading-snug">
                          <strong>Required Qualification:</strong> {job.minQualification} or Higher
                        </p>
                      </div>

                      <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>

                      <div className="mt-4 space-y-2 border-t border-slate-200/80 pt-3 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{job.qualificationRequired}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{job.salaryRange}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Locked Button */}
                    <div className="mt-5 pt-3 border-t border-slate-200/80">
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl bg-slate-300 text-slate-600 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Qualification Required to Unlock</span>
                      </button>
                    </div>
                  </div>
                );
              }
            })}
            </div>

            {/* Pagination / Load More Button */}
            {visibleCount < filteredJobs.length && (
              <div className="pt-6 text-center space-y-2">
                <button
                  onClick={() => setVisibleCount(prev => prev + 24)}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all hover:scale-[1.02] cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Load More Job Vacancies ({filteredJobs.length - visibleCount} remaining)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-slate-500 font-medium">
                  Showing {visibleCount} of {filteredJobs.length} matching jobs
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= JOB DETAILS MODAL ================= */}
        {detailModalJob && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
              
              {/* Modal Top Header */}
              <div className="bg-blue-950 text-white p-6 flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-800 text-blue-200 text-[10px] font-bold uppercase mb-2">
                    {detailModalJob.department}
                  </div>
                  <h3 className="text-xl font-extrabold tracking-tight">{detailModalJob.title}</h3>
                  <p className="text-xs text-blue-200 mt-1">Freelance Vacancy ID: {detailModalJob.id}</p>
                </div>
                <button
                  onClick={() => setDetailModalJob(null)}
                  className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-blue-900 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
                
                {/* Qualification Match Status */}
                <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  detailModalJob.unlocked
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {detailModalJob.unlocked ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <strong className="block text-sm font-extrabold">
                        {detailModalJob.unlocked ? 'You Are Qualified To Apply' : 'Qualification Locked'}
                      </strong>
                      <span className="text-xs opacity-90">
                        {detailModalJob.unlocked
                          ? `Your selected qualification (${selectedQualification}) satisfies the requirement.`
                          : `Requires minimum ${detailModalJob.minQualification} or higher.`}
                      </span>
                    </div>
                  </div>

                  <span className="font-bold text-xs px-3 py-1 bg-white rounded-lg border shadow-2xs shrink-0">
                    {detailModalJob.qualificationRequired}
                  </span>
                </div>

                {/* Grid of Attributes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Job Type</span>
                    <strong className="text-slate-900 text-xs">{detailModalJob.jobType || 'Full-Time / Regular'}</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Experience Required</span>
                    <strong className="text-slate-900 text-xs">{detailModalJob.experience || detailModalJob.experienceRequired || 'Fresh / No Experience Required'}</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Estimated Salary / Pay</span>
                    <strong className="text-emerald-700 text-xs font-bold">{detailModalJob.salaryRange}</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Open Vacancies</span>
                    <strong className="text-slate-900 text-xs">{detailModalJob.vacancies} Posts</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Location</span>
                    <strong className="text-slate-900 text-xs">{detailModalJob.location}</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Age Limit</span>
                    <strong className="text-slate-900 text-xs">{detailModalJob.ageLimit}</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Minimum Qualification</span>
                    <strong className="text-slate-900 text-xs">{detailModalJob.minQualification}</strong>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Application Deadline</span>
                    <strong className="text-slate-900 text-xs">{detailModalJob.deadline}</strong>
                  </div>
                </div>

                {/* Job Description */}
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm mb-2">Job Description &amp; Scope</h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200">
                    {detailModalJob.description}
                  </p>
                </div>

                {/* Required Skills */}
                {detailModalJob.requiredSkills && detailModalJob.requiredSkills.length > 0 && (
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {detailModalJob.requiredSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-50 text-blue-900 font-bold text-xs rounded-lg border border-blue-100"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer Actions */}
              <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  onClick={() => setDetailModalJob(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold text-xs cursor-pointer"
                >
                  Close Window
                </button>

                {detailModalJob.unlocked ? (
                  <button
                    onClick={() => handleApplyClick(detailModalJob as any)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Apply Now for {detailModalJob.title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-6 py-2.5 bg-slate-300 text-slate-600 font-bold text-xs rounded-xl cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Locked Position</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </section>
  );
};
