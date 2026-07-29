import React from 'react';
import { UserCheck, CreditCard, ShieldAlert, FileCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface StepsOverviewProps {
  onOpenApply: () => void;
  appFee?: number;
}

export const StepsOverview: React.FC<StepsOverviewProps> = ({ onOpenApply, appFee = 300 }) => {
  return (
    <section id="steps" className="py-14 bg-blue-50/40 border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-3 py-1 rounded-full uppercase tracking-wider">
            Simple 4-Stage Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-950 mt-2 tracking-tight">
            How the Application Process Works
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-2">
            Follow these transparent steps to submit your application and receive your official reference confirmation slip.
          </p>
        </div>

        {/* Steps Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-blue-500/30">
                  <UserCheck className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  Step 1
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-2">
                1. Personal Information &amp; CNIC
              </h3>
              
              <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Enter Full Name, Father’s Name, CNIC &amp; Contact info.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Select Qualification &amp; Postal Address.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Upload high quality photos of CNIC Front &amp; Back.</span>
                </li>
              </ul>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              Strict real-time validation applied
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-blue-500/30">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  Step 2
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-2">
                2. Fee Payment &amp; Screenshot
              </h3>

              <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Transfer application fee in Step 2.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Pay via JazzCash or Easypaisa account details.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Take a payment screenshot and upload as proof.</span>
                </li>
              </ul>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-blue-700 font-semibold">
              Supports JazzCash &amp; Easypaisa
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-blue-500/30">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  Step 3
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-2">
                3. Automatic Approval
              </h3>

              <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Application information automatically processed.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Required documents &amp; payment proof checked for completeness.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>30-second automatic processing countdown runs after submit.</span>
                </li>
              </ul>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-blue-700 font-semibold">
              Automated 30s processing
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-emerald-500/30">
                  <FileCheck className="w-6 h-6" />
                </div>
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  Step 4
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-2">
                4. Auto-Approval &amp; Application Slip
              </h3>

              <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Status updates to <em>"Auto-Approved / Preliminary Approval"</em>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Generates unique Reference ID (e.g. JHO-2026-98412).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Instant printable official application slip with WhatsApp contact button.</span>
                </li>
              </ul>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-emerald-700 font-bold">
              Official confirmation slip generated
            </div>
          </div>

        </div>

        {/* CTA Box */}
        <div className="mt-10 bg-blue-900 rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-lg sm:text-xl font-bold">Ready to submit your application?</h3>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl">
              Takes less than 5 minutes. Prepare your CNIC photos and JazzCash/Easypaisa payment receipt.
            </p>
          </div>

          <button
            onClick={onOpenApply}
            className="px-6 py-3 rounded-xl bg-white hover:bg-blue-50 text-blue-950 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Proceed to Step 1 Form</span>
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </button>
        </div>

      </div>
    </section>
  );
};
