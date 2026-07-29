import React, { useEffect, useState } from 'react';
import { Application, SystemSettings } from '../types.js';
import { fetchConfig } from '../services/api.js';
import { buildWhatsAppUrl } from '../utils/whatsapp.js';
import { X, Printer, ShieldCheck, CheckCircle2, MessageCircle, FileText } from 'lucide-react';

interface OfficialSlipModalProps {
  app: Application | null;
  onClose: () => void;
}

export const OfficialSlipModal: React.FC<OfficialSlipModalProps> = ({ app, onClose }) => {
  const [config, setConfig] = useState<SystemSettings | null>(null);

  useEffect(() => {
    fetchConfig().then(setConfig).catch(console.error);
  }, []);

  if (!app) return null;

  const handlePrint = () => {
    window.print();
  };

  const whatsappMsg = `Hello JobsHubOfficial, I have submitted an application. My Application ID is ${app.referenceNo}.`;
  const whatsappUrl = buildWhatsAppUrl(config?.whatsappNumber, whatsappMsg);

  const qrData = `JobsHubOfficial Application Slip | Ref: ${app.referenceNo} | CNIC: ${app.cnic} | Name: ${app.fullName} | Job: ${app.jobPosition}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrData)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header Action Controls */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <span className="text-xs font-bold flex items-center gap-1.5 text-blue-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Official Application Slip &amp; Verification Receipt
          </span>
          <div className="flex items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contact on WhatsApp</span>
            </a>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Slip Container */}
        <div id="printable-slip" className="p-6 sm:p-8 space-y-6 text-slate-900 font-sans">
          
          {/* Top Header & Branding */}
          <div className="border-b-2 border-blue-900 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-blue-900 text-white font-black text-2xl flex items-center justify-center shadow-md">
                JH
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-blue-950 tracking-tight">JobsHubOfficial Portal</h2>
                <p className="text-xs text-slate-500 font-semibold">Official Application Confirmation &amp; Slip Verification</p>
                <p className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  30-Second Automated Application Process Completed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:text-right shrink-0">
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 block">
                  {app.status || 'Auto-Approved / Preliminary Approval'}
                </span>
                <span className="text-xs font-mono font-bold text-blue-900 block mt-1.5">
                  APP ID: {app.referenceNo}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {new Date(app.createdAt).toLocaleString()}
                </span>
              </div>
              <img
                src={qrUrl}
                alt="QR Code Verification"
                className="w-20 h-20 rounded-lg border border-slate-200 p-1 bg-white shadow-xs"
              />
            </div>
          </div>

          {/* Applied Job Info */}
          <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Applied Job Position</span>
              <strong className="text-blue-950 font-black text-base">{app.jobPosition}</strong>
            </div>
            {app.jobCategory && (
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Job Category</span>
                <strong className="text-slate-800 font-bold">{app.jobCategory}</strong>
              </div>
            )}
            {app.jobId && (
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Job ID</span>
                <strong className="text-slate-800 font-mono font-bold">{app.jobId}</strong>
              </div>
            )}
          </div>

          {/* Applicant Personal Profile Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-700" />
              Applicant Personal &amp; Professional Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Full Name</span>
                <strong className="text-slate-900 font-bold">{app.fullName}</strong>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Father's Name</span>
                <strong className="text-slate-900 font-bold">{app.fatherName}</strong>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">CNIC Number</span>
                <strong className="text-slate-900 font-mono font-bold">{app.cnic}</strong>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Date of Birth</span>
                <strong className="text-slate-900 font-bold">{app.dob || 'Not Provided'}</strong>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Gender</span>
                <strong className="text-slate-900 font-bold">{app.gender || 'Male'}</strong>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Mobile Number</span>
                <strong className="text-slate-900 font-bold">{app.mobile}</strong>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">WhatsApp Number</span>
                <strong className="text-slate-900 font-bold">{app.whatsapp || app.mobile}</strong>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Email Address</span>
                <span className="text-slate-800 font-medium break-all">{app.email}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Education Level</span>
                <strong className="text-slate-900 font-bold">{app.qualification}</strong>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Experience</span>
                <strong className="text-slate-900 font-bold">{app.experience || 'Fresh'}</strong>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">City / District</span>
                <strong className="text-slate-900 font-bold">{app.city || 'Not Specified'}</strong>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Skills</span>
                <strong className="text-slate-900 font-bold">{app.skills || 'None'}</strong>
              </div>

              <div className="col-span-2 sm:col-span-3">
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Complete Residential Address</span>
                <span className="text-slate-800 font-medium">{app.address}</span>
              </div>
            </div>
          </div>

          {/* Document Verification & Submission Checklist */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Submitted Documents Verification Checklist
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-slate-700 font-medium">CNIC Front</span>
                {app.cnicFrontUrl ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Uploaded
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">Missing</span>
                )}
              </div>

              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-slate-700 font-medium">CNIC Back</span>
                {app.cnicBackUrl ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Uploaded
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">Missing</span>
                )}
              </div>

              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-slate-700 font-medium">Passport Photo</span>
                {app.passportPhotoUrl ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Uploaded
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">Not Attached</span>
                )}
              </div>

              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-slate-700 font-medium">Education Certs</span>
                {app.educationCertUrl ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Uploaded
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">Not Attached</span>
                )}
              </div>

              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-slate-700 font-medium">Experience Certs</span>
                {app.experienceCertUrl ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Uploaded
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">Not Attached</span>
                )}
              </div>

              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-slate-700 font-medium">CV / Resume</span>
                {app.resumeUrl ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Uploaded
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">Not Attached</span>
                )}
              </div>
            </div>
          </div>

          {/* Official Regulations & Disclaimer */}
          <div className="bg-amber-50/90 p-4 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-2">
            <div className="flex items-center justify-between">
              <strong className="font-bold text-amber-900 text-[11px] uppercase tracking-wider">
                Mandatory Test &amp; Interview Guidelines
              </strong>
            </div>
            <ul className="list-disc list-inside text-[11px] space-y-1 text-slate-800 font-medium">
              <li>Candidates must bring original CNIC, educational documents, and this printed slip on test/interview day.</li>
              <li>Report at the venue 30 minutes prior to scheduled time. Electronic gadgets are strictly banned inside the hall.</li>
              <li><em className="font-semibold text-amber-900">Disclaimer:</em> Final candidate selection or employment remains subject to the relevant employer/department's verification and decision.</li>
            </ul>
          </div>

          {/* Footer Bar & WhatsApp CTA inside Printable View */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">JobsHubOfficial Application System</p>
              <p className="text-[10px] text-slate-400">Computer-generated official receipt slip. Tracking ID: {app.referenceNo}</p>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-colors cursor-pointer print:hidden"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contact Support on WhatsApp</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
