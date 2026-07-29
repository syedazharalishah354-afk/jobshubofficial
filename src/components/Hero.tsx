import React from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Search, FileText, CreditCard, Lock } from 'lucide-react';

interface HeroProps {
  onOpenApply: () => void;
  onOpenTrack: () => void;
  appFee?: number;
}

export const Hero: React.FC<HeroProps> = ({ onOpenApply, onOpenTrack, appFee = 300 }) => {
  const [trackInput, setTrackInput] = React.useState('');

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackInput.trim()) {
      onOpenTrack();
    }
  };

  return (
    <section id="hero" className="relative bg-gradient-to-b from-blue-50/70 via-white to-blue-50/30 pt-8 pb-16 border-b border-blue-100/60 overflow-hidden">
      {/* Background Subtle Geometric Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#1e40af_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Hero Copy */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-800 text-xs font-semibold border border-blue-200 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Official Job Application Portal 2026</span>
              <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                Age 18 - 35
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-blue-950 tracking-tight leading-[1.15]">
              Direct Career Applications &amp; <span className="text-blue-600 underline decoration-blue-300 decoration-wavy decoration-2">Verified Testing</span> Portal
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Apply for government and private staff vacancies without creating an account. Simple 2-step CNIC verified process with easy payment verification via JazzCash &amp; Easypaisa.
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={onOpenApply}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Start Application Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenTrack}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-blue-50 text-blue-900 font-semibold text-sm border border-blue-200 shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4 text-blue-600" />
                <span>Track Existing Application</span>
              </button>
            </div>

            {/* Bullet Highlights */}
            <div className="pt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-700 font-medium max-w-xl mx-auto lg:mx-0">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs p-2 rounded-lg border border-slate-100 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No Account Required</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs p-2 rounded-lg border border-slate-100 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>CNIC Verified System</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs p-2 rounded-lg border border-slate-100 shadow-2xs col-span-2 sm:col-span-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Official Slip Generation</span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Card & Quick Status Lookup */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-blue-100 shadow-xl shadow-blue-900/5 relative">
              <div className="absolute -top-3.5 right-6 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Official Verification</span>
              </div>

              <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Application Overview</h3>
                  <p className="text-xs text-slate-500">Fast, secure 3-step application workflow</p>
                </div>
              </div>

              {/* 3 Step Visual Preview */}
              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Personal &amp; CNIC Upload</h4>
                    <p className="text-slate-500 text-[11px]">Fill required details, CNIC number &amp; upload front/back photos.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-blue-50/80 border border-blue-100">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-blue-950">Payment Proof Upload</h4>
                    </div>
                    <p className="text-blue-800/80 text-[11px]">Transfer via JazzCash / Easypaisa &amp; upload screenshot.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-950">Automatic Approval &amp; Slip</h4>
                    <p className="text-emerald-800/80 text-[11px]">Automatic 30s processing issues unique Application Reference ID and printable slip.</p>
                  </div>
                </div>
              </div>

              {/* Quick Tracking Search Box */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                  Quick Track Your Application Status
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackInput}
                    onChange={(e) => setTrackInput(e.target.value)}
                    placeholder="Enter CNIC (e.g. 12345-1234567-1) or Ref #"
                    className="flex-1 text-xs px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  />
                  <button
                    onClick={onOpenTrack}
                    className="px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    Track
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
