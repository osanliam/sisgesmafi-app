import React, { useContext } from 'react';
import { DatabaseContext } from '../context/DatabaseContext';

function Dashboard() {
  const { courses, students, teachers, currentUser } = useContext(DatabaseContext);

  // Dynamic values bound to context
  const totalStudents = students ? students.length : 1284;
  const totalTeachers = teachers ? teachers.length : 76;
  const totalCourses = courses ? courses.length : 42;
  const attendanceToday = Math.round(totalStudents * 0.94);

  return (
    <div className="w-full h-full relative overflow-y-auto custom-scrollbar font-sans text-left bg-[#f8fafc] text-slate-800">
      
      {/* Dynamic background lighting for premium depth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#ba0035]/5 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="p-6 md:p-10 space-y-10 max-w-7xl mx-auto w-full relative z-10">
        
        {/* Hero / Welcome (Full Width 3D Banner) */}
        <section className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-5 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#e11d48]/5 rounded-full blur-2xl pointer-events-none" />
          <style>{`
            .emoji-3d-header {
              font-size: 2.25rem;
              line-height: 1;
              display: inline-block;
              filter: drop-shadow(0 1px 0 #fca5a5)
                      drop-shadow(0 2px 0 #f43f5e)
                      drop-shadow(0 3px 0 #e11d48)
                      drop-shadow(0 5px 6px rgba(225, 29, 72, 0.3));
              transform: scale(1.05);
            }
          `}</style>
          <span className="emoji-3d-header shrink-0">🏫</span>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
              ¡Hola, {currentUser?.name || 'Admin'}!
            </h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Monitoreo del rendimiento académico, conducta y asistencia de la institución.</p>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Total Estudiantes */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] border border-slate-200 dark:border-slate-800 transition-all duration-300 transform hover:-translate-y-1 border-t-4 border-blue-500">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-blue-600 dark:text-blue-400">
                <span className="material-symbols-outlined">person</span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-sm">trending_up</span> +12%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest mb-1">Total Estudiantes</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{totalStudents.toLocaleString()}</h3>
          </div>

          {/* Profesores */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] border border-slate-200 dark:border-slate-800 transition-all duration-300 transform hover:-translate-y-1 border-t-4 border-[#e11d48]">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl text-[#e11d48] dark:text-rose-400">
                <span className="material-symbols-outlined">school</span>
              </div>
              <span className="text-slate-450 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider bg-slate-50 dark:bg-slate-950/40 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-800">Activos</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest mb-1">Profesores</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{totalTeachers}</h3>
          </div>

          {/* Cursos Activos */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] border border-slate-200 dark:border-slate-800 transition-all duration-300 transform hover:-translate-y-1 border-t-4 border-orange-500">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl text-orange-600 dark:text-orange-400">
                <span className="material-symbols-outlined">menu_book</span>
              </div>
              <span className="text-slate-450 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider bg-slate-50 dark:bg-slate-950/40 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-800">Vigentes</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest mb-1">Cursos Activos</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{totalCourses}</h3>
          </div>

          {/* Asistencia Hoy */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] border border-slate-200 dark:border-slate-800 transition-all duration-300 transform hover:-translate-y-1 border-t-4 border-emerald-500">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                <span className="material-symbols-outlined">event_available</span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">94%</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest mb-1">Asistencia Hoy</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{attendanceToday.toLocaleString()}</h3>
          </div>
        </section>

        {/* Main Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Academic Performance Chart Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] border border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col min-h-[400px]">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Rendimiento Académico</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Promedio global por facultad</p>
              </div>
              <div className="flex gap-2 text-[10px] font-extrabold uppercase tracking-wider">
                <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-900/30">Este Semestre</span>
                <span className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950/40 text-slate-500 rounded-full border border-slate-100 dark:border-slate-800">Semestre Anterior</span>
              </div>
            </div>
            
            <div className="flex-1 flex items-end gap-4 md:gap-8 pb-4 h-64 px-4">
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end gap-1.5 h-full">
                  <div className="w-1/2 bg-blue-500/10 rounded-t-xl h-[60%] border-t border-x border-slate-100 dark:border-slate-850"></div>
                  <div className="w-1/2 bg-blue-500 rounded-t-xl h-[85%] shadow-lg shadow-blue-500/20"></div>
                </div>
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest mt-1">Ciencias</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end gap-1.5 h-full">
                  <div className="w-1/2 bg-rose-500/10 rounded-t-xl h-[40%] border-t border-x border-slate-100 dark:border-slate-850"></div>
                  <div className="w-1/2 bg-[#e11d48] rounded-t-xl h-[65%] shadow-lg shadow-rose-500/20"></div>
                </div>
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest mt-1">Artes</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end gap-1.5 h-full">
                  <div className="w-1/2 bg-emerald-500/10 rounded-t-xl h-[75%] border-t border-x border-slate-100 dark:border-slate-850"></div>
                  <div className="w-1/2 bg-emerald-500 rounded-t-xl h-[92%] shadow-lg shadow-emerald-500/20"></div>
                </div>
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest mt-1">Ingeniería</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end gap-1.5 h-full">
                  <div className="w-1/2 bg-orange-500/10 rounded-t-xl h-[55%] border-t border-x border-slate-100 dark:border-slate-850"></div>
                  <div className="w-1/2 bg-orange-500 rounded-t-xl h-[78%] shadow-lg shadow-orange-500/20"></div>
                </div>
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest mt-1">Derecho</span>
              </div>
            </div>
          </div>

          {/* Conduct Reports Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] border border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Reportes de Conducta</h4>
            <div className="space-y-6 flex-1">
              
              {/* Excelente */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 shrink-0">
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-250">Excelente</span>
                    <span className="text-xs font-black text-emerald-600">75%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-950/40 h-2 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
              
              {/* Observaciones */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600 shrink-0">
                  <span className="material-symbols-outlined">warning</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-250">Observaciones</span>
                    <span className="text-xs font-black text-amber-600">20%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-950/40 h-2 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '20%' }}></div>
                  </div>
                </div>
              </div>

              {/* Incidentes */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-rose-950/20 flex items-center justify-center text-[#e11d48] shrink-0">
                  <span className="material-symbols-outlined">error</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-250">Incidentes</span>
                    <span className="text-xs font-black text-[#e11d48]">5%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-950/40 h-2 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-[#e11d48] h-full rounded-full" style={{ width: '5%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <button className="mt-8 text-[#e11d48] font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-2 hover:underline">
              Ver historial detallado <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* Quick Actions & Recent Activity */}
        <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Quick Actions */}
          <div className="xl:col-span-1 space-y-4">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Acciones Rápidas</h4>
            <div className="grid grid-cols-2 xl:grid-cols-1 gap-4">
              <button className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 p-4 rounded-2xl hover:bg-[#e11d48] hover:text-white hover:border-[#e11d48] shadow-sm active:translate-y-0.5 active:shadow-inner transform hover:-translate-y-0.5 transition-all text-left group">
                <span className="material-symbols-outlined text-[#e11d48] group-hover:text-white group-hover:scale-110 transition-transform">description</span>
                <span className="text-xs font-black uppercase tracking-wider">Informe Mensual</span>
              </button>
              <button className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 p-4 rounded-2xl hover:bg-[#e11d48] hover:text-white hover:border-[#e11d48] shadow-sm active:translate-y-0.5 active:shadow-inner transform hover:-translate-y-0.5 transition-all text-left group">
                <span className="material-symbols-outlined text-[#e11d48] group-hover:text-white group-hover:scale-110 transition-transform">mail</span>
                <span className="text-xs font-black uppercase tracking-wider">Enviar Avisos</span>
              </button>
              <button className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 p-4 rounded-2xl hover:bg-[#e11d48] hover:text-white hover:border-[#e11d48] shadow-sm active:translate-y-0.5 active:shadow-inner transform hover:-translate-y-0.5 transition-all text-left group">
                <span className="material-symbols-outlined text-[#e11d48] group-hover:text-white group-hover:scale-110 transition-transform">event</span>
                <span className="text-xs font-black uppercase tracking-wider">Agenda Semanal</span>
              </button>
              <button className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 p-4 rounded-2xl hover:bg-[#e11d48] hover:text-white hover:border-[#e11d48] shadow-sm active:translate-y-0.5 active:shadow-inner transform hover:-translate-y-0.5 transition-all text-left group">
                <span className="material-symbols-outlined text-[#e11d48] group-hover:text-white group-hover:scale-110 transition-transform">settings_account_box</span>
                <span className="text-xs font-black uppercase tracking-wider">Auditar Perfiles</span>
              </button>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="xl:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] border border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Actividad Reciente</h4>
                <button className="text-[#e11d48] font-extrabold text-[11px] uppercase tracking-wider hover:underline">Ver todo</button>
              </div>
              
              <div className="overflow-hidden border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm bg-slate-50/30 dark:bg-slate-950/20">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                        <th className="py-3 px-4 font-black">Usuario</th>
                        <th className="py-3 px-4 font-black">Acción</th>
                        <th className="py-3 px-4 font-black">Módulo</th>
                        <th className="py-3 px-4 font-black">Fecha</th>
                        <th className="py-3 px-4 text-right font-black">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-slate-800">
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 flex items-center justify-center text-[10px] font-black border border-blue-100 dark:border-blue-900/30">AR</div>
                          <span className="font-bold text-slate-900 dark:text-slate-150">Ana Rodríguez</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Subió calificaciones</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold">Matemáticas II</td>
                        <td className="py-3 px-4 text-slate-400">Hace 15m</td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 text-[9px] font-black rounded border border-emerald-100 dark:border-emerald-900/30 uppercase tracking-wide">Completado</span>
                        </td>
                      </tr>
                      
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300 flex items-center justify-center text-[10px] font-black border border-orange-100 dark:border-orange-900/30">CM</div>
                          <span className="font-bold text-slate-900 dark:text-slate-150">Carlos Mendoza</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Reporte de conducta</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold">Disciplinario</td>
                        <td className="py-3 px-4 text-slate-400">Hace 2h</td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 text-[9px] font-black rounded border border-amber-100 dark:border-amber-900/30 uppercase tracking-wide">Pendiente</span>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 flex items-center justify-center text-[10px] font-black border border-rose-100 dark:border-rose-900/30">LG</div>
                          <span className="font-bold text-slate-900 dark:text-slate-150">Lucía Gómez</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">Nuevo curso creado</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold">Historia Universal</td>
                        <td className="py-3 px-4 text-slate-400">Hoy, 09:12</td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 text-[9px] font-black rounded border border-emerald-100 dark:border-emerald-900/30 uppercase tracking-wide">Completado</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
