import React, { useState } from 'react';
import { trackApplication, submitPaymentProof, uploadImageFile } from '../services/api.js';
import { Application } from '../types.js';
import { X, Search, CheckCircle2, Clock, XCircle, AlertCircle, Upload, FileText, ArrowRight, RefreshCw, Printer } from 'lucide-react';

interface TrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewSlip?: (app: Application) => void;
}

export const TrackModal: React.FC<TrackModalProps> = ({ isOpen, onClose, onViewSlip }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Application[] | null>(null);

  // For re-uploading payment if rejected
  const [activeAppToReupload, setActiveAppToReupload] = useState<Application | null>(null);
  const [reuploadMethod, setReuploadMethod] = useState<'JazzCash' | 'Easypaisa'>('JazzCash');
  const [reuploadFile, setReuploadFile] = useState<File | null>(null);
  const [reuploadPreview, setReuploadPreview] = useState<string | null>(null);
  const [reuploadTxnId, setReuploadTxnId] = useState('');
  const [reuploading, setReuploading] = useState(false);
  const [reuploadSuccess, setReuploadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter your CNIC Number or Reference Number.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setActiveAppToReupload(null);

    try {
      const data = await trackApplication(query.trim());
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'No application records found.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReuploadFile(file);
      setReuploadPreview(URL.createObjectURL(file));
    }
  };

  const handleReuploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAppToReupload) return;
    if (!reuploadFile && !reuploadPreview) {
      alert('Please select a payment screenshot image.');
      return;
    }

    setReuploading(true);
    try {
      let imageUrl = activeAppToReupload.paymentScreenshotUrl || '';
      if (reuploadFile) {
        imageUrl = await uploadImageFile(reuploadFile);
      }

      const res = await submitPaymentProof(activeAppToReupload.id, {
        paymentMethod: reuploadMethod,
        paymentScreenshotUrl: imageUrl,
        paymentTxnId: reuploadTxnId
      });

      setReuploadSuccess('Your payment proof has been re-uploaded successfully. Payment status is now Verification Pending.');
      setActiveAppToReupload(null);
      // Refresh search
      const updatedList = await trackApplication(query.trim());
      setResults(updatedList);
    } catch (err: any) {
      alert(err.message || 'Failed to re-upload payment proof.');
    } finally {
      setReuploading(false);
    }
  };

  const getStatusBadge = (status: Application['status']) => {
    switch (status) {
      case 'Submitted Successfully':
      case 'Payment Approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Submitted Successfully
          </span>
        );
      case 'Payment Verification Pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            Payment Verification Pending
          </span>
        );
      case 'Payment Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Payment Rejected
          </span>
        );
      case 'Payment Pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Payment Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-blue-100 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-blue-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-800 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Track Application Status</h3>
              <p className="text-xs text-blue-200">Check live status by CNIC or Reference Number</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter 13-Digit CNIC (e.g., 12345-1234567-1) or Ref # (e.g. JHO-2026-12345)"
                className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Search</span>
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Search Failed</p>
                <p className="text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Success Re-upload Message */}
          {reuploadSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Payment Re-uploaded</p>
                <p className="mt-0.5">{reuploadSuccess}</p>
              </div>
            </div>
          )}

          {/* Results List */}
          {results && results.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Found {results.length} Application Record(s)
              </h4>

              {results.map((app) => (
                <div
                  key={app.id}
                  className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 space-y-4"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[11px] font-bold text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded">
                        REF: {app.referenceNo}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{app.fullName}</h4>
                      <p className="text-xs text-slate-600">Father’s Name: {app.fatherName} | CNIC: {app.cnic}</p>
                    </div>

                    <div className="sm:text-right">
                      {getStatusBadge(app.status)}
                      <p className="text-[11px] text-slate-400 mt-1">
                        Applied: {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Application Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Job Position</span>
                      <strong className="text-slate-900">{app.jobPosition}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Mobile Number</span>
                      <strong className="text-slate-900">{app.mobile}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Qualification</span>
                      <strong className="text-slate-900">{app.qualification}</strong>
                    </div>
                  </div>

                  {/* If Rejected: Display Rejection Reason & Re-upload CTA */}
                  {app.status === 'Payment Rejected' && (
                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-xs space-y-3">
                      <div className="flex items-start gap-2 text-rose-900">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold block">Reason for Payment Rejection:</strong>
                          <p className="text-rose-800 mt-0.5">{app.rejectionReason || 'Payment screenshot could not be verified.'}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setActiveAppToReupload(app);
                          setReuploadMethod(app.paymentMethod || 'JazzCash');
                          setReuploadFile(null);
                          setReuploadPreview(null);
                        }}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Re-upload Correct Payment Screenshot</span>
                      </button>
                    </div>
                  )}

                  {/* View Slip Button for active applications */}
                  {app.status !== 'Payment Rejected' && onViewSlip && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          onViewSlip(app);
                          onClose();
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>View / Print Official Confirmation Slip</span>
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}

          {/* Re-upload Modal Form inline */}
          {activeAppToReupload && (
            <div className="bg-blue-50/70 rounded-2xl p-5 border border-blue-200 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                <h4 className="font-bold text-sm text-blue-950 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Re-upload Payment Screenshot for Ref #{activeAppToReupload.referenceNo}
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveAppToReupload(null)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleReuploadSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Select Payment Method Used</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReuploadMethod('JazzCash')}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold ${
                        reuploadMethod === 'JazzCash'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      JazzCash
                    </button>
                    <button
                      type="button"
                      onClick={() => setReuploadMethod('Easypaisa')}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold ${
                        reuploadMethod === 'Easypaisa'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Easypaisa
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Upload New Payment Screenshot *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer"
                  />
                  {reuploadPreview && (
                    <div className="mt-2">
                      <img src={reuploadPreview} alt="New Proof Preview" className="h-28 rounded-lg border object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Transaction ID / Sender Mobile (Optional)</label>
                  <input
                    type="text"
                    value={reuploadTxnId}
                    onChange={(e) => setReuploadTxnId(e.target.value)}
                    placeholder="e.g. 03001234567 or TID 987654321"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveAppToReupload(null)}
                    className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reuploading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5"
                  >
                    {reuploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>Submit Payment Proof</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
