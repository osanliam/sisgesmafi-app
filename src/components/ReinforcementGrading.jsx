import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DatabaseContext } from '../context/DatabaseContext';
import { 
  Award, 
  Calendar, 
  Save, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Info,
  Search,
  Users,
  BookOpen,
  ClipboardList,
  Plus,
  Settings,
  Trash2,
  X,
  Check,
  Sparkles,
  ClipboardCheck,
  Copy,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';

function ReinforcementGrading({
  embeddedCourseId,
  embeddedGrade,
  embeddedSection,
  embeddedBimester,
  isEmbedded = false,
  onNavigateToTarget
}) {
  const { 
    currentRole, 
    currentUser, 
    courses: contextCourses, 
    students: contextStudents, 
    grades: contextGrades, 
    evaluations: contextEvaluations,
    saveEvaluation,
    deleteEvaluation,
    copyEvaluation,
    gradingScale,
    passingGrade,
    reinforcementGrades: contextReinforcementGrades,
    saveReinforcementGrade,
    saveReinforcementGradesBatch,
    activePeriods
  } = useContext(DatabaseContext);

  const courses = contextCourses || [];
  const students = contextStudents || [];
  const grades = contextGrades || [];
  const evaluations = contextEvaluations || [];
  const reinforcementGrades = contextReinforcementGrades || [];

  // Estados de selección local si no está embebido
  const [localGrade, setLocalGrade] = useState('1ro Secundaria');
  const [localSection, setLocalSection] = useState('A');
  const [localCourseId, setLocalCourseId] = useState('');
  const [localBimester, setLocalBimester] = useState('1');

  const selectedGrade = isEmbedded ? embeddedGrade : localGrade;
  const selectedSection = isEmbedded ? embeddedSection : localSection;
  const selectedCourseId = isEmbedded ? embeddedCourseId : localCourseId;
  const selectedBimester = isEmbedded ? embeddedBimester : localBimester;

  const [selectedCompetenceId, setSelectedCompetenceId] = useState('');
  const [filterOnlyAtRisk, setFilterOnlyAtRisk] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // View mode: 'auxiliar' | 'consolidado'
  const [viewMode, setViewMode] = useState('auxiliar');



  // Export/Import per evaluation column
  const handleExportEvalGrades = async (evalItem) => {
    try {
      const evalGrades = (reinforcementGrades || []).filter(g => g.evaluationId === evalItem.id);
      const response = await axios.post('/api/excel/export-evaluation-grades', {
        evaluation: evalItem,
        students: visibleStudentsList,
        grades: evalGrades
      }, { responseType: 'blob' });

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Notas_Refuerzo_${evalItem.name.replace(/\s+/g, '_')}.xlsx`;
      link.click();
    } catch (error) {
      console.error('Failed to export reinforcement eval grades:', error);
      alert('Error al exportar calificaciones de refuerzo.');
    }
  };

  const fileInputRef = useRef(null);
  const [importingEvalId, setImportingEvalId] = useState(null);

  const handleImportEvalGrades = (evalItem) => {
    setImportingEvalId(evalItem.id);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !importingEvalId) return;

    const evalItem = evaluations.find(ev => ev.id === importingEvalId);
    if (!evalItem) {
      alert('Error: evaluación no encontrada.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('evaluation', JSON.stringify(evalItem));

      const response = await axios.post('/api/excel/import-evaluation-grades', formData);
      const { grades: parsedGrades, count } = response.data;

      if (count === 0) {
        alert('No se encontraron calificaciones en el archivo.');
        return;
      }

      const confirmed = window.confirm(`Se encontraron ${count} calificaciones. ¿Importarlas?`);
      if (!confirmed) return;

      const batchPayloads = [];
      parsedGrades.forEach(pg => {
        const student = visibleStudentsList.find(s => s.dni === pg.dni || s.name === pg.name);
        if (!student || pg.score === '' || pg.score === '-') return;
        batchPayloads.push({
          studentId: student.id,
          courseId: selectedCourseId,
          competenceId: selectedCompetenceId,
          evaluationId: importingEvalId,
          instrument: evalItem.type,
          score: pg.score,
          teacherId: currentUser?.id || 'tch_1',
          bimester: selectedBimester,
          unit: '0',
          details: pg.details
        });
      });

      // Un solo save al servidor para todo el lote
      const saved = saveReinforcementGradesBatch(batchPayloads);
      alert(`Importación completada: ${saved} calificaciones guardadas.`);
    } catch (error) {
      console.error('Failed to import reinforcement eval grades:', error);
      alert('Error al importar calificaciones.');
    } finally {
      setImportingEvalId(null);
      e.target.value = '';
    }
  };

  // Backup/Restore
  const backupFileInputRef = useRef(null);

  const handleFullBackup = async () => {
    try {
      const response = await axios.post('/api/excel/export-full-backup', {
        grades,
        evaluations,
        students: contextStudents,
        courses: contextCourses
      }, { responseType: 'json' });

      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `backup_sga_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      alert(`Backup completado: ${response.data.totalGrades} calificaciones respaldadas.`);
    } catch (error) {
      console.error('Failed to create backup:', error);
      alert('Error al generar el backup.');
    }
  };

  const handleBackupFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('existingGrades', JSON.stringify(grades));

      const response = await axios.post('/api/excel/import-full-backup', formData);
      const { missingCount, grades: missingGrades, totalInBackup, backupInfo } = response.data;

      if (missingCount === 0) {
        alert(`Backup verificado: todas las ${totalInBackup} calificaciones ya existen.`);
        return;
      }

      const proceed = window.confirm(
        `Backup del ${new Date(backupInfo.exportedAt).toLocaleDateString('es-PE')}\n` +
        `Faltantes: ${missingCount} de ${totalInBackup}\n\n¿Restaurar?`
      );
      if (!proceed) return;

      let saved = 0;
      missingGrades.forEach(pg => {
        const student = contextStudents.find(s => s.id === pg.studentId);
        if (!student) return;
        const evalObj = evaluations.find(e => e.id === pg.evaluationId);
        if (!evalObj) return;

        saveReinforcementGrade({
          studentId: pg.studentId,
          courseId: pg.courseId,
          competenceId: pg.competenceId,
          evaluationId: pg.evaluationId,
          instrument: pg.instrument || evalObj.type,
          score: pg.score,
          teacherId: currentUser?.id || 'tch_1',
          bimester: pg.bimester || '1',
          unit: pg.unit ?? '0',
          details: pg.details || null
        });
        saved++;
      });

      alert(`Restauración completada: ${saved} calificaciones agregadas.`);
    } catch (error) {
      console.error('Failed to restore backup:', error);
      alert('Error al restaurar backup.');
    } finally {
      e.target.value = '';
    }
  };

  // Control de Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvalName, setNewEvalName] = useState('');
  const [newEvalType, setNewEvalType] = useState('Examen'); // Rubrica, Lista de Cotejo, Guia de Observacion, Examen
  const [newEvalCapacityId, setNewEvalCapacityId] = useState('');

  const [editingEvalConfig, setEditingEvalConfig] = useState(null); // Evaluación de refuerzo a configurar
  const [gradingStudent, setGradingStudent] = useState(null); // Alumno a calificar
  const [gradingEval, setGradingEval] = useState(null); // Evaluación/columna de refuerzo a calificar

  // Copy evaluation modal states
  const [copyingEvaluation, setCopyingEvaluation] = useState(null);
  const [targetCourseId, setTargetCourseId] = useState('');
  const [targetCompetenceId, setTargetCompetenceId] = useState('');
  const [targetCapacityId, setTargetCapacityId] = useState('');
  const [targetBimester, setTargetBimester] = useState('1');
  const [targetUnit, setTargetUnit] = useState('0');
  const [targetGrade, setTargetGrade] = useState('');
  const [targetSection, setTargetSection] = useState('');
  const [copyGradesOption, setCopyGradesOption] = useState(false);

  // Estados temporales para el modal de calificar celdas
  const [tempExamScore, setTempExamScore] = useState('');
  const [tempExamSelections, setTempExamSelections] = useState({});
  const [tempRubricSelections, setTempRubricSelections] = useState({});
  const [tempChecklistSelections, setTempChecklistSelections] = useState({});
  const [tempChecklist3LvlSelections, setTempChecklist3LvlSelections] = useState({});
  const [tempObservationSelections, setTempObservationSelections] = useState({});
  const [tempObsComments, setTempObsComments] = useState('');

  // Filtrar cursos para el docente y grado seleccionado
  const visibleCourses = useMemo(() => {
    let list = courses;
    if (currentRole === 'teacher') {
      list = list.filter(c => (c.assignments || []).some(asg => asg.teacherId === currentUser?.id));
    }
    if (selectedGrade !== 'Todas') {
      if (currentRole === 'teacher') {
        list = list.filter(c => (c.assignments || []).some(asg => asg.teacherId === currentUser?.id && asg.gradeLevel === selectedGrade));
      } else {
        list = list.filter(c => (c.assignments || []).some(asg => asg.gradeLevel === selectedGrade));
      }
    }
    return list;
  }, [courses, currentRole, currentUser, selectedGrade]);

  // Sincronizar selectedCourseId si no está embebido
  useEffect(() => {
    if (!isEmbedded && visibleCourses.length > 0) {
      if (!visibleCourses.some(c => c.id === selectedCourseId)) {
        setLocalCourseId(visibleCourses[0].id);
      }
    }
  }, [visibleCourses, selectedCourseId, isEmbedded]);

  // Obtener detalles del curso activo
  const activeCourse = useMemo(() => {
    return courses.find(c => c.id === selectedCourseId);
  }, [courses, selectedCourseId]);

  // Autoseleccionar competencia si cambia el curso (conservando selección si es válida)
  useEffect(() => {
    if (activeCourse && activeCourse.competencies?.length > 0) {
      setSelectedCompetenceId(prev => {
        if (prev && activeCourse.competencies.some(c => c.id === prev)) {
          return prev;
        }
        return activeCourse.competencies[0].id;
      });
    } else {
      setSelectedCompetenceId('');
    }
  }, [selectedCourseId, activeCourse?.competencies]);

  // Obtener competencia activa
  const activeCompetence = useMemo(() => {
    if (!activeCourse || !selectedCompetenceId) return null;
    return (activeCourse.competencies || []).find(c => c.id === selectedCompetenceId);
  }, [activeCourse, selectedCompetenceId]);

  // Alumnos matriculados en la sección
  const enrolledStudents = useMemo(() => {
    if (!selectedGrade || !selectedSection) return [];
    return students.filter(s => 
      (s.gradeLevel || '').toLowerCase() === selectedGrade.toLowerCase() && 
      (selectedSection === 'Todas' || (s.section || '').toLowerCase() === selectedSection.toLowerCase())
    ).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
  }, [students, selectedGrade, selectedSection]);

  const bimestersOptions = useMemo(() => {
    return ['1', '2', '3', '4'].filter(b => activePeriods?.bimesters?.[String(b)] !== false);
  }, [activePeriods]);

  // Sync selectedBimester if it becomes disabled
  useEffect(() => {
    if (bimestersOptions.length > 0) {
      if (!bimestersOptions.includes(selectedBimester)) {
        setLocalBimester(bimestersOptions[0]);
      }
    }
  }, [bimestersOptions, selectedBimester]);

  // Target course configuration for Copy Modal in Reinforcement Grading
  const targetCourseObj = useMemo(() => {
    return courses.find(c => c.id === targetCourseId);
  }, [courses, targetCourseId]);

  const targetCompetencies = useMemo(() => {
    return targetCourseObj?.competencies || [];
  }, [targetCourseObj]);

  const targetCompetenceObj = useMemo(() => {
    return targetCompetencies.find(c => c.id === targetCompetenceId);
  }, [targetCompetencies, targetCompetenceId]);

  const targetCapacities = useMemo(() => {
    return targetCompetenceObj?.capacities || [];
  }, [targetCompetenceObj]);

  // Dynamic available grades for the selected target course
  const targetAvailableGrades = useMemo(() => {
    if (!targetCourseObj) return [];
    const asgs = targetCourseObj.assignments || [];
    const relevantAsgs = currentRole === 'teacher'
      ? asgs.filter(a => a.teacherId === currentUser?.id)
      : asgs;
    return Array.from(new Set(relevantAsgs.map(a => a.gradeLevel))).sort();
  }, [targetCourseObj, currentRole, currentUser]);

  // Dynamic available sections for the selected target course & grade
  const targetAvailableSections = useMemo(() => {
    if (!targetCourseObj || !targetGrade) return [];
    const asgs = targetCourseObj.assignments || [];
    const relevantAsgs = currentRole === 'teacher'
      ? asgs.filter(a => a.teacherId === currentUser?.id && a.gradeLevel === targetGrade)
      : asgs.filter(a => a.gradeLevel === targetGrade);
    
    const sectionsSet = new Set();
    relevantAsgs.forEach(asg => {
      (asg.sections || []).forEach(sec => sectionsSet.add(sec));
    });
    return Array.from(sectionsSet).sort();
  }, [targetCourseObj, targetGrade, currentRole, currentUser]);

  // Auto select competence, grade, section when targetCourseId changes in copy modal
  useEffect(() => {
    if (targetCourseObj) {
      const hasComp = targetCourseObj.competencies?.some(c => c.id === targetCompetenceId);
      if (!hasComp) {
        if (targetCourseObj.competencies?.length > 0) {
          setTargetCompetenceId(targetCourseObj.competencies[0].id);
        } else {
          setTargetCompetenceId('');
        }
      }
      
      const gradesAvail = targetAvailableGrades;
      const hasGrade = gradesAvail.includes(targetGrade);
      if (!hasGrade) {
        if (gradesAvail.length > 0) {
          setTargetGrade(gradesAvail[0]);
        } else {
          setTargetGrade('');
        }
      }
    }
  }, [targetCourseObj, targetAvailableGrades]);

  useEffect(() => {
    if (targetCompetenceObj) {
      const hasCap = targetCompetenceObj.capacities?.some(c => c.id === targetCapacityId);
      if (!hasCap) {
        if (targetCompetenceObj.capacities?.length > 0) {
          setTargetCapacityId(targetCompetenceObj.capacities[0].id);
        } else {
          setTargetCapacityId('');
        }
      }
    } else {
      setTargetCapacityId('');
    }
  }, [targetCompetenceObj]);

  useEffect(() => {
    const sectionsAvail = targetAvailableSections;
    const hasSection = sectionsAvail.includes(targetSection);
    if (!hasSection) {
      if (sectionsAvail.length > 0) {
        setTargetSection(sectionsAvail[0]);
      } else {
        setTargetSection('');
      }
    }
  }, [targetAvailableSections]);

  // Set default target selections when starting copy
  useEffect(() => {
    if (copyingEvaluation) {
      setTargetCourseId(selectedCourseId);
      setTargetCompetenceId(selectedCompetenceId);
      setTargetCapacityId(copyingEvaluation.capacityId || '');
      setTargetBimester(selectedBimester);
      setTargetUnit(copyingEvaluation.unit || '0');
      setTargetGrade(selectedGrade);
      setTargetSection(selectedSection);
      setCopyGradesOption(false);
    }
  }, [copyingEvaluation, selectedCourseId, selectedCompetenceId, selectedBimester, selectedGrade, selectedSection]);

  const sameClassSelected = useMemo(() => {
    return selectedGrade !== 'Todas' &&
           selectedSection !== 'Todas' &&
           targetGrade && selectedGrade &&
           targetSection && selectedSection &&
           (selectedGrade || '').trim().toLowerCase() === (targetGrade || '').trim().toLowerCase() &&
           (selectedSection || '').trim().toLowerCase() === (targetSection || '').trim().toLowerCase();
  }, [selectedGrade, targetGrade, selectedSection, targetSection]);

  const handleCopyEvaluationSubmit = (e) => {
    e.preventDefault();
    if (!copyingEvaluation) return;
    
    const success = copyEvaluation(
      copyingEvaluation.id,
      targetCourseId,
      targetCompetenceId,
      targetCapacityId,
      targetBimester,
      targetUnit,
      copyGradesOption,
      selectedGrade,
      selectedSection,
      targetGrade,
      targetSection
    );

    if (success) {
      alert(`Columna de refuerzo"${copyingEvaluation.name}" copiada exitosamente.`);
      setCopyingEvaluation(null);
      if (onNavigateToTarget) {
        onNavigateToTarget({
          courseId: targetCourseId,
          grade: targetGrade,
          section: targetSection,
          bimester: targetBimester,
          unit: targetUnit
        });
      } else if (!isEmbedded) {
        setLocalCourseId(targetCourseId);
        setSelectedCompetenceId(targetCompetenceId);
        setLocalBimester(targetBimester);
        if (targetGrade) setLocalGrade(targetGrade);
        if (targetSection) setLocalSection(targetSection);
      }
    } else {
      alert('Hubo un error al copiar la columna de refuerzo.');
    }
  };

  // Filtrar evaluaciones de refuerzo del periodo/competencia/curso seleccionados
  const activeReinforcementEvaluations = useMemo(() => {
    return evaluations.filter(e => 
      e.courseId === selectedCourseId &&
      e.competenceId === selectedCompetenceId &&
      (e.bimester || '1') === selectedBimester &&
      e.isReinforcement === true
    );
  }, [evaluations, selectedCourseId, selectedCompetenceId, selectedBimester]);

  // Conversor de letras CNEB a valores numéricos
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

  // Calcular promedio oficial regular de la competencia activa
  const getOfficialAverage = (studentId) => {
    if (!selectedCourseId || !selectedCompetenceId) return '-';
    
    const courseEvals = evaluations.filter(ev => 
      ev.courseId === selectedCourseId &&
      ev.competenceId === selectedCompetenceId &&
      (ev.bimester || '1') === selectedBimester &&
      !ev.isReinforcement
    );

    const stdScores = [];
    courseEvals.forEach(ev => {
      const scoreRecord = grades.find(g => g.studentId === studentId && g.evaluationId === ev.id);
      if (scoreRecord && scoreRecord.score !== undefined && scoreRecord.score !== '') {
        stdScores.push(scoreRecord.score);
      }
    });

    if (stdScores.length === 0) return '-';

    if (gradingScale === 'literal') {
      const totalVal = stdScores.reduce((sum, s) => sum + letterToValue(s), 0);
      return valueToLetter(totalVal / stdScores.length);
    } else {
      const avgNum = stdScores.reduce((sum, s) => sum + (parseFloat(s) || 0), 0) / stdScores.length;
      return avgNum;
    }
  };

  const isFailingGrade = (gradeVal) => {
    if (gradeVal === '-' || !gradeVal) return false;
    if (gradingScale === 'literal') {
      return gradeVal === 'C';
    }
    const num = parseFloat(gradeVal);
    return !isNaN(num) && num < (parseFloat(passingGrade) || 6.0);
  };

  // Configuración por defecto para instrumentos
  const createDefaultInstrumentConfig = (type) => {
    if (type === 'Rubrica') {
      return {
        criteriaList: [
          { 
            id: `crit_${Date.now()}_1`, 
            criteria: 'Comprensión y aplicación de conceptos de recuperación', 
            descriptors: { 
              AD: 'Demuestra dominio excepcional y propone aplicaciones prácticas originales.',
              A: 'Demuestra comprensión completa y responde con acierto y claridad.',
              B: 'Muestra dificultad en la aplicación, requiere asistencia frecuente.',
              C: 'No comprende los fundamentos del concepto evaluado.'
            } 
          },
          { 
            id: `crit_${Date.now()}_2`, 
            criteria: 'Cumplimiento de las actividades de refuerzo', 
            descriptors: { 
              AD: 'Desarrolla todas las actividades propuestas con máxima prolijidad.',
              A: 'Desarrolla las actividades propuestas de forma correcta.',
              B: 'Desarrolla parcialmente el material de recuperación.',
              C: 'No realiza ni presenta las actividades solicitadas.'
            } 
          }
        ]
      };
    } else if (type === 'Lista de Cotejo 3 Niveles') {
      return {
        criteriaList: [
          {
            id: `crit_3lvl_${Date.now()}_1`,
            name: 'Criterio General 1',
            points: 10,
            indicators: [
              { id: `ind_3lvl_${Date.now()}_11`, text: 'Subcriterio o indicador de refuerzo 1.1' },
              { id: `ind_3lvl_${Date.now()}_12`, text: 'Subcriterio o indicador de refuerzo 1.2' }
            ]
          },
          {
            id: `crit_3lvl_${Date.now()}_2`,
            name: 'Criterio General 2',
            points: 10,
            indicators: [
              { id: `ind_3lvl_${Date.now()}_21`, text: 'Subcriterio o indicador de refuerzo 2.1' },
              { id: `ind_3lvl_${Date.now()}_22`, text: 'Subcriterio o indicador de refuerzo 2.2' }
            ]
          }
        ]
      };
    } else if (type === 'Lista de Cotejo') {
      return {
        items: [
          { id: `item_${Date.now()}_1`, text: 'Asistió a las sesiones de asesoría pedagógica de refuerzo.' },
          { id: `item_${Date.now()}_2`, text: 'Entregó el portafolio de recuperación completo.' },
          { id: `item_${Date.now()}_3`, text: 'Superó la evaluación oral de sustentación.' }
        ]
      };
    } else if (type === 'Guia de Observacion') {
      return {
        criteriaList: [
          { 
            id: `obs_crit_${Date.now()}_1`, 
            name: 'Actitud frente al área', 
            indicators: [
              { id: `obs_ind_${Date.now()}_11`, text: 'Muestra interés y persistencia para superar sus dificultades.' },
              { id: `obs_ind_${Date.now()}_12`, text: 'Sigue las recomendaciones del docente de manera asertiva.' }
            ] 
          }
        ],
        levels: [
          { id: `lvl_${Date.now()}_1`, name: 'AD', label: 'Siempre' },
          { id: `lvl_${Date.now()}_2`, name: 'A', label: 'Frecuentemente' },
          { id: `lvl_${Date.now()}_3`, name: 'B', label: 'A veces' },
          { id: `lvl_${Date.now()}_4`, name: 'C', label: 'Nunca' }
        ]
      };
    } else if (type === 'Examen') {
      return {
        questions: [
          {
            id: `q_${Date.now()}_1`,
            type: 'choice',
            text: 'Pregunta 1: Comprensión literal de conceptos clave.',
            points: 20,
            options: [
              { id: `opt_1_1`, label: 'Opción A' },
              { id: `opt_1_2`, label: 'Opción B' },
              { id: `opt_1_3`, label: 'Opción C' }
            ],
            correctValue: 'opt_1_1'
          },
          {
            id: `q_${Date.now()}_2`,
            type: 'choice',
            text: 'Pregunta 2: Análisis inferencial del problema.',
            points: 20,
            options: [
              { id: `opt_2_1`, label: 'Opción A' },
              { id: `opt_2_2`, label: 'Opción B' },
              { id: `opt_2_3`, label: 'Opción C' }
            ],
            correctValue: 'opt_2_1'
          },
          {
            id: `q_${Date.now()}_3`,
            type: 'choice',
            text: 'Pregunta 3: Interpretación crítica del autor.',
            points: 20,
            options: [
              { id: `opt_3_1`, label: 'Opción A' },
              { id: `opt_3_2`, label: 'Opción B' },
              { id: `opt_3_3`, label: 'Opción C' }
            ],
            correctValue: 'opt_3_1'
          },
          {
            id: `q_${Date.now()}_4`,
            type: 'choice',
            text: 'Pregunta 4: Vocabulario y sentido contextual.',
            points: 20,
            options: [
              { id: `opt_4_1`, label: 'Opción A' },
              { id: `opt_4_2`, label: 'Opción B' },
              { id: `opt_4_3`, label: 'Opción C' }
            ],
            correctValue: 'opt_4_1'
          },
          {
            id: `q_${Date.now()}_5`,
            type: 'choice',
            text: 'Pregunta 5: Argumentación y opinión personal.',
            points: 20,
            options: [
              { id: `opt_5_1`, label: 'Opción A' },
              { id: `opt_5_2`, label: 'Opción B' },
              { id: `opt_5_3`, label: 'Opción C' }
            ],
            correctValue: 'opt_5_1'
          }
        ],
        maxScore: 100
      };
    }
    return {};
  };

  const handleCreateEvaluation = (e) => {
    e.preventDefault();
    if (!newEvalName.trim()) return alert('Ingrese un nombre para la actividad de refuerzo.');
    if (!selectedCourseId || !selectedCompetenceId) return alert('Seleccione curso y competencia primero.');

    const newEval = {
      courseId: selectedCourseId,
      competenceId: selectedCompetenceId,
      capacityId: newEvalCapacityId || null,
      bimester: selectedBimester,
      name: newEvalName.trim(),
      type: newEvalType,
      isReinforcement: true,
      instrumentConfig: createDefaultInstrumentConfig(newEvalType)
    };

    saveEvaluation(newEval);
    setNewEvalName('');
    setShowCreateModal(false);
  };

  const handleOpenConfigModal = (evalItem) => {
    const cloned = JSON.parse(JSON.stringify(evalItem));
    if (cloned.type === 'Examen' && (!cloned.instrumentConfig || !cloned.instrumentConfig.questions)) {
      cloned.instrumentConfig = createDefaultInstrumentConfig('Examen');
    }
    setEditingEvalConfig(cloned);
  };

  const handleAutoGenerateEvaluations = () => {
    if (!selectedCourseId || !selectedCompetenceId) return alert('Seleccione curso y competencia primero.');
    
    const eval1 = {
      courseId: selectedCourseId,
      competenceId: selectedCompetenceId,
      bimester: selectedBimester,
      name:"Examen de Recuperación 1",
      type:"Examen",
      isReinforcement: true,
      instrumentConfig: {}
    };

    const eval2 = {
      courseId: selectedCourseId,
      competenceId: selectedCompetenceId,
      bimester: selectedBimester,
      name:"Portafolio de Tareas de Refuerzo",
      type:"Lista de Cotejo",
      isReinforcement: true,
      instrumentConfig: createDefaultInstrumentConfig("Lista de Cotejo")
    };

    saveEvaluation(eval1);
    saveEvaluation(eval2);
    alert('Se han cargado las actividades demo de refuerzo académico con éxito.');
  };

  // Obtener nota de refuerzo por celda
  const getReinforcementCellScore = (studentId, evaluationId) => {
    const record = reinforcementGrades.find(g => 
      g.studentId === studentId && 
      g.evaluationId === evaluationId &&
      String(g.bimester || '1') === String(selectedBimester)
    );
    return record ? record.score : '-';
  };

  // Helper to calculate score of the clickable"El Dedo Mágico" exam
  const getExamScore = (selections) => {
    let score = 0;
    if (!selections) return 0;
    
    // Q1 matches (1 pt each)
    if (selections.q1) {
      if (selections.q1.narradora === 'magic_finger') score += 1;
      if (selections.q1.philip === '8_years') score += 1;
      if (selections.q1.william === '11_years') score += 1;
      if (selections.q1.gregg === 'hunt') score += 1;
    }
    
    // Q2 blanks (1 pt each)
    if (selections.q2) {
      if (selections.q2.a === 'rojo') score += 1;
      if (selections.q2.b === 'escopeta') score += 1;
      if (selections.q2.c === 'bosque') score += 1;
      if (selections.q2.d === 'cervatillo') score += 1;
    }
    
    // Q3 sequence (1 pt each)
    if (selections.q3) {
      if (selections.q3.evA === '4') score += 1;
      if (selections.q3.evB === '3') score += 1;
      if (selections.q3.evC === '1') score += 1;
      if (selections.q3.evD === '2') score += 1;
    }
    
    // Q4 classification (1 pt each)
    if (selections.q4) {
      if (selections.q4.cazar === 'no_le_gusta') score += 1;
      if (selections.q4.proteger === 'le_gusta') score += 1;
      if (selections.q4.burlarse === 'no_le_gusta') score += 1;
      if (selections.q4.convencer === 'le_gusta') score += 1;
    }
    
    // Q5 choice (4 pts)
    if (selections.q5 === 'enfado') {
      score += 4;
    }
    
    return score;
  };

  // Calcular promedio del refuerzo
  const calculateStudentReinforcementAverage = (studentId) => {
    if (activeReinforcementEvaluations.length === 0) return '-';
    
    const scores = activeReinforcementEvaluations.map(ev => {
      const scoreVal = getReinforcementCellScore(studentId, ev.id);
      return scoreVal !== '-' && scoreVal !== '' && scoreVal !== undefined ? scoreVal : null;
    }).filter(s => s !== null);

    if (scores.length === 0) return '-';
    const isLiteral = gradingScale === 'literal';

    if (isLiteral) {
      const points = scores.map(s => letterToValue(s));
      const avg = points.reduce((sum, val) => sum + val, 0) / points.length;
      return valueToLetter(avg);
    } else {
      const numericScores = scores.map(s => parseFloat(s)).filter(n => !isNaN(n));
      if (numericScores.length === 0) return '-';
      return (numericScores.reduce((sum, val) => sum + val, 0) / numericScores.length);
    }
  };

  // Abrir modal para calificar celda de refuerzo
  const handleOpenGradingCell = (student, evaluation) => {
    setGradingStudent(student);
    setGradingEval(evaluation);

    const match = reinforcementGrades.find(g => 
      g.studentId === student.id && 
      g.evaluationId === evaluation.id &&
      String(g.bimester || '1') === String(selectedBimester)
    );

    if (match && match.remarks) {
      setTempObsComments(match.remarks);
    } else {
      setTempObsComments('');
    }

    if (match && match.details) {
      if (evaluation.type === 'Examen') {
        setTempExamScore(match.score);
        setTempExamSelections(match.details.examSelections || {});
      } else if (evaluation.type === 'Rubrica') {
        setTempRubricSelections(match.details.rubricSelections || {});
      } else if (evaluation.type === 'Lista de Cotejo') {
        setTempChecklistSelections(match.details.checklistSelections || {});
      } else if (evaluation.type === 'Lista de Cotejo 3 Niveles') {
        setTempChecklist3LvlSelections(match.details.checklist3LvlSelections || {});
      } else if (evaluation.type === 'Guia de Observacion') {
        setTempObservationSelections(match.details.observationSelections || {});
        setTempObsComments(match.details.obsComments || '');
      }
    } else if (match && match.score !== undefined && match.score !== '') {
      if (evaluation.type === 'Examen') {
        setTempExamScore(match.score);
        setTempExamSelections({});
      } else {
        setTempExamScore(match.score);
      }
    } else {
      setTempExamScore(gradingScale === 'literal' ? 'A' : 0);
      setTempExamSelections({});
      setTempRubricSelections({});
      setTempChecklistSelections({});
      setTempChecklist3LvlSelections({});
      setTempObservationSelections({});
    }
  };

  // Cálculo en tiempo real de la nota resultante en el modal de calificación
  const liveCalculatedScore = useMemo(() => {
    const isLiteral = gradingScale === 'literal';
    if (!gradingEval) return"";

    if (gradingEval.type === 'Examen') {
      const questions = gradingEval.instrumentConfig?.questions || [];
      
      // Check if there are any selections in tempExamSelections
      const hasSelections = Object.values(tempExamSelections).some(v => {
        if (typeof v === 'object' && v !== null) {
          return Object.values(v).some(val => val !== undefined && val !== null && val !== '');
        }
        return v !== undefined && v !== null && v !== '';
      });
      if (!hasSelections) return"";

      let ratio = 0;
      if (questions.length > 0) {
        let obtainedPoints = 0;
        let totalMaxPoints = 0;
        questions.forEach(q => {
          const points = parseFloat(q.points) || 0;
          totalMaxPoints += points;
          if (q.hasSubQuestions && q.subQuestions && q.subQuestions.length > 0) {
            const subQs = q.subQuestions;
            const subQPts = points / subQs.length;
            const qSelections = tempExamSelections[q.id] || {};
            
            subQs.forEach(subQ => {
              const selectedVal = qSelections[subQ.id];
              if (subQ.type === 'choice') {
                if (selectedVal === subQ.correctValue) {
                  obtainedPoints += subQPts;
                }
              } else if (subQ.type === 'matching') {
                const subMatchQs = subQ.subQuestions || [];
                const matchQPts = subMatchQs.length > 0 ? (subQPts / subMatchQs.length) : 0;
                const matchSelections = selectedVal || {};
                subMatchQs.forEach(mQ => {
                  if (matchSelections[mQ.id] === mQ.correctValue) {
                    obtainedPoints += matchQPts;
                  }
                });
              } else { // direct
                if (selectedVal === true) {
                  obtainedPoints += subQPts;
                }
              }
            });
          } else {
            if (q.type === 'choice') {
              if (tempExamSelections[q.id] === q.correctValue) {
                obtainedPoints += points;
              }
            } else if (q.type === 'matching') {
              const subQs = q.subQuestions || [];
              const subQPts = subQs.length > 0 ? (points / subQs.length) : 0;
              const qSelections = tempExamSelections[q.id] || {};
              subQs.forEach(subQ => {
                if (qSelections[subQ.id] === subQ.correctValue) {
                  obtainedPoints += subQPts;
                }
              });
            } else { // direct
              if (tempExamSelections[q.id] === true) {
                obtainedPoints += points;
              }
            }
          }
        });
        ratio = totalMaxPoints > 0 ? (obtainedPoints / totalMaxPoints) : 0;
      } else {
        // Fallback legado"El Dedo Mágico"
        const score = getExamScore(tempExamSelections);
        ratio = score / 20;
      }

      if (isLiteral) {
        if (ratio >= 0.75) return 'A';
        if (ratio >= 0.40) return 'B';
        return 'C';
      } else {
        const scaleVal = gradingScale === '20' ? 20 : 10;
        return parseFloat((ratio * scaleVal));
      }
    }

    if (gradingEval.type === 'Rubrica') {
      const criteriaList = gradingEval.instrumentConfig?.criteriaList || [];
      if (criteriaList.length === 0) return"";

      let totalPoints = 0;
      let selectionCount = 0;

      criteriaList.forEach(crit => {
        const sel = tempRubricSelections[crit.id];
        if (sel) {
          selectionCount++;
          totalPoints += letterToValue(sel);
        }
      });

      if (selectionCount === 0) return"";
      const avg = totalPoints / selectionCount;

      if (isLiteral) {
        return valueToLetter(avg);
      } else {
        const scaleVal = gradingScale === '20' ? 20 : 10;
        return parseFloat(((avg / 4) * scaleVal));
      }
    }

    if (gradingEval.type === 'Lista de Cotejo 3 Niveles') {
      const criteriaList = gradingEval.instrumentConfig?.criteriaList || [];
      if (criteriaList.length === 0) return"";

      const hasSelections = Object.keys(tempChecklist3LvlSelections).length > 0;
      if (!hasSelections) return"";

      let totalMaxPoints = 0;
      let totalObtainedPoints = 0;

      criteriaList.forEach(crit => {
        const points = parseFloat(crit.points) || 0;
        totalMaxPoints += points;
        const indicators = crit.indicators || [];
        if (indicators.length > 0) {
          const indicatorWeight = points / indicators.length;
          indicators.forEach(ind => {
            const selectedVal = tempChecklist3LvlSelections[ind.id];
            if (selectedVal === 'A') {
              totalObtainedPoints += indicatorWeight;
            } else if (selectedVal === 'B') {
              totalObtainedPoints += indicatorWeight * (2 / 3);
            } else if (selectedVal === 'C') {
              totalObtainedPoints += indicatorWeight * (1 / 3);
            }
          });
        }
      });

      if (totalMaxPoints === 0) return 0;
      const ratio = totalObtainedPoints / totalMaxPoints;
      const avg = ratio * 3;

      if (isLiteral) {
        if (avg >= 2.5) return 'A';
        if (avg >= 1.5) return 'B';
        return 'C';
      } else {
        const scaleVal = gradingScale === '20' ? 20 : 10;
        return parseFloat((ratio * scaleVal).toFixed(2));
      }
    }

    if (gradingEval.type === 'Lista de Cotejo') {
      const items = gradingEval.instrumentConfig?.items || [];
      if (items.length === 0) return"";

      const hasSelections = Object.values(tempChecklistSelections).some(v => v === true);
      if (!hasSelections) return"";

      let yesCount = 0;
      items.forEach(it => {
        if (tempChecklistSelections[it.id]) {
          yesCount++;
        }
      });

      const ratio = yesCount / items.length;

      if (isLiteral) {
        if (ratio >= 0.75) return 'A';
        if (ratio >= 0.40) return 'B';
        return 'C';
      } else {
        const scaleVal = gradingScale === '20' ? 20 : 10;
        return parseFloat((ratio * scaleVal));
      }
    }

    if (gradingEval.type === 'Guia de Observacion') {
      const criteriaList = gradingEval.instrumentConfig?.criteriaList || [];
      const totalIndicators = criteriaList.reduce((acc, c) => acc + (c.indicators?.length || 0), 0);
      if (totalIndicators === 0) return"";

      let points = 0;
      let ratedCount = 0;

      criteriaList.forEach(crit => {
        crit.indicators?.forEach(ind => {
          const lvlId = tempObservationSelections[ind.id];
          if (lvlId) {
            const lvlObj = gradingEval.instrumentConfig?.levels?.find(l => l.id === lvlId);
            if (lvlObj) {
              ratedCount++;
              points += letterToValue(lvlObj.name);
            }
          }
        });
      });

      if (ratedCount === 0) return"";
      const avg = points / ratedCount;

      if (isLiteral) {
        return valueToLetter(avg);
      } else {
        const scaleVal = gradingScale === '20' ? 20 : 10;
        return parseFloat(((avg / 4) * scaleVal));
      }
    }

    return"";
  }, [gradingEval, tempExamScore, tempExamSelections, tempRubricSelections, tempChecklistSelections, tempChecklist3LvlSelections, tempObservationSelections, gradingScale]);

  // Guardar calificación de celda de refuerzo en el contexto
  const handleSaveStudentGrade = () => {
    if (!gradingStudent || !gradingEval) return;

    if (liveCalculatedScore ==="") {
      alert("Por favor, registre el calificativo antes de guardar.");
      return;
    }

    saveReinforcementGrade({
      studentId: gradingStudent.id,
      courseId: selectedCourseId,
      competenceId: selectedCompetenceId,
      evaluationId: gradingEval.id,
      bimester: selectedBimester,
      score: liveCalculatedScore,
      details: {
        examSelections: tempExamSelections,
        rubricSelections: tempRubricSelections,
        checklistSelections: tempChecklistSelections,
        checklist3LvlSelections: tempChecklist3LvlSelections,
        observationSelections: tempObservationSelections,
        obsComments: tempObsComments
      },
      teacherId: currentRole === 'teacher' ? currentUser?.id : 'admin_1',
      topic: gradingEval.name,
      remarks: tempObsComments
    });

    setGradingStudent(null);
    setGradingEval(null);
  };

  const handleSaveCurrentStudentGradeSilent = () => {
    if (!gradingStudent || !gradingEval) return;
    if (liveCalculatedScore ==="") return; // Do not auto-save unfilled grade records

    saveReinforcementGrade({
      studentId: gradingStudent.id,
      courseId: selectedCourseId,
      competenceId: selectedCompetenceId,
      evaluationId: gradingEval.id,
      bimester: selectedBimester,
      score: liveCalculatedScore,
      details: {
        examSelections: tempExamSelections,
        rubricSelections: tempRubricSelections,
        checklistSelections: tempChecklistSelections,
        checklist3LvlSelections: tempChecklist3LvlSelections,
        observationSelections: tempObservationSelections,
        obsComments: tempObsComments
      },
      teacherId: currentRole === 'teacher' ? currentUser?.id : 'admin_1',
      topic: gradingEval.name,
      remarks: tempObsComments
    });
  };

  const handleNavToPreviousStudent = () => {
    if (students.length === 0) return;
    handleSaveCurrentStudentGradeSilent();

    const currentIndex = students.findIndex(s => s.id === gradingStudent.id);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = students.length - 1;
    }
    const prevStudent = students[prevIndex];
    handleOpenGradingCell(prevStudent, gradingEval);
  };

  const handleNavToNextStudent = () => {
    if (students.length === 0) return;
    handleSaveCurrentStudentGradeSilent();

    const currentIndex = students.findIndex(s => s.id === gradingStudent.id);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= students.length) {
      nextIndex = 0;
    }
    const nextStudent = students[nextIndex];
    handleOpenGradingCell(nextStudent, gradingEval);
  };

  const getCompetenceAverage = (studentId, competenceId) => {
    const compEvals = evaluations.filter(e =>
      e.courseId === selectedCourseId &&
      e.competenceId === competenceId &&
      (e.bimester || '1') === selectedBimester &&
      !e.isReinforcement
    );
    const regScores = compEvals.map(ev => {
      const g = grades.find(r => r.studentId === studentId && r.evaluationId === ev.id);
      return g ? g.score : null;
    }).filter(s => s !== null && s !== '');

    if (regScores.length === 0) return '-';
    const isLit = gradingScale === 'literal';
    if (isLit) {
      const pts = regScores.map(s => s === 'AD' ? 4 : s === 'A' ? 3 : s === 'B' ? 2 : s === 'C' ? 1 : null).filter(n => n !== null);
      if (pts.length === 0) return '-';
      const a = pts.reduce((s,v) => s+v, 0) / pts.length;
      return a >= 3.5 ? 'AD' : a >= 2.5 ? 'A' : a >= 1.5 ? 'B' : 'C';
    }
    const nums = regScores.map(s => parseFloat(s)).filter(n => !isNaN(n));
    if (nums.length === 0) return '-';
    const val = nums.reduce((s,v) => s+v, 0) / nums.length;
    return val;
  };

  const getCompetenceReinforcementAverage = (studentId, competenceId) => {
    const reinfEvals = evaluations.filter(e =>
      e.courseId === selectedCourseId &&
      e.competenceId === competenceId &&
      (e.bimester || '1') === selectedBimester &&
      e.isReinforcement === true
    );
    const reinfScores = reinfEvals.map(ev => {
      const rg = reinforcementGrades?.find(r => r.studentId === studentId && r.evaluationId === ev.id);
      return rg ? rg.score : null;
    }).filter(s => s !== null && s !== '');

    if (reinfScores.length === 0) return '-';
    const isLit = gradingScale === 'literal';
    if (isLit) {
      const pts = reinfScores.map(s => s === 'AD' ? 4 : s === 'A' ? 3 : s === 'B' ? 2 : s === 'C' ? 1 : null).filter(n => n !== null);
      if (pts.length === 0) return '-';
      const a = pts.reduce((s,v) => s+v, 0) / pts.length;
      return a >= 3.5 ? 'AD' : a >= 2.5 ? 'A' : a >= 1.5 ? 'B' : 'C';
    }
    const nums = reinfScores.map(s => parseFloat(s)).filter(n => !isNaN(n));
    if (nums.length === 0) return '-';
    const val = nums.reduce((s,v) => s+v, 0) / nums.length;
    return val;
  };

  const getFinalCompetenceGrade = (regAvg, reinfAvg) => {
    if (regAvg === '-') return reinfAvg;
    if (reinfAvg === '-') return regAvg;
    if (gradingScale === 'literal') {
      const v = (s) => s === 'AD' ? 4 : s === 'A' ? 3 : s === 'B' ? 2 : s === 'C' ? 1 : 0;
      return v(reinfAvg) > v(regAvg) ? reinfAvg : regAvg;
    }
    const rAvgNum = parseFloat(reinfAvg);
    const rgAvgNum = parseFloat(regAvg);
    return rAvgNum > rgAvgNum ? rAvgNum : rgAvgNum;
  };

  // Guardar configuración del instrumento de refuerzo
  const handleSaveEvalConfig = () => {
    if (!editingEvalConfig) return;
    saveEvaluation(editingEvalConfig);
    setEditingEvalConfig(null);
  };

  // Filtrar lista de alumnos
  const visibleStudentsList = useMemo(() => {
    return enrolledStudents.filter(s => {
      const officialAvg = getOfficialAverage(s.id);
      const isAtRisk = isFailingGrade(officialAvg);
      
      const matchFilter = !filterOnlyAtRisk || isAtRisk;
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.dni.includes(searchQuery);
      
      return matchFilter && matchSearch;
    });
  }, [enrolledStudents, filterOnlyAtRisk, searchQuery, selectedCourseId, selectedCompetenceId, selectedBimester, evaluations, grades]);

  // KPI Analytics
  const analytics = useMemo(() => {
    let totalAssigned = 0;
    let totalReinforced = 0;
    let totalPassed = 0;

    enrolledStudents.forEach(s => {
      const officialAvg = getOfficialAverage(s.id);
      if (isFailingGrade(officialAvg)) {
        totalAssigned++;
      }

      const reinAvg = calculateStudentReinforcementAverage(s.id);
      if (reinAvg !== '-') {
        totalReinforced++;
        if (!isFailingGrade(reinAvg)) {
          totalPassed++;
        }
      }
    });

    const recoveryRate = totalReinforced > 0 ? Math.round((totalPassed / totalReinforced) * 100) : 0;

    return {
      totalAssigned,
      totalReinforced,
      totalPassed,
      recoveryRate
    };
  }, [enrolledStudents, reinforcementGrades, selectedCourseId, selectedCompetenceId, selectedBimester, evaluations, grades, gradingScale, passingGrade]);

  return (
    <div className="space-y-6">
      
      {/* Cabecera de Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Registro de Refuerzo Académico</h2>
          <p className="text-slate-400  mt-1">
            Control de recuperación formativa. Califica a los estudiantes mediante múltiples columnas de recuperación y promedia sus calificaciones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleFullBackup}
            className="border border-[#3b82f6] hover:bg-blue-500/10 dark:hover:bg-blue-950/20 text-[#3b82f6] bg-transparent  rounded-2xl px-5 py-3 flex items-center gap-2 text-xs font-black transition-all active:scale-95"
            title="Respalda TODAS las calificaciones con detalles en un archivo JSON"
          >
            <Download className="h-4.5 w-4.5" />
            Backup Completo
          </button>
          <button
            onClick={() => backupFileInputRef.current?.click()}
            className="border border-[#8b5cf6] hover:bg-violet-500/10 dark:hover:bg-violet-950/20 text-[#8b5cf6] bg-transparent  rounded-2xl px-5 py-3 flex items-center gap-2 text-xs font-black transition-all active:scale-95"
            title="Restaura solo calificaciones faltantes desde un backup"
          >
            <Upload className="h-4.5 w-4.5" />
            Restaurar Backup
          </button>
          <input
            ref={backupFileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleBackupFileSelected}
          />
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {/* Fila de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card-ecc border border-white/10 p-6 flex items-center justify-between border border-white/10/50">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Requieren Refuerzo</span>
            <h3 className={`text-3xl font-black ${analytics.totalAssigned > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
              {analytics.totalAssigned}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Alumnos con nota regular desaprobada (C)</p>
          </div>
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
            analytics.totalAssigned > 0 ? 'bg-rose-500/100/10 text-rose-500' : 'bg-white/10  text-slate-400'
          }`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-card-ecc border border-white/10 p-6 flex items-center justify-between border border-white/10/50">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Evaluados en Refuerzo</span>
            <h3 className="text-3xl font-black text-kinetic-cyan dark:text-cyan-300">
              {analytics.totalReinforced}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Alumnos con notas registradas</p>
          </div>
          <div className="h-12 w-12 bg-white/5 text-kinetic-cyan dark:text-cyan-300 rounded-2xl flex items-center justify-center shrink-0">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-card-ecc border border-white/10 p-6 flex items-center justify-between border border-white/10/50">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Alumnos Recuperados</span>
            <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-450">
              {analytics.totalPassed}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Lograron superar la nota mínima</p>
          </div>
          <div className="h-12 w-12 bg-emerald-500/100/10 text-emerald-600 dark:text-emerald-450 rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-card-ecc border border-white/10 p-6 flex items-center justify-between border border-white/10/50">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tasa de Recuperación</span>
            <h3 className="text-3xl font-black text-violet-600 dark:text-violet-400">
              {analytics.recoveryRate}%
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Éxito en el proceso de recuperación</p>
          </div>
          <div className="h-12 w-12 bg-violet-500/100/10 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Panel de Filtros y Selectores */}
      <div className="glass-card-ecc border border-white/10 p-6 space-y-4">
        {!isEmbedded && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-white/10 pb-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Grado de Estudios</label>
              <select
                value={selectedGrade}
                onChange={(e) => setLocalGrade(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-semibold"
              >
                {['1ro Secundaria', '2do Secundaria', '3ro Secundaria', '4to Secundaria', '5to Secundaria'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Sección</label>
              <select
                value={selectedSection}
                onChange={(e) => setLocalSection(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-semibold"
              >
                {['A', 'B', 'C', 'D', 'E'].map(s => (
                  <option key={s} value={s}>Sección {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Curso / Materia</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setLocalCourseId(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-semibold"
              >
                {visibleCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Bimestre</label>
              <select
                value={selectedBimester}
                onChange={(e) => setLocalBimester(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-semibold"
              >
                {bimestersOptions.map(b => (
                  <option key={b} value={b}>Bimestre {b}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 gap-4">
            <div className="w-full md:w-96">
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Competencia Curricular a Reforzar</label>
              <select 
                value={selectedCompetenceId} 
                onChange={(e) => setSelectedCompetenceId(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-transparent px-3.5 py-2.5 text-xs font-bold text-kinetic-cyan dark:text-cyan-300"
              >
                {activeCourse?.competencies?.map(comp => (
                  <option key={comp.id} value={comp.id}>{comp.name}</option>
                ))}
                {!activeCourse?.competencies?.length && <option value="">Sin competencias configuradas</option>}
              </select>
            </div>

            <div className="relative flex-1 mt-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar estudiante..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-white/10 bg-transparent text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 mt-auto">
            <button
              onClick={() => setFilterOnlyAtRisk(!filterOnlyAtRisk)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                filterOnlyAtRisk
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30'
                  : 'bg-transparent border-white/10 text-slate-300    hover:bg-white/5'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              {filterOnlyAtRisk ? 'Mostrar Todos' : 'Filtro: Requieren Apoyo'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs de Navegación */}
      <div className="flex border-b border-white/10  gap-1">
        <button
          onClick={() => setViewMode('auxiliar')}
          className={`px-5 py-3 text-xs font-bold border-b-2 uppercase tracking-wider transition-all ${
            viewMode === 'auxiliar'
              ? 'border-violet-500 text-violet-600 dark:text-violet-400 font-extrabold'
              : 'border-transparent text-slate-400  hover:text-slate-650'
          }`}
        >
          Registro Auxiliar
        </button>
        <button
          onClick={() => setViewMode('consolidado')}
          className={`px-5 py-3 text-xs font-bold border-b-2 uppercase tracking-wider transition-all ${
            viewMode === 'consolidado'
              ? 'border-violet-500 text-violet-600 dark:text-violet-400 font-extrabold'
              : 'border-transparent text-slate-400  hover:text-slate-650'
          }`}
        >
          Consolidado de Competencias
        </button>
      </div>

      {/* Cuadrícula de Refuerzo */}
      <div className="glass-card-ecc border border-white/10 p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-kinetic-cyan" />
            <h4 className="text-lg font-bold">Cuadrícula de Refuerzo Académico</h4>
          </div>
          
          <div className="flex gap-2">
            {activeReinforcementEvaluations.length === 0 && selectedCourseId && selectedCompetenceId && (
              <button 
                onClick={handleAutoGenerateEvaluations}
                className="btn-neuro-success flex items-center gap-1.5 text-xs py-2 px-3 hover:scale-105 active:scale-95 transition-transform"
              >
                <Sparkles className="h-4 w-4" />
                Cargar Demo
              </button>
            )}
            {selectedCourseId && selectedCompetenceId && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn-neuro-primary flex items-center gap-1.5 text-xs py-2 px-3 hover:scale-105 active:scale-95 transition-transform"
              >
                <Plus className="h-4 w-4" />
                Nueva Actividad de Refuerzo
              </button>
            )}
          </div>
        </div>

        {viewMode === 'consolidado' ? (
          /* Consolidado view - Nota Regular / Refuerzo / Final por competencia */
          (() => {
            const competencies = activeCourse?.competencies || [];
            if (competencies.length === 0 || !selectedCompetenceId) {
              return <div className="text-center py-12 text-slate-400 italic text-sm">Seleccione un curso y competencia para ver el consolidado.</div>;
            }
            // For reinforcement, show the specific competence being worked on
            return (
              <div className="overflow-x-auto rounded-2xl border border-white/10  overflow-hidden">
                <table className="w-full border-collapse text-left text-sm text-slate-400">
                  <thead className="bg-white/10 text-xs font-bold uppercase text-slate-200">
                    <tr>
                      <th className="p-2 w-10 text-center">
                        <div className="bg-transparent  rounded-lg px-2 py-2 border border-white/10">
                          N°
                        </div>
                      </th>
                      <th className="p-2 min-w-[120px] max-w-[150px]">
                        <div className="bg-transparent  rounded-lg px-3 py-2 border border-white/10">
                          Estudiante
                        </div>
                      </th>
                      <th className="p-2 w-20 text-center">
                        <div className="bg-transparent  rounded-lg px-2 py-2 border border-white/10">
                          DNI
                        </div>
                      </th>
                      {competencies.map((comp, ci) => (
                        <th key={comp.id} className="p-2 text-center w-10 min-w-[70px]" title={comp.name}>
                          <div className="bg-transparent  rounded-lg px-2 py-2 border border-white/10   text-center">
                            <span className="font-extrabold text-white dark:text-white block truncate max-w-[120px]">
                              C{ci+1}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {visibleStudentsList.map((std, idx) => {
                      return (
                        <tr key={std.id} className="hover:bg-white/5/50 transition">
                          <td className="px-3 py-3 font-bold text-slate-400 border border-white/10  text-center">{idx+1}</td>
                          <td className="px-3 py-3 font-semibold text-white border border-white/10">
                            <div className="flex items-center gap-2.5">
                              <img src={std.avatar} alt={std.name} className="h-7 w-7 rounded-full object-cover border border-white/10" />
                              <p className="font-bold text-xs">{std.name}</p>
                            </div>
                          </td>
                          <td className="px-3 py-3 font-mono text-xs font-semibold border border-white/10  text-center">{std.dni}</td>
                          {competencies.map(comp => {
                            const compEvals = evaluations.filter(e =>
                              e.courseId === selectedCourseId &&
                              e.competenceId === comp.id &&
                              (e.bimester || '1') === selectedBimester &&
                              !e.isReinforcement
                            );
                            const regScores = compEvals.map(ev => {
                              const g = grades.find(r => r.studentId === std.id && r.evaluationId === ev.id);
                              return g ? g.score : null;
                            }).filter(s => s !== null && s !== '');

                            const reinfEvals = evaluations.filter(e =>
                              e.courseId === selectedCourseId &&
                              e.competenceId === comp.id &&
                              (e.bimester || '1') === selectedBimester &&
                              e.isReinforcement === true
                            );
                            const reinfScores = reinfEvals.map(ev => {
                              const rg = reinforcementGrades?.find(r => r.studentId === std.id && r.evaluationId === ev.id);
                              return rg ? rg.score : null;
                            }).filter(s => s !== null && s !== '');

                            const calcAvg = (scores) => {
                              if (scores.length === 0) return '-';
                              const isLit = gradingScale === 'literal';
                              if (isLit) {
                                const pts = scores.map(s => s === 'AD' ? 4 : s === 'A' ? 3 : s === 'B' ? 2 : s === 'C' ? 1 : null).filter(n => n !== null);
                                if (pts.length === 0) return '-';
                                const a = pts.reduce((s,v) => s+v, 0) / pts.length;
                                return a >= 3.5 ? 'AD' : a >= 2.5 ? 'A' : a >= 1.5 ? 'B' : 'C';
                              }
                              const nums = scores.map(s => parseFloat(s)).filter(n => !isNaN(n));
                              if (nums.length === 0) return '-';
                              return (nums.reduce((s,v) => s+v, 0) / nums.length);
                            };

                            const regAvg = calcAvg(regScores);
                            const reinfAvg = calcAvg(reinfScores);
                            const finalGrade = (() => {
                              if (regAvg === '-') return reinfAvg;
                              if (reinfAvg === '-') return regAvg;
                              if (gradingScale === 'literal') {
                                const v = (s) => s === 'AD' ? 4 : s === 'A' ? 3 : s === 'B' ? 2 : s === 'C' ? 1 : 0;
                                return v(reinfAvg) > v(regAvg) ? reinfAvg : regAvg;
                              }
                              return parseFloat(reinfAvg) > parseFloat(regAvg) ? reinfAvg : regAvg;
                            })();

                            const gradeClass = (g, highlight) => {
                              if (g === '-') return 'text-slate-400 font-black text-sm';
                              if (g === 'AD') return highlight ? 'bg-emerald-500/10 text-emerald-700 font-black px-3 py-1 rounded-lg text-sm' : 'text-emerald-600 font-black text-sm';
                              if (g === 'A') return highlight ? 'bg-white/5 text-cyan-400 font-black px-3 py-1 rounded-lg text-sm' : 'text-kinetic-cyan font-black text-sm';
                              if (g === 'B') return highlight ? 'bg-amber-500/10 text-amber-700 font-black px-3 py-1 rounded-lg text-sm' : 'text-amber-555 font-black text-sm';
                              if (g === 'C') return highlight ? 'bg-rose-500/10 text-rose-700 font-black px-3 py-1 rounded-lg text-sm' : 'text-rose-550 font-black text-sm';
                              const n = parseFloat(g);
                              const pass = gradingScale === '20' ? n >= 11.0 : n >= 6.0;
                              if (pass) return highlight ? 'bg-emerald-500/10 text-emerald-700 font-black px-3 py-1 rounded-lg text-sm' : 'text-emerald-500 font-black text-sm';
                              return highlight ? 'bg-rose-500/10 text-rose-700 font-black px-3 py-1 rounded-lg text-sm' : 'text-rose-550 font-black text-sm';
                            };

                            return (
                              <td key={comp.id} className="px-2 py-2.5 text-center border border-white/10  bg-emerald-50/5">
                                <span className={gradeClass(finalGrade, true)}>{finalGrade}</span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()
        ) : visibleStudentsList.length === 0 ? (
          <div className="text-center py-12 text-slate-400 italic text-sm">
            No hay estudiantes de esta sección que requieran refuerzo en la competencia seleccionada.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full border-collapse text-left text-sm text-slate-400">
              <thead className="bg-white/10 text-xs font-bold uppercase text-slate-200">
                <tr>
                  <th className="px-4 py-3 w-12 border border-white/10">N°</th>
                  <th className="px-4 py-3 min-w-[150px] border border-white/10">Estudiante</th>

                  
                  {/* Columnas dinámicas de actividades de refuerzo */}
                  {activeReinforcementEvaluations.map(evalItem => (
                    <th key={evalItem.id} className="px-3 py-2 border border-white/10  text-center min-w-[110px]">
                      <div className="flex flex-col items-center justify-between h-full gap-2 py-1">
                        <span className="font-bold text-white dark:text-white" title={evalItem.name}>
                          {evalItem.name}
                        </span>
                        <span className="text-[9px] bg-violet-500/10 dark:bg-violet-950/40 px-1.5 py-0.5 rounded font-mono text-violet-600 dark:text-violet-300 font-bold uppercase">
                          {evalItem.type}
                        </span>
                        <div className="flex gap-1.5 pt-1">
                          <button 
                            onClick={() => handleOpenConfigModal(evalItem)}
                            title="Configurar Instrumento"
                            className="p-1 hover:bg-white/20  rounded text-slate-400 hover:text-kinetic-cyan transition"
                          >
                            <Settings className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => setCopyingEvaluation(evalItem)}
                            title="Copiar Instrumento"
                            className="p-1 hover:bg-white/20  rounded text-slate-400 hover:text-kinetic-cyan transition"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => {
                              if(window.confirm(`¿Deseas eliminar la columna de refuerzo"${evalItem.name}"?`)) {
                                deleteEvaluation(evalItem.id);
                              }
                            }}
                            title="Eliminar Actividad"
                            className="p-1 hover:bg-white/20  rounded text-slate-400 hover:text-rose-500 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                          <div className="flex gap-1 pt-0.5">
                            <button
                              onClick={() => handleExportEvalGrades(evalItem)}
                              title="Exportar a Excel"
                              className="p-0.5 hover:bg-white/20  rounded text-slate-400 hover:text-emerald-500 transition"
                            >
                              <Download className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleImportEvalGrades(evalItem)}
                              title="Importar desde Excel"
                              className="p-0.5 hover:bg-white/20  rounded text-slate-400 hover:text-amber-500 transition"
                            >
                              <Upload className="h-3 w-3" />
                            </button>
                          </div>
                      </div>
                    </th>
                  ))}

                  {activeReinforcementEvaluations.length === 0 && (
                    <th className="px-6 py-3 border border-white/10  text-slate-400 font-semibold text-center italic">
                      Sin actividades de refuerzo
                    </th>
                  )}

                  <th className="px-4 py-3 text-center w-20 border border-white/10  bg-violet-50/30 dark:bg-violet-950/10">
                    Promedio Refuerzo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {visibleStudentsList.map((std, idx) => {
                  const reinAvg = calculateStudentReinforcementAverage(std.id);

                  return (
                    <tr key={std.id} className="hover:bg-white/5/50  transition">
                      <td className="px-4 py-3 font-bold text-slate-400 border border-white/10">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-white  border border-white/10">
                        <div className="flex items-center gap-2.5">
                          <img src={std.avatar} alt={std.name} className="h-7 w-7 rounded-full object-cover border border-white/10" />
                          <p className="font-bold text-xs">{std.name}</p>
                        </div>
                      </td>
                      {/* Celdas de evaluaciones de refuerzo */}
                      {activeReinforcementEvaluations.map(evalItem => {
                        const score = getReinforcementCellScore(std.id, evalItem.id);
                        return (
                          <td
                            key={evalItem.id}
                            onClick={() => handleOpenGradingCell(std, evalItem)}
                            className="px-2 py-2.5 text-center border border-white/10  transition-colors cursor-pointer hover:bg-white/5/25 dark:hover:bg-indigo-950/10"
                          >
                            <span className={
                              (score === 'AD' ? 'text-emerald-600 dark:text-emerald-400' :
                               score === 'A' ? 'text-cyan-400' :
                               score === 'B' ? 'text-amber-500' :
                               score === 'C' ? 'text-rose-500' :
                               typeof score === 'number' && score >= (gradingScale === '20' ? 11.0 : 6.0) ? 'text-kinetic-cyan' :
                               typeof score === 'number' && score < (gradingScale === '20' ? 11.0 : 6.0) ? 'text-rose-500' : 'text-slate-400') +" font-black text-base"
                            }>
                              {score}
                            </span>
                          </td>
                        );
                      })}

                      {activeReinforcementEvaluations.length === 0 && (
                        <td className="px-4 py-3 border border-white/10  text-center text-slate-350  italic text-xs">
                          Cree una columna
                        </td>
                      )}

                      {/* Promedio resultante de refuerzo */}
                      <td className="px-3 py-2.5 text-center border border-white/10  bg-violet-50/20 dark:bg-violet-950/5">
                        <span className={`px-3.5 py-1.5 rounded-lg text-sm font-black ${
                          reinAvg === 'AD' ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                          reinAvg === 'A' ? 'bg-white/5 text-cyan-400 bg-white/5 dark:text-cyan-200' :
                          reinAvg === 'B' ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-950/40' :
                          reinAvg === 'C' ? 'bg-rose-500/10 text-rose-700 dark:bg-rose-950/40' :
                          typeof reinAvg === 'number' && reinAvg >= (gradingScale === '20' ? 11.0 : 6.0) ? 'bg-white/5 text-cyan-400 bg-white/5' :
                          typeof reinAvg === 'number' && reinAvg < (gradingScale === '20' ? 11.0 : 6.0) ? 'bg-rose-500/10 text-rose-700 dark:bg-rose-950/40' :
                          'bg-white/5 text-slate-400'
                        }`}>
                          {reinAvg}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Crear Actividad de Refuerzo */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card-ecc border border-white/10 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-white/10  pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-kinetic-cyan" />
                Nueva Actividad de Refuerzo
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvaluation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Nombre del Refuerzo</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: Ficha de Lectura, Sustentación 1..."
                  value={newEvalName} 
                  onChange={(e) => setNewEvalName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2 text-sm focus:border-kinetic-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Instrumento de Evaluación</label>
                <select 
                  value={newEvalType} 
                  onChange={(e) => setNewEvalType(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm font-semibold"
                >
                  <option value="Examen">Examen / Nota Directa</option>
                  <option value="Rubrica">Rúbrica de Criterios</option>
                  <option value="Lista de Cotejo">Lista de Cotejo</option>
                  <option value="Lista de Cotejo 3 Niveles">Lista de Cotejo (3 Niveles)</option>
                  <option value="Guia de Observacion">Guía de Observación</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="btn-neuro-secondary text-xs px-4 py-2"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-neuro-primary text-xs px-4 py-2"
                >
                  Crear Columna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Configurar Instrumento de Refuerzo */}
      {editingEvalConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-card-ecc border border-white/10 max-w-2xl w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-white/10  pb-3">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Settings className="h-5 w-5 text-kinetic-cyan" />
                  Editar Instrumento: {editingEvalConfig.name}
                </h3>
              </div>
              <button onClick={() => setEditingEvalConfig(null)} className="text-slate-400 hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {editingEvalConfig.type === 'Rubrica' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-400">Criterios</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newCrit = {
                          id: `crit_${Date.now()}`,
                          criteria: 'Nuevo Criterio de Refuerzo',
                          descriptors: { AD: '', A: '', B: '', C: '' }
                        };
                        const config = editingEvalConfig.instrumentConfig || { criteriaList: [] };
                        config.criteriaList = [...(config.criteriaList || []), newCrit];
                        setEditingEvalConfig({ ...editingEvalConfig, instrumentConfig: config });
                      }}
                      className="text-xs text-kinetic-cyan font-bold hover:underline"
                    >
                      + Agregar Criterio
                    </button>
                  </div>

                  <div className="space-y-4">
                    {editingEvalConfig.instrumentConfig?.criteriaList?.map((crit, idx) => (
                      <div key={crit.id} className="p-4 bg-white/5  rounded-lg border border-white/10 space-y-3">
                        <div className="flex justify-between items-center gap-2">
                          <input
                            type="text"
                            value={crit.criteria}
                            onChange={(e) => {
                              const list = [...editingEvalConfig.instrumentConfig.criteriaList];
                              list[idx].criteria = e.target.value;
                              setEditingEvalConfig({
                                ...editingEvalConfig,
                                instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
                              });
                            }}
                            className="flex-1 font-bold text-xs bg-transparent  px-2 py-1 rounded border border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const list = editingEvalConfig.instrumentConfig.criteriaList.filter(c => c.id !== crit.id);
                              setEditingEvalConfig({
                                ...editingEvalConfig,
                                instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
                              });
                            }}
                            className="text-[10px] text-rose-500 font-bold hover:underline"
                          >
                            Eliminar
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {['AD', 'A', 'B', 'C'].map(level => (
                            <div key={level} className="space-y-1">
                              <span className="text-[10px] font-bold text-kinetic-cyan uppercase">{level}:</span>
                              <textarea
                                rows="2"
                                value={crit.descriptors?.[level] || ''}
                                onChange={(e) => {
                                  const list = [...editingEvalConfig.instrumentConfig.criteriaList];
                                  if (!list[idx].descriptors) list[idx].descriptors = {};
                                  list[idx].descriptors[level] = e.target.value;
                                  setEditingEvalConfig({
                                    ...editingEvalConfig,
                                    instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
                                  });
                                }}
                                className="w-full text-[11px] rounded bg-transparent  border border-white/10 p-1.5 focus:border-kinetic-cyan"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CHECKLIST 3 LEVELS CONFIG */}
              {editingEvalConfig.type === 'Lista de Cotejo 3 Niveles' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-400">Criterios de Cotejo (3 Niveles)</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newCrit = { id: `crit_3lvl_${Date.now()}`, name: 'Nuevo Criterio', points: 5, indicators: [] };
                        const config = editingEvalConfig.instrumentConfig || { criteriaList: [] };
                        config.criteriaList = [...(config.criteriaList || []), newCrit];
                        setEditingEvalConfig({ ...editingEvalConfig, instrumentConfig: config });
                      }}
                      className="text-xs text-kinetic-cyan font-bold hover:underline"
                    >
                      + Agregar Criterio
                    </button>
                  </div>

                  <div className="space-y-4">
                    {editingEvalConfig.instrumentConfig?.criteriaList?.map((crit, cIdx) => (
                      <div key={crit.id} className="p-4 bg-white/5  rounded-lg border border-slate-205 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 w-full">
                            <span className="h-5 w-5 rounded-full bg-white/20  text-slate-300  flex items-center justify-center font-bold text-xs shrink-0">
                              {cIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={crit.name}
                              placeholder="Nombre del criterio..."
                              onChange={(e) => {
                                const list = [...editingEvalConfig.instrumentConfig.criteriaList];
                                list[cIdx].name = e.target.value;
                                setEditingEvalConfig({
                                  ...editingEvalConfig,
                                  instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
                                });
                              }}
                              className="flex-1 font-bold text-xs bg-transparent  px-2 py-1.5 rounded-lg border border-white/10 focus:border-kinetic-cyan"
                            />
                          </div>
                          <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-start w-full sm:w-auto">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-455 uppercase font-black">Puntos:</span>
                              <input
                                type="number"
                                value={crit.points}
                                min="0"
                                max="20"
                                onChange={(e) => {
                                  const list = [...editingEvalConfig.instrumentConfig.criteriaList];
                                  list[cIdx].points = parseFloat(e.target.value) || 0;
                                  setEditingEvalConfig({
                                    ...editingEvalConfig,
                                    instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
                                  });
                                }}
                                className="w-14 text-center text-xs bg-transparent  px-1 py-1 rounded border border-white/10 font-bold"
                              />
                            </div>
                            <div className="flex gap-2 ml-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const list = [...editingEvalConfig.instrumentConfig.criteriaList];
                                  const newInd = { id: `ind_3lvl_${Date.now()}`, text: 'Nuevo indicador' };
                                  list[cIdx].indicators = [...(list[cIdx].indicators || []), newInd];
                                  setEditingEvalConfig({
                                    ...editingEvalConfig,
                                    instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
                                  });
                                }}
                                className="text-[10px] text-kinetic-cyan font-bold hover:underline"
                              >
                                + Agregar Subcriterio
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const list = editingEvalConfig.instrumentConfig.criteriaList.filter(c => c.id !== crit.id);
                                  setEditingEvalConfig({
                                    ...editingEvalConfig,
                                    instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
                                  });
                                }}
                                className="text-[10px] text-rose-500 font-bold hover:underline"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Indicators list */}
                        <div className="pl-6 border-l border-dashed border-white/10  space-y-2">
                          {crit.indicators?.map((ind, iIdx) => (
                            <div key={ind.id} className="flex gap-2 items-center">
                              <span className="text-xs text-slate-400 font-bold">{cIdx + 1}.{iIdx + 1}</span>
                              <input
                                type="text"
                                value={ind.text}
                                placeholder="Escribe el subcriterio o indicador..."
                                onChange={(e) => {
                                  const list = [...editingEvalConfig.instrumentConfig.criteriaList];
                                  list[cIdx].indicators[iIdx].text = e.target.value;
                                  setEditingEvalConfig({
                                    ...editingEvalConfig,
                                    instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
                                  });
                                }}
                                className="flex-1 text-xs bg-transparent  px-2 py-1 rounded border border-white/10"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const list = [...editingEvalConfig.instrumentConfig.criteriaList];
                                  list[cIdx].indicators = list[cIdx].indicators.filter(i => i.id !== ind.id);
                                  setEditingEvalConfig({
                                    ...editingEvalConfig,
                                    instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
                                  });
                                }}
                                className="p-1 hover:bg-white/20 rounded text-rose-400"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                          {(!crit.indicators || crit.indicators.length === 0) && (
                            <p className="text-[10px] text-slate-400 italic">No hay subcriterios. Presione '+ Agregar Subcriterio'.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editingEvalConfig.type === 'Lista de Cotejo' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-400">Indicadores</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newItem = { id: `item_${Date.now()}`, text: 'Nuevo indicador de cotejo de refuerzo' };
                        const config = editingEvalConfig.instrumentConfig || { items: [] };
                        config.items = [...(config.items || []), newItem];
                        setEditingEvalConfig({ ...editingEvalConfig, instrumentConfig: config });
                      }}
                      className="text-xs text-kinetic-cyan font-bold hover:underline"
                    >
                      + Agregar Indicador
                    </button>
                  </div>

                  <div className="space-y-2">
                    {editingEvalConfig.instrumentConfig?.items?.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 bg-white/5  rounded-lg">
                        <span className="text-xs font-bold text-slate-400 w-6 text-center">{idx + 1}</span>
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => {
                            const list = [...editingEvalConfig.instrumentConfig.items];
                            list[idx].text = e.target.value;
                            setEditingEvalConfig({
                              ...editingEvalConfig,
                              instrumentConfig: { ...editingEvalConfig.instrumentConfig, items: list }
                            });
                          }}
                          className="flex-1 text-xs bg-transparent  px-2 py-1.5 rounded border border-white/10"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const list = editingEvalConfig.instrumentConfig.items.filter(i => i.id !== item.id);
                            setEditingEvalConfig({
                              ...editingEvalConfig,
                              instrumentConfig: { ...editingEvalConfig.instrumentConfig, items: list }
                            });
                          }}
                          className="p-1.5 hover:bg-white/20  rounded text-rose-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editingEvalConfig.type === 'Examen' && (() => {
                const config = editingEvalConfig.instrumentConfig || { questions: [], maxScore: 100 };
                const questionsList = config.questions || [];
                const totalPoints = questionsList.reduce((acc, q) => acc + (parseFloat(q.points) || 0), 0);

                const updateConfig = (newQuestions, newMax = config.maxScore) => {
                  setEditingEvalConfig({
                    ...editingEvalConfig,
                    instrumentConfig: {
                      ...config,
                      questions: newQuestions,
                      maxScore: newMax
                    }
                  });
                };

                return (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5  p-3.5 rounded-lg border border-white/10/50 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Puntaje Máximo del Examen de Refuerzo</span>
                        <input
                          type="number"
                          value={config.maxScore || 100}
                          onChange={(e) => updateConfig(questionsList, parseInt(e.target.value) || 100)}
                          className="w-10 mt-1 rounded-lg border border-white/10 bg-transparent px-2 py-1 text-sm font-bold"
                        />
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Total de Puntos Acumulado</span>
                        <span className={`text-base font-black ${totalPoints === (config.maxScore || 100) ? 'text-emerald-605 dark:text-emerald-400' : 'text-rose-500'}`}>
                          {totalPoints} / {config.maxScore || 100} pts
                        </span>
                        {totalPoints !== (config.maxScore || 100) && (
                          <span className="block text-[9px] text-rose-400 font-medium italic">Se recomienda que coincida con el máximo</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      {questionsList.map((q, idx) => (
                        <div key={q.id} className="p-3.5 bg-white/5  rounded-lg border border-white/10/50 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="h-5 w-5 rounded-full bg-white/10 dark:bg-indigo-950/60 text-cyan-400 dark:text-cyan-300 flex items-center justify-center font-black text-[10px] shrink-0">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={q.text}
                              onChange={(e) => {
                                const list = [...questionsList];
                                list[idx].text = e.target.value;
                                updateConfig(list);
                              }}
                              placeholder="Enunciado de la pregunta o criterio de refuerzo..."
                              className="flex-1 rounded-lg border border-white/10 bg-transparent px-2.5 py-1.5 text-xs font-semibold"
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={q.points}
                                onChange={(e) => {
                                  const list = [...questionsList];
                                  list[idx].points = parseInt(e.target.value) || 0;
                                  updateConfig(list);
                                }}
                                className="w-14 rounded-lg border border-white/10 bg-transparent px-2 py-1.5 text-xs text-center font-bold"
                                placeholder="Pts"
                                title="Puntos para esta pregunta"
                              />
                              <span className="text-[10px] text-slate-400 font-bold">pts</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const list = questionsList.filter(item => item.id !== q.id);
                                updateConfig(list);
                              }}
                              className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-500/10 dark:hover:bg-rose-950/20 rounded transition"
                              title="Eliminar Pregunta"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pl-7">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 uppercase font-black">Tipo de Pregunta:</span>
                              {!q.hasSubQuestions ? (
                                <select
                                  value={q.type || 'direct'}
                                  onChange={(e) => {
                                    const list = [...questionsList];
                                    const newType = e.target.value;
                                    list[idx].type = newType;
                                    
                                    if (newType === 'choice' && (!q.options || q.options.length === 0)) {
                                      list[idx].options = [
                                        { id: `opt_${Date.now()}_1`, label: 'Clave A' },
                                        { id: `opt_${Date.now()}_2`, label: 'Clave B' }
                                      ];
                                      list[idx].correctValue = list[idx].options[0].id;
                                    } else if (newType === 'matching') {
                                      if (!q.options || q.options.length === 0) {
                                        list[idx].options = [
                                          { id: `opt_${Date.now()}_1`, label: 'Enlace A' },
                                          { id: `opt_${Date.now()}_2`, label: 'Enlace B' }
                                        ];
                                      }
                                      if (!q.subQuestions || q.subQuestions.length === 0) {
                                        list[idx].subQuestions = [
                                          { id: `sq_${Date.now()}_1`, text: 'Premisa 1', correctValue: list[idx].options?.[0]?.id || `opt_${Date.now()}_1` },
                                          { id: `sq_${Date.now()}_2`, text: 'Premisa 2', correctValue: list[idx].options?.[1]?.id || `opt_${Date.now()}_1` }
                                        ];
                                      }
                                    }
                                    updateConfig(list);
                                  }}
                                  className="rounded-lg border border-white/10 bg-transparent px-2 py-1 text-[11px] font-bold"
                                >
                                  <option value="direct">Calificación Directa (✓/✗)</option>
                                  <option value="choice">Opción Múltiple (Alternativas con Clave)</option>
                                  <option value="matching">Relacionar Columnas (Subpreguntas)</option>
                                </select>
                              ) : (
                                <span className="text-[11px] font-bold text-slate-400 bg-white/10   px-2 py-1 rounded-md border border-white/10/40">
                                  Contenedor (Varias Subpreguntas)
                                </span>
                              )}
                            </div>

                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={!!q.hasSubQuestions}
                                onChange={(e) => {
                                  const list = [...questionsList];
                                  const checked = e.target.checked;
                                  list[idx].hasSubQuestions = checked;
                                  if (checked) {
                                    list[idx].subQuestions = [
                                      {
                                        id: `subq_${Date.now()}_1`,
                                        type: 'direct',
                                        text: `Subpregunta ${idx + 1}.1`,
                                        options: [],
                                        correctValue: ''
                                      }
                                    ];
                                  } else {
                                    list[idx].subQuestions = [];
                                    list[idx].type = 'direct';
                                  }
                                  updateConfig(list);
                                }}
                                className="rounded border-white/20 text-cyan-400 focus:ring-kinetic-cyan h-3.5 w-3.5"
                              />
                              <span className="text-[10px] text-slate-455 uppercase font-black">Habilitar Subpreguntas</span>
                            </label>
                          </div>

                          {/* Alternativas de opción múltiple */}
                          {q.type === 'choice' && (
                            <div className="pl-7 border-l-2 border-kinetic-cyan/50 dark:border-indigo-900/60 space-y-2">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Alternativas (Selecciona el botón de opción para marcar la Clave Correcta)</span>
                              <div className="space-y-1.5">
                                {(q.options || []).map((opt, oIdx) => (
                                  <div key={opt.id} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`correct_reinf_${q.id}`}
                                      checked={q.correctValue === opt.id}
                                      onChange={() => {
                                        const list = [...questionsList];
                                        list[idx].correctValue = opt.id;
                                        updateConfig(list);
                                      }}
                                      className="text-kinetic-cyan focus:ring-kinetic-cyan h-3.5 w-3.5"
                                      title="Marcar como clave correcta"
                                    />
                                    <input
                                      type="text"
                                      value={opt.label}
                                      onChange={(e) => {
                                        const list = [...questionsList];
                                        list[idx].options[oIdx].label = e.target.value;
                                        updateConfig(list);
                                      }}
                                      className="flex-1 rounded-lg border border-white/10 bg-transparent px-2.5 py-1 text-xs   font-medium"
                                      placeholder="Escribe la alternativa..."
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const list = [...questionsList];
                                        list[idx].options = q.options.filter(o => o.id !== opt.id);
                                        if (q.correctValue === opt.id && list[idx].options.length > 0) {
                                          list[idx].correctValue = list[idx].options[0].id;
                                        }
                                        updateConfig(list);
                                      }}
                                      className="text-slate-400 hover:text-rose-500 p-1 transition"
                                      title="Eliminar Opción"
                                      disabled={q.options.length <= 1}
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const list = [...questionsList];
                                  const optId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                                  list[idx].options = [
                                    ...(q.options || []),
                                    { id: optId, label: `Opción ${String.fromCharCode(65 + (q.options?.length || 0))}` }
                                  ];
                                  updateConfig(list);
                                }}
                                className="text-[10px] font-bold text-kinetic-cyan dark:text-cyan-300 hover:underline flex items-center gap-1 mt-1"
                              >
                                + Agregar Alternativa
                              </button>
                            </div>
                          )}

                          {!q.hasSubQuestions && q.type === 'matching' && (
                            <div className="pl-7 border-l-2 border-kinetic-cyan/50 dark:border-indigo-900/60 space-y-4">
                              {/* Opciones de enlace */}
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">1. Opciones de Enlace (Ej: 11 años, 8 años)</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {(q.options || []).map((opt, oIdx) => (
                                    <div key={opt.id} className="flex items-center gap-2 p-1.5 bg-slate-55  rounded-lg border border-slate-150">
                                      <span className="text-[9px] font-black text-slate-400 uppercase">Opt {String.fromCharCode(65 + oIdx)}</span>
                                      <input
                                        type="text"
                                        value={opt.label}
                                        onChange={(e) => {
                                          const list = [...questionsList];
                                          list[idx].options[oIdx].label = e.target.value;
                                          updateConfig(list);
                                        }}
                                        className="flex-1 bg-transparent border-0 p-0 text-xs font-bold text-slate-200  focus:ring-0 focus:outline-none"
                                        placeholder="Valor..."
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const list = [...questionsList];
                                          list[idx].options = q.options.filter(o => o.id !== opt.id);
                                          // Limpiar correctValue si fue eliminada la opción
                                          if (list[idx].subQuestions) {
                                            list[idx].subQuestions.forEach(subQ => {
                                              if (subQ.correctValue === opt.id) {
                                                subQ.correctValue = list[idx].options[0]?.id || '';
                                              }
                                            });
                                          }
                                          updateConfig(list);
                                        }}
                                        className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-slate-150  transition"
                                        title="Eliminar Opción"
                                        disabled={q.options.length <= 1}
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = [...questionsList];
                                    const optId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                                    list[idx].options = [
                                      ...(q.options || []),
                                      { id: optId, label: `Enlace ${String.fromCharCode(65 + (q.options?.length || 0))}` }
                                    ];
                                    updateConfig(list);
                                  }}
                                  className="text-[9px] font-bold text-cyan-400 dark:text-cyan-300 hover:underline flex items-center gap-1"
                                >
                                  + Añadir Opción de Enlace
                                </button>
                              </div>

                              {/* Elementos a relacionar */}
                              <div className="space-y-2 border-t border-slate-150  pt-3">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">2. Elementos a Relacionar y su Clave Correcta</span>
                                <div className="space-y-2">
                                  {(q.subQuestions || []).map((subQ, sIdx) => (
                                    <div key={subQ.id} className="p-2 rounded-lg bg-transparent  border border-white/10  flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                      <div className="flex items-center gap-2 flex-1 w-full">
                                        <span className="h-4 w-4 rounded-full bg-white/5 dark:bg-indigo-950 text-cyan-400 dark:text-cyan-300 flex items-center justify-center font-black text-[9px] shrink-0">
                                          {sIdx + 1}
                                        </span>
                                        <input
                                          type="text"
                                          value={subQ.text}
                                          onChange={(e) => {
                                            const list = [...questionsList];
                                            list[idx].subQuestions[sIdx].text = e.target.value;
                                            updateConfig(list);
                                          }}
                                          className="flex-1 bg-transparent border-0 border-b border-dashed border-white/10  p-0 text-xs font-semibold text-slate-200  focus:ring-0 focus:border-kinetic-cyan"
                                          placeholder="Premisa a relacionar..."
                                        />
                                      </div>
                                      <div className="flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto shrink-0">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Clave:</span>
                                        <select
                                          value={subQ.correctValue}
                                          onChange={(e) => {
                                            const list = [...questionsList];
                                            list[idx].subQuestions[sIdx].correctValue = e.target.value;
                                            updateConfig(list);
                                          }}
                                          className="rounded-lg border border-white/10  bg-white/5  px-2 py-1 text-[10px] font-bold text-slate-200  outline-none"
                                        >
                                          {q.options.map(opt => (
                                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                                          ))}
                                        </select>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const list = [...questionsList];
                                            list[idx].subQuestions = q.subQuestions.filter(s => s.id !== subQ.id);
                                            updateConfig(list);
                                          }}
                                          className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-500/10 dark:hover:bg-rose-950/20 rounded transition"
                                          title="Eliminar Elemento"
                                          disabled={q.subQuestions.length <= 1}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = [...questionsList];
                                    const subQId = `sq_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                                    list[idx].subQuestions = [
                                      ...(q.subQuestions || []),
                                      { id: subQId, text: `Premisa ${q.subQuestions?.length + 1}`, correctValue: q.options[0]?.id || '' }
                                    ];
                                    updateConfig(list);
                                  }}
                                  className="text-[9px] font-bold text-cyan-400 dark:text-cyan-300 hover:underline flex items-center gap-1"
                                >
                                  + Añadir Elemento a Relacionar
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Configuración de Subpreguntas Jerárquicas */}
                          {q.hasSubQuestions && (
                            <div className="pl-7 border-l-2 border-dashed border-indigo-205 dark:border-indigo-900/60 space-y-4">
                              <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wide">Configuración de Subpreguntas</span>
                              <div className="space-y-3.5">
                                {(q.subQuestions || []).map((subQ, sIdx) => {
                                  const updateSubQ = (updatedFields) => {
                                    const list = [...questionsList];
                                    list[idx].subQuestions[sIdx] = {
                                      ...list[idx].subQuestions[sIdx],
                                      ...updatedFields
                                    };
                                    updateConfig(list);
                                  };

                                  return (
                                    <div key={subQ.id} className="p-3 bg-transparent  border border-white/10/70  rounded-lg space-y-3">
                                      <div className="flex items-center gap-2">
                                        <span className="h-4.5 w-4.5 rounded-full bg-white/5 dark:bg-indigo-950/60 text-kinetic-cyan dark:text-cyan-300 flex items-center justify-center font-black text-[9px] shrink-0">
                                          {idx + 1}.{sIdx + 1}
                                        </span>
                                        <input
                                          type="text"
                                          value={subQ.text}
                                          onChange={(e) => updateSubQ({ text: e.target.value })}
                                          placeholder="Enunciado de la subpregunta..."
                                          className="flex-1 rounded-lg border border-white/10 bg-transparent px-2.5 py-1.5 text-xs font-semibold"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const list = [...questionsList];
                                            list[idx].subQuestions = q.subQuestions.filter(item => item.id !== subQ.id);
                                            updateConfig(list);
                                          }}
                                          className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-500/10 dark:hover:bg-rose-950/20 rounded transition"
                                          title="Eliminar Subpregunta"
                                          disabled={q.subQuestions.length <= 1}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pl-6">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[9px] text-slate-455 uppercase">Tipo:</span>
                                          <select
                                            value={subQ.type || 'direct'}
                                            onChange={(e) => {
                                              const newType = e.target.value;
                                              const updated = { type: newType };
                                              if (newType === 'choice' && (!subQ.options || subQ.options.length === 0)) {
                                                updated.options = [
                                                  { id: `opt_${Date.now()}_1`, label: 'Clave A' },
                                                  { id: `opt_${Date.now()}_2`, label: 'Clave B' }
                                                ];
                                                updated.correctValue = updated.options[0].id;
                                              } else if (newType === 'matching') {
                                                if (!subQ.options || subQ.options.length === 0) {
                                                  updated.options = [
                                                    { id: `opt_${Date.now()}_1`, label: 'Enlace A' },
                                                    { id: `opt_${Date.now()}_2`, label: 'Enlace B' }
                                                  ];
                                                }
                                                if (!subQ.subQuestions || subQ.subQuestions.length === 0) {
                                                  updated.subQuestions = [
                                                    { id: `sq_${Date.now()}_1`, text: 'Premisa 1', correctValue: updated.options?.[0]?.id || `opt_${Date.now()}_1` },
                                                    { id: `sq_${Date.now()}_2`, text: 'Premisa 2', correctValue: updated.options?.[1]?.id || `opt_${Date.now()}_1` }
                                                  ];
                                                }
                                              }
                                              updateSubQ(updated);
                                            }}
                                            className="rounded-lg border border-white/10 bg-transparent px-2 py-0.5 text-[10px] font-bold"
                                          >
                                            <option value="direct">Calificación Directa (✓/✗)</option>
                                            <option value="choice">Opción Múltiple</option>
                                            <option value="matching">Relacionar Columnas</option>
                                          </select>
                                        </div>
                                      </div>

                                      {/* Subpregunta: Opción Múltiple */}
                                      {subQ.type === 'choice' && (
                                        <div className="pl-6 border-l-2 border-kinetic-cyan/50 dark:border-indigo-900/60 space-y-2">
                                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Alternativas</span>
                                          <div className="space-y-1.5">
                                            {(subQ.options || []).map((opt, oIdx) => (
                                              <div key={opt.id} className="flex items-center gap-2">
                                                <input
                                                  type="radio"
                                                  name={`correct_reinf_${q.id}_${subQ.id}`}
                                                  checked={subQ.correctValue === opt.id}
                                                  onChange={() => updateSubQ({ correctValue: opt.id })}
                                                  className="text-kinetic-cyan focus:ring-kinetic-cyan h-3.5 w-3.5"
                                                />
                                                <input
                                                  type="text"
                                                  value={opt.label}
                                                  onChange={(e) => {
                                                    const opts = [...subQ.options];
                                                    opts[oIdx].label = e.target.value;
                                                    updateSubQ({ options: opts });
                                                  }}
                                                  className="flex-1 rounded-lg border border-white/10 bg-transparent px-2 py-0.5 text-xs   font-medium"
                                                  placeholder="Escribe la alternativa..."
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const opts = subQ.options.filter(o => o.id !== opt.id);
                                                    const updateFields = { options: opts };
                                                    if (subQ.correctValue === opt.id && opts.length > 0) {
                                                      updateFields.correctValue = opts[0].id;
                                                    }
                                                    updateSubQ(updateFields);
                                                  }}
                                                  className="text-slate-400 hover:text-rose-500 p-1 transition"
                                                  title="Eliminar Opción"
                                                  disabled={subQ.options.length <= 1}
                                                >
                                                  <X className="h-3 w-3" />
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const optId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                                              updateSubQ({
                                                options: [
                                                  ...(subQ.options || []),
                                                  { id: optId, label: `Opción ${String.fromCharCode(65 + (subQ.options?.length || 0))}` }
                                                ]
                                              });
                                            }}
                                            className="text-[9px] font-bold text-kinetic-cyan dark:text-cyan-300 hover:underline flex items-center gap-1 mt-1"
                                          >
                                            + Agregar Alternativa
                                          </button>
                                        </div>
                                      )}

                                      {/* Subpregunta: Relacionar Columnas */}
                                      {subQ.type === 'matching' && (
                                        <div className="pl-6 border-l-2 border-kinetic-cyan/50 dark:border-indigo-900/60 space-y-4">
                                          <div className="space-y-2">
                                            <span className="text-[9px] font-bold text-slate-400 block uppercase">1. Opciones de Enlace</span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                              {(subQ.options || []).map((opt, oIdx) => (
                                                <div key={opt.id} className="flex items-center gap-2 p-1.5 bg-white/5  rounded-lg border border-slate-150">
                                                  <span className="text-[8px] font-black text-slate-400 uppercase">Opt {String.fromCharCode(65 + oIdx)}</span>
                                                  <input
                                                    type="text"
                                                    value={opt.label}
                                                    onChange={(e) => {
                                                      const opts = [...subQ.options];
                                                      opts[oIdx].label = e.target.value;
                                                      updateSubQ({ options: opts });
                                                    }}
                                                    className="flex-1 bg-transparent border-0 p-0 text-xs font-bold text-slate-200  focus:ring-0 focus:outline-none"
                                                    placeholder="Valor..."
                                                  />
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const opts = subQ.options.filter(o => o.id !== opt.id);
                                                      const updateFields = { options: opts };
                                                      if (subQ.subQuestions) {
                                                        const nestedSubQs = subQ.subQuestions.map(nestedSub => {
                                                          if (nestedSub.correctValue === opt.id) {
                                                            return { ...nestedSub, correctValue: opts[0]?.id || '' };
                                                          }
                                                          return nestedSub;
                                                        });
                                                        updateFields.subQuestions = nestedSubQs;
                                                      }
                                                      updateSubQ(updateFields);
                                                    }}
                                                    className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-slate-150  transition"
                                                    title="Eliminar Opción"
                                                    disabled={subQ.options.length <= 1}
                                                  >
                                                    <X className="h-3 w-3" />
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const optId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                                                updateSubQ({
                                                  options: [
                                                    ...(subQ.options || []),
                                                    { id: optId, label: `Enlace ${String.fromCharCode(65 + (subQ.options?.length || 0))}` }
                                                  ]
                                                });
                                              }}
                                              className="text-[8px] font-bold text-cyan-400 dark:text-cyan-300 hover:underline flex items-center gap-1"
                                            >
                                              + Añadir Opción de Enlace
                                            </button>
                                          </div>

                                          <div className="space-y-2 border-t border-slate-150  pt-3">
                                            <span className="text-[9px] font-bold text-slate-400 block uppercase">2. Elementos a Relacionar y su Clave Correcta</span>
                                            <div className="space-y-2">
                                              {(subQ.subQuestions || []).map((nestedSub, nsIdx) => (
                                                <div key={nestedSub.id} className="p-2 rounded-lg bg-transparent  border border-white/10  flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                                  <div className="flex items-center gap-2 flex-1 w-full">
                                                    <span className="h-4 w-4 rounded-full bg-white/5 dark:bg-indigo-950 text-cyan-400 dark:text-cyan-300 flex items-center justify-center font-black text-[9px] shrink-0">
                                                      {nsIdx + 1}
                                                    </span>
                                                    <input
                                                      type="text"
                                                      value={nestedSub.text}
                                                      onChange={(e) => {
                                                        const nested = [...subQ.subQuestions];
                                                        nested[nsIdx].text = e.target.value;
                                                        updateSubQ({ subQuestions: nested });
                                                      }}
                                                      className="flex-1 bg-transparent border-0 border-b border-dashed border-white/10  p-0 text-xs font-semibold text-slate-200  focus:ring-0 focus:border-kinetic-cyan"
                                                      placeholder="Premisa a relacionar..."
                                                    />
                                                  </div>
                                                  <div className="flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto shrink-0">
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Clave:</span>
                                                    <select
                                                      value={nestedSub.correctValue}
                                                      onChange={(e) => {
                                                        const nested = [...subQ.subQuestions];
                                                        nested[nsIdx].correctValue = e.target.value;
                                                        updateSubQ({ subQuestions: nested });
                                                      }}
                                                      className="rounded-lg border border-white/10  bg-white/5  px-2 py-1 text-[9px] font-bold text-slate-200  outline-none"
                                                    >
                                                      {subQ.options.map(opt => (
                                                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                                                      ))}
                                                    </select>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const nested = subQ.subQuestions.filter(s => s.id !== nestedSub.id);
                                                        updateSubQ({ subQuestions: nested });
                                                      }}
                                                      className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-500/10 dark:hover:bg-rose-950/20 rounded transition"
                                                      title="Eliminar Elemento"
                                                      disabled={subQ.subQuestions.length <= 1}
                                                    >
                                                      <Trash2 className="h-3 w-3" />
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const nestedId = `sq_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                                                updateSubQ({
                                                  subQuestions: [
                                                    ...(subQ.subQuestions || []),
                                                    { id: nestedId, text: `Premisa ${subQ.subQuestions?.length + 1}`, correctValue: subQ.options[0]?.id || '' }
                                                  ]
                                                });
                                              }}
                                              className="text-[8px] font-bold text-cyan-400 dark:text-cyan-300 hover:underline flex items-center gap-1"
                                            >
                                              + Añadir Elemento a Relacionar
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const list = [...questionsList];
                                  const subQId = `subq_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                                  list[idx].subQuestions = [
                                    ...(q.subQuestions || []),
                                    {
                                      id: subQId,
                                      type: 'direct',
                                      text: `Subpregunta ${idx + 1}.${(q.subQuestions?.length || 0) + 1}`,
                                      options: [],
                                      correctValue: ''
                                    }
                                  ];
                                  updateConfig(list);
                                }}
                                className="text-[10px] font-black text-cyan-400 dark:text-cyan-300 hover:underline flex items-center gap-1"
                              >
                                + Agregar Subpregunta a este bloque
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newQ = {
                          id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                          type: 'choice',
                          text: `Pregunta ${questionsList.length + 1}`,
                          points: 20,
                          options: [
                            { id: `opt_${Date.now()}_1`, label: 'Opción A' },
                            { id: `opt_${Date.now()}_2`, label: 'Opción B' },
                            { id: `opt_${Date.now()}_3`, label: 'Opción C' }
                          ],
                          correctValue: `opt_${Date.now()}_1`
                        };
                        updateConfig([...questionsList, newQ]);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 border-dashed border-white/10  text-xs font-black text-slate-400 hover:text-cyan-400 hover:border-indigo-300 dark:hover:text-cyan-300 dark:hover:border-indigo-900 transition bg-white/30"
                    >
                      + Añadir Pregunta al Examen
                    </button>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button 
                type="button" 
                onClick={() => setEditingEvalConfig(null)} 
                className="btn-neuro-secondary text-xs px-4 py-2"
              >
                Cerrar
              </button>
              <button 
                type="button" 
                onClick={handleSaveEvalConfig}
                className="btn-neuro-primary text-xs px-4 py-2"
              >
                Guardar Instrumento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Calificar Celda de Refuerzo */}
      {gradingStudent && gradingEval && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 overflow-y-auto text-slate-200">
          {/* Ambient Glowing shapes */}
          <div className="absolute top-[10%] right-[-100px] w-[400px] h-[400px] bg-purple-200/10 rounded-full blur-[100px] pointer-events-none z-0" />
          <div className="absolute bottom-[10%] left-[-100px] w-[300px] h-[300px] bg-blue-200/10 rounded-full blur-[80px] pointer-events-none z-0" />

          <div className="glass-card-ecc border border-white/10 max-w-6xl w-full glass-card-ecc backdrop-blur-xl border border-white/10/80 shadow-[0_20px_60px_rgba(15,23,42,0.12)] rounded-3xl p-6 space-y-5 my-8 animate-in fade-in zoom-in-95 duration-200 relative z-10">
            {/* Header Banner */}
            <div className="flex justify-between items-center border-b border-white/10/80 pb-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5/80 p-3 rounded-2xl border border-white/10/60 w-full text-slate-200">
                <button 
                  onClick={handleNavToPreviousStudent}
                  className="btn-outline h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-purple-650"
                  title="Alumno Anterior"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
                
                <div className="flex-1 flex flex-col sm:flex-row items-center gap-3 truncate text-center sm:text-left">
                  <img 
                    src={gradingStudent.avatar || (gradingStudent.gender === 'Femenino' ? '/avatar_female.webp' : '/avatar_male.webp')} 
                    alt="Avatar" 
                    className="h-12 w-12 rounded-full object-cover border-2 border-purple-500/20" 
                  />
                  <div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Calificar a:</span>
                      <span className="text-[9px] bg-purple-500/20 text-purple-700 px-2 py-0.5 rounded font-black uppercase">Evaluación de Recuperación</span>
                    </div>
                    <span className="text-base font-black text-white block">
                      {gradingStudent.name}
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1 justify-center sm:justify-start">
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-250/60">Cuadro de Honor</span>
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-250/60">Asistencia Perfecta</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleNavToNextStudent}
                  className="btn-outline h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-purple-650"
                  title="Siguiente Alumno"
                >
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>

              <button 
                onClick={() => { setGradingStudent(null); setGradingEval(null); }} 
                className="text-slate-400 hover:text-slate-200 bg-white/10 hover:bg-white/20 h-10 w-10 flex items-center justify-center rounded-lg transition active:scale-90 ml-3 shrink-0 border border-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Two-Panel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10 text-slate-200">
              {/* Left Panel: Resumen de Calificaciones */}
              <aside className="col-span-12 lg:col-span-3 flex flex-col justify-between p-5 bg-white/5/60 rounded-2xl border border-white/10/60 min-h-[300px]">
                <div className="space-y-6 w-full">
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest border-b border-white/10/60 pb-2">Resumen de Calificaciones <span className="text-[8.5px] font-normal text-slate-400 block mt-1">(Tiempo Real)</span></h3>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-6 justify-items-center">
                    {activeCourse?.competencies?.slice(0, 3).map((comp, cIdx) => {
                      const regAvg = getCompetenceAverage(gradingStudent.id, comp.id);
                      const reinfAvg = getCompetenceReinforcementAverage(gradingStudent.id, comp.id);
                      const finalGrade = getFinalCompetenceGrade(regAvg, reinfAvg);
                      
                      let pct = 0;
                      let color ="text-blue-500";
                      if (finalGrade !== '-') {
                        if (gradingScale === 'literal') {
                          pct = { AD: 100, A: 75, B: 50, C: 25 }[finalGrade] || 0;
                          color = finalGrade === 'AD' ? 'text-emerald-600' : (finalGrade === 'A' ? 'text-amber-500' : 'text-rose-500');
                        } else {
                          const val = parseFloat(finalGrade);
                          pct = isNaN(val) ? 0 : (val / (gradingScale === '20' ? 20 : 10)) * 100;
                          color = val >= (gradingScale === '20' ? 14 : 7) ? 'text-emerald-600' : (val >= (gradingScale === '20' ? 11 : 6.0) ? 'text-amber-500' : 'text-rose-500');
                        }
                      }
                      
                      return (
                        <div key={comp.id} className="flex flex-col items-center text-center">
                          <div className="relative w-10 h-16 mb-2">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                              <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="transparent" stroke="currentColor" strokeWidth="2"></path>
                              <path className={color} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="transparent" stroke="currentColor" strokeDasharray={`${pct}, 100`} strokeLinecap="round" strokeWidth="2.5"></path>
                            </svg>
                            <div className={`absolute inset-0 flex items-center justify-center font-black text-sm ${color}`}>{finalGrade}</div>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block truncate max-w-[150px]" title={comp.name}>{comp.name || `Competencia ${cIdx + 1}`}</span>
                        </div>
                      );
                    })}
                    
                    {/* Overall Average */}
                    <div className="flex flex-col items-center text-center pt-4 border-t border-white/10/60 w-full">
                      <div className="relative w-20 h-20 mb-2">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="transparent" stroke="currentColor" strokeWidth="2"></path>
                          <path className="text-cyan-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="transparent" stroke="currentColor" strokeDasharray={`${
                            (() => {
                              const overall = (() => {
                                if (!activeCourse?.competencies || activeCourse.competencies.length === 0) return '-';
                                let sum = 0, count = 0;
                                activeCourse.competencies.forEach(comp => {
                                  const regAvg = getCompetenceAverage(gradingStudent.id, comp.id);
                                  const reinfAvg = getCompetenceReinforcementAverage(gradingStudent.id, comp.id);
                                  const finalGrade = getFinalCompetenceGrade(regAvg, reinfAvg);
                                  if (finalGrade !== '-') {
                                    if (gradingScale === 'literal') {
                                      sum += { AD: 4, A: 3, B: 2, C: 1 }[finalGrade] || 0;
                                    } else {
                                      sum += parseFloat(finalGrade) || 0;
                                    }
                                    count++;
                                  }
                                });
                                if (count === 0) return '-';
                                const avg = sum / count;
                                if (gradingScale === 'literal') {
                                  if (avg >= 3.5) return 'AD';
                                  if (avg >= 2.5) return 'A';
                                  if (avg >= 1.5) return 'B';
                                  return 'C';
                                }
                                return avg.toFixed(1);
                              })();
                              return overall === '-' ? 0 : (gradingScale === 'literal' ? ({ AD: 100, A: 75, B: 50, C: 25 }[overall] || 0) : (parseFloat(overall) / (gradingScale === '20' ? 20 : 10)) * 100);
                            })()
                          }, 100`} strokeLinecap="round" strokeWidth="3"></path>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-black text-lg text-cyan-400">
                          {(() => {
                            if (!activeCourse?.competencies || activeCourse.competencies.length === 0) return '-';
                            let sum = 0, count = 0;
                            activeCourse.competencies.forEach(comp => {
                              const regAvg = getCompetenceAverage(gradingStudent.id, comp.id);
                              const reinfAvg = getCompetenceReinforcementAverage(gradingStudent.id, comp.id);
                              const finalGrade = getFinalCompetenceGrade(regAvg, reinfAvg);
                              if (finalGrade !== '-') {
                                if (gradingScale === 'literal') {
                                  sum += { AD: 4, A: 3, B: 2, C: 1 }[finalGrade] || 0;
                                } else {
                                  sum += parseFloat(finalGrade) || 0;
                                }
                                count++;
                              }
                            });
                            if (count === 0) return '-';
                            const avg = sum / count;
                            if (gradingScale === 'literal') {
                              if (avg >= 3.5) return 'AD';
                              if (avg >= 2.5) return 'A';
                              if (avg >= 1.5) return 'B';
                              return 'C';
                            }
                            return avg.toFixed(1);
                          })()}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Promedio General</span>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Right Panel: Active Instrument details */}
              <main className="col-span-12 lg:col-span-9 flex flex-col justify-between">
                <div className="text-left mb-3 px-1.5 flex items-center justify-between border-b border-white/10/60 pb-2">
                  <span className="text-xs text-slate-400 font-bold">Actividad: <strong className="text-purple-650">{gradingEval.name}</strong> ({gradingEval.type})</span>
                </div>
                <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-1 custom-scrollbar">
              {gradingEval.type === 'Examen' && (() => {
                const config = gradingEval.instrumentConfig || {};
                const questions = config.questions || [];
                
                // Si es un examen legado (vacío de configuración), mostramos la Ficha de"El Dedo Mágico"
                if (questions.length === 0) {
                  return (
                    <div className="space-y-5 max-w-xl mx-auto py-2">
                      <div className="glass-card-ecc border border-white/10 p-4.5 bg-white/5 border-kinetic-cyan/10 flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-black text-slate-200">
                            Ficha Interactiva: Comprensión"El Dedo Mágico"
                          </h4>
                          <p className="text-[10px] text-slate-400  font-medium">
                            Registre las respuestas del alumno haciendo clic en las opciones correspondientes.
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[9px] font-black uppercase text-slate-400 block">Puntaje</span>
                          <span className="text-lg font-black text-cyan-400 dark:text-cyan-300">
                            {getExamScore(tempExamSelections)} / 20
                          </span>
                        </div>
                      </div>

                      {/* 1. UNE CON FLECHAS */}
                      <div className="glass-card-ecc border border-white/10 p-4 space-y-3">
                        <h5 className="text-[11px] font-black text-slate-200  uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10  pb-2">
                          <span className="h-5 w-5 rounded-full bg-white/10 dark:bg-indigo-950/60 text-cyan-400 dark:text-cyan-300 flex items-center justify-center font-black text-[10px]">1</span>
                          Une con flechas (Relaciona personajes)
                        </h5>
                        <div className="space-y-2">
                          {[
                            { id: 'narradora', label: 'Narradora', icon: '👩‍🦰' },
                            { id: 'philip', label: 'Philip', icon: '👦' },
                            { id: 'william', label: 'William', icon: '🧑' },
                            { id: 'gregg', label: 'Señor Gregg', icon: '👨' }
                          ].map(char => {
                            const selectedOption = tempExamSelections.q1?.[char.id];
                            return (
                              <div key={char.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 bg-slate-55/20  rounded-lg border border-white/10">
                                <div className="sm:col-span-4 flex items-center gap-2 pr-2">
                                  <span className="text-xs font-bold text-slate-200">{char.icon} {char.label}</span>
                                </div>
                                <div className="sm:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full">
                                  {[
                                    { value: '11_years', label: '11 años', badge: '🎂' },
                                    { value: '8_years', label: '8 años', badge: '8️⃣' },
                                    { value: 'magic_finger', label: 'Dedo Mágico', badge: '☝️' },
                                    { value: 'hunt', label: 'Caza', badge: '🔫' }
                                  ].map(opt => {
                                    const isSelected = selectedOption === opt.value;
                                    return (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                          setTempExamSelections(prev => {
                                            const q1 = { ...prev.q1 };
                                            q1[char.id] = isSelected ? null : opt.value;
                                            return { ...prev, q1 };
                                          });
                                        }}
                                        className={`px-2 py-1.5 rounded-lg border text-[10px] font-black flex items-center justify-center gap-1 transition-all truncate ${
                                          isSelected
                                            ? 'bg-indigo-650 text-white border-indigo-600 '
                                            : 'bg-transparent  text-slate-400  border-white/10  hover:bg-white/5'
                                        }`}
                                        title={opt.label}
                                      >
                                        <span>{opt.badge}</span>
                                        <span>{opt.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. COMPLETA LOS ESPACIOS */}
                      <div className="glass-card-ecc border border-white/10 p-4 space-y-3">
                        <h5 className="text-[11px] font-black text-slate-200  uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10  pb-2">
                          <span className="h-5 w-5 rounded-full bg-white/10 dark:bg-indigo-950/60 text-cyan-400 dark:text-cyan-300 flex items-center justify-center font-black text-[10px]">2</span>
                          Completa los espacios
                        </h5>
                        <div className="p-2 bg-amber-500/100/5 border border-amber-500/10 rounded-lg flex flex-wrap gap-2 justify-center items-center">
                          <span className="text-[9px] font-black uppercase text-amber-600">Palabras:</span>
                          {['bosque', 'rojo', 'cervatillo', 'escopeta'].map(w => (
                            <span key={w} className="px-1.5 py-0.5 bg-amber-500/10 dark:bg-amber-950/40 text-amber-700 dark:text-amber-350 border border-amber-200/50 rounded text-[9px] font-black">{w}</span>
                          ))}
                        </div>
                        <div className="space-y-2.5">
                          {[
                            { id: 'a', text: 'a. Cuando la narradora se enfada ve todo _________.' },
                            { id: 'b', text: 'b. Philip tenía su propia _________.' },
                            { id: 'c', text: 'c. Los Gregg regresaron del _________ después de cazar.' },
                            { id: 'd', text: 'd. El animal que llevaban era un hermoso _________.' }
                          ].map(sentence => {
                            const selectedVal = tempExamSelections.q2?.[sentence.id];
                            return (
                              <div key={sentence.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 bg-slate-55/20  rounded-lg border border-white/10">
                                <div className="sm:col-span-6">
                                  <p className="text-[11px] font-bold text-slate-200  leading-snug">{sentence.text}</p>
                                </div>
                                <div className="sm:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full">
                                  {['rojo', 'escopeta', 'bosque', 'cervatillo'].map(word => {
                                    const isSelected = selectedVal === word;
                                    return (
                                      <button
                                        key={word}
                                        type="button"
                                        onClick={() => {
                                          setTempExamSelections(prev => {
                                            const q2 = { ...prev.q2 };
                                            q2[sentence.id] = isSelected ? null : word;
                                            return { ...prev, q2 };
                                          });
                                        }}
                                        className={`px-2 py-1.5 rounded-lg border text-[10px] font-black transition-all uppercase text-center truncate ${
                                          isSelected
                                            ? 'bg-emerald-600 text-white border-emerald-600 '
                                            : 'bg-transparent  text-slate-555  border-white/10  hover:bg-white/5'
                                        }`}
                                      >
                                        {word}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 3. ORDENA LOS HECHOS */}
                      <div className="glass-card-ecc border border-white/10 p-4 space-y-3">
                        <h5 className="text-[11px] font-black text-slate-200  uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10  pb-2">
                          <span className="h-5 w-5 rounded-full bg-white/10 dark:bg-indigo-950/60 text-cyan-400 dark:text-cyan-300 flex items-center justify-center font-black text-[10px]">3</span>
                          Ordena los hechos (del 1 al 4)
                        </h5>
                        <div className="space-y-2">
                          {[
                            { id: 'evC', text: 'La señora Winter llama tonta a la narradora.' },
                            { id: 'evD', text: 'La narradora intenta convencer a Philip y William de no cazar.' },
                            { id: 'evB', text: 'Los Gregg regresan con un cervatillo cazado.' },
                            { id: 'evA', text: 'La narradora apunta con el Dedo Mágico a la familia Gregg.' }
                          ].map(event => {
                            const selectedVal = tempExamSelections.q3?.[event.id];
                            return (
                              <div key={event.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 bg-slate-55/20  rounded-lg border border-white/10">
                                <div className="sm:col-span-8">
                                  <p className="text-[11px] font-bold text-slate-200  pr-2 leading-relaxed">{event.text}</p>
                                </div>
                                <div className="sm:col-span-4 grid grid-cols-4 gap-1.5 w-full justify-items-center">
                                  {['1', '2', '3', '4'].map(num => {
                                    const isSelected = selectedVal === num;
                                    return (
                                      <button
                                        key={num}
                                        type="button"
                                        onClick={() => {
                                          setTempExamSelections(prev => {
                                            const q3 = { ...prev.q3 };
                                            q3[event.id] = isSelected ? null : num;
                                            return { ...prev, q3 };
                                          });
                                        }}
                                        className={`h-7 w-full rounded-lg border text-[10px] font-black transition-all flex items-center justify-center ${
                                          isSelected
                                            ? 'bg-amber-500/100 text-white border-amber-500 '
                                            : 'bg-transparent  text-slate-400  border-white/10  hover:bg-white/5'
                                        }`}
                                      >
                                        {num}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 4. CLASIFICA EN LA TABLA */}
                      <div className="glass-card-ecc border border-white/10 p-4 space-y-3">
                        <h5 className="text-[11px] font-black text-slate-200  uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10  pb-2">
                          <span className="h-5 w-5 rounded-full bg-white/10 dark:bg-indigo-950/60 text-cyan-400 dark:text-cyan-300 flex items-center justify-center font-black text-[10px]">4</span>
                          Clasifica en la tabla
                        </h5>
                        <div className="space-y-2">
                          {[
                            { id: 'cazar', text: 'Cazar animales', icon: '🔫' },
                            { id: 'proteger', text: 'Proteger a los animales', icon: '💖' },
                            { id: 'burlarse', text: 'Burlarse de los demás', icon: '😹' },
                            { id: 'convencer', text: 'Convencer a sus amigos', icon: '💬' }
                          ].map(action => {
                            const selectedVal = tempExamSelections.q4?.[action.id];
                            return (
                              <div key={action.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 bg-white/5  rounded-lg border border-white/10">
                                <div className="sm:col-span-6 flex items-center gap-2">
                                  <span className="text-xs">{action.icon}</span>
                                  <p className="text-[11px] font-bold text-slate-200">{action.text}</p>
                                </div>
                                <div className="sm:col-span-6 grid grid-cols-2 gap-1.5 w-full">
                                  {[
                                    { value: 'le_gusta', label: 'Le gusta 😊', color: 'border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20' },
                                    { value: 'no_le_gusta', label: 'No le gusta 🙁', color: 'border-rose-500 text-rose-600 bg-rose-50/50 dark:bg-rose-950/20' }
                                  ].map(opt => {
                                    const isSelected = selectedVal === opt.value;
                                    return (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                          setTempExamSelections(prev => {
                                            const q4 = { ...prev.q4 };
                                            q4[action.id] = isSelected ? null : opt.value;
                                            return { ...prev, q4 };
                                          });
                                        }}
                                        className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-black transition-all text-center truncate ${
                                          isSelected
                                            ? `${opt.color} border-2  font-black`
                                            : 'bg-transparent  text-slate-400 border-white/10  hover:bg-white/5'
                                        }`}
                                      >
                                        {opt.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 5. RESPUESTA GUIADA */}
                      <div className="glass-card-ecc border border-white/10 p-4 space-y-3">
                        <h5 className="text-[11px] font-black text-slate-200  uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10  pb-2">
                          <span className="h-5 w-5 rounded-full bg-white/10 dark:bg-indigo-950/60 text-cyan-400 dark:text-cyan-300 flex items-center justify-center font-black text-[10px]">5</span>
                          ¿Por qué utilizó el Dedo Mágico contra los Gregg?
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { value: 'jugar', label: 'Porque quería jugar con ellos.', icon: '⚽' },
                            { value: 'feliz', label: 'Porque estaba feliz por la cacería.', icon: '😊' },
                            { value: 'enfado', label: 'Porque se enfadó al ver que cazaban animales.', icon: '😡' },
                            { value: 'escopetas', label: 'Porque quería enseñarles a usar escopetas.', icon: '🔫' }
                          ].map(opt => {
                            const isSelected = tempExamSelections.q5 === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setTempExamSelections(prev => ({
                                    ...prev,
                                    q5: isSelected ? null : opt.value
                                  }));
                                }}
                                className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                                  isSelected
                                    ? 'bg-indigo-650 text-white border-kinetic-cyan border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] font-black'
                                    : 'bg-white/5  text-slate-650  border-slate-150  hover:bg-white/5'
                                }`}
                              >
                                <span className="text-sm shrink-0">{opt.icon}</span>
                                <span className="text-[9.5px] leading-snug font-bold">{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }

                let obtainedPoints = 0;
                let totalMaxPoints = 0;
                questions.forEach(q => {
                  const pts = parseFloat(q.points) || 0;
                  totalMaxPoints += pts;
                  if (q.hasSubQuestions && q.subQuestions && q.subQuestions.length > 0) {
                    const subQs = q.subQuestions;
                    const subQPts = pts / subQs.length;
                    const qSelections = tempExamSelections[q.id] || {};
                    
                    subQs.forEach(subQ => {
                      const selectedVal = qSelections[subQ.id];
                      if (subQ.type === 'choice') {
                        if (selectedVal === subQ.correctValue) {
                          obtainedPoints += subQPts;
                        }
                      } else if (subQ.type === 'matching') {
                        const subMatchQs = subQ.subQuestions || [];
                        const matchQPts = subMatchQs.length > 0 ? (subQPts / subMatchQs.length) : 0;
                        const matchSelections = selectedVal || {};
                        subMatchQs.forEach(mQ => {
                          if (matchSelections[mQ.id] === mQ.correctValue) {
                            obtainedPoints += matchQPts;
                          }
                        });
                      } else { // direct
                        if (selectedVal === true) {
                          obtainedPoints += subQPts;
                        }
                      }
                    });
                  } else {
                    if (q.type === 'choice') {
                      if (tempExamSelections[q.id] === q.correctValue) {
                        obtainedPoints += pts;
                      }
                    } else if (q.type === 'matching') {
                      const subQs = q.subQuestions || [];
                      const subQPts = subQs.length > 0 ? (pts / subQs.length) : 0;
                      const qSelections = tempExamSelections[q.id] || {};
                      subQs.forEach(subQ => {
                        if (qSelections[subQ.id] === subQ.correctValue) {
                          obtainedPoints += subQPts;
                        }
                      });
                    } else {
                      if (tempExamSelections[q.id] === true) {
                        obtainedPoints += pts;
                      }
                    }
                  }
                });

                return (
                  <div className="space-y-5 max-w-xl mx-auto py-2">
                    <div className="glass-card-ecc border border-white/10 p-4.5 bg-white/5 border-kinetic-cyan/10 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-200  uppercase tracking-wide">
                          Ficha del Examen de Refuerzo
                        </h4>
                        <p className="text-[10px] text-slate-505  font-semibold mt-0.5">
                          Seleccione la respuesta marcada por el alumno o califique de forma directa.
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Resultado</span>
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className="text-base font-black text-cyan-400 dark:text-cyan-300">
                            {obtainedPoints} / {totalMaxPoints}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold ml-0.5">pts</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 dark:bg-emerald-950/40 px-2 py-0.5 rounded mt-1 inline-block">
                          Nota: {liveCalculatedScore}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {questions.map((q, idx) => {
                        const selectedVal = tempExamSelections[q.id];
                        const isDirect = q.type === 'direct';
                        const isChoice = q.type === 'choice';
                        const isMatching = q.type === 'matching';

                        return (
                          <div key={q.id} className="glass-card-ecc border border-white/10 p-4 space-y-3">
                            <div className="flex justify-between items-start border-b border-white/10  pb-2">
                              <h5 className="text-[11px] font-black text-slate-200  uppercase tracking-wider flex items-center gap-2">
                                <span className="h-5 w-5 rounded-full bg-white/10 dark:bg-indigo-950/60 text-cyan-400 dark:text-cyan-300 flex items-center justify-center font-black text-[10px]">
                                  {idx + 1}
                                </span>
                              </h5>
                              <span className="text-[10px] font-black text-cyan-400 bg-white/5 dark:bg-indigo-950/50 px-2 py-0.5 rounded shrink-0">
                                {q.points} pts
                              </span>
                            </div>

                            {!q.hasSubQuestions && isDirect && (
                              <div className="grid grid-cols-2 gap-3.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTempExamSelections(prev => ({
                                      ...prev,
                                      [q.id]: selectedVal === true ? null : true
                                    }));
                                  }}
                                  className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-2 transition active:scale-95 font-black text-[11px] ${
                                    selectedVal === true
                                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                                      : 'bg-white/5  text-slate-400  border-white/10/80  hover:bg-white/10'
                                  }`}
                                >
                                  <span>✓</span> Correcto (+{q.points} pts)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTempExamSelections(prev => ({
                                      ...prev,
                                      [q.id]: selectedVal === false ? null : false
                                    }));
                                  }}
                                  className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-2 transition active:scale-95 font-black text-[11px] ${
                                    selectedVal === false
                                      ? 'bg-rose-500/100 border-rose-500 text-white shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                                      : 'bg-white/5  text-slate-400  border-white/10/80  hover:bg-white/10'
                                  }`}
                                >
                                  <span>✗</span> Incorrecto (+0 pts)
                                </button>
                              </div>
                            )}

                            {!q.hasSubQuestions && isChoice && (
                              <div className="grid grid-cols-1 gap-2 text-[11px] font-semibold">
                                {(q.options || []).map(opt => {
                                  const isSelected = selectedVal === opt.id;
                                  const isCorrectKey = q.correctValue === opt.id;
                                  
                                  let btnStyles = 'bg-white/5  text-slate-200  border-white/10  hover:bg-white/10';
                                  
                                  if (selectedVal !== undefined && selectedVal !== null) {
                                    if (isSelected) {
                                      if (isCorrectKey) {
                                        btnStyles = 'bg-emerald-600 border-emerald-600 text-white font-black shadow-[0_0_15px_rgba(0,0,0,0.5)]';
                                      } else {
                                        btnStyles = 'bg-rose-500/100 border-rose-500 text-white font-black shadow-[0_0_15px_rgba(0,0,0,0.5)]';
                                      }
                                    } else if (isCorrectKey) {
                                      btnStyles = 'bg-emerald-500/10 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400 border-emerald-400 dark:border-emerald-800 border-2 font-bold';
                                    }
                                  }

                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => {
                                        setTempExamSelections(prev => ({
                                          ...prev,
                                          [q.id]: isSelected ? null : opt.id
                                        }));
                                      }}
                                      className={`p-2.5 rounded-lg border text-left flex justify-between items-center gap-2 transition active:scale-[0.99] font-bold ${btnStyles}`}
                                    >
                                      <span>{opt.label}</span>
                                      {selectedVal !== undefined && selectedVal !== null && (
                                        <>
                                          {isSelected && isCorrectKey && <span className="text-[8.5px] bg-white/20 px-1.5 py-0.5 rounded font-black uppercase">✓ CORRECTO</span>}
                                          {isSelected && !isCorrectKey && <span className="text-[8.5px] bg-white/20 px-1.5 py-0.5 rounded font-black uppercase">✗ INCORRECTO</span>}
                                          {!isSelected && isCorrectKey && <span className="text-[8.5px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">★ CLAVE CORRECTA</span>}
                                        </>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {!q.hasSubQuestions && isMatching && (
                              <div className="border border-slate-150  rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
                                {(q.subQuestions || []).map((subQ, sIdx) => {
                                  const qSelections = selectedVal || {};
                                  const subQSelectedVal = qSelections[subQ.id];

                                  const optCount = q.options?.length || 4;
                                  let gridColsClass ="grid-cols-2 sm:grid-cols-4";
                                  if (optCount === 2) gridColsClass ="grid-cols-2";
                                  else if (optCount === 3) gridColsClass ="grid-cols-3";
                                  else if (optCount === 5) gridColsClass ="grid-cols-2 sm:grid-cols-5";
                                  else if (optCount > 5) gridColsClass ="grid-cols-2 sm:grid-cols-6";

                                  return (
                                    <div key={subQ.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3.5 bg-slate-55/20  hover:bg-white/5/50  transition-colors">
                                      <div className="sm:col-span-4 flex items-center gap-2 pr-2">
                                        <span className="h-4.5 w-4.5 rounded-full bg-white/10  text-slate-400  flex items-center justify-center font-bold text-[9px] shrink-0">
                                          {sIdx + 1}
                                        </span>
                                        <span className="text-xs font-bold text-slate-200  leading-tight">{subQ.text}</span>
                                      </div>
                                      <div className={`sm:col-span-8 grid ${gridColsClass} gap-1.5 w-full`}>
                                        {(q.options || []).map(opt => {
                                          const isSelected = subQSelectedVal === opt.id;
                                          const isCorrectKey = subQ.correctValue === opt.id;

                                          let btnStyles = 'bg-transparent  text-slate-400  border-slate-205  hover:bg-white/5';

                                          if (subQSelectedVal !== undefined && subQSelectedVal !== null && subQSelectedVal !== '') {
                                            if (isSelected) {
                                              if (isCorrectKey) {
                                                btnStyles = 'bg-emerald-600 text-white border-emerald-600  font-black';
                                              } else {
                                                btnStyles = 'bg-rose-500/100 text-white border-rose-500  font-black';
                                              }
                                            } else if (isCorrectKey) {
                                              btnStyles = 'bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border-emerald-400 dark:border-emerald-800 border font-bold';
                                            }
                                          }

                                          return (
                                            <button
                                              key={opt.id}
                                              type="button"
                                              onClick={() => {
                                                setTempExamSelections(prev => {
                                                  const qSel = { ...(prev[q.id] || {}) };
                                                  qSel[subQ.id] = isSelected ? null : opt.id;
                                                  return { ...prev, [q.id]: qSel };
                                                });
                                              }}
                                              className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all active:scale-95 text-center truncate ${btnStyles}`}
                                              title={opt.label}
                                            >
                                              {opt.label}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Subpreguntas Jerárquicas Anidadas */}
                            {q.hasSubQuestions && q.subQuestions && q.subQuestions.length > 0 && (
                              <div className="space-y-4 pt-1">
                                {q.subQuestions.map((subQ, sIdx) => {
                                  const subQSelectedVal = selectedVal?.[subQ.id];
                                  const isSubDirect = subQ.type === 'direct';
                                  const isSubChoice = subQ.type === 'choice';
                                  const isSubMatching = subQ.type === 'matching';
                                  const subQPts = (q.points / q.subQuestions.length).toFixed(1);

                                  return (
                                    <div key={subQ.id} className="p-3 bg-slate-55/10  rounded-lg border border-white/10  space-y-3">
                                      <div className="flex justify-between items-start border-b border-white/10  pb-2">
                                        <h6 className="text-[10.5px] font-bold text-slate-200  flex items-center gap-1.5 leading-snug">
                                          <span className="h-4.5 w-4.5 rounded-full bg-white/20  text-slate-400  flex items-center justify-center font-bold text-[9px] shrink-0">
                                            {idx + 1}.{sIdx + 1}
                                          </span>
                                          {subQ.text}
                                        </h6>
                                        <span className="text-[9px] font-bold text-slate-455 bg-white/10  px-1.5 py-0.5 rounded shrink-0">
                                          {subQPts} pts
                                        </span>
                                      </div>

                                      {isSubDirect && (
                                        <div className="grid grid-cols-2 gap-3">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTempExamSelections(prev => {
                                                const qSel = { ...(prev[q.id] || {}) };
                                                qSel[subQ.id] = subQSelectedVal === true ? null : true;
                                                return { ...prev, [q.id]: qSel };
                                              });
                                            }}
                                            className={`py-1.5 px-3 rounded-lg border flex items-center justify-center gap-1.5 transition active:scale-95 font-bold text-[10px] ${
                                              subQSelectedVal === true
                                                ? 'bg-emerald-600 border-emerald-600 text-white '
                                                : 'bg-transparent  text-slate-400  border-slate-205  hover:bg-white/10'
                                            }`}
                                          >
                                            <span>✓</span> Correcto
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTempExamSelections(prev => {
                                                const qSel = { ...(prev[q.id] || {}) };
                                                qSel[subQ.id] = subQSelectedVal === false ? null : false;
                                                return { ...prev, [q.id]: qSel };
                                              });
                                            }}
                                            className={`py-1.5 px-3 rounded-lg border flex items-center justify-center gap-1.5 transition active:scale-95 font-bold text-[10px] ${
                                              subQSelectedVal === false
                                                ? 'bg-rose-500/100 border-rose-500 text-white '
                                                : 'bg-transparent  text-slate-400  border-slate-205  hover:bg-white/10'
                                            }`}
                                          >
                                            <span>✗</span> Incorrecto
                                          </button>
                                        </div>
                                      )}

                                      {isSubChoice && (
                                        <div className="grid grid-cols-1 gap-2 text-[10px] font-semibold font-bold">
                                          {(subQ.options || []).map(opt => {
                                            const isSelected = subQSelectedVal === opt.id;
                                            const isCorrectKey = subQ.correctValue === opt.id;
                                            
                                            let btnStyles = 'bg-transparent  text-slate-300  border-white/10  hover:bg-white/10';
                                            
                                            if (subQSelectedVal !== undefined && subQSelectedVal !== null && subQSelectedVal !== '') {
                                              if (isSelected) {
                                                if (isCorrectKey) {
                                                  btnStyles = 'bg-emerald-600 border-emerald-600 text-white font-bold ';
                                                } else {
                                                  btnStyles = 'bg-rose-500/100 border-rose-500 text-white font-bold ';
                                                }
                                              } else if (isCorrectKey) {
                                                btnStyles = 'bg-emerald-500/10 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400 border-emerald-400 dark:border-emerald-805 border-2 font-bold';
                                              }
                                            }

                                            return (
                                              <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => {
                                                  setTempExamSelections(prev => {
                                                    const qSel = { ...(prev[q.id] || {}) };
                                                    qSel[subQ.id] = isSelected ? null : opt.id;
                                                    return { ...prev, [q.id]: qSel };
                                                  });
                                                }}
                                                className={`p-2 rounded-lg border text-left flex justify-between items-center gap-2 transition active:scale-[0.99] font-bold ${btnStyles}`}
                                              >
                                                <span>{opt.label}</span>
                                                {subQSelectedVal !== undefined && subQSelectedVal !== null && subQSelectedVal !== '' && (
                                                  <>
                                                    {isSelected && isCorrectKey && <span className="text-[8px] bg-white/20 px-1 py-0.5 rounded font-black uppercase">✓ CORRECTO</span>}
                                                    {isSelected && !isCorrectKey && <span className="text-[8px] bg-white/20 px-1 py-0.5 rounded font-black uppercase">✗ INCORRECTO</span>}
                                                    {!isSelected && isCorrectKey && <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">★ CLAVE</span>}
                                                  </>
                                                )}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {isSubMatching && (
                                        <div className="border border-slate-150  rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 bg-transparent">
                                          {(subQ.subQuestions || []).map((nestedSub, nsIdx) => {
                                            const subQMatchingSelections = subQSelectedVal || {};
                                            const matchSelection = subQMatchingSelections[nestedSub.id];

                                            const optCount = subQ.options?.length || 4;
                                            let gridColsClass ="grid-cols-2 sm:grid-cols-4";
                                            if (optCount === 2) gridColsClass ="grid-cols-2";
                                            else if (optCount === 3) gridColsClass ="grid-cols-3";
                                            else if (optCount === 5) gridColsClass ="grid-cols-2 sm:grid-cols-5";

                                            return (
                                              <div key={nestedSub.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2.5 bg-transparent hover:bg-white/5/30  transition-colors">
                                                <div className="sm:col-span-5 flex items-center gap-1.5 pr-1">
                                                  <span className="h-4 w-4 rounded-full bg-white/10  text-slate-400  flex items-center justify-center font-bold text-[8.5px] shrink-0">
                                                    {nsIdx + 1}
                                                  </span>
                                                  <span className="text-[11px] font-semibold text-slate-200  leading-tight">{nestedSub.text}</span>
                                                </div>
                                                <div className={`sm:col-span-7 grid ${gridColsClass} gap-1 w-full`}>
                                                  {(subQ.options || []).map(opt => {
                                                    const isSelected = matchSelection === opt.id;
                                                    const isCorrectKey = nestedSub.correctValue === opt.id;

                                                    let btnStyles = 'bg-transparent  text-slate-400  border-slate-205  hover:bg-white/5';

                                                    if (matchSelection !== undefined && matchSelection !== null && matchSelection !== '') {
                                                      if (isSelected) {
                                                        if (isCorrectKey) {
                                                          btnStyles = 'bg-emerald-600 text-white border-emerald-600  font-bold';
                                                        } else {
                                                          btnStyles = 'bg-rose-500/100 text-white border-rose-500  font-bold';
                                                        }
                                                      } else if (isCorrectKey) {
                                                        btnStyles = 'bg-emerald-500/10 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400 border-emerald-350 dark:border-emerald-805 border font-bold';
                                                      }
                                                    }

                                                    return (
                                                      <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => {
                                                          setTempExamSelections(prev => {
                                                            const mainSel = { ...(prev[q.id] || {}) };
                                                            const subSel = { ...(mainSel[subQ.id] || {}) };
                                                            subSel[nestedSub.id] = isSelected ? null : opt.id;
                                                            mainSel[subQ.id] = subSel;
                                                            return { ...prev, [q.id]: mainSel };
                                                          });
                                                        }}
                                                        className={`px-1.5 py-1 rounded-md border text-[9px] font-bold transition-all active:scale-95 text-center truncate ${btnStyles}`}
                                                        title={opt.label}
                                                      >
                                                        {opt.label}
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {gradingEval.type === 'Rubrica' && (
                <div className="space-y-4">
                  {gradingEval.instrumentConfig?.criteriaList?.length === 0 ? (
                    <p className="text-xs text-rose-500 text-center py-4 italic">No se han configurado criterios.</p>
                  ) : (
                    gradingEval.instrumentConfig?.criteriaList?.map(crit => {
                      const selectedVal = tempRubricSelections[crit.id];

                      return (
                        <div key={crit.id} className="p-3.5 bg-white/5  rounded-lg border border-white/10/50 space-y-2.5">
                          <p className="text-xs font-black text-slate-200">{crit.criteria}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-[10px] font-semibold">
                            {['AD', 'A', 'B', 'C'].map(level => {
                              const descText = crit.descriptors?.[level] || 'Sin descripción.';
                              const isSelected = selectedVal === level;

                              return (
                                <button
                                  key={level}
                                  type="button"
                                  onClick={() => {
                                    setTempRubricSelections(prev => {
                                      const next = { ...prev };
                                      if (next[crit.id] === level) {
                                        delete next[crit.id];
                                      } else {
                                        next[crit.id] = level;
                                      }
                                      return next;
                                    });
                                  }}
                                  className={`p-2.5 rounded-lg border text-left flex flex-col justify-between h-full gap-1.5 transition-all ${
                                    isSelected 
                                      ? 'border-indigo-600 bg-white/5/70 bg-white/5 text-slate-955 dark:text-white border-2 scale-[1.02]' 
                                      : 'border-white/10  bg-transparent  text-slate-400 hover:text-slate-300'
                                  }`}
                                >
                                  <span className="font-extrabold uppercase text-[11px] text-kinetic-cyan">{level}</span>
                                  <span className="leading-snug text-[9px] line-clamp-3">{descText}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* CHECKLIST 3 LEVELS GRADING */}
              {gradingEval.type === 'Lista de Cotejo 3 Niveles' && (
                <div className="space-y-4">
                  {gradingEval.instrumentConfig?.criteriaList?.length === 0 ? (
                    <p className="text-xs text-rose-500 text-center py-4 italic">No se han configurado criterios en la lista. Cierre y configurela.</p>
                  ) : (
                    gradingEval.instrumentConfig?.criteriaList?.map((crit, cIdx) => {
                      const points = parseFloat(crit.points) || 0;
                      const colors = ['border-blue-500/35', 'border-purple-500/35', 'border-emerald-500/35', 'border-amber-500/35'];
                      const borderColor = colors[cIdx % colors.length];

                      return (
                        <div key={crit.id} className={`p-4 bg-transparent  rounded-2xl border ${borderColor} space-y-3.5 `}>
                          <div className="flex justify-between items-center border-b border-white/10  pb-2">
                            <span className="text-xs font-black text-slate-200  uppercase tracking-wide">{crit.name}</span>
                            <span className="text-[10px] font-black text-cyan-400 bg-white/5 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded shrink-0">
                              {points} pts
                            </span>
                          </div>

                          <div className="space-y-2">
                            {crit.indicators?.map((ind, iIdx) => {
                              const selectedVal = tempChecklist3LvlSelections[ind.id];
                              let rowStyle ="bg-transparent border-slate-150";
                              if (selectedVal === 'A') {
                                rowStyle ="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 border-2";
                              } else if (selectedVal === 'B') {
                                rowStyle ="bg-amber-55/25 dark:bg-amber-950/20 border-amber-500 border-2";
                              } else if (selectedVal === 'C') {
                                rowStyle ="bg-rose-50/50 dark:bg-rose-950/20 border-rose-500 border-2";
                              }
                              
                              return (
                                <div key={ind.id} className={`flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center p-2.5 rounded-lg border transition-all duration-200 ${rowStyle}`}>
                                  <span className="text-xs font-semibold text-slate-200  pr-2">
                                    {ind.text}
                                  </span>
                                  <div className="flex gap-1 shrink-0 w-full sm:w-auto">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTempChecklist3LvlSelections(prev => ({
                                          ...prev,
                                          [ind.id]: selectedVal === 'A' ? null : 'A'
                                        }));
                                      }}
                                      className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-xs transition active:scale-95 border-2 ${
                                        selectedVal === 'A'
                                          ? 'bg-emerald-500/100 text-white border-emerald-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-emerald-500/25'
                                          : 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/100/25'
                                      }`}
                                      title="Logrado"
                                    >
                                      A
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTempChecklist3LvlSelections(prev => ({
                                          ...prev,
                                          [ind.id]: selectedVal === 'B' ? null : 'B'
                                        }));
                                      }}
                                      className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-xs transition active:scale-95 border-2 ${
                                        selectedVal === 'B'
                                          ? 'bg-amber-500/100 text-white border-amber-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-amber-500/25'
                                          : 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/100/25'
                                      }`}
                                      title="En Proceso"
                                    >
                                      B
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTempChecklist3LvlSelections(prev => ({
                                          ...prev,
                                          [ind.id]: selectedVal === 'C' ? null : 'C'
                                        }));
                                      }}
                                      className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-xs transition active:scale-95 border-2 ${
                                        selectedVal === 'C'
                                          ? 'bg-rose-500/100 text-white border-rose-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-rose-500/25'
                                          : 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/100/25'
                                      }`}
                                      title="En Inicio"
                                    >
                                      C
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                            {(!crit.indicators || crit.indicators.length === 0) && (
                              <p className="text-[10px] text-slate-400 italic">No hay subcriterios en este criterio.</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {gradingEval.type === 'Lista de Cotejo' && (
                <div className="space-y-2">
                  {gradingEval.instrumentConfig?.items?.length === 0 ? (
                    <p className="text-xs text-rose-500 text-center py-4 italic">No se han configurado indicadores.</p>
                  ) : (
                    gradingEval.instrumentConfig?.items?.map(item => {
                      const isChecked = !!tempChecklistSelections[item.id];

                      return (
                        <label 
                          key={item.id} 
                          className="flex items-center gap-3 p-3 bg-transparent  border border-white/10  rounded-lg cursor-pointer hover:bg-white/5 transition select-none"
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={(e) => {
                              setTempChecklistSelections(prev => ({ ...prev, [item.id]: e.target.checked }));
                            }}
                            className="h-4.5 w-4.5 rounded text-kinetic-cyan focus:ring-kinetic-cyan"
                          />
                          <span className="text-xs font-semibold text-slate-200">{item.text}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}

              {gradingEval.type === 'Guia de Observacion' && (
                <div className="space-y-5">
                  {gradingEval.instrumentConfig?.criteriaList?.length === 0 ? (
                    <p className="text-xs text-rose-500 text-center py-4 italic">No se han configurado criterios ni indicadores observacionales.</p>
                  ) : (
                    gradingEval.instrumentConfig?.criteriaList?.map(crit => (
                      <div key={crit.id} className="space-y-3">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Criterio: {crit.name}</span>
                        <div className="space-y-2">
                          {crit.indicators?.map(ind => {
                            const selectedLvl = tempObservationSelections[ind.id];
                            return (
                              <div key={ind.id} className="p-3 bg-white/5  rounded-lg border border-white/10/40 space-y-2">
                                <p className="text-xs font-bold text-slate-300">{ind.text}</p>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {gradingEval.instrumentConfig?.levels?.map(lvl => (
                                    <button
                                      key={lvl.id}
                                      type="button"
                                      onClick={() => {
                                        setTempObservationSelections(prev => {
                                          const next = { ...prev };
                                          if (next[ind.id] === lvl.id) {
                                            delete next[ind.id];
                                          } else {
                                            next[ind.id] = lvl.id;
                                          }
                                          return next;
                                        });
                                      }}
                                      className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                                        selectedLvl === lvl.id
                                          ? 'border-2 border-indigo-600 bg-white/5 dark:bg-indigo-950 text-kinetic-cyan '
                                          : 'border-white/10  bg-transparent  text-slate-400 hover:text-slate-300'
                                      }`}
                                    >
                                      {lvl.label} ({lvl.name})
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Comentarios u observaciones cualitativas */}
              <div className="space-y-1.5 border-t border-white/10  pt-3">
                <label className="block text-[10px] font-bold uppercase text-slate-400">Observaciones o Retroalimentación</label>
                <textarea
                  rows="3"
                  placeholder="Detallar avances, dificultades observadas o acuerdos de recuperación pedagógica..."
                  value={tempObsComments}
                  onChange={(e) => setTempObsComments(e.target.value)}
                  className="w-full text-xs rounded-lg border border-white/10 bg-white/10 px-3 py-2 focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan"
                />
              </div>
            </div>
          </main>
        </div>

            <div className="p-4 bg-white/5/80 border border-kinetic-cyan/30/80 rounded-2xl flex items-center justify-between text-center gap-3 text-slate-200">
              <div>
                <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider block">Nota Resultante</span>
                <span className="text-2xl font-black text-cyan-400">
                  {typeof liveCalculatedScore === 'number' ? liveCalculatedScore : liveCalculatedScore}
                </span>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setGradingStudent(null); setGradingEval(null); }}
                  className="btn-neuro-secondary text-xs px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempExamScore(gradingScale === 'literal' ? 'A' : 0);
                    setTempExamSelections({});
                    setTempRubricSelections({});
                    setTempChecklistSelections({});
                    setTempObservationSelections({});
                    setTempObsComments('');
                  }}
                  className="px-4 py-2 border border-red-500/30 dark:border-red-900/60 hover:border-red-400 dark:hover:border-red-700 bg-red-50/50 hover:bg-red-500/10 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-650 dark:text-red-400 text-xs font-bold rounded-lg transition"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={handleSaveStudentGrade}
                  className="btn-neuro-primary text-xs px-4.5 py-2 flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  Guardar Nota
                </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
      {/* Copy Evaluation Modal */}
      {copyingEvaluation && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="glass-card-ecc border border-white/10 p-6 max-w-lg w-full space-y-4 shadow-2xl border border-white/20">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h4 className="font-extrabold text-lg text-white dark:text-white flex items-center gap-2">
                <Copy className="h-5 w-5 text-kinetic-cyan" />
                Copiar Instrumento de Refuerzo
              </h4>
              <button 
                type="button" 
                onClick={() => setCopyingEvaluation(null)}
                className="text-slate-400 hover:text-slate-300  text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCopyEvaluationSubmit} className="space-y-4">
              <p className="text-xs text-slate-400">
                Duplicará la columna de refuerzo <strong className="text-slate-200  font-bold">"{copyingEvaluation.name}"</strong> ({copyingEvaluation.type}) con su configuración de criterios y descriptores hacia el destino especificado.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Curso Destino</label>
                  <select 
                    value={targetCourseId} 
                    onChange={(e) => setTargetCourseId(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-transparent   px-3 py-2 text-xs font-semibold focus:border-kinetic-cyan"
                  >
                    {visibleCourses.map(c => {
                      const asgs = c.assignments || [];
                      const relevantAsgs = currentRole === 'teacher' 
                        ? asgs.filter(a => a.teacherId === currentUser?.id)
                        : asgs;
                      const gradesText = Array.from(new Set(relevantAsgs.map(a => a.gradeLevel))).join(', ');
                      return (
                        <option key={c.id} value={c.id}>{c.name} ({gradesText})</option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Competencia Destino</label>
                  <select 
                    value={targetCompetenceId} 
                    onChange={(e) => setTargetCompetenceId(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-transparent   px-3 py-2 text-xs font-semibold focus:border-kinetic-cyan"
                  >
                    {targetCompetencies.map(comp => (
                      <option key={comp.id} value={comp.id}>{comp.name}</option>
                    ))}
                    {targetCompetencies.length === 0 && <option value="">Sin competencias</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Capacidad Destino</label>
                  <select 
                    value={targetCapacityId} 
                    onChange={(e) => setTargetCapacityId(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-transparent   px-3 py-2 text-xs font-semibold focus:border-kinetic-cyan"
                  >
                    <option value="">Ninguna (Malla Libre)</option>
                    {targetCapacities.map(cap => (
                      <option key={cap.id} value={cap.id}>{cap.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Bimestre</label>
                    <select 
                      value={targetBimester} 
                      onChange={(e) => setTargetBimester(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-transparent   px-3 py-2 text-xs font-semibold focus:border-kinetic-cyan"
                    >
                      {bimestersOptions.map(b => (
                        <option key={b} value={b}>Bimestre {b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Unidad</label>
                    <select 
                      value={targetUnit} 
                      onChange={(e) => setTargetUnit(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-transparent   px-3 py-2 text-xs font-semibold focus:border-kinetic-cyan"
                    >
                      {(() => {
                        let units = [];
                        if (targetBimester === '1') units = [{ value: '0', label: 'U0' }, { value: '1', label: 'U1' }];
                        else if (targetBimester === '2') units = [{ value: '2', label: 'U2' }, { value: '3', label: 'U3' }];
                        else if (targetBimester === '3') units = [{ value: '4', label: 'U4' }, { value: '5', label: 'U5' }];
                        else if (targetBimester === '4') units = [{ value: '6', label: 'U6' }, { value: '7', label: 'U7' }];
                        
                        const unitEnabled = (num) => activePeriods?.units?.[String(num)] !== false;
                        return units.filter(u => unitEnabled(u.value)).map(u => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Grado Destino</label>
                  <select 
                    value={targetGrade} 
                    onChange={(e) => setTargetGrade(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-transparent   px-3 py-2 text-xs font-semibold focus:border-kinetic-cyan"
                  >
                    {targetAvailableGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Sección Destino</label>
                  <select 
                    value={targetSection} 
                    onChange={(e) => setTargetSection(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-transparent   px-3 py-2 text-xs font-semibold focus:border-kinetic-cyan"
                  >
                    {targetAvailableSections.map(s => (
                      <option key={s} value={s}>Sección {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-white/5  p-4 rounded-lg border border-white/10  space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer select-none font-bold text-xs">
                  <input 
                    type="checkbox" 
                    checked={copyGradesOption && sameClassSelected}
                    disabled={!sameClassSelected}
                    onChange={(e) => setCopyGradesOption(e.target.checked)}
                    className="rounded h-4 w-4 text-kinetic-cyan focus:ring-kinetic-cyan disabled:opacity-50 mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <span className={sameClassSelected ? 'text-white  font-extrabold' : 'text-slate-400 cursor-not-allowed font-medium'}>
                      Copiar también las calificaciones (notas de refuerzo) de los estudiantes.
                    </span>
                    {!sameClassSelected && (
                      <span className="text-[10px] text-amber-500 font-semibold block leading-tight mt-1">
                        ⚠️ Las notas solo se pueden copiar si el grado y sección de destino son idénticos al origen ({selectedGrade} - Sección {selectedSection}).
                      </span>
                    )}
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                <button 
                  type="button" 
                  onClick={() => setCopyingEvaluation(null)} 
                  className="btn-neuro-secondary text-xs py-2 px-4"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-neuro-primary text-xs py-2 px-5"
                >
                  Copiar Instrumento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReinforcementGrading;
