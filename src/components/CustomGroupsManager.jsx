import React, { useState, useContext, useMemo } from 'react';
import { DatabaseContext } from '../context/DatabaseContext';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Calendar, 
  ClipboardList, 
  Check, 
  X, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  GraduationCap, 
  Info,
  Search,
  CheckSquare,
  Square
} from 'lucide-react';

function CustomGroupsManager() {
  const { 
    students, 
    customGroups, 
    saveCustomGroup, 
    deleteCustomGroup, 
    groupAttendance, 
    saveGroupAttendance, 
    groupGrades, 
    saveGroupEvaluation, 
    deleteGroupEvaluation,
    currentUser,
    currentRole,
    gradingScale,
    passingGrade
  } = useContext(DatabaseContext);

  // Active sub-tab state
  const [activeSubTab, setActiveSubTab] = useState('groups'); // 'groups', 'attendance', 'grades', 'reports'

  // Filtering / selection states for group editing
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [gradeFilter, setGradeFilter] = useState('1ro Secundaria');
  const [sectionFilter, setSectionFilter] = useState('A');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Attendance states
  const [selectedAttGroupId, setSelectedAttGroupId] = useState(customGroups[0]?.id || '');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: 'present'/'late'/'absent' }
  const [attendanceRemarks, setAttendanceRemarks] = useState({}); // { studentId: remarkText }

  // Grades states
  const [selectedGrdGroupId, setSelectedGrdGroupId] = useState(customGroups[0]?.id || '');
  const [selectedEvalId, setSelectedEvalId] = useState('new');
  const [evaluationName, setEvaluationName] = useState('');
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split('T')[0]);
  const [scoresRecords, setScoresRecords] = useState({}); // { studentId: score }

  // Reports states
  const [selectedRepGroupId, setSelectedRepGroupId] = useState(customGroups[0]?.id || '');

  // Helper to convert any score to its literal grade (AD, A, B, C)
  const getLiteralGrade = (scoreVal) => {
    const valStr = String(scoreVal);
    if (['AD', 'A', 'B', 'C'].includes(valStr)) return valStr;
    const num = parseFloat(scoreVal);
    if (!isNaN(num)) {
      if (num > 10) {
        if (num >= 17) return 'AD';
        if (num >= 12) return 'A';
        if (num >= 8) return 'B';
        return 'C';
      } else {
        if (num >= 8.5) return 'AD';
        if (num >= 6.0) return 'A';
        if (num >= 4.0) return 'B';
        return 'C';
      }
    }
    return 'C';
  };

  // Convert letter grade to numerical value for average calculations
  const letterToValue = (letter) => {
    if (letter === 'AD') return 4;
    if (letter === 'A') return 3;
    if (letter === 'B') return 2;
    return 1; // C
  };

  const valueToLetter = (val) => {
    if (val >= 3.5) return 'AD';
    if (val >= 2.5) return 'A';
    if (val >= 1.5) return 'B';
    return 'C';
  };

  // 1. Groups Manager Logic
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchGrade = (s.gradeLevel || '').trim().toLowerCase() === (gradeFilter || '').trim().toLowerCase();
      const matchSection = (s.section || '').trim().toLowerCase() === (sectionFilter || '').trim().toLowerCase();
      const matchSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.dni || '').includes(searchQuery);
      return matchGrade && matchSection && matchSearch;
    });
  }, [students, gradeFilter, sectionFilter, searchQuery]);

  const handleCreateNewGroupClick = () => {
    setEditingGroupId(null);
    setGroupName('');
    setSelectedStudentIds([]);
    setIsFormOpen(true);
  };

  const handleEditGroupClick = (group) => {
    setEditingGroupId(group.id);
    setGroupName(group.name);
    setSelectedStudentIds(group.studentIds || []);
    setIsFormOpen(true);
  };

  const toggleStudentSelection = (studentId) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredStudents.map(s => s.id);
    const missingIds = allFilteredIds.filter(id => !selectedStudentIds.includes(id));
    if (missingIds.length === 0) {
      // If all filtered are already selected, deselect all filtered
      setSelectedStudentIds(selectedStudentIds.filter(id => !allFilteredIds.includes(id)));
    } else {
      // Add all missing filtered ids
      setSelectedStudentIds([...selectedStudentIds, ...missingIds]);
    }
  };

  const handleSaveGroup = (e) => {
    e.preventDefault();
    if (!groupName.trim()) return alert('Ingrese un nombre para el grupo.');
    if (selectedStudentIds.length === 0) return alert('Seleccione al menos un estudiante.');

    saveCustomGroup({
      id: editingGroupId,
      name: groupName.trim(),
      studentIds: selectedStudentIds
    });

    setIsFormOpen(false);
    setGroupName('');
    setSelectedStudentIds([]);
  };

  // 2. Attendance Tracker Logic
  const activeAttGroup = useMemo(() => {
    return customGroups.find(g => g.id === selectedAttGroupId);
  }, [customGroups, selectedAttGroupId]);

  const activeAttStudents = useMemo(() => {
    if (!activeAttGroup) return [];
    return students.filter(s => activeAttGroup.studentIds.includes(s.id));
  }, [students, activeAttGroup]);

  // Load existing group attendance when group or date changes
  const loadAttendance = () => {
    if (!selectedAttGroupId) return;
    const existing = groupAttendance.find(a => a.groupId === selectedAttGroupId && a.date === attendanceDate);
    const initialRecords = {};
    const initialRemarks = {};
    
    activeAttStudents.forEach(s => {
      initialRecords[s.id] = existing?.attendance[s.id] || 'present';
      initialRemarks[s.id] = existing?.remarks[s.id] || '';
    });
    
    setAttendanceRecords(initialRecords);
    setAttendanceRemarks(initialRemarks);
  };

  React.useEffect(() => {
    loadAttendance();
  }, [selectedAttGroupId, attendanceDate, groupAttendance]);

  const handleSaveAttendance = () => {
    if (!selectedAttGroupId) return;
    saveGroupAttendance(selectedAttGroupId, attendanceDate, attendanceRecords, attendanceRemarks);
    alert('Asistencia del grupo registrada exitosamente.');
  };

  // 3. Grades Logic
  const activeGrdGroup = useMemo(() => {
    return customGroups.find(g => g.id === selectedGrdGroupId);
  }, [customGroups, selectedGrdGroupId]);

  const activeGrdStudents = useMemo(() => {
    if (!activeGrdGroup) return [];
    return students.filter(s => activeGrdGroup.studentIds.includes(s.id));
  }, [students, activeGrdGroup]);

  const groupEvaluations = useMemo(() => {
    return groupGrades.filter(g => g.groupId === selectedGrdGroupId);
  }, [groupGrades, selectedGrdGroupId]);

  // Load existing group evaluation values
  const loadEvaluationData = () => {
    if (selectedEvalId === 'new') {
      setEvaluationName('');
      setEvaluationDate(new Date().toISOString().split('T')[0]);
      const initial = {};
      activeGrdStudents.forEach(s => {
        initial[s.id] = '';
      });
      setScoresRecords(initial);
    } else {
      const target = groupGrades.find(g => g.id === selectedEvalId);
      if (target) {
        setEvaluationName(target.name);
        setEvaluationDate(target.date);
        const initial = {};
        activeGrdStudents.forEach(s => {
          initial[s.id] = target.scores[s.id] !== undefined ? target.scores[s.id] : '';
        });
        setScoresRecords(initial);
      }
    }
  };

  React.useEffect(() => {
    loadEvaluationData();
  }, [selectedEvalId, selectedGrdGroupId, groupGrades]);

  const handleSaveEvaluation = (e) => {
    e.preventDefault();
    if (!selectedGrdGroupId) return;
    if (!evaluationName.trim()) return alert('Ingrese un nombre para la evaluación.');

    // Convert values to correct types based on scale
    const finalScores = {};
    for (const key in scoresRecords) {
      const val = scoresRecords[key];
      if (val !== '') {
        if (gradingScale === 'literal') {
          finalScores[key] = getLiteralGrade(val.toUpperCase());
        } else {
          finalScores[key] = isNaN(parseFloat(val)) ? val : parseFloat(val);
        }
      }
    }

    saveGroupEvaluation(selectedGrdGroupId, selectedEvalId === 'new' ? null : selectedEvalId, {
      name: evaluationName.trim(),
      date: evaluationDate,
      scores: finalScores
    });

    alert('Evaluación guardada con éxito.');
    setSelectedEvalId('new');
    setEvaluationName('');
  };

  // 4. Reports Logic
  const activeRepGroup = useMemo(() => {
    return customGroups.find(g => g.id === selectedRepGroupId);
  }, [customGroups, selectedRepGroupId]);

  const activeRepStudents = useMemo(() => {
    if (!activeRepGroup) return [];
    return students.filter(s => activeRepGroup.studentIds.includes(s.id));
  }, [students, activeRepGroup]);

  const groupMetrics = useMemo(() => {
    if (!activeRepGroup) return null;

    const groupEvalCount = groupGrades.filter(g => g.groupId === activeRepGroup.id).length;
    const groupAttCount = groupAttendance.filter(a => a.groupId === activeRepGroup.id).length;
    
    // Calculate metrics for each student in the group
    const studentReportList = activeRepStudents.map(std => {
      // 1. Group Attendance Rate
      const stdAtts = groupAttendance.filter(a => a.groupId === activeRepGroup.id);
      let presentCount = 0;
      let totalAttClasses = stdAtts.length;
      
      stdAtts.forEach(att => {
        if (att.attendance[std.id] === 'present' || att.attendance[std.id] === 'late') {
          presentCount++;
        }
      });
      const attendanceRate = totalAttClasses > 0 ? Math.round((presentCount / totalAttClasses) * 100) : 100;

      // 2. Group Grade Average
      const stdScores = [];
      const evals = groupGrades.filter(g => g.groupId === activeRepGroup.id);
      
      evals.forEach(ev => {
        const score = ev.scores[std.id];
        if (score !== undefined && score !== '') {
          stdScores.push(score);
        }
      });

      let averageGrade = 'S/N';
      let inDanger = false;

      if (stdScores.length > 0) {
        if (gradingScale === 'literal') {
          const totalVal = stdScores.reduce((sum, s) => sum + letterToValue(s), 0);
          averageGrade = valueToLetter(totalVal / stdScores.length);
          inDanger = averageGrade === 'C';
        } else {
          const avgNum = stdScores.reduce((sum, s) => sum + (parseFloat(s) || 0), 0) / stdScores.length;
          averageGrade = avgNum.toFixed(1);
          inDanger = avgNum < (parseFloat(passingGrade) || 6.0);
        }
      }

      if (attendanceRate < 80) {
        inDanger = true;
      }

      return {
        student: std,
        attendanceRate,
        attendedCount: presentCount,
        totalClasses: totalAttClasses,
        averageGrade,
        inDanger
      };
    });

    // Aggregates
    const dangerCount = studentReportList.filter(s => s.inDanger).length;
    const avgAttendance = studentReportList.length > 0 
      ? Math.round(studentReportList.reduce((sum, s) => sum + s.attendanceRate, 0) / studentReportList.length) 
      : 100;

    return {
      evalCount: groupEvalCount,
      attCount: groupAttCount,
      studentReports: studentReportList,
      dangerCount,
      avgAttendance
    };
  }, [activeRepGroup, activeRepStudents, groupGrades, groupAttendance, gradingScale, passingGrade]);

  // Set default group selections when groups are loaded
  React.useEffect(() => {
    if (customGroups.length > 0) {
      if (!selectedAttGroupId) setSelectedAttGroupId(customGroups[0].id);
      if (!selectedGrdGroupId) setSelectedGrdGroupId(customGroups[0].id);
      if (!selectedRepGroupId) setSelectedRepGroupId(customGroups[0].id);
    }
  }, [customGroups]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Grupos Especiales</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Crea talleres, refuerzos académicos y proyectos con listas personalizadas de alumnos de cualquier sección.
          </p>
        </div>
        
        {activeSubTab === 'groups' && !isFormOpen && (
          <button
            onClick={handleCreateNewGroupClick}
            className="btn-neuro-primary flex items-center gap-2 text-xs"
          >
            <Plus className="h-4.5 w-4.5" />
            Crear Grupo Especial
          </button>
        )}
      </div>

      {/* Sub-tabs Navigation (Module Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full mb-6">
        <button
          onClick={() => { setActiveSubTab('groups'); setIsFormOpen(false); }}
          className={`group flex flex-col items-center justify-center p-4 aspect-[2/1] sm:aspect-square md:aspect-auto md:h-32 module-card module-card-blue ${
            activeSubTab === 'groups' ? 'active scale-[1.02] ring-2 ring-blue-500/15' : ''
          }`}
        >
          <Users className="h-7 w-7 sm:h-10 sm:w-10 mb-2.5 transition-transform duration-300 group-hover:scale-105 text-inherit shrink-0" />
          <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase leading-snug text-slate-200 text-center">
            Grupos <br className="hidden md:block" />({customGroups.length})
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`group flex flex-col items-center justify-center p-4 aspect-[2/1] sm:aspect-square md:aspect-auto md:h-32 module-card module-card-green ${
            activeSubTab === 'attendance' ? 'active scale-[1.02] ring-2 ring-green-500/15' : ''
          } ${customGroups.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={customGroups.length === 0}
        >
          <Calendar className="h-7 w-7 sm:h-10 sm:w-10 mb-2.5 transition-transform duration-300 group-hover:scale-105 text-inherit shrink-0" />
          <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase leading-snug text-slate-200 text-center">
            Asistencia <br className="hidden md:block" />Taller
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('grades')}
          className={`group flex flex-col items-center justify-center p-4 aspect-[2/1] sm:aspect-square md:aspect-auto md:h-32 module-card module-card-purple ${
            activeSubTab === 'grades' ? 'active scale-[1.02] ring-2 ring-purple-500/15' : ''
          } ${customGroups.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={customGroups.length === 0}
        >
          <ClipboardList className="h-7 w-7 sm:h-10 sm:w-10 mb-2.5 transition-transform duration-300 group-hover:scale-105 text-inherit shrink-0" />
          <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase leading-snug text-slate-200 text-center">
            Calificaciones <br className="hidden md:block" />Taller
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`group flex flex-col items-center justify-center p-4 aspect-[2/1] sm:aspect-square md:aspect-auto md:h-32 module-card module-card-teal ${
            activeSubTab === 'reports' ? 'active scale-[1.02] ring-2 ring-teal-500/15' : ''
          } ${customGroups.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={customGroups.length === 0}
        >
          <TrendingUp className="h-7 w-7 sm:h-10 sm:w-10 mb-2.5 transition-transform duration-300 group-hover:scale-105 text-inherit shrink-0" />
          <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase leading-snug text-slate-200 text-center">
            Reportes <br className="hidden md:block" />y Logros
          </span>
        </button>
      </div>

      {/* --- Tab 1: Groups Manager --- */}
      {activeSubTab === 'groups' && (
        <div className="space-y-6">
          {isFormOpen ? (
            <form onSubmit={handleSaveGroup} className="glass-card p-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
                <h4 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  {editingGroupId ? 'Modificar Grupo Especial' : 'Crear Nuevo Grupo Especial'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 text-xl font-black"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-400">Nombre del Grupo/Taller *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Taller de Nivelación Pedagógica - Comunicación"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900/60"
                />
              </div>

              {/* Student selection workspace */}
              <div className="border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-5 bg-slate-50/40 dark:bg-slate-950/20 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h5 className="text-xs font-bold text-slate-500 uppercase">Selección de Alumnos</h5>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full">
                    {selectedStudentIds.length} Alumnos Seleccionados
                  </span>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <select
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900"
                    >
                      <option value="1ro Secundaria">1ro Secundaria</option>
                      <option value="2do Secundaria">2do Secundaria</option>
                      <option value="3ro Secundaria">3ro Secundaria</option>
                      <option value="4to Secundaria">4to Secundaria</option>
                      <option value="5to Secundaria">5to Secundaria</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={sectionFilter}
                      onChange={(e) => setSectionFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900"
                    >
                      <option value="A">Sección A</option>
                      <option value="B">Sección B</option>
                      <option value="C">Sección C</option>
                      <option value="D">Sección D</option>
                      <option value="E">Sección E</option>
                      <option value="F">Sección F</option>
                      <option value="G">Sección G</option>
                      <option value="H">Sección H</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por DNI o nombre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>
                </div>

                {/* Students list */}
                <div className="max-h-60 overflow-y-auto border border-slate-100 dark:border-slate-800/60 rounded-2xl bg-white dark:bg-slate-900/60 divide-y divide-slate-100 dark:divide-slate-800/40">
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/45 flex items-center justify-between sticky top-0 z-10">
                    <span className="text-[10px] font-black uppercase text-slate-400">Estudiante</span>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[10px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {filteredStudents.every(s => selectedStudentIds.includes(s.id)) ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                    </button>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs italic">
                      No se encontraron alumnos en este grado o sección.
                    </div>
                  ) : (
                    filteredStudents.map(s => {
                      const isSelected = selectedStudentIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleStudentSelection(s.id)}
                          className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/40 cursor-pointer transition select-none"
                        >
                          <div className="flex items-center gap-3">
                            <img src={s.avatar} alt="" className="h-7 w-7 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{s.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">DNI: {s.dni}</p>
                            </div>
                          </div>
                          
                          <div>
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                              <Square className="h-5 w-5 text-slate-300 dark:text-slate-700" />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="btn-neuro-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-neuro-primary text-xs"
                >
                  Guardar Grupo Especial
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customGroups.length === 0 ? (
                <div className="md:col-span-3 text-center py-12 glass-card p-6 flex flex-col items-center justify-center text-slate-400">
                  <Users className="h-10 w-10 text-indigo-500 mb-3" />
                  <p className="text-sm font-semibold">No has creado ningún Grupo Especial todavía.</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Haz clic en el botón de arriba a la derecha para crear tu primer grupo y comenzar a registrar asistencias y notas independientes.
                  </p>
                </div>
              ) : (
                customGroups.map(group => {
                  const groupStudents = students.filter(s => (group.studentIds || []).includes(s.id));
                  return (
                    <div 
                      key={group.id} 
                      className="glass-card p-6 flex flex-col justify-between border border-slate-200/50 dark:border-slate-800/60 hover:scale-[1.01] transition-transform duration-250 relative overflow-hidden group"
                    >
                      <div className="absolute -right-4 -bottom-4 h-20 w-20 bg-indigo-500/5 rounded-full blur-lg" />
                      
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                            {group.name}
                          </h4>
                          <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                            {groupStudents.length} Alum.
                          </span>
                        </div>

                        {/* List view preview */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Miembros del Grupo:</p>
                          <div className="max-h-24 overflow-y-auto space-y-1">
                            {groupStudents.slice(0, 5).map(s => (
                              <p key={s.id} className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                • {s.name} <span className="text-[10px] text-slate-400">({s.gradeLevel})</span>
                              </p>
                            ))}
                            {groupStudents.length > 5 && (
                              <p className="text-[10px] text-indigo-500 font-bold italic mt-1">
                                + {groupStudents.length - 5} alumnos más...
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card actions */}
                      <div className="flex justify-end gap-1.5 border-t border-slate-100 mt-4 pt-3 dark:border-slate-800/40 z-10">
                        <button
                          onClick={() => handleEditGroupClick(group)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition"
                          title="Modificar Alumnos o Nombre"
                        >
                          <Edit className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Está seguro de eliminar el grupo "${group.name}"? Se borrarán también las notas e informes del grupo.`)) {
                              deleteCustomGroup(group.id);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition"
                          title="Eliminar Grupo"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* --- Tab 2: Group Attendance --- */}
      {activeSubTab === 'attendance' && (
        <div className="glass-card p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-bold text-lg">Asistencia de Grupo Especial</h4>
            </div>

            {/* Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <select
                  value={selectedAttGroupId}
                  onChange={(e) => setSelectedAttGroupId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold dark:border-slate-800 dark:bg-slate-900"
                >
                  {customGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold dark:border-slate-800 dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {activeAttStudents.length === 0 ? (
            <div className="text-center py-6 text-slate-400 italic text-sm">
              Seleccione un grupo para ver el registro.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Students grid and attendance buttons */}
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/60 rounded-2xl">
                <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
                  <thead className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-900/60 dark:text-slate-350">
                    <tr>
                      <th className="px-6 py-3.5">Estudiante</th>
                      <th className="px-6 py-3.5 text-center">Estado de Asistencia</th>
                      <th className="px-6 py-3.5">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {activeAttStudents.map(s => {
                      const currentStatus = attendanceRecords[s.id] || 'present';
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <img src={s.avatar} alt="" className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                              <div>
                                <p className="font-bold text-slate-800 dark:text-slate-100">{s.name}</p>
                                <p className="text-[10px] text-slate-400">{s.gradeLevel} - Secc. {s.section}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Present button */}
                              <button
                                type="button"
                                onClick={() => setAttendanceRecords({ ...attendanceRecords, [s.id]: 'present' })}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                                  currentStatus === 'present'
                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-800 dark:hover:bg-slate-700'
                                }`}
                              >
                                <Check className="h-3 w-3" />
                                Presente
                              </button>

                              {/* Late button */}
                              <button
                                type="button"
                                onClick={() => setAttendanceRecords({ ...attendanceRecords, [s.id]: 'late' })}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                                  currentStatus === 'late'
                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-800 dark:hover:bg-slate-700'
                                }`}
                              >
                                <Clock className="h-3 w-3" />
                                Tardanza
                              </button>

                              {/* Absent button */}
                              <button
                                type="button"
                                onClick={() => setAttendanceRecords({ ...attendanceRecords, [s.id]: 'absent' })}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                                  currentStatus === 'absent'
                                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/10'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-800 dark:hover:bg-slate-700'
                                }`}
                              >
                                <X className="h-3 w-3" />
                                Falta
                              </button>
                            </div>
                          </td>

                          <td className="px-6 py-3.5">
                            <input
                              type="text"
                              placeholder="Justificación, tardanza por..."
                              value={attendanceRemarks[s.id] || ''}
                              onChange={(e) => setAttendanceRemarks({ ...attendanceRemarks, [s.id]: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-white/50 px-3 py-1.5 text-xs focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Save attendance bar */}
              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  className="btn-neuro-primary flex items-center gap-2 text-xs"
                >
                  <Save className="h-4.5 w-4.5" />
                  Guardar Asistencia de Grupo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Tab 3: Group Grades --- */}
      {activeSubTab === 'grades' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Select Group & Evaluation */}
          <div className="glass-card p-6 space-y-4">
            <h4 className="font-bold text-lg border-b border-slate-100 pb-3 dark:border-slate-800">Evaluaciones del Taller</h4>
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-slate-400">Grupo Especial</label>
              <select
                value={selectedGrdGroupId}
                onChange={(e) => {
                  setSelectedGrdGroupId(e.target.value);
                  setSelectedEvalId('new');
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold dark:border-slate-800 dark:bg-slate-900"
              >
                {customGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-black uppercase text-slate-400">Seleccionar Evaluación</label>
                {selectedEvalId !== 'new' && (
                  <button 
                    onClick={() => setSelectedEvalId('new')}
                    className="text-[10px] font-bold text-indigo-600 hover:underline"
                  >
                    + Crear Nueva
                  </button>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-100 dark:border-slate-800/40 p-2.5 rounded-2xl bg-slate-50/45 dark:bg-slate-950/20">
                <button
                  onClick={() => setSelectedEvalId('new')}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition ${
                    selectedEvalId === 'new'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 border border-slate-200/50 hover:bg-slate-100'
                  }`}
                >
                  🆕 Nueva Actividad de Grupo
                </button>

                {groupEvaluations.map(ev => (
                  <div 
                    key={ev.id}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition border border-slate-250/20 ${
                      selectedEvalId === ev.id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedEvalId(ev.id)}
                      className="flex-1 text-left truncate pr-2"
                    >
                      <p className="truncate">{ev.name}</p>
                      <p className={`text-[9px] font-medium mt-0.5 ${selectedEvalId === ev.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {ev.date}
                      </p>
                    </button>
                    
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Seguro que desea eliminar la evaluación "${ev.name}"?`)) {
                          deleteGroupEvaluation(selectedGrdGroupId, ev.id);
                          if (selectedEvalId === ev.id) setSelectedEvalId('new');
                        }
                      }}
                      className={`p-1 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition ${
                        selectedEvalId === ev.id ? 'text-indigo-200 hover:bg-indigo-700 hover:text-white' : 'text-slate-400'
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Scoring Form */}
          <div className="lg:col-span-2 glass-card p-6">
            <h4 className="font-bold text-lg border-b border-slate-100 pb-3 dark:border-slate-800">
              {selectedEvalId === 'new' ? 'Registrar Nueva Actividad' : 'Modificar Notas de Actividad'}
            </h4>

            {activeGrdStudents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic text-sm">
                Seleccione un grupo para habilitar las calificaciones.
              </div>
            ) : (
              <form onSubmit={handleSaveEvaluation} className="space-y-4 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-400">Nombre de la Actividad *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Evaluación de Comprensión Oral 1"
                      value={evaluationName}
                      onChange={(e) => setEvaluationName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-xs focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-400">Fecha de Evaluación *</label>
                    <input
                      type="date"
                      required
                      value={evaluationDate}
                      onChange={(e) => setEvaluationDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-xs focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div className="border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4 bg-slate-50/40 dark:bg-slate-950/20">
                  <div className="flex justify-between items-center mb-3 text-[10px] font-black uppercase text-slate-400">
                    <span>Estudiante</span>
                    <span className="flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-indigo-500" />
                      Escala Activa: {gradingScale === 'literal' ? 'Literal (C, B, A, AD)' : 'Numérica (0-10)'}
                    </span>
                  </div>

                  {/* List of students for grade input */}
                  <div className="max-h-72 overflow-y-auto space-y-2 bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                    {activeGrdStudents.map(s => (
                      <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-b-0 gap-4">
                        <div className="flex items-center gap-2.5 truncate">
                          <img src={s.avatar} alt="" className="h-7 w-7 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{s.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono">DNI: {s.dni}</p>
                          </div>
                        </div>

                        <div className="w-24 shrink-0">
                          <input
                            type="text"
                            placeholder={gradingScale === 'literal' ? 'AD/A/B/C' : 'Nota'}
                            value={scoresRecords[s.id] !== undefined ? scoresRecords[s.id] : ''}
                            onChange={(e) => setScoresRecords({ ...scoresRecords, [s.id]: e.target.value })}
                            className="w-full text-center rounded-xl border border-slate-200 bg-white/50 px-2 py-1.5 text-xs font-bold focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Evaluation button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="btn-neuro-primary flex items-center gap-2 text-xs"
                  >
                    <Save className="h-4.5 w-4.5" />
                    {selectedEvalId === 'new' ? 'Registrar Notas' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- Tab 4: Results & Reports --- */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          {/* Aggregates Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-card glass-card-indigo p-5 flex items-center gap-4 relative overflow-hidden group">
              <div className="h-10 w-10 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center dark:text-indigo-400">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-wider">Evaluaciones Guardadas</span>
                <h3 className="text-xl font-black mt-0.5">{groupMetrics?.evalCount || 0}</h3>
              </div>
            </div>

            <div className="glass-card glass-card-emerald p-5 flex items-center gap-4 relative overflow-hidden group">
              <div className="h-10 w-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center dark:text-emerald-400">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-wider">Asistencia Media Taller</span>
                <h3 className="text-xl font-black mt-0.5">{groupMetrics?.avgAttendance || 100}%</h3>
              </div>
            </div>

            <div className="glass-card glass-card-rose p-5 flex items-center gap-4 relative overflow-hidden group">
              <div className="h-10 w-10 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-wider">Alumnos en Alerta</span>
                <h3 className="text-xl font-black mt-0.5">{groupMetrics?.dangerCount || 0}</h3>
              </div>
            </div>
          </div>

          {/* Group selector */}
          <div className="glass-card p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-bold text-lg">Reporte de Logros del Taller</h4>
              </div>

              <div>
                <select
                  value={selectedRepGroupId}
                  onChange={(e) => setSelectedRepGroupId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold dark:border-slate-800 dark:bg-slate-900"
                >
                  {customGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reports list table */}
            {groupMetrics?.studentReports && groupMetrics.studentReports.length === 0 ? (
              <div className="text-center py-6 text-slate-400 italic text-sm">
                No hay alumnos en el grupo para generar reportes.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/60 rounded-2xl">
                <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
                  <thead className="bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-900/60 dark:text-slate-350">
                    <tr>
                      <th className="px-6 py-3.5">Estudiante</th>
                      <th className="px-6 py-3.5 text-center">Asistencia del Taller</th>
                      <th className="px-6 py-3.5 text-center">Nota Promedio del Taller</th>
                      <th className="px-6 py-3.5 text-center">Estado Alerta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-855">
                    {groupMetrics?.studentReports.map(rep => (
                      <tr key={rep.student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <img src={rep.student.avatar} alt="" className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100">{rep.student.name}</p>
                              <p className="text-[10px] text-slate-400">DNI: {rep.student.dni}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-3.5 text-center font-bold">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            rep.attendanceRate < 80 
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450' 
                              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450'
                          }`}>
                            {rep.attendedCount}/{rep.totalClasses} ({rep.attendanceRate}%)
                          </span>
                        </td>

                        <td className="px-6 py-3.5 text-center font-bold text-sm">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            rep.averageGrade === 'C' || (parseFloat(rep.averageGrade) < (parseFloat(passingGrade) || 6.0))
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450'
                              : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400'
                          }`}>
                            {rep.averageGrade}
                          </span>
                        </td>

                        <td className="px-6 py-3.5 text-center font-bold">
                          {rep.inDanger ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-extrabold uppercase dark:bg-rose-950/40 dark:text-rose-250 animate-pulse">
                              <AlertTriangle className="h-3 w-3" />
                              En Riesgo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold uppercase dark:bg-emerald-950/40 dark:text-emerald-250">
                              <Check className="h-3 w-3" />
                              Adecuado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomGroupsManager;
