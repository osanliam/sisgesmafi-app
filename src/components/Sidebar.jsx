import React, { useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { DatabaseContext } from '../context/DatabaseContext';

// 3D-Like High-Quality (4K Styled) SVG Icon Components
const DashboardIcon3D = () => (
  <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0 transition-transform duration-250 group-hover:scale-110 drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dbGradBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="dbGradBar" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0ea5e9" />
      </linearGradient>
      <filter id="dbGlow" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <rect x="6" y="8" width="52" height="48" rx="10" fill="url(#dbGradBg)" opacity="0.1" stroke="#3b82f6" strokeWidth="2.5" />
    <rect x="8" y="10" width="48" height="44" rx="8" fill="#3b82f6" opacity="0.05" />
    <rect x="16" y="32" width="6" height="14" rx="2" fill="url(#dbGradBar)" filter="url(#dbGlow)" />
    <rect x="26" y="20" width="6" height="26" rx="2" fill="#2563eb" />
    <rect x="36" y="28" width="6" height="18" rx="2" fill="url(#dbGradBar)" />
    <rect x="46" y="14" width="6" height="32" rx="2" fill="#1d4ed8" filter="url(#dbGlow)" />
    <path d="M12 40 L52 40" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
    <circle cx="49" cy="14" r="3" fill="#60a5fa" />
  </svg>
);

const ClassroomIcon3D = () => (
  <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0 transition-transform duration-250 group-hover:scale-110 drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fca5a5" />
        <stop offset="50%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#b91c1c" />
      </linearGradient>
      <linearGradient id="capBottom" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#b91c1c" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </linearGradient>
      <filter id="capGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#ef4444" floodOpacity="0.25" />
      </filter>
    </defs>
    <path d="M18 42 C18 46, 46 46, 46 42" fill="none" stroke="url(#capBottom)" strokeWidth="8" strokeLinecap="round" />
    <path d="M18 42 C18 46, 46 46, 46 42" fill="none" stroke="#fca5a5" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
    <path d="M32 14 L56 26 L32 38 L8 26 Z" fill="url(#capGrad)" filter="url(#capGlow)" stroke="#ef4444" strokeWidth="1.5" />
    <path d="M32 26 L46 32 L46 44" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="46" cy="45" r="2.5" fill="#d97706" />
  </svg>
);

const GroupsIcon3D = () => (
  <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0 transition-transform duration-250 group-hover:scale-110 drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="userPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="userSecondary" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#ca8a04" />
      </linearGradient>
      <filter id="groupsShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#d97706" floodOpacity="0.2" />
      </filter>
    </defs>
    <circle cx="20" cy="22" r="7" fill="url(#userSecondary)" opacity="0.7" />
    <path d="M10 42 C10 34, 30 34, 30 42" fill="url(#userSecondary)" opacity="0.7" />
    
    <circle cx="44" cy="22" r="7" fill="url(#userSecondary)" opacity="0.7" />
    <path d="M34 42 C34 34, 54 34, 54 42" fill="url(#userSecondary)" opacity="0.7" />

    <g filter="url(#groupsShadow)">
      <circle cx="32" cy="26" r="9" fill="url(#userPrimary)" stroke="#fef08a" strokeWidth="1.5" />
      <path d="M18 48 C18 38, 46 38, 46 48" fill="url(#userPrimary)" stroke="#fef08a" strokeWidth="1.5" />
    </g>
  </svg>
);

const LibraryIcon3D = () => (
  <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0 transition-transform duration-250 group-hover:scale-110 drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="libGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6ee7b7" />
        <stop offset="50%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="bookSpine" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <filter id="libGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#10b981" floodOpacity="0.25" />
      </filter>
    </defs>
    <rect x="18" y="10" width="32" height="44" rx="4" fill="url(#libGrad)" filter="url(#libGlow)" stroke="#34d399" strokeWidth="1.5" />
    <rect x="14" y="10" width="6" height="44" rx="2" fill="url(#bookSpine)" />
    <path d="M22 16 H44" stroke="#a7f3d0" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    <path d="M22 24 H44" stroke="#a7f3d0" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    <path d="M22 32 H36" stroke="#a7f3d0" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    <path d="M38 10 V26 L41 23 L44 26 V10" fill="#fbbf24" />
  </svg>
);

const ComunidadIcon3D = () => (
  <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0 transition-transform duration-250 group-hover:scale-110 drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="comGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <linearGradient id="comGradSub" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d8b4fe" />
        <stop offset="100%" stopColor="#6b21a8" />
      </linearGradient>
      <filter id="comGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <circle cx="18" cy="24" r="6" fill="url(#comGradSub)" opacity="0.75" />
    <path d="M8 42 C8 35, 28 35, 28 42" fill="url(#comGradSub)" opacity="0.75" />
    <circle cx="46" cy="24" r="6" fill="url(#comGradSub)" opacity="0.75" />
    <path d="M36 42 C36 35, 56 35, 56 42" fill="url(#comGradSub)" opacity="0.75" />
    <g filter="url(#comGlow)">
      <circle cx="32" cy="20" r="8" fill="url(#comGrad)" stroke="#c084fc" strokeWidth="1" />
      <path d="M18 42 C18 33, 46 33, 46 42" fill="url(#comGrad)" stroke="#c084fc" strokeWidth="1" />
    </g>
  </svg>
);

const CalendarIcon3D = () => (
  <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0 transition-transform duration-250 group-hover:scale-110 drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="calHeader" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f87171" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>
      <linearGradient id="calBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#f1f5f9" />
      </linearGradient>
      <filter id="calShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.08" />
      </filter>
    </defs>
    <rect x="10" y="12" width="44" height="42" rx="7" fill="url(#calBody)" filter="url(#calShadow)" stroke="#cbd5e1" strokeWidth="1" />
    <path d="M10 18 C10 14, 14 12, 18 12 H46 C50 12, 54 14, 54 18 V22 H10 Z" fill="url(#calHeader)" />
    <rect x="18" y="6" width="4" height="10" rx="2" fill="#94a3b8" stroke="#f1f5f9" strokeWidth="1" />
    <rect x="42" y="6" width="4" height="10" rx="2" fill="#94a3b8" stroke="#f1f5f9" strokeWidth="1" />
    <circle cx="20" cy="32" r="3" fill="#3b82f6" />
    <circle cx="32" cy="32" r="3" fill="#cbd5e1" />
    <circle cx="44" cy="32" r="3" fill="#cbd5e1" />
    <circle cx="20" cy="42" r="3" fill="#cbd5e1" />
    <circle cx="32" cy="42" r="3" fill="#3b82f6" />
    <circle cx="44" cy="42" r="3" fill="#cbd5e1" />
  </svg>
);

const BoxesIcon3D = () => (
  <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0 transition-transform duration-250 group-hover:scale-110 drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="boxGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2dd4bf" />
        <stop offset="100%" stopColor="#0d9488" />
      </linearGradient>
      <linearGradient id="boxGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0ea5e9" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
      <filter id="boxGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <path d="M12 36 L26 28 L40 36 L26 44 Z" fill="url(#boxGrad2)" opacity="0.75" />
    <path d="M12 36 L12 46 L26 54 L26 44 Z" fill="#0284c7" opacity="0.75" />
    <path d="M26 44 L26 54 L40 46 L40 36 Z" fill="#0369a1" opacity="0.75" />

    <g filter="url(#boxGlow)">
      <path d="M24 20 L38 12 L52 20 L38 28 Z" fill="url(#boxGrad1)" stroke="#5eead4" strokeWidth="1" />
      <path d="M24 20 L24 30 L38 38 L38 28 Z" fill="#0f766e" />
      <path d="M38 28 L38 38 L52 30 L52 20 Z" fill="#0d9488" />
    </g>
  </svg>
);

const ConfigIcon3D = () => (
  <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0 transition-transform duration-250 group-hover:rotate-45 shrink-0 drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="configGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <filter id="configGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <circle cx="32" cy="32" r="16" fill="none" stroke="url(#configGrad)" strokeWidth="6" filter="url(#configGlow)" />
    <path d="M32 8 V16 M32 48 V56 M8 32 H16 M48 32 H56 M15 15 L21 21 M43 43 L49 49 M15 49 L21 43 M43 15 L49 21" stroke="url(#configGrad)" strokeWidth="5" strokeLinecap="round" />
    <circle cx="32" cy="32" r="8" fill="white" className="dark:fill-[#0B1021]" />
    <circle cx="32" cy="32" r="4" fill="url(#configGrad)" />
  </svg>
);



const LogoutIcon3D = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 transition-transform duration-200 group-hover:translate-x-1 drop-shadow" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f87171" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>
    </defs>
    <path d="M9 21 H5 A2 2 0 0 1 3 19 V5 A2 2 0 0 1 5 3 H9" fill="none" stroke="url(#logGrad)" strokeWidth="2.5" strokeLinecap="round" />
    <polyline points="16 17 21 12 16 7" fill="none" stroke="url(#logGrad)" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="21" y1="12" x2="9" y2="12" stroke="url(#logGrad)" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

function Sidebar({ activeTab, setActiveTab }) {
  const { currentRole, loginAs, logout, prepareSafeLogout, dbConnection, retryCloudConnection, lastDailyBackup } = useContext(DatabaseContext);
  const [logoutStep, setLogoutStep] = useState(null); // null | confirm | saving | protected_locally

  const adminRoles = ['admin', 'director', 'subdirector_acad', 'subdirector_admin'];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', roles: [...adminRoles, 'teacher', 'student'] },
    { id: 'comunidad-educativa', label: 'Comunidad Educativa', roles: adminRoles },
    { id: 'courses', label: 'Cursos y Horarios', roles: adminRoles },
    { id: 'classroom-manager', label: 'Gestión de Aula', roles: [...adminRoles, 'teacher'] },
    { id: 'custom-groups', label: 'Grupos Especiales', roles: [...adminRoles, 'teacher'] },
    { id: 'resources', label: 'Inventario y Reservas', roles: adminRoles },
    { id: 'library', label: 'Biblioteca Digital', roles: [...adminRoles, 'teacher', 'student'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(currentRole));

  const closeSession = () => {
    logout();
    setActiveTab('dashboard');
    setLogoutStep(null);
  };

  const saveThenClose = async () => {
    setLogoutStep('saving');
    try {
      const result = await prepareSafeLogout();
      if (result.status === 'synced') {
        closeSession();
      } else {
        setLogoutStep({ status: 'protected_locally', pending: result.pending });
      }
    } catch (_) {
      setLogoutStep({ status: 'protected_locally', pending: null });
    }
  };

  const getSidebarItemClass = (id, isActive) => {
    let colorClass = "";
    if (id === 'dashboard') {
      colorClass = isActive 
        ? "bg-blue-50/80 dark:bg-blue-950/20 border-blue-500 text-blue-600 dark:text-blue-400 shadow-[0_4px_15px_rgba(59,130,246,0.1)] dark:shadow-[0_0_20px_rgba(59,130,246,0.2)] scale-[1.03]" 
        : "bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/30 text-slate-500 dark:text-slate-400 hover:bg-slate-50/80 dark:hover:bg-slate-850 hover:text-slate-850 dark:hover:text-white";
    } else if (id === 'classroom-manager') {
      colorClass = isActive 
        ? "bg-red-50/80 dark:bg-red-950/20 border-red-500 text-red-600 dark:text-red-450 shadow-[0_4px_15px_rgba(239,68,68,0.1)] dark:shadow-[0_0_20px_rgba(239,68,68,0.2)] scale-[1.03]" 
        : "bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/30 text-slate-500 dark:text-slate-400 hover:bg-slate-50/80 dark:hover:bg-slate-850 hover:text-slate-850 dark:hover:text-white";
    } else if (id === 'custom-groups') {
      colorClass = isActive 
        ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-500 text-amber-600 dark:text-amber-450 shadow-[0_4px_15px_rgba(245,158,11,0.1)] dark:shadow-[0_0_20px_rgba(245,158,11,0.2)] scale-[1.03]" 
        : "bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/30 text-slate-500 dark:text-slate-400 hover:bg-slate-50/80 dark:hover:bg-slate-850 hover:text-slate-850 dark:hover:text-white";
    } else if (id === 'library') {
      colorClass = isActive 
        ? "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-500 text-emerald-600 dark:text-emerald-450 shadow-[0_4px_15px_rgba(16,185,129,0.1)] dark:shadow-[0_0_20px_rgba(16,185,129,0.2)] scale-[1.03]" 
        : "bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/30 text-slate-500 dark:text-slate-400 hover:bg-slate-50/80 dark:hover:bg-slate-850 hover:text-slate-850 dark:hover:text-white";
    } else {
      colorClass = isActive 
        ? "bg-violet-50/80 dark:bg-violet-950/20 border-violet-500 text-violet-600 dark:text-violet-450 shadow-[0_4px_15px_rgba(139,92,246,0.1)] dark:shadow-[0_0_20px_rgba(139,92,246,0.2)] scale-[1.03]" 
        : "bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/30 text-slate-500 dark:text-slate-400 hover:bg-slate-50/80 dark:hover:bg-slate-850 hover:text-slate-850 dark:hover:text-white";
    }

    return `w-full flex flex-col items-center justify-center text-center gap-2 py-8 px-3 rounded-[24px] border text-[9.5px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 group shadow-sm ${colorClass}`;
  };

  const renderSidebarIcon = (id) => {
    switch (id) {
      case 'dashboard':
        return <DashboardIcon3D />;
      case 'classroom-manager':
        return <ClassroomIcon3D />;
      case 'custom-groups':
        return <GroupsIcon3D />;
      case 'library':
        return <LibraryIcon3D />;
      case 'comunidad-educativa':
        return <ComunidadIcon3D />;
      case 'courses':
        return <CalendarIcon3D />;
      case 'resources':
        return <BoxesIcon3D />;
      case 'admin-config':
        return <ConfigIcon3D />;
      default:
        return <ConfigIcon3D />;
    }
  };

  return (
    <aside className="w-48 bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 flex flex-col my-4 ml-4 rounded-3xl shadow-[0_8px_32px_rgba(15,23,42,0.05)] border border-slate-200/60 dark:border-slate-800/40 shrink-0 z-20">
      
      {/* Platform Branding */}
      <div className="h-16 flex flex-col items-center justify-center border-b border-slate-200/50 dark:border-slate-800/30 px-4 mt-2">
        <span className="font-extrabold text-slate-950 dark:text-white tracking-widest text-[13px] uppercase font-display">SISGESMAFI</span>
        <span className="text-[8px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest mt-0.5">Gestión Excelente</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-4 overflow-y-auto">
        {currentRole === 'parent' ? (
          <div className="px-2 py-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-center text-xs text-indigo-600 dark:text-indigo-300 backdrop-blur-md shadow-inner">
            <span className="inline-block mb-1 text-base">🔒</span>
            <p className="font-bold text-[8px] text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1">Sesión Protegida</p>
            <span className="font-extrabold text-slate-800 dark:text-white text-[10px]">Portal de Padres</span>
          </div>
        ) : (
          filteredItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={getSidebarItemClass(item.id, isActive)}
              >
                {renderSidebarIcon(item.id)}
                <span className="mt-2 text-inherit">{item.label}</span>
              </button>
            );
          })
        )}
      </nav>

      {/* Bottom Settings & Logout Actions */}
      <div className="px-3 py-4 border-t border-slate-200/50 dark:border-slate-800/30 space-y-4">
        {adminRoles.includes(currentRole) && (
          <button
            onClick={() => setActiveTab('admin-config')}
            className={getSidebarItemClass('admin-config', activeTab === 'admin-config')}
          >
            <ConfigIcon3D />
            <span className="mt-2 text-inherit">Consola Admin</span>
          </button>
        )}



        <button
          onClick={() => setLogoutStep('confirm')}
          className="w-full flex flex-col items-center justify-center gap-1.5 py-5 px-3 rounded-[24px] text-[10px] font-black uppercase tracking-wider text-red-400 glass-card-ecc border border-red-500/40 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:scale-102 active:scale-95 transition-all duration-200 group"
        >
          <LogoutIcon3D />
          Cerrar Sesión
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/30 text-center flex flex-col items-center gap-1.5 justify-center">
        <p className="text-[8px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">SIGGESMAFI v1.1.0 • Estable</p>
        {dbConnection === 'connected' ? (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30 rounded-full text-[8px] font-extrabold uppercase tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Nube Conectada
          </div>
        ) : dbConnection === 'local_fallback' ? (
          <button
            type="button"
            onClick={retryCloudConnection}
            title="Reintentar la conexión con la nube"
            className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 border border-amber-100 dark:border-amber-900/30 rounded-full text-[8px] font-extrabold uppercase tracking-wide hover:bg-amber-100 dark:hover:bg-amber-900/40"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Modo Local · Reintentar
          </button>
        ) : (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 dark:bg-slate-900/40 text-slate-400 border border-slate-200/50 dark:border-slate-800/40 rounded-full text-[8px] font-extrabold uppercase tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
            Conectando...
          </div>
        )}
        {lastDailyBackup && (
          <p className="text-[7px] text-slate-400 dark:text-slate-500 font-bold">
            Copia local: {new Date(lastDailyBackup.updatedAt).toLocaleDateString('es-PE')} {new Date(lastDailyBackup.updatedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      {logoutStep && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            {logoutStep === 'confirm' && (
              <>
                <h3 className="text-lg font-black">¿Guardar y cerrar sesión?</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  SISGESMAFI verificará las notas pendientes, intentará sincronizarlas y conservará la copia local diaria antes de cerrar.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setLogoutStep(null)} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
                  <button type="button" onClick={saveThenClose} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700">Guardar y cerrar</button>
                </div>
              </>
            )}
            {logoutStep === 'saving' && (
              <div className="py-5 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                <h3 className="mt-4 text-lg font-black">Guardando y verificando…</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No cierres esta ventana todavía.</p>
              </div>
            )}
            {typeof logoutStep === 'object' && logoutStep.status === 'protected_locally' && (
              <>
                <h3 className="text-lg font-black">Notas protegidas en este equipo</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {logoutStep.pending === null
                    ? 'No se pudo confirmar la conexión con la nube en este momento.'
                    : `${logoutStep.pending} ${logoutStep.pending === 1 ? 'nota sigue pendiente' : 'notas siguen pendientes'} de sincronización.`} No se perderán: quedaron en la cola local y se reenviarán al abrir SISGESMAFI con Internet.
                </p>
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button type="button" onClick={() => setLogoutStep('confirm')} className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Volver</button>
                  <button type="button" onClick={saveThenClose} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950">Reintentar</button>
                  <button type="button" onClick={closeSession} className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-black text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900">Cerrar con copia local</button>
                </div>
              </>
            )}
          </div>
        </div>
      , document.body)}
    </aside>
  );
}

export default Sidebar;
