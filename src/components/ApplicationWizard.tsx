import React, { useState, useEffect } from 'react';
import { SystemSettings, Application, JobPosition } from '../types.js';
import { submitApplicationStep1, uploadImageFile } from '../services/api.js';
import { isJobUnlocked } from '../utils/qualification.js';
import { X, CheckCircle2, User, Mail, Phone, MapPin, GraduationCap, FileText, Upload, Clock, ShieldCheck, Printer, AlertTriangle, ArrowRight, ArrowLeft, RefreshCw, Building, Briefcase, Calendar, Sparkles, MessageCircle } from 'lucide-react';

interface ApplicationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  config: SystemSettings;
  jobs: JobPosition[];
  initialPosition?: string;
  initialQualification?: string;
  onViewSlip?: (app: Application) => void;
  currentUser?: { id: string; fullName: string; email: string; cnic: string } | null;
}

export const ApplicationWizard: React.FC<ApplicationWizardProps> = ({
  isOpen,
  onClose,
  config,
  jobs,
  initialPosition,
  initialQualification,
  onViewSlip,
  currentUser
}) => {
  // Wizard Stage: 'form' = Input details & docs, 'processing' = 30s timer, 'completed' = Success & Slip
  const [wizardStage, setWizardStage] = useState<'form' | 'processing' | 'completed'>('form');
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [submittedApp, setSubmittedApp] = useState<Application | null>(null);

  // 30-second Timer state
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [processStatus, setProcessStatus] = useState<string>('Verifying Application Information...');

  // Form Fields
  const [qualification, setQualification] = useState<string>(() => {
    return initialQualification || localStorage.getItem('user_qualification') || 'Matric';
  });

  const availableJobsList = jobs && jobs.length > 0 ? jobs : [];
  const unlockedJobs = availableJobsList.filter(j => isJobUnlocked(qualification, j.minQualification));
  const displayedJobsOptions = unlockedJobs.length > 0 ? unlockedJobs : availableJobsList;

  const [jobPosition, setJobPosition] = useState<string>(() => {
    if (initialPosition) return initialPosition;
    return displayedJobsOptions.length > 0 ? displayedJobsOptions[0].title : 'Data Entry Operator';
  });

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [fatherName, setFatherName] = useState('');
  const [cnic, setCnic] = useState(currentUser?.cnic || '');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [experience, setExperience] = useState('Fresh');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'JazzCash' | 'Easypaisa'>('JazzCash');
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState<File | null>(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState<string | null>(null);
  const [paymentTxnId, setPaymentTxnId] = useState('');

  // Required CNIC & ID Document Files & Previews
  const [cnicFrontFile, setCnicFrontFile] = useState<File | null>(null);
  const [cnicFrontPreview, setCnicFrontPreview] = useState<string | null>(null);

  const [cnicBackFile, setCnicBackFile] = useState<File | null>(null);
  const [cnicBackPreview, setCnicBackPreview] = useState<string | null>(null);

  const [passportPhotoFile, setPassportPhotoFile] = useState<File | null>(null);
  const [passportPhotoPreview, setPassportPhotoPreview] = useState<string | null>(null);

  // Validation Errors & Submission Loading
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (!fullName) setFullName(currentUser.fullName);
      if (!email) setEmail(currentUser.email);
      if (!cnic) setCnic(currentUser.cnic);
    }
  }, [currentUser]);

  useEffect(() => {
    if (initialPosition) setJobPosition(initialPosition);
    if (initialQualification) setQualification(initialQualification);
  }, [initialPosition, initialQualification]);

  useEffect(() => {
    if (!jobs || jobs.length === 0) return;
    const available = jobs.filter(j => isJobUnlocked(qualification, j.minQualification));
    if (available.length > 0) {
      const isCurrentValid = available.some(j => j.title.toLowerCase() === jobPosition.toLowerCase());
      if (!isCurrentValid) {
        setJobPosition(available[0].title);
      }
    } else if (jobs.length > 0) {
      setJobPosition(jobs[0].title);
    }
  }, [qualification, jobs]);

  // 30-second Countdown Timer Effect
  useEffect(() => {
    let timer: any = null;
    if (wizardStage === 'processing') {
      if (timeLeft > 0) {
        timer = setInterval(() => {
          setTimeLeft(prev => {
            const next = prev - 1;
            // Update status messages dynamically
            if (next > 22) {
              setProcessStatus('Verifying Application Information & Qualification Eligibility...');
            } else if (next > 15) {
              setProcessStatus('Auditing Uploaded Documents & Verifying Identity Records...');
            } else if (next > 7) {
              setProcessStatus('Processing Application Record & Generating Tracking ID...');
            } else {
              setProcessStatus('Finalizing Record & Preparing Official Slip Pass...');
            }
            return next;
          });
        }, 1000);
      } else {
        // Timer completed (0 seconds) -> Move to completed stage!
        setWizardStage('completed');
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [wizardStage, timeLeft]);

  if (!isOpen) return null;

  const handleCnicChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 13);
    if (digits.length <= 5) {
      setCnic(digits);
    } else if (digits.length <= 12) {
      setCnic(`${digits.slice(0, 5)}-${digits.slice(5)}`);
    } else {
      setCnic(`${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`);
    }
  };

  const handleMobileChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    setMobile(digits);
  };

  const handleWhatsappChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    setWhatsapp(digits);
  };

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) errors.fullName = 'Full Name is required.';
    if (!fatherName.trim()) errors.fatherName = 'Father’s Name is required.';

    const rawCnic = cnic.replace(/\D/g, '');
    if (rawCnic.length !== 13) {
      errors.cnic = '13-digit CNIC Number is required (e.g. 12345-1234567-1).';
    }

    if (!dob) errors.dob = 'Date of birth is required.';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errors.email = 'Valid Email Address is required.';
    }

    if (!mobile || mobile.length < 11) {
      errors.mobile = 'Valid 11-digit Mobile Number is required.';
    }

    if (!address.trim()) errors.address = 'Complete Address is required.';
    if (!city.trim()) errors.city = 'City / District is required.';

    if (!cnicFrontPreview && !cnicFrontFile) {
      errors.cnicFront = 'CNIC Front picture is required.';
    }
    if (!cnicBackPreview && !cnicBackFile) {
      errors.cnicBack = 'CNIC Back picture is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!paymentScreenshotPreview && !paymentScreenshotFile) {
      errors.paymentScreenshot = 'Fee payment screenshot proof is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setFormErrors({});
      setFormStep(2);
    }
  };

  const handlePrevStep = () => {
    setFormErrors({});
    setFormStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) {
      setFormStep(1);
      return;
    }
    if (!validateStep2()) {
      return;
    }

    setSubmitting(true);
    setFormErrors({});

    try {
      let cnicFrontUrl = cnicFrontPreview || '';
      let cnicBackUrl = cnicBackPreview || '';
      let passportPhotoUrl = passportPhotoPreview || null;
      let paymentScreenshotUrl = paymentScreenshotPreview || null;

      if (cnicFrontFile) cnicFrontUrl = await uploadImageFile(cnicFrontFile);
      if (cnicBackFile) cnicBackUrl = await uploadImageFile(cnicBackFile);
      if (passportPhotoFile) passportPhotoUrl = await uploadImageFile(passportPhotoFile);
      if (paymentScreenshotFile) paymentScreenshotUrl = await uploadImageFile(paymentScreenshotFile);

      const selectedJobObj = availableJobsList.find(j => j.title === jobPosition);

      const res = await submitApplicationStep1({
        fullName,
        fatherName,
        cnic,
        dob,
        gender,
        email,
        mobile,
        whatsapp: whatsapp || mobile,
        qualification,
        experience,
        address,
        city,
        postalCode,
        jobPosition,
        jobCategory: selectedJobObj?.category || 'General',
        jobId: selectedJobObj?.id || null,
        cnicFrontUrl,
        cnicBackUrl,
        passportPhotoUrl,
        paymentMethod,
        paymentScreenshotUrl,
        paymentTxnId: paymentTxnId.trim() || null
      });

      setSubmittedApp(res.application);
      setTimeLeft(30);
      setWizardStage('processing');
    } catch (err: any) {
      setFormErrors({ server: err.message || 'Failed to submit application. Please check your internet connection.' });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedJobObj = availableJobsList.find(j => j.title === jobPosition);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-blue-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                JobsHub<span className="font-normal text-blue-300">Official</span> Application Portal
              </h3>
              <p className="text-xs text-blue-200 font-medium">Position: <strong className="text-white font-bold">{jobPosition}</strong></p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Area */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto bg-white">

          {/* ================= STAGE 1: FULL APPLICATION FORM ================= */}
          {wizardStage === 'form' && (
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* Header & Step Bar */}
              <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-3 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase tracking-wider rounded-full inline-block">
                      Step {formStep} of 2
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {formStep === 1 ? 'Personal Info & CNIC Upload' : 'Fee Payment & Final Submission'}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {formStep === 1 ? 'Complete Candidate Details' : 'Application Fee & Payment Details'}
                  </h1>
                </div>

                {/* Step Indicator Bar */}
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${formStep === 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-emerald-600 text-white'}`}>
                    1
                  </div>
                  <div className={`w-8 h-1 rounded-full ${formStep === 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${formStep === 2 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}>
                    2
                  </div>
                </div>
              </div>

              {formErrors.server && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{formErrors.server}</span>
                </div>
              )}

              {/* ================= FORM STEP 1: PERSONAL DETAILS & CNIC ================= */}
              {formStep === 1 && (
                <form onSubmit={handleNextStep} className="space-y-6">
                  
                  {/* 1. JOB SELECTION & QUALIFICATION */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      1. Select Qualification &amp; Target Position
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                          Qualification Filter *
                        </label>
                        <select
                          value={qualification}
                          onChange={(e) => {
                            const newQual = e.target.value;
                            setQualification(newQual);
                            localStorage.setItem('user_qualification', newQual);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                        >
                          <option value="Primary">Primary</option>
                          <option value="Middle">Middle</option>
                          <option value="Matric">Matric</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Diploma">Diploma</option>
                          <option value="Technical Diploma">Technical Diploma</option>
                          <option value="Certification">Certification</option>
                          <option value="Associate Degree">Associate Degree</option>
                          <option value="Bachelor">Bachelor</option>
                          <option value="BS">BS</option>
                          <option value="Master">Master</option>
                          <option value="Other Higher Qualification">Other Higher Qualification</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                          Select Applied Job Position *
                        </label>
                        <select
                          value={jobPosition}
                          onChange={(e) => setJobPosition(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                        >
                          {displayedJobsOptions.map(j => (
                            <option key={j.id} value={j.title}>
                              {j.title} ({j.department})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {selectedJobObj && (
                      <div className="bg-blue-900 text-white p-3.5 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-blue-200 uppercase font-bold block">Job Details</span>
                          <strong className="text-white font-black text-sm">{selectedJobObj.title}</strong>
                          <span className="text-blue-200 text-[11px] block mt-0.5">Category: {selectedJobObj.category} &bull; Min. Education: {selectedJobObj.minQualification}</span>
                        </div>
                        <span className="px-2.5 py-1 bg-white/20 text-white text-[10px] font-bold rounded-md uppercase">
                          ID: {selectedJobObj.id}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 2. PERSONAL INFORMATION */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
                      <User className="w-4 h-4 text-blue-600" />
                      2. Applicant Personal Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Full Name */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Muhammad Ali"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        {formErrors.fullName && <p className="text-[10px] text-rose-600 mt-0.5">{formErrors.fullName}</p>}
                      </div>

                      {/* Father Name */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Father's Name *</label>
                        <input
                          type="text"
                          required
                          value={fatherName}
                          onChange={(e) => setFatherName(e.target.value)}
                          placeholder="e.g. Ghulam Hassan"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        {formErrors.fatherName && <p className="text-[10px] text-rose-600 mt-0.5">{formErrors.fatherName}</p>}
                      </div>

                      {/* CNIC */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">CNIC / National ID *</label>
                        <input
                          type="text"
                          required
                          value={cnic}
                          onChange={(e) => handleCnicChange(e.target.value)}
                          placeholder="35202-0000000-1"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        {formErrors.cnic && <p className="text-[10px] text-rose-600 mt-0.5">{formErrors.cnic}</p>}
                      </div>

                      {/* DOB */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Date of Birth *</label>
                        <input
                          type="date"
                          required
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        {formErrors.dob && <p className="text-[10px] text-rose-600 mt-0.5">{formErrors.dob}</p>}
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Gender *</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ali@example.com"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        {formErrors.email && <p className="text-[10px] text-rose-600 mt-0.5">{formErrors.email}</p>}
                      </div>

                      {/* Mobile Number */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Mobile Number *</label>
                        <input
                          type="tel"
                          required
                          value={mobile}
                          onChange={(e) => handleMobileChange(e.target.value)}
                          placeholder="03001234567"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        {formErrors.mobile && <p className="text-[10px] text-rose-600 mt-0.5">{formErrors.mobile}</p>}
                      </div>

                      {/* WhatsApp Number */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">WhatsApp Number</label>
                        <input
                          type="tel"
                          value={whatsapp}
                          onChange={(e) => handleWhatsappChange(e.target.value)}
                          placeholder="03001234567 (Optional)"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>

                      {/* City / District */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">City / District *</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Lahore, Rawalpindi"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        {formErrors.city && <p className="text-[10px] text-rose-600 mt-0.5">{formErrors.city}</p>}
                      </div>

                      {/* Experience */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Total Experience</label>
                        <select
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                          <option value="Fresh">Fresh / No Experience</option>
                          <option value="1 Year">1 Year</option>
                          <option value="2 Years">2 Years</option>
                          <option value="3-5 Years">3-5 Years</option>
                          <option value="5+ Years">5+ Years</option>
                        </select>
                      </div>

                      {/* Address */}
                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">Complete Residential Address *</label>
                        <input
                          type="text"
                          required
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="House #, Street #, Sector / Colony, Tehsil / City"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        {formErrors.address && <p className="text-[10px] text-rose-600 mt-0.5">{formErrors.address}</p>}
                      </div>

                    </div>
                  </div>

                  {/* 3. SUPPORTING CNIC & PICTURE UPLOADS */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
                      <Upload className="w-4 h-4 text-blue-600" />
                      3. Required Identity Documents (CNIC Front &amp; Back) *
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      {/* CNIC Front */}
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center text-center relative hover:bg-slate-100 transition-colors cursor-pointer">
                        <Upload className="w-5 h-5 text-blue-600 mb-1" />
                        <span className="text-xs font-bold text-slate-800">CNIC Front Image *</span>
                        <span className="text-[9px] text-slate-400">Clear JPG or PNG</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              setCnicFrontFile(file);
                              setCnicFrontPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {cnicFrontPreview && (
                          <div className="mt-2 w-full">
                            <img src={cnicFrontPreview} alt="CNIC Front" className="h-16 w-full object-cover rounded border" />
                            <span className="text-[10px] text-emerald-600 font-bold block mt-1">Loaded ✓</span>
                          </div>
                        )}
                        {formErrors.cnicFront && <p className="text-[10px] text-rose-600 mt-1">{formErrors.cnicFront}</p>}
                      </div>

                      {/* CNIC Back */}
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center text-center relative hover:bg-slate-100 transition-colors cursor-pointer">
                        <Upload className="w-5 h-5 text-blue-600 mb-1" />
                        <span className="text-xs font-bold text-slate-800">CNIC Back Image *</span>
                        <span className="text-[9px] text-slate-400">Clear JPG or PNG</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              setCnicBackFile(file);
                              setCnicBackPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {cnicBackPreview && (
                          <div className="mt-2 w-full">
                            <img src={cnicBackPreview} alt="CNIC Back" className="h-16 w-full object-cover rounded border" />
                            <span className="text-[10px] text-emerald-600 font-bold block mt-1">Loaded ✓</span>
                          </div>
                        )}
                        {formErrors.cnicBack && <p className="text-[10px] text-rose-600 mt-1">{formErrors.cnicBack}</p>}
                      </div>

                      {/* Passport Photo */}
                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center text-center relative hover:bg-slate-100 transition-colors cursor-pointer">
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-xs font-bold text-slate-800">Passport Photo</span>
                        <span className="text-[9px] text-slate-400">White background (Optional)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              setPassportPhotoFile(file);
                              setPassportPhotoPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {passportPhotoPreview && (
                          <div className="mt-2 w-full">
                            <img src={passportPhotoPreview} alt="Passport Photo" className="h-16 w-full object-cover rounded border" />
                            <span className="text-[10px] text-emerald-600 font-bold block mt-1">Photo Loaded ✓</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Next Step CTA */}
                  <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-[11px] text-slate-500 max-w-sm">
                      Press <strong>Next</strong> to proceed to Application Fee Payment &amp; Screenshot Upload.
                    </p>

                    <button
                      type="submit"
                      className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      <span>Next: Application Fee &amp; Payment &rarr;</span>
                    </button>
                  </div>

                </form>
              )}

              {/* ================= FORM STEP 2: APPLICATION FEE & PAYMENT ================= */}
              {formStep === 2 && (
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Candidate Summary Card */}
                  <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                    <div>
                      <span className="text-[10px] text-blue-300 font-extrabold uppercase tracking-wider block">Applicant Profile Summary</span>
                      <strong className="text-base text-white font-black">{fullName}</strong>
                      <span className="text-xs text-slate-300 block font-mono">CNIC: {cnic} &bull; Target Job: {jobPosition}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg border border-white/20 transition-colors cursor-pointer"
                    >
                      &larr; Edit Personal Info
                    </button>
                  </div>

                  {/* FEE PAYMENT & TRANSACTION PROOF */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Application Fee Payment &amp; Screenshot Upload *
                    </h3>

                    <div className="bg-blue-50/70 rounded-2xl p-5 border border-blue-100 space-y-4">
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-blue-200">
                        <div>
                          <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider block">Standard Application Processing Fee</span>
                          <strong className="text-2xl font-black text-blue-950">PKR {config.applicationFee || 300}</strong>
                          <span className="text-[11px] text-slate-500 block">Covers document indexing, identity verification &amp; tracking ID issuance</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('JazzCash')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                              paymentMethod === 'JazzCash'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            JazzCash
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('Easypaisa')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                              paymentMethod === 'Easypaisa'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            Easypaisa
                          </button>
                        </div>
                      </div>

                      {/* Selected Payment Method Account Details */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-bold uppercase text-[10px]">Official Merchant Account ({paymentMethod})</span>
                          <span className="text-emerald-700 font-extrabold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Active Account</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block">Account Number</span>
                            <strong className="text-blue-900 font-mono font-black text-base select-all">
                              {paymentMethod === 'JazzCash'
                                ? (config.jazzcash?.accountNumber || '0301-8899771')
                                : (config.easypaisa?.accountNumber || '0301-8899771')}
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-semibold block">Account Title</span>
                            <strong className="text-slate-900 font-extrabold text-sm">
                              {paymentMethod === 'JazzCash'
                                ? (config.jazzcash?.accountTitle || 'JobsHub Official')
                                : (config.easypaisa?.accountTitle || 'JobsHub Official')}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Screenshot Upload & Txn ID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        
                        <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 bg-white flex flex-col items-center justify-center text-center relative hover:bg-slate-50 transition-colors cursor-pointer">
                          <Upload className="w-6 h-6 text-blue-600 mb-1" />
                          <span className="text-xs font-bold text-slate-900">Upload Payment Screenshot Proof *</span>
                          <span className="text-[9px] text-slate-400">Clear transaction receipt or SMS screenshot</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                setPaymentScreenshotFile(file);
                                setPaymentScreenshotPreview(URL.createObjectURL(file));
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          {paymentScreenshotPreview && (
                            <div className="mt-2 w-full">
                              <img src={paymentScreenshotPreview} alt="Payment Screenshot" className="h-20 w-full object-cover rounded border" />
                              <span className="text-[10px] text-emerald-600 font-extrabold block mt-1">Payment Proof Loaded ✓</span>
                            </div>
                          )}
                          {formErrors.paymentScreenshot && <p className="text-[10px] text-rose-600 font-bold mt-1">{formErrors.paymentScreenshot}</p>}
                        </div>

                        <div className="flex flex-col justify-center space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                            Transaction ID / Sender Number (Optional)
                          </label>
                          <input
                            type="text"
                            value={paymentTxnId}
                            onChange={(e) => setPaymentTxnId(e.target.value)}
                            placeholder="e.g. 03001234567 or TRX-998823"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                          <p className="text-[10px] text-slate-400">
                            Providing transaction ID helps in instant automated database verification.
                          </p>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Form Action Buttons */}
                  <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      &larr; Back to Personal Info
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Submitting Application...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Application &amp; Auto-Approve &rarr;</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              )}
            </div>
          )}

          {/* ================= STAGE 2: 30-SECOND AUTOMATIC APPROVAL PROCESSING SCREEN ================= */}
          {wizardStage === 'processing' && (
            <div className="max-w-xl mx-auto text-center py-10 space-y-8">
              
              {/* Circular Timer & Spinner */}
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-8 border-blue-100 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-8 border-blue-600 border-t-transparent animate-spin" />
                <div className="text-center z-10">
                  <span className="text-4xl font-black text-blue-950 block">{timeLeft}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Seconds</span>
                </div>
              </div>

              {/* Status Header */}
              <div className="space-y-2">
                <span className="px-3.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  3. Automatic Approval
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{processStatus}</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Automatic 30-second application verification &amp; indexing in progress. Please do not close or refresh this page.
                </p>
              </div>

              {/* Checklist */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2.5 text-xs max-w-md mx-auto">
                <div className="flex items-center justify-between text-emerald-800 font-bold">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Personal Information Processed
                  </span>
                  <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded">Checked ✓</span>
                </div>
                <div className="flex items-center justify-between text-emerald-800 font-bold">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Required Documents Uploaded
                  </span>
                  <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded">Checked ✓</span>
                </div>
                <div className="flex items-center justify-between text-emerald-800 font-bold">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Fee Payment Proof Verified
                  </span>
                  <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded">Checked ✓</span>
                </div>
                <div className="flex items-center justify-between text-blue-900 font-bold pt-1 border-t border-slate-200">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                    Finalizing Application Reference ID
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">
                    {30 - timeLeft}s / 30s
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${Math.min(100, Math.max(0, ((30 - timeLeft) / 30) * 100))}%` }}
                />
              </div>

              {/* Automated Disclaimer Note */}
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-left text-xs text-amber-950 space-y-1">
                <strong className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                  Auto-Approval Notice
                </strong>
                <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                  Auto-Approved / Preliminary Approval confirms completed candidate document and payment submission. Final candidate selection or official appointment remains subject to employer/department decision.
                </p>
              </div>

            </div>
          )}

          {/* ================= STAGE 3: 4. AUTO-APPROVAL & APPLICATION SLIP ================= */}
          {wizardStage === 'completed' && submittedApp && (
            <div className="max-w-2xl mx-auto space-y-6 text-center py-6">
              
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider inline-block mb-2">
                  4. Auto-Approval &amp; Application Slip
                </span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Application Auto-Approved / Preliminary Approval
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-lg mx-auto">
                  Your application has been processed automatically. Tracking Reference ID <strong className="text-blue-900 font-mono font-bold">{submittedApp.referenceNo}</strong> is active.
                </p>
              </div>

              {/* Full Application Details Card */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Unique Application ID</span>
                  <strong className="text-blue-900 font-mono font-black text-base">{submittedApp.referenceNo}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Applicant Name</span>
                  <strong className="text-slate-900 font-bold">{submittedApp.fullName}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">CNIC Number</span>
                  <strong className="text-slate-900 font-bold font-mono">{submittedApp.cnic}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Applied Job Position</span>
                  <strong className="text-slate-900 font-bold">{submittedApp.jobPosition}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Job Category</span>
                  <strong className="text-slate-900 font-bold">{submittedApp.jobCategory || 'General'}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Submission Date &amp; Time</span>
                  <span className="text-slate-700 font-bold">
                    {new Date(submittedApp.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Document Submission Status</span>
                  <span className="text-emerald-700 font-bold">Complete &amp; Uploaded ✓</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Application Status</span>
                  <span className="text-emerald-800 font-black bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full text-xs">
                    Auto-Approved / Preliminary Approval
                  </span>
                </div>
              </div>

              {/* Action Buttons: Print, Download PDF, WhatsApp */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    if (onViewSlip) onViewSlip(submittedApp);
                    onClose();
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print &amp; Download Application Slip</span>
                </button>

                <a
                  href={`https://wa.me/${(config.whatsappNumber || '03018899771').replace(/\D/g, '')}?text=${encodeURIComponent(`Hello JobsHub Official Team, I have submitted my application (Reference ID: ${submittedApp.referenceNo}, Candidate: ${submittedApp.fullName}, Position: ${submittedApp.jobPosition}). Please guide me on next steps.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Contact on WhatsApp</span>
                </a>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
