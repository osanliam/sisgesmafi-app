import React, { lazy, Suspense, useState, useContext, useRef, useEffect } from 'react';
import { DatabaseContext } from './context/DatabaseContext';
import logo from './assets/logo.png';
import Sidebar from './components/Sidebar';
const Dashboard = lazy(() => import('./components/Dashboard'));
const CourseManager = lazy(() => import('./components/CourseManager'));
const ClassroomManager = lazy(() => import('./components/ClassroomManager'));
const ComunidadEducativa = lazy(() => import('./components/ComunidadEducativa'));
const ParentPortal = lazy(() => import('./components/ParentPortal'));
const ResourceManager = lazy(() => import('./components/ResourceManager'));
const DigitalLibrary = lazy(() => import('./components/DigitalLibrary'));
const AdminConfig = lazy(() => import('./components/AdminConfig'));
const CustomGroupsManager = lazy(() => import('./components/CustomGroupsManager'));

import Login from './components/Login';
import { User, Shield, GraduationCap, Users, Cloud, CloudOff, CheckCircle2, Loader2, AlertTriangle, Info, X } from 'lucide-react';

function App() {
  const { currentRole, currentUser, loginAs, teachers, students, saveStatus, dbConnection, pendingGradeCount, syncPendingGrades, retryCloudConnection } = useContext(DatabaseContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [toasts, setToasts] = useState([]);
  const prevSaveStatus = useRef(null);

  // Initialize Toast System & Intercept Native Alerts
  useEffect(() => {
    window.showToast = (message, type = 'success', title = null) => {
      const event = new CustomEvent('app-toast', { detail: { message, type, title } });
      window.dispatchEvent(event);
    };

    window.alert = (message) => {
      const lower = String(message).toLowerCase();
      let type = 'info';
      let title = 'Notificación';
      let cleanMsg = message;

      if (lower.startsWith('éxito:') || lower.startsWith('éxito ') || lower.startsWith('correcto:')) {
        type = 'success';
        title = 'Éxito';
        cleanMsg = message.replace(/^(éxito|correcto):\s*/i, '');
      } else if (lower.startsWith('error:') || lower.startsWith('error ') || lower.startsWith('fallo:')) {
        type = 'error';
        title = 'Error';
        cleanMsg = message.replace(/^(error|fallo):\s*/i, '');
      } else if (lower.startsWith('advertencia:') || lower.startsWith('atención:')) {
        type = 'warning';
        title = 'Advertencia';
        cleanMsg = message.replace(/^(advertencia|atención):\s*/i, '');
      }

      window.showToast(cleanMsg, type, title);
    };

    const handleToastEvent = (e) => {
      const { message, type, title } = e.detail;
      const id = Date.now() + Math.random().toString(36).substr(2, 9);
      
      setToasts(prev => [...prev, { id, message, type, title }]);
      
      // Auto-dismiss after 4.5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4500);
    };

    window.addEventListener('app-toast', handleToastEvent);
    return () => window.removeEventListener('app-toast', handleToastEvent);
  }, []);

  // Sync Database saveStatus with Toast System
  useEffect(() => {
    const prev = prevSaveStatus.current;
    prevSaveStatus.current = saveStatus;

    // A local fallback can safely save a browser copy, but that is not a
    // cloud confirmation. Never tell a teacher that grades are synchronized
    // unless the database connection itself is confirmed.
    if (prev === 'saving' && saveStatus === 'saved' && dbConnection === 'connected') {
      window.showToast('Todos los cambios se han guardado exitosamente en la nube.', 'success', 'Sincronizado');
    } else if (saveStatus === 'error') {
      window.showToast('Hubo un error al guardar las calificaciones en la base de datos.', 'error', 'Error de Guardado');
    }
  }, [saveStatus, dbConnection]);

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
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden z-30 my-2 mr-2 sm:my-4 sm:mr-4 bg-transparent">
        
        {/* Top Header / Auth Simulation Console */}
        <header className="flex h-16 shrink-0 items-center justify-between rounded-3xl bg-white dark:bg-slate-900/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-200/60 dark:border-slate-800/40 px-4 sm:px-6 mb-4 z-10 gap-2 sm:gap-4 overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="h-7 w-7 shrink-0 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center p-0.5 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <img src={logo} alt="Logo" className="h-full w-full object-contain" />
            </div>
            <h1 className="hidden sm:block text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-white dark:to-slate-300 truncate">SISGESMAFI</h1>
          </div>

          {/* Quick Simulation Login Selector */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end min-w-0">
            <div className="hidden lg:flex items-center gap-2 bg-slate-100/40 dark:bg-slate-800/40 p-1.5 rounded-2xl text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 shrink-0">
              <span className="px-2 shrink-0">Simular Rol:</span>
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
                className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/40 dark:border-slate-800/40 px-2.5 py-1 rounded-xl text-slate-700 dark:text-slate-200 font-bold outline-none cursor-pointer truncate max-w-[130px]"
                style={{ padding: '0.25rem 1.75rem 0.25rem 0.75rem' }}
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
              <div className="hidden md:flex items-center gap-2 bg-slate-100/40 dark:bg-slate-800/40 p-1.5 rounded-2xl text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 min-w-0">
                <span className="px-2 shrink-0">Docente:</span>
                <select
                  value={currentUser?.id}
                  onChange={(e) => {
                    loginAs('teacher', e.target.value);
                  }}
                  className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/40 dark:border-slate-800/40 px-2.5 py-1 rounded-xl text-slate-700 dark:text-slate-200 font-bold outline-none cursor-pointer truncate max-w-[120px] lg:max-w-[180px]"
                  style={{ padding: '0.25rem 1.75rem 0.25rem 0.75rem' }}
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
              className="shrink-0 p-2 rounded-xl bg-slate-100/60 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-95 border border-slate-200/30 dark:border-slate-700/30"
              title="Alternar Modo Oscuro"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* User Avatar Card */}
            <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-200/50 pl-2 sm:pl-4 dark:border-slate-800/50 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[100px] lg:max-w-[160px]">{currentUser?.name}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold mt-0.5 truncate max-w-[100px] lg:max-w-[160px]">{currentRole}</p>
              </div>
              <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-tr from-violet-500 via-indigo-600 to-blue-500 p-[1.5px] shadow-lg shadow-indigo-500/10">
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
        <main className="min-w-0 flex-1 overflow-auto bg-transparent pb-4 sm:pb-6 scrollbar-thin">
          <div className="w-full min-w-0 px-0 sm:px-1 xl:px-2">
            <Suspense fallback={<div className="p-10 text-center text-sm font-bold text-slate-400">Cargando módulo…</div>}>
              {renderContent()}
            </Suspense>
          </div>
        </main>
      </div>

      {/* Offline Mode Indicator (persistent) */}
      {dbConnection === 'local_fallback' && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="flex items-center gap-2 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-4 py-2 text-xs font-bold shadow-lg shadow-blue-500/5 backdrop-blur-md">
            <CloudOff className="h-4 w-4" />
            <span>Modo Sin Conexión (Guardado Local)</span>
            <button
              type="button"
              onClick={retryCloudConnection}
              className="rounded-md border border-blue-500/30 px-2 py-1 text-[10px] font-black uppercase tracking-wide hover:bg-blue-500/10"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* A visible promise that notes stored on this computer are protected
          locally and will be retried before they can be considered synced. */}
      {pendingGradeCount > 0 && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-amber-50/95 dark:bg-amber-950/90 text-amber-900 dark:text-amber-100 border border-amber-300/70 dark:border-amber-700 px-4 py-3 text-xs font-bold shadow-lg backdrop-blur-md">
            <CloudOff className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{pendingGradeCount} {pendingGradeCount === 1 ? 'nota está protegida' : 'notas están protegidas'} en este equipo y pendiente{pendingGradeCount === 1 ? '' : 's'} de sincronizar.</span>
            <button
              type="button"
              onClick={() => syncPendingGrades()}
              className="shrink-0 rounded-lg border border-amber-400/70 px-2 py-1 text-[10px] font-black uppercase tracking-wide hover:bg-amber-100 dark:hover:bg-amber-900"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Modern Stack-based Toast System */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts.map(t => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 bg-white/95 dark:bg-[#0B1021]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] animate-in slide-in-from-right duration-300 hover:scale-[1.01] transition-transform w-80 md:w-96 text-left"
          >
            {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
            {t.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="h-5 w-5 text-[#005ac2] dark:text-[#60a5fa] shrink-0 mt-0.5" />}

            <div className="flex-1">
              <h5 className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                {t.title || (t.type === 'success' ? 'Éxito' : t.type === 'error' ? 'Error' : t.type === 'warning' ? 'Advertencia' : 'Notificación')}
              </h5>
              <p className="text-xs font-semibold text-slate-650 dark:text-slate-400 mt-1 leading-relaxed">
                {t.message}
              </p>
            </div>

            <button
              onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
