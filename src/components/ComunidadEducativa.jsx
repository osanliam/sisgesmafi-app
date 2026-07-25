import React, { useState, useContext, useMemo } from 'react';
import { DatabaseContext } from '../context/DatabaseContext';
import StudentManager from './StudentManager';
import TeacherManager from './TeacherManager';
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  Phone, 
  Mail, 
  Search, 
  ShieldAlert, 
  CheckCircle,
  FileText,
  User
} from 'lucide-react';

function ComunidadEducativa() {
  const { students } = useContext(DatabaseContext);

  // Sub-tabs state: 'students', 'teachers', 'admins', 'parents'
  const [activeSubTab, setActiveSubTab] = useState('students');

  // Search state for parents
  const [parentsSearchQuery, setParentsSearchQuery] = useState('');

  // Extract and aggregate parents dynamically from student profiles
  const parentsDirectory = useMemo(() => {
    const map = new Map();
    students.forEach(s => {
      // Aggregate mother info if present
      const mName = (s.motherName || '').trim();
      const mPhone = (s.motherPhone || '').trim();
      const mDni = (s.motherDni || '').trim();
      const mEmail = (s.parentEmail || '').trim() || (mName ? `${mName.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]/g, '')}@colegio.edu.pe` : '');

      if (mName) {
        const key = `mother_${mName.toLowerCase()}`;
        if (map.has(key)) {
          map.get(key).children.push(s);
        } else {
          map.set(key, {
            name: mName,
            dni: mDni || 'No registrado',
            phone: mPhone || 'No registrado',
            email: mEmail,
            type: 'Madre',
            children: [s]
          });
        }
      }

      // Aggregate father info if present
      const fName = (s.fatherName || '').trim();
      const fPhone = (s.fatherPhone || '').trim();
      const fDni = (s.fatherDni || '').trim();
      const fEmail = (s.parentEmail || '').trim() || (fName ? `${fName.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]/g, '')}@colegio.edu.pe` : '');

      if (fName) {
        const key = `father_${fName.toLowerCase()}`;
        if (map.has(key)) {
          map.get(key).children.push(s);
        } else {
          map.set(key, {
            name: fName,
            dni: fDni || 'No registrado',
            phone: fPhone || 'No registrado',
            email: fEmail,
            type: 'Padre',
            children: [s]
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [students]);

  // Filter parents list based on query
  const filteredParents = useMemo(() => {
    if (!parentsSearchQuery.trim()) return parentsDirectory;
    const query = parentsSearchQuery.toLowerCase();
    return parentsDirectory.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.phone.includes(query) ||
      p.dni.includes(query) ||
      p.children.some(c => c.name.toLowerCase().includes(query))
    );
  }, [parentsDirectory, parentsSearchQuery]);

  return (
    <div className="w-full h-full relative overflow-y-auto custom-scrollbar font-sans bg-[#f8fafc] text-slate-800">
      <style>{`
        .tab-3d {
          position: relative;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(226, 232, 240, 0.8);
          background: #ffffff;
          border-bottom-width: 6px;
          border-bottom-color: #cbd5e1;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        
        .dark .tab-3d {
          background: #1e293b;
          border-color: rgba(51, 65, 85, 0.8);
          border-bottom-color: #0f172a;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        }
        
        .tab-3d:hover {
          transform: translateY(-2px);
          border-bottom-width: 8px;
          border-bottom-color: #94a3b8;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
        }
        
        .dark .tab-3d:hover {
          border-bottom-color: #020617;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.35);
        }
        
        .tab-3d:active {
          transform: translateY(2px);
          border-bottom-width: 2px;
          border-bottom-color: #cbd5e1;
          box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.04);
        }
        
        .dark .tab-3d:active {
          border-bottom-color: #0f172a;
          box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.15);
        }
        
        /* Active State */
        .tab-3d-active {
          background: #fff1f2 !important;
          border-color: #fca5a5 !important;
          border-bottom-width: 6px !important;
          border-bottom-color: #e11d48 !important;
          color: #e11d48 !important;
          box-shadow: 0 6px 12px rgba(225, 29, 72, 0.08) !important;
        }
        
        .dark .tab-3d-active {
          background: rgba(225, 29, 72, 0.08) !important;
          border-color: #ef4444 !important;
          border-bottom-color: #b91c1c !important;
          color: #fecdd3 !important;
          box-shadow: 0 6px 12px rgba(225, 29, 72, 0.15) !important;
        }
        
        .tab-3d-active:hover {
          transform: translateY(-2px) !important;
          border-bottom-width: 8px !important;
          border-bottom-color: #be123c !important;
          box-shadow: 0 12px 20px rgba(225, 29, 72, 0.12) !important;
        }
        
        .dark .tab-3d-active:hover {
          border-bottom-color: #991b1b !important;
          box-shadow: 0 12px 20px rgba(225, 29, 72, 0.2) !important;
        }
        
        .tab-3d-active:active {
          transform: translateY(2px) !important;
          border-bottom-width: 2px !important;
          border-bottom-color: #e11d48 !important;
          box-shadow: 0 2px 4px rgba(225, 29, 72, 0.04) !important;
        }
        
        .dark .tab-3d-active:active {
          border-bottom-color: #b91c1c !important;
          box-shadow: 0 2px 4px rgba(225, 29, 72, 0.08) !important;
        }
        
        /* 3D Emoji styling */
        .emoji-3d-tab {
          font-size: 2.25rem;
          line-height: 1;
          display: inline-block;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          filter: drop-shadow(0 1px 0 #94a3b8)
                  drop-shadow(0 2px 0 #64748b)
                  drop-shadow(0 4px 5px rgba(0, 0, 0, 0.12));
          transform-style: preserve-3d;
          perspective: 100px;
        }
        
        .dark .emoji-3d-tab {
          filter: drop-shadow(0 1px 0 #475569)
                  drop-shadow(0 2px 0 #334155)
                  drop-shadow(0 4px 5px rgba(0, 0, 0, 0.3));
        }
        
        .tab-3d-active .emoji-3d-tab {
          filter: drop-shadow(0 1px 0 #fca5a5)
                  drop-shadow(0 2px 0 #f43f5e)
                  drop-shadow(0 3px 0 #e11d48)
                  drop-shadow(0 4px 0 #be123c)
                  drop-shadow(0 6px 8px rgba(225, 29, 72, 0.35)) !important;
          transform: scale(1.05) translateZ(8px);
        }
        
        .tab-3d:hover .emoji-3d-tab {
          transform: scale(1.1) translateY(-4px) rotate(5deg);
        }
        
        .tab-3d-active:hover .emoji-3d-tab {
          transform: scale(1.15) translateY(-4px) rotate(5deg) translateZ(10px) !important;
        }
      `}</style>

      {/* Dynamic background lighting for premium depth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#e11d48]/5 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="p-6 md:p-10 space-y-10 max-w-7xl mx-auto w-full relative z-10">
        
        {/* 1. Module Header Banner (Full Width 3D) */}
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
          <span className="emoji-3d-header shrink-0">👥</span>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Comunidad Educativa</h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Directorio escolar consolidado de estudiantes, familias, docentes y administrativos.</p>
          </div>
        </section>

        {/* 2. Sub-tabs Navigation (Module Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full pt-2">
          <button
            onClick={() => setActiveSubTab('students')}
            className={`tab-3d flex flex-col items-center justify-center p-6 rounded-3xl text-slate-700 dark:text-slate-200 outline-none select-none ${
              activeSubTab === 'students' ? 'tab-3d-active' : ''
            }`}
          >
            <span className="emoji-3d-tab mb-3">🎓</span>
            <span className="text-xs font-black tracking-wider uppercase text-center">
              Estudiantes ({students.length})
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('teachers')}
            className={`tab-3d flex flex-col items-center justify-center p-6 rounded-3xl text-slate-700 dark:text-slate-200 outline-none select-none ${
              activeSubTab === 'teachers' ? 'tab-3d-active' : ''
            }`}
          >
            <span className="emoji-3d-tab mb-3">🧑‍🏫</span>
            <span className="text-xs font-black tracking-wider uppercase text-center">
              Docentes
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('admins')}
            className={`tab-3d flex flex-col items-center justify-center p-6 rounded-3xl text-slate-700 dark:text-slate-200 outline-none select-none ${
              activeSubTab === 'admins' ? 'tab-3d-active' : ''
            }`}
          >
            <span className="emoji-3d-tab mb-3">💼</span>
            <span className="text-xs font-black tracking-wider uppercase text-center">
              Administrativos
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('parents')}
            className={`tab-3d flex flex-col items-center justify-center p-6 rounded-3xl text-slate-700 dark:text-slate-200 outline-none select-none ${
              activeSubTab === 'parents' ? 'tab-3d-active' : ''
            }`}
          >
            <span className="emoji-3d-tab mb-3">👪</span>
            <span className="text-xs font-black tracking-wider uppercase text-center">
              Padres de Fam. ({parentsDirectory.length})
            </span>
          </button>
        </div>

        {/* 3. Tab Contents */}
        <div className="space-y-6">
          
          {activeSubTab === 'students' && (
            <div className="animate-in fade-in duration-300">
              <StudentManager isEmbedded={true} />
            </div>
          )}

          {activeSubTab === 'teachers' && (
            <div className="animate-in fade-in duration-300">
              <TeacherManager isEmbedded={true} filterRoleGroup="teachers" />
            </div>
          )}

          {activeSubTab === 'admins' && (
            <div className="animate-in fade-in duration-300">
              <TeacherManager isEmbedded={true} filterRoleGroup="admins" />
            </div>
          )}

          {activeSubTab === 'parents' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Description Card */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#e11d48]/5 rounded-full blur-3xl"></div>
                <h3 className="font-black text-slate-900 dark:text-white text-xl tracking-tight">Directorio de Padres y Apoderados</h3>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
                  Listado consolidado de apoderados vinculados a los estudiantes matriculados. Agrupado automáticamente por familia para facilitar el contacto.
                </p>
              </div>

              {/* Search Box */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar por apoderado, DNI, celular o nombre del hijo..." 
                    value={parentsSearchQuery}
                    onChange={(e) => setParentsSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-[#e11d48] dark:focus:border-rose-500 focus:ring-1 focus:ring-[#e11d48] dark:focus:ring-rose-500 transition-all outline-none font-medium"
                  />
                </div>
                <span className="text-xs font-black text-[#e11d48] dark:text-rose-400 uppercase tracking-widest bg-rose-50 dark:bg-rose-950/40 px-4 py-2 rounded-lg border border-rose-100 dark:border-rose-900/30">
                  Mostrando {filteredParents.length} apoderados
                </span>
              </div>

              {/* Parents Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredParents.length === 0 ? (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <Users className="h-12 w-12 text-[#e11d48]/40 mb-4 mx-auto" />
                    <p className="text-lg font-black text-slate-800 dark:text-white">No se encontraron padres de familia.</p>
                    <p className="text-sm text-slate-400 mt-2 font-medium">Asegúrese de registrar los datos de madre/padre en la ficha del estudiante.</p>
                  </div>
                ) : (
                  filteredParents.map((parent, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group">
                      <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-rose-500/5 rounded-full blur-xl" />
                      
                      <div className="space-y-4 relative z-10">
                        {/* Name / Relation Badge */}
                        <div className="flex flex-col gap-2">
                          <span className={`self-start text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${
                            parent.type === 'Madre' 
                              ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/30' 
                              : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/30'
                          }`}>
                            {parent.type}
                          </span>
                          <h4 className="font-black text-slate-900 dark:text-white text-lg leading-tight">
                            {parent.name}
                          </h4>
                        </div>

                        {/* Contact details */}
                        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contacto</p>
                          
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                            <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                              <Phone className="h-3.5 w-3.5 text-[#e11d48] dark:text-rose-400" />
                            </div>
                            <span>{parent.phone}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                            <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                              <Mail className="h-3.5 w-3.5 text-[#e11d48] dark:text-rose-400" />
                            </div>
                            <span className="truncate">{parent.email}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                            <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                              <FileText className="h-3.5 w-3.5 text-[#e11d48] dark:text-rose-400" />
                            </div>
                            <span>DNI: {parent.dni}</span>
                          </div>
                        </div>

                        {/* Linked Children List */}
                        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estudiantes a Cargo ({parent.children.length})</p>
                          
                          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                            {parent.children.map(child => (
                              <div key={child.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-3 truncate">
                                  <img src={child.avatar} alt="" className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-800" />
                                  <div className="truncate text-left">
                                    <p className="text-xs font-black text-slate-800 dark:text-slate-150 truncate">{child.name}</p>
                                    <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">{child.gradeLevel} - {child.section}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ComunidadEducativa;
