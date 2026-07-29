import React, { useState, useEffect } from 'react';
import { Application, JobPosition } from '../types.js';
import { fetchUserApplications } from '../services/api.js';
import {
  User,
  Mail,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Briefcase,
  PlusCircle,
  LogOut,
  RefreshCw,
  ExternalLink,
  Shield,
  CreditCard,
  Hash
} from 'lucide-react';

interface UserDashboardProps {
  user: { id: string; fullName: string; email: string; cnic: string; role: 'user' };
  token: string;
  onLogout: () => void;
  onApplyNew: () => void;
  onViewSlip: (app: Application) => void;
  onOpenPaymentWizard: (app: Application) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  token,
  onLogout,
  onApplyNew,
  onViewSlip,
  onOpenPaymentWizard
}) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadApps = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserApplications(token);
      setApplications(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load user applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, [token]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Submitted Successfully':
      case 'Payment Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved &amp; Submitted
          </span>
        );
      case 'Payment Verification Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            Payment Verification Pending
          </span>
        );
      case 'Payment Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            Payment Pending
          </span>
        );
      case 'Payment Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Payment Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* User Header Profile Card */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl shadow-xl text-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-blue-700/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-2xl font-black shrink-0">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
                  Applicant Account
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">{user.fullName}</h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-blue-100/90 mt-2 font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-300" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-300" />
                  CNIC: {user.cnic}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={onApplyNew}
              className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Apply For New Job
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 border border-white/20"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Dashboard Main Content */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Your Job Applications</h2>
              <p className="text-slate-500 text-xs mt-0.5">Track live verification status and view reference slips.</p>
            </div>
            <button
              onClick={loadApps}
              className="p-2 text-slate-600 hover:text-blue-600 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-2xs space-y-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-bold text-slate-700">Loading your applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-2xs space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">No Applications Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  You have not submitted any job application under this account yet.
                </p>
              </div>
              <button
                onClick={onApplyNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Start New Application
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6 space-y-5">
                    
                    {/* Top Row: Position & Reference No */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-extrabold text-[10px] uppercase tracking-wider rounded border border-blue-100">
                            {app.jobPosition}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            Submitted: {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900">{app.jobPosition}</h3>
                      </div>

                      <div className="flex flex-col sm:items-end gap-1.5">
                        <div className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-md border border-slate-200 flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-slate-500" />
                          Ref #: {app.referenceNo}
                        </div>
                        <div>{getStatusBadge(app.status)}</div>
                      </div>
                    </div>

                    {/* Middle Row: Applicant Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium block">Applicant Name</span>
                        <strong className="text-slate-800 font-bold block mt-0.5">{app.fullName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">CNIC Number</span>
                        <strong className="text-slate-800 font-bold block mt-0.5">{app.cnic}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Qualification</span>
                        <strong className="text-slate-800 font-bold block mt-0.5">{app.qualification}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Payment Method</span>
                        <strong className="text-slate-800 font-bold block mt-0.5">{app.paymentMethod || 'JazzCash'}</strong>
                      </div>
                    </div>

                    {/* Rejection Alert if payment failed */}
                    {app.status === 'Payment Rejected' && app.rejectionReason && (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                        <strong className="font-extrabold text-rose-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          Payment Verification Failed:
                        </strong>
                        <p className="text-rose-700 leading-relaxed pl-5">{app.rejectionReason}</p>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-slate-500 font-medium">
                        {app.status === 'Submitted Successfully' || app.status === 'Payment Approved' ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Official application pass slip is ready to view &amp; print.
                          </span>
                        ) : (
                          <span>Status last updated: {new Date(app.updatedAt).toLocaleTimeString()}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {(app.status === 'Payment Pending' || app.status === 'Payment Rejected') && (
                          <button
                            onClick={() => onOpenPaymentWizard(app)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Upload Payment Screenshot
                          </button>
                        )}

                        {(app.status === 'Submitted Successfully' || app.status === 'Payment Approved') && (
                          <button
                            onClick={() => onViewSlip(app)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View Application Pass Slip
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
