import React from 'react';
import { Briefcase, ShieldCheck, Search, UserCheck, Lock, Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';

interface HeaderProps {
  onOpenApply: (positionName?: string) => void;
  onOpenTrack: () => void;
  onNavigateSection: (id: string) => void;
  onOpenAdminLogin: () => void;
  isAdminLoggedIn?: boolean;
  onOpenAdminPanel?: () => void;
  onLogoutAdmin?: () => void;
  onSelectCampaign?: (slug: string) => void;
  activeCampaignSlug?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenApply,
  onOpenTrack,
  onNavigateSection,
  onOpenAdminLogin,
  isAdminLoggedIn,
  onOpenAdminPanel,
  onLogoutAdmin,
  onSelectCampaign,
  activeCampaignSlug
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      {/* Top Announcement Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] uppercase font-bold tracking-wider">
              Official Portal
            </span>
            <span className="hidden sm:inline text-slate-200">Recruitment &amp; Career Testing Services 2026</span>
            <span className="sm:hidden text-slate-200">Recruitment Portal 2026</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300 text-xs">
            <span className="bg-slate-800 text-blue-300 px-3 py-0.5 rounded-full border border-slate-700 text-[11px] font-semibold">
              Official CNIC Verification System
            </span>
            <button
              onClick={onOpenTrack}
              className="hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
            >
              Check Status
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => onNavigateSection('hero')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="bg-blue-600 w-8 h-8 rounded flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-blue-900 font-sans">
                JobsHub<span className="font-normal text-blue-600">Official</span>
              </span>
              <ShieldCheck className="w-4 h-4 text-blue-600" aria-label="Verified Official Portal" />
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-5 text-xs lg:text-sm font-semibold text-slate-600">
          <button
            onClick={() => {
              if (onSelectCampaign) onSelectCampaign('all');
              onNavigateSection('hero');
            }}
            className={`hover:text-blue-600 transition-colors cursor-pointer ${
              !activeCampaignSlug || activeCampaignSlug === 'all' ? 'text-blue-600 font-bold' : ''
            }`}
          >
            All Jobs
          </button>

          {/* Quick Campaign Navs */}
          <button
            onClick={() => onSelectCampaign && onSelectCampaign('freelancers')}
            className={`hover:text-blue-600 transition-colors cursor-pointer ${
              activeCampaignSlug === 'freelancers' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-0.5' : ''
            }`}
          >
            Freelancers
          </button>

          <button
            onClick={() => onSelectCampaign && onSelectCampaign('suthra-punjab')}
            className={`hover:text-blue-600 transition-colors cursor-pointer ${
              activeCampaignSlug === 'suthra-punjab' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-0.5' : ''
            }`}
          >
            Suthra Punjab
          </button>

          <button
            onClick={() => onSelectCampaign && onSelectCampaign('factory-workers')}
            className={`hover:text-blue-600 transition-colors cursor-pointer ${
              activeCampaignSlug === 'factory-workers' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-0.5' : ''
            }`}
          >
            Factory Workers
          </button>

          <button
            onClick={() => onSelectCampaign && onSelectCampaign('government')}
            className={`hover:text-blue-600 transition-colors cursor-pointer ${
              activeCampaignSlug === 'government' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-0.5' : ''
            }`}
          >
            Government
          </button>

          <button
            onClick={() => onSelectCampaign && onSelectCampaign('private')}
            className={`hover:text-blue-600 transition-colors cursor-pointer ${
              activeCampaignSlug === 'private' ? 'text-blue-600 font-bold border-b-2 border-blue-600 pb-0.5' : ''
            }`}
          >
            Private
          </button>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onOpenTrack}
            className="px-3.5 py-2 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            Track Application
          </button>

          <button
            onClick={() => onOpenApply()}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <UserCheck className="w-4 h-4" />
            Apply Now
          </button>

          {/* Dedicated Admin Portal Button with Lock Icon */}
          {isAdminLoggedIn ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAdminPanel}
                className="px-3.5 py-2 rounded-lg bg-slate-900 text-blue-400 hover:bg-slate-800 font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-blue-900"
              >
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                Admin Dashboard
              </button>
              <button
                onClick={onLogoutAdmin}
                className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                title="Sign Out Admin Session"
              >
                Exit
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Authorized Personnel Admin Login"
            >
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Admin Portal</span>
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex md:hidden items-center gap-2">
          {isAdminLoggedIn ? (
            <button
              onClick={onOpenAdminPanel}
              className="px-2.5 py-1.5 bg-slate-900 text-blue-400 rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <Lock className="w-3.5 h-3.5" />
              Admin
            </button>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="px-2.5 py-1.5 bg-slate-900 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              Admin
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Job Campaign</div>
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
            <button
              onClick={() => {
                if (onSelectCampaign) onSelectCampaign('freelancers');
                setMobileMenuOpen(false);
              }}
              className="py-2 px-3 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-800 text-xs font-semibold text-left border border-slate-200"
            >
              💼 Freelancers
            </button>
            <button
              onClick={() => {
                if (onSelectCampaign) onSelectCampaign('suthra-punjab');
                setMobileMenuOpen(false);
              }}
              className="py-2 px-3 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-800 text-xs font-semibold text-left border border-slate-200"
            >
              🧹 Suthra Punjab
            </button>
            <button
              onClick={() => {
                if (onSelectCampaign) onSelectCampaign('factory-workers');
                setMobileMenuOpen(false);
              }}
              className="py-2 px-3 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-800 text-xs font-semibold text-left border border-slate-200"
            >
              🏭 Factory Workers
            </button>
            <button
              onClick={() => {
                if (onSelectCampaign) onSelectCampaign('government');
                setMobileMenuOpen(false);
              }}
              className="py-2 px-3 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-800 text-xs font-semibold text-left border border-slate-200"
            >
              🏛️ Government
            </button>
            <button
              onClick={() => {
                if (onSelectCampaign) onSelectCampaign('private');
                setMobileMenuOpen(false);
              }}
              className="col-span-2 py-2 px-3 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-800 text-xs font-semibold text-left border border-slate-200"
            >
              🏢 Private Jobs
            </button>
          </div>
          <button
            onClick={() => {
              onNavigateSection('hero');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-slate-800 border-b border-slate-100"
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigateSection('vacancies');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-slate-800 border-b border-slate-100"
          >
            Active Vacancies
          </button>
          <button
            onClick={() => {
              onNavigateSection('steps');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-slate-800 border-b border-slate-100"
          >
            Guidelines
          </button>
          <button
            onClick={() => {
              onNavigateSection('support');
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm font-medium text-slate-800 border-b border-slate-100"
          >
            Support
          </button>

          <div className="pt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onOpenTrack();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              Track Status
            </button>

            {isAdminLoggedIn ? (
              <button
                onClick={() => {
                  if (onOpenAdminPanel) onOpenAdminPanel();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-lg bg-slate-900 text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                Admin Panel
              </button>
            ) : (
              <button
                onClick={() => {
                  onOpenAdminLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                Admin Portal
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
