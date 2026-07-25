import React, { useState, useContext, useMemo, useRef } from 'react';
import { DatabaseContext } from '../context/DatabaseContext';
import InstrumentGraderModal from './InstrumentGraderModal';
import InstrumentBuilderModal from './InstrumentBuilderModal';
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
  Square,
  FileEdit,
  Download,
  Upload
} from 'lucide-react';

function CustomGroupsManager() {
  const { 
    students, 
    courses,
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
  const [selectedWorkshopCourseId, setSelectedWorkshopCourseId] = useState('');

  // Reports states
  const [selectedRepGroupId, setSelectedRepGroupId] = useState(customGroups[0]?.id || '');

  // Instrument Builder / Grader states (for full instrument support)
  const [editingGroupEvaluation, setEditingGroupEvaluation] = useState(null);
  const [activeGradingSession, setActiveGradingSession] = useState(null);

  const availableWorkshopCourses = useMemo(() => {
    if (currentRole !== 'teacher') return courses || [];
    return (courses || []).filter(course =>
      (course.assignments || []).some(assignment => assignment.teacherId === currentUser?.id)
    );
  }, [courses, currentRole, currentUser]);

  const selectedWorkshopCourse = useMemo(() =>
    availableWorkshopCourses.find(course => course.id === selectedWorkshopCourseId) || availableWorkshopCourses[0] || null,
  [availableWorkshopCourses, selectedWorkshopCourseId]);

  const workshopStructure = selectedWorkshopCourse?.competencies || [];

  React.useEffect(() => {
    if (!selectedWorkshopCourseId && availableWorkshopCourses[0]) {
      setSelectedWorkshopCourseId(availableWorkshopCourses[0].id);
    }
  }, [availableWorkshopCourses, selectedWorkshopCourseId]);

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

  const isLiteralScore = (score) => ['AD', 'A', 'B', 'C'].includes(String(score || '').trim().toUpperCase());

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

  // --- Instrument Builder / Grader handlers ---
  const handleOpenBuilder = (evalData = null) => {
    const courseId = evalData?.courseId || selectedWorkshopCourse?.id;
    if (!courseId) return alert('Seleccione primero el curso curricular del taller.');
    setSelectedWorkshopCourseId(courseId);
    setEditingGroupEvaluation(evalData ? { ...evalData, groupId: selectedGrdGroupId } : { groupId: selectedGrdGroupId });
  };

  const handleCloseBuilder = () => {
    setEditingGroupEvaluation(null);
  };

  const handleBuilderSave = async (instrumentData) => {
    // instrumentData includes: name, date, type, instrumentConfig, items, maxGradeScale, etc.
    const existingEvaluation = editingGroupEvaluation?.id
      ? groupGrades.find(item => item.id === editingGroupEvaluation.id)
      : null;
    saveGroupEvaluation(
      selectedGrdGroupId,
      editingGroupEvaluation?.id || null,
      {
        name: instrumentData.name,
        date: instrumentData.date || new Date().toISOString().split('T')[0],
        type: instrumentData.type || 'Rúbrica',
        courseId: selectedWorkshopCourse?.id,
        courseName: selectedWorkshopCourse?.name,
        competenceId: instrumentData.competenceId,
        ownerId: currentUser?.id || 'admin_1',
        teacherId: currentUser?.id || 'admin_1',
        instrumentConfig: instrumentData.instrumentConfig,
        items: instrumentData.items,
        maxGradeScale: instrumentData.maxGradeScale || 'A',
        scores: existingEvaluation?.scores || {} // editing the instrument must never erase existing grades
      }
    );
    handleCloseBuilder();
    setSelectedEvalId('new'); // refresh list
  };

  const handleOpenGrader = (student, evalItem) => {
    const groupEvaluation = (groupGrades || []).find(g => g.id === evalItem.id);
    const existingGrade = groupEvaluation ? {
      studentId: student.id,
      evaluationId: evalItem.id,
      score: groupEvaluation.scores?.[student.id],
      details: groupEvaluation.scores?.[`${student.id}_details`] || null
    } : null;
    setActiveGradingSession({ student, evalItem, existingGrade });
  };

  const handleCloseGrader = () => {
    setActiveGradingSession(null);
  };

  const handleGraderSave = (studentId, payload) => {
    const evalItem = activeGradingSession?.evalItem;
    if (!evalItem) return;

    const currentEval = groupGrades.find(g => g.id === evalItem.id);
    if (!currentEval) return;

    const updatedScores = {
      ...currentEval.scores,
      [studentId]: payload.score,
      [`${studentId}_details`]: payload.details || {}
    };

    saveGroupEvaluation(selectedGrdGroupId, evalItem.id, {
      ...currentEval,
      scores: updatedScores
    });

    handleCloseGrader();
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
        // Workshop instruments can use literal scales even when the global
        // setting is numeric.  Respect the final mark saved by the grader.
        if (stdScores.every(isLiteralScore)) {
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
      <style>{`
        .tab-groups-3d {
          position: relative;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(226, 232, 240, 0.8);
          background: #ffffff;
          border-bottom-width: 6px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          text-align: center;
          outline: none;
          select-none: none;
        }
        
        .dark .tab-groups-3d {
          background: #1e293b;
          border-color: rgba(51, 65, 85, 0.8);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        }
        
        .tab-groups-3d:hover:not(:disabled) {
          transform: translateY(-2px);
          border-bottom-width: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
        }
        
        .dark .tab-groups-3d:hover:not(:disabled) {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.35);
        }
        
        .tab-groups-3d:active:not(:disabled) {
          transform: translateY(2px);
          border-bottom-width: 2px;
          box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.04);
        }
        
        .tab-groups-3d:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .emoji-3d-groups-tab {
          font-size: 2.25rem;
          line-height: 1;
          display: inline-block;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
          perspective: 100px;
        }
        
        .tab-groups-3d:hover:not(:disabled) .emoji-3d-groups-tab {
          transform: scale(1.1) translateY(-4px) rotate(5deg);
        }
        
        /* Blue: Groups */
        .tab-groups-blue {
          border-bottom-color: #cbd5e1;
        }
        .dark .tab-groups-blue {
          border-bottom-color: #334155;
        }
        .tab-groups-blue-active {
          background: #eff6ff !important;
          border-color: #bfdbfe !important;
          border-bottom-width: 6px !important;
          border-bottom-color: #3b82f6 !important;
          color: #1d4ed8 !important;
          box-shadow: 0 6px 12px rgba(59, 130, 246, 0.08) !important;
        }
        .dark .tab-groups-blue-active {
          background: rgba(59, 130, 246, 0.1) !important;
          border-color: #3b82f6 !important;
          border-bottom-color: #2563eb !important;
          color: #93c5fd !important;
        }
        .tab-groups-blue-active .emoji-3d-groups-tab {
          filter: drop-shadow(0 1px 0 #bfdbfe)
                  drop-shadow(0 2px 0 #3b82f6)
                  drop-shadow(0 3px 0 #2563eb)
                  drop-shadow(0 4px 0 #1d4ed8)
                  drop-shadow(0 6px 8px rgba(37, 99, 235, 0.35)) !important;
          transform: scale(1.05) translateZ(8px);
        }
        .tab-groups-blue:hover:not(:disabled) .emoji-3d-groups-tab {
          filter: drop-shadow(0 1px 0 #bfdbfe)
                  drop-shadow(0 2px 0 #3b82f6)
                  drop-shadow(0 4px 6px rgba(37, 99, 235, 0.2));
        }

        /* Green: Attendance */
        .tab-groups-green {
          border-bottom-color: #cbd5e1;
        }
        .dark .tab-groups-green {
          border-bottom-color: #334155;
        }
        .tab-groups-green-active {
          background: #ecfdf5 !important;
          border-color: #a7f3d0 !important;
          border-bottom-width: 6px !important;
          border-bottom-color: #10b981 !important;
          color: #047857 !important;
          box-shadow: 0 6px 12px rgba(16, 185, 129, 0.08) !important;
        }
        .dark .tab-groups-green-active {
          background: rgba(16, 185, 129, 0.1) !important;
          border-color: #10b981 !important;
          border-bottom-color: #059669 !important;
          color: #a7f3d0 !important;
        }
        .tab-groups-green-active .emoji-3d-groups-tab {
          filter: drop-shadow(0 1px 0 #a7f3d0)
                  drop-shadow(0 2px 0 #10b981)
                  drop-shadow(0 3px 0 #059669)
                  drop-shadow(0 4px 0 #047857)
                  drop-shadow(0 6px 8px rgba(16, 185, 129, 0.35)) !important;
          transform: scale(1.05) translateZ(8px);
        }
        .tab-groups-green:hover:not(:disabled) .emoji-3d-groups-tab {
          filter: drop-shadow(0 1px 0 #a7f3d0)
                  drop-shadow(0 2px 0 #10b981)
                  drop-shadow(0 4px 6px rgba(16, 185, 129, 0.2));
        }

        /* Purple: Grades */
        .tab-groups-purple {
          border-bottom-color: #cbd5e1;
        }
        .dark .tab-groups-purple {
          border-bottom-color: #334155;
        }
        .tab-groups-purple-active {
          background: #f5f3ff !important;
          border-color: #ddd6fe !important;
          border-bottom-width: 6px !important;
          border-bottom-color: #8b5cf6 !important;
          color: #6d28d9 !important;
          box-shadow: 0 6px 12px rgba(139, 92, 246, 0.08) !important;
        }
        .dark .tab-groups-purple-active {
          background: rgba(139, 92, 246, 0.1) !important;
          border-color: #8b5cf6 !important;
          border-bottom-color: #7c3aed !important;
          color: #ddd6fe !important;
        }
        .tab-groups-purple-active .emoji-3d-groups-tab {
          filter: drop-shadow(0 1px 0 #ddd6fe)
                  drop-shadow(0 2px 0 #8b5cf6)
                  drop-shadow(0 3px 0 #7c3aed)
                  drop-shadow(0 4px 0 #6d28d9)
                  drop-shadow(0 6px 8px rgba(139, 92, 246, 0.35)) !important;
          transform: scale(1.05) translateZ(8px);
        }
        .tab-groups-purple:hover:not(:disabled) .emoji-3d-groups-tab {
          filter: drop-shadow(0 1px 0 #ddd6fe)
                  drop-shadow(0 2px 0 #8b5cf6)
                  drop-shadow(0 4px 6px rgba(139, 92, 246, 0.2));
        }

        /* Teal: Reports */
        .tab-groups-teal {
          border-bottom-color: #cbd5e1;
        }
        .dark .tab-groups-teal {
          border-bottom-color: #334155;
        }
        .tab-groups-teal-active {
          background: #f0fdfa !important;
          border-color: #99f6e4 !important;
          border-bottom-width: 6px !important;
          border-bottom-color: #14b8a6 !important;
          color: #0f766e !important;
          box-shadow: 0 6px 12px rgba(20, 184, 166, 0.08) !important;
        }
        .dark .tab-groups-teal-active {
          background: rgba(20, 184, 166, 0.1) !important;
          border-color: #14b8a6 !important;
          border-bottom-color: #0d9488 !important;
          color: #99f6e4 !important;
        }
        .tab-groups-teal-active .emoji-3d-groups-tab {
          filter: drop-shadow(0 1px 0 #99f6e4)
                  drop-shadow(0 2px 0 #14b8a6)
                  drop-shadow(0 3px 0 #0d9488)
                  drop-shadow(0 4px 0 #0f766e)
                  drop-shadow(0 6px 8px rgba(20, 184, 166, 0.35)) !important;
          transform: scale(1.05) translateZ(8px);
        }
        .tab-groups-teal:hover:not(:disabled) .emoji-3d-groups-tab {
          filter: drop-shadow(0 1px 0 #99f6e4)
                  drop-shadow(0 2px 0 #14b8a6)
                  drop-shadow(0 4px 6px rgba(20, 184, 166, 0.2));
        }
      `}</style>

      {/* Module Header Banner (Full Width 3D) */}
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
        <span className="emoji-3d-header shrink-0">🧩</span>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Grupos Especiales</h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Crea talleres, refuerzos académicos y proyectos con listas personalizadas de alumnos de cualquier sección.</p>
        </div>
      </section>

      {/* Module Action Row */}
      {activeSubTab === 'groups' && !isFormOpen && (
        <div className="flex justify-end w-full">
          <button
            onClick={handleCreateNewGroupClick}
            className="px-6 py-3 rounded-xl bg-[#e11d48] hover:bg-rose-700 text-white text-xs font-black tracking-widest transition-all shadow-[0_4px_12px_rgba(225,29,72,0.15)] flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Crear Grupo Especial
          </button>
        </div>
      )}

      {/* Sub-tabs Navigation (Module Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full mb-6">
        <button
          onClick={() => { setActiveSubTab('groups'); setIsFormOpen(false); }}
          className={`tab-groups-3d tab-groups-blue flex flex-col items-center justify-center p-6 rounded-3xl ${
            activeSubTab === 'groups' ? 'tab-groups-blue-active' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="emoji-3d-groups-tab mb-3">👥</span>
          <span className="text-xs font-black tracking-wider uppercase leading-snug text-center">
            Grupos ({customGroups.length})
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`tab-groups-3d tab-groups-green flex flex-col items-center justify-center p-6 rounded-3xl ${
            activeSubTab === 'attendance' ? 'tab-groups-green-active' : 'text-slate-600 dark:text-slate-400'
          } ${customGroups.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={customGroups.length === 0}
        >
          <span className="emoji-3d-groups-tab mb-3">📅</span>
          <span className="text-xs font-black tracking-wider uppercase leading-snug text-center">
            Asistencia Taller
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('grades')}
          className={`tab-groups-3d tab-groups-purple flex flex-col items-center justify-center p-6 rounded-3xl ${
            activeSubTab === 'grades' ? 'tab-groups-purple-active' : 'text-slate-600 dark:text-slate-400'
          } ${customGroups.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={customGroups.length === 0}
        >
          <span className="emoji-3d-groups-tab mb-3">📋</span>
          <span className="text-xs font-black tracking-wider uppercase leading-snug text-center">
            Calificaciones Taller
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`tab-groups-3d tab-groups-teal flex flex-col items-center justify-center p-6 rounded-3xl ${
            activeSubTab === 'reports' ? 'tab-groups-teal-active' : 'text-slate-600 dark:text-slate-400'
          } ${customGroups.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={customGroups.length === 0}
        >
          <span className="emoji-3d-groups-tab mb-3">📈</span>
          <span className="text-xs font-black tracking-wider uppercase leading-snug text-center">
            Reportes y Logros
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
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase text-slate-400">Curso curricular y competencias</label>
                <select
                  value={selectedWorkshopCourse?.id || ''}
                  onChange={(e) => setSelectedWorkshopCourseId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold dark:border-slate-800 dark:bg-slate-900"
                >
                  {availableWorkshopCourses.map(course => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400">Define las competencias, capacidades y desempeños disponibles en el constructor.</p>
              </div>
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-black uppercase text-slate-400">Evaluaciones</label>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-100 dark:border-slate-800/40 p-2.5 rounded-2xl bg-slate-50/45 dark:bg-slate-950/20">
                <button
                  onClick={() => handleOpenBuilder(null)}
                  className="w-full text-left p-2.5 rounded-xl text-xs font-bold transition bg-indigo-600 text-white shadow-md"
                >
                  ➕  Crear Nuevo Instrumento
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
                      className="flex-1 text-left truncate pr-2 flex items-center gap-2"
                    >
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        ev.type === 'Examen' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                        ev.type === 'Rúbrica' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                        ev.type === 'Lista de Cotejo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {ev.type || 'Instrumento'}
                      </span>
                      <p className="truncate">{ev.name}</p>
                    </button>
                    <div className="flex items-center gap-1">
                      {ev.instrumentConfig && ev.items && ev.items.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenGrader({ id: 'dummy' }, ev); // will be handled by grader
                          }}
                          disabled
                          className="p-1.5 text-slate-400 opacity-50 cursor-not-allowed"
                          title="Usa 'Calificar' en la fila del estudiante"
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBuilder(ev);
                        }}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-lg transition"
                        title="Editar Instrumento"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`¿Seguro que desea eliminar la evaluación "${ev.name}"?`)) {
                            deleteGroupEvaluation(selectedGrdGroupId, ev.id);
                            if (selectedEvalId === ev.id) setSelectedEvalId('new');
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition"
                        title="Eliminar Evaluación"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Evaluation Detail / Grading */}
          <div className="lg:col-span-2 glass-card p-6">
            {selectedEvalId === 'new' ? (
              <div className="text-center py-12 text-slate-400">
                <FileEdit className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold">Seleccione o cree un instrumento</p>
                <p className="text-xs text-slate-500 mt-1">Haga clic en "Crear Nuevo Instrumento" o seleccione uno de la lista</p>
              </div>
            ) : (
              <>
                {/* Evaluation Header with Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div>
                    <h4 className="font-bold text-lg">{groupEvaluations.find(e => e.id === selectedEvalId)?.name || 'Cargando...'}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-bold uppercase">
                        {groupEvaluations.find(e => e.id === selectedEvalId)?.type || 'Instrumento'}
                      </span>
                      <span>{groupEvaluations.find(e => e.id === selectedEvalId)?.date}</span>
                      <span>Escala: {gradingScale === 'literal' ? 'Literal (AD, A, B, C)' : 'Numérica (0-10)'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenBuilder(groupEvaluations.find(e => e.id === selectedEvalId))}
                      className="btn-neuro-secondary text-xs flex items-center gap-1"
                    >
                      <Edit className="h-3.5 w-3.5" /> Editar Instrumento
                    </button>
                    <button
                      onClick={() => setSelectedEvalId('new')}
                      className="btn-neuro-secondary text-xs"
                    >
                      Volver
                    </button>
                  </div>
                </div>

                {/* Students List with Grade Actions */}
                {activeGrdStudents.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 italic text-sm">
                    El grupo no tiene alumnos asignados.
                  </div>
                ) : (
                  <div className="border border-slate-200/50 dark:border-slate-800/80 rounded-2xl overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr_repeat(3,80px)] gap-0 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200/50 dark:border-slate-800/50">
                      <div className="flex items-center gap-2">
                        <span>Estudiante</span>
                        {groupEvaluations.find(e => e.id === selectedEvalId)?.items && (
                          <>
                            {groupEvaluations.find(e => e.id === selectedEvalId).items.slice(0, 3).map((item, i) => (
                              <span key={item.id} className="hidden sm:block text-center truncate w-16" title={item.text || item.id}>Item {i + 1}</span>
                            ))}
                            {groupEvaluations.find(e => e.id === selectedEvalId).items.length > 3 && (
                              <span className="hidden sm:block text-center w-16">+{groupEvaluations.find(e => e.id === selectedEvalId).items.length - 3}</span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="text-center">Promedio</div>
                      <div className="text-center">Estado</div>
                      <div className="text-center">Acciones</div>
                    </div>

                    {/* Student Rows */}
                    <div className="max-h-[500px] overflow-y-auto">
                      {activeGrdStudents.map(s => {
                        const evalData = groupEvaluations.find(e => e.id === selectedEvalId);
                        const studentDetails = evalData?.scores?.[`${s.id}_details`] || {};
                        const studentItems = evalData?.items || [];
                        const studentScores = studentDetails.itemScores || {};
                        const savedFinalScore = evalData?.scores?.[s.id];
                        
                        // The modal already calculates and saves the final
                        // literal grade. Never replace it by an average of raw
                        // item points, which use different weights.
                        let avgDisplay = savedFinalScore !== undefined && savedFinalScore !== '' ? savedFinalScore : '-';
                        if (avgDisplay === '-' && studentScores && Object.keys(studentScores).length > 0) {
                          const vals = Object.values(studentScores).filter(v => v !== undefined && v !== '');
                          if (vals.length > 0) {
                            if (vals.every(isLiteralScore)) {
                              const sum = vals.reduce((a, v) => a + letterToValue(v), 0);
                              avgDisplay = valueToLetter(sum / vals.length);
                            } else {
                              avgDisplay = (vals.reduce((a, v) => a + (parseFloat(v) || 0), 0) / vals.length).toFixed(1);
                            }
                          }
                        }

                        const isInDanger = avgDisplay === 'C' || (!isLiteralScore(avgDisplay) && parseFloat(avgDisplay) < (parseFloat(passingGrade) || 6));

                        return (
                          <div key={s.id} className="grid grid-cols-[1fr_repeat(3,80px)] gap-0 items-center px-4 py-3 border-b border-slate-100/50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                            <div className="flex items-center gap-3 min-w-0">
                              <img src={s.avatar} alt="" className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" />
                              <div className="truncate">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{s.name}</p>
                                <p className="text-[9px] text-slate-400 font-mono">DNI: {s.dni}</p>
                              </div>
                              {/* Item scores preview */}
                              {studentItems.length > 0 && (
                                <div className="hidden sm:flex items-center gap-1 ml-2 text-[9px] text-slate-500">
                                  {studentItems.slice(0, 3).map((item, i) => (
                                    <span key={item.id} className="w-16 text-center truncate bg-slate-100 dark:bg-slate-800 rounded px-0.5">
                                      {studentScores[item.id] !== undefined ? studentScores[item.id] : '—'}
                                    </span>
                                  ))}
                                  {studentItems.length > 3 && <span className="w-16 text-center text-slate-400">+{studentItems.length - 3}</span>}
                                </div>
                              )}
                            </div>
                            <div className={`text-center font-bold text-sm ${isInDanger ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                              {avgDisplay}
                            </div>
                            <div className="text-center">
                              {isInDanger ? (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-extrabold uppercase dark:bg-rose-950/40 dark:text-rose-300">
                                  <AlertTriangle className="h-3 w-3" /> Riesgo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-extrabold uppercase dark:bg-emerald-950/40 dark:text-emerald-300">
                                  <Check className="h-3 w-3" /> OK
                                </span>
                              )}
                            </div>
                            <div className="text-center">
                              <button
                                onClick={() => handleOpenGrader(s, evalData)}
                                className="btn-neuro-primary text-[10px] px-2 py-1"
                              >
                                <FileEdit className="h-3 w-3 mr-1" /> Calificar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Instrument Builder Modal */}
            {editingGroupEvaluation && (
              <InstrumentBuilderModal
                structure={workshopStructure}
                initialEvaluation={editingGroupEvaluation.id ? editingGroupEvaluation : null}
                onClose={handleCloseBuilder}
                onSave={handleBuilderSave}
              />
            )}

            {/* Instrument Grader Modal */}
            {activeGradingSession && (
              <InstrumentGraderModal
                student={activeGradingSession.student}
                instrument={activeGradingSession.evalItem}
                initialGrade={activeGradingSession.existingGrade}
                studentGrades={activeGrdStudents.map(student => ({
                  studentId: student.id,
                  evaluationId: activeGradingSession.evalItem.id,
                  score: activeGradingSession.evalItem.scores?.[student.id],
                  details: activeGradingSession.evalItem.scores?.[`${student.id}_details`] || null
                }))}
                enrolledStudents={activeGrdStudents}
                onClose={handleCloseGrader}
                onSave={handleGraderSave}
              />
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
