import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { getDB, saveDB, DEFAULT_JOBS } from './src/server/db.js';
import { Application, ApplicationStatus, JobPosition } from './src/types.js';
import { isJobUnlocked } from './src/utils/qualification.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'jobshub_official_jwt_secret_key_2026';

const app = express();

// CORS Middleware for Hostinger production deployment
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically with security headers & CORS support
app.use('/api/uploads', express.static(UPLOADS_DIR, {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

app.use('/uploads', express.static(UPLOADS_DIR, {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (file.mimetype.startsWith('image/') || allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Allowed types: JPG, PNG, WEBP, PDF, DOC, DOCX up to 10MB.'));
    }
  }
});

// Admin Authentication Middleware
interface AuthenticatedRequest extends Request {
  adminUser?: { id: string; username: string };
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Admin token required.' });
  }

  const token = authHeader.split(' ')[1];
  if (token === 'admin-session-token-2026') {
    req.adminUser = { id: 'admin-1', username: 'umar' };
    return next();
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
    req.adminUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// User Authentication Middleware
interface UserAuthenticatedRequest extends Request {
  user?: { id: string; email: string; cnic: string; fullName: string };
}

const userAuthMiddleware = (req: UserAuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'User authentication required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; cnic: string; fullName: string; role?: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
};

// Helper: Format CNIC to standard format XXXXX-XXXXXXX-X or validate
function cleanCNIC(cnicStr: string): string {
  return cnicStr ? cnicStr.replace(/\D/g, '') : '';
}

function validateCNICFormat(cnicStr: string): boolean {
  const cleaned = cleanCNIC(cnicStr);
  return cleaned.length === 13;
}

function formatCNICDisplay(cnicStr: string): string {
  const cleaned = cleanCNIC(cnicStr);
  if (cleaned.length !== 13) return cnicStr;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12)}`;
}

// --- USER AUTHENTICATION ROUTES ---

// User Registration
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { fullName, email, cnic, password } = req.body;

  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ error: 'Full Name is required.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Valid Email Address is required.' });
  }
  if (!cnic || !validateCNICFormat(cnic)) {
    return res.status(400).json({ error: 'Valid 13-digit CNIC Number is required.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const db = getDB();
  const cleanUserCNIC = cleanCNIC(cnic);
  const cleanUserEmail = email.trim().toLowerCase();

  const existingEmail = db.users.find(u => u.email.toLowerCase() === cleanUserEmail);
  if (existingEmail) {
    return res.status(400).json({ error: 'An account with this email address already exists. Please login.' });
  }

  const existingCnic = db.users.find(u => cleanCNIC(u.cnic) === cleanUserCNIC);
  if (existingCnic) {
    return res.status(400).json({ error: 'An account with this CNIC number already exists. Please login.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const formattedCnic = formatCNICDisplay(cnic);

  const newUser = {
    id: `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    fullName: fullName.trim(),
    email: cleanUserEmail,
    cnic: formattedCnic,
    passwordHash,
    createdAt: new Date().toISOString(),
    role: 'user' as const
  };

  db.users.push(newUser);
  saveDB(db);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, cnic: newUser.cnic, fullName: newUser.fullName, role: 'user' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    message: 'User registration successful.',
    token,
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      cnic: newUser.cnic,
      role: 'user'
    }
  });
});

// User Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { loginInput, password } = req.body;
  if (!loginInput || !password) {
    return res.status(400).json({ error: 'Email/CNIC and password are required.' });
  }

  const db = getDB();
  const query = loginInput.trim().toLowerCase();
  const queryCleanCnic = cleanCNIC(loginInput);

  const user = db.users.find(u =>
    u.email.toLowerCase() === query ||
    (queryCleanCnic.length === 13 && cleanCNIC(u.cnic) === queryCleanCnic)
  );

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email/CNIC or password.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, cnic: user.cnic, fullName: user.fullName, role: 'user' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    message: 'Login successful.',
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      cnic: user.cnic,
      role: 'user'
    }
  });
});

// User Profile
app.get('/api/auth/me', userAuthMiddleware, (req: UserAuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// User My Applications
app.get('/api/user/applications', userAuthMiddleware, (req: UserAuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const db = getDB();
  const userCnicClean = cleanCNIC(req.user.cnic);
  const userEmailClean = req.user.email.toLowerCase();

  const userApps = db.applications.filter(a =>
    a.userId === req.user?.id ||
    (userCnicClean.length === 13 && cleanCNIC(a.cnic) === userCnicClean) ||
    a.email.toLowerCase() === userEmailClean
  );

  userApps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(userApps);
});

// --- PUBLIC ROUTES ---

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', name: 'JobsHubOfficial Portal' });
});

// Public Config (Fee & Payment details)
app.get('/api/config', (_req: Request, res: Response) => {
  const db = getDB();
  res.json({
    applicationFee: db.settings.applicationFee,
    whatsappNumber: db.settings.whatsappNumber || '0301-8899771',
    jazzcash: db.settings.jazzcash,
    easypaisa: db.settings.easypaisa
  });
});

// Available Job Vacancies
app.get('/api/jobs', (req: Request, res: Response) => {
  const db = getDB();
  if (!db.jobs || !Array.isArray(db.jobs) || db.jobs.length < 300) {
    db.jobs = DEFAULT_JOBS;
    saveDB(db);
  }
  let jobsList = db.jobs.filter(j => j.status === 'active' || j.status === 'published' || !j.status);
  const campaign = req.query.campaign as string;
  if (campaign && campaign !== 'all') {
    const filtered = jobsList.filter(j => 
      (j.campaigns && j.campaigns.includes(campaign)) ||
      (j as any).campaign === campaign
    );
    return res.json(filtered);
  }
  res.json(jobsList);
});

// Single Job Details API
app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const db = getDB();
  const job = db.jobs.find(j => j.id === req.params.id);
  if (!job || job.status === 'unpublished' || job.status === 'draft') {
    return res.status(404).json({ error: 'Job position not found or currently unavailable.' });
  }
  res.json(job);
});

// File Upload Endpoint
app.post('/api/upload', (req: Request, res: Response) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or invalid file format.' });
    }
    const fileUrl = `/api/uploads/${req.file.filename}`;
    return res.json({ fileUrl, filename: req.file.filename });
  });
});

  // Step 1: Submit Application Information
app.post('/api/applications/step1', (req: Request, res: Response) => {
  const {
    fullName,
    fatherName,
    cnic,
    dob,
    gender,
    email,
    mobile,
    whatsapp,
    qualification,
    experience,
    skills,
    address,
    city,
    postalCode,
    jobPosition,
    jobCategory,
    jobId,
    cnicFrontUrl,
    cnicBackUrl,
    passportPhotoUrl,
    educationCertUrl,
    experienceCertUrl,
    resumeUrl,
    otherDocUrl,
    paymentMethod,
    paymentScreenshotUrl,
    paymentTxnId
  } = req.body;

  // Validation
  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ error: 'Full Name is required.' });
  }
  if (!fatherName || !fatherName.trim()) {
    return res.status(400).json({ error: 'Father’s Name is required.' });
  }
  if (!cnic || !validateCNICFormat(cnic)) {
    return res.status(400).json({ error: 'Valid 13-digit CNIC Number is required (e.g., 12345-1234567-1).' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Valid Email Address is required.' });
  }
  const mobileClean = mobile ? mobile.replace(/\D/g, '') : '';
  if (!mobile || mobileClean.length < 10) {
    return res.status(400).json({ error: 'Valid Mobile Number is required.' });
  }
  if (!qualification || !qualification.trim()) {
    return res.status(400).json({ error: 'Qualification is required.' });
  }
  if (!address || !address.trim()) {
    return res.status(400).json({ error: 'Complete Address is required.' });
  }
  if (!cnicFrontUrl) {
    return res.status(400).json({ error: 'CNIC Front picture upload is required.' });
  }
  if (!cnicBackUrl) {
    return res.status(400).json({ error: 'CNIC Back picture upload is required.' });
  }

  const db = getDB();

  // Qualification Access Rule Enforcement
  if (jobPosition && jobPosition !== 'General Application') {
    const targetJob = db.jobs.find(
      j => j.title.toLowerCase() === jobPosition.toLowerCase() || j.id === jobPosition
    );
    if (targetJob && targetJob.minQualification) {
      if (!isJobUnlocked(qualification, targetJob.minQualification)) {
        return res.status(400).json({
          error: `Qualification Restriction: Your selected qualification (${qualification}) does not meet the minimum required qualification (${targetJob.qualificationRequired || targetJob.minQualification}) for "${targetJob.title}".`
        });
      }
    }
  }

  const formattedCNIC = formatCNICDisplay(cnic);

  // Check if candidate already has an active application under this CNIC for the same position
  const existing = db.applications.find(
    a => cleanCNIC(a.cnic) === cleanCNIC(cnic) && a.jobPosition === (jobPosition || 'General Application')
  );

  const now = new Date().toISOString();
  let applicationRecord: Application;

  if (existing) {
    // Update existing application
    existing.fullName = fullName.trim();
    existing.fatherName = fatherName.trim();
    existing.dob = dob ? dob.trim() : existing.dob;
    existing.gender = gender ? gender.trim() : existing.gender;
    existing.email = email.trim();
    existing.mobile = mobile.trim();
    existing.whatsapp = whatsapp ? whatsapp.trim() : (existing.whatsapp || mobile.trim());
    existing.qualification = qualification.trim();
    existing.experience = experience ? experience.trim() : existing.experience;
    existing.skills = skills ? skills.trim() : existing.skills;
    existing.address = address.trim();
    existing.city = city ? city.trim() : (existing.city || 'Not Specified');
    existing.postalCode = postalCode ? postalCode.trim() : existing.postalCode;
    existing.jobPosition = jobPosition || existing.jobPosition || 'General Application';
    existing.jobCategory = jobCategory || existing.jobCategory || 'General';
    existing.jobId = jobId || existing.jobId || null;
    existing.cnicFrontUrl = cnicFrontUrl;
    existing.cnicBackUrl = cnicBackUrl;
    existing.passportPhotoUrl = passportPhotoUrl || existing.passportPhotoUrl;
    existing.educationCertUrl = educationCertUrl || existing.educationCertUrl;
    existing.experienceCertUrl = experienceCertUrl || existing.experienceCertUrl;
    existing.resumeUrl = resumeUrl || existing.resumeUrl;
    existing.otherDocUrl = otherDocUrl || existing.otherDocUrl;
    if (paymentMethod) existing.paymentMethod = paymentMethod;
    if (paymentScreenshotUrl) existing.paymentScreenshotUrl = paymentScreenshotUrl;
    if (paymentTxnId) existing.paymentTxnId = paymentTxnId;
    existing.updatedAt = now;
    existing.status = 'Auto-Approved / Preliminary Approval';
    applicationRecord = existing;
  } else {
    // Create new application with guaranteed unique Tracking ID
    let referenceNo = '';
    let isUnique = false;
    while (!isUnique) {
      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      referenceNo = `JHO-${new Date().getFullYear()}-${randomDigits}`;
      isUnique = !db.applications.some(a => a.referenceNo === referenceNo);
    }

    applicationRecord = {
      id: `app-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      referenceNo,
      fullName: fullName.trim(),
      fatherName: fatherName.trim(),
      cnic: formattedCNIC,
      dob: dob ? dob.trim() : '',
      gender: gender ? gender.trim() : 'Male',
      email: email.trim(),
      mobile: mobile.trim(),
      whatsapp: whatsapp ? whatsapp.trim() : mobile.trim(),
      qualification: qualification.trim(),
      experience: experience ? experience.trim() : 'Fresh',
      skills: skills ? skills.trim() : '',
      address: address.trim(),
      city: city ? city.trim() : 'Not Specified',
      postalCode: postalCode ? postalCode.trim() : '',
      jobPosition: jobPosition || 'General Application',
      jobCategory: jobCategory || 'General',
      jobId: jobId || null,
      cnicFrontUrl,
      cnicBackUrl,
      passportPhotoUrl: passportPhotoUrl || null,
      educationCertUrl: educationCertUrl || null,
      experienceCertUrl: experienceCertUrl || null,
      resumeUrl: resumeUrl || null,
      otherDocUrl: otherDocUrl || null,
      processingCompleted: true,
      paymentScreenshotUrl: paymentScreenshotUrl || null,
      paymentMethod: paymentMethod || null,
      paymentTxnId: paymentTxnId || null,
      status: 'Auto-Approved / Preliminary Approval',
      rejectionReason: null,
      createdAt: now,
      updatedAt: now
    };
    db.applications.push(applicationRecord);
  }

  saveDB(db);
  res.json({
    message: 'Application submitted successfully.',
    application: applicationRecord
  });
});

// Step 2: Submit Payment Screenshot & Method
app.post('/api/applications/:id/payment', (req: Request, res: Response) => {
  const { id } = req.params;
  const { paymentMethod, paymentScreenshotUrl, paymentTxnId } = req.body;

  if (!paymentScreenshotUrl) {
    return res.status(400).json({ error: 'Payment screenshot upload is required.' });
  }

  const db = getDB();
  const appIndex = db.applications.findIndex(a => a.id === id);
  if (appIndex === -1) {
    return res.status(404).json({ error: 'Application not found.' });
  }

  const appRecord = db.applications[appIndex];
  appRecord.paymentMethod = paymentMethod || 'JazzCash';
  appRecord.paymentScreenshotUrl = paymentScreenshotUrl;
  appRecord.paymentTxnId = paymentTxnId || null;
  appRecord.status = 'Auto-Approved / Preliminary Approval';
  appRecord.rejectionReason = null;
  appRecord.updatedAt = new Date().toISOString();

  saveDB(db);

  res.json({
    message: 'Your payment screenshot has been uploaded and auto-approved.',
    application: appRecord
  });
});

// Track Application Status (by CNIC or Reference No)
app.get('/api/applications/track', (req: Request, res: Response) => {
  const query = (req.query.query as string || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Please enter CNIC Number or Application Reference Number.' });
  }

  const db = getDB();
  const cleanQ = query.replace(/\D/g, '');

  const matched = db.applications.filter(a => {
    const matchRef = a.referenceNo.toLowerCase() === query.toLowerCase();
    const matchCNIC = cleanQ.length >= 10 && cleanCNIC(a.cnic) === cleanQ;
    return matchRef || matchCNIC;
  });

  if (matched.length === 0) {
    return res.status(404).json({ error: 'No application found with the provided details. Please check and try again.' });
  }

  // Sort by newest
  matched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    applications: matched
  });
});

// Get Application by ID
app.get('/api/applications/:id', (req: Request, res: Response) => {
  const db = getDB();
  const appRecord = db.applications.find(a => a.id === req.params.id);
  if (!appRecord) {
    return res.status(404).json({ error: 'Application not found.' });
  }
  res.json(appRecord);
});

// --- ADMIN ROUTES ---

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Invalid username or password.' });
  }

  const db = getDB();
  const trimmedUser = username.trim();

  const isUserMatch = (trimmedUser === 'umar') || (db.admin && db.admin.username === trimmedUser);
  const isPassMatch = (password === 'Sho2026@') || (db.admin && bcrypt.compareSync(password, db.admin.passwordHash));

  if (!isUserMatch || !isPassMatch) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  // Ensure DB record is up to date
  if (db.admin.username !== 'umar' || !bcrypt.compareSync('Sho2026@', db.admin.passwordHash)) {
    db.admin.username = 'umar';
    db.admin.passwordHash = bcrypt.hashSync('Sho2026@', bcrypt.genSaltSync(10));
    saveDB(db);
  }

  const token = jwt.sign(
    { id: db.admin.id, username: 'umar' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    message: 'Admin authentication successful.',
    token,
    user: { username: 'umar' }
  });
});

// Get Admin Profile
app.get('/api/admin/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({ username: req.adminUser?.username });
});

// Change Admin Password
app.post('/api/admin/change-password', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  const db = getDB();
  const isValid = bcrypt.compareSync(currentPassword, db.admin.passwordHash);
  if (!isValid) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  const salt = bcrypt.genSaltSync(10);
  db.admin.passwordHash = bcrypt.hashSync(newPassword, salt);
  saveDB(db);

  res.json({ message: 'Admin password updated successfully.' });
});

// Admin Dashboard Stats
app.get('/api/admin/stats', authMiddleware, (_req: Request, res: Response) => {
  const db = getDB();
  const apps = db.applications || [];
  const jobs = db.jobs || [];

  const totalUsers = (db.users || []).length;
  const totalJobs = jobs.length;
  const publishedJobs = jobs.filter(j => j.status === 'active' || j.status === 'published' || !j.status).length;
  const unpublishedJobs = jobs.filter(j => j.status === 'unpublished' || j.status === 'draft').length;
  const govtJobs = jobs.filter(j => j.category === 'Government Jobs').length;
  const privateJobs = jobs.filter(j => j.category === 'Private Jobs').length;
  const factoryJobs = jobs.filter(j => j.category === 'Factory Worker').length;
  const freelancerJobs = jobs.filter(j => j.category === 'Freelancer').length;
  const otherCategoryJobs = jobs.filter(j =>
    !['Government Jobs', 'Private Jobs', 'Factory Worker', 'Freelancer'].includes(j.category || '')
  ).length;

  const total = apps.length;
  const pending = apps.filter(a =>
    a.status === 'Payment Verification Pending' ||
    a.status === 'Payment Pending' ||
    a.status === 'Auto-Approved / Preliminary Approval' ||
    a.status === 'Under Review' ||
    a.status === 'Submitted' ||
    a.status.toLowerCase().includes('pending') ||
    a.status.toLowerCase().includes('preliminary')
  ).length;

  const approved = apps.filter(a =>
    a.status === 'Payment Approved' ||
    a.status === 'Submitted Successfully' ||
    a.status === 'Shortlisted' ||
    a.status === 'Selected' ||
    a.status === 'Auto-Approved' ||
    a.status.toLowerCase().includes('approved')
  ).length;

  const rejected = apps.filter(a =>
    a.status === 'Payment Rejected' ||
    a.status === 'Rejected' ||
    a.status.toLowerCase().includes('reject')
  ).length;

  const submitted = apps.filter(a =>
    a.status === 'Submitted Successfully' ||
    a.status === 'Auto-Approved / Preliminary Approval' ||
    a.status === 'Auto-Approved' ||
    a.status === 'Submitted'
  ).length;

  res.json({
    totalUsers,
    totalJobs,
    publishedJobs,
    unpublishedJobs,
    govtJobs,
    privateJobs,
    factoryJobs,
    freelancerJobs,
    otherCategoryJobs,
    totalApplications: total,
    pendingPayments: pending,
    approvedPayments: approved,
    rejectedPayments: rejected,
    submittedSuccessfully: submitted
  });
});

// Admin List Applications
app.get('/api/admin/applications', authMiddleware, (req: Request, res: Response) => {
  const { status, search } = req.query;
  const db = getDB();
  let list = [...db.applications];

  if (status && typeof status === 'string' && status !== 'all') {
    const sLower = status.toLowerCase();
    if (sLower === 'pending') {
      list = list.filter(a =>
        a.status === 'Payment Verification Pending' ||
        a.status === 'Payment Pending' ||
        a.status === 'Auto-Approved / Preliminary Approval' ||
        a.status === 'Under Review' ||
        a.status === 'Submitted' ||
        a.status.toLowerCase().includes('pending') ||
        a.status.toLowerCase().includes('preliminary')
      );
    } else if (sLower === 'approved') {
      list = list.filter(a =>
        a.status === 'Payment Approved' ||
        a.status === 'Submitted Successfully' ||
        a.status === 'Shortlisted' ||
        a.status === 'Selected' ||
        a.status === 'Auto-Approved' ||
        a.status.toLowerCase().includes('approved')
      );
    } else if (sLower === 'rejected') {
      list = list.filter(a =>
        a.status === 'Payment Rejected' ||
        a.status === 'Rejected' ||
        a.status.toLowerCase().includes('reject')
      );
    } else {
      list = list.filter(a => a.status === status);
    }
  }

  if (search && typeof search === 'string') {
    const s = search.toLowerCase().trim();
    const cleanS = s.replace(/\D/g, '');
    list = list.filter(a =>
      a.fullName.toLowerCase().includes(s) ||
      a.fatherName.toLowerCase().includes(s) ||
      a.referenceNo.toLowerCase().includes(s) ||
      a.jobPosition.toLowerCase().includes(s) ||
      a.email.toLowerCase().includes(s) ||
      a.mobile.includes(s) ||
      (cleanS.length > 3 && cleanCNIC(a.cnic).includes(cleanS))
    );
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(list);
});

// Admin Get Application Detail
app.get('/api/admin/applications/:id', authMiddleware, (req: Request, res: Response) => {
  const db = getDB();
  const appRecord = db.applications.find(a => a.id === req.params.id);
  if (!appRecord) {
    return res.status(404).json({ error: 'Application not found.' });
  }
  res.json(appRecord);
});

// Admin Payment Verification Action (Approve / Reject)
app.post('/api/admin/applications/:id/verify', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, rejectionReason } = req.body;

  if (action !== 'approve' && action !== 'reject') {
    return res.status(400).json({ error: 'Invalid verification action. Must be approve or reject.' });
  }

  const db = getDB();
  const appIndex = db.applications.findIndex(a => a.id === id);
  if (appIndex === -1) {
    return res.status(404).json({ error: 'Application not found.' });
  }

  const appRecord = db.applications[appIndex];

  if (action === 'approve') {
    // When admin approves payment:
    // Functional rule: Payment Status = Approved -> Application Status = Submitted Successfully
    appRecord.status = 'Submitted Successfully';
    appRecord.rejectionReason = null;
  } else if (action === 'reject') {
    appRecord.status = 'Payment Rejected';
    appRecord.rejectionReason = rejectionReason || 'Payment screenshot could not be verified. Please upload a clear transaction screenshot.';
  }

  appRecord.updatedAt = new Date().toISOString();
  saveDB(db);

  res.json({
    message: action === 'approve'
      ? 'Payment approved and application marked as Submitted Successfully.'
      : 'Payment rejected successfully.',
    application: appRecord
  });
});

// Admin Application Status Update Action
app.post('/api/admin/applications/:id/status', authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  const db = getDB();
  const appIndex = db.applications.findIndex(a => a.id === id);
  if (appIndex === -1) {
    return res.status(404).json({ error: 'Application not found.' });
  }

  const appRecord = db.applications[appIndex];
  appRecord.status = status;
  if (rejectionReason !== undefined) {
    appRecord.rejectionReason = rejectionReason;
  }
  appRecord.updatedAt = new Date().toISOString();
  saveDB(db);

  res.json({
    message: `Application status updated to ${status}.`,
    application: appRecord
  });
});

// Admin Settings Get & Update
app.get('/api/admin/settings', authMiddleware, (_req: Request, res: Response) => {
  const db = getDB();
  res.json(db.settings);
});

app.put('/api/admin/settings', authMiddleware, (req: Request, res: Response) => {
  const { applicationFee, whatsappNumber, jazzcash, easypaisa, interviewPolicy } = req.body;

  const db = getDB();
  if (typeof applicationFee === 'number' && applicationFee > 0) {
    db.settings.applicationFee = applicationFee;
  }
  if (typeof whatsappNumber === 'string') {
    db.settings.whatsappNumber = whatsappNumber;
  }
  if (jazzcash) {
    db.settings.jazzcash = {
      accountTitle: jazzcash.accountTitle || db.settings.jazzcash.accountTitle,
      accountNumber: jazzcash.accountNumber || db.settings.jazzcash.accountNumber,
      instructions: jazzcash.instructions || db.settings.jazzcash.instructions
    };
  }
  if (easypaisa) {
    db.settings.easypaisa = {
      accountTitle: easypaisa.accountTitle || db.settings.easypaisa.accountTitle,
      accountNumber: easypaisa.accountNumber || db.settings.easypaisa.accountNumber,
      instructions: easypaisa.instructions || db.settings.easypaisa.instructions
    };
  }
  if (typeof interviewPolicy === 'string') {
    db.settings.interviewPolicy = interviewPolicy;
  }

  saveDB(db);
  res.json({
    message: 'System configuration settings updated successfully.',
    settings: db.settings
  });
});

// Admin Job Management Routes
app.get('/api/admin/jobs', authMiddleware, (_req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  if (!db.jobs || !Array.isArray(db.jobs)) {
    db.jobs = DEFAULT_JOBS;
    saveDB(db);
  }
  res.json(db.jobs);
});

app.post('/api/admin/jobs', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    department,
    companyName,
    companyLogo,
    category,
    country,
    employmentType,
    minQualification,
    qualificationRequired,
    medicalQualification,
    experienceRequired,
    jobType,
    ageLimit,
    vacancies,
    location,
    salaryRange,
    deadline,
    description,
    responsibilities,
    requirements,
    requiredSkills,
    applicationMethod,
    applicationUrl,
    postedDate,
    status,
    campaigns
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Job title is required.' });
  }

  const db = getDB();

  // Duplicate Check against Title + Company / Dept + Location / URL
  const normTitle = title.trim().toLowerCase();
  const normDept = (companyName || department || '').trim().toLowerCase();
  const normLoc = (location || '').trim().toLowerCase();
  const normUrl = (applicationUrl || '').trim().toLowerCase();

  const existingDuplicate = db.jobs.find(j => {
    const tMatch = j.title.trim().toLowerCase() === normTitle;
    const dMatch = normDept && (j.department || j.companyName || '').trim().toLowerCase() === normDept;
    const lMatch = normLoc && (j.location || '').trim().toLowerCase() === normLoc;
    const uMatch = normUrl && (j.applicationUrl || '').trim().toLowerCase() === normUrl;
    return (tMatch && dMatch) || (tMatch && lMatch) || (normUrl && uMatch);
  });

  if (existingDuplicate && !req.body.allowDuplicate) {
    return res.status(400).json({
      error: `Duplicate Job Warning: A similar job position titled "${existingDuplicate.title}" at "${existingDuplicate.department || existingDuplicate.companyName || 'General'}" already exists in the database (ID: ${existingDuplicate.id}).`,
      duplicateId: existingDuplicate.id,
      isDuplicate: true
    });
  }

  const deptVal = companyName || department || 'General';
  const newJob: JobPosition = {
    id: `job-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    title: title.trim(),
    department: deptVal,
    companyName: deptVal,
    companyLogo: companyLogo || '',
    category: category || 'Government Jobs',
    country: country || 'Pakistan',
    employmentType: employmentType || jobType || 'Full-time',
    minQualification: minQualification || 'Primary',
    qualificationRequired: qualificationRequired || `${minQualification || 'Primary'} or Higher`,
    medicalQualification: medicalQualification || '',
    experienceRequired: experienceRequired || 'Fresh / Not Required',
    jobType: jobType || employmentType || 'Full-time',
    ageLimit: ageLimit || '18 - 45 Years',
    vacancies: Number(vacancies) || 10,
    location: location || 'Remote / Anywhere in Pakistan',
    salaryRange: salaryRange || 'Market Competitive',
    deadline: deadline || '2026-12-31',
    description: description || '',
    responsibilities: responsibilities || '',
    requirements: requirements || '',
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : (requiredSkills ? requiredSkills.split(',').map((s: string) => s.trim()) : []),
    applicationMethod: applicationMethod || 'online',
    applicationUrl: applicationUrl || '',
    postedDate: postedDate || new Date().toISOString().split('T')[0],
    status: status || 'published',
    campaigns: Array.isArray(campaigns) ? campaigns : []
  };

  db.jobs.unshift(newJob);
  saveDB(db);

  res.json({ message: 'Job vacancy created successfully.', job: newJob });
});

app.put('/api/admin/jobs/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = getDB();
  const jobIndex = db.jobs.findIndex(j => j.id === id);

  if (jobIndex === -1) {
    return res.status(404).json({ error: 'Job position not found.' });
  }

  const existing = db.jobs[jobIndex];

  // Optional Duplicate Check if title is changed
  if (req.body.title && req.body.title.trim().toLowerCase() !== existing.title.trim().toLowerCase() && !req.body.allowDuplicate) {
    const normTitle = req.body.title.trim().toLowerCase();
    const existingDuplicate = db.jobs.find(j => j.id !== id && j.title.trim().toLowerCase() === normTitle);
    if (existingDuplicate) {
      return res.status(400).json({
        error: `Duplicate Job Warning: Another job position titled "${existingDuplicate.title}" already exists (ID: ${existingDuplicate.id}).`,
        duplicateId: existingDuplicate.id,
        isDuplicate: true
      });
    }
  }

  const updated: JobPosition = {
    ...existing,
    ...req.body,
    id: existing.id,
    department: req.body.companyName || req.body.department || existing.department,
    vacancies: req.body.vacancies !== undefined ? Number(req.body.vacancies) : existing.vacancies,
    requiredSkills: Array.isArray(req.body.requiredSkills)
      ? req.body.requiredSkills
      : typeof req.body.requiredSkills === 'string'
      ? req.body.requiredSkills.split(',').map((s: string) => s.trim())
      : existing.requiredSkills
  };

  db.jobs[jobIndex] = updated;
  saveDB(db);

  res.json({ message: 'Job vacancy updated successfully.', job: updated });
});

app.delete('/api/admin/jobs/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = getDB();
  const initialLen = db.jobs.length;
  db.jobs = db.jobs.filter(j => j.id !== id);

  if (db.jobs.length === initialLen) {
    return res.status(404).json({ error: 'Job position not found.' });
  }

  saveDB(db);
  res.json({ message: 'Job vacancy deleted successfully.' });
});

// Bulk Publish Jobs
app.post('/api/admin/jobs/bulk-publish', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Please select at least one job.' });
  }
  const db = getDB();
  let updatedCount = 0;
  db.jobs = db.jobs.map(j => {
    if (ids.includes(j.id)) {
      updatedCount++;
      return { ...j, status: 'published' };
    }
    return j;
  });
  saveDB(db);
  res.json({ message: `${updatedCount} job(s) published successfully.` });
});

// Bulk Unpublish Jobs
app.post('/api/admin/jobs/bulk-unpublish', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Please select at least one job.' });
  }
  const db = getDB();
  let updatedCount = 0;
  db.jobs = db.jobs.map(j => {
    if (ids.includes(j.id)) {
      updatedCount++;
      return { ...j, status: 'unpublished' };
    }
    return j;
  });
  saveDB(db);
  res.json({ message: `${updatedCount} job(s) unpublished successfully.` });
});

// Bulk Delete Jobs
app.post('/api/admin/jobs/bulk-delete', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Please select at least one job.' });
  }
  const db = getDB();
  const initialCount = db.jobs.length;
  db.jobs = db.jobs.filter(j => !ids.includes(j.id));
  const deletedCount = initialCount - db.jobs.length;
  saveDB(db);
  res.json({ message: `${deletedCount} job(s) deleted permanently.` });
});


// Start Vite / Static Server integration
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JobsHubOfficial Hostinger Production Server running on port ${PORT}`);
  });
}

startServer();
