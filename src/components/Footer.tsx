import React from 'react';
import { Briefcase, ShieldCheck, Mail, Phone, MapPin, Search, UserCheck, Lock } from 'lucide-react';

interface FooterProps {
  onOpenApply: () => void;
  onOpenTrack: () => void;
  onNavigateSection: (id: string) => void;
  onOpenAdminLogin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenApply,
  onOpenTrack,
  onNavigateSection,
  onOpenAdminLogin
}) => {
  return (
    <footer id="support" className="bg-slate-950 text-slate-300 pt-12 pb-8 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                JobsHub<span className="text-blue-500">Official</span>
              </span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              JobsHubOfficial is a career recruitment portal designed for candidates aged 18 to 35. Offering direct CNIC verified job application workflows and transparent fee payment verification.
            </p>

            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>CNIC &amp; Payment Verification Guarantee</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Quick Navigation</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => onNavigateSection('hero')} className="hover:text-white transition-colors cursor-pointer">
                  Home &amp; Overview
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('vacancies')} className="hover:text-white transition-colors cursor-pointer">
                  Active Vacancies 2026
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('steps')} className="hover:text-white transition-colors cursor-pointer">
                  Application Guidelines
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('interview-policy')} className="hover:text-white transition-colors cursor-pointer">
                  Interview &amp; Test Policy
                </button>
              </li>
              <li>
                <button onClick={onOpenTrack} className="hover:text-white transition-colors cursor-pointer">
                  Track Application Status
                </button>
              </li>
            </ul>
          </div>

          {/* Applicant Actions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Applicant Portal</h4>
            <div className="space-y-2 text-xs">
              <button
                onClick={onOpenApply}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Submit New Application</span>
              </button>

              <button
                onClick={onOpenTrack}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4 text-blue-400" />
                <span>Track Existing Application</span>
              </button>
            </div>
          </div>

          {/* Help & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Help &amp; Support</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Helpline: +92 51 8899770</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>support@jobshubofficial.org</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>Recruitment Directorate, Sector G-8/1, Islamabad, Pakistan</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 JobsHubOfficial. All rights reserved.</p>
          
          {onOpenAdminLogin && (
            <button
              onClick={onOpenAdminLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-bold transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Admin Security Portal</span>
            </button>
          )}
        </div>

      </div>
    </footer>
  );
};
