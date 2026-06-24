import React, { useState, useContext, useMemo, useEffect } from 'react';
import { DatabaseContext } from '../context/DatabaseContext';
import { 
  AlertTriangle, 
  Award, 
  BookOpen,
  Check,
  CheckCircle,
  Search,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Users,
  Info,
  Calendar,
  Sparkles
} from 'lucide-react';

const COEXISTENCE_AXES = [
  {
    id: 'eje1',
    title: 'Eje 1: Respeto y Buen Trato',
    color: 'from-blue-500/10 to-indigo-500/10 border-indigo-500/20 text-cyan-400',
    headerBg: 'bg-white/5 border-kinetic-cyan/50',
    norms: [
      { id: 1, text: 'Me comunico con los demás usando un lenguaje amable y respetuoso.' },
      { id: 2, text: 'Reconozco y valoro las diferencias personales, culturales y de opinión.' },
      { id: 3, text: 'Escucho con atención cuando otros expresan sus ideas y sentimientos.' },
      { id: 4, text: 'Fomento un ambiente donde todos se sientan aceptados y seguros.' }
    ]
  },
  {
    id: 'eje2',
    title: 'Eje 2: Responsabilidad y Cumplimiento',
    color: 'from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400',
    headerBg: 'bg-amber-500/10 border-amber-500/30',
    norms: [
      { id: 5, text: 'Ingreso puntualmente y participo activamente en cada actividad.' },
      { id: 6, text: 'Mantengo una presentación personal adecuada y uso correctamente el uniforme.' },
      { id: 7, text: 'Cumplo con mis tareas, compromisos académicos y acuerdos de aula.' },
      { id: 8, text: 'Sigo las orientaciones del docente para favorecer el aprendizaje de todos.' }
    ]
  },
  {
    id: 'eje3',
    title: 'Eje 3: Convivencia Pacífica',
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400',
    headerBg: 'bg-emerald-500/10 border-emerald-500/30',
    norms: [
      { id: 9, text: 'Dialogo para resolver diferencias, buscando acuerdos que beneficien a todos.' },
      { id: 10, text: 'Expreso mis emociones de manera adecuada y busco apoyo cuando lo necesito.' },
      { id: 11, text: 'Construyo relaciones positivas basadas en la empatía y la cooperación.' }
    ]
  },
  {
    id: 'eje4',
    title: 'Eje 4: Convivencia Digital y Tecnología',
    color: 'from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-400',
    headerBg: 'bg-purple-500/10 border-purple-500/30',
    norms: [
      { id: 12, text: 'Utilizo los dispositivos tecnológicos para aprender y trabajar de forma segura.' },
      { id: 13, text: 'Respeto la privacidad de mis compañeros y solo registro o comparto contenido con autorización.' },
      { id: 14, text: 'Participo en entornos digitales con responsabilidad, cordialidad y respeto.' },
      { id: 15, text: 'Cuido los equipos tecnológicos de la institución y los uso con fines educativos.' }
    ]
  },
  {
    id: 'eje5',
    title: 'Eje 5: Cuidado de los Espacios y Recursos',
    color: 'from-cyan-500/10 to-sky-500/10 border-cyan-500/20 text-cyan-400',
    headerBg: 'bg-cyan-500/10 border-cyan-500/30',
    norms: [
      { id: 16, text: 'Mantengo mi aula y los ambientes escolares limpios y ordenados.' },
      { id: 17, text: 'Cuido el mobiliario, materiales e infraestructura como parte de mi responsabilidad escolar.' },
      { id: 18, text: 'Promuevo prácticas de cuidado del ambiente dentro y fuera de la institución.' }
    ]
  },
  {
    id: 'eje6',
    title: 'Eje 6: Seguridad y Bienestar',
    color: 'from-rose-500/10 to-red-500/10 border-rose-500/20 text-rose-400',
    headerBg: 'bg-rose-500/10 border-rose-500/30',
    norms: [
      { id: 19, text: 'Me desplazo con responsabilidad y prudencia dentro de la institución.' },
      { id: 20, text: 'Practico el autocuidado y protejo mi integridad física y emocional.' },
      { id: 21, text: 'Participo en los protocolos de seguridad siguiendo las orientaciones del personal.' }
    ]
  }
];

function ConductLogger({
  embeddedGrade,
  embeddedSection,
  isEmbedded = false
}) {
  const { students, conduct, addConductRecord, currentRole, currentUser, courses } = useContext(DatabaseContext);

  // Filter states
  const [localGrade, setLocalGrade] = useState('Todos');
  const [localSection, setLocalSection] = useState('Todas');
  
  const filterGrade = isEmbedded ? embeddedGrade : localGrade;
  const setFilterGrade = isEmbedded ? () => {} : setLocalGrade;
  const filterSection = isEmbedded ? embeddedSection : localSection;
  const setFilterSection = isEmbedded ? () => {} : setLocalSection;

  // GAMA Interaction States
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedNorms, setSelectedNorms] = useState([]); // Array of selected norm objects: { id, text }
  
  // Log Form States
  const [complianceType, setComplianceType] = useState('yes'); // 'yes' (cumplió/merit), 'no' (incumplió/incident)
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logPoints, setLogPoints] = useState(5);
  const [eventDescription, setEventDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  // History Filter States
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all'); // all, merit, incident

  // Get available grade options (when standalone)
  const gradeOptions = useMemo(() => {
    if (currentRole === 'teacher') {
      const gradesSet = new Set();
      courses.forEach(c => {
        (c.assignments || []).forEach(asg => {
          if (asg.teacherId === currentUser?.id) {
            gradesSet.add(asg.gradeLevel);
          }
        });
      });
      return Array.from(gradesSet).sort();
    }
    return ['1ro Secundaria', '2do Secundaria', '3ro Secundaria', '4to Secundaria', '5to Secundaria'];
  }, [currentRole, currentUser, courses]);

  // Get available section options (when standalone)
  const sectionOptions = useMemo(() => {
    if (currentRole !== 'teacher') {
      return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    }
    const sectionsSet = new Set();
    courses.forEach(c => {
      (c.assignments || []).forEach(asg => {
        if (asg.teacherId === currentUser?.id) {
          if (filterGrade === 'Todos' || asg.gradeLevel === filterGrade) {
            (asg.sections || []).forEach(sec => sectionsSet.add(sec));
          }
        }
      });
    });
    return Array.from(sectionsSet).sort();
  }, [currentRole, currentUser, courses, filterGrade]);

  // Filter students based on role, grade and section
  const filteredStudents = useMemo(() => {
    let list = [...students];
    if (currentRole === 'teacher') {
      const allowedKeys = new Set();
      courses.forEach(c => {
        (c.assignments || []).forEach(asg => {
          if (asg.teacherId === currentUser?.id) {
            (asg.sections || []).forEach(sec => {
              allowedKeys.add(`${asg.gradeLevel.toLowerCase()}_${sec.toLowerCase()}`);
            });
          }
        });
      });
      list = list.filter(s => allowedKeys.has(`${(s.gradeLevel || '').toLowerCase()}_${(s.section || '').toLowerCase()}`));
    }
    if (filterGrade !== 'Todos') {
      list = list.filter(s => (s.gradeLevel || '').toLowerCase() === filterGrade.toLowerCase());
    }
    if (filterSection !== 'Todas') {
      list = list.filter(s => (s.section || '').trim().toLowerCase() === filterSection.toLowerCase());
    }
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
  }, [students, filterGrade, filterSection, currentRole, currentUser, courses]);

  // Search filtered student list
  const searchedStudents = useMemo(() => {
    return filteredStudents.filter(s => 
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.dni && s.dni.includes(studentSearch))
    );
  }, [filteredStudents, studentSearch]);

  // Calculate coexistence index for all students
  const studentMetrics = useMemo(() => {
    const metrics = {};
    students.forEach(std => {
      const studentRecords = conduct.filter(r => r.studentId === std.id);
      const total = studentRecords.length;
      const merits = studentRecords.filter(r => r.type === 'merit').length;
      const index = total > 0 ? Math.round((merits / total) * 100) : 100;
      metrics[std.id] = {
        total,
        merits,
        incidents: total - merits,
        index
      };
    });
    return metrics;
  }, [students, conduct]);

  // General classroom metrics
  const classroomStats = useMemo(() => {
    const studentIds = new Set(filteredStudents.map(s => s.id));
    const records = conduct.filter(rec => studentIds.has(rec.studentId));
    const total = records.length;
    const merits = records.filter(r => r.type === 'merit').length;
    const incidents = total - merits;
    const index = total > 0 ? Math.round((merits / total) * 100) : 100;
    return { total, merits, incidents, index };
  }, [conduct, filteredStudents]);

  // Set default description when selected norms change
  useEffect(() => {
    if (selectedNorms.length > 0) {
      const normsListText = selectedNorms.map(n => `"${n.text}"`).join(', ');
      setEventDescription(`Se registra comportamiento en relación a los acuerdos de convivencia: ${normsListText}`);
    } else {
      setEventDescription('');
    }
  }, [selectedNorms]);

  // Toggle single norm selection
  const handleToggleNorm = (norm) => {
    setSelectedNorms(prev => {
      const exists = prev.find(n => n.id === norm.id);
      if (exists) {
        return prev.filter(n => n.id !== norm.id);
      } else {
        return [...prev, norm];
      }
    });
  };

  // Toggle single student selection
  const handleToggleStudent = (id) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Select all visible students
  const handleSelectAllStudents = () => {
    setSelectedStudentIds(searchedStudents.map(s => s.id));
  };

  // Deselect all students
  const handleClearStudentSelection = () => {
    setSelectedStudentIds([]);
  };

  // Submit bulk records
  const handleRegisterCoexistence = (e) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) {
      alert('Por favor, seleccione al menos un estudiante.');
      return;
    }
    if (selectedNorms.length === 0) {
      alert('Por favor, seleccione al menos un descriptor o norma de convivencia.');
      return;
    }
    if (!eventDescription.trim()) {
      alert('Por favor, introduzca una descripción del suceso.');
      return;
    }

    const type = complianceType === 'yes' ? 'merit' : 'incident';
    // Negate points for incidents behind the scenes, keep positive for merits
    const pointsValue = complianceType === 'yes' ? Math.abs(logPoints) : -Math.abs(logPoints);

    // If multiple norms are selected, we can record them or log a single aggregate category
    const categoryName = selectedNorms.map(n => `Norma ${n.id}`).join(', ');
    const fullDescription = `${eventDescription.trim()}${actionTaken.trim() ? ` | Acción tomada: ${actionTaken.trim()}` : ''}`;

    // Call addConductRecord in loop for each selected student
    selectedStudentIds.forEach(id => {
      addConductRecord({
        studentId: id,
        type,
        points: pointsValue,
        category: categoryName,
        description: fullDescription,
        date: logDate // Pass the custom log date selected
      });
    });

    // Reset selection and form inputs
    setSelectedStudentIds([]);
    setSelectedNorms([]);
    setEventDescription('');
    setActionTaken('');
    setLogPoints(5);
    alert(`Éxito: Se registraron novedades de convivencia para ${selectedStudentIds.length} estudiante(s).`);
  };

  // Filter conduct history list
  const filteredHistory = useMemo(() => {
    return conduct.filter(rec => {
      const std = students.find(s => s.id === rec.studentId);
      if (!std) return false;
      
      // Filter by teacher assignments / stand-alone filters
      if (currentRole === 'teacher') {
        const allowedKeys = new Set();
        courses.forEach(c => {
          (c.assignments || []).forEach(asg => {
            if (asg.teacherId === currentUser?.id) {
              (asg.sections || []).forEach(sec => {
                allowedKeys.add(`${asg.gradeLevel.toLowerCase()}_${sec.toLowerCase()}`);
              });
            }
          });
        });
        if (!allowedKeys.has(`${(std.gradeLevel || '').toLowerCase()}_${(std.section || '').toLowerCase()}`)) return false;
      }

      if (filterGrade !== 'Todos' && (std.gradeLevel || '').toLowerCase() !== filterGrade.toLowerCase()) return false;
      if (filterSection !== 'Todas' && (std.section || '').trim().toLowerCase() !== filterSection.toLowerCase()) return false;

      // Filter by type
      if (historyFilter === 'merit' && rec.type !== 'merit') return false;
      if (historyFilter === 'incident' && rec.type !== 'incident') return false;

      // Filter by search query (student name or category)
      if (historySearch) {
        const q = historySearch.toLowerCase();
        const studentMatch = std.name.toLowerCase().includes(q);
        const categoryMatch = rec.category.toLowerCase().includes(q);
        const descMatch = rec.description.toLowerCase().includes(q);
        return studentMatch || categoryMatch || descMatch;
      }

      return true;
    }).sort((a, b) => b.id.localeCompare(a.id)); // Newest first
  }, [conduct, students, filterGrade, filterSection, currentRole, currentUser, courses, historyFilter, historySearch]);

  // Utility to get student initials for avatars
  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  // Utility to generate a gradient based on student name hash
  const getAvatarBg = (name) => {
    const hash = [...(name || '')].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
      'from-indigo-500 to-purple-500',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-pink-500 to-rose-500',
      'from-amber-500 to-orange-500',
      'from-violet-500 to-fuchsia-500',
      'from-sky-500 to-indigo-500',
    ];
    return gradients[hash % gradients.length];
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Stand-alone Filter Panel (Only shown when not embedded in classroom manager) */}
      {!isEmbedded && (
        <div className="glass-card-ecc border border-white/10 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Grado de Estudios</label>
            <select 
              value={filterGrade} 
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm font-semibold"
            >
              <option value="Todos">Todos los Grados</option>
              {gradeOptions.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Sección</label>
            <select 
              value={filterSection} 
              onChange={(e) => setFilterSection(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm font-semibold"
            >
              <option value="Todas">Todas las Secciones</option>
              {sectionOptions.map(s => (
                <option key={s} value={s}>Sección {s}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 2. Top Summary KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* General Index */}
        <div className="glass-card-ecc border border-white/10 p-6 bg-white/5  border-white/10/50  flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Índice de Convivencia General</span>
            <h3 className={`text-3xl font-black ${
              classroomStats.index >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
              classroomStats.index >= 75 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500'
            }`}>
              {classroomStats.index}%
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Cumplimiento positivo en el aula activa</p>
          </div>
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 z-10 ${
            classroomStats.index >= 75 ? 'bg-emerald-500/100/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/100/10 text-rose-500'
          }`}>
            <CheckCircle className="h-6 w-6" />
          </div>
          <div className="absolute -right-4 -bottom-4 h-16 w-16 bg-white/5 rounded-full blur-md" />
        </div>

        {/* Total Recognitions (Merits) */}
        <div className="glass-card-ecc border border-white/10 p-6 bg-white/5  border-white/10/50  flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Reconocimientos Totales</span>
            <h3 className="text-3xl font-black text-kinetic-cyan dark:text-cyan-300">
              +{classroomStats.merits * 5} <span className="text-xs font-bold text-slate-400">Pts (+{classroomStats.merits} registros)</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Puntos positivos aportados</p>
          </div>
          <div className="h-12 w-12 bg-white/5 text-kinetic-cyan dark:text-cyan-300 rounded-2xl flex items-center justify-center shrink-0 z-10">
            <Award className="h-6 w-6" />
          </div>
          <div className="absolute -right-4 -bottom-4 h-16 w-16 bg-white/5 rounded-full blur-md" />
        </div>

        {/* Total Incidents */}
        <div className="glass-card-ecc border border-white/10 p-6 bg-white/5  border-white/10/50  flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Incidencias / Alertas</span>
            <h3 className="text-3xl font-black text-rose-500">
              -{classroomStats.incidents * 5} <span className="text-xs font-bold text-slate-400">Pts (-{classroomStats.incidents} registros)</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Puntos descontados por incumplimiento</p>
          </div>
          <div className="h-12 w-12 bg-rose-500/100/10 text-rose-500 rounded-2xl flex items-center justify-center shrink-0 z-10">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="absolute -right-4 -bottom-4 h-16 w-16 bg-rose-500/100/5 rounded-full blur-md" />
        </div>

      </div>

      {/* 3. The Six Grid Cards representing the 6 Normative Axes */}
      <div className="space-y-3">
        <h4 className="text-sm font-extrabold text-white dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-kinetic-cyan" />
          1. Ejes de Convivencia Institucional (Selecciona uno o varios descriptores)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COEXISTENCE_AXES.map(axis => (
            <div 
              key={axis.id} 
              className="border border-white/10 rounded-2xl overflow-hidden glass-card flex flex-col justify-between"
            >
              {/* Header */}
              <div className={`p-4 border-b border-white/5 text-left bg-gradient-to-r ${axis.color}`}>
                <h5 className="text-xs font-black tracking-tight uppercase">{axis.title}</h5>
              </div>

              {/* Norm Descriptors */}
              <div className="p-4 space-y-2.5 flex-1 bg-white/5">
                {axis.norms.map(norm => {
                  const isNormSelected = selectedNorms.some(n => n.id === norm.id);
                  return (
                    <button
                      key={norm.id}
                      type="button"
                      onClick={() => handleToggleNorm(norm)}
                      className={`w-full text-left py-2.5 px-3 rounded-xl transition-all flex items-start gap-2.5 border ${
                        isNormSelected 
                          ? 'bg-white/5 border-kinetic-cyan/40 text-kinetic-cyan dark:text-cyan-300 font-bold  shadow-indigo-500/5' 
                          : 'border-white/10/50  text-slate-300  hover:bg-white/5 '
                      }`}
                    >
                      <span className={`h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isNormSelected ? 'bg-white/10 text-white' : 'bg-white/10  text-slate-400'
                      }`}>
                        {norm.id}
                      </span>
                      <span className="text-[11px] leading-relaxed flex-1">{norm.text}</span>
                      
                      <div className="shrink-0 pt-0.5">
                        {isNormSelected ? (
                          <div className="h-4 w-4 bg-white/10 text-white rounded-md flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-4 w-4 rounded-md border border-white/10  bg-white/5" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Lower workspace: Students grid on left, Logging form on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Student Selection Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card-ecc border border-white/10 p-5 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10  pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-white dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-kinetic-cyan" />
                  2. Lista de Alumnos (Seleccionar)
                </h4>
                <p className="text-[11px] text-slate-400">Marca a los alumnos que cometieron la misma falta o cumplieron la norma.</p>
              </div>

              {/* Selection Summary Badge */}
              {selectedStudentIds.length > 0 && (
                <span className="bg-white/10 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full animate-pulse">
                  {selectedStudentIds.length} seleccionados
                </span>
              )}
            </div>

            {/* Toolbar: Search + Quick select */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar estudiante por nombre o DNI..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-white/10  rounded-xl bg-white/5  text-xs font-semibold focus:border-kinetic-cyan outline-none"
                />
              </div>

              {/* Quick Select Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAllStudents}
                  className="px-3 py-2 border border-white/10  rounded-xl text-[10px] font-extrabold uppercase hover:bg-white/5  transition"
                >
                  Marcar Todos
                </button>
                <button
                  onClick={handleClearStudentSelection}
                  disabled={selectedStudentIds.length === 0}
                  className="px-3 py-2 border border-white/10  rounded-xl text-[10px] font-extrabold uppercase hover:bg-white/5  disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Students Grid */}
            {searchedStudents.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">No se encontraron estudiantes para este filtro.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
                {searchedStudents.map(student => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  const metrics = studentMetrics[student.id] || { index: 100, total: 0 };
                  const index = metrics.index;

                  return (
                    <div
                      key={student.id}
                      onClick={() => handleToggleStudent(student.id)}
                      className={`relative flex items-center p-3.5 rounded-2xl border cursor-pointer select-none hover:scale-[1.01] transition-all duration-200 ${
                        isSelected 
                          ? 'border-kinetic-cyan bg-white/5 dark:bg-indigo-950/15  shadow-indigo-500/10' 
                          : 'border-white/10  bg-white/5 '
                      }`}
                    >
                      {/* Avatar & Info */}
                      <div className="flex items-center gap-3 w-full pr-6">
                        {student.avatar ? (
                          <img 
                            src={student.avatar} 
                            alt={student.name} 
                            className="h-10 w-10 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <div className={`h-10 w-10 rounded-full bg-gradient-to-tr ${getAvatarBg(student.name)} text-white flex items-center justify-center text-xs font-bold  shadow-black/10`}>
                            {getInitials(student.name)}
                          </div>
                        )}

                        <div className="space-y-0.5 min-w-0">
                          <h5 className="font-extrabold text-xs text-white  truncate">
                            {student.name}
                          </h5>
                          
                          {/* Compliance index badge inside card */}
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                              index >= 90 ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                              index >= 75 ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                              'bg-rose-500/10 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                            }`}>
                              {index}% Convivencia
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase truncate">
                              ({metrics.total} reg)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Top Right Checkbox / Selection Circle */}
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        {isSelected ? (
                          <div className="h-5 w-5 bg-white/10 text-white rounded-full flex items-center justify-center shadow shadow-indigo-500/20">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border border-white/10  bg-white/5" />
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Form (5 cols) */}
        <div className="lg:col-span-5">
          <form onSubmit={handleRegisterCoexistence} className="glass-card-ecc border border-white/10 p-5 space-y-4 border border-white/10/60  bg-gradient-to-br from-indigo-50/10 to-purple-50/10 dark:from-indigo-950/5 dark:to-purple-950/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-white/5 rounded-full blur-xl" />
            
            <h4 className="text-sm font-extrabold text-white dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/10  pb-3">
              <Sparkles className="h-4.5 w-4.5 text-kinetic-cyan" />
              3. Registro de Novedad
            </h4>

            {selectedStudentIds.length === 0 ? (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white/5  border border-white/10">
                <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <p className="text-[10.5px] text-slate-400 leading-normal">
                  Por favor, selecciona a los estudiantes en el panel de la izquierda para habilitar el registro.
                </p>
              </div>
            ) : selectedNorms.length === 0 ? (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white/5 dark:bg-indigo-950/20 border border-kinetic-cyan/30/50 dark:border-indigo-900/20">
                <Info className="h-4 w-4 text-kinetic-cyan mt-0.5 shrink-0" />
                <p className="text-[10.5px] text-kinetic-cyan dark:text-cyan-300 leading-normal">
                  Tienes {selectedStudentIds.length} alumno(s) seleccionados. Ahora selecciona uno o más descriptores de la cuadrícula superior de Ejes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* 1. Cumplió / Incumplió Switch */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">¿Cumplió o Incumplió con el acuerdo?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setComplianceType('yes');
                        setLogPoints(5); // Default positive point
                      }}
                      className={`flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl font-bold text-xs transition border ${
                        complianceType === 'yes'
                          ? 'bg-emerald-500/100 border-emerald-500 text-white shadow shadow-emerald-500/20'
                          : 'bg-transparent  border-white/10  text-slate-300  hover:bg-white/5'
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Sí Cumplió
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setComplianceType('no');
                        setLogPoints(5); // Default negative points (entered as positive in UI)
                      }}
                      className={`flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl font-bold text-xs transition border ${
                        complianceType === 'no'
                          ? 'bg-rose-500/100 border-rose-500 text-white shadow shadow-rose-500/20'
                          : 'bg-transparent  border-white/10  text-slate-300  hover:bg-white/5'
                      }`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      No Cumplió
                    </button>
                  </div>
                </div>

                {/* 2. Date and Variable Points */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Fecha del Suceso</label>
                    <input
                      type="date"
                      required
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 text-xs focus:border-kinetic-cyan   font-semibold text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Puntaje Variable</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      required
                      value={logPoints}
                      onChange={(e) => setLogPoints(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 text-xs focus:border-kinetic-cyan   font-semibold text-slate-200"
                    />
                  </div>
                </div>

                {/* 3. Description of Event */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-400">Descripción del Suceso</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Detalla los hechos de forma objetiva..."
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-3.5 py-2.5 text-xs focus:border-kinetic-cyan   text-slate-200  leading-normal"
                  />
                </div>

                {/* 4. Action Taken */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-400">Acción Tomada por el Docente</label>
                  <textarea
                    rows="2"
                    placeholder="Ej: Diálogo reflexivo con el estudiante, compromiso de aula, etc."
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 text-xs focus:border-kinetic-cyan   text-slate-200  leading-normal"
                  />
                </div>

                {/* Submit Register button */}
                <button
                  type="submit"
                  className={`w-full py-3 px-4 rounded-xl text-white font-extrabold text-xs shadow-[0_0_15px_rgba(0,0,0,0.5)] uppercase tracking-wider transition-all duration-200 hover:scale-[1.01] active:scale-95 ${
                    complianceType === 'yes'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-650 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/10'
                      : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-750 shadow-rose-500/10'
                  }`}
                >
                  Registrar Novedad
                </button>

              </div>
            )}
          </form>
        </div>

      </div>

      {/* 5. History log (Bitácora de Coexistencia) */}
      <div className="glass-card-ecc border border-white/10 p-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10  pb-4">
          <h4 className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-kinetic-cyan" />
            Bitácora de Convivencia GAMA
          </h4>

          {/* Controls: Search and Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* History search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar bitácora por alumno o norma..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 border border-white/10  rounded-xl bg-white/5  text-xs font-semibold focus:border-kinetic-cyan outline-none w-52 sm:w-64"
              />
            </div>

            {/* Type selector */}
            <select
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
              className="bg-transparent  border border-white/10  px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200  outline-none cursor-pointer"
            >
              <option value="all">Ver Todos</option>
              <option value="merit">Solo Cumplidos (Reconocimientos)</option>
              <option value="incident">Solo Incumplidos (Incidencias)</option>
            </select>
          </div>
        </div>

        {/* History List */}
        <div className="mt-5 space-y-4 max-h-[480px] overflow-y-auto pr-1">
          {filteredHistory.length === 0 ? (
            <p className="text-slate-400 text-center py-8 italic font-semibold text-xs">
              Ningún registro de convivencia coincide con los filtros actuales.
            </p>
          ) : (
            filteredHistory.map(rec => {
              const std = students.find(s => s.id === rec.studentId);
              const isMerit = rec.type === 'merit';

              return (
                <div 
                  key={rec.id} 
                  className={`flex flex-col sm:flex-row items-start justify-between p-4.5 rounded-2xl border gap-4 ${
                    isMerit 
                      ? 'bg-emerald-50/40 border-emerald-500/20 dark:bg-emerald-950/10 dark:border-emerald-900/30' 
                      : 'bg-rose-50/40 border-rose-500/20 dark:bg-rose-950/10 dark:border-rose-900/30'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Icon status representation */}
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isMerit ? 'bg-emerald-500/100/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/100/10 text-rose-600 dark:text-rose-455'
                    }`}>
                      {isMerit ? <ThumbsUp className="h-5 w-5" /> : <ThumbsDown className="h-5 w-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-200">
                          {std ? std.name : 'Estudiante Removido'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">({std?.gradeLevel} - Secc. {std?.section || '-'})</span>
                      </div>

                      {/* Norm title info */}
                      <span className="text-[10px] uppercase font-black tracking-wider block mt-1">
                        Acuerdos Evaluados: <span className={isMerit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}>{rec.category}</span>
                      </span>

                      {/* Log text description */}
                      <p className="text-xs text-slate-300  mt-2 font-medium leading-relaxed whitespace-pre-line">
                        {rec.description}
                      </p>
                    </div>
                  </div>

                  {/* Points and Dates indicator */}
                  <div className="flex sm:flex-col items-end gap-2 text-right">
                    <span className="text-[10px] text-slate-400 font-extrabold">{rec.date}</span>
                    <span className={`text-xs font-black px-2.5 py-1.5 rounded-xl flex items-center gap-1 ${
                      isMerit 
                        ? 'bg-emerald-500/20 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                        : 'bg-rose-500/20 text-rose-800 dark:bg-rose-950 dark:text-rose-350'
                    }`}>
                      {rec.points > 0 ? `+${rec.points}` : rec.points} Pts
                    </span>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}

export default ConductLogger;
