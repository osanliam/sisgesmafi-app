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
    <div className="w-full h-full relative overflow-y-auto custom-scrollbar font-sans">
      <style>{`
        .mesh-gradient-bg {
          background-color: #0b1326;
          background-image: 
            radial-gradient(at 0% 0%, hsla(180,100%,30%,0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, hsla(300,100%,30%,0.15) 0px, transparent 50%),
            radial-gradient(at 100% 100%, hsla(150,100%,30%,0.15) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsla(220,100%,30%,0.15) 0px, transparent 50%);
        }
        .glass-card-ecc {
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
        }
        .tint-cyan { background: rgba(0, 240, 255, 0.03); border-color: rgba(0, 240, 255, 0.15); }
        .tint-magenta { background: rgba(254, 0, 254, 0.03); border-color: rgba(254, 0, 254, 0.15); }
        .tint-lime { background: rgba(0, 247, 166, 0.03); border-color: rgba(0, 247, 166, 0.15); }

        .glow-cyan { filter: drop-shadow(0 0 8px rgba(0, 240, 255, 0.6)); }
        .glow-magenta { filter: drop-shadow(0 0 8px rgba(254, 0, 254, 0.6)); }
        .glow-lime { filter: drop-shadow(0 0 8px rgba(0, 247, 166, 0.6)); }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(255, 255, 255, 0.1); 
          border-radius: 10px; 
        }
      `}</style>

      <div className="mesh-gradient-bg min-h-full w-full p-4 md:p-8 text-[#dae2fd]">
        <div className="space-y-8">
          
          {/* 1. Module Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card-ecc tint-cyan p-6 rounded-3xl">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-kinetic-cyan/10 text-kinetic-cyan rounded-xl flex items-center justify-center glow-cyan border border-kinetic-cyan/20">
                  <Users className="h-5 w-5" />
                </div>
                <h2 className="text-3xl font-black tracking-tight text-white">Comunidad Educativa</h2>
              </div>
              <p className="text-kinetic-cyan/80 text-xs font-bold uppercase tracking-wider ml-13">Directorio escolar consolidado de estudiantes, familias, docentes y administrativos.</p>
            </div>
          </div>

          {/* 2. Sub-tabs Navigation (Module Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full mb-6">
            <button
              onClick={() => setActiveSubTab('students')}
              className={`group flex flex-col items-center justify-center p-4 aspect-[2/1] sm:aspect-square md:aspect-auto md:h-32 module-card module-card-cyan ${
                activeSubTab === 'students' ? 'active scale-[1.02] ring-2 ring-cyan-500/15' : ''
              }`}
            >
              <GraduationCap className="h-7 w-7 sm:h-10 sm:w-10 mb-2.5 transition-transform duration-300 group-hover:scale-105 text-inherit shrink-0" />
              <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase leading-snug text-slate-200 text-center">
                Estudiantes <br className="hidden md:block" />({students.length})
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('teachers')}
              className={`group flex flex-col items-center justify-center p-4 aspect-[2/1] sm:aspect-square md:aspect-auto md:h-32 module-card module-card-blue ${
                activeSubTab === 'teachers' ? 'active scale-[1.02] ring-2 ring-blue-500/15' : ''
              }`}
            >
              <UserCheck className="h-7 w-7 sm:h-10 sm:w-10 mb-2.5 transition-transform duration-300 group-hover:scale-105 text-inherit shrink-0" />
              <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase leading-snug text-slate-200 text-center">
                Docentes
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('admins')}
              className={`group flex flex-col items-center justify-center p-4 aspect-[2/1] sm:aspect-square md:aspect-auto md:h-32 module-card module-card-purple ${
                activeSubTab === 'admins' ? 'active scale-[1.02] ring-2 ring-purple-500/15' : ''
              }`}
            >
              <User className="h-7 w-7 sm:h-10 sm:w-10 mb-2.5 transition-transform duration-300 group-hover:scale-105 text-inherit shrink-0" />
              <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase leading-snug text-slate-200 text-center">
                Administrativos
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('parents')}
              className={`group flex flex-col items-center justify-center p-4 aspect-[2/1] sm:aspect-square md:aspect-auto md:h-32 module-card module-card-teal ${
                activeSubTab === 'parents' ? 'active scale-[1.02] ring-2 ring-teal-500/15' : ''
              }`}
            >
              <Users className="h-7 w-7 sm:h-10 sm:w-10 mb-2.5 transition-transform duration-300 group-hover:scale-105 text-inherit shrink-0" />
              <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase leading-snug text-slate-200 text-center">
                Padres de Fam. <br className="hidden md:block" />({parentsDirectory.length})
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
              <div className="space-y-8 animate-in fade-in duration-300">
                
                {/* Description Card */}
                <div className="glass-card-ecc tint-magenta p-8 rounded-3xl relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-kinetic-magenta/10 rounded-full blur-3xl"></div>
                  <h3 className="font-black text-white text-xl tracking-tight">Directorio de Padres y Apoderados</h3>
                  <p className="text-sm font-bold text-[#ffabf3] mt-2 max-w-2xl">
                    Listado consolidado de apoderados vinculados a los estudiantes matriculados. Agrupado automáticamente por familia para facilitar el contacto.
                  </p>
                </div>

                {/* Search Box */}
                <div className="glass-card-ecc tint-lime p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-kinetic-lime glow-lime" />
                    <input 
                      type="text" 
                      placeholder="Buscar por apoderado, DNI, celular o nombre del hijo..." 
                      value={parentsSearchQuery}
                      onChange={(e) => setParentsSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-400 focus:border-kinetic-lime focus:ring-1 focus:ring-kinetic-lime transition-all outline-none font-medium"
                    />
                  </div>
                  <span className="text-sm font-black text-kinetic-lime uppercase tracking-widest bg-kinetic-lime/10 px-4 py-2 rounded-lg border border-kinetic-lime/20">
                    Mostrando {filteredParents.length} apoderados
                  </span>
                </div>

                {/* Parents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredParents.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16 glass-card-ecc rounded-3xl">
                      <Users className="h-12 w-12 text-kinetic-magenta glow-magenta mb-4 mx-auto" />
                      <p className="text-lg font-black text-white">No se encontraron padres de familia.</p>
                      <p className="text-sm text-slate-400 mt-2 font-medium">Asegúrese de registrar los datos de madre/padre en la ficha del estudiante.</p>
                    </div>
                  ) : (
                    filteredParents.map((parent, idx) => (
                      <div key={idx} className="glass-card-ecc rounded-[2rem] p-8 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-kinetic-cyan/5 rounded-full blur-xl group-hover:bg-kinetic-cyan/10 transition-colors" />
                        
                        <div className="space-y-6 relative z-10">
                          {/* Name / Relation Badge */}
                          <div className="flex flex-col gap-3">
                            <span className={`self-start text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${
                              parent.type === 'Madre' 
                                ? 'bg-kinetic-magenta/10 text-kinetic-magenta border-kinetic-magenta/20 glow-magenta' 
                                : 'bg-kinetic-cyan/10 text-kinetic-cyan border-kinetic-cyan/20 glow-cyan'
                            }`}>
                              {parent.type}
                            </span>
                            <h4 className="font-black text-white text-xl leading-tight">
                              {parent.name}
                            </h4>
                          </div>

                          {/* Contact details */}
                          <div className="space-y-3 pt-4 border-t border-white/10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</p>
                            
                            <div className="flex items-center gap-3 text-sm font-bold text-[#b9cacb]">
                              <div className="p-1.5 rounded-lg bg-kinetic-lime/10 border border-kinetic-lime/20">
                                <Phone className="h-4 w-4 text-kinetic-lime glow-lime" />
                              </div>
                              <span>{parent.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-bold text-[#b9cacb]">
                              <div className="p-1.5 rounded-lg bg-kinetic-lime/10 border border-kinetic-lime/20">
                                <Mail className="h-4 w-4 text-kinetic-lime glow-lime" />
                              </div>
                              <span className="truncate">{parent.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-bold text-[#b9cacb]">
                              <div className="p-1.5 rounded-lg bg-kinetic-lime/10 border border-kinetic-lime/20">
                                <FileText className="h-4 w-4 text-kinetic-lime glow-lime" />
                              </div>
                              <span>DNI: {parent.dni}</span>
                            </div>
                          </div>

                          {/* Linked Children List */}
                          <div className="space-y-3 pt-4 border-t border-white/10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudiantes a Cargo ({parent.children.length})</p>
                            
                            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                              {parent.children.map(child => (
                                <div key={child.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                  <div className="flex items-center gap-3 truncate">
                                    <img src={child.avatar} alt="" className="h-10 w-10 rounded-full object-cover border-2 border-[#0b1326]" />
                                    <div className="truncate">
                                      <p className="text-sm font-black text-white truncate">{child.name}</p>
                                      <p className="text-[10px] text-kinetic-cyan font-bold uppercase tracking-wider">{child.gradeLevel} - {child.section}</p>
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
    </div>
  );
}

export default ComunidadEducativa;
