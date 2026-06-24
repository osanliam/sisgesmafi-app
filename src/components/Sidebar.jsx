import React, { useContext } from 'react';
import { DatabaseContext } from '../context/DatabaseContext';
import logo from '../assets/logo.png';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  UserCheck,
  BookOpen,
  Calendar,
  GraduationCap,
  ClipboardList,
  FolderLock,
  Boxes,
  Settings,
  LogOut
} from 'lucide-react';

function Sidebar({ activeTab, setActiveTab }) {
  const { currentRole, loginAs, logout, dbConnection } = useContext(DatabaseContext);

  // Define admin group roles for easy mapping
  const adminRoles = ['admin', 'director', 'subdirector_acad', 'subdirector_admin'];

  // Define sidebar menu options based on role permissions (excluding config, which goes to the bottom)
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [...adminRoles, 'teacher', 'student'] },

    { id: 'comunidad-educativa', label: 'Comunidad Educativa', icon: Users, roles: adminRoles },
    { id: 'courses', label: 'Cursos y Horarios', icon: Calendar, roles: adminRoles },
    { id: 'classroom-manager', label: 'Gestión de Aula', icon: GraduationCap, roles: [...adminRoles, 'teacher'] },
    { id: 'custom-groups', label: 'Grupos Especiales', icon: UsersRound, roles: [...adminRoles, 'teacher'] },
    { id: 'resources', label: 'Inventario y Reservas', icon: Boxes, roles: adminRoles },
    { id: 'library', label: 'Biblioteca Digital', icon: FolderLock, roles: [...adminRoles, 'teacher', 'student'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(currentRole));

  const getSidebarItemClass = (id, isActive) => {
    let colorClass = "";
    if (id === 'dashboard') {
      colorClass = "border-blue-500/40 text-blue-400 " + (isActive ? "shadow-[0_0_20px_rgba(59,130,246,0.4)] ring-2 ring-blue-500/30 scale-[1.03] !border-blue-500/80" : "");
    } else if (id === 'classroom-manager') {
      colorClass = "border-red-500/40 text-red-400 " + (isActive ? "shadow-[0_0_20px_rgba(239,68,68,0.4)] ring-2 ring-red-500/30 scale-[1.03] !border-red-500/80" : "");
    } else if (id === 'custom-groups') {
      colorClass = "border-amber-500/40 text-amber-400 " + (isActive ? "shadow-[0_0_20px_rgba(245,158,11,0.4)] ring-2 ring-amber-500/30 scale-[1.03] !border-amber-500/80" : "");
    } else if (id === 'library') {
      colorClass = "border-emerald-500/40 text-emerald-400 " + (isActive ? "shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500/30 scale-[1.03] !border-emerald-500/80" : "");
    } else {
      colorClass = "border-violet-500/40 text-violet-400 " + (isActive ? "shadow-[0_0_20px_rgba(139,92,246,0.4)] ring-2 ring-violet-500/30 scale-[1.03] !border-violet-500/80" : "");
    }

    return `w-full flex flex-col items-center justify-center text-center gap-2 py-8 px-3 rounded-[24px] glass-card-ecc border text-[9.5px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 group shadow-sm hover:bg-white/5 ${colorClass}`;
  };

  return (
    <aside className="w-48 bg-white/5 dark:bg-slate-900/40 backdrop-blur-2xl text-slate-600 dark:text-slate-350 flex flex-col my-4 ml-4 rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.03)] border border-white/40 dark:border-slate-800/40 shrink-0 z-20">
      
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
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={getSidebarItemClass(item.id, isActive)}
              >
                <Icon className="h-14 w-14 transition-transform duration-250 group-hover:scale-105 shrink-0" />
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
            <Settings className="h-14 w-14 transition-transform duration-250 group-hover:rotate-45 shrink-0" />
            <span className="mt-2 text-inherit">Consola Admin</span>
          </button>
        )}

        <button
          onClick={() => {
            const confirmLogout = window.confirm('¿Desea cerrar la sesión activa?');
            if (confirmLogout) {
              logout();
              setActiveTab('dashboard');
            }
          }}
          className="w-full flex flex-col items-center justify-center gap-1.5 py-5 px-3 rounded-[24px] text-[10px] font-black uppercase tracking-wider text-red-400 glass-card-ecc border border-red-500/40 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:scale-102 active:scale-95 transition-all duration-200"
        >
          <LogOut className="h-6 w-6" />
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
          <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 border border-amber-100 dark:border-amber-900/30 rounded-full text-[8px] font-extrabold uppercase tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Modo Local (Offline)
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 dark:bg-slate-900/40 text-slate-400 border border-slate-200/50 dark:border-slate-800/40 rounded-full text-[8px] font-extrabold uppercase tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
            Conectando...
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
