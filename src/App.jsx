import React, { useState, useContext, useRef, useEffect } from 'react';
import { DatabaseContext } from './context/DatabaseContext';
import logo from './assets/logo.png';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CourseManager from './components/CourseManager';
import ClassroomManager from './components/ClassroomManager';
import ComunidadEducativa from './components/ComunidadEducativa';
import ParentPortal from './components/ParentPortal';
import ResourceManager from './components/ResourceManager';
import DigitalLibrary from './components/DigitalLibrary';
import AdminConfig from './components/AdminConfig';
import CustomGroupsManager from './components/CustomGroupsManager';

import Login from './components/Login';
import { User, Shield, GraduationCap, Users, Cloud, CloudOff, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

function App() {
  const { currentRole, currentUser, loginAs, teachers, students, saveStatus, dbConnection } = useContext(DatabaseContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState(null);
  const prevSaveStatus = useRef(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    const prev = prevSaveStatus.current;
    prevSaveStatus.current = saveStatus;

    if (prev === 'saving' && saveStatus === 'saved') {
      setToast('saved');
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 4000);
    } else if (saveStatus === 'saving') {
      setToast('saving');
    } else if (saveStatus === 'error') {
      setToast('error');
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 6000);
    }
    return () => clearTimeout(toastTimer.current);
  }, [saveStatus]);

  // Early return if user is not authenticated
  if (!currentRole || !currentUser) {
    return <Login />;
  }

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Render active panel based on role permissions and selected tab
  const renderContent = () => {
    // Parent role is completely locked to ParentPortal
    if (currentRole === 'parent') {
      return <ParentPortal />;
    }
    // Student role is locked to read-only views
    if (currentRole === 'student') {
      if (activeTab === 'dashboard') return <Dashboard />;
      if (activeTab === 'library') return <DigitalLibrary />;
      return <Dashboard />; // fallback
    }
    // Teacher role is locked to allowed teacher tabs
    if (currentRole === 'teacher') {
      const allowed = ['dashboard', 'classroom-manager', 'library', 'custom-groups'];
      if (!allowed.includes(activeTab)) {
        return <Dashboard />;
      }
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;

      case 'comunidad-educativa':
        return <ComunidadEducativa />;
      case 'courses':
        return <CourseManager />;
      case 'custom-groups':
        return <CustomGroupsManager />;
      case 'classroom-manager':
        return <ClassroomManager />;
      case 'resources':
        return <ResourceManager />;
      case 'library':
        return <DigitalLibrary />;
      case 'admin-config':
        return <AdminConfig />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`relative flex h-screen w-screen overflow-hidden bg-transparent text-slate-800 dark:text-slate-100 ${darkMode ? 'dark' : ''}`}>
      
      {/* Interactive Mockup Geometric Floating Decorations */}
      <svg className="absolute top-[8%] left-[22%] h-14 w-14 text-indigo-500/10 dark:text-indigo-500/5 animate-float-slow pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>
      <svg className="absolute bottom-[35%] left-[24%] h-12 w-12 text-[#2ecc71]/15 dark:text-[#2ecc71]/5 animate-float-medium pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>
      <svg className="absolute top-[15%] left-[28%] h-8 w-8 text-amber-500/15 dark:text-amber-500/5 animate-float-slow pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 22 22 22" /></svg>
      <svg className="absolute bottom-[20%] right-[25%] h-10 w-10 text-orange-500/15 dark:text-orange-500/5 animate-float-medium pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 22 22 22" /></svg>
      <svg className="absolute top-[40%] left-[8%] h-8 w-24 text-rose-500/20 dark:text-rose-500/5 animate-float-slow pointer-events-none" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="3"><path d="M 0,10 C 15,20 35,0 50,10 C 65,20 85,0 100,10" /></svg>
      <svg className="absolute bottom-[10%] left-[30%] h-8 w-24 text-emerald-500/20 dark:text-emerald-500/5 animate-float-medium pointer-events-none" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="3"><path d="M 0,10 C 15,20 35,0 50,10 C 65,20 85,0 100,10" /></svg>


      {/* 1. Left Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Main Content Wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden z-10 my-4 mr-4 bg-transparent">
        
        {/* Top Header / Auth Simulation Console */}
        <header className="flex h-16 shrink-0 items-center justify-between rounded-3xl bg-white/80 dark:bg-slate-900/55 backdrop-blur-xl border border-white/40 dark:border-slate-800/40 shadow-sm px-6 mb-4 z-10">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center p-0.5 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <img src={logo} alt="Logo" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-white dark:to-slate-300">SISGESMAFI</h1>
          </div>

          {/* Quick Simulation Login Selector */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-100/40 dark:bg-slate-800/40 p-1.5 rounded-2xl text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              <span className="px-2">Simular Rol:</span>
              <select
                value={currentRole}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'admin' || val === 'director' || val === 'subdirector_acad' || val === 'subdirector_admin') {
                    loginAs(val);
                    setActiveTab('dashboard');
                  } else if (val === 'teacher') {
                    const osmerTeacher = teachers.find(t => 
                      (t.name || '').toLowerCase().includes('osmer') || 
                      (t.email || '').toLowerCase().includes('osmer') || 
                      (t.email || '').toLowerCase().includes('osanliam')
                    );
                    const defaultTeacherId = osmerTeacher ? osmerTeacher.id : (teachers && teachers.length > 0 ? teachers[0].id : 'tch_1');
                    loginAs('teacher', defaultTeacherId);
                    setActiveTab('classroom-manager');
                  } else if (val === 'student') {
                    loginAs('student', 'std_1');
                  } else if (val === 'parent') {
                    loginAs('parent', 'std_1');
                  }
                }}
                className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/40 dark:border-slate-800/40 px-2.5 py-1 rounded-xl text-slate-700 dark:text-slate-200 font-bold outline-none cursor-pointer"
                style={{ width: 'auto', padding: '0.25rem 1.75rem 0.25rem 0.75rem' }}
              >
                <option value="admin">Admin Central</option>
                <option value="director">Directora General</option>
                <option value="subdirector_acad">Subdirector Académico</option>
                <option value="subdirector_admin">Subdirectora Administrativa</option>
                <option value="teacher">Docente</option>
                <option value="student">Estudiante</option>
                <option value="parent">Apoderado (Padre)</option>
              </select>
            </div>

            {/* Simular Docente Específico */}
            {currentRole === 'teacher' && teachers && teachers.length > 0 && (
              <div className="hidden md:flex items-center gap-2 bg-slate-100/40 dark:bg-slate-800/40 p-1.5 rounded-2xl text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                <span className="px-2">Docente:</span>
                <select
                  value={currentUser?.id}
                  onChange={(e) => {
                    loginAs('teacher', e.target.value);
                  }}
                  className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/40 dark:border-slate-800/40 px-2.5 py-1 rounded-xl text-slate-700 dark:text-slate-200 font-bold outline-none cursor-pointer"
                  style={{ width: 'auto', padding: '0.25rem 1.75rem 0.25rem 0.75rem' }}
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-slate-100/60 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95 border border-slate-200/30 dark:border-slate-700/30"
              title="Alternar Modo Oscuro"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* User Avatar Card */}
            <div className="flex items-center gap-3 border-l border-slate-200/50 pl-4 dark:border-slate-800/50">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{currentUser?.name}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold mt-0.5">{currentRole}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-500 via-indigo-600 to-blue-500 p-[1.5px] shadow-lg shadow-indigo-500/10">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className="h-full w-full rounded-full object-cover bg-white dark:bg-slate-950" />
                ) : (
                  <div className="h-full w-full rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs text-indigo-600 dark:text-indigo-400 font-black">
                    {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* 3. Main Actionable Workspace */}
        <main className="flex-1 overflow-y-auto bg-transparent pb-6 scrollbar-thin">
          <div className="mx-auto max-w-7xl">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Offline Mode Indicator (persistent) */}
      {dbConnection === 'local_fallback' && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="flex items-center gap-2 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-4 py-2 text-xs font-bold shadow-lg shadow-blue-500/5 backdrop-blur-md">
            <CloudOff className="h-4 w-4" />
            <span>Modo Sin Conexión (Guardado Local)</span>
          </div>
        </div>
      )}

      {/* Save Status Toast (auto-fades) */}
      {toast && dbConnection !== 'local_fallback' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-300">
          {toast === 'saving' ? (
            <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-5 py-3 text-sm font-bold shadow-xl shadow-amber-500/5 backdrop-blur-md">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Guardando en la Nube...</span>
            </div>
          ) : toast === 'error' ? (
            <div className="flex items-center gap-3 rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 px-5 py-3 text-sm font-bold shadow-xl shadow-red-500/5 backdrop-blur-md">
              <AlertTriangle className="h-5 w-5" />
              <span>Error al Sincronizar</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-5 py-3 text-sm font-bold shadow-xl shadow-emerald-500/5 backdrop-blur-md transition-all duration-500 hover:scale-105">
              <CheckCircle2 className="h-5 w-5" />
              <span>Notas Guardadas</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
