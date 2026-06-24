import React, { useState, useContext, useMemo, useEffect } from 'react';
import { DatabaseContext } from '../context/DatabaseContext';
import { Settings, ShieldAlert, CheckCircle2, Info, Database, UserCircle } from 'lucide-react';

function AdminConfig() {
  const { 
    currentUser, 
    updateAdminConfig, 
    gradingScale, 
    passingGrade, 
    institutionName, 
    systemLogs,
    students,
    teachers,
    courses,
    grades,
    activePeriods,
    saveActivePeriods
  } = useContext(DatabaseContext);

  // Profile forms
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  
  // Center configurations
  const [instName, setInstName] = useState(institutionName);
  const [scale, setScale] = useState(gradingScale);

  // Periods state
  const [periods, setPeriods] = useState(() => {
    return activePeriods || {
      bimesters: { '1': true, '2': true, '3': true, '4': true },
      units: { '0': true, '1': true, '2': true, '3': true, '4': true, '5': true, '6': true, '7': true }
    };
  });

  useEffect(() => {
    if (activePeriods) {
      setPeriods(activePeriods);
    }
  }, [activePeriods]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateAdminConfig({ name, email, phone });
    alert('Perfil de administrador actualizado.');
  };

  const handleSaveInstitution = (e) => {
    e.preventDefault();
    updateAdminConfig({ institutionName: instName, gradingScale: scale });
    alert('Configuración escolar guardada.');
  };

  // Compile database size stats
  const dbStats = useMemo(() => {
    return [
      { name: 'Estudiantes', count: students.length, color: 'text-indigo-400 bg-white/5 border-white/10' },
      { name: 'Docentes', count: teachers.length, color: 'text-violet-400 bg-white/5 border-white/10' },
      { name: 'Mallas de Cursos', count: courses.length, color: 'text-emerald-400 bg-white/5 border-white/10' },
      { name: 'Registro de Notas', count: grades.length, color: 'text-amber-400 bg-white/5 border-white/10' }
    ];
  }, [students, teachers, courses, grades]);

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Consola del Administrador</h2>
        <p className="text-slate-400 mt-1">Configuración general de la cuenta, parámetros pedagógicos y auditoría de base de datos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column (2/3 width) - Forms & Settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Admin Profile Details */}
          <div className="glass-card p-6">
            <h4 className="text-lg font-bold border-b border-slate-100 pb-4 dark:border-slate-800 flex items-center gap-2 mb-4">
              <UserCircle className="h-5 w-5 text-indigo-500" />
              Mi Cuenta de Administrador
            </h4>

            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Nombre Completo</label>
                <input 
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm focus:border-indigo-500 focus:bg-white/10 text-slate-200 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Correo de Contacto</label>
                <input 
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm focus:border-indigo-500 focus:bg-white/10 text-slate-200 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Teléfono Directo</label>
                <input 
                  type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm focus:border-indigo-500 focus:bg-white/10 text-slate-200 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Cargo Jerárquico</label>
                <input 
                  type="text" disabled value={currentUser?.role || 'Administrador Central'}
                  className="w-full rounded-xl border border-white/5 bg-black/20 px-3.5 py-2 text-sm text-slate-500"
                />
              </div>

              <div className="md:col-span-2 flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="submit" className="btn-neuro-primary text-xs py-2 px-4">Guardar Perfil</button>
              </div>
            </form>
          </div>

          {/* School configurations */}
          <div className="glass-card p-6">
            <h4 className="text-lg font-bold border-b border-slate-100 pb-4 dark:border-slate-800 flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-indigo-500" />
              Parámetros de la Institución
            </h4>

            <form onSubmit={handleSaveInstitution} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 font-bold">Nombre del Centro Educativo</label>
                <input 
                  type="text" value={instName} onChange={(e) => setInstName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm focus:border-indigo-500 focus:bg-white/10 text-slate-200 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Escala de Calificaciones</label>
                <select 
                  value={scale} onChange={(e) => setScale(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-sm focus:border-indigo-500 text-slate-200 outline-none transition-all"
                >
                  <option value="10">Escala de 0 a 10 (Tradicional / Formativa)</option>
                  <option value="20">Escala de 0 a 20 (Peruana / Tradicional)</option>
                  <option value="literal">Escala Literal (AD, A, B, C - Currículo Nacional)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Nota Mínima Aprobatoria (Auto-calculado)</label>
                <input 
                  type="text" disabled value={scale === '10' ? '6.0' : scale === '20' ? '11.0' : 'A (Logrado)'}
                  className="w-full rounded-xl border border-white/5 bg-black/20 px-3.5 py-2 text-sm text-slate-500 font-bold"
                />
              </div>

              <div className="md:col-span-2 flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="submit" className="btn-neuro-primary text-xs py-2 px-4">Actualizar Parámetros</button>
              </div>
            </form>
          </div>

          {/* Active periods management */}
          <div className="glass-card p-6">
            <h4 className="text-lg font-bold border-b border-slate-100 pb-4 dark:border-slate-800 flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-indigo-500" />
              Gestión de Periodos Escolares
            </h4>

            <form onSubmit={(e) => {
              e.preventDefault();
              saveActivePeriods(periods);
              alert('Configuración de bimestres y unidades escolares guardada.');
            }} className="space-y-6">
              
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-100 pb-1.5 dark:border-slate-800">
                  Bimestres Habilitados
                </span>
                <p className="text-[11px] text-slate-400">Marque los bimestres que los docentes pueden ver y calificar. Los bimestres desmarcados se ocultarán del portal de notas.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {['1', '2', '3', '4'].map(b => {
                    const isChecked = periods?.bimesters?.[b] !== false;
                    return (
                      <label key={b} className="flex items-center gap-2 cursor-pointer select-none bg-white/5 p-3 rounded-xl border border-white/10 hover:bg-white/10 transition">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e) => {
                            const newBimesters = { ...periods.bimesters, [b]: e.target.checked };
                            setPeriods({ ...periods, bimesters: newBimesters });
                          }}
                          className="rounded h-4 w-4 bg-black/30 border-white/20 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                        />
                        <span className="text-xs font-bold text-slate-300">Bimestre {b}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-100 pb-1.5 dark:border-slate-800">
                  Unidades de Aprendizaje Activas
                </span>
                <p className="text-[11px] text-slate-400">Marque las unidades en las que los docentes pueden crear instrumentos y asignar notas en el portal.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { bimester: '1', units: [{ id: '0', label: 'Unidad 0' }, { id: '1', label: 'Unidad 1' }] },
                    { bimester: '2', units: [{ id: '2', label: 'Unidad 2' }, { id: '3', label: 'Unidad 3' }] },
                    { bimester: '3', units: [{ id: '4', label: 'Unidad 4' }, { id: '5', label: 'Unidad 5' }] },
                    { bimester: '4', units: [{ id: '6', label: 'Unidad 6' }, { id: '7', label: 'Unidad 7' }] }
                  ].map(group => (
                    <div key={group.bimester} className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wide">
                        Asociadas al Bimestre {group.bimester}
                      </span>
                      <div className="flex gap-4">
                        {group.units.map(u => {
                          const isChecked = periods?.units?.[u.id] !== false;
                          return (
                            <label key={u.id} className="flex items-center gap-2 cursor-pointer select-none font-bold text-xs flex-1 bg-white/5 p-2 rounded-xl border border-white/10 hover:bg-white/10 transition">
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={(e) => {
                                  const newUnits = { ...periods.units, [u.id]: e.target.checked };
                                  setPeriods({ ...periods, units: newUnits });
                                }}
                                className="rounded h-4 w-4 bg-black/30 border-white/20 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                              />
                              <span className="text-slate-300">{u.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="submit" className="btn-neuro-primary text-xs py-2 px-4">Guardar Periodos</button>
              </div>
            </form>
          </div>

        </div>

        {/* Right column (1/3 width) - Real-time Logs and DB health */}
        <div className="space-y-6">
          
          {/* Database Health Card */}
          <div className="glass-card p-6 space-y-4">
            <h4 className="text-lg font-bold border-b border-slate-100 pb-3 dark:border-slate-800 flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-500" />
              Métricas de Base de Datos
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {dbStats.map(stat => (
                <div key={stat.name} className={`${stat.color} p-3 rounded-2xl border text-center`}>
                  <p className="text-xl font-black">{stat.count}</p>
                  <p className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">{stat.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Logs Trail */}
          <div className="glass-card p-6 flex flex-col h-[400px]">
            <h4 className="text-lg font-bold border-b border-slate-100 pb-3 dark:border-slate-800 flex items-center gap-2">
              🛡️ Auditoría de Transacciones
            </h4>
            
            {/* Scrollable logs */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1 text-[10px]">
              {systemLogs.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Ningún evento registrado aún.</p>
              ) : (
                systemLogs.map(log => {
                  let badgeColor = 'bg-white/10 text-slate-300';
                  let Icon = Info;
                  
                  if (log.type === 'success') {
                    badgeColor = 'bg-emerald-500/20 text-emerald-400';
                    Icon = CheckCircle2;
                  } else if (log.type === 'warning') {
                    badgeColor = 'bg-rose-500/20 text-rose-400';
                    Icon = ShieldAlert;
                  }

                  return (
                    <div key={log.id} className="p-2.5 rounded-xl border border-white/10 bg-white/5 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 ${badgeColor}`}>
                          <Icon className="h-3 w-3 shrink-0" />
                          {log.type}
                        </span>
                        <span className="text-[8px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="font-extrabold text-white leading-normal">{log.message}</p>
                      <p className="text-slate-400 leading-normal font-medium">{log.details}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminConfig;
