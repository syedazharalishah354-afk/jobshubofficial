import React from 'react';
import { FileText, ShieldAlert, CheckCircle2, Clock, AlertTriangle, UserCheck } from 'lucide-react';

interface InterviewPolicySectionProps {
  policyText?: string;
}

export const InterviewPolicySection: React.FC<InterviewPolicySectionProps> = ({ policyText }) => {
  const defaultPolicy = `1. Original Documents Mandatory: Candidates must bring their Original CNIC, Educational Certificates, and Printed Application Pass Slip on the interview day.
2. Schedule Notification: Official interview dates, venue details, and reporting times will be communicated via SMS and Email after application fee & document verification.
3. Reporting Time: Candidates must report at the test/interview venue at least 30 minutes before the scheduled time. Late arrivals (beyond 15 minutes) will not be permitted entry.
4. Electronic Devices Prohibited: Mobile phones, smartwatches, calculators, and electronic storage devices are strictly banned inside the examination/interview premises.
5. TA / DA Notice: No Traveling Allowance or Daily Allowance (TA/DA) will be paid to candidates for attending the test or interview.
6. Verification & Disqualification: Any misrepresentation, forged documents, or impersonation will lead to instant disqualification and legal prosecution under applicable laws.`;

  const policy = policyText || defaultPolicy;

  const keyRules = [
    {
      icon: <UserCheck className="w-5 h-5 text-blue-600" />,
      title: "Original Documents",
      desc: "Must present original CNIC, degrees/certificates & printed pass slip at entry."
    },
    {
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      title: "30-Min Early Reporting",
      desc: "Arrive 30 minutes before time. Entry closes 15 minutes past start time."
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
      title: "No Gadgets Allowed",
      desc: "Mobile phones, smartwatches, and electronics are strictly banned inside."
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-blue-600" />,
      title: "No TA / DA",
      desc: "No travel or daily allowance provided for appearing in test or interview."
    }
  ];

  return (
    <section id="interview-policy" className="py-14 bg-gradient-to-b from-white to-blue-50/50 border-b border-blue-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 bg-blue-100/80 px-3.5 py-1 rounded-full uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            Official Portal Policy
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-950 mt-2 tracking-tight">
            Interview &amp; Screening Test Policy
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-2">
            Please review the official rules, candidate regulations, and venue guidelines prior to attending your screening test or interview.
          </p>
        </div>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {keyRules.map((rule, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-blue-100 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  {rule.icon}
                </div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{rule.title}</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{rule.desc}</p>
            </div>
          ))}
        </div>

        {/* Main Detailed Policy Card */}
        <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6 sm:p-8 relative overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-950 text-white flex items-center justify-center font-bold">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Official Rules &amp; Regulations
              </h3>
              <p className="text-xs text-slate-500">
                Authorized policy enforced by the recruitment &amp; selection panel
              </p>
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-200/80">
            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-line space-y-2">
              {policy}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Policy active for all candidate test &amp; interview schedules
            </span>
            <span className="text-[11px] text-slate-400">
              Updated by Portal Admin Management
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
