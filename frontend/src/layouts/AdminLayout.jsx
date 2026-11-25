import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/authContext.jsx';
import {
  LayoutDashboard,
  CalendarCheck,
  BarChart3,
  Users,
  CalendarDays,
  UserCheck,
  Banknote,
  Clock,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Bell,
  Search,
  Sparkles,
  ChevronDown,
  FileSpreadsheet,
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, logout, isTeacher, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const navItems = [
    ...(isTeacher
      ? [
          {
            name: 'Teacher Portal',
            path: '/portal',
            icon: GraduationCap,
          },
          {
            name: 'My Leaves',
            path: '/my-leaves',
            icon: UserCheck,
          },
          {
            name: 'HRMS Reports',
            path: '/hrms-reports',
            icon: FileSpreadsheet,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            name: 'Dashboard',
            path: '/dashboard',
            icon: LayoutDashboard,
          },
          {
            name: 'HRMS Reports',
            path: '/hrms-reports',
            icon: FileSpreadsheet,
          },
          {
            name: 'Mark Daily Attendance',
            path: '/attendance/daily',
            icon: CalendarCheck,
          },
          {
            name: 'Attendance Reports',
            path: '/reports',
            icon: BarChart3,
          },
          {
            name: 'Teacher Profiles',
            path: '/teachers',
            icon: Users,
          },
          {
            name: 'Monthly Register',
            path: '/attendance/monthly',
            icon: CalendarDays,
          },
          {
            name: 'Leave Management',
            path: '/leaves',
            icon: UserCheck,
          },
          {
            name: 'Payroll & Salaries',
            path: '/payroll',
            icon: Banknote,
          },
          {
            name: 'Settings & Timings',
            path: '/settings',
            icon: Clock,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#FAF8FF] flex flex-col md:flex-row font-sans text-[#0D1A3C]">
      {/* Mobile Top App Bar */}
      <div className="md:hidden bg-[#001243] text-white px-4 py-3 flex items-center justify-between border-b border-[#14275E] sticky top-0 z-50">
        <div className="flex items-center space-x-2.5">
          <div className="p-1 bg-white/10 backdrop-blur rounded-lg border border-white/20">
            <img
              src="/logo.png"
              alt="AHPS Crest"
              className="h-8 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <div>
            <span className="font-serif font-bold text-sm tracking-wide block leading-tight text-white">
              Achievers Home
            </span>
            <span className="text-[10px] text-[#FFDF9E] uppercase tracking-widest font-semibold">
              Public School
            </span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-[#14275E] transition-colors cursor-pointer"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Desktop / Off-Canvas Sidebar */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen w-72 bg-[#14275E] text-[#7F90CD] flex flex-col justify-between shadow-xl transition-transform duration-200 ease-in-out shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Institutional Crest Header */}
          <div className="p-5 flex flex-col items-center text-center bg-[#001243] shrink-0 border-b border-[#FFDF9E]/20">
            <div className="flex items-center justify-center p-2 rounded-xl bg-white/10 backdrop-blur-md mb-2 shadow-inner border border-white/15">
              <img
                src="/logo.png"
                alt="AHPS Crest Logo"
                className="h-11 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <h1 className="font-serif text-lg font-bold text-white tracking-tight leading-snug">
              Achievers Home Public School
            </h1>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-[#FFDF9E]">
              Desire • Dedication • Discipline
            </p>
          </div>

          <div className="h-[1px] w-full bg-[#FFDF9E]/20"></div>

          {/* Nav Items */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                      isActive
                        ? 'bg-[#001243] text-[#FFDF9E] border-l-4 border-[#FFDF9E] shadow-sm pl-4'
                        : 'text-[#B5C4FF] hover:bg-[#001243]/50 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="h-4 w-4 shrink-0 text-[#FFDF9E]/80" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        item.badgeClass || 'bg-[#FFDF9E] text-[#001243]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Area */}
        <div className="p-3 bg-[#001243]/80 border-t border-white/10 shrink-0 space-y-2.5">
          {/* Institutional ERP Badge */}
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#14275E]/50 border border-white/5">
            <div className="w-7 h-7 rounded-lg bg-[#FFDF9E]/20 flex items-center justify-center text-[#FFDF9E] shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-wider text-[#B5C4FF] font-semibold leading-none">
                Institutional ERP
              </span>
              <span className="text-xs font-bold text-[#FFDF9E] tracking-tight leading-tight mt-0.5">
                v2.4 AHPS Portal
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          </div>

          {/* User Profile Pill & Logout */}
          <div className="flex items-center justify-between pt-1 px-1">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#385AAF] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#FFDF9E]/40 shrink-0">
                {user?.name?.[0] || 'A'}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {user?.name || 'Dr. Sunita Sharma'}
                </p>
                <p className="text-[10px] text-[#B5C4FF] font-medium truncate uppercase tracking-wider">
                  {user?.role?.replace(/_/g, ' ') || 'Principal / Admin'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-[#B5C4FF] hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Navbar */}
        <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-[#C5C6D1]/30 sticky top-0 z-30 px-6 flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          {/* Left: Academic Session & Date Time */}
          <div className="flex items-center gap-5 min-w-0">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#001243] uppercase tracking-wider">
                Session 2024-25 | Academic Term I
              </span>
              <span className="text-[11px] text-[#454650] flex items-center gap-1 font-medium mt-0.5">
                <Clock className="h-3 w-3 text-[#385AAF]" />
                {formattedDate} • {formattedTime}
              </span>
            </div>

            <div className="h-7 w-[1px] bg-[#C5C6D1]/40 hidden lg:block"></div>

            {/* Global Search Input */}
            <div className="relative hidden xl:block w-72">
              <Search className="h-3.5 w-3.5 text-[#757681] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teacher by name or ID..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#F2F3FF] text-xs font-medium text-[#0D1A3C] placeholder:text-[#757681] focus:outline-none focus:ring-1 focus:ring-[#385AAF] border border-transparent focus:border-[#385AAF]/30 transition-all"
              />
            </div>
          </div>

          {/* Right: Notifications, Profile Pill */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              title="Notifications"
              className="relative p-2 rounded-full hover:bg-[#E3E7FF] transition-colors text-[#454650] hover:text-[#0D1A3C] cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EBC166] ring-2 ring-white"></span>
            </button>

            <div className="h-6 w-[1px] bg-[#C5C6D1]/40 hidden sm:block"></div>

            {/* Profile Dropdown/Pill */}
            <div className="flex items-center gap-2.5 cursor-pointer pl-1 group">
              <div className="w-8 h-8 rounded-full bg-[#001243] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#FFDF9E]/60 group-hover:ring-[#FFDF9E] transition-all">
                {user?.name?.[0] || 'D'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-[#0D1A3C] group-hover:text-[#001243] transition-colors leading-tight">
                  {user?.name || 'Dr. Sunita Sharma'}
                </span>
                <span className="text-[10px] text-[#454650] font-medium leading-none mt-0.5">
                  {user?.role?.replace(/_/g, ' ') || 'Principal / Admin'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Outlet Body with smooth padding */}
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
export default AdminLayout;
