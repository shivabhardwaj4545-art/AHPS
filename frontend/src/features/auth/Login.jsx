import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authContext.jsx';
import {
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  Fingerprint,
  ShieldCheck,
  Building,
  School,
  Users,
  Shield,
  Clock,
  CheckCircle2,
  LogIn,
  CreditCard,
  Headphones,
  Calendar,
} from 'lucide-react';

export const Login = () => {
  const [selectedRole, setSelectedRole] = useState('principal');
  const [activeTab, setActiveTab] = useState('email'); // 'id' or 'email'
  const [identifier, setIdentifier] = useState('admin@school.edu');
  const [password, setPassword] = useState('Admin@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError('');
    if (role === 'teacher') {
      if (activeTab === 'email') setIdentifier('teacher@school.edu');
      else setIdentifier('AHPS-T-042');
      setPassword('Teacher@12345');
    } else {
      if (activeTab === 'email') setIdentifier('admin@school.edu');
      else setIdentifier('AHPS-ADM-01');
      setPassword('Admin@12345');
    }
  };

  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    if (tab === 'id') {
      if (selectedRole === 'teacher') setIdentifier('AHPS-T-042');
      else setIdentifier('AHPS-ADM-01');
    } else {
      if (selectedRole === 'teacher') setIdentifier('teacher@school.edu');
      else setIdentifier('admin@school.edu');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // If user typed an ID, map it to demo email if needed
      let loginEmail = identifier;
      if (!loginEmail.includes('@')) {
        if (selectedRole === 'teacher') loginEmail = 'teacher@school.edu';
        else loginEmail = 'admin@school.edu';
      }

      const user = await login(loginEmail, password);
      if (user.role === 'TEACHER') {
        navigate('/portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const triggerHardwareReader = (type) => {
    setToastMsg(`${type} initialized. Place credentials on reader.`);
    setTimeout(() => {
      setToastMsg(null);
    }, 3000);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 min-h-[calc(100vh-4rem)] rounded-2xl overflow-hidden shadow-2xl bg-white border border-[#C5C6D1]/30">
      {/* Left Hero Identity Panel (5 Cols) */}
      <div className="xl:col-span-5 bg-gradient-to-br from-[#001243] via-[#14275E] to-[#001849] text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        {/* Decorative Watermark Overlay */}
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#85A6FF]/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 bottom-0 w-80 h-80 rounded-full bg-[#EBC166]/10 blur-2xl pointer-events-none"></div>

        {/* Top Crest & School Regalia Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FFDF9E]/20 text-[#FFDF9E] text-xs uppercase tracking-widest font-bold backdrop-blur-md">
              Faculty Access Portal
            </span>
            <span className="text-[#FFDF9E]/70 text-xs">•</span>
            <span className="text-[#DCE1FF] text-xs tracking-wide">Est. 1998 • Affiliated to CBSE</span>
          </div>

          {/* School Crest Presentation */}
          <div className="flex items-center gap-5 my-6 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
            <div className="w-16 h-16 shrink-0 bg-white/20 rounded-xl p-2 flex items-center justify-center shadow-lg">
              <img
                src="/logo.png"
                alt="Achievers Home Public School Crest"
                className="w-full h-full object-contain drop-shadow-md"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <h1 className="font-serif text-xl md:text-2xl font-bold text-white leading-tight tracking-tight">
                Achievers Home Public School
              </h1>
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#FFDF9E] mt-1 font-bold">
                Desire • Dedication • Discipline
              </p>
            </div>
          </div>

          <p className="text-xs md:text-sm text-[#B5C4FF] mt-4 leading-relaxed font-normal">
            The official faculty gateway for daily attendance verification, timetable adjustments, bio-metric registry synchronization, and academic administrative compliance.
          </p>

          {/* Institutional Quote Card */}
          <div className="mt-8 p-5 rounded-xl bg-white/10 backdrop-blur-sm relative border border-white/10">
            <span className="absolute right-4 top-3 text-[#FFDF9E]/25 text-5xl font-serif select-none">
              “
            </span>
            <p className="font-serif text-sm md:text-base text-[#FFDF9E] italic leading-snug">
              “Teaching is the profession that teaches all of the other professions.”
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-0.5 w-6 bg-[#EBC166]"></span>
              <span className="text-[10px] uppercase font-bold text-[#DCE1FF] tracking-wider">
                Academic Council Directorate
              </span>
            </div>
          </div>
        </div>

        {/* Live Terminal Badges & System Metrics */}
        <div className="relative z-10 pt-8 mt-6 border-t border-white/10">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-2 text-[#FFDF9E] mb-1">
                <Fingerprint className="h-4 w-4" />
                <span className="text-[10px] uppercase font-bold">Bio-Terminal A</span>
              </div>
              <span className="text-xs text-white flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> 99.4% Synchronized
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-2 text-[#DCE1FF] mb-1">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[10px] uppercase font-bold">Encryption</span>
              </div>
              <span className="text-xs text-white font-medium">AES-256 Institutional</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#B5C4FF]">
            <span className="flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-[#FFDF9E]" />
              Main Campus, Sector 4
            </span>
            <span className="font-mono">IP: 192.168.14.88</span>
          </div>
        </div>
      </div>

      {/* Right Side Authentication Form (7 Cols) */}
      <div className="xl:col-span-7 bg-white p-8 lg:p-14 flex flex-col justify-between">
        <div>
          {/* Top Form Header & Status */}
          <div className="flex items-start justify-between mb-6 pb-2">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBEDFF] text-[#001243] mb-2 font-bold text-xs">
                <Clock className="h-3.5 w-3.5 text-[#385AAF]" />
                <span className="uppercase tracking-wide text-[10px]">Morning Sign-In Window</span>
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#001243] tracking-tight">
                Welcome Faculty & Staff
              </h2>
              <p className="text-xs text-[#757681] mt-1">
                Please authenticate your identity to mark today's physical roster attendance.
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-[#757681] tracking-wider">
                Daily Cutoff
              </span>
              <div className="flex items-center gap-1 text-xs font-bold text-[#BA1A1A] bg-[#FFDAD6] px-3 py-1 rounded-full mt-1">
                <Clock className="h-3 w-3" />
                <span>08:15 AM IST</span>
              </div>
            </div>
          </div>

          {/* Role Select Pills */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold text-[#001243] uppercase tracking-wider mb-2">
              Designated Faculty Role
            </label>
            <div className="grid grid-cols-2 gap-2.5 p-1 rounded-xl bg-[#F2F3FF] border border-[#C5C6D1]/30">
              <button
                type="button"
                onClick={() => handleRoleSelect('teacher')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'teacher'
                    ? 'bg-[#001243] text-[#FFDF9E] shadow-sm'
                    : 'text-[#454650] hover:text-[#001243]'
                }`}
              >
                <School className="h-4 w-4" />
                <span>Teacher</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('principal')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'principal'
                    ? 'bg-[#001243] text-[#FFDF9E] shadow-sm'
                    : 'text-[#454650] hover:text-[#001243]'
                }`}
              >
                <Shield className="h-4 w-4" />
                <span>Principal / Admin</span>
              </button>
            </div>
          </div>

          {/* Login Tabs: Staff ID vs Email */}
          <div className="flex items-center gap-4 mb-4 border-b border-[#F2F3FF]">
            <button
              type="button"
              onClick={() => handleTabSelect('id')}
              className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'id'
                  ? 'border-[#001243] text-[#001243]'
                  : 'border-transparent text-[#757681] hover:text-[#001243]'
              }`}
            >
              <Fingerprint className="h-4 w-4 text-[#385AAF]" />
              <span>Staff Institutional ID</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabSelect('email')}
              className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'email'
                  ? 'border-[#001243] text-[#001243]'
                  : 'border-transparent text-[#757681] hover:text-[#001243]'
              }`}
            >
              <Mail className="h-4 w-4 text-[#385AAF]" />
              <span>Official AHPS Email</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#FFDAD6] text-[#93000A] rounded-xl flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Interactive Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#001243]">
                  {activeTab === 'id' ? 'Faculty Identification Number' : 'Official Email Address'}
                </label>
                <span className="text-[10px] text-[#385AAF] font-bold">Verified Database</span>
              </div>
              <div className="relative">
                {activeTab === 'id' ? (
                  <Fingerprint className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#757681]" />
                ) : (
                  <Mail className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#757681]" />
                )}
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={activeTab === 'id' ? 'e.g. AHPS-T-042' : 'e.g. teacher@school.edu'}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F2F3FF] text-xs text-[#0D1A3C] font-semibold placeholder:text-[#757681] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#385AAF] border border-transparent focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#001243]">
                  Portal Security Pin / Password
                </label>
                <a href="#" className="text-[11px] text-[#385AAF] font-bold hover:underline">
                  Forgot Security PIN?
                </a>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#757681]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your confidential password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#F2F3FF] text-xs text-[#0D1A3C] font-mono font-semibold placeholder:text-[#757681] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#385AAF] border border-transparent focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#757681] hover:text-[#001243] p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#001243] accent-[#001243] cursor-pointer"
                />
                <span className="text-xs text-[#454650] font-medium">
                  Remember this faculty terminal for 12 hours
                </span>
              </label>
              <span className="text-[10px] text-[#757681] font-semibold flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600" /> SSL Secured
              </span>
            </div>

            {/* Submit Button with Gold Hairline Trim */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-[#001243] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#14275E] active:scale-[0.99] transition-all shadow-lg group relative overflow-hidden cursor-pointer disabled:opacity-50"
              >
                <span className="absolute inset-x-0 top-0 h-0.5 bg-[#FFDF9E]"></span>
                <LogIn className="h-4 w-4 group-hover:translate-x-0.5 transition-transform text-[#FFDF9E]" />
                <span>{loading ? 'Authenticating Identity...' : 'Sign In to Attendance Portal'}</span>
              </button>
            </div>
          </form>

          {/* Biometric Alternative Option */}
          <div className="mt-6 pt-5 border-t border-[#F2F3FF]">
            <div className="relative flex items-center justify-center mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-[#C5C6D1]/30"></div>
              </div>
              <span className="relative px-3 bg-white text-[10px] uppercase font-bold tracking-wider text-[#757681]">
                Or Use Physical Hardware Reader
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => triggerHardwareReader('Optical Biometric Scanner')}
                className="flex items-center justify-center gap-3 p-3 rounded-xl bg-[#F2F3FF] hover:bg-[#EBEDFF] transition-all group cursor-pointer border border-[#C5C6D1]/20"
              >
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-[#001243] group-hover:scale-110 transition-all shadow-sm">
                  <Fingerprint className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-[#0D1A3C]">Biometric Scanner</span>
                  <span className="block text-[10px] text-[#757681]">Optical Desk Unit</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => triggerHardwareReader('RFID Smart Badge Reader')}
                className="flex items-center justify-center gap-3 p-3 rounded-xl bg-[#F2F3FF] hover:bg-[#EBEDFF] transition-all group cursor-pointer border border-[#C5C6D1]/20"
              >
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-[#001243] group-hover:scale-110 transition-all shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-[#0D1A3C]">RFID Smart Badge</span>
                  <span className="block text-[10px] text-[#757681]">Tap NFC Card Here</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Institutional Footer Notices */}
        <div className="mt-6 pt-4 border-t border-[#F2F3FF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#757681]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#DAE1FF] flex items-center justify-center text-[#1A4195]">
              <Headphones className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-[#001243]">
                AHPS IT Helpdesk
              </span>
              <span className="block text-[11px] text-[#757681]">
                Ext. 402 • it-support@achievershome.edu.in
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F2F3FF] text-[#001243] font-semibold text-[10px]">
            <Calendar className="h-3 w-3 text-[#392800]" />
            <span>Academic Cycle 2024-2025</span>
          </div>
        </div>
      </div>

      {/* Floating toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#001243] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-[#FFDF9E]">
          <CheckCircle2 className="h-5 w-5 text-[#FFDF9E]" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

export default Login;
