import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DatabaseContext } from '../context/DatabaseContext';
import { 
  ClipboardCheck, 
  FileSpreadsheet, 
  Sparkles, 
  ShieldAlert, 
  Award, 
  GraduationCap, 
  Plus, 
  Settings, 
  Trash2, 
  Check, 
  X, 
  ChevronLeft,
  ChevronRight,
  Info,
  BookOpen,
  Upload,
  Download,
  AlertTriangle,
  FileText,
  CheckSquare,
  Copy
} from 'lucide-react';
import axios from 'axios';

function GradingPortal({
  embeddedCourseId,
  embeddedGrade,
  embeddedSection,
  embeddedBimester,
  embeddedUnit,
  isEmbedded = false,
  onNavigateToTarget
}) {
  const { 
    currentRole, 
    currentUser, 
    courses: contextCourses, 
    students: contextStudents,
    grades: contextGrades,
    saveGrade,
    saveGradesBatch,
    gradingScale,
    evaluations: contextEvaluations,
    saveEvaluation,
    deleteEvaluation,
    copyEvaluation,
    activePeriods,
    reinforcementGrades: contextReinforcementGrades
  } = useContext(DatabaseContext);

  const courses = contextCourses || [];
  const students = contextStudents || [];
  const grades = contextGrades || [];
  const evaluations = contextEvaluations || [];
  const reinforcementGrades = contextReinforcementGrades || [];

  // 1. Selector States
  const [localGrade, setLocalGrade] = useState(() => {
    return localStorage.getItem('sga_sel_grade') || 'Todas';
  });
  const [localCourseId, setLocalCourseId] = useState(() => {
    return localStorage.getItem('sga_sel_course') || '';
  });
  const [selectedCompetenceId, setSelectedCompetenceId] = useState(() => {
    return localStorage.getItem('sga_sel_competence') || '';
  });
  const [localBimester, setLocalBimester] = useState(() => {
    return localStorage.getItem('sga_sel_bimester') || '1';
  });
  const [localUnit, setLocalUnit] = useState(() => {
    return localStorage.getItem('sga_sel_unit') || '0';
  });
  const [localSection, setLocalSection] = useState(() => {
    return localStorage.getItem('sga_sel_section') || 'Todas';
  });

  // View control states
  const [viewMode, setViewMode] = useState('auxiliar'); // 'auxiliar' | 'consolidado'

  // Import flow states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRawText, setImportRawText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [columnMappings, setColumnMappings] = useState({}); // { index: 'dni' | 'name' | 'grade' | 'ignore' }
  const [importTargetEvalId, setImportTargetEvalId] = useState(''); // evalId or 'new'
  const [newImportEvalName, setNewImportEvalName] = useState('Examen Importado');
  const [newImportEvalType, setNewImportEvalType] = useState('Examen');
  const [newImportEvalCapacityId, setNewImportEvalCapacityId] = useState('');
  const [importFeedback, setImportFeedback] = useState(null);

  const selectedGrade = isEmbedded ? embeddedGrade : localGrade;
  const setSelectedGrade = isEmbedded ? () => {} : setLocalGrade;
  const selectedCourseId = isEmbedded ? embeddedCourseId : localCourseId;
  const setSelectedCourseId = isEmbedded ? () => {} : setLocalCourseId;
  const selectedSection = isEmbedded ? embeddedSection : localSection;
  const setSelectedSection = isEmbedded ? () => {} : setLocalSection;
  const selectedBimester = isEmbedded ? embeddedBimester : localBimester;
  const setSelectedBimester = isEmbedded ? () => {} : setLocalBimester;
  const selectedUnit = isEmbedded ? embeddedUnit : localUnit;
  const setSelectedUnit = isEmbedded ? () => {} : setLocalUnit;

  // Persist selectors to localStorage
  useEffect(() => {
    if (!isEmbedded) localStorage.setItem('sga_sel_grade', localGrade);
  }, [localGrade, isEmbedded]);

  useEffect(() => {
    if (!isEmbedded) localStorage.setItem('sga_sel_course', localCourseId);
  }, [localCourseId, isEmbedded]);

  useEffect(() => {
    localStorage.setItem('sga_sel_competence', selectedCompetenceId);
  }, [selectedCompetenceId]);

  useEffect(() => {
    if (!isEmbedded) localStorage.setItem('sga_sel_bimester', localBimester);
  }, [localBimester, isEmbedded]);

  useEffect(() => {
    if (!isEmbedded) localStorage.setItem('sga_sel_unit', localUnit);
  }, [localUnit, isEmbedded]);

  useEffect(() => {
    if (!isEmbedded) localStorage.setItem('sga_sel_section', localSection);
  }, [localSection, isEmbedded]);

  // Filter courses for teacher role & selected grade based on assignments
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

  // Dynamic list of grades that the teacher teaches (or all grades if admin/director)
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

  // Dynamic list of sections that the teacher teaches for their courses (or all if admin)
  const availableSections = useMemo(() => {
    if (currentRole !== 'teacher') {
      if (!selectedCourseId) {
        return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      }
      const course = courses.find(c => c.id === selectedCourseId);
      if (!course) return [];
      const sectionsSet = new Set();
      (course.assignments || []).forEach(asg => {
        if (selectedGrade === 'Todas' || asg.gradeLevel === selectedGrade) {
          (asg.sections || []).forEach(sec => sectionsSet.add(sec));
        }
      });
      return Array.from(sectionsSet).sort();
    }
    
    // For teacher:
    const sectionsSet = new Set();
    courses.forEach(c => {
      if (selectedCourseId && c.id !== selectedCourseId) return;
      (c.assignments || []).forEach(asg => {
        if (asg.teacherId === currentUser?.id) {
          if (selectedGrade === 'Todas' || asg.gradeLevel === selectedGrade) {
            (asg.sections || []).forEach(sec => sectionsSet.add(sec));
          }
        }
      });
    });
    return Array.from(sectionsSet).sort();
  }, [courses, currentRole, currentUser, selectedCourseId, selectedGrade]);

  // Sync selectedCourseId when visibleCourses changes
  useEffect(() => {
    if (visibleCourses.length > 0) {
      if (!visibleCourses.some(c => c.id === selectedCourseId)) {
        setSelectedCourseId(visibleCourses[0].id);
      }
    } else {
      setSelectedCourseId('');
    }
  }, [visibleCourses, selectedCourseId]);

  // Get active course details
  const activeCourse = useMemo(() => {
    return courses.find(c => c.id === selectedCourseId);
  }, [courses, selectedCourseId]);

  // Get active competence details
  const activeCompetence = useMemo(() => {
    if (!activeCourse || !selectedCompetenceId) return null;
    return (activeCourse.competencies || []).find(c => c.id === selectedCompetenceId);
  }, [activeCourse, selectedCompetenceId]);

  // Auto select competence if course changes (preserving selection if still valid)
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

  // Dynamic link between Bimester and Unit:
  const unitOptions = useMemo(() => {
    const unitEnabled = (num) => activePeriods?.units?.[String(num)] !== false;
    let options = [];
    if (selectedBimester === '1') options = [{ value: '0', label: 'Unidad 0' }, { value: '1', label: 'Unidad 1' }];
    else if (selectedBimester === '2') options = [{ value: '2', label: 'Unidad 2' }, { value: '3', label: 'Unidad 3' }];
    else if (selectedBimester === '3') options = [{ value: '4', label: 'Unidad 4' }, { value: '5', label: 'Unidad 5' }];
    else if (selectedBimester === '4') options = [{ value: '6', label: 'Unidad 6' }, { value: '7', label: 'Unidad 7' }];
    
    return options.filter(opt => unitEnabled(opt.value));
  }, [selectedBimester, activePeriods]);

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

  // Sync selectedUnit if it becomes disabled
  useEffect(() => {
    if (unitOptions.length > 0) {
      if (!unitOptions.some(opt => opt.value === selectedUnit)) {
        setSelectedUnit(unitOptions[0].value);
      }
    }
  }, [unitOptions, selectedUnit]);

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

  // Target course configuration for Copy Modal
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
      setTargetCourseId(copyingEvaluation.courseId || selectedCourseId);
      setTargetCompetenceId(copyingEvaluation.competenceId || selectedCompetenceId);
      setTargetCapacityId(copyingEvaluation.capacityId || '');
      setTargetBimester(copyingEvaluation.bimester || selectedBimester);
      setTargetUnit(copyingEvaluation.unit || selectedUnit);
      setTargetGrade(selectedGrade === 'Todas' ? '' : selectedGrade);
      setTargetSection(selectedSection === 'Todas' ? '' : selectedSection);
      setCopyGradesOption(false);
    }
  }, [copyingEvaluation]);

  const sameClassSelected = 
    selectedGrade !== 'Todas' && 
    selectedSection !== 'Todas' &&
    targetGrade && selectedGrade &&
    targetSection && selectedSection &&
    targetGrade.trim().toLowerCase() === selectedGrade.trim().toLowerCase() && 
    targetSection.trim().toLowerCase() === selectedSection.trim().toLowerCase();

  const handleCopyEvaluationSubmit = (e) => {
    e.preventDefault();
    if (!copyingEvaluation) return;
    if (!targetCourseId || !targetCompetenceId) {
      return alert('Debe seleccionar curso y competencia de destino.');
    }
    if (!targetGrade || !targetSection) {
      return alert('Debe seleccionar grado y sección de destino.');
    }

    const success = copyEvaluation(
      copyingEvaluation.id,
      targetCourseId,
      targetCompetenceId,
      targetCapacityId,
      targetBimester,
      targetUnit,
      copyGradesOption && sameClassSelected,
      selectedGrade,
      selectedSection,
      targetGrade,
      targetSection
    );

    if (success) {
      alert(`Instrumento"${copyingEvaluation.name}" copiado exitosamente.`);
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
        setSelectedCourseId(targetCourseId);
        setSelectedCompetenceId(targetCompetenceId);
        setSelectedBimester(targetBimester);
        setSelectedUnit(targetUnit);
        if (targetGrade) setSelectedGrade(targetGrade);
        if (targetSection) setSelectedSection(targetSection);
      }
    } else {
      alert('Hubo un error al copiar el instrumento.');
    }
  };

  // Filter students enrolled in active course's grade level and section based on assignments
  const enrolledStudents = useMemo(() => {
    if (!activeCourse) return [];
    
    // Get all assignments for this course that are relevant to the user's role
    const relevantAssignments = (activeCourse.assignments || []).filter(asg => {
      if (currentRole === 'teacher') {
        return asg.teacherId === currentUser?.id;
      }
      return true;
    });

    if (relevantAssignments.length === 0) return [];

    let list = students.filter(s => {
      // Find if there is an assignment matching the student's grade and section
      const match = relevantAssignments.some(asg => {
        const gradeMatch = asg.gradeLevel.toLowerCase() === (s.gradeLevel || '').toLowerCase();
        
        // If specific grade is selected, only match that grade
        if (selectedGrade !== 'Todas' && asg.gradeLevel !== selectedGrade) return false;
        
        // Check section match
        const hasSection = (asg.sections || []).some(sec => sec.toLowerCase() === (s.section || '').toLowerCase());
        
        // If specific section is selected, only match that section
        if (selectedSection !== 'Todas') {
          return gradeMatch && (s.section || '').toLowerCase() === selectedSection.toLowerCase() && hasSection;
        }
        
        return gradeMatch && hasSection;
      });
      return match;
    });

    return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
  }, [students, activeCourse, currentRole, currentUser, selectedGrade, selectedSection]);

  // Filter evaluations for current context
  const activeEvaluations = useMemo(() => {
    return evaluations.filter(e => 
      e.courseId === selectedCourseId &&
      e.competenceId === selectedCompetenceId &&
      (e.bimester || '1') === selectedBimester &&
      (e.unit !== undefined && e.unit !== null ? String(e.unit) : '0') === selectedUnit
    );
  }, [evaluations, selectedCourseId, selectedCompetenceId, selectedBimester, selectedUnit]);

  // 2. Modals Control States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvalName, setNewEvalName] = useState('');
  const [newEvalType, setNewEvalType] = useState('Examen'); // Rubrica, Lista de Cotejo, Guia de Observacion, Examen
  const [newEvalCapacityId, setNewEvalCapacityId] = useState('');
  const [showCurriculumMap, setShowCurriculumMap] = useState(false);

  // Sync capacity when active competence changes
  useEffect(() => {
    if (activeCompetence && activeCompetence.capacities && activeCompetence.capacities.length > 0) {
      setNewEvalCapacityId(activeCompetence.capacities[0].id);
    } else {
      setNewEvalCapacityId('');
    }
  }, [activeCompetence]);

  const [editingEvalConfig, setEditingEvalConfig] = useState(null); // Evaluation object being configured
  const [gradingStudent, setGradingStudent] = useState(null); // Student being graded
  const [gradingEval, setGradingEval] = useState(null); // Evaluation being used for grading

  // Temporary state for instrument grading inputs
  const [tempExamScore, setTempExamScore] = useState('');
  const [tempExamSelections, setTempExamSelections] = useState({}); // { q1: {...}, q2: {...}, q3: {...}, q4: {...}, q5: '' }
  const [tempRubricSelections, setTempRubricSelections] = useState({}); // { criteriaId: level }
  const [tempChecklistSelections, setTempChecklistSelections] = useState({}); // { itemId: checked }
  const [tempChecklist3LvlSelections, setTempChecklist3LvlSelections] = useState({}); // { indicatorId: 'A' | 'B' | 'C' }
  const [tempObservationSelections, setTempObservationSelections] = useState({}); // { indicatorId: levelId }
  const [tempObsComments, setTempObsComments] = useState('');

  // 3. Setup default template for an instrument
  const createDefaultInstrumentConfig = (type) => {
    if (type === 'Rubrica') {
      return {
        criteriaList: [
          { 
            id: `crit_${Date.now()}_1`, 
            criteria: 'Comprensión de conceptos', 
            descriptors: { 
              AD: 'Demuestra dominio excepcional y propone aplicaciones prácticas originales.',
              A: 'Demuestra comprensión completa y responde con acierto y claridad.',
              B: 'Muestra dificultad en la aplicación, requiere asistencia frecuente.',
              C: 'No comprende los fundamentos del concepto evaluado.'
            } 
          },
          { 
            id: `crit_${Date.now()}_2`, 
            criteria: 'Estructura e Integración', 
            descriptors: { 
              AD: 'Organización impecable con un flujo de ideas altamente coherente.',
              A: 'Estructurado de forma lógica con transiciones fluidas entre secciones.',
              B: 'Faltas de cohesión en las ideas principales, estructura dispersa.',
              C: 'Desorganizado, sin secuencia lógica identificable.'
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
              { id: `ind_3lvl_${Date.now()}_11`, text: 'Subcriterio o indicador 1.1' },
              { id: `ind_3lvl_${Date.now()}_12`, text: 'Subcriterio o indicador 1.2' }
            ]
          },
          {
            id: `crit_3lvl_${Date.now()}_2`,
            name: 'Criterio General 2',
            points: 10,
            indicators: [
              { id: `ind_3lvl_${Date.now()}_21`, text: 'Subcriterio o indicador 2.1' },
              { id: `ind_3lvl_${Date.now()}_22`, text: 'Subcriterio o indicador 2.2' }
            ]
          }
        ]
      };
    } else if (type === 'Lista de Cotejo') {
      return {
        items: [
          { id: `item_${Date.now()}_1`, text: 'Entregó la actividad en el plazo establecido.' },
          { id: `item_${Date.now()}_2`, text: 'Cumple con el formato de presentación requerido.' },
          { id: `item_${Date.now()}_3`, text: 'Contiene al menos tres fuentes válidas de referencia.' }
        ]
      };
    } else if (type === 'Guia de Observacion') {
      return {
        criteriaList: [
          { 
            id: `obs_crit_${Date.now()}_1`, 
            name: 'Participación Activa', 
            indicators: [
              { id: `obs_ind_${Date.now()}_11`, text: 'Aporta ideas constructivas durante el trabajo en equipo.' },
              { id: `obs_ind_${Date.now()}_12`, text: 'Escucha con respeto los puntos de vista ajenos.' }
            ] 
          },
          { 
            id: `obs_crit_${Date.now()}_2`, 
            name: 'Responsabilidad y Actitud', 
            indicators: [
              { id: `obs_ind_${Date.now()}_21`, text: 'Cumple puntualmente con los roles asignados.' }
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
    if (!newEvalName.trim()) return alert('Ingrese un nombre para la actividad.');
    if (!selectedCourseId || !selectedCompetenceId) return alert('Seleccione curso y competencia primero.');

    const newEval = {
      courseId: selectedCourseId,
      competenceId: selectedCompetenceId,
      capacityId: newEvalCapacityId || null,
      bimester: selectedBimester,
      unit: selectedUnit,
      name: newEvalName.trim(),
      type: newEvalType,
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
    
    const capacities = activeCompetence?.capacities || [];
    const cap1 = capacities[0]?.id || null;
    const cap2 = capacities[1]?.id || cap1;
    const cap3 = capacities[2]?.id || cap1;

    const eval1 = {
      courseId: selectedCourseId,
      competenceId: selectedCompetenceId,
      capacityId: cap1,
      bimester: selectedBimester,
      unit: selectedUnit,
      name:"Examen Parcial",
      type:"Examen",
      instrumentConfig: {}
    };

    const eval2 = {
      courseId: selectedCourseId,
      competenceId: selectedCompetenceId,
      capacityId: cap2,
      bimester: selectedBimester,
      unit: selectedUnit,
      name:"Lista de Cotejo de Actividades",
      type:"Lista de Cotejo",
      instrumentConfig: createDefaultInstrumentConfig("Lista de Cotejo")
    };

    const eval3 = {
      courseId: selectedCourseId,
      competenceId: selectedCompetenceId,
      capacityId: cap3,
      bimester: selectedBimester,
      unit: selectedUnit,
      name:"Rúbrica de Proyecto",
      type:"Rubrica",
      instrumentConfig: createDefaultInstrumentConfig("Rubrica")
    };

    saveEvaluation(eval1);
    saveEvaluation(eval2);
    saveEvaluation(eval3);
    alert('Se han cargado las 3 evaluaciones de demostración con éxito en este bimestre y unidad.');
  };

  // 4. Open cell-based grading modal & populate
  const handleOpenGradingCell = (student, evaluation) => {
    setGradingStudent(student);
    setGradingEval(evaluation);

    // Find if there's an existing grade
    const match = grades.find(g => g.studentId === student.id && g.evaluationId === evaluation.id);

    if (match && match.details) {
      // Load saved states
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
    } else {
      // Clear/blank states for a new independent grade
      setTempExamScore(gradingScale === 'literal' ? 'A' : 0);
      setTempExamSelections({});
      setTempRubricSelections({});
      setTempChecklistSelections({});
      setTempChecklist3LvlSelections({});
      setTempObservationSelections({});
      setTempObsComments('');
    }
  };

  // Helper to extract grade cell score
  const getCellScore = (studentId, evaluationId) => {
    const record = grades.find(g => g.studentId === studentId && g.evaluationId === evaluationId);
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

  // 5. Live Math Grade Computations inside modal
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
          if (sel === 'AD') totalPoints += 4;
          else if (sel === 'A') totalPoints += 3;
          else if (sel === 'B') totalPoints += 2;
          else if (sel === 'C') totalPoints += 1;
        }
      });

      if (selectionCount === 0) return"";
      const avg = totalPoints / selectionCount;

      if (isLiteral) {
        if (avg >= 3.5) return 'AD';
        if (avg >= 2.5) return 'A';
        if (avg >= 1.5) return 'B';
        return 'C';
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
              if (lvlObj.name === 'AD' || lvlObj.name === 'Siempre') points += 4;
              else if (lvlObj.name === 'A' || lvlObj.name === 'Frecuentemente') points += 3;
              else if (lvlObj.name === 'B' || lvlObj.name === 'A veces') points += 2;
              else if (lvlObj.name === 'C' || lvlObj.name === 'Nunca') points += 1;
            }
          }
        });
      });

      if (ratedCount === 0) return"";
      const avg = points / ratedCount;

      if (isLiteral) {
        if (avg >= 3.5) return 'AD';
        if (avg >= 2.5) return 'A';
        if (avg >= 1.5) return 'B';
        return 'C';
      } else {
        const scaleVal = gradingScale === '20' ? 20 : 10;
        return parseFloat(((avg / 4) * scaleVal));
      }
    }

    return"";
  }, [gradingEval, tempExamScore, tempExamSelections, tempRubricSelections, tempChecklistSelections, tempChecklist3LvlSelections, tempObservationSelections, gradingScale]);

  // Save the student grade for cell
  const handleSaveStudentGrade = () => {
    if (!gradingStudent || !gradingEval) return;

    if (liveCalculatedScore ==="") {
      alert("Por favor, registre el calificativo antes de guardar.");
      return;
    }

    const match = grades.find(g => g.studentId === gradingStudent.id && g.evaluationId === gradingEval.id);

    const payload = {
      studentId: gradingStudent.id,
      courseId: selectedCourseId,
      competenceId: selectedCompetenceId,
      evaluationId: gradingEval.id,
      instrument: gradingEval.type,
      score: liveCalculatedScore,
      bimester: selectedBimester,
      unit: selectedUnit,
      teacherId: currentRole === 'teacher' ? currentUser?.id : 'admin_1',
      lastKnownUpdate: match?.updatedAt || null,
      details: {
        examSelections: tempExamSelections,
        rubricSelections: tempRubricSelections,
        checklistSelections: tempChecklistSelections,
        checklist3LvlSelections: tempChecklist3LvlSelections,
        observationSelections: tempObservationSelections,
        obsComments: tempObsComments
      }
    };

    saveGrade(payload);
    setGradingStudent(null);
    setGradingEval(null);
  };

  const handleSaveCurrentStudentGradeSilent = () => {
    if (!gradingStudent || !gradingEval) return;
    if (liveCalculatedScore ==="") return; // Do not auto-save unfilled grade records

    const match = grades.find(g => g.studentId === gradingStudent.id && g.evaluationId === gradingEval.id);

    const payload = {
      studentId: gradingStudent.id,
      courseId: selectedCourseId,
      competenceId: selectedCompetenceId,
      evaluationId: gradingEval.id,
      instrument: gradingEval.type,
      score: liveCalculatedScore,
      bimester: selectedBimester,
      unit: selectedUnit,
      teacherId: currentRole === 'teacher' ? currentUser?.id : 'admin_1',
      lastKnownUpdate: match?.updatedAt || null,
      details: {
        examSelections: tempExamSelections,
        rubricSelections: tempRubricSelections,
        checklistSelections: tempChecklistSelections,
        checklist3LvlSelections: tempChecklist3LvlSelections,
        observationSelections: tempObservationSelections,
        obsComments: tempObsComments
      }
    };

    saveGrade(payload);
  };

  const handleNavToPreviousStudent = () => {
    if (enrolledStudents.length === 0) return;
    handleSaveCurrentStudentGradeSilent();

    const currentIndex = enrolledStudents.findIndex(s => s.id === gradingStudent.id);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = enrolledStudents.length - 1;
    }
    const prevStudent = enrolledStudents[prevIndex];
    handleOpenGradingCell(prevStudent, gradingEval);
  };

  const handleNavToNextStudent = () => {
    if (enrolledStudents.length === 0) return;
    handleSaveCurrentStudentGradeSilent();

    const currentIndex = enrolledStudents.findIndex(s => s.id === gradingStudent.id);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= enrolledStudents.length) {
      nextIndex = 0;
    }
    const nextStudent = enrolledStudents[nextIndex];
    handleOpenGradingCell(nextStudent, gradingEval);
  };

  // 6. Excel-like Competency Average calculation
  const calculateStudentOverallAverage = (studentId) => {
    if (activeEvaluations.length === 0) return '-';

    const scores = activeEvaluations.map(evalItem => {
      const g = grades.find(record => record.studentId === studentId && record.evaluationId === evalItem.id);
      return g ? g.score : null;
    }).filter(s => s !== null && s !== undefined && s !== '');

    if (scores.length === 0) return '-';
    const isLiteral = gradingScale === 'literal';

    if (isLiteral) {
      const points = scores.map(s => {
        if (s === 'AD') return 4;
        if (s === 'A') return 3;
        if (s === 'B') return 2;
        if (s === 'C') return 1;
        return null;
      }).filter(n => n !== null);

      if (points.length === 0) return '-';
      const avg = points.reduce((sum, val) => sum + val, 0) / points.length;

      if (avg >= 3.5) return 'AD';
      if (avg >= 2.5) return 'A';
      if (avg >= 1.5) return 'B';
      return 'C';
    } else {
      const numericScores = scores.map(s => parseFloat(s)).filter(n => !isNaN(n));
      if (numericScores.length === 0) return '-';
      return (numericScores.reduce((sum, val) => sum + val, 0) / numericScores.length);
    }
  };

  // 6.b Promedios por Competencia para el Consolidado
  const getCompetenceAverage = (studentId, competenceId) => {
    const compEvals = evaluations.filter(e => 
      e.courseId === selectedCourseId &&
      e.competenceId === competenceId &&
      (e.bimester || '1') === selectedBimester &&
      (e.unit !== undefined && e.unit !== null ? String(e.unit) : '0') === String(selectedUnit) &&
      !e.isReinforcement
    );

    if (compEvals.length === 0) return '-';

    const scores = compEvals.map(evalItem => {
      const g = grades.find(record => record.studentId === studentId && record.evaluationId === evalItem.id);
      return g ? g.score : null;
    }).filter(s => s !== null && s !== undefined && s !== '');

    if (scores.length === 0) return '-';
    const isLiteral = gradingScale === 'literal';

    if (isLiteral) {
      const points = scores.map(s => {
        if (s === 'AD') return 4;
        if (s === 'A') return 3;
        if (s === 'B') return 2;
        if (s === 'C') return 1;
        return null;
      }).filter(n => n !== null);

      if (points.length === 0) return '-';
      const avg = points.reduce((sum, val) => sum + val, 0) / points.length;

      if (avg >= 3.5) return 'AD';
      if (avg >= 2.5) return 'A';
      if (avg >= 1.5) return 'B';
      return 'C';
    } else {
      const numericScores = scores.map(s => parseFloat(s)).filter(n => !isNaN(n));
      if (numericScores.length === 0) return '-';
      return (numericScores.reduce((sum, val) => sum + val, 0) / numericScores.length);
    }
  };

  const getCompetenceReinforcementAverage = (studentId, competenceId) => {
    const compReinEvals = evaluations.filter(e => 
      e.courseId === selectedCourseId &&
      e.competenceId === competenceId &&
      (e.bimester || '1') === selectedBimester &&
      e.isReinforcement === true
    );

    if (compReinEvals.length === 0) return '-';

    const scores = compReinEvals.map(evalItem => {
      const record = reinforcementGrades.find(g => 
        g.studentId === studentId && 
        g.evaluationId === evalItem.id &&
        String(g.bimester || '1') === String(selectedBimester)
      );
      return record && record.score !== undefined && record.score !== '' ? record.score : null;
    }).filter(s => s !== null);

    if (scores.length === 0) return '-';
    const isLiteral = gradingScale === 'literal';

    if (isLiteral) {
      const points = scores.map(s => {
        if (s === 'AD') return 4;
        if (s === 'A') return 3;
        if (s === 'B') return 2;
        if (s === 'C') return 1;
        return null;
      }).filter(n => n !== null);

      if (points.length === 0) return '-';
      const avg = points.reduce((sum, val) => sum + val, 0) / points.length;

      if (avg >= 3.5) return 'AD';
      if (avg >= 2.5) return 'A';
      if (avg >= 1.5) return 'B';
      return 'C';
    } else {
      const numericScores = scores.map(s => parseFloat(s)).filter(n => !isNaN(n));
      if (numericScores.length === 0) return '-';
      return (numericScores.reduce((sum, val) => sum + val, 0) / numericScores.length);
    }
  };

  const getFinalCompetenceGrade = (regAvg, reinfAvg) => {
    if (regAvg === '-') return '-';
    if (reinfAvg === '-') return regAvg;

    const isLiteral = gradingScale === 'literal';
    if (isLiteral) {
      const valMap = { 'AD': 4, 'A': 3, 'B': 2, 'C': 1 };
      const regVal = valMap[regAvg] || 0;
      const reinfVal = valMap[reinfAvg] || 0;
      return reinfVal > regVal ? reinfAvg : regAvg;
    } else {
      const regNum = parseFloat(regAvg);
      const reinfNum = parseFloat(reinfAvg);
      if (!isNaN(regNum) && !isNaN(reinfNum)) {
        return reinfNum > regNum ? reinfNum : regAvg;
      }
      return regAvg;
    }
  };

  // 6.c Exportación del Consolidado a Excel
  const handleExportConsolidatedExcel = async () => {
    if (!activeCourse) return alert('Seleccione un curso para exportar.');

    try {
      const response = await axios.post('/api/excel/export-consolidated', {
        courseName: activeCourse.name,
        gradeLevel: `${selectedGrade} - Secc. ${selectedSection}`,
        bimester: selectedBimester,
        unit: selectedUnit,
        competencies: activeCourse.competencies || [],
        students: enrolledStudents,
        grades: grades.filter(g => 
          g.courseId === selectedCourseId &&
          (g.bimester ||"1") === selectedBimester &&
          (g.unit !== undefined && g.unit !== null ? String(g.unit) :"0") === selectedUnit
        ),
        reinforcementGrades: [], // Refuerzo excluded from consolidado per user request
        evaluations: evaluations.filter(e => e.courseId === selectedCourseId),
        gradingScale
      }, { responseType: 'blob' });

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Consolidado_Competencias_${activeCourse.name.replace(/\s+/g, '_')}_B${selectedBimester}_U${selectedUnit}.xlsx`;
      link.click();
    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Error al generar el reporte del consolidado en Excel.');
    }
  };

  // 6.d Exportar/Importar notas de una evaluación específica
  const handleExportEvalGrades = async (evalItem) => {
    try {
      const evalGrades = grades.filter(g => g.evaluationId === evalItem.id);
      const response = await axios.post('/api/excel/export-evaluation-grades', {
        evaluation: evalItem,
        students: enrolledStudents,
        grades: evalGrades
      }, { responseType: 'blob' });

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Notas_${evalItem.name.replace(/\s+/g, '_')}.xlsx`;
      link.click();
    } catch (error) {
      console.error('Failed to export evaluation grades:', error);
      alert('Error al exportar calificaciones del instrumento a Excel.');
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

      const confirmed = window.confirm(`Se encontraron ${count} calificaciones. ¿Deseas importarlas?`);
      if (!confirmed) return;

      // Match students by DNI/nombre y preparar batch
      const batchPayloads = [];
      parsedGrades.forEach(pg => {
        const student = enrolledStudents.find(s => s.dni === pg.dni || s.name === pg.name);
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
          unit: selectedUnit,
          details: pg.details
        });
      });

      // Un solo save al servidor para todo el lote (evita rate limiting con 500+ notas)
      const saved = saveGradesBatch(batchPayloads);
      alert(`Importación completada: ${saved} calificaciones guardadas.`);
    } catch (error) {
      console.error('Failed to import evaluation grades:', error);
      alert('Error al importar calificaciones. Verifica que el archivo tenga el formato correcto.');
    } finally {
      setImportingEvalId(null);
      e.target.value = '';
    }
  };

  // 6.f Backup/Restore completo
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
      alert('Error al generar el backup completo.');
    }
  };

  const [restoringBackup, setRestoringBackup] = useState(false);

  const handleBackupFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoringBackup(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('existingGrades', JSON.stringify(grades));

      const response = await axios.post('/api/excel/import-full-backup', formData);
      const { missingCount, grades: missingGrades, totalInBackup, backupInfo } = response.data;

      if (missingCount === 0) {
        alert(`✅ Backup verificado: las ${totalInBackup} calificaciones ya existen. No hay nada que restaurar.`);
        return;
      }

      const proceed = window.confirm(
        `Backup del ${new Date(backupInfo.exportedAt).toLocaleDateString('es-PE')}\n` +
        `Total en backup: ${totalInBackup}\n` +
        `Ya existentes: ${totalInBackup - missingCount}\n` +
        `Faltantes por restaurar: ${missingCount}\n\n` +
        `¿Restaurar solo las ${missingCount} calificaciones faltantes?\n` +
        `(No se sobrescribirá ninguna nota existente)`
      );
      if (!proceed) return;

      let saved = 0;
      let skipped = 0;
      missingGrades.forEach(pg => {
        const student = contextStudents.find(s => s.id === pg.studentId);
        if (!student) { skipped++; return; }

        const evalObj = evaluations.find(e => e.id === pg.evaluationId);
        if (!evalObj) { skipped++; return; }

        saveGrade({
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

      alert(
        `✅ Restauración completada:\n` +
        `  • ${saved} calificaciones restauradas\n` +
        (skipped > 0 ? `  • ${skipped} omitidas (sin estudiante/evaluación)\n` : '') +
        `  • ${totalInBackup - missingCount} ya existían (sin cambios)`
      );
    } catch (error) {
      console.error('Failed to restore backup:', error);
      alert('Error al restaurar backup. Verifica que el archivo sea un backup válido (.json).');
    } finally {
      setRestoringBackup(false);
      e.target.value = '';
    }
  };

  // 6.g Importar Notas Logic
  const handleProcessImportRawText = (text) => {
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const firstLine = lines[0];
    let sep = '\t';
    if (firstLine.includes('\t')) sep = '\t';
    else if (firstLine.includes(';')) sep = ';';
    else if (firstLine.includes(',')) sep = ',';

    const rows = lines.map(l => l.split(sep).map(c => c.trim()));
    setParsedRows(rows);

    const firstRow = rows[0];
    const newMappings = {};
    
    firstRow.forEach((cell, idx) => {
      const cleanCell = cell.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      if (cleanCell.includes('dni') || cleanCell.includes('documento') || /^\d{8}$/.test(cell)) {
        newMappings[idx] = 'dni';
      } else if (cleanCell.includes('nombre') || cleanCell.includes('apellido') || cleanCell.includes('estudiante') || cleanCell.includes('alumno')) {
        newMappings[idx] = 'name';
      } else if (cleanCell.includes('nota') || cleanCell.includes('calif') || cleanCell.includes('score') || cleanCell.includes('eval') || ['ad','a','b','c'].includes(cell.toLowerCase())) {
        newMappings[idx] = 'grade';
      } else {
        if (idx === 0) newMappings[idx] = 'dni';
        else if (idx === 1) newMappings[idx] = 'name';
        else if (idx === 2) newMappings[idx] = 'grade';
        else newMappings[idx] = 'ignore';
      }
    });

    setColumnMappings(newMappings);
  };

  useEffect(() => {
    handleProcessImportRawText(importRawText);
  }, [importRawText]);

  const importPreview = useMemo(() => {
    if (parsedRows.length === 0) return [];

    const dniColIndex = Object.keys(columnMappings).find(k => columnMappings[k] === 'dni');
    const nameColIndex = Object.keys(columnMappings).find(k => columnMappings[k] === 'name');
    const gradeColIndex = Object.keys(columnMappings).find(k => columnMappings[k] === 'grade');

    const cleanName = (str) => {
      if (!str) return '';
      return str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"")
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    return parsedRows.map((row, rIdx) => {
      const rowDni = dniColIndex !== undefined ? row[dniColIndex] : '';
      const rowName = nameColIndex !== undefined ? row[nameColIndex] : '';
      const rowGrade = gradeColIndex !== undefined ? row[gradeColIndex] : '';

      let student = null;
      let method = 'none';

      if (rowDni) {
        const cleanD = rowDni.replace(/[^0-9]/g, '');
        if (cleanD.length === 8) {
          student = enrolledStudents.find(s => s.dni === cleanD);
          if (student) method = 'dni';
        }
      }

      if (!student && rowName) {
        const cleanRN = cleanName(rowName);
        student = enrolledStudents.find(s => cleanName(s.name) === cleanRN);
        if (student) method = 'name_exact';
      }

      if (!student && rowName) {
        const cleanRN = cleanName(rowName);
        const rowWords = cleanRN.split(' ').filter(w => w.length > 2);
        if (rowWords.length > 0) {
          let bestMatch = null;
          let maxScore = 0;

          enrolledStudents.forEach(s => {
            const sClean = cleanName(s.name);
            const sWords = sClean.split(' ');
            let score = 0;
            rowWords.forEach(w => {
              if (sWords.includes(w)) score += 2;
              else if (sClean.includes(w)) score += 1;
            });

            if (score > maxScore) {
              maxScore = score;
              bestMatch = s;
            }
          });

          if (maxScore >= 3) {
            student = bestMatch;
            method = 'name_fuzzy';
          }
        }
      }

      let validGrade = rowGrade;
      const isLiteral = gradingScale === 'literal';
      if (isLiteral) {
        const upper = String(rowGrade).toUpperCase().trim();
        if (['AD', 'A', 'B', 'C'].includes(upper)) {
          validGrade = upper;
        } else {
          validGrade = '';
        }
      } else {
        const parsedGrade = parseFloat(rowGrade);
        const limit = parseFloat(gradingScale);
        if (!isNaN(parsedGrade) && parsedGrade >= 0 && parsedGrade <= limit) {
          validGrade = parsedGrade;
        } else {
          validGrade = '';
        }
      }

      return {
        rowIndex: rIdx,
        rowDni,
        rowName,
        rowGrade,
        validGrade,
        student,
        method,
        status: student ? (method === 'dni' || method === 'name_exact' ? 'success' : 'warning') : 'danger'
      };
    });
  }, [parsedRows, columnMappings, enrolledStudents, gradingScale]);

  const handleApplyImport = async () => {
    if (importPreview.length === 0) return alert('No hay registros para importar.');
    if (!importTargetEvalId) return alert('Seleccione una columna de evaluación de destino.');

    let targetEvalId = importTargetEvalId;

    if (importTargetEvalId === 'new') {
      if (!newImportEvalName.trim()) return alert('Ingrese un nombre para la nueva actividad.');
      
      const newEval = {
        courseId: selectedCourseId,
        competenceId: selectedCompetenceId,
        capacityId: newImportEvalCapacityId || null,
        bimester: selectedBimester,
        unit: selectedUnit,
        name: newImportEvalName.trim(),
        type: newImportEvalType,
        instrumentConfig: createDefaultInstrumentConfig(newImportEvalType)
      };

      const saved = saveEvaluation(newEval);
      targetEvalId = saved.id;
    }

    let count = 0;
    importPreview.forEach(item => {
      if (item.student && item.validGrade !== '') {
        const match = grades.find(g => g.studentId === item.student.id && g.evaluationId === targetEvalId);
        const payload = {
          studentId: item.student.id,
          courseId: selectedCourseId,
          competenceId: selectedCompetenceId,
          evaluationId: targetEvalId,
          instrument: 'Examen', 
          score: item.validGrade,
          bimester: selectedBimester,
          unit: selectedUnit,
          teacherId: currentRole === 'teacher' ? currentUser?.id : 'admin_1',
          lastKnownUpdate: match?.updatedAt || null,
          details: {
            rubricSelections: {},
            checklistSelections: {},
            observationSelections: {},
            obsComments: 'Nota cargada por importador flexible'
          }
        };
        saveGrade(payload);
        count++;
      }
    });

    setImportFeedback({
      success: true,
      message: `Se importaron ${count} calificaciones correctamente en la actividad.`
    });

    setTimeout(() => {
      setShowImportModal(false);
      setImportRawText('');
      setImportFeedback(null);
    }, 2000);
  };

  // 7. Config Instrument Details (Templates Editor)
  const handleSaveEvalConfig = () => {
    if (!editingEvalConfig) return;
    saveEvaluation(editingEvalConfig);
    setEditingEvalConfig(null);
  };

  // Export to Excel report
  const handleExportExcel = async () => {
    if (!activeCourse) return alert('Seleccione un curso para exportar.');

    try {
      const response = await axios.post('/api/excel/export-grades', {
        courseName: activeCourse.name,
        gradeLevel: `${selectedGrade} - Secc. ${selectedSection}`,
        bimester: selectedBimester,
        unit: selectedUnit,
        competencies: activeCourse.competencies || [],
        students: enrolledStudents,
        grades: grades.filter(g => 
          g.courseId === selectedCourseId &&
          (g.bimester ||"1") === selectedBimester &&
          (g.unit !== undefined && g.unit !== null ? String(g.unit) :"0") === selectedUnit
        )
      }, { responseType: 'blob' });

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Reporte_Notas_${activeCourse.name.replace(/\s+/g, '_')}_B${selectedBimester}_U${selectedUnit}.xlsx`;
      link.click();
    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Error al generar el reporte en Excel.');
    }
  };

  return (
    <div className="space-y-6">
      
      
      {/* Contextual Header Portaled to ClassroomManager */}
      {(() => {
        const portalTarget = document.getElementById('classroom-context-header-slot');
        const headerContent = (
          <div className="flex flex-col gap-3 w-full">
{/* Selectors */}
      <div className="glass-card-ecc border border-white/10 p-6 space-y-4">
        {!isEmbedded ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Grado de Estudios</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => {
                    setSelectedGrade(e.target.value);
                    setSelectedCourseId('');
                  }}
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm font-semibold"
                >
                  <option value="Todas">Todos los Grados</option>
                  {availableGrades.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Curso / Materia</label>
                <select 
                  value={selectedCourseId} 
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm font-semibold"
                >
                  <option value="">Seleccione Curso</option>
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
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Competencia a Evaluar</label>
                {viewMode === 'consolidado' ? (
                  <div className="w-full rounded-lg border border-white/10 bg-white/10/60 px-3.5 py-2.5 text-sm font-bold   text-kinetic-cyan dark:text-cyan-300 italic">
                    Todas las Competencias
                  </div>
                ) : (
                  <select 
                    value={selectedCompetenceId} 
                    onChange={(e) => setSelectedCompetenceId(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm font-semibold"
                  >
                    {activeCourse?.competencies?.map(comp => (
                      <option key={comp.id} value={comp.id}>{comp.name}</option>
                    ))}
                    {!activeCourse?.competencies?.length && <option value="">Sin competencias configuradas</option>}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/10">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Sección del Aula</label>
                <select 
                  value={selectedSection} 
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm font-semibold"
                >
                  <option value="Todas">Todas las Secciones</option>
                  {availableSections.map(s => (
                    <option key={s} value={s}>Sección {s}</option>
                  ))}
                </select>
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

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Unidad de Aprendizaje</label>
                <select 
                  value={selectedUnit} 
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm font-semibold"
                >
                  {unitOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Competencia a Evaluar</label>
              <select 
                value={selectedCompetenceId} 
                onChange={(e) => setSelectedCompetenceId(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm font-semibold   font-bold text-kinetic-cyan dark:text-cyan-300"
              >
                {activeCourse?.competencies?.map(comp => (
                  <option key={comp.id} value={comp.id}>{comp.name}</option>
                ))}
                {!activeCourse?.competencies?.length && <option value="">Sin competencias configuradas</option>}
              </select>
            </div>
            <div className="flex items-center gap-3 shrink-0 mt-5 md:mt-6">
              <button
                onClick={handleFullBackup}
                className="border border-[#3b82f6]/80 hover:bg-blue-500/10 dark:hover:bg-blue-950/20 text-[#3b82f6] bg-transparent  rounded-2xl px-4 py-2.5 flex items-center gap-2 text-[10px] sm:text-xs font-black transition-all active:scale-95 shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-blue-500/10"
                title="Respalda TODAS las calificaciones con detalles (claves, rúbricas, listas) en un archivo JSON"
              >
                <Download className="h-4 w-4" />
                Backup Completo
              </button>
              <button
                onClick={() => backupFileInputRef.current?.click()}
                className="border border-[#8b5cf6]/80 hover:bg-violet-500/10 dark:hover:bg-violet-950/20 text-[#8b5cf6] bg-transparent  rounded-2xl px-4 py-2.5 flex items-center gap-2 text-[10px] sm:text-xs font-black transition-all active:scale-95 shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-violet-500/10"
                title="Restaura solo las calificaciones faltantes desde un backup (no sobrescribe)"
              >
                <Upload className="h-4 w-4" />
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
        )}
      </div>

                </div>
        );
        return isEmbedded && portalTarget ? createPortal(headerContent, portalTarget) : headerContent;
      })()}
{/* Tabs de Navegación de Vistas */}
      <div className="flex border-b border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50/80 gap-1">
        <button
          onClick={() => setViewMode('auxiliar')}
          className={`px-5 py-3 text-xs font-bold border-b-2 uppercase tracking-wider transition-all ${
            viewMode === 'auxiliar'
              ? 'border-kinetic-cyan text-kinetic-cyan dark:text-cyan-300 font-extrabold'
              : 'border-transparent text-slate-400  hover:text-slate-650'
          }`}
        >
          Registro Auxiliar
        </button>
        <button
          onClick={() => setViewMode('consolidado')}
          className={`px-5 py-3 text-xs font-bold border-b-2 uppercase tracking-wider transition-all ${
            viewMode === 'consolidado'
              ? 'border-kinetic-cyan text-kinetic-cyan dark:text-cyan-300 font-extrabold'
              : 'border-transparent text-slate-400  hover:text-slate-650'
          }`}
        >
          Consolidado de Competencias
        </button>
      </div>

      {/* Spreadsheet Grid Panel */}
      <div className="glass-card-ecc border border-white/10 p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-kinetic-cyan" />
            <h4 className="text-lg font-bold">Cuadrícula de Evaluaciones</h4>
          </div>
          
          {selectedCourseId && selectedCompetenceId && (
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setShowCurriculumMap(!showCurriculumMap)}
                className={`btn-neuro-secondary flex items-center gap-1.5 text-xs py-2 px-3 transition hover:scale-105 active:scale-95 ${showCurriculumMap ? 'bg-white/5 bg-white/5 text-cyan-400 dark:text-cyan-200 border-kinetic-cyan/50' : ''}`}
              >
                <Info className="h-4 w-4" />
                {showCurriculumMap ? 'Ocultar Currículo' : 'Ver Mapa Curricular'}
              </button>
              {activeEvaluations.length === 0 && (
                <button 
                  onClick={handleAutoGenerateEvaluations}
                  className="btn-neuro-success flex items-center gap-1.5 text-xs py-2 px-3 hover:scale-105 active:scale-95 transition-transform"
                >
                  <Sparkles className="h-4 w-4" />
                  Cargar Demo
                </button>
              )}
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn-neuro-primary flex items-center gap-1.5 text-xs py-2 px-3 hover:scale-105 active:scale-95 transition-transform"
              >
                <Plus className="h-4 w-4" />
                Nueva Actividad
              </button>
            </div>
          )}
        </div>

        {/* Spreadsheet         {/* Spreadsheet / Curriculum Split Layout */}
        {viewMode === 'consolidado' ? (
          <div className="w-full overflow-hidden space-y-4">
            {/* Consolidado Spreadsheet */}
            <div className="overflow-x-auto rounded-2xl border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 overflow-hidden">
              <table className="w-full border-collapse text-left text-sm text-slate-400">
                <thead className="bg-white/10 text-xs font-bold uppercase text-slate-200">
                  <tr>
                    <th className="p-2 w-12 text-center">
                      <div className="glass-panel rounded-full px-2 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                        N°
                      </div>
                    </th>
                    <th className="p-2 w-32">
                      <div className="glass-panel rounded-full px-3 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                        Estudiante
                      </div>
                    </th>
                    <th className="p-2 w-20 text-center">
                      <div className="glass-panel rounded-full px-2 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                        DNI
                      </div>
                    </th>
                    
                    {activeCourse?.competencies?.map((comp, idx) => (
                      <th key={comp.id} className="p-2 text-center w-10 min-w-[70px]" title={comp.name}>
                        <div className="glass-panel rounded-full px-2 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)] text-center">
                          <span className="font-extrabold text-white dark:text-white block truncate max-w-[120px]">
                            C{idx + 1}
                          </span>
                        </div>
                      </th>
                    ))}
                    {(!activeCourse?.competencies || activeCourse.competencies.length === 0) && (
                      <th className="p-2 text-center italic text-slate-400 normal-case">
                        <div className="glass-panel rounded-full px-3 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                          Sin competencias asignadas
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {enrolledStudents.length === 0 ? (
                    <tr>
                      <td colSpan={3 + (activeCourse?.competencies?.length || 0)} className="px-6 py-10 text-center text-slate-400 italic">
                        No se encontraron estudiantes matriculados.
                      </td>
                    </tr>
                  ) : (
                    enrolledStudents.map((std, idx) => (
                      <tr key={std.id} className="hover:bg-white/5/50  transition">
                        <td className="px-3 py-3 font-bold text-slate-400 border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 text-center">{idx + 1}</td>
                        <td className="px-3 py-3 font-semibold text-white  border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50">
                          <div className="flex items-center gap-2.5">
                            <img src={std.avatar} alt={std.name} className="h-7 w-7 rounded-full object-cover border border-white/10" />
                            <span className="font-bold text-xs">{std.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-xs font-semibold border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 text-center">{std.dni}</td>
                        
                        {activeCourse?.competencies?.map((comp) => {
                          const regAvg = getCompetenceAverage(std.id, comp.id);
                          const reinfAvg = getCompetenceReinforcementAverage(std.id, comp.id);
                          const finalGrade = regAvg;
                          
                          const getGradeClass = (grade, highlight = false) => {
                            if (grade === '-') return 'text-slate-400 font-black text-sm';
                            if (grade === 'AD') return highlight ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-black px-3 py-1 rounded-lg text-sm' : 'text-emerald-600 dark:text-emerald-400 font-black text-sm';
                            if (grade === 'A') return highlight ? 'bg-white/5 text-cyan-400 bg-white/5 dark:text-cyan-200 font-black px-3 py-1 rounded-lg text-sm' : 'text-kinetic-cyan font-black text-sm';
                            if (grade === 'B') return highlight ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-950/40 font-black px-3 py-1 rounded-lg text-sm' : 'text-amber-555 font-black text-sm';
                            if (grade === 'C') return highlight ? 'bg-rose-500/10 text-rose-700 dark:bg-rose-950/40 font-black px-3 py-1 rounded-lg text-sm' : 'text-rose-550 dark:text-rose-500 font-black text-sm';
                            
                            const num = parseFloat(grade);
                            const isPass = gradingScale === '20' ? num >= 11.0 : num >= 6.0;
                            if (isPass) {
                              return highlight ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 font-black px-3 py-1 rounded-lg text-sm' : 'text-emerald-500 font-black text-sm';
                            }
                            return highlight ? 'bg-rose-500/10 text-rose-700 dark:bg-rose-950/40 font-black px-3 py-1 rounded-lg text-sm' : 'text-rose-550 dark:text-rose-450 font-black text-sm';
                          };

                          return (
                            <td key={comp.id} className="px-2 py-2.5 text-center border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 bg-emerald-50/5">
                              <span className={getGradeClass(finalGrade, true)}>
                                {finalGrade}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
            <div className="flex-1 w-full overflow-hidden space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50">
                <table className="w-full border-collapse text-left text-sm text-slate-400">
                  <thead className="bg-white/10 text-xs font-bold uppercase text-slate-200">
                    <tr>
                      <th className="p-2 w-10 text-center">
                        <div className="glass-panel rounded-full px-2 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                          N°
                        </div>
                      </th>
                      <th className="p-2 min-w-[120px]">
                        <div className="glass-panel rounded-full px-3 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                          Estudiante
                        </div>
                      </th>
                      <th className="p-2 w-20 text-center">
                        <div className="glass-panel rounded-full px-2 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                          DNI
                        </div>
                      </th>
                      
                      {/* Active Custom Evaluations columns */}
                      {activeEvaluations.map(evalItem => (
                        <th key={evalItem.id} className="p-2 text-center min-w-[80px]">
                          <div className="bg-transparent  rounded-lg p-3 border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50  flex flex-col items-center justify-between h-full gap-2">
                            <span className="font-bold text-white dark:text-white" title={evalItem.name}>
                              {evalItem.name}
                            </span>
                            <span className="text-[9px] bg-white/5 bg-white/5 px-1.5 py-0.5 rounded font-mono text-kinetic-cyan dark:text-cyan-200 font-bold uppercase">
                              {evalItem.type}
                            </span>
                            {evalItem.capacityId && (() => {
                              const cap = activeCompetence?.capacities?.find(c => c.id === evalItem.capacityId);
                              if (!cap) return null;
                              return (
                                <span className="text-[9px] text-slate-400  font-semibold max-w-[125px] truncate mt-0.5" title={cap.name}>
                                  Cap: {cap.name}
                                </span>
                              );
                            })()}
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
                                onClick={() => handleExportEvalGrades(evalItem)}
                                title="Exportar a Excel"
                                className="p-1 hover:bg-white/20  rounded text-slate-400 hover:text-emerald-500 transition"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => handleImportEvalGrades(evalItem)}
                                title="Importar desde Excel"
                                className="p-1 hover:bg-white/20  rounded text-slate-400 hover:text-amber-500 transition"
                              >
                                <Upload className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  if(window.confirm(`¿Deseas eliminar la columna"${evalItem.name}" y todas sus calificaciones?`)) {
                                    deleteEvaluation(evalItem.id);
                                  }
                                }}
                                title="Eliminar Columna"
                                className="p-1 hover:bg-white/20  rounded text-slate-400 hover:text-rose-500 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </th>
                      ))}
 
                      {activeEvaluations.length === 0 && (
                        <th className="p-2 text-center italic text-slate-400 normal-case">
                          <div className="glass-panel rounded-full px-3 py-2 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                            Sin actividades evaluativas
                          </div>
                        </th>
                      )}
 
                      <th className="p-2 text-center w-20">
                        <div className="bg-white/5 bg-white/5 rounded-lg px-2 py-2 border border-indigo-200/80 dark:border-indigo-900/60  text-cyan-400 dark:text-cyan-200 font-bold">
                          Consolidado
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {enrolledStudents.length === 0 ? (
                      <tr>
                        <td colSpan={4 + activeEvaluations.length} className="px-6 py-10 text-center text-slate-400 font-semibold italic space-y-2">
                          <p className="text-slate-400">No se encontraron estudiantes matriculados en esta sección.</p>
                          <p className="text-xs text-slate-400 font-normal mt-1 block">
                            (Grado seleccionado: <strong className="text-slate-300">{selectedGrade}</strong>, 
                            Filtro de sección seleccionado: <strong className="text-slate-300">{selectedSection}</strong>)
                          </p>
                          <p className="text-[11px] text-slate-400 font-normal mt-1.5 block">
                            Tip: Asegúrese de que los alumnos importados tengan asignado el grado y sección correspondientes en su ficha de estudiante.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      enrolledStudents.map((std, idx) => {
                        const finalAvg = calculateStudentOverallAverage(std.id);

                        return (
                          <tr key={std.id} className="hover:bg-white/5/50  transition">
                            <td className="px-4 py-3 font-bold text-slate-400 border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50">{idx + 1}</td>
                            <td className="px-4 py-3 font-semibold text-white  border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50">
                              <div className="flex items-center gap-2.5">
                                <img src={std.avatar} alt={std.name} className="h-7 w-7 rounded-full object-cover border border-white/10" />
                                <div>
                                  <p className="font-bold text-xs">{std.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs font-semibold border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50">{std.dni}</td>

                            {/* Cells of evaluations */}
                            {activeEvaluations.map(evalItem => {
                              const score = getCellScore(std.id, evalItem.id);

                              return (
                                <td
                                  key={evalItem.id}
                                  onClick={() => handleOpenGradingCell(std, evalItem)}
                                  className="px-2 py-2.5 text-center border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 transition-colors cursor-pointer hover:bg-white/5/25 dark:hover:bg-indigo-950/10"
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

                            {activeEvaluations.length === 0 && (
                              <td className="px-4 py-3 border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 text-center text-slate-350  italic text-xs">
                                Pulse 'Nueva Actividad'
                              </td>
                            )}

                            {/* Overall average */}
                            <td className="px-3 py-2.5 text-center border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 bg-white/5 dark:bg-indigo-950/5">
                              <span className={`px-3.5 py-1.5 rounded-lg text-sm font-black ${
                                finalAvg === 'AD' ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                                finalAvg === 'A' ? 'bg-white/5 text-cyan-400 bg-white/5 dark:text-cyan-200' :
                                finalAvg === 'B' ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-950/40' :
                                finalAvg === 'C' ? 'bg-rose-500/10 text-rose-700 dark:bg-rose-950/40' :
                                typeof finalAvg === 'number' && finalAvg >= (gradingScale === '20' ? 11.0 : 6.0) ? 'bg-white/5 text-cyan-400 bg-white/5' :
                                typeof finalAvg === 'number' && finalAvg < (gradingScale === '20' ? 11.0 : 6.0) ? 'bg-rose-500/10 text-rose-700 dark:bg-rose-950/40' :
                                'bg-white/5 text-slate-400'
                              }`}>
                                {finalAvg}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {activeEvaluations.length === 0 && selectedCourseId && selectedCompetenceId && (
                <div className="flex flex-col items-center justify-center p-8 bg-white/5  rounded-2xl border border-dashed border-slate-350 text-center space-y-3 mt-4 animate-in fade-in duration-200">
                  <ClipboardCheck className="h-10 w-10 text-kinetic-cyan animate-pulse" />
                  <h5 className="font-bold text-sm text-slate-200">No hay actividades evaluativas creadas</h5>
                  <p className="text-xs text-slate-400 max-w-sm">Para calificar a los alumnos en esta competencia, cree una nueva actividad o cargue el conjunto preconfigurado de demostración.</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleAutoGenerateEvaluations}
                      className="btn-neuro-success text-xs py-1.5 px-3 flex items-center gap-1 hover:scale-105 active:scale-95 transition-transform"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Cargar Demo
                    </button>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="btn-neuro-primary text-xs py-1.5 px-3 flex items-center gap-1 hover:scale-105 active:scale-95 transition-transform"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Nueva Actividad
                    </button>
                  </div>
                </div>
              )}
            </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleFileSelected}
              />

              {showCurriculumMap && (
              <div className="w-full lg:w-80 shrink-0 bg-white/5  p-4 rounded-2xl border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 space-y-4 h-[600px] overflow-y-auto animate-in slide-in-from-right-4 duration-200">
                <div className="flex justify-between items-center border-b border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 pb-2.5">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-200  flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-kinetic-cyan" />
                    Mapa Curricular
                  </h5>
                  <button 
                    type="button"
                    onClick={() => setShowCurriculumMap(false)}
                    className="text-slate-400 hover:text-slate-300  text-xs font-bold"
                  >
                    Ocultar
                  </button>
                </div>

                {activeCompetence ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-kinetic-cyan uppercase tracking-widest block">Competencia</span>
                      <p className="text-xs font-bold text-slate-200  leading-snug">{activeCompetence.name}</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Capacidades e Indicadores</span>
                      
                      {activeCompetence.capacities && activeCompetence.capacities.map(cap => (
                        <div key={cap.id} className="space-y-2 bg-transparent  p-3 rounded-lg border border-white/10/50  text-xs">
                          <div className="flex items-start gap-1.5">
                            <span className="text-[9px] font-extrabold bg-white/5 text-cyan-400 dark:text-cyan-200 px-1.5 py-0.5 rounded shrink-0">Capacidad</span>
                            <span className="font-bold text-white  leading-tight">{cap.name}</span>
                          </div>

                          <div className="pl-3 border-l border-kinetic-cyan/30 dark:border-indigo-900/60 space-y-1.5 mt-1.5">
                            {cap.desempenos && cap.desempenos.map(des => (
                              <div key={des.id} className="text-[11px] text-slate-400  leading-relaxed">
                                • {des.description}
                              </div>
                            ))}
                            {(!cap.desempenos || cap.desempenos.length === 0) && (
                              <span className="text-[10px] text-slate-400 italic">Sin desempeños definidos</span>
                            )}
                          </div>
                        </div>
                      ))}

                      {(!activeCompetence.capacities || activeCompetence.capacities.length === 0) && (
                        <span className="text-xs text-slate-400 italic block">No hay capacidades configuradas en esta competencia.</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 italic">
                    Seleccione una competencia para visualizar su mapa.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: Create Evaluation Column */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card-ecc border border-white/10 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-white/10  pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-kinetic-cyan" />
                Crear Actividad Evaluativa
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvaluation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Nombre de la Actividad</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: Tarea 1: Ensayos, Exposición 2..."
                  value={newEvalName} 
                  onChange={(e) => setNewEvalName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2 text-sm focus:border-kinetic-cyan"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Capacidad Evaluada (CNEB)</label>
                <select 
                  value={newEvalCapacityId} 
                  onChange={(e) => setNewEvalCapacityId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2.5 text-sm font-semibold"
                >
                  <option value="">Ninguna (Evaluación General)</option>
                  {activeCompetence?.capacities?.map(cap => (
                    <option key={cap.id} value={cap.id}>{cap.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Instrumento de Registro</label>
                <select 
                  value={newEvalType} 
                  onChange={(e) => setNewEvalType(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2 text-sm font-semibold"
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

      {/* MODAL 2: Config/Edit Evaluation Instrument Config */}
      {editingEvalConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-card-ecc border border-white/10 max-w-2xl w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-white/10  pb-3">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Settings className="h-5 w-5 text-kinetic-cyan" />
                  Editar Instrumento: {editingEvalConfig.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Añade, edita o quita criterios e indicadores según las necesidades del instrumento.</p>
              </div>
              <button onClick={() => setEditingEvalConfig(null)} className="text-slate-400 hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Config viewport depending on Instrument Type */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              
              {/* RUBRIC CONFIG */}
              {editingEvalConfig.type === 'Rubrica' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-400">Criterios de la Rúbrica</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newCrit = {
                          id: `crit_${Date.now()}`,
                          criteria: 'Nuevo Criterio',
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
                    {editingEvalConfig.instrumentConfig?.criteriaList?.map((crit, idx) => {
                      const colors = ['border-blue-500/30', 'border-purple-500/30', 'border-emerald-500/30', 'border-amber-500/30'];
                      const borderColor = colors[idx % colors.length];

                      return (
                        <div key={crit.id} className={`p-4 bg-transparent  rounded-2xl border ${borderColor} space-y-3.5 `}>
                          <div className="flex justify-between items-center gap-3">
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
                              className="flex-1 font-black text-xs bg-white/5  px-3 py-2 rounded-lg border border-white/10/80 focus:border-kinetic-cyan focus:bg-transparent transition"
                              placeholder="Nombre del Criterio..."
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

                          {/* Descriptors inputs */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {['AD', 'A', 'B', 'C'].map(level => (
                              <div key={level} className="space-y-1">
                                <span className="text-[10px] font-black text-kinetic-cyan dark:text-cyan-300 uppercase">{level} - Desempeño:</span>
                                <textarea
                                  rows="2"
                                  value={crit.descriptors?.[level] || ''}
                                  placeholder={`Descriptor para nivel ${level}...`}
                                  onChange={(e) => {
                                    const list = [...editingEvalConfig.instrumentConfig.criteriaList];
                                    if (!list[idx].descriptors) list[idx].descriptors = {};
                                    list[idx].descriptors[level] = e.target.value;
                                    setEditingEvalConfig({
                                      ...editingEvalConfig,
                                      instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
                                    });
                                  }}
                                  className="w-full text-[11px] rounded-lg bg-white/5  border border-white/10/80 p-2 focus:border-kinetic-cyan focus:bg-transparent transition"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
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
                    {editingEvalConfig.instrumentConfig?.criteriaList?.map((crit, cIdx) => {
                      const colors = ['border-blue-500/30', 'border-purple-500/30', 'border-emerald-500/30', 'border-amber-500/30'];
                      const borderColor = colors[cIdx % colors.length];

                      return (
                        <div key={crit.id} className={`p-4 bg-transparent  rounded-2xl border ${borderColor} space-y-3.5 `}>
                          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 w-full">
                              <span className="h-6 w-6 rounded-full bg-white/10  text-slate-200  flex items-center justify-center font-black text-xs shrink-0 border border-white/10">
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
                                className="flex-1 font-black text-xs bg-white/5  px-3 py-2 rounded-lg border border-white/10 focus:border-kinetic-cyan focus:bg-transparent transition"
                              />
                            </div>
                            <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-start w-full sm:w-auto">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 uppercase font-black">Puntos:</span>
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
                                  className="w-14 text-center text-xs bg-white/5  px-2 py-1.5 rounded-lg border border-white/10 font-black focus:border-kinetic-cyan focus:bg-transparent transition"
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
                                  className="text-[10px] text-cyan-400 font-bold hover:underline"
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
                          <div className="pl-6 border-l-2 border-dashed border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 space-y-2">
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
                                  className="flex-1 text-xs bg-white/5  px-3 py-2 rounded-lg border border-white/10 focus:border-kinetic-cyan focus:bg-transparent transition"
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
                                  className="p-1 hover:bg-white/20 rounded text-rose-455"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                            {(!crit.indicators || crit.indicators.length === 0) && (
                              <p className="text-[10px] text-slate-400 italic pl-2">No hay subcriterios. Presione '+ Agregar Subcriterio'.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CHECKLIST CONFIG */}
              {editingEvalConfig.type === 'Lista de Cotejo' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-400">Indicadores de Cotejo</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newItem = { id: `item_${Date.now()}`, text: 'Nuevo indicador de cotejo' };
                        const config = editingEvalConfig.instrumentConfig || { items: [] };
                        config.items = [...(config.items || []), newItem];
                        setEditingEvalConfig({ ...editingEvalConfig, instrumentConfig: config });
                      }}
                      className="text-xs text-kinetic-cyan font-bold hover:underline"
                    >
                      + Agregar Indicador
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editingEvalConfig.instrumentConfig?.items?.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-transparent  rounded-2xl border border-blue-500/30 dark:border-blue-500/25">
                        <span className="text-xs font-black text-slate-400 w-6 text-center">{idx + 1}</span>
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
                          className="flex-1 text-xs bg-white/5  px-3 py-2 rounded-lg border border-white/10 focus:border-kinetic-cyan focus:bg-transparent transition font-semibold"
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

              {/* OBSERVATION GUIDE CONFIG */}
              {editingEvalConfig.type === 'Guia de Observacion' && (
                <div className="space-y-6">
                  {/* Levels of achievement config */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-slate-400">Niveles de Logro del Comportamiento</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newLvl = { id: `lvl_${Date.now()}`, name: 'Nivel', label: 'Descripción' };
                          const config = editingEvalConfig.instrumentConfig || { levels: [], criteriaList: [] };
                          config.levels = [...(config.levels || []), newLvl];
                          setEditingEvalConfig({ ...editingEvalConfig, instrumentConfig: config });
                        }}
                        className="text-xs text-kinetic-cyan font-bold hover:underline"
                      >
                        + Agregar Nivel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {editingEvalConfig.instrumentConfig?.levels?.map((lvl, idx) => (
                        <div key={lvl.id} className="flex gap-2 p-2 bg-white/5  rounded-lg items-center">
                          <input
                            type="text"
                            value={lvl.name}
                            placeholder="Sigla (ej: SI)"
                            onChange={(e) => {
                              const list = [...editingEvalConfig.instrumentConfig.levels];
                              list[idx].name = e.target.value;
                              setEditingEvalConfig({
                                ...editingEvalConfig,
                                instrumentConfig: { ...editingEvalConfig.instrumentConfig, levels: list }
                              });
                            }}
                            className="w-10 text-xs bg-transparent  px-2 py-1 rounded border border-white/10 text-center font-bold"
                          />
                          <input
                            type="text"
                            value={lvl.label}
                            placeholder="Nombre del nivel (ej: Siempre)"
                            onChange={(e) => {
                              const list = [...editingEvalConfig.instrumentConfig.levels];
                              list[idx].label = e.target.value;
                              setEditingEvalConfig({
                                ...editingEvalConfig,
                                instrumentConfig: { ...editingEvalConfig.instrumentConfig, levels: list }
                              });
                            }}
                            className="flex-1 text-xs bg-transparent  px-2 py-1 rounded border border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const list = editingEvalConfig.instrumentConfig.levels.filter(l => l.id !== lvl.id);
                              setEditingEvalConfig({
                                ...editingEvalConfig,
                                instrumentConfig: { ...editingEvalConfig.instrumentConfig, levels: list }
                              });
                            }}
                            className="p-1 hover:bg-white/20 rounded text-rose-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Criteria & indicators config */}
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-slate-400">Criterios e Indicadores</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newCrit = { id: `obs_crit_${Date.now()}`, name: 'Nuevo Criterio de Actitud', indicators: [] };
                          const config = editingEvalConfig.instrumentConfig || { criteriaList: [], levels: [] };
                          config.criteriaList = [...(config.criteriaList || []), newCrit];
                          setEditingEvalConfig({ ...editingEvalConfig, instrumentConfig: config });
                        }}
                        className="text-xs text-kinetic-cyan font-bold hover:underline"
                      >
                        + Agregar Criterio
                      </button>
                    </div>

                    <div className="space-y-4">
                      {editingEvalConfig.instrumentConfig?.criteriaList?.map((crit, cIdx) => {
                        const colors = ['border-blue-500/30', 'border-purple-500/30', 'border-emerald-500/30', 'border-amber-500/30'];
                        const borderColor = colors[cIdx % colors.length];

                        return (
                          <div key={crit.id} className={`p-4 bg-transparent  rounded-2xl border ${borderColor} space-y-3.5 `}>
                            <div className="flex justify-between items-center gap-3">
                              <input
                                type="text"
                                value={crit.name}
                                onChange={(e) => {
                                  const list = [...editingEvalConfig.instrumentConfig.criteriaList];
                                  list[cIdx].name = e.target.value;
                                  setEditingEvalConfig({
                                    ...editingEvalConfig,
                                    instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
                                  });
                                }}
                                className="flex-1 font-black text-xs bg-white/5  px-3 py-2 rounded-lg border border-white/10 focus:border-kinetic-cyan focus:bg-transparent transition"
                                placeholder="Nombre del Criterio..."
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = [...editingEvalConfig.instrumentConfig.criteriaList];
                                    const newInd = { id: `obs_ind_${Date.now()}`, text: 'Nuevo indicador observable' };
                                    list[cIdx].indicators = [...(list[cIdx].indicators || []), newInd];
                                    setEditingEvalConfig({
                                      ...editingEvalConfig,
                                      instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
                                    });
                                  }}
                                  className="text-[10px] text-cyan-400 font-bold hover:underline"
                                >
                                  + Agregar Indicador
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

                          {/* Indicators list under criterion */}
                          <div className="pl-6 border-l-2 border-dashed border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 space-y-2">
                            {crit.indicators?.map((ind, iIdx) => (
                              <div key={ind.id} className="flex gap-2 items-center">
                                <span className="text-xs text-slate-400 font-bold">•</span>
                                <input
                                  type="text"
                                  value={ind.text}
                                  onChange={(e) => {
                                    const list = [...editingEvalConfig.instrumentConfig.criteriaList];
                                    list[cIdx].indicators[iIdx].text = e.target.value;
                                    setEditingEvalConfig({
                                      ...editingEvalConfig,
                                      instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
                                    });
                                  }}
                                  className="flex-1 text-xs bg-white/5  px-3 py-2 rounded-lg border border-white/10 focus:border-kinetic-cyan focus:bg-transparent transition font-semibold"
                                  placeholder="Escribe el indicador..."
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
                                  className="p-1 hover:bg-white/20 rounded text-rose-455"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                            {(!crit.indicators || crit.indicators.length === 0) && (
                              <p className="text-[10px] text-slate-400 italic pl-2">No hay indicadores. Presione '+ Agregar Indicador'.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-transparent  p-4 rounded-2xl border border-violet-500/30 dark:border-violet-500/20 gap-3">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 block uppercase">Puntaje Máximo del Examen</span>
                        <input
                          type="number"
                          value={config.maxScore || 100}
                          onChange={(e) => updateConfig(questionsList, parseInt(e.target.value) || 100)}
                          className="w-10 mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-black   focus:bg-transparent focus:border-kinetic-cyan transition"
                        />
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-black text-slate-400 block uppercase">Total de Puntos Acumulado</span>
                        <span className={`text-base font-black ${totalPoints === (config.maxScore || 100) ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-500'}`}>
                          {totalPoints} / {config.maxScore || 100} pts
                        </span>
                        {totalPoints !== (config.maxScore || 100) && (
                          <span className="block text-[9px] text-rose-400 font-medium italic mt-0.5">Se recomienda que coincida con el máximo</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      {questionsList.map((q, idx) => (
                        <div key={q.id} className="p-4 bg-transparent  rounded-2xl border border-kinetic-cyan/50 dark:border-kinetic-cyan/40 space-y-3.5">
                          <div className="flex items-center gap-3">
                            <span className="h-6 w-6 rounded-full bg-white/10  text-slate-200  flex items-center justify-center font-black text-xs shrink-0 border border-white/10">
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
                              placeholder="Enunciado de la pregunta o criterio..."
                              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold   focus:bg-transparent focus:border-kinetic-cyan transition"
                            />
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                value={q.points}
                                onChange={(e) => {
                                  const list = [...questionsList];
                                  list[idx].points = parseInt(e.target.value) || 0;
                                  updateConfig(list);
                                }}
                                className="w-14 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-center font-black   focus:bg-transparent focus:border-kinetic-cyan transition"
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
                              className="text-rose-500 hover:text-rose-700 p-2 hover:bg-rose-500/10 dark:hover:bg-rose-950/20 rounded-lg transition"
                              title="Eliminar Pregunta"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pl-7 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 uppercase">Tipo de Pregunta:</span>
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
                              <span className="text-[10px] text-slate-400 uppercase font-black">Habilitar Subpreguntas</span>
                            </label>
                          </div>

                          {/* Alternativas de opción múltiple */}
                          {!q.hasSubQuestions && q.type === 'choice' && (
                            <div className="pl-7 border-l-2 border-kinetic-cyan/50 dark:border-indigo-900/60 space-y-2">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Alternativas (Selecciona el botón de opción para marcar la Clave Correcta)</span>
                              <div className="space-y-1.5">
                                {(q.options || []).map((opt, oIdx) => (
                                  <div key={opt.id} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`correct_${q.id}`}
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

                          {/* Configuración de Relacionar Columnas */}
                          {!q.hasSubQuestions && q.type === 'matching' && (
                            <div className="pl-7 border-l-2 border-kinetic-cyan/50 dark:border-indigo-900/60 space-y-4">
                              {/* Opciones de enlace */}
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">1. Opciones de Enlace (Ej: 11 años, 8 años)</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {(q.options || []).map((opt, oIdx) => (
                                    <div key={opt.id} className="flex items-center gap-2 p-1.5 bg-white/5  rounded-lg border border-slate-150">
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
                                  className="text-[9px] font-bold text-kinetic-cyan dark:text-cyan-300 hover:underline flex items-center gap-1"
                                >
                                  + Añadir Opción de Enlace
                                </button>
                              </div>

                              {/* Elementos a relacionar */}
                              <div className="space-y-2 border-t border-slate-150  pt-3">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">2. Elementos a Relacionar y su Clave Correcta</span>
                                <div className="space-y-2">
                                  {(q.subQuestions || []).map((subQ, sIdx) => (
                                    <div key={subQ.id} className="p-2 rounded-lg bg-transparent  border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
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
                                          className="flex-1 bg-transparent border-0 border-b border-dashed border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 p-0 text-xs font-semibold text-slate-200  focus:ring-0 focus:border-kinetic-cyan"
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
                                          className="rounded-lg border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 bg-white/5  px-2 py-1 text-[10px] font-bold text-slate-200  outline-none"
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
                                                  name={`correct_${q.id}_${subQ.id}`}
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
                                              className="text-[8px] font-bold text-kinetic-cyan dark:text-cyan-300 hover:underline flex items-center gap-1"
                                            >
                                              + Añadir Opción de Enlace
                                            </button>
                                          </div>

                                          <div className="space-y-2 border-t border-slate-150  pt-3">
                                            <span className="text-[9px] font-bold text-slate-400 block uppercase">2. Elementos a Relacionar y su Clave Correcta</span>
                                            <div className="space-y-2">
                                              {(subQ.subQuestions || []).map((nestedSub, nsIdx) => (
                                                <div key={nestedSub.id} className="p-2 rounded-lg bg-transparent  border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
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
                                                      className="flex-1 bg-transparent border-0 border-b border-dashed border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 p-0 text-xs font-semibold text-slate-200  focus:ring-0 focus:border-kinetic-cyan"
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
                                                      className="rounded-lg border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 bg-white/5  px-2 py-1 text-[9px] font-bold text-slate-200  outline-none"
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
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 border-dashed border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 text-xs font-black text-slate-400 hover:text-cyan-400 hover:border-indigo-300 dark:hover:text-cyan-300 dark:hover:border-indigo-900 transition bg-white/30"
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
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

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
                      <span className="text-[9px] bg-purple-500/20 text-purple-700 px-2 py-0.5 rounded font-black uppercase">Evaluación Formativa</span>
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
              <aside className="col-span-12 lg:col-span-3 flex flex-col justify-between p-5 bg-gradient-to-b from-white to-slate-50 rounded-2xl border border-kinetic-cyan/30 shadow-lg shadow-indigo-500/10 min-h-[300px]">
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
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="transparent" stroke="currentColor" strokeDasharray={`${pct}, 100`} strokeLinecap="round" strokeWidth="4.5" className={`${color} drop-shadow-[0_0_8px_rgba(var(--color),0.5)]`} style={{"--color": color ==="text-emerald-600" ?"16,185,129" : (color ==="text-amber-500" ?"245,158,11" :"239,68,68") }}></path>
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
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="transparent" stroke="currentColor" strokeDasharray={`${
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
                          }, 100`} strokeLinecap="round" strokeWidth="5" className={`text-kinetic-cyan drop-shadow-[0_0_12px_rgba(79,70,229,0.5)]`}></path>
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
                      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 border-none text-white flex items-center justify-between shadow-xl shadow-indigo-500/30">
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
                        <h5 className="text-[11px] font-black text-slate-200  uppercase tracking-wider flex items-center gap-1.5 border-b border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 pb-2">
                          <span className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-indigo-500/30 flex items-center justify-center font-black text-[10px]">1</span>
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
                              <div key={char.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 bg-white/5  rounded-lg border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50">
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
                                            : 'bg-transparent  text-slate-400  border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 hover:bg-white/5'
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
                        <h5 className="text-[11px] font-black text-slate-200  uppercase tracking-wider flex items-center gap-1.5 border-b border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 pb-2">
                          <span className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-indigo-500/30 flex items-center justify-center font-black text-[10px]">2</span>
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
                              <div key={sentence.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 bg-slate-55/20  rounded-lg border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50">
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
                                            : 'bg-transparent  text-slate-400  border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 hover:bg-white/5'
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
                        <h5 className="text-[11px] font-black text-slate-200  uppercase tracking-wider flex items-center gap-1.5 border-b border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 pb-2">
                          <span className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-indigo-500/30 flex items-center justify-center font-black text-[10px]">3</span>
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
                              <div key={event.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 bg-white/5  rounded-lg border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50">
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
                                            ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-white border-amber-400 shadow-lg shadow-amber-500/40 ring-2 ring-amber-500/30'
                                            : 'bg-transparent  text-slate-400  border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 hover:bg-white/5'
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
                        <h5 className="text-[11px] font-black text-slate-200  uppercase tracking-wider flex items-center gap-1.5 border-b border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 pb-2">
                          <span className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-indigo-500/30 flex items-center justify-center font-black text-[10px]">4</span>
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
                              <div key={action.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 bg-white/5  rounded-lg border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50">
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
                                            : 'bg-transparent  text-slate-400 border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 hover:bg-white/5'
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
                        <h5 className="text-[11px] font-black text-slate-200  uppercase tracking-wider flex items-center gap-1.5 border-b border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 pb-2">
                          <span className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-indigo-500/30 flex items-center justify-center font-black text-[10px]">5</span>
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
                                    ? 'bg-kinetic-cyan text-white border-kinetic-cyan border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] font-black'
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

                // Examen dinámico con preguntas personalizadas
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
                        <h4 className="text-sm font-black text-white uppercase tracking-wider drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                          Ficha del Examen Personalizado
                        </h4>
                        <p className="text-[10px] text-indigo-100 font-semibold mt-1">
                          Seleccione la respuesta marcada por el alumno o califique de forma directa.
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold uppercase text-indigo-200 block tracking-widest">Resultado</span>
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className="text-xl font-black text-white drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                            {obtainedPoints} / {totalMaxPoints}
                          </span>
                          <span className="text-[10px] text-indigo-200 font-bold ml-1">pts</span>
                        </div>
                        <span className="text-[11px] font-black text-white bg-emerald-500/100/90  shadow-emerald-500/50 border border-emerald-400/50 px-2.5 py-0.5 rounded mt-1.5 inline-block">
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
                          <div key={q.id} className="p-4 bg-transparent  rounded-2xl border border-kinetic-cyan/50 dark:border-kinetic-cyan/40 space-y-3.5">
                            <div className="flex justify-between items-start border-b border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 pb-2">
                              <h5 className="text-[11px] font-black text-slate-200  uppercase tracking-wider flex items-center gap-2">
                                <span className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-indigo-500/30 flex items-center justify-center font-black text-[10px]">
                                  {idx + 1}
                                </span>
                                {q.text}
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
                                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 border-emerald-400 text-white shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-500/30'
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
                                      ? 'bg-gradient-to-r from-rose-500 to-rose-400 border-rose-400 text-white shadow-lg shadow-rose-500/40 ring-2 ring-rose-500/30'
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
                                  
                                  let btnStyles = 'bg-white/5  text-slate-200  border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 hover:bg-white/10';
                                  
                                  if (selectedVal !== undefined && selectedVal !== null) {
                                    if (isSelected) {
                                      if (isCorrectKey) {
                                        btnStyles = 'bg-gradient-to-r from-emerald-500 to-emerald-400 border-emerald-400 text-white font-black shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-500/30';
                                      } else {
                                        btnStyles = 'bg-gradient-to-r from-rose-500 to-rose-400 border-rose-400 text-white font-black shadow-lg shadow-rose-500/40 ring-2 ring-rose-500/30';
                                      }
                                    } else if (isCorrectKey) {
                                      btnStyles = 'bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-400 dark:border-emerald-800 border-2 font-bold';
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
                              <div className="border border-slate-155  rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
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
                                    <div key={subQ.id} className="p-3 bg-white/5/50  rounded-lg border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 space-y-3">
                                      <div className="flex justify-between items-start border-b border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 pb-2">
                                        <h6 className="text-[10.5px] font-bold text-slate-200  flex items-center gap-1.5 leading-snug">
                                          <span className="h-4.5 w-4.5 rounded-full bg-white/20  text-slate-400  flex items-center justify-center font-bold text-[9px] shrink-0">
                                            {idx + 1}.{sIdx + 1}
                                          </span>
                                          {subQ.text}
                                        </h6>
                                        <span className="text-[9px] font-bold text-slate-400 bg-white/10  px-1.5 py-0.5 rounded shrink-0">
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
                                                : 'bg-transparent  text-slate-400  border-white/10  hover:bg-white/10'
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
                                                : 'bg-transparent  text-slate-400  border-white/10  hover:bg-white/10'
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
                                            
                                            let btnStyles = 'bg-transparent  text-slate-300  border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 hover:bg-white/10';
                                            
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

                                                    let btnStyles = 'bg-transparent  text-slate-400  border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 hover:bg-white/5';

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

              {/* RUBRIC GRADING */}
              {gradingEval.type === 'Rubrica' && (
                <div className="space-y-4">
                  {gradingEval.instrumentConfig?.criteriaList?.length === 0 ? (
                    <p className="text-xs text-rose-500 text-center py-4 italic">No se han configurado criterios en este instrumento. Cierre y presione el icono de engranaje para configurarla.</p>
                  ) : (
                    gradingEval.instrumentConfig?.criteriaList?.map((crit, cIdx) => {
                      const selectedVal = tempRubricSelections[crit.id];
                      const borderColors = ['border-blue-500/30', 'border-purple-500/30', 'border-emerald-500/30', 'border-amber-500/30'];
                      const borderColor = borderColors[cIdx % borderColors.length];

                      return (
                        <div key={crit.id} className={`p-4 bg-transparent  rounded-2xl border ${borderColor} space-y-3.5 `}>
                          <p className="text-xs font-black text-slate-200">{crit.criteria}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-[10px] font-semibold">
                            {['AD', 'A', 'B', 'C'].map((level) => {
                              const descText = crit.descriptors?.[level] || 'Sin descripción para el nivel.';
                              const isSelected = selectedVal === level;
                              
                              let levelColorClasses = '';
                              let levelTextColor = '';
                              if (level === 'AD') {
                                levelColorClasses = isSelected ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-900/30 text-white dark:text-white border-2 scale-[1.02]' : 'border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 bg-transparent  text-slate-400 hover:border-blue-300';
                                levelTextColor = 'text-blue-500';
                              } else if (level === 'A') {
                                levelColorClasses = isSelected ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-900/30 text-white dark:text-white border-2 scale-[1.02]' : 'border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 bg-transparent  text-slate-400 hover:border-emerald-300';
                                levelTextColor = 'text-emerald-500';
                              } else if (level === 'B') {
                                levelColorClasses = isSelected ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-900/30 text-white dark:text-white border-2 scale-[1.02]' : 'border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 bg-transparent  text-slate-400 hover:border-amber-300';
                                levelTextColor = 'text-amber-500';
                              } else {
                                levelColorClasses = isSelected ? 'border-red-500 bg-red-500/10 dark:bg-red-900/30 text-white dark:text-white border-2 scale-[1.02]' : 'border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 bg-transparent  text-slate-400 hover:border-red-300';
                                levelTextColor = 'text-red-500';
                              }

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
                                  className={`p-2.5 rounded-lg border text-left flex flex-col justify-between h-full gap-1.5 transition-all ${levelColorClasses}`}
                                >
                                  <span className={`font-extrabold uppercase text-[11px] ${levelTextColor}`}>{level}</span>
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

              {/* CHECKLIST GRADING */}
              {gradingEval.type === 'Lista de Cotejo' && (
                <div className="space-y-2">
                  {gradingEval.instrumentConfig?.items?.length === 0 ? (
                    <p className="text-xs text-rose-500 text-center py-4 italic">No se han configurado indicadores en la lista. Cierre y configurela.</p>
                  ) : (
                    gradingEval.instrumentConfig?.items?.map(item => {
                      const isChecked = !!tempChecklistSelections[item.id];

                      return (
                        <label 
                          key={item.id} 
                          className={`flex items-center gap-3 p-3 bg-transparent  rounded-2xl border cursor-pointer transition select-none  ${
                            isChecked ? 'border-blue-500 bg-blue-50/30' : 'border-blue-500/30 dark:border-blue-500/25 hover:bg-white/5'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={(e) => {
                              setTempChecklistSelections(prev => ({ ...prev, [item.id]: e.target.checked }));
                            }}
                            className="h-4.5 w-4.5 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-semibold text-slate-200">{item.text}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}

              {/* OBSERVATION GUIDE GRADING */}
              {gradingEval.type === 'Guia de Observacion' && (
                <div className="space-y-5">
                  {/* Observation Criteria & Indicators */}
                  {gradingEval.instrumentConfig?.criteriaList?.length === 0 ? (
                    <p className="text-xs text-rose-500 text-center py-4 italic">No se han configurado criterios ni indicadores observacionales.</p>
                  ) : (
                    gradingEval.instrumentConfig?.criteriaList?.map((crit, cIdx) => {
                      const borderColors = ['border-blue-500/30', 'border-purple-500/30', 'border-emerald-500/30', 'border-amber-500/30'];
                      const borderColor = borderColors[cIdx % borderColors.length];
                      
                      return (
                      <div key={crit.id} className={`p-4 bg-transparent  rounded-2xl border ${borderColor} space-y-3.5 `}>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Criterio: {crit.name}</span>
                        
                        <div className="space-y-2">
                          {crit.indicators?.map(ind => {
                            const selectedLvl = tempObservationSelections[ind.id];

                            return (
                              <div key={ind.id} className="p-3 bg-white/5  rounded-lg border border-white/10/40 space-y-2">
                                <p className="text-xs font-bold text-slate-300">{ind.text}</p>
                                
                                {/* Levels selector buttons */}
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
                                          : 'border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 bg-transparent  text-slate-400 hover:border-indigo-300'
                                      }`}
                                    >
                                      {lvl.label} ({lvl.points} pts)
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )})
                  )}

                  {/* Observational qualitative comment box */}
                  <div className="space-y-1.5 border-t border-white/10  pt-3">
                    <label className="block text-[10px] font-bold uppercase text-slate-400">Observaciones Generales</label>
                    <textarea
                      rows="3"
                      placeholder="Registrar anécdotas, comportamientos o justificaciones evidenciadas..."
                      value={tempObsComments}
                      onChange={(e) => setTempObsComments(e.target.value)}
                      className="w-full text-xs rounded-lg border border-white/10 bg-white/10 px-3 py-2 focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan"
                    />
                  </div>
                </div>
              )}

                </div>
              </main>
            </div>

            {/* Bottom calculation status */}
            <div className="p-4 bg-white/5/80 border border-kinetic-cyan/30/80 rounded-2xl flex items-center justify-between text-center gap-3 text-slate-200">
              <div>
                <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider block">Nota Resultante</span>
                <span className="text-2xl font-black text-cyan-400">
                  {typeof liveCalculatedScore === 'number' ? liveCalculatedScore.toFixed(1) : liveCalculatedScore}
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
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/40 border-none text-xs px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
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

      {/* MODAL 4: Importación Flexible de Notas */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-card-ecc border border-white/10 max-w-4xl w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-200 font-sans">
            <div className="flex justify-between items-center border-b border-white/10  pb-3">
              <div>
                <span className="text-[10px] bg-white/10 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
                  SISGESMAFI Importer
                </span>
                <h3 className="text-lg font-black mt-1 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-kinetic-cyan" />
                  Importador Flexible de Calificaciones
                </h3>
                <p className="text-xs text-slate-400">Suba un archivo CSV/TXT o copie y pegue datos directamente de Excel.</p>
              </div>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setImportRawText('');
                  setImportFeedback(null);
                }} 
                className="text-slate-400 hover:text-slate-650"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {importFeedback ? (
              <div className={`p-6 text-center rounded-2xl border ${
                importFeedback.success 
                  ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-250 text-emerald-800 dark:text-emerald-300' 
                  : 'bg-rose-500/10 dark:bg-rose-950/20 border-rose-250 text-rose-800 dark:text-rose-300'
              } space-y-2`}>
                <CheckSquare className="h-12 w-12 mx-auto text-emerald-500 animate-bounce" />
                <h4 className="font-extrabold text-sm">{importFeedback.success ? '¡Éxito!' : 'Ocurrió un problema'}</h4>
                <p className="text-xs">{importFeedback.message}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Panel de Entrada (Archivo / Pegar) */}
                <div className="space-y-4 w-full">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">1. Subir Archivo o Pegar Datos</label>
                    
                    {/* Archivo */}
                    <div className="flex items-center justify-center w-full mb-3">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-350 rounded-lg cursor-pointer bg-white/10 hover:bg-white/5/50    transition">
                        <div className="flex flex-col items-center justify-center pt-3 pb-3">
                          <Upload className="w-6 h-6 mb-1.5 text-slate-400" />
                          <p className="text-[11px] text-slate-400 font-bold">Haga clic para seleccionar archivo (.csv, .txt)</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">O simplemente pegue los datos abajo</p>
                        </div>
                        <input 
                          type="file" 
                          accept=".csv,.txt"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              setImportRawText(evt.target.result);
                            };
                            reader.readAsText(file);
                          }}
                          className="hidden" 
                        />
                      </label>
                    </div>

                    {/* Copiar y pegar text area */}
                    <textarea
                      rows="6"
                      placeholder="Seleccione las celdas en su archivo Excel, cópielas (Ctrl+C) y péguelas aquí (Ctrl+V)&#10;DNI&#9;Nombre del alumno&#9;Calificación&#10;72846152&#9;Alvarado Ruiz, María&#9;AD&#10;83917462&#9;Bustamante Prado, Juan&#9;B"
                      value={importRawText}
                      onChange={(e) => setImportRawText(e.target.value)}
                      className="w-full text-[11px] font-mono rounded-lg border border-white/10 bg-white/10 p-3 focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan   leading-relaxed"
                    />
                  </div>

                  {/* Configuración de la Evaluación de Destino */}
                  <div className="p-4 bg-white/5  border border-slate-250  rounded-lg space-y-3">
                    <label className="block text-xs font-bold uppercase text-slate-400">2. Actividad de Destino en SISGESMAFI</label>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Columna donde guardar notas</label>
                      <select
                        value={importTargetEvalId}
                        onChange={(e) => {
                          setImportTargetEvalId(e.target.value);
                          if (e.target.value === 'new') {
                            setNewImportEvalCapacityId(activeCompetence?.capacities?.[0]?.id || '');
                          }
                        }}
                        className="w-full rounded-lg border border-white/10 bg-transparent px-2.5 py-1.5 text-xs font-semibold   text-slate-200"
                      >
                        <option value="">-- Seleccionar Columna --</option>
                        {activeEvaluations.map(ev => (
                          <option key={ev.id} value={ev.id}>{ev.name} ({ev.type})</option>
                        ))}
                        <option value="new">+ Crear Nueva Actividad de Evaluación</option>
                      </select>
                    </div>

                    {importTargetEvalId === 'new' && (
                      <div className="space-y-3 pt-2 border-t border-white/10/50  animate-in fade-in duration-200">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1 font-sans">Nombre de Nueva Actividad</label>
                          <input 
                            type="text" 
                            value={newImportEvalName}
                            onChange={(e) => setNewImportEvalName(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-transparent px-2.5 py-1.5 text-xs"
                            placeholder="Ej: Examen Importado de Excel"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Instrumento</label>
                            <select
                              value={newImportEvalType}
                              onChange={(e) => setNewImportEvalType(e.target.value)}
                              className="w-full rounded-lg border border-white/10 bg-transparent px-2 py-1 text-xs   text-slate-200"
                            >
                              <option value="Examen">Examen / Nota Directa</option>
                              <option value="Rubrica">Rúbrica de Criterios</option>
                              <option value="Lista de Cotejo">Lista de Cotejo</option>
                              <option value="Lista de Cotejo 3 Niveles">Lista de Cotejo (3 Niveles)</option>
                              <option value="Guia de Observacion">Guía de Observación</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Capacidad CNEB</label>
                            <select
                              value={newImportEvalCapacityId}
                              onChange={(e) => setNewImportEvalCapacityId(e.target.value)}
                              className="w-full rounded-lg border border-white/10 bg-transparent px-2 py-1 text-xs   text-slate-200"
                            >
                              <option value="">Evaluación General</option>
                              {activeCompetence?.capacities?.map(cap => (
                                <option key={cap.id} value={cap.id}>{cap.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel de Visualización / Mapeo */}
                <div className="space-y-4 w-full h-[450px] flex flex-col">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">3. Configurar Mapeo de Columnas Detectadas</label>
                    {parsedRows.length > 0 ? (
                      <div className="bg-white/5  border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 rounded-lg p-3 grid grid-cols-3 gap-2">
                        {parsedRows[0].map((cell, idx) => (
                          <div key={idx} className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 block uppercase">Columna {idx + 1} ("{cell.substring(0, 10)}...")</span>
                            <select
                              value={columnMappings[idx] || 'ignore'}
                              onChange={(e) => setColumnMappings({ ...columnMappings, [idx]: e.target.value })}
                              className="w-full rounded bg-transparent px-1.5 py-1 text-[11px] font-bold border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50  text-cyan-400 dark:text-cyan-300"
                            >
                              <option value="ignore">Ignorar Columna</option>
                              <option value="dni">Mapear a DNI / Dto.</option>
                              <option value="name">Mapear a Nombres</option>
                              <option value="grade">Mapear a Nota</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-white/5  border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 rounded-lg text-xs text-slate-400 italic">
                        Cargue un archivo o pegue datos de Excel para ver sus columnas.
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col">
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">4. Previsualización del Emparejamiento</label>
                    {importPreview.length > 0 ? (
                      <div className="flex-1 overflow-y-auto border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 rounded-lg bg-transparent">
                        <table className="w-full border-collapse text-left text-[11px]">
                          <thead className="bg-white/10  font-bold sticky top-0 border-b border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 text-slate-750">
                            <tr>
                              <th className="p-2 border-r border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50">Fila Excel</th>
                              <th className="p-2 border-r border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50">Alumno Emparejado (SISGESMAFI)</th>
                              <th className="p-2 text-center w-20">Nota Detectada</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                            {importPreview.map((item, idx) => (
                              <tr key={idx} className="hover:bg-white/5  transition">
                                <td className="p-2 border-r border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 whitespace-nowrap overflow-hidden max-w-[150px] truncate leading-tight font-mono text-[10px]">
                                  {item.rowName || item.rowDni ? (
                                    <>
                                      <span className="font-bold text-slate-200">{item.rowName || 'Sin Nombre'}</span>
                                      <span className="text-[9px] text-slate-400 block mt-0.5 font-sans">DNI: {item.rowDni || '-'}</span>
                                    </>
                                  ) : (
                                    <span className="text-slate-350 italic">Fila vacía o incompleta</span>
                                  )}
                                </td>
                                
                                <td className="p-2 border-r border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 leading-tight">
                                  {item.student ? (
                                    <>
                                      <span className="font-bold text-white">{item.student.name}</span>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`text-[8px] px-1 rounded font-bold uppercase ${
                                          item.status === 'success' 
                                            ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                                            : 'bg-amber-500/10 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                        }`}>
                                          {item.method === 'dni' ? 'DNI exacto' : item.method === 'name_exact' ? 'Nombre exacto' : 'Nombre aproximado'}
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-1 text-rose-500">
                                      <AlertTriangle className="h-3 w-3 inline shrink-0" />
                                      <span className="font-bold italic">No emparejado / No encontrado</span>
                                    </div>
                                  )}
                                </td>
                                
                                <td className="p-2 text-center font-bold font-mono">
                                  {item.student ? (
                                    item.validGrade !== '' ? (
                                      <span className="text-kinetic-cyan dark:text-cyan-300 font-extrabold text-xs">{item.validGrade}</span>
                                    ) : (
                                      <span className="text-rose-500 italic text-[10px]" title={`El formato de nota"${item.rowGrade}" es inválido para la escala ${gradingScale}`}>
                                        Nota inválida ({item.rowGrade})
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-slate-300 font-normal">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 rounded-lg bg-white/5  text-slate-400 italic text-xs py-8">
                        <FileText className="h-8 w-8 text-slate-300 mb-1.5" />
                        Esperando datos de calificaciones...
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button 
                type="button" 
                onClick={() => {
                  setShowImportModal(false);
                  setImportRawText('');
                  setImportFeedback(null);
                }} 
                className="btn-neuro-secondary text-xs px-4 py-2"
              >
                Cerrar
              </button>
              
              {!importFeedback && (
                <button 
                  type="button" 
                  onClick={handleApplyImport}
                  disabled={importPreview.length === 0 || !importTargetEvalId}
                  className="btn-neuro-primary text-xs px-5 py-2 flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <Check className="h-4 w-4" />
                  Aplicar Notas Importadas
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Copy Evaluation Modal */}
      {copyingEvaluation && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="glass-card-ecc border border-white/10 p-6 max-w-lg w-full space-y-4 shadow-2xl border border-white/20">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h4 className="font-extrabold text-lg text-white dark:text-white flex items-center gap-2">
                <Copy className="h-5 w-5 text-kinetic-cyan" />
                Copiar Instrumento
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
                Duplicará el instrumento <strong className="text-slate-200  font-bold">"{copyingEvaluation.name}"</strong> ({copyingEvaluation.type}) con su configuración de criterios y descriptores hacia el destino especificado.
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
                      {bimestersOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
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

              <div className="bg-white/5  p-4 rounded-lg border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 space-y-2">
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
                      Copiar también las calificaciones (notas) de los estudiantes.
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

export default GradingPortal;
