import React, { useState, useContext, useMemo, useEffect } from 'react';
import { DatabaseContext } from '../context/DatabaseContext';
import AttendanceTracker from './AttendanceTracker';
import GradingPortal from './GradingPortal';
import ConductLogger from './ConductLogger';
import ReinforcementGrading from './ReinforcementGrading';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  ClipboardList, 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  Search, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle,
  GraduationCap,
  ArrowRight,
  UserCheck,
  ChevronRight,
  TrendingDown,
  ArrowLeft,
  Mail,
  Phone,
  FileText,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getAvatarBg = (name) => {
  const colors = ['from-indigo-500 to-purple-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

function ClassroomManager() {
  const { 
    currentRole, 
    currentUser, 
    courses: contextCourses, 
    students: contextStudents, 
    grades: contextGrades, 
    attendance: contextAttendance, 
    evaluations: contextEvaluations,
    gradingScale,
    passingGrade,
    conduct: contextConduct,
    reinforcementGrades: contextReinforcementGrades,
    activePeriods
  } = useContext(DatabaseContext);

  const courses = contextCourses || [];
  const students = contextStudents || [];
  const grades = contextGrades || [];
  const attendance = contextAttendance || [];
  const evaluations = contextEvaluations || [];
  const conduct = contextConduct || [];
  const reinforcementGrades = contextReinforcementGrades || [];

  // 1. Unified Selection State
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBimester, setSelectedBimester] = useState('1');
  const [selectedUnit, setSelectedUnit] = useState('0');

  // Sub-tabs navigation: 'selector', 'attendance', 'grading', 'conduct', 'reports'
  const [activeSubTab, setActiveSubTab] = useState('selector');

  const [selectedStudentForReport, setSelectedStudentForReport] = useState(null);
  const [reportSearchQuery, setReportSearchQuery] = useState('');

  // Sync selectedStudentForReport when selections change
  useEffect(() => {
    setSelectedStudentForReport(null);
  }, [selectedCourseId, selectedGrade, selectedSection]);

  // Dynamic list of secondary grades
  const availableGrades = useMemo(() => {
    if (currentRole !== 'teacher') {
      return ['1ro Secundaria', '2do Secundaria', '3ro Secundaria', '4to Secundaria', '5to Secundaria'];
    }
    const gradesSet = new Set();
    courses.forEach(c => {
      (c.assignments || []).forEach(asg => {
        if (asg.teacherId === currentUser?.id) {
          gradesSet.add(asg.gradeLevel);
        }
      });
    });
    return Array.from(gradesSet).sort();
  }, [courses, currentRole, currentUser]);

  // Dynamic list of all classes/courses assigned to teacher (or all for admin)
  const myClasses = useMemo(() => {
    const list = [];
    courses.forEach(c => {
      const assignments = c.assignments || [];
      const relevantAssignments = currentRole === 'teacher'
        ? assignments.filter(asg => asg.teacherId === currentUser?.id)
        : assignments;
      
      relevantAssignments.forEach(asg => {
        (asg.sections || []).forEach(sec => {
          list.push({
            courseId: c.id,
            courseName: c.name,
            gradeLevel: asg.gradeLevel,
            section: sec,
            key: `${c.id}_${asg.gradeLevel}_${sec}`
          });
        });
      });
    });
    // Sort by Grade Level, then Section, then Course Name
    return list.sort((a, b) => {
      if (a.gradeLevel !== b.gradeLevel) return a.gradeLevel.localeCompare(b.gradeLevel);
      if (a.section !== b.section) return a.section.localeCompare(b.section);
      return a.courseName.localeCompare(b.courseName);
    });
  }, [courses, currentUser, currentRole]);

  // Set default selections based on myClasses
  useEffect(() => {
    if (myClasses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(myClasses[0].courseId);
      setSelectedGrade(myClasses[0].gradeLevel);
      setSelectedSection(myClasses[0].section);
    }
  }, [myClasses, selectedCourseId]);

  // Handle active class change
  const handleSelectClass = (cls) => {
    setSelectedCourseId(cls.courseId);
    setSelectedGrade(cls.gradeLevel);
    setSelectedSection(cls.section);
    setActiveSubTab('attendance'); // Go to attendance by default when selecting a class
  };

  // Find active course name
  const activeCourseName = useMemo(() => {
    const c = courses.find(course => course.id === selectedCourseId);
    return c ? c.name : 'Curso General';
  }, [courses, selectedCourseId]);

  // Students enrolled in selected grade & section
  const enrolledStudents = useMemo(() => {
    if (!selectedGrade || !selectedSection) return [];
    return students.filter(s => 
      (s.gradeLevel || '').toLowerCase() === selectedGrade.toLowerCase() && 
      (selectedSection === 'Todas' || (s.section || '').toLowerCase() === selectedSection.toLowerCase())
    ).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
  }, [students, selectedGrade, selectedSection]);

  const bimesterEnabled = (num) => activePeriods?.bimesters?.[String(num)] !== false;
  const unitEnabled = (num) => activePeriods?.units?.[String(num)] !== false;

  const bimestersOptions = useMemo(() => {
    return [
      { value: '1', label: 'Bim. 1' },
      { value: '2', label: 'Bim. 2' },
      { value: '3', label: 'Bim. 3' },
      { value: '4', label: 'Bim. 4' }
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

  // Unit Options based on Bimester
  const unitOptions = useMemo(() => {
    let options = [];
    if (selectedBimester === '1') options = [{ value: '0', label: 'Unidad 0' }, { value: '1', label: 'Unidad 1' }];
    else if (selectedBimester === '2') options = [{ value: '2', label: 'Unidad 2' }, { value: '3', label: 'Unidad 3' }];
    else if (selectedBimester === '3') options = [{ value: '4', label: 'Unidad 4' }, { value: '5', label: 'Unidad 5' }];
    else if (selectedBimester === '4') options = [{ value: '6', label: 'Unidad 6' }, { value: '7', label: 'Unidad 7' }];
    return options.filter(opt => unitEnabled(opt.value));
  }, [selectedBimester, activePeriods]);

  // Sync selectedUnit if it becomes disabled
  useEffect(() => {
    if (unitOptions.length > 0) {
      if (!unitOptions.some(opt => opt.value === selectedUnit)) {
        setSelectedUnit(unitOptions[0].value);
      }
    }
  }, [unitOptions, selectedUnit]);

  // Helper converters for CNEB Literal Scales
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

  // ----------------------------------------------------
  // REPORT CALCULATIONS (For selected class context)
  // ----------------------------------------------------
  const classReport = useMemo(() => {
    if (enrolledStudents.length === 0 || !selectedCourseId) return null;

    // Filter evaluations in current course, bimester and unit
    const courseEvals = evaluations.filter(ev => 
      ev.courseId === selectedCourseId &&
      (ev.bimester || '1') === selectedBimester &&
      (ev.unit !== undefined && ev.unit !== null ? String(ev.unit) : '0') === selectedUnit
    );

    const studentReports = enrolledStudents.map(std => {
      // 1. Attendance Rate for current course & bimester
      const stdAtts = attendance.filter(a => 
        a.type === 'student' &&
        a.targetId === std.id &&
        a.courseId === selectedCourseId &&
        (a.bimester || '1') === selectedBimester
      );
      const totalAttClasses = stdAtts.length;
      const attended = stdAtts.filter(a => a.status === 'present' || a.status === 'late' || a.status === 'excused').length;
      const attendanceRate = totalAttClasses > 0 ? Math.round((attended / totalAttClasses) * 100) : 100;

      // 2. Average Grade for evaluations in this period
      const stdScores = [];
      courseEvals.forEach(ev => {
        const scoreRecord = grades.find(g => g.studentId === std.id && g.evaluationId === ev.id);
        if (scoreRecord && scoreRecord.score !== undefined && scoreRecord.score !== '') {
          stdScores.push(scoreRecord.score);
        }
      });

      let averageGrade = '-';
      let inDanger = false;
      let reason = [];

      if (stdScores.length > 0) {
        if (gradingScale === 'literal') {
          const totalVal = stdScores.reduce((sum, s) => sum + letterToValue(s), 0);
          averageGrade = valueToLetter(totalVal / stdScores.length);
          if (averageGrade === 'C') {
            inDanger = true;
            reason.push('Bajo Rendimiento Académico (C)');
          }
        } else {
          const avgNum = stdScores.reduce((sum, s) => sum + (parseFloat(s) || 0), 0) / stdScores.length;
          averageGrade = avgNum.toFixed(1);
          const passGrade = parseFloat(passingGrade) || 6.0;
          if (avgNum < passGrade) {
            inDanger = true;
            reason.push(`Nota Desaprobatoria (${averageGrade})`);
          }
        }
      }

      if (attendanceRate < 80) {
        inDanger = true;
        reason.push(`Inasistencia Crítica (${attendanceRate}%)`);
      }

      return {
        student: std,
        attendanceRate,
        attendedCount: attended,
        totalClasses: totalAttClasses,
        averageGrade,
        inDanger,
        reason: reason.join(', ')
      };
    });

    // Aggregates
    const dangerCount = studentReports.filter(s => s.inDanger).length;
    
    // Average attendance
    const avgAttendance = Math.round(studentReports.reduce((sum, s) => sum + s.attendanceRate, 0) / studentReports.length);

    // General class grade average
    let classGradeAvg = '-';
    const validScores = studentReports.map(s => s.averageGrade).filter(avg => avg !== '-');
    if (validScores.length > 0) {
      if (gradingScale === 'literal') {
        const sumVal = validScores.reduce((sum, s) => sum + letterToValue(s), 0);
        classGradeAvg = valueToLetter(sumVal / validScores.length);
      } else {
        const sumVal = validScores.reduce((sum, s) => sum + parseFloat(s), 0);
        classGradeAvg = (sumVal / validScores.length).toFixed(1);
      }
    }

    return {
      studentReports,
      dangerCount,
      avgAttendance,
      classGradeAvg,
      evalCount: courseEvals.length
    };
  }, [enrolledStudents, selectedCourseId, selectedBimester, selectedUnit, evaluations, grades, attendance, gradingScale, passingGrade]);

  // ========================================================
  // 360° DIAGNOSTIC CALCULATIONS FOR SELECTED STUDENT
  // ========================================================
  const student = selectedStudentForReport;
  
  const studentEvaluations = useMemo(() => {
    if (!student || !selectedCourseId) return [];
    return evaluations.filter(ev => 
      ev.courseId === selectedCourseId &&
      (ev.bimester || '1') === selectedBimester &&
      (ev.unit !== undefined && ev.unit !== null ? String(ev.unit) : '0') === selectedUnit
    );
  }, [student, evaluations, selectedCourseId, selectedBimester, selectedUnit]);

  const studentGradesList = useMemo(() => {
    if (!student) return [];
    return studentEvaluations.map(ev => {
      const scoreRecord = grades.find(g => g.studentId === student.id && g.evaluationId === ev.id);
      const score = scoreRecord ? scoreRecord.score : '';
      
      const reinfRecord = (reinforcementGrades || []).find(g => 
        g.studentId === student.id && 
        g.evaluationId === ev.id && 
        g.courseId === selectedCourseId &&
        (g.bimester || '1') === selectedBimester
      );
      const reinfScore = reinfRecord ? reinfRecord.score : '';
      const reinfDate = reinfRecord ? reinfRecord.date : '';
      const reinfTopic = reinfRecord ? reinfRecord.topic : '';
      const reinfNotes = reinfRecord ? reinfRecord.notes : '';

      return {
        evaluation: ev,
        score,
        reinfScore,
        reinfDate,
        reinfTopic,
        reinfNotes,
        hasReinf: !!reinfScore,
        feedback: scoreRecord ? scoreRecord.feedback || '' : ''
      };
    });
  }, [student, studentEvaluations, grades, reinforcementGrades, selectedCourseId, selectedBimester]);

  const groupedGradesByCompetence = useMemo(() => {
    if (!student) return [];
    const c = courses.find(course => course.id === selectedCourseId);
    const comps = c ? c.competencies || [] : [];
    
    // Group grades
    const groups = comps.map(comp => {
      const gradesForComp = studentGradesList.filter(g => g.evaluation.competenceId === comp.id);
      return {
        competence: comp,
        grades: gradesForComp
      };
    }).filter(group => group.grades.length > 0);
    
    // Group evaluations with no competenceId or unmatched competenceId
    const otherGrades = studentGradesList.filter(g => 
      !g.evaluation.competenceId || !comps.some(c => c.id === g.evaluation.competenceId)
    );
    
    if (otherGrades.length > 0) {
      groups.push({
        competence: { id: 'other', name: 'Evaluaciones Generales' },
        grades: otherGrades
      });
    }
    
    return groups;
  }, [student, courses, selectedCourseId, studentGradesList]);

  const studentAttendanceList = useMemo(() => {
    if (!student || !selectedCourseId) return [];
    return attendance.filter(a => 
      a.type === 'student' &&
      a.targetId === student.id &&
      a.courseId === selectedCourseId &&
      (a.bimester || '1') === selectedBimester
    ).sort((a, b) => b.date.localeCompare(a.date));
  }, [student, selectedCourseId, selectedBimester, attendance]);

  const studentAttendanceStats = useMemo(() => {
    const total = studentAttendanceList.length;
    const present = studentAttendanceList.filter(a => a.status === 'present').length;
    const late = studentAttendanceList.filter(a => a.status === 'late').length;
    const excused = studentAttendanceList.filter(a => a.status === 'excused').length;
    const absent = studentAttendanceList.filter(a => a.status === 'absent').length;
    const attended = present + late + excused;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 100;
    return { total, present, late, excused, absent, rate };
  }, [studentAttendanceList]);

  const studentConductList = useMemo(() => {
    if (!student) return [];
    return (conduct || []).filter(rec => rec.studentId === student.id)
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [student, conduct]);

  const studentConductStats = useMemo(() => {
    const total = studentConductList.length;
    const merits = studentConductList.filter(r => r.type === 'merit').length;
    const incidents = total - merits;
    const index = total > 0 ? Math.round((merits / total) * 100) : 100;
    const netPoints = studentConductList.reduce((sum, r) => sum + r.points, 100);
    return { total, merits, incidents, index, netPoints };
  }, [studentConductList]);

  const studentAverages = useMemo(() => {
    const validOfficialScores = [];
    const validFinalScores = [];

    studentGradesList.forEach(g => {
      const offScore = g.score;
      const reinfScore = g.reinfScore;
      
      if (offScore !== undefined && offScore !== '') {
        validOfficialScores.push(offScore);
        if (reinfScore !== undefined && reinfScore !== '') {
          if (gradingScale === 'literal') {
            const offVal = letterToValue(offScore);
            const reinfVal = letterToValue(reinfScore);
            validFinalScores.push(reinfVal > offVal ? reinfScore : offScore);
          } else {
            const offVal = parseFloat(offScore) || 0;
            const reinfVal = parseFloat(reinfScore) || 0;
            validFinalScores.push(reinfVal > offVal ? reinfScore : offScore);
          }
        } else {
          validFinalScores.push(offScore);
        }
      }
    });

    const calculateAvg = (scoreArray) => {
      if (scoreArray.length === 0) return '-';
      if (gradingScale === 'literal') {
        const sumVal = scoreArray.reduce((sum, s) => sum + letterToValue(s), 0);
        return valueToLetter(sumVal / scoreArray.length);
      } else {
        const sumVal = scoreArray.reduce((sum, s) => sum + parseFloat(s), 0);
        return (sumVal / scoreArray.length).toFixed(1);
      }
    };

    return {
      official: calculateAvg(validOfficialScores),
      final: calculateAvg(validFinalScores),
      count: validOfficialScores.length
    };
  }, [studentGradesList, gradingScale]);

  const studentDiagnostic = useMemo(() => {
    if (!student) return null;
    
    const isFailing = (avg) => {
      if (avg === '-') return false;
      if (gradingScale === 'literal') {
        return avg === 'C';
      } else {
        return parseFloat(avg) < (parseFloat(passingGrade) || 6.0);
      }
    };

    if (studentAttendanceStats.rate < 80) {
      return {
        label: 'Alerta de Inasistencia Crítica',
        desc: 'El estudiante registra una tasa de asistencia por debajo del límite mínimo del 80%.',
        color: 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30'
      };
    }
    
    if (isFailing(studentAverages.final)) {
      return {
        label: 'Alerta de Rendimiento Académico',
        desc: 'El promedio final del estudiante se encuentra por debajo de la nota aprobatoria.',
        color: 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30'
      };
    }

    if (studentConductStats.index < 75) {
      return {
        label: 'Alerta de Convivencia (GAMA)',
        desc: 'El estudiante registra un índice bajo de cumplimiento en acuerdos de convivencia.',
        color: 'bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/30'
      };
    }

    const isExcellent = (avg) => {
      if (avg === '-') return false;
      if (gradingScale === 'literal') {
        return avg === 'AD';
      } else {
        return parseFloat(avg) >= 18.0;
      }
    };

    if (isExcellent(studentAverages.final)) {
      return {
        label: 'Desempeño Sobresaliente',
        desc: 'El estudiante demuestra un nivel de logro destacado y excelente conducta.',
        color: 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30'
      };
    }

    return {
      label: 'Situación Regular / Estable',
      desc: 'El estudiante presenta asistencia, conducta y notas estables dentro de la asignatura.',
      color: 'bg-white/5 border-kinetic-cyan/30 text-kinetic-cyan dark:bg-indigo-950/20 dark:border-indigo-900/30'
    };
  }, [student, studentAttendanceStats, studentAverages, studentConductStats, gradingScale, passingGrade]);

  return (
    <div className="space-y-6 text-white min-h-screen bg-[#060a14] p-4 sm:p-8">
      <style>{`
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
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
      
      {/* 1. Header with selector status */}
      <div className="flex flex-col lg:flex-row items-stretch justify-between gap-4">
        <div className="flex items-stretch gap-4 w-full lg:w-auto shrink-0 h-full">
          
          <div className="glass-card-ecc tint-cyan p-6 rounded-3xl w-full sm:w-64 border-l-4 border-l-kinetic-cyan relative overflow-hidden flex flex-col justify-center">
            <div className="absolute -right-4 -top-4 h-24 w-24 bg-kinetic-cyan/20 rounded-full blur-2xl"></div>
            <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-kinetic-cyan glow-cyan" />
              Gestión de Aula
            </h2>
            {activeSubTab !== 'selector' && selectedGrade ? (
              <p className="text-xs font-bold text-slate-400  flex items-center gap-1.5 flex-wrap">
                CLASE: 
                <span className="bg-white/5 bg-white/5 text-kinetic-cyan dark:text-cyan-300 px-2.5 py-0.5 rounded-full text-xs font-black">
                  {activeCourseName} ({selectedGrade} - Secc. {selectedSection})
                </span>
              </p>
            ) : (
              <p className="text-slate-400  text-xs font-semibold">Panel centralizado para el control del aula de clases.</p>
            )}
          </div>
        </div>

        {/* Right side: Flex column stacking context items */}
        <div className="flex flex-col gap-3 w-full flex-1 justify-start">
          {/* Global period control if a class is active */}
          {activeSubTab !== 'selector' && (
            <div className="flex flex-wrap items-center justify-start xl:justify-end gap-3.5 bg-white/10  p-2 rounded-2xl border border-white/10">
              {/* Quick class switcher */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400  px-1">Clase:</span>
                <select
                  value={`${selectedCourseId}_${selectedGrade}_${selectedSection}`}
                  onChange={(e) => {
                    const val = e.target.value;
                    const match = myClasses.find(c => `${c.courseId}_${c.gradeLevel}_${c.section}` === val);
                    if (match) {
                      setSelectedCourseId(match.courseId);
                      setSelectedGrade(match.gradeLevel);
                      setSelectedSection(match.section);
                    }
                  }}
                  className="bg-transparent border border-kinetic-cyan shadow-[0_0_8px_rgba(0,240,255,0.4)] px-3 py-1.5 rounded-xl text-xs font-extrabold text-slate-200  outline-none cursor-pointer"
                >
                  {myClasses.map(c => (
                    <option key={c.key} value={`${c.courseId}_${c.gradeLevel}_${c.section}`}>
                      {c.courseName} - {c.gradeLevel} {c.section}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bimester switcher */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400  px-1">Periodo:</span>
                <select 
                  value={selectedBimester} 
                  onChange={(e) => setSelectedBimester(e.target.value)}
                  className="bg-transparent border border-kinetic-cyan shadow-[0_0_8px_rgba(0,240,255,0.4)] px-3 py-1.5 rounded-xl text-xs font-extrabold text-slate-200  outline-none"
                >
                  {bimestersOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Unit switcher */}
              {activeSubTab === 'grading' && (
                <div className="flex items-center gap-1.5">
                  <select 
                    value={selectedUnit} 
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="bg-transparent border border-kinetic-cyan shadow-[0_0_8px_rgba(0,240,255,0.4)] px-3 py-1.5 rounded-xl text-xs font-extrabold text-slate-200  outline-none"
                  >
                    {unitOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => setActiveSubTab('selector')}
                className="text-xs font-bold text-white bg-gradient-to-r from-orange-400 via-rose-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-650 px-4 py-1.5 rounded-xl transition active:scale-95 shadow-[0_4px_12px_rgba(244,63,94,0.15)]"
              >
                Volver
              </button>
            </div>
          )}
          
          {/* Slot for contextual header injected by active sub-tab */}
          <div id="classroom-context-header-slot" className="empty:hidden flex flex-col gap-3 w-full"></div>
        </div>
      </div>

      {/* 2. Mockup 6-Cards Grid Layout (Only active if a course is selected) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 w-full">
        {/* Card 1: Cursos y Secciones */}
        <button
          onClick={() => setActiveSubTab('selector')}
          className={`group flex flex-col items-center justify-center p-4 aspect-square module-card module-card-blue ${
            activeSubTab === 'selector' ? 'active scale-[1.02] ring-2 ring-blue-500/15' : ''
          }`}
        >
          <BookOpen className="h-11 w-11 mb-2.5 transition-transform duration-300 group-hover:scale-105 text-inherit shrink-0" />
          <span className="text-[10px] font-black tracking-wider uppercase leading-snug text-slate-200 ">Cursos y Secciones</span>
        </button>

        {/* Card 2: Asistencia Oficial */}
        <button
          onClick={() => setActiveSubTab('attendance')}
          disabled={!selectedCourseId}
          className={`group flex flex-col items-center justify-center p-4 aspect-square module-card module-card-purple ${
            activeSubTab === 'attendance' ? 'active scale-[1.02] ring-2 ring-purple-500/15' : ''
          }`}
        >
          <Calendar className="h-11 w-11 mb-2.5 transition-transform duration-300 group-hover:scale-105 text-inherit shrink-0" />
          <span className="text-[10px] font-black tracking-wider uppercase leading-snug text-slate-200 ">Asistencia Oficial</span>
        </button>

        {/* Card 3: Calificaciones Oficiales */}
        <button
          onClick={() => setActiveSubTab('grading')}
          disabled={!selectedCourseId}
          className={`group flex flex-col items-center justify-center p-4 aspect-square module-card module-card-red ${
            activeSubTab === 'grading' ? 'active scale-[1.02] ring-2 ring-red-500/15' : ''
          }`}
        >
          <ClipboardList className="h-11 w-11 mb-2.5 transition-transform duration-300 group-hover:scale-105 text-inherit shrink-0" />
          <span className="text-[10px] font-black tracking-wider uppercase leading-snug text-slate-200 ">Calificaciones Oficiales</span>
        </button>

        {/* Card 4: Calificaciones de Refuerzo */}
        <button
          onClick={() => setActiveSubTab('reinforcement-grading')}
          disabled={!selectedCourseId}
          className={`group flex flex-col items-center justify-center p-4 aspect-square module-card module-card-cyan ${
            activeSubTab === 'reinforcement-grading' ? 'active scale-[1.02] ring-2 ring-cyan-500/15' : ''
          }`}
        >
          <Sparkles className="h-11 w-11 mb-2.5 transition-transform duration-300 group-hover:scale-105 text-inherit shrink-0" />
          <span className="text-[10px] font-black tracking-wider uppercase leading-snug text-slate-200 ">Calificaciones de Refuerzo</span>
        </button>

        {/* Card 5: GAMA (Convivencia) */}
        <button
          onClick={() => setActiveSubTab('conduct')}
          disabled={!selectedCourseId}
          className={`group flex flex-col items-center justify-center p-4 aspect-square module-card module-card-green ${
            activeSubTab === 'conduct' ? 'active scale-[1.02] ring-2 ring-emerald-500/15' : ''
          }`}
        >
          <Award className="h-11 w-11 mb-2.5 transition-transform duration-300 group-hover:scale-105 text-inherit shrink-0" />
          <span className="text-[10px] font-black tracking-wider uppercase leading-snug text-slate-200 ">GAMA (Convivencia)</span>
        </button>

        {/* Card 6: Reportes y Logros */}
        <button
          onClick={() => setActiveSubTab('reports')}
          disabled={!selectedCourseId}
          className={`group flex flex-col items-center justify-center p-4 aspect-square module-card module-card-teal ${
            activeSubTab === 'reports' ? 'active scale-[1.02] ring-2 ring-sky-500/15' : ''
          }`}
        >
          <TrendingUp className="h-11 w-11 mb-2.5 transition-transform duration-300 group-hover:scale-105 text-inherit shrink-0" />
          <span className="text-[10px] font-black tracking-wider uppercase leading-snug text-slate-200 ">Reportes y Logros</span>
        </button>
      </div>

      {/* 3. Render content depends on activeSubTab */}
      <div className="space-y-6">

        {/* TAB 1: Course Selector */}
        {activeSubTab === 'selector' && (
          <div className="space-y-6">
            
            {/* Title / Description */}
            <div className="glass-card-ecc border border-white/10 p-6 bg-white/50/5 border-kinetic-cyan/10 dark:bg-indigo-950/10 dark:border-indigo-900/20">
              <h3 className="font-extrabold text-white dark:text-white text-base">Mis Clases Asignadas</h3>
              <p className="text-xs text-slate-400  mt-1">
                A continuación se listan las asignaturas y grados oficiales a su cargo. Seleccione una clase para iniciar la gestión pedagógica rápida.
              </p>
            </div>

            {/* Admin Selectors Fallback */}
            {currentRole !== 'teacher' && (
              <div className="glass-card-ecc border border-white/10 p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Grado de Estudios</label>
                  <select 
                    value={selectedGrade} 
                    onChange={(e) => {
                      setSelectedGrade(e.target.value);
                      // Auto select first match in myClasses
                      const match = myClasses.find(c => c.gradeLevel === e.target.value);
                      if (match) {
                        setSelectedCourseId(match.courseId);
                        setSelectedSection(match.section);
                      }
                    }}
                    className="w-full rounded-xl border border-white/10 bg-white/50 px-3.5 py-2.5 text-sm font-semibold  "
                  >
                    {availableGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Sección</label>
                  <select 
                    value={selectedSection} 
                    onChange={(e) => {
                      setSelectedSection(e.target.value);
                      const match = myClasses.find(c => c.gradeLevel === selectedGrade && c.section === e.target.value);
                      if (match) {
                        setSelectedCourseId(match.courseId);
                      }
                    }}
                    className="w-full rounded-xl border border-white/10 bg-white/50 px-3.5 py-2.5 text-sm font-semibold  "
                  >
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(s => (
                      <option key={s} value={s}>Sección {s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Curso / Materia</label>
                  <select 
                    value={selectedCourseId} 
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/50 px-3.5 py-2.5 text-sm font-semibold  "
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Grid of Class Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myClasses.length === 0 ? (
                <div className="col-span-3 text-center py-12 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-[24px] text-slate-400">
                  <BookOpen className="h-10 w-10 text-kinetic-cyan mb-3 mx-auto" />
                  <p className="text-sm font-semibold">No se encontraron asignaciones curriculares.</p>
                  <p className="text-xs text-slate-400 mt-1">Póngase en contacto con el administrador escolar para configurar sus cursos.</p>
                </div>
              ) : (
                myClasses.map((cls, index) => {
                  const studentCount = students.filter(s => 
                    (s.gradeLevel || '').toLowerCase() === cls.gradeLevel.toLowerCase() && 
                    (s.section || '').toLowerCase() === cls.section.toLowerCase()
                  ).length;
                  const isActive = selectedCourseId === cls.courseId && 
                    (selectedGrade || '').toLowerCase() === cls.gradeLevel.toLowerCase() && 
                    (selectedSection || '').toLowerCase() === cls.section.toLowerCase();

                  const colors = ['cyan', 'blue', 'purple', 'red', 'green', 'teal'];
                  const colorName = colors[index % colors.length];

                  return (
                    <div 
                      key={cls.key} 
                      onClick={() => handleSelectClass(cls)}
                      className={`module-card module-card-${colorName} p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 group relative overflow-hidden min-h-[160px] ${
                        isActive 
                          ? `active scale-[1.02] ring-2 ring-${colorName}-500/30` 
                          : 'hover:-translate-y-1'
                      }`}
                    >
                      <div className="absolute -right-4 -bottom-4 h-20 w-20 bg-white/50/5 rounded-full blur-lg" />
                      
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-white/50 text-white shadow shadow-indigo-500/20' : 'bg-white/10  text-slate-450 group-hover:bg-white/5 dark:group-hover:bg-indigo-950/20 group-hover:text-kinetic-cyan transition'
                          }`}>
                            <GraduationCap className="h-5.5 w-5.5" />
                          </div>
                          <span className="text-[10px] bg-white/10  text-slate-400  px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                            {studentCount} Estudiantes
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-white dark:text-white text-base leading-snug group-hover:text-kinetic-cyan dark:group-hover:text-cyan-300 transition">
                            {cls.courseName}
                          </h4>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                            {cls.gradeLevel} - Sección {cls.section}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/10  mt-5 pt-3 text-xs text-kinetic-cyan dark:text-cyan-300 font-black">
                        <span>Gestionar Aula</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Embedded Attendance Tracker */}
        {activeSubTab === 'attendance' && selectedCourseId && (
          <div className="animate-in fade-in duration-200">
            <AttendanceTracker
              embeddedCourseId={selectedCourseId}
              embeddedGrade={selectedGrade}
              embeddedSection={selectedSection}
              embeddedBimester={selectedBimester}
              isEmbedded={true}
            />
          </div>
        )}

        {/* TAB 3: Embedded Grading Portal */}
        {activeSubTab === 'grading' && selectedCourseId && (
          <div className="animate-in fade-in duration-200">
            <GradingPortal
              embeddedCourseId={selectedCourseId}
              embeddedGrade={selectedGrade}
              embeddedSection={selectedSection}
              embeddedBimester={selectedBimester}
              embeddedUnit={selectedUnit}
              isEmbedded={true}
              onNavigateToTarget={({ courseId, grade, section, bimester, unit }) => {
                if (courseId) setSelectedCourseId(courseId);
                if (grade) setSelectedGrade(grade);
                if (section) setSelectedSection(section);
                if (bimester) setSelectedBimester(bimester);
                if (unit) setSelectedUnit(unit);
              }}
            />
          </div>
        )}

        {/* TAB: Calificaciones de Refuerzo */}
        {activeSubTab === 'reinforcement-grading' && selectedCourseId && (
          <div className="animate-in fade-in duration-200">
            <ReinforcementGrading
              embeddedCourseId={selectedCourseId}
              embeddedGrade={selectedGrade}
              embeddedSection={selectedSection}
              embeddedBimester={selectedBimester}
              isEmbedded={true}
              onNavigateToTarget={({ courseId, grade, section, bimester }) => {
                if (courseId) setSelectedCourseId(courseId);
                if (grade) setSelectedGrade(grade);
                if (section) setSelectedSection(section);
                if (bimester) setSelectedBimester(bimester);
              }}
            />
          </div>
        )}

        {/* TAB 4: Embedded Conduct Logger */}
        {activeSubTab === 'conduct' && selectedCourseId && (
          <div className="animate-in fade-in duration-200">
            <ConductLogger
              embeddedGrade={selectedGrade}
              embeddedSection={selectedSection}
              isEmbedded={true}
            />
          </div>
        )}

        {/* TAB 5: Reports & Achievements (NEW) */}
        {activeSubTab === 'reports' && selectedCourseId && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {student ? (
              // ==========================================
              // VISTA 1: DIAGNÓSTICO ESTUDIANTIL 360°
              // ==========================================
              <div className="space-y-6">
                
                {/* Cabecera del Dashboard */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/40  p-6 rounded-3xl border border-white/10/50  backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedStudentForReport(null)}
                      className="h-10 w-10 bg-white/10  hover:bg-white/5 dark:hover:bg-indigo-950/30 text-slate-300  rounded-2xl flex items-center justify-center transition border border-slate-250/20"
                    >
                      <ArrowLeft className="h-4.5 w-4.5" />
                    </button>
                    <div>
                      <h4 className="text-lg font-black tracking-tight">Diagnóstico Estudiantil 360°</h4>
                      <p className="text-xs text-slate-400  font-medium">Informe y analítica de desempeño consolidada.</p>
                    </div>
                  </div>

                  {/* Selector rápido de estudiante */}
                  <div className="flex items-center gap-2 bg-white/10  p-1.5 rounded-2xl border border-white/10 ">
                    <span className="text-[10px] font-black uppercase text-slate-400  px-2">Estudiante:</span>
                    <select
                      value={student.id}
                      onChange={(e) => {
                        const nextStudent = enrolledStudents.find(s => s.id === e.target.value);
                        if (nextStudent) setSelectedStudentForReport(nextStudent);
                      }}
                      className="bg-transparent border border-kinetic-cyan shadow-[0_0_8px_rgba(0,240,255,0.4)] px-3 py-1.5 rounded-xl text-xs font-extrabold text-slate-200  outline-none cursor-pointer"
                    >
                      {enrolledStudents.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Perfil del Estudiante */}
                <div className="glass-card-ecc border border-white/10 p-6 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border-kinetic-cyan/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-white/50/5 rounded-full blur-2xl" />
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4.5 z-10">
                    {student.avatar ? (
                      <img 
                        src={student.avatar} 
                        alt={student.name} 
                        className="h-16 w-16 rounded-3xl object-cover border-2 border-kinetic-cyan/40 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xl font-bold shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                        {student.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="text-center sm:text-left space-y-1">
                      <h4 className="text-xl font-black text-white dark:text-white leading-tight">{student.name}</h4>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-slate-450 text-xs font-bold uppercase tracking-wider">
                        <span>DNI: {student.dni}</span>
                        <span>•</span>
                        <span>{student.gradeLevel} - {student.section}</span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnóstico Inteligente */}
                  {studentDiagnostic && (
                    <div className={`p-4 rounded-2xl border ${studentDiagnostic.color} max-w-sm z-10`}>
                      <h5 className="font-extrabold text-xs uppercase tracking-widest flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4" />
                        {studentDiagnostic.label}
                      </h5>
                      <p className="text-[11px] leading-relaxed mt-1 font-medium opacity-90">
                        {studentDiagnostic.desc}
                      </p>
                    </div>
                  )}
                </div>

                {/* Fila de Tarjetas KPI de Resumen */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Calificación Promedio */}
                  <div className="glass-card-ecc border border-white/10 p-6 bg-white/40  border-white/10/50  flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Promedio del Periodo</span>
                      <h3 className={`text-3xl font-black ${
                        studentAverages.final === 'C' || (typeof studentAverages.final === 'number' && parseFloat(studentAverages.final) < (parseFloat(passingGrade) || 6.0))
                          ? 'text-rose-500' : 'text-kinetic-cyan dark:text-cyan-300'
                      }`}>
                        {studentAverages.final}
                      </h3>
                      <p className="text-[10px] text-slate-450 font-semibold">
                        {studentGradesList.filter(g => g.hasReinf).length > 0 
                          ? `Nota original: ${studentAverages.official}` 
                          : 'Sin recuperaciones registradas'}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-white/50/10 text-kinetic-cyan dark:text-cyan-300 rounded-2xl flex items-center justify-center shrink-0">
                      <Award className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Asistencia Ponderada */}
                  <div className="glass-card-ecc border border-white/10 p-6 bg-white/40  border-white/10/50  flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Asistencia Acumulada</span>
                      <h3 className={`text-3xl font-black ${
                        studentAttendanceStats.rate < 80 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-450'
                      }`}>
                        {studentAttendanceStats.rate}%
                      </h3>
                      <p className="text-[10px] text-slate-450 font-semibold">
                        {studentAttendanceStats.present} pres. • {studentAttendanceStats.late} tard. • {studentAttendanceStats.absent} falt.
                      </p>
                    </div>
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      studentAttendanceStats.rate < 80 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450'
                    }`}>
                      <Calendar className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Recuperación de Refuerzo */}
                  <div className="glass-card-ecc border border-white/10 p-6 bg-white/40  border-white/10/50  flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sesiones de Refuerzo</span>
                      <h3 className="text-3xl font-black text-amber-500">
                        {studentGradesList.filter(g => g.hasReinf).length} <span className="text-xs font-extrabold text-slate-450">Evals</span>
                      </h3>
                      <p className="text-[10px] text-slate-450 font-semibold">
                        {studentGradesList.filter(g => g.hasReinf).length > 0 
                          ? 'Calificaciones recuperadas' 
                          : 'No requiere apoyo / No asistió'}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
                      <Sparkles className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Índice de Convivencia GAMA */}
                  <div className="glass-card-ecc border border-white/10 p-6 bg-white/40  border-white/10/50  flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Índice GAMA</span>
                      <h3 className={`text-3xl font-black ${
                        studentConductStats.index >= 90 ? 'text-emerald-600' :
                        studentConductStats.index >= 75 ? 'text-amber-500' : 'text-rose-500'
                      }`}>
                        {studentConductStats.index}%
                      </h3>
                      <p className="text-[10px] text-slate-450 font-semibold">
                        Puntaje neto: {studentConductStats.netPoints} Pts ({studentConductStats.total} reg)
                      </p>
                    </div>
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      studentConductStats.index >= 90 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      <UserCheck className="h-6 w-6" />
                    </div>
                  </div>

                </div>

                {/* Dashboard Panes: Academic details on left, logs on right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* LEFT PANE: Detailed grades instrument by instrument (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="glass-card-ecc border border-white/10 p-6 space-y-5">
                      <div className="border-b border-white/10  pb-3">
                        <h4 className="text-base font-bold text-white dark:text-white flex items-center gap-2">
                          <ClipboardList className="h-5 w-5 text-kinetic-cyan" />
                          Calificaciones Detalladas Instrumento por Instrumento
                        </h4>
                        <p className="text-[11px] text-slate-400">Listado de notas del estudiante por examen, tarea o práctica.</p>
                      </div>

                      {groupedGradesByCompetence.length === 0 ? (
                        <p className="text-slate-450 italic text-center py-6 text-xs">Sin evaluaciones configuradas en este periodo.</p>
                      ) : (
                        <div className="space-y-6">
                          {groupedGradesByCompetence.map((group, groupIdx) => (
                            <div key={group.competence.id} className="space-y-3.5 p-4 rounded-3xl glass-panel shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                              {/* Header for Competency */}
                              <div className="flex items-center gap-2.5 border-b border-white/10  pb-2">
                                <span className="h-5.5 w-5.5 rounded-lg bg-white/5 dark:bg-indigo-950/60 text-kinetic-cyan dark:text-cyan-300 flex items-center justify-center font-black text-[10px] shrink-0 border border-kinetic-cyan/30 dark:border-indigo-900/40">
                                  {group.competence.id === 'other' ? 'G' : `C${groupIdx + 1}`}
                                </span>
                                <span className="text-xs font-black text-slate-200  leading-snug">
                                  {group.competence.name}
                                </span>
                              </div>

                              <div className="space-y-3">
                                {group.grades.map((g) => {
                                  const isFailingOfficial = g.score === 'C' || (typeof g.score === 'number' && parseFloat(g.score) < (parseFloat(passingGrade) || 6.0));
                                  const isFailingFinal = g.hasReinf 
                                    ? (g.reinfScore === 'C' || (typeof g.reinfScore === 'number' && parseFloat(g.reinfScore) < (parseFloat(passingGrade) || 6.0)))
                                    : isFailingOfficial;

                                  // Calculate widths for visual CSS bars
                                  const getPercent = (score) => {
                                    if (!score) return 0;
                                    if (gradingScale === 'literal') {
                                      if (score === 'AD') return 100;
                                      if (score === 'A') return 75;
                                      if (score === 'B') return 50;
                                      return 25; // C
                                    } else {
                                      const val = parseFloat(score) || 0;
                                      const maxVal = gradingScale === '20' ? 20 : 10;
                                      return Math.min(100, Math.max(0, (val / maxVal) * 100));
                                    }
                                  };

                                  const offPercent = getPercent(g.score);
                                  const reinfPercent = getPercent(g.reinfScore);
                                  const improvedPercent = Math.max(0, reinfPercent - offPercent);

                                  return (
                                    <div 
                                      key={g.evaluation.id} 
                                      className="p-4 rounded-2xl border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 bg-white/20  space-y-3"
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="space-y-0.5">
                                          <h5 className="font-extrabold text-xs text-white ">
                                            {g.evaluation.name}
                                          </h5>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                            Fecha: {g.evaluation.date || '-'} • Tipo: {g.evaluation.type || '-'}
                                          </p>
                                        </div>

                                        {/* Score indicator badge */}
                                        <div className="flex items-center gap-2 self-start sm:self-center">
                                          {g.hasReinf ? (
                                            <div className="flex items-center gap-1.5">
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-black line-through opacity-50 ${
                                                isFailingOfficial ? 'bg-rose-50 text-rose-700' : 'bg-white/5 text-slate-200'
                                              }`}>
                                                {g.score || '-'}
                                              </span>
                                              <span className="text-xs text-slate-400">→</span>
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 ${
                                                isFailingFinal 
                                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-350' 
                                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                              }`}>
                                                <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                                                {g.reinfScore} (Refuerzo)
                                              </span>
                                            </div>
                                          ) : (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                              isFailingOfficial 
                                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-350' 
                                                : 'bg-white/5 text-cyan-400 bg-white/5 dark:text-cyan-200'
                                            }`}>
                                              {g.score || '-'}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Custom HTML/CSS Bar Chart representing Grade Improvement */}
                                      <div className="space-y-1">
                                        <div className="w-full bg-white/10  h-2.5 rounded-full overflow-hidden relative">
                                          {/* Official grade bar */}
                                          <div 
                                            className={`h-full absolute left-0 top-0 transition-all duration-300 ${
                                              isFailingOfficial ? 'bg-rose-400' : 'bg-white/50'
                                            }`}
                                            style={{ width: `${offPercent}%` }}
                                          />
                                          {/* Reinforcement recovery bar */}
                                          {g.hasReinf && reinfPercent > offPercent && (
                                            <div 
                                              className="h-full absolute top-0 bg-emerald-500 transition-all duration-300"
                                              style={{ left: `${offPercent}%`, width: `${improvedPercent}%` }}
                                            />
                                          )}
                                        </div>
                                        
                                        {/* Legend / Info under bar */}
                                        {g.hasReinf && reinfPercent > offPercent && (
                                          <p className="text-[9px] text-emerald-600 dark:text-emerald-450 font-bold uppercase tracking-wider text-right">
                                            Recuperado: +{Math.round(improvedPercent)}% de logro alcanzado
                                          </p>
                                        )}
                                      </div>

                                      {/* Comments section if any */}
                                      {(g.feedback || g.reinfNotes) && (
                                        <div className="mt-2 text-[10.5px] leading-relaxed p-2.5 rounded-xl bg-white/5  border border-white/10/50  text-slate-400  italic">
                                          {g.feedback && <p><strong>Comentario oficial:</strong> {g.feedback}</p>}
                                          {g.reinfNotes && <p className="mt-1"><strong>Observación de refuerzo:</strong> {g.reinfNotes}</p>}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT PANE: Attendance details + GAMA logs (5 cols) */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    {/* Attendance breakdown panel */}
                    <div className="glass-card-ecc border border-white/10 p-5 space-y-4">
                      <div className="border-b border-white/10  pb-3">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <Calendar className="h-4.5 w-4.5 text-kinetic-cyan" />
                          Desglose de Asistencia
                        </h4>
                      </div>

                      {/* Asistencia progress indicators */}
                      <div className="space-y-3">
                        {/* Presentes */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-300 ">
                            <span>Asistió Puntual (Puntual/Tarde)</span>
                            <span className="font-extrabold text-white dark:text-white">
                              {studentAttendanceStats.present + studentAttendanceStats.late} de {studentAttendanceStats.total}
                            </span>
                          </div>
                          <div className="w-full bg-white/10  h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${studentAttendanceStats.total > 0 ? ((studentAttendanceStats.present + studentAttendanceStats.late) / studentAttendanceStats.total) * 100 : 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Justificadas */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-300 ">
                            <span>Faltas Justificadas</span>
                            <span className="font-extrabold text-white dark:text-white">
                              {studentAttendanceStats.excused} de {studentAttendanceStats.total}
                            </span>
                          </div>
                          <div className="w-full bg-white/10  h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-blue-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${studentAttendanceStats.total > 0 ? (studentAttendanceStats.excused / studentAttendanceStats.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Faltas Injustificadas */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-300 ">
                            <span>Faltas Injustificadas</span>
                            <span className="font-extrabold text-rose-500">
                              {studentAttendanceStats.absent} de {studentAttendanceStats.total}
                            </span>
                          </div>
                          <div className="w-full bg-white/10  h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-rose-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${studentAttendanceStats.total > 0 ? (studentAttendanceStats.absent / studentAttendanceStats.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Recent attendance list */}
                      <div className="border-t border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 pt-3">
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">Últimas 5 Sesiones</span>
                        {studentAttendanceList.length === 0 ? (
                          <p className="text-slate-400 text-xs italic">Sin registros de asistencia en el bimestre.</p>
                        ) : (
                          <div className="space-y-2">
                            {studentAttendanceList.slice(0, 5).map(att => (
                              <div key={att.id} className="flex items-center justify-between text-xs font-semibold py-1">
                                <span className="text-slate-400 ">{att.date}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  att.status === 'present' ? 'bg-emerald-50 text-emerald-700' :
                                  att.status === 'late' ? 'bg-amber-50 text-amber-700' :
                                  att.status === 'excused' ? 'bg-blue-50 text-blue-700' :
                                  'bg-rose-50 text-rose-700'
                                }`}>
                                  {att.status === 'present' ? 'Presente' :
                                   att.status === 'late' ? 'Tarde' :
                                   att.status === 'excused' ? 'Justificado' : 'Falta'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* GAMA personal history timeline */}
                    <div className="glass-card-ecc border border-white/10 p-5 space-y-4">
                      <div className="border-b border-white/10  pb-3">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <UserCheck className="h-4.5 w-4.5 text-kinetic-cyan" />
                          Acuerdos y Convivencia GAMA
                        </h4>
                      </div>

                      {studentConductList.length === 0 ? (
                        <p className="text-slate-455 text-xs italic text-center py-4">Sin novedades de conducta registradas.</p>
                      ) : (
                        <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                          {studentConductList.map(rec => {
                            const isMerit = rec.type === 'merit';
                            return (
                              <div 
                                key={rec.id} 
                                className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
                                  isMerit 
                                    ? 'bg-emerald-50/40 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/20' 
                                    : 'bg-rose-50/40 border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/20'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                    isMerit ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {isMerit ? 'Cumplió' : 'Incumplió'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-extrabold">{rec.date}</span>
                                </div>
                                <p className="text-xs font-bold text-slate-200  leading-snug">
                                  {rec.category}
                                </p>
                                <p className="text-[11px] text-slate-400  leading-relaxed whitespace-pre-line">
                                  {rec.description}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>

                </div>

              </div>
            ) : (
              // ==========================================
              // VISTA 2: LISTADO / BUSCADOR DE ALUMNOS
              // ==========================================
              <div className="space-y-6 animate-in fade-in duration-250">
                
                {/* Cabecera / Explicativo */}
                <div className="glass-card-ecc border border-white/10 p-6 bg-white/50/5 border-kinetic-cyan/10 dark:bg-indigo-950/10 dark:border-indigo-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-white dark:text-white text-base">Diagnóstico e Informes Académicos</h3>
                    <p className="text-xs text-slate-400 ">
                      Selecciona un estudiante para cargar su informe de rendimiento, asistencia y bitácora de acuerdos de convivencia.
                    </p>
                  </div>
                  
                  {/* Buscador de estudiantes */}
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o DNI de alumno..."
                      value={reportSearchQuery}
                      onChange={(e) => setReportSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 rounded-xl bg-white/45  text-xs font-semibold focus:border-kinetic-cyan outline-none"
                    />
                  </div>
                </div>

                {/* Grid de Tarjetas de Alumnos */}
                {enrolledStudents.filter(s => 
                  s.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) || 
                  (s.dni && s.dni.includes(reportSearchQuery))
                ).length === 0 ? (
                  <div className="text-center py-12 glass-card text-slate-400">
                    <Users className="h-10 w-10 text-kinetic-cyan mb-3 mx-auto" />
                    <p className="text-sm font-semibold">No se encontraron alumnos matriculados que coincidan.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrolledStudents
                      .filter(s => 
                        s.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) || 
                        (s.dni && s.dni.includes(reportSearchQuery))
                      )
                      .map(std => {
                        // Calculate quick stats
                        const atts = attendance.filter(a => a.type === 'student' && a.targetId === std.id && a.courseId === selectedCourseId && (a.bimester || '1') === selectedBimester);
                        const present = atts.filter(a => a.status === 'present' || a.status === 'late' || a.status === 'excused').length;
                        const attRate = atts.length > 0 ? Math.round((present / atts.length) * 100) : 100;

                        const stdCond = conduct.filter(rec => rec.studentId === std.id);
                        const merits = stdCond.filter(r => r.type === 'merit').length;
                        const condIndex = stdCond.length > 0 ? Math.round((merits / stdCond.length) * 100) : 100;

                        const courseEvals = evaluations.filter(ev => ev.courseId === selectedCourseId && (ev.bimester || '1') === selectedBimester);
                        const scores = [];
                        courseEvals.forEach(ev => {
                          const record = grades.find(g => g.studentId === std.id && g.evaluationId === ev.id);
                          if (record && record.score !== undefined && record.score !== '') {
                            scores.push(record.score);
                          }
                        });

                        let avgGrade = '-';
                        if (scores.length > 0) {
                          if (gradingScale === 'literal') {
                            const sum = scores.reduce((sum, s) => sum + letterToValue(s), 0);
                            avgGrade = valueToLetter(sum / scores.length);
                          } else {
                            const sum = scores.reduce((sum, s) => sum + parseFloat(s), 0);
                            avgGrade = (sum / scores.length).toFixed(1);
                          }
                        }

                        const isFailing = avgGrade === 'C' || (typeof avgGrade === 'number' && parseFloat(avgGrade) < (parseFloat(passingGrade) || 6.0));

                        return (
                          <div 
                            key={std.id}
                            onClick={() => setSelectedStudentForReport(std)}
                            className="glass-card-ecc border border-white/10 p-6 flex flex-col justify-between border border-white/10/50  hover:scale-[1.01] hover:border-kinetic-cyan/80 transition-all duration-200 cursor-pointer group relative overflow-hidden"
                          >
                            <div className="absolute -right-4 -bottom-4 h-16 w-16 bg-white/50/5 rounded-full blur-md" />
                            
                            <div className="space-y-4">
                              <div className="flex items-start gap-3">
                                {std.avatar ? (
                                  <img 
                                    src={std.avatar} 
                                    alt={std.name} 
                                    className="h-11 w-11 rounded-2xl object-cover border border-white/10  shrink-0" 
                                  />
                                ) : (
                                  <div className={`h-11 w-11 rounded-2xl bg-gradient-to-tr ${getAvatarBg(std.name)} text-white flex items-center justify-center font-bold text-sm shrink-0 `}>
                                    {getInitials(std.name)}
                                  </div>
                                )}
                                <div className="space-y-0.5">
                                  <h4 className="font-extrabold text-white dark:text-white text-sm group-hover:text-kinetic-cyan dark:group-hover:text-cyan-300 transition truncate w-48">
                                    {std.name}
                                  </h4>
                                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                                    DNI: {std.dni}
                                  </p>
                                </div>
                              </div>

                              {/* Summary Stats Inside selector card */}
                              <div className="grid grid-cols-3 gap-2 border-t border-b border-white/10  py-3 text-center">
                                <div>
                                  <span className="text-[8px] font-black uppercase text-slate-400 block mb-0.5">Notas</span>
                                  <span className={`text-xs font-black ${isFailing ? 'text-rose-500' : 'text-kinetic-cyan dark:text-cyan-300'}`}>
                                    {avgGrade}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-black uppercase text-slate-400 block mb-0.5">Asistencia</span>
                                  <span className={`text-xs font-black ${attRate < 80 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {attRate}%
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-black uppercase text-slate-400 block mb-0.5">Convivencia</span>
                                  <span className={`text-xs font-black ${condIndex < 75 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {condIndex}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 text-[10.5px] text-kinetic-cyan dark:text-cyan-300 font-black">
                              <span>Ver Diagnóstico 360°</span>
                              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1.5 transition-transform" />
                            </div>

                          </div>
                        );
                      })}
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}

export default ClassroomManager;
