import React, { useState, useContext, useMemo, useEffect } from 'react';
import { DatabaseContext } from '../context/DatabaseContext';
import { Check, Clock, X, CalendarCheck, Users, GraduationCap, ShieldAlert } from 'lucide-react';

function AttendanceTracker({
  embeddedCourseId,
  embeddedGrade,
  embeddedSection,
  embeddedBimester,
  isEmbedded = false
}) {
  const { currentRole, currentUser, courses, students, teachers, attendance, saveAttendance, activePeriods } = useContext(DatabaseContext);

  // 1. Selector States
  const [activeMode, setActiveMode] = useState('student'); // student, teacher
  const [viewMode, setViewMode] = useState('diario'); // diario, consolidado
  const [localGrade, setLocalGrade] = useState('1ro Secundaria');
  const [localSection, setLocalSection] = useState('Todas');
  const [localBimester, setLocalBimester] = useState('1');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [localCourseId, setLocalCourseId] = useState('general'); // 'general' or courseId

  const selectedGrade = isEmbedded ? embeddedGrade : localGrade;
  const setSelectedGrade = isEmbedded ? () => {} : setLocalGrade;
  const selectedSection = isEmbedded ? embeddedSection : localSection;
  const setSelectedSection = isEmbedded ? () => {} : setLocalSection;
  const selectedBimester = isEmbedded ? embeddedBimester : localBimester;
  const setSelectedBimester = isEmbedded ? () => {} : setLocalBimester;
  const selectedCourseId = isEmbedded ? embeddedCourseId : localCourseId;
  const setSelectedCourseId = isEmbedded ? () => {} : setLocalCourseId;

  // Active periods filtering
  const bimesterEnabled = (num) => activePeriods?.bimesters?.[String(num)] !== false;
  const bimestersOptions = useMemo(() => {
    return [
      { value: '1', label: 'Bimestre 1' },
      { value: '2', label: 'Bimestre 2' },
      { value: '3', label: 'Bimestre 3' },
      { value: '4', label: 'Bimestre 4' }
    ].filter(opt => bimesterEnabled(opt.value));
  }, [activePeriods]);

  // Sync selectedBimester if it becomes disabled
  useEffect(() => {
    if (bimestersOptions.length > 0) {
      if (!bimestersOptions.some(opt => opt.value === selectedBimester)) {
        setSelectedBimester(bimestersOptions[0].value);
      }
    }
  }, [bimestersOptions, selectedBimester]);

  // Standard list of secondary grades
  // Standard list of secondary grades
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

  // Dynamic list of sections that the teacher teaches for their courses (or all if admin)
  const sectionOptions = useMemo(() => {
    if (currentRole !== 'teacher') {
      return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    }
    const sectionsSet = new Set();
    courses.forEach(c => {
      if (selectedCourseId && selectedCourseId !== 'general' && c.id !== selectedCourseId) return;
      (c.assignments || []).forEach(asg => {
        if (asg.teacherId === currentUser?.id) {
          if (selectedGrade === 'Todas' || asg.gradeLevel === selectedGrade) {
            (asg.sections || []).forEach(sec => sectionsSet.add(sec));
          }
        }
      });
    });
    return Array.from(sectionsSet).sort();
  }, [currentRole, currentUser, courses, selectedCourseId, selectedGrade]);

  // Sync selectedGrade with first option if it's not in the list
  useEffect(() => {
    if (gradeOptions.length > 0 && !gradeOptions.includes(selectedGrade)) {
      setSelectedGrade(gradeOptions[0]);
    }
  }, [gradeOptions, selectedGrade]);

  // Filter courses based on role and selected grade based on assignments
  const visibleCourses = useMemo(() => {
    let list = courses;
    if (currentRole === 'teacher') {
      list = list.filter(c => (c.assignments || []).some(asg => asg.teacherId === currentUser.id));
    }
    if (selectedGrade !== 'Todas') {
      if (currentRole === 'teacher') {
        list = list.filter(c => (c.assignments || []).some(asg => asg.teacherId === currentUser.id && asg.gradeLevel === selectedGrade));
      } else {
        list = list.filter(c => (c.assignments || []).some(asg => asg.gradeLevel === selectedGrade));
      }
    }
    return list;
  }, [courses, currentRole, currentUser, selectedGrade]);

  // Reset/sync course selection when grade or visibleCourses change
  useEffect(() => {
    setSelectedCourseId('general');
  }, [selectedGrade]);

  // Filter students based on selected grade level & section and assignments
  const enrolledStudents = useMemo(() => {
    // If we're tracking attendance for a specific course, we filter by its assignments
    let activeCourse = null;
    if (selectedCourseId !== 'general') {
      activeCourse = courses.find(c => c.id === selectedCourseId);
    }

    let list = students.filter(s => {
      // Basic grade check
      const gradeMatch = (s.gradeLevel || '').toLowerCase() === (selectedGrade || '').toLowerCase();
      if (!gradeMatch) return false;

      // Role and assignment checks
      if (currentRole === 'teacher') {
        // Teacher must be assigned to this student's grade and section
        const hasAssignment = courses.some(c => {
          if (selectedCourseId !== 'general' && c.id !== selectedCourseId) return false;
          return (c.assignments || []).some(asg => 
            asg.teacherId === currentUser?.id &&
            asg.gradeLevel.toLowerCase() === (s.gradeLevel || '').toLowerCase() &&
            (asg.sections || []).some(sec => sec.toLowerCase() === (s.section || '').toLowerCase())
          );
        });
        if (!hasAssignment) return false;
      } else if (activeCourse) {
        // For admin, if a specific course is selected, check its assignments
        const hasCourseAssignment = (activeCourse.assignments || []).some(asg => 
          asg.gradeLevel.toLowerCase() === (s.gradeLevel || '').toLowerCase() &&
          (asg.sections || []).some(sec => sec.toLowerCase() === (s.section || '').toLowerCase())
        );
        if (!hasCourseAssignment) return false;
      }

      // Specific section filter
      if (selectedSection !== 'Todas') {
        return (s.section || '').trim().toLowerCase() === selectedSection.toLowerCase();
      }

      return true;
    });

    // Sort by section (alphabetically) first, and then alphabetically by student name
    return [...list].sort((a, b) => {
      const secA = (a.section || '').trim().toLowerCase();
      const secB = (b.section || '').trim().toLowerCase();
      if (secA !== secB) {
        return secA.localeCompare(secB, 'es');
      }
      return (a.name || '').localeCompare(b.name || '', 'es');
    });
  }, [students, selectedGrade, selectedCourseId, selectedSection, courses]);

  // Fechas únicas para la cuadrícula del Consolidado de Asistencia
  const uniqueDates = useMemo(() => {
    const targetIds = new Set((activeMode === 'student' ? enrolledStudents : teachers).map(t => t.id));
    const filtered = attendance.filter(a => 
      a.type === activeMode &&
      targetIds.has(a.targetId) &&
      (activeMode === 'student' ? a.courseId === selectedCourseId : true) &&
      String(a.bimester || '1') === String(selectedBimester)
    );
    const dates = Array.from(new Set(filtered.map(a => a.date)));
    return dates.sort((a, b) => new Date(a) - new Date(b));
  }, [attendance, enrolledStudents, teachers, activeMode, selectedCourseId, selectedBimester]);

  // Attendance local form state (pre-filled from database if exists)
  const [localStatuses, setLocalStatuses] = useState({}); // { targetId: { status, remarks } }

  // Sync local statuses when filters or active lists change
  useEffect(() => {
    const freshStatuses = {};
    
    if (activeMode === 'student') {
      enrolledStudents.forEach(std => {
        const match = attendance.find(a => 
          a.type === 'student' && 
          a.targetId === std.id && 
          a.date === selectedDate && 
          a.courseId === selectedCourseId &&
          (a.bimester || '1') === selectedBimester
        );
        freshStatuses[std.id] = {
          status: match ? match.status : 'present', // default to present
          remarks: match ? match.remarks : ''
        };
      });
    } else {
      teachers.forEach(tch => {
        const match = attendance.find(a => 
          a.type === 'teacher' && 
          a.targetId === tch.id && 
          a.date === selectedDate &&
          (a.bimester || '1') === selectedBimester
        );
        freshStatuses[tch.id] = {
          status: match ? match.status : 'present',
          remarks: match ? match.remarks : ''
        };
      });
    }

    setLocalStatuses(freshStatuses);
  }, [activeMode, selectedCourseId, selectedDate, selectedBimester, enrolledStudents, teachers, attendance]);

  const updateStatus = (targetId, status) => {
    setLocalStatuses(prev => {
      const current = prev[targetId]?.status;
      const nextStatus = current === status ? null : status;
      return {
        ...prev,
        [targetId]: { ...prev[targetId], status: nextStatus }
      };
    });
  };

  const updateRemarks = (targetId, remarks) => {
    setLocalStatuses(prev => ({
      ...prev,
      [targetId]: { ...prev[targetId], remarks }
    }));
  };

  const handleSave = () => {
    const records = Object.entries(localStatuses).map(([targetId, info]) => ({
      targetId,
      date: selectedDate,
      type: activeMode,
      courseId: activeMode === 'student' ? selectedCourseId : null,
      bimester: selectedBimester,
      status: info.status,
      remarks: info.remarks
    }));

    saveAttendance(records);
    alert('Asistencia registrada con éxito.');
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Control de Asistencia</h2>
          <p className="text-slate-400  mt-1">Monitoreo diario de asistencia y retrasos para alumnos y docentes por grado y bimestre.</p>
        </div>

        {/* Mode Selector */}
        <div className="bg-white/10  p-1 rounded-lg text-xs font-semibold flex">
          <button 
            onClick={() => setActiveMode('student')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${activeMode === 'student' ? 'bg-transparent  text-kinetic-cyan shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Users className="h-4 w-4" />
            Alumnos
          </button>
          <button 
            onClick={() => setActiveMode('teacher')}
            className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${activeMode === 'teacher' ? 'bg-transparent  text-kinetic-cyan shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <GraduationCap className="h-4 w-4" />
            Docentes
          </button>
        </div>
      </div>

      {/* Filter Options */}
      {!isEmbedded ? (
        <div className="glass-card-ecc border border-white/10 p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Fecha de Registro</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Bimestre</label>
            <select 
              value={selectedBimester} 
              onChange={(e) => setSelectedBimester(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm font-semibold"
            >
              {bimestersOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {activeMode === 'student' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Grado de Estudios</label>
                <select 
                  value={selectedGrade} 
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm font-semibold"
                >
                  {gradeOptions.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Sección</label>
                <select 
                  value={selectedSection} 
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm font-semibold"
                >
                  <option value="Todas">Todas las Secciones</option>
                  {sectionOptions.map(s => (
                    <option key={s} value={s}>Sección {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Curso / Clase</label>
                <select 
                  value={selectedCourseId} 
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm font-semibold"
                >
                  <option value="general">Asistencia General (Día Completo)</option>
                  {visibleCourses.map(c => {
                    const asgs = c.assignments || [];
                    const relevantAsgs = currentRole === 'teacher' 
                      ? asgs.filter(a => a.teacherId === currentUser.id)
                      : asgs;
                    const gradesText = Array.from(new Set(relevantAsgs.map(a => a.gradeLevel))).join(', ');
                    return (
                      <option key={c.id} value={c.id}>{c.name} ({gradesText})</option>
                    );
                  })}
                </select>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="glass-card-ecc border border-white/10 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Fecha de Registro</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm font-semibold"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xs font-bold uppercase text-slate-400">Contexto Activo</span>
            <span className="text-sm font-extrabold text-kinetic-cyan dark:text-cyan-300 mt-1 uppercase tracking-wider">
              {selectedGrade} - SECCIÓN {selectedSection} • Bimestre {selectedBimester}
            </span>
          </div>
        </div>
      )}

      {/* Tabs de Navegación de Vistas */}
      <div className="flex border-b border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50/80 gap-1 mt-4">
        <button
          onClick={() => setViewMode('diario')}
          className={`px-5 py-3 text-xs font-bold border-b-2 uppercase tracking-wider transition-all ${
            viewMode === 'diario'
              ? 'border-kinetic-cyan text-kinetic-cyan dark:text-cyan-300 font-extrabold'
              : 'border-transparent text-slate-400  hover:text-slate-650'
          }`}
        >
          Registro Diario
        </button>
        <button
          onClick={() => setViewMode('consolidado')}
          className={`px-5 py-3 text-xs font-bold border-b-2 uppercase tracking-wider transition-all ${
            viewMode === 'consolidado'
              ? 'border-kinetic-cyan text-kinetic-cyan dark:text-cyan-300 font-extrabold'
              : 'border-transparent text-slate-400  hover:text-slate-650'
          }`}
        >
          Consolidado de Asistencia (Excel)
        </button>
      </div>

      {viewMode === 'consolidado' ? (
        <div className="glass-card-ecc border border-white/10 p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h4 className="text-lg font-bold flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-kinetic-cyan" />
              Consolidado de Asistencia ({activeMode === 'student' ? 'Estudiantes' : 'Docentes'})
            </h4>
            <div className="text-xs text-slate-400 font-medium">
              Mostrando {uniqueDates.length} fechas registradas
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border-none overflow-hidden">
            <table className="w-full border-collapse text-left text-sm text-slate-400">
              <thead className="bg-white/10 text-xs font-bold uppercase text-slate-200">
                <tr>
                  <th className="p-2 w-16 text-center">
                    <div className="glass-panel rounded-full px-2 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)] border-none">
                      N°
                    </div>
                  </th>
                  <th className="p-2 min-w-[200px]">
                    <div className="glass-panel rounded-full px-3 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)] border-none">
                      Integrante
                    </div>
                  </th>
                  <th className="p-2 w-32 text-center">
                    <div className="glass-panel rounded-full px-2 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)] border-none">
                      Identificador
                    </div>
                  </th>
                  {uniqueDates.map(date => {
                    const parts = date.split('-');
                    const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
                    return (
                      <th key={date} className="p-2 text-center min-w-[70px] max-w-[90px]" title={date}>
                        <div className="glass-panel rounded-full px-2 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)] border-none  text-[10px] font-bold text-center">
                          {displayDate}
                        </div>
                      </th>
                    );
                  })}
                  {uniqueDates.length === 0 && (
                    <th className="p-2 text-center italic text-slate-400 normal-case">
                      <div className="glass-panel rounded-full px-3 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)] border-none">
                        Sin fechas registradas
                      </div>
                    </th>
                  )}
                  <th className="p-2 text-center w-28">
                    <div className="glass-panel rounded-full px-2 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)] border-none  text-center">
                      % Asist
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {(activeMode === 'student' ? enrolledStudents : teachers).length === 0 ? (
                  <tr>
                    <td colSpan={4 + uniqueDates.length} className="px-6 py-8 text-center text-slate-400 font-semibold italic">
                      No hay integrantes registrados en esta selección.
                    </td>
                  </tr>
                ) : (
                  (activeMode === 'student' ? enrolledStudents : teachers).map((target, idx) => {
                    const studentRecords = attendance.filter(a => 
                      a.type === activeMode &&
                      a.targetId === target.id &&
                      (activeMode === 'student' ? a.courseId === selectedCourseId : true) &&
                      String(a.bimester || '1') === String(selectedBimester)
                    );
                    const total = studentRecords.length;
                    const present = studentRecords.filter(a => a.status === 'present' || a.status === 'late' || a.status === 'excused').length;
                    const rate = total > 0 ? Math.round((present / total) * 100) : 100;

                    return (
                      <tr key={target.id} className="hover:bg-white/5/50  transition">
                        <td className="px-3 py-3 border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)]  font-bold text-slate-400 border-none text-center">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-3 border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)]  font-semibold text-white  border-none">
                          <div className="flex items-center gap-3">
                            <img src={target.avatar} alt={target.name} className="h-8 w-8 rounded-full object-cover border border-white/10" />
                            <div>
                              <p className="font-bold text-xs text-white">{target.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)]  font-mono font-bold text-xs text-slate-400 border-none text-center">
                          {target.dni || target.id}
                        </td>
                        {uniqueDates.map(date => {
                          const record = attendance.find(a => 
                            a.type === activeMode &&
                            a.targetId === target.id &&
                            a.date === date &&
                            (activeMode === 'student' ? a.courseId === selectedCourseId : true)
                          );
                          
                          let statusLabel = '-';
                          let pillStyle = 'text-slate-350  font-bold';
                          
                          if (record) {
                            if (record.status === 'present') {
                              statusLabel = 'P';
                              pillStyle = 'bg-emerald-500/100 text-white font-extrabold h-6 w-6 rounded-lg flex items-center justify-center mx-auto  text-[10px]';
                            } else if (record.status === 'late') {
                              statusLabel = 'T';
                              pillStyle = 'bg-amber-500/100 text-white font-extrabold h-6 w-6 rounded-lg flex items-center justify-center mx-auto  text-[10px]';
                            } else if (record.status === 'excused') {
                              statusLabel = 'J';
                              pillStyle = 'bg-blue-500/100 text-white font-extrabold h-6 w-6 rounded-lg flex items-center justify-center mx-auto  text-[10px]';
                            } else if (record.status === 'absent') {
                              statusLabel = 'F';
                              pillStyle = 'bg-rose-500/100 text-white font-extrabold h-6 w-6 rounded-lg flex items-center justify-center mx-auto  text-[10px]';
                            }
                          }

                          return (
                            <td key={date} className="px-3 py-3 text-center border-none">
                              <span className={pillStyle} title={record ? `${record.status === 'present' ? 'Presente' : record.status === 'late' ? 'Tarde' : record.status === 'excused' ? 'Justificado' : 'Falta'} ${record.remarks ? `- Obs: ${record.remarks}` : ''}` : 'Sin registro'}>
                                {statusLabel}
                              </span>
                            </td>
                          );
                        })}
                        {uniqueDates.length === 0 && (
                          <td className="px-3 py-3 border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)]  text-center border-none italic text-slate-405 text-xs">Sin registros</td>
                        )}
                        <td className="px-3 py-3 border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)]  text-center border-none">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                            rate < 80 
                              ? 'bg-rose-500/10 dark:bg-rose-950/35 text-rose-600 dark:text-rose-450' 
                              : 'bg-emerald-500/10 dark:bg-emerald-950/35 text-emerald-600 dark:text-emerald-450'
                          }`}>
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card-ecc border border-white/10 p-6 space-y-6">
        
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <h4 className="text-lg font-bold flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-kinetic-cyan" />
            Lista de Firmas ({activeMode === 'student' ? `Estudiantes de ${selectedGrade}` : 'Docentes'})
          </h4>

          <button 
            onClick={handleSave}
            className="btn-neuro-primary text-xs py-2 px-4"
          >
            Guardar Asistencia
          </button>
        </div>
            <div className="overflow-x-auto rounded-2xl border-none overflow-hidden">
          <table className="w-full border-collapse text-left text-sm text-slate-400">
            <thead className="bg-white/10 text-xs font-bold uppercase text-slate-200">
              <tr>
                <th className="p-2 w-16 text-center">
                  <div className="glass-panel rounded-full px-2 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)] border-none">
                    N°
                  </div>
                </th>
                <th className="p-2 min-w-[200px]">
                  <div className="glass-panel rounded-full px-3 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)] border-none">
                    Integrante
                  </div>
                </th>
                <th className="p-2 w-32 text-center">
                  <div className="glass-panel rounded-full px-2 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)] border-none">
                    Identificador
                  </div>
                </th>
                {activeMode === 'student' && (
                  <th className="p-2 w-36 text-center">
                    <div className="glass-panel rounded-full px-2 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)] border-none">
                      Grado / Secc
                    </div>
                  </th>
                )}
                <th className="p-2 text-center w-80">
                  <div className="glass-panel rounded-full px-3 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)] border-none">
                    Estado de Asistencia
                  </div>
                </th>
                <th className="p-2">
                  <div className="glass-panel rounded-full px-3 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)] border-none">
                    Observaciones / Justificaciones
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {activeMode === 'student' && enrolledStudents.length === 0 ? (
                <tr>
                  <td colSpan={activeMode === 'student' ?"6" :"5"} className="px-6 py-8 text-center text-slate-400 font-semibold italic border-none">
                    No hay estudiantes matriculados que coincidan con la selección de grado/sección.
                  </td>
                </tr>
              ) : activeMode === 'teacher' && teachers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-400 font-semibold italic border-none">
                    No hay docentes registrados.
                  </td>
                </tr>
              ) : (
                (activeMode === 'student' ? enrolledStudents : teachers).map((target, idx) => {
                  const targetInfo = localStatuses[target.id] || { status: 'present', remarks: '' };
                  
                  return (
                    <tr key={target.id} className="hover:bg-white/5/50  transition">
                      <td className="px-3 py-3 border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)]  font-bold text-slate-400 border-none text-center">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-3 border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)]  font-semibold text-white  border-none">
                        <div className="flex items-center gap-3">
                          <img src={target.avatar} alt={target.name} className="h-10 w-10 rounded-full object-cover border border-white/10" />
                          <div>
                            <p className="font-bold text-white">{target.name}</p>
                            <p className="text-xs text-slate-400 font-medium">{target.email}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-3 py-3 border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)]  font-mono font-bold text-xs text-slate-400 border-none text-center">
                        {target.dni || target.id}
                      </td>
 
                      {activeMode === 'student' && (
                        <td className="px-3 py-3 border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)]  text-xs font-bold text-slate-400 border-none text-center">
                          {target.gradeLevel} - Secc. {target.section || '-'}
                        </td>
                      )}
  
                      <td className="px-3 py-3 border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)]  border-none">
                        <div className="flex justify-center items-center bg-white/10  p-1 rounded-lg gap-1 max-w-[340px] mx-auto border border-white/10/50">
                          <button
                            type="button"
                            onClick={() => updateStatus(target.id, 'present')}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                              targetInfo.status === 'present'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow shadow-emerald-500/20 scale-102'
                                : 'text-slate-400 hover:text-slate-200 '
                            }`}
                            title="Presente"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Pre
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => updateStatus(target.id, 'late')}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                              targetInfo.status === 'late'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow shadow-amber-500/20 scale-102'
                                : 'text-slate-400 hover:text-slate-200 '
                            }`}
                            title="Tardanza"
                          >
                            <Clock className="h-3.5 w-3.5" />
                            Tar
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => updateStatus(target.id, 'excused')}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                              targetInfo.status === 'excused'
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow shadow-purple-500/20 scale-102'
                                : 'text-slate-400 hover:text-slate-200 '
                            }`}
                            title="Permiso"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Per
                          </button>
  
                          <button
                            type="button"
                            onClick={() => updateStatus(target.id, 'absent')}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                              targetInfo.status === 'absent'
                                ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow shadow-rose-500/20 scale-102'
                                : 'text-slate-400 hover:text-slate-200 '
                            }`}
                            title="Falta"
                          >
                            <X className="h-3.5 w-3.5" />
                            Fal
                          </button>
                        </div>
                      </td>
  
                      <td className="px-3 py-3 border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)]  border-none">
                        <input
                          type="text"
                          placeholder="Nota..."
                          value={targetInfo.remarks}
                          onChange={(e) => updateRemarks(target.id, e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5 text-xs focus:border-kinetic-cyan"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

    </div>
  );
}

export default AttendanceTracker;
