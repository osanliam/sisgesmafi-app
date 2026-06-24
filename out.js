import React, { useState, useContext, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { DatabaseContext } from "../context/DatabaseContext";
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
} from "lucide-react";
import axios from "axios";
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
  const [localGrade, setLocalGrade] = useState(() => {
    return localStorage.getItem("sga_sel_grade") || "Todas";
  });
  const [localCourseId, setLocalCourseId] = useState(() => {
    return localStorage.getItem("sga_sel_course") || "";
  });
  const [selectedCompetenceId, setSelectedCompetenceId] = useState(() => {
    return localStorage.getItem("sga_sel_competence") || "";
  });
  const [localBimester, setLocalBimester] = useState(() => {
    return localStorage.getItem("sga_sel_bimester") || "1";
  });
  const [localUnit, setLocalUnit] = useState(() => {
    return localStorage.getItem("sga_sel_unit") || "0";
  });
  const [localSection, setLocalSection] = useState(() => {
    return localStorage.getItem("sga_sel_section") || "Todas";
  });
  const [viewMode, setViewMode] = useState("auxiliar");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRawText, setImportRawText] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [columnMappings, setColumnMappings] = useState({});
  const [importTargetEvalId, setImportTargetEvalId] = useState("");
  const [newImportEvalName, setNewImportEvalName] = useState("Examen Importado");
  const [newImportEvalType, setNewImportEvalType] = useState("Examen");
  const [newImportEvalCapacityId, setNewImportEvalCapacityId] = useState("");
  const [importFeedback, setImportFeedback] = useState(null);
  const selectedGrade = isEmbedded ? embeddedGrade : localGrade;
  const setSelectedGrade = isEmbedded ? () => {
  } : setLocalGrade;
  const selectedCourseId = isEmbedded ? embeddedCourseId : localCourseId;
  const setSelectedCourseId = isEmbedded ? () => {
  } : setLocalCourseId;
  const selectedSection = isEmbedded ? embeddedSection : localSection;
  const setSelectedSection = isEmbedded ? () => {
  } : setLocalSection;
  const selectedBimester = isEmbedded ? embeddedBimester : localBimester;
  const setSelectedBimester = isEmbedded ? () => {
  } : setLocalBimester;
  const selectedUnit = isEmbedded ? embeddedUnit : localUnit;
  const setSelectedUnit = isEmbedded ? () => {
  } : setLocalUnit;
  useEffect(() => {
    if (!isEmbedded) localStorage.setItem("sga_sel_grade", localGrade);
  }, [localGrade, isEmbedded]);
  useEffect(() => {
    if (!isEmbedded) localStorage.setItem("sga_sel_course", localCourseId);
  }, [localCourseId, isEmbedded]);
  useEffect(() => {
    localStorage.setItem("sga_sel_competence", selectedCompetenceId);
  }, [selectedCompetenceId]);
  useEffect(() => {
    if (!isEmbedded) localStorage.setItem("sga_sel_bimester", localBimester);
  }, [localBimester, isEmbedded]);
  useEffect(() => {
    if (!isEmbedded) localStorage.setItem("sga_sel_unit", localUnit);
  }, [localUnit, isEmbedded]);
  useEffect(() => {
    if (!isEmbedded) localStorage.setItem("sga_sel_section", localSection);
  }, [localSection, isEmbedded]);
  const visibleCourses = useMemo(() => {
    let list = courses;
    if (currentRole === "teacher") {
      list = list.filter((c) => (c.assignments || []).some((asg) => asg.teacherId === currentUser?.id));
    }
    if (selectedGrade !== "Todas") {
      if (currentRole === "teacher") {
        list = list.filter((c) => (c.assignments || []).some((asg) => asg.teacherId === currentUser?.id && asg.gradeLevel === selectedGrade));
      } else {
        list = list.filter((c) => (c.assignments || []).some((asg) => asg.gradeLevel === selectedGrade));
      }
    }
    return list;
  }, [courses, currentRole, currentUser, selectedGrade]);
  const availableGrades = useMemo(() => {
    if (currentRole !== "teacher") {
      return ["1ro Secundaria", "2do Secundaria", "3ro Secundaria", "4to Secundaria", "5to Secundaria"];
    }
    const gradesSet = /* @__PURE__ */ new Set();
    courses.forEach((c) => {
      (c.assignments || []).forEach((asg) => {
        if (asg.teacherId === currentUser?.id) {
          gradesSet.add(asg.gradeLevel);
        }
      });
    });
    return Array.from(gradesSet).sort();
  }, [courses, currentRole, currentUser]);
  const availableSections = useMemo(() => {
    if (currentRole !== "teacher") {
      if (!selectedCourseId) {
        return ["A", "B", "C", "D", "E", "F", "G", "H"];
      }
      const course = courses.find((c) => c.id === selectedCourseId);
      if (!course) return [];
      const sectionsSet2 = /* @__PURE__ */ new Set();
      (course.assignments || []).forEach((asg) => {
        if (selectedGrade === "Todas" || asg.gradeLevel === selectedGrade) {
          (asg.sections || []).forEach((sec) => sectionsSet2.add(sec));
        }
      });
      return Array.from(sectionsSet2).sort();
    }
    const sectionsSet = /* @__PURE__ */ new Set();
    courses.forEach((c) => {
      if (selectedCourseId && c.id !== selectedCourseId) return;
      (c.assignments || []).forEach((asg) => {
        if (asg.teacherId === currentUser?.id) {
          if (selectedGrade === "Todas" || asg.gradeLevel === selectedGrade) {
            (asg.sections || []).forEach((sec) => sectionsSet.add(sec));
          }
        }
      });
    });
    return Array.from(sectionsSet).sort();
  }, [courses, currentRole, currentUser, selectedCourseId, selectedGrade]);
  useEffect(() => {
    if (visibleCourses.length > 0) {
      if (!visibleCourses.some((c) => c.id === selectedCourseId)) {
        setSelectedCourseId(visibleCourses[0].id);
      }
    } else {
      setSelectedCourseId("");
    }
  }, [visibleCourses, selectedCourseId]);
  const activeCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId);
  }, [courses, selectedCourseId]);
  const activeCompetence = useMemo(() => {
    if (!activeCourse || !selectedCompetenceId) return null;
    return (activeCourse.competencies || []).find((c) => c.id === selectedCompetenceId);
  }, [activeCourse, selectedCompetenceId]);
  useEffect(() => {
    if (activeCourse && activeCourse.competencies?.length > 0) {
      setSelectedCompetenceId((prev) => {
        if (prev && activeCourse.competencies.some((c) => c.id === prev)) {
          return prev;
        }
        return activeCourse.competencies[0].id;
      });
    } else {
      setSelectedCompetenceId("");
    }
  }, [selectedCourseId, activeCourse?.competencies]);
  const unitOptions = useMemo(() => {
    const unitEnabled = (num) => activePeriods?.units?.[String(num)] !== false;
    let options = [];
    if (selectedBimester === "1") options = [{ value: "0", label: "Unidad 0" }, { value: "1", label: "Unidad 1" }];
    else if (selectedBimester === "2") options = [{ value: "2", label: "Unidad 2" }, { value: "3", label: "Unidad 3" }];
    else if (selectedBimester === "3") options = [{ value: "4", label: "Unidad 4" }, { value: "5", label: "Unidad 5" }];
    else if (selectedBimester === "4") options = [{ value: "6", label: "Unidad 6" }, { value: "7", label: "Unidad 7" }];
    return options.filter((opt) => unitEnabled(opt.value));
  }, [selectedBimester, activePeriods]);
  const bimesterEnabled = (num) => activePeriods?.bimesters?.[String(num)] !== false;
  const bimestersOptions = useMemo(() => {
    return [
      { value: "1", label: "Bimestre 1" },
      { value: "2", label: "Bimestre 2" },
      { value: "3", label: "Bimestre 3" },
      { value: "4", label: "Bimestre 4" }
    ].filter((opt) => bimesterEnabled(opt.value));
  }, [activePeriods]);
  useEffect(() => {
    if (bimestersOptions.length > 0) {
      if (!bimestersOptions.some((opt) => opt.value === selectedBimester)) {
        setSelectedBimester(bimestersOptions[0].value);
      }
    }
  }, [bimestersOptions, selectedBimester]);
  useEffect(() => {
    if (unitOptions.length > 0) {
      if (!unitOptions.some((opt) => opt.value === selectedUnit)) {
        setSelectedUnit(unitOptions[0].value);
      }
    }
  }, [unitOptions, selectedUnit]);
  const [copyingEvaluation, setCopyingEvaluation] = useState(null);
  const [targetCourseId, setTargetCourseId] = useState("");
  const [targetCompetenceId, setTargetCompetenceId] = useState("");
  const [targetCapacityId, setTargetCapacityId] = useState("");
  const [targetBimester, setTargetBimester] = useState("1");
  const [targetUnit, setTargetUnit] = useState("0");
  const [targetGrade, setTargetGrade] = useState("");
  const [targetSection, setTargetSection] = useState("");
  const [copyGradesOption, setCopyGradesOption] = useState(false);
  const targetCourseObj = useMemo(() => {
    return courses.find((c) => c.id === targetCourseId);
  }, [courses, targetCourseId]);
  const targetCompetencies = useMemo(() => {
    return targetCourseObj?.competencies || [];
  }, [targetCourseObj]);
  const targetCompetenceObj = useMemo(() => {
    return targetCompetencies.find((c) => c.id === targetCompetenceId);
  }, [targetCompetencies, targetCompetenceId]);
  const targetCapacities = useMemo(() => {
    return targetCompetenceObj?.capacities || [];
  }, [targetCompetenceObj]);
  const targetAvailableGrades = useMemo(() => {
    if (!targetCourseObj) return [];
    const asgs = targetCourseObj.assignments || [];
    const relevantAsgs = currentRole === "teacher" ? asgs.filter((a) => a.teacherId === currentUser?.id) : asgs;
    return Array.from(new Set(relevantAsgs.map((a) => a.gradeLevel))).sort();
  }, [targetCourseObj, currentRole, currentUser]);
  const targetAvailableSections = useMemo(() => {
    if (!targetCourseObj || !targetGrade) return [];
    const asgs = targetCourseObj.assignments || [];
    const relevantAsgs = currentRole === "teacher" ? asgs.filter((a) => a.teacherId === currentUser?.id && a.gradeLevel === targetGrade) : asgs.filter((a) => a.gradeLevel === targetGrade);
    const sectionsSet = /* @__PURE__ */ new Set();
    relevantAsgs.forEach((asg) => {
      (asg.sections || []).forEach((sec) => sectionsSet.add(sec));
    });
    return Array.from(sectionsSet).sort();
  }, [targetCourseObj, targetGrade, currentRole, currentUser]);
  useEffect(() => {
    if (targetCourseObj) {
      const hasComp = targetCourseObj.competencies?.some((c) => c.id === targetCompetenceId);
      if (!hasComp) {
        if (targetCourseObj.competencies?.length > 0) {
          setTargetCompetenceId(targetCourseObj.competencies[0].id);
        } else {
          setTargetCompetenceId("");
        }
      }
      const gradesAvail = targetAvailableGrades;
      const hasGrade = gradesAvail.includes(targetGrade);
      if (!hasGrade) {
        if (gradesAvail.length > 0) {
          setTargetGrade(gradesAvail[0]);
        } else {
          setTargetGrade("");
        }
      }
    }
  }, [targetCourseObj, targetAvailableGrades]);
  useEffect(() => {
    if (targetCompetenceObj) {
      const hasCap = targetCompetenceObj.capacities?.some((c) => c.id === targetCapacityId);
      if (!hasCap) {
        if (targetCompetenceObj.capacities?.length > 0) {
          setTargetCapacityId(targetCompetenceObj.capacities[0].id);
        } else {
          setTargetCapacityId("");
        }
      }
    } else {
      setTargetCapacityId("");
    }
  }, [targetCompetenceObj]);
  useEffect(() => {
    const sectionsAvail = targetAvailableSections;
    const hasSection = sectionsAvail.includes(targetSection);
    if (!hasSection) {
      if (sectionsAvail.length > 0) {
        setTargetSection(sectionsAvail[0]);
      } else {
        setTargetSection("");
      }
    }
  }, [targetAvailableSections]);
  useEffect(() => {
    if (copyingEvaluation) {
      setTargetCourseId(copyingEvaluation.courseId || selectedCourseId);
      setTargetCompetenceId(copyingEvaluation.competenceId || selectedCompetenceId);
      setTargetCapacityId(copyingEvaluation.capacityId || "");
      setTargetBimester(copyingEvaluation.bimester || selectedBimester);
      setTargetUnit(copyingEvaluation.unit || selectedUnit);
      setTargetGrade(selectedGrade === "Todas" ? "" : selectedGrade);
      setTargetSection(selectedSection === "Todas" ? "" : selectedSection);
      setCopyGradesOption(false);
    }
  }, [copyingEvaluation]);
  const sameClassSelected = selectedGrade !== "Todas" && selectedSection !== "Todas" && targetGrade && selectedGrade && targetSection && selectedSection && targetGrade.trim().toLowerCase() === selectedGrade.trim().toLowerCase() && targetSection.trim().toLowerCase() === selectedSection.trim().toLowerCase();
  const handleCopyEvaluationSubmit = (e) => {
    e.preventDefault();
    if (!copyingEvaluation) return;
    if (!targetCourseId || !targetCompetenceId) {
      return alert("Debe seleccionar curso y competencia de destino.");
    }
    if (!targetGrade || !targetSection) {
      return alert("Debe seleccionar grado y secci\xF3n de destino.");
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
      alert(`Instrumento "${copyingEvaluation.name}" copiado exitosamente.`);
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
      alert("Hubo un error al copiar el instrumento.");
    }
  };
  const enrolledStudents = useMemo(() => {
    if (!activeCourse) return [];
    const relevantAssignments = (activeCourse.assignments || []).filter((asg) => {
      if (currentRole === "teacher") {
        return asg.teacherId === currentUser?.id;
      }
      return true;
    });
    if (relevantAssignments.length === 0) return [];
    let list = students.filter((s) => {
      const match = relevantAssignments.some((asg) => {
        const gradeMatch = asg.gradeLevel.toLowerCase() === (s.gradeLevel || "").toLowerCase();
        if (selectedGrade !== "Todas" && asg.gradeLevel !== selectedGrade) return false;
        const hasSection = (asg.sections || []).some((sec) => sec.toLowerCase() === (s.section || "").toLowerCase());
        if (selectedSection !== "Todas") {
          return gradeMatch && (s.section || "").toLowerCase() === selectedSection.toLowerCase() && hasSection;
        }
        return gradeMatch && hasSection;
      });
      return match;
    });
    return [...list].sort((a, b) => (a.name || "").localeCompare(b.name || "", "es"));
  }, [students, activeCourse, currentRole, currentUser, selectedGrade, selectedSection]);
  const activeEvaluations = useMemo(() => {
    return evaluations.filter(
      (e) => e.courseId === selectedCourseId && e.competenceId === selectedCompetenceId && (e.bimester || "1") === selectedBimester && (e.unit !== void 0 && e.unit !== null ? String(e.unit) : "0") === selectedUnit
    );
  }, [evaluations, selectedCourseId, selectedCompetenceId, selectedBimester, selectedUnit]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvalName, setNewEvalName] = useState("");
  const [newEvalType, setNewEvalType] = useState("Examen");
  const [newEvalCapacityId, setNewEvalCapacityId] = useState("");
  const [showCurriculumMap, setShowCurriculumMap] = useState(false);
  useEffect(() => {
    if (activeCompetence && activeCompetence.capacities && activeCompetence.capacities.length > 0) {
      setNewEvalCapacityId(activeCompetence.capacities[0].id);
    } else {
      setNewEvalCapacityId("");
    }
  }, [activeCompetence]);
  const [editingEvalConfig, setEditingEvalConfig] = useState(null);
  const [gradingStudent, setGradingStudent] = useState(null);
  const [gradingEval, setGradingEval] = useState(null);
  const [tempExamScore, setTempExamScore] = useState("");
  const [tempExamSelections, setTempExamSelections] = useState({});
  const [tempRubricSelections, setTempRubricSelections] = useState({});
  const [tempChecklistSelections, setTempChecklistSelections] = useState({});
  const [tempChecklist3LvlSelections, setTempChecklist3LvlSelections] = useState({});
  const [tempObservationSelections, setTempObservationSelections] = useState({});
  const [tempObsComments, setTempObsComments] = useState("");
  const createDefaultInstrumentConfig = (type) => {
    if (type === "Rubrica") {
      return {
        criteriaList: [
          {
            id: `crit_${Date.now()}_1`,
            criteria: "Comprensi\xF3n de conceptos",
            descriptors: {
              AD: "Demuestra dominio excepcional y propone aplicaciones pr\xE1cticas originales.",
              A: "Demuestra comprensi\xF3n completa y responde con acierto y claridad.",
              B: "Muestra dificultad en la aplicaci\xF3n, requiere asistencia frecuente.",
              C: "No comprende los fundamentos del concepto evaluado."
            }
          },
          {
            id: `crit_${Date.now()}_2`,
            criteria: "Estructura e Integraci\xF3n",
            descriptors: {
              AD: "Organizaci\xF3n impecable con un flujo de ideas altamente coherente.",
              A: "Estructurado de forma l\xF3gica con transiciones fluidas entre secciones.",
              B: "Faltas de cohesi\xF3n en las ideas principales, estructura dispersa.",
              C: "Desorganizado, sin secuencia l\xF3gica identificable."
            }
          }
        ]
      };
    } else if (type === "Lista de Cotejo 3 Niveles") {
      return {
        criteriaList: [
          {
            id: `crit_3lvl_${Date.now()}_1`,
            name: "Criterio General 1",
            points: 10,
            indicators: [
              { id: `ind_3lvl_${Date.now()}_11`, text: "Subcriterio o indicador 1.1" },
              { id: `ind_3lvl_${Date.now()}_12`, text: "Subcriterio o indicador 1.2" }
            ]
          },
          {
            id: `crit_3lvl_${Date.now()}_2`,
            name: "Criterio General 2",
            points: 10,
            indicators: [
              { id: `ind_3lvl_${Date.now()}_21`, text: "Subcriterio o indicador 2.1" },
              { id: `ind_3lvl_${Date.now()}_22`, text: "Subcriterio o indicador 2.2" }
            ]
          }
        ]
      };
    } else if (type === "Lista de Cotejo") {
      return {
        items: [
          { id: `item_${Date.now()}_1`, text: "Entreg\xF3 la actividad en el plazo establecido." },
          { id: `item_${Date.now()}_2`, text: "Cumple con el formato de presentaci\xF3n requerido." },
          { id: `item_${Date.now()}_3`, text: "Contiene al menos tres fuentes v\xE1lidas de referencia." }
        ]
      };
    } else if (type === "Guia de Observacion") {
      return {
        criteriaList: [
          {
            id: `obs_crit_${Date.now()}_1`,
            name: "Participaci\xF3n Activa",
            indicators: [
              { id: `obs_ind_${Date.now()}_11`, text: "Aporta ideas constructivas durante el trabajo en equipo." },
              { id: `obs_ind_${Date.now()}_12`, text: "Escucha con respeto los puntos de vista ajenos." }
            ]
          },
          {
            id: `obs_crit_${Date.now()}_2`,
            name: "Responsabilidad y Actitud",
            indicators: [
              { id: `obs_ind_${Date.now()}_21`, text: "Cumple puntualmente con los roles asignados." }
            ]
          }
        ],
        levels: [
          { id: `lvl_${Date.now()}_1`, name: "AD", label: "Siempre" },
          { id: `lvl_${Date.now()}_2`, name: "A", label: "Frecuentemente" },
          { id: `lvl_${Date.now()}_3`, name: "B", label: "A veces" },
          { id: `lvl_${Date.now()}_4`, name: "C", label: "Nunca" }
        ]
      };
    } else if (type === "Examen") {
      return {
        questions: [
          {
            id: `q_${Date.now()}_1`,
            type: "choice",
            text: "Pregunta 1: Comprensi\xF3n literal de conceptos clave.",
            points: 20,
            options: [
              { id: `opt_1_1`, label: "Opci\xF3n A" },
              { id: `opt_1_2`, label: "Opci\xF3n B" },
              { id: `opt_1_3`, label: "Opci\xF3n C" }
            ],
            correctValue: "opt_1_1"
          },
          {
            id: `q_${Date.now()}_2`,
            type: "choice",
            text: "Pregunta 2: An\xE1lisis inferencial del problema.",
            points: 20,
            options: [
              { id: `opt_2_1`, label: "Opci\xF3n A" },
              { id: `opt_2_2`, label: "Opci\xF3n B" },
              { id: `opt_2_3`, label: "Opci\xF3n C" }
            ],
            correctValue: "opt_2_1"
          },
          {
            id: `q_${Date.now()}_3`,
            type: "choice",
            text: "Pregunta 3: Interpretaci\xF3n cr\xEDtica del autor.",
            points: 20,
            options: [
              { id: `opt_3_1`, label: "Opci\xF3n A" },
              { id: `opt_3_2`, label: "Opci\xF3n B" },
              { id: `opt_3_3`, label: "Opci\xF3n C" }
            ],
            correctValue: "opt_3_1"
          },
          {
            id: `q_${Date.now()}_4`,
            type: "choice",
            text: "Pregunta 4: Vocabulario y sentido contextual.",
            points: 20,
            options: [
              { id: `opt_4_1`, label: "Opci\xF3n A" },
              { id: `opt_4_2`, label: "Opci\xF3n B" },
              { id: `opt_4_3`, label: "Opci\xF3n C" }
            ],
            correctValue: "opt_4_1"
          },
          {
            id: `q_${Date.now()}_5`,
            type: "choice",
            text: "Pregunta 5: Argumentaci\xF3n y opini\xF3n personal.",
            points: 20,
            options: [
              { id: `opt_5_1`, label: "Opci\xF3n A" },
              { id: `opt_5_2`, label: "Opci\xF3n B" },
              { id: `opt_5_3`, label: "Opci\xF3n C" }
            ],
            correctValue: "opt_5_1"
          }
        ],
        maxScore: 100
      };
    }
    return {};
  };
  const handleCreateEvaluation = (e) => {
    e.preventDefault();
    if (!newEvalName.trim()) return alert("Ingrese un nombre para la actividad.");
    if (!selectedCourseId || !selectedCompetenceId) return alert("Seleccione curso y competencia primero.");
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
    setNewEvalName("");
    setShowCreateModal(false);
  };
  const handleOpenConfigModal = (evalItem) => {
    const cloned = JSON.parse(JSON.stringify(evalItem));
    if (cloned.type === "Examen" && (!cloned.instrumentConfig || !cloned.instrumentConfig.questions)) {
      cloned.instrumentConfig = createDefaultInstrumentConfig("Examen");
    }
    setEditingEvalConfig(cloned);
  };
  const handleAutoGenerateEvaluations = () => {
    if (!selectedCourseId || !selectedCompetenceId) return alert("Seleccione curso y competencia primero.");
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
      name: "Examen Parcial",
      type: "Examen",
      instrumentConfig: {}
    };
    const eval2 = {
      courseId: selectedCourseId,
      competenceId: selectedCompetenceId,
      capacityId: cap2,
      bimester: selectedBimester,
      unit: selectedUnit,
      name: "Lista de Cotejo de Actividades",
      type: "Lista de Cotejo",
      instrumentConfig: createDefaultInstrumentConfig("Lista de Cotejo")
    };
    const eval3 = {
      courseId: selectedCourseId,
      competenceId: selectedCompetenceId,
      capacityId: cap3,
      bimester: selectedBimester,
      unit: selectedUnit,
      name: "R\xFAbrica de Proyecto",
      type: "Rubrica",
      instrumentConfig: createDefaultInstrumentConfig("Rubrica")
    };
    saveEvaluation(eval1);
    saveEvaluation(eval2);
    saveEvaluation(eval3);
    alert("Se han cargado las 3 evaluaciones de demostraci\xF3n con \xE9xito en este bimestre y unidad.");
  };
  const handleOpenGradingCell = (student, evaluation) => {
    setGradingStudent(student);
    setGradingEval(evaluation);
    const match = grades.find((g) => g.studentId === student.id && g.evaluationId === evaluation.id);
    if (match && match.details) {
      if (evaluation.type === "Examen") {
        setTempExamScore(match.score);
        setTempExamSelections(match.details.examSelections || {});
      } else if (evaluation.type === "Rubrica") {
        setTempRubricSelections(match.details.rubricSelections || {});
      } else if (evaluation.type === "Lista de Cotejo") {
        setTempChecklistSelections(match.details.checklistSelections || {});
      } else if (evaluation.type === "Lista de Cotejo 3 Niveles") {
        setTempChecklist3LvlSelections(match.details.checklist3LvlSelections || {});
      } else if (evaluation.type === "Guia de Observacion") {
        setTempObservationSelections(match.details.observationSelections || {});
        setTempObsComments(match.details.obsComments || "");
      }
    } else {
      setTempExamScore(gradingScale === "literal" ? "A" : 0);
      setTempExamSelections({});
      setTempRubricSelections({});
      setTempChecklistSelections({});
      setTempChecklist3LvlSelections({});
      setTempObservationSelections({});
      setTempObsComments("");
    }
  };
  const getCellScore = (studentId, evaluationId) => {
    const record = grades.find((g) => g.studentId === studentId && g.evaluationId === evaluationId);
    return record ? record.score : "-";
  };
  const getExamScore = (selections) => {
    let score = 0;
    if (!selections) return 0;
    if (selections.q1) {
      if (selections.q1.narradora === "magic_finger") score += 1;
      if (selections.q1.philip === "8_years") score += 1;
      if (selections.q1.william === "11_years") score += 1;
      if (selections.q1.gregg === "hunt") score += 1;
    }
    if (selections.q2) {
      if (selections.q2.a === "rojo") score += 1;
      if (selections.q2.b === "escopeta") score += 1;
      if (selections.q2.c === "bosque") score += 1;
      if (selections.q2.d === "cervatillo") score += 1;
    }
    if (selections.q3) {
      if (selections.q3.evA === "4") score += 1;
      if (selections.q3.evB === "3") score += 1;
      if (selections.q3.evC === "1") score += 1;
      if (selections.q3.evD === "2") score += 1;
    }
    if (selections.q4) {
      if (selections.q4.cazar === "no_le_gusta") score += 1;
      if (selections.q4.proteger === "le_gusta") score += 1;
      if (selections.q4.burlarse === "no_le_gusta") score += 1;
      if (selections.q4.convencer === "le_gusta") score += 1;
    }
    if (selections.q5 === "enfado") {
      score += 4;
    }
    return score;
  };
  const liveCalculatedScore = useMemo(() => {
    const isLiteral = gradingScale === "literal";
    if (!gradingEval) return "";
    if (gradingEval.type === "Examen") {
      const questions = gradingEval.instrumentConfig?.questions || [];
      const hasSelections = Object.values(tempExamSelections).some((v) => {
        if (typeof v === "object" && v !== null) {
          return Object.values(v).some((val) => val !== void 0 && val !== null && val !== "");
        }
        return v !== void 0 && v !== null && v !== "";
      });
      if (!hasSelections) return "";
      let ratio = 0;
      if (questions.length > 0) {
        let obtainedPoints = 0;
        let totalMaxPoints = 0;
        questions.forEach((q) => {
          const points = parseFloat(q.points) || 0;
          totalMaxPoints += points;
          if (q.hasSubQuestions && q.subQuestions && q.subQuestions.length > 0) {
            const subQs = q.subQuestions;
            const subQPts = points / subQs.length;
            const qSelections = tempExamSelections[q.id] || {};
            subQs.forEach((subQ) => {
              const selectedVal = qSelections[subQ.id];
              if (subQ.type === "choice") {
                if (selectedVal === subQ.correctValue) {
                  obtainedPoints += subQPts;
                }
              } else if (subQ.type === "matching") {
                const subMatchQs = subQ.subQuestions || [];
                const matchQPts = subMatchQs.length > 0 ? subQPts / subMatchQs.length : 0;
                const matchSelections = selectedVal || {};
                subMatchQs.forEach((mQ) => {
                  if (matchSelections[mQ.id] === mQ.correctValue) {
                    obtainedPoints += matchQPts;
                  }
                });
              } else {
                if (selectedVal === true) {
                  obtainedPoints += subQPts;
                }
              }
            });
          } else {
            if (q.type === "choice") {
              if (tempExamSelections[q.id] === q.correctValue) {
                obtainedPoints += points;
              }
            } else if (q.type === "matching") {
              const subQs = q.subQuestions || [];
              const subQPts = subQs.length > 0 ? points / subQs.length : 0;
              const qSelections = tempExamSelections[q.id] || {};
              subQs.forEach((subQ) => {
                if (qSelections[subQ.id] === subQ.correctValue) {
                  obtainedPoints += subQPts;
                }
              });
            } else {
              if (tempExamSelections[q.id] === true) {
                obtainedPoints += points;
              }
            }
          }
        });
        ratio = totalMaxPoints > 0 ? obtainedPoints / totalMaxPoints : 0;
      } else {
        const score = getExamScore(tempExamSelections);
        ratio = score / 20;
      }
      if (isLiteral) {
        if (ratio >= 0.75) return "A";
        if (ratio >= 0.4) return "B";
        return "C";
      } else {
        const scaleVal = gradingScale === "20" ? 20 : 10;
        return parseFloat(ratio * scaleVal);
      }
    }
    if (gradingEval.type === "Rubrica") {
      const criteriaList = gradingEval.instrumentConfig?.criteriaList || [];
      if (criteriaList.length === 0) return "";
      let totalPoints = 0;
      let selectionCount = 0;
      criteriaList.forEach((crit) => {
        const sel = tempRubricSelections[crit.id];
        if (sel) {
          selectionCount++;
          if (sel === "AD") totalPoints += 4;
          else if (sel === "A") totalPoints += 3;
          else if (sel === "B") totalPoints += 2;
          else if (sel === "C") totalPoints += 1;
        }
      });
      if (selectionCount === 0) return "";
      const avg = totalPoints / selectionCount;
      if (isLiteral) {
        if (avg >= 3.5) return "AD";
        if (avg >= 2.5) return "A";
        if (avg >= 1.5) return "B";
        return "C";
      } else {
        const scaleVal = gradingScale === "20" ? 20 : 10;
        return parseFloat(avg / 4 * scaleVal);
      }
    }
    if (gradingEval.type === "Lista de Cotejo 3 Niveles") {
      const criteriaList = gradingEval.instrumentConfig?.criteriaList || [];
      if (criteriaList.length === 0) return "";
      const hasSelections = Object.keys(tempChecklist3LvlSelections).length > 0;
      if (!hasSelections) return "";
      let totalMaxPoints = 0;
      let totalObtainedPoints = 0;
      criteriaList.forEach((crit) => {
        const points = parseFloat(crit.points) || 0;
        totalMaxPoints += points;
        const indicators = crit.indicators || [];
        if (indicators.length > 0) {
          const indicatorWeight = points / indicators.length;
          indicators.forEach((ind) => {
            const selectedVal = tempChecklist3LvlSelections[ind.id];
            if (selectedVal === "A") {
              totalObtainedPoints += indicatorWeight;
            } else if (selectedVal === "B") {
              totalObtainedPoints += indicatorWeight * (2 / 3);
            } else if (selectedVal === "C") {
              totalObtainedPoints += indicatorWeight * (1 / 3);
            }
          });
        }
      });
      if (totalMaxPoints === 0) return 0;
      const ratio = totalObtainedPoints / totalMaxPoints;
      const avg = ratio * 3;
      if (isLiteral) {
        if (avg >= 2.5) return "A";
        if (avg >= 1.5) return "B";
        return "C";
      } else {
        const scaleVal = gradingScale === "20" ? 20 : 10;
        return parseFloat((ratio * scaleVal).toFixed(2));
      }
    }
    if (gradingEval.type === "Lista de Cotejo") {
      const items = gradingEval.instrumentConfig?.items || [];
      if (items.length === 0) return "";
      const hasSelections = Object.values(tempChecklistSelections).some((v) => v === true);
      if (!hasSelections) return "";
      let yesCount = 0;
      items.forEach((it) => {
        if (tempChecklistSelections[it.id]) {
          yesCount++;
        }
      });
      const ratio = yesCount / items.length;
      if (isLiteral) {
        if (ratio >= 0.75) return "A";
        if (ratio >= 0.4) return "B";
        return "C";
      } else {
        const scaleVal = gradingScale === "20" ? 20 : 10;
        return parseFloat(ratio * scaleVal);
      }
    }
    if (gradingEval.type === "Guia de Observacion") {
      const criteriaList = gradingEval.instrumentConfig?.criteriaList || [];
      const totalIndicators = criteriaList.reduce((acc, c) => acc + (c.indicators?.length || 0), 0);
      if (totalIndicators === 0) return "";
      let points = 0;
      let ratedCount = 0;
      criteriaList.forEach((crit) => {
        crit.indicators?.forEach((ind) => {
          const lvlId = tempObservationSelections[ind.id];
          if (lvlId) {
            const lvlObj = gradingEval.instrumentConfig?.levels?.find((l) => l.id === lvlId);
            if (lvlObj) {
              ratedCount++;
              if (lvlObj.name === "AD" || lvlObj.name === "Siempre") points += 4;
              else if (lvlObj.name === "A" || lvlObj.name === "Frecuentemente") points += 3;
              else if (lvlObj.name === "B" || lvlObj.name === "A veces") points += 2;
              else if (lvlObj.name === "C" || lvlObj.name === "Nunca") points += 1;
            }
          }
        });
      });
      if (ratedCount === 0) return "";
      const avg = points / ratedCount;
      if (isLiteral) {
        if (avg >= 3.5) return "AD";
        if (avg >= 2.5) return "A";
        if (avg >= 1.5) return "B";
        return "C";
      } else {
        const scaleVal = gradingScale === "20" ? 20 : 10;
        return parseFloat(avg / 4 * scaleVal);
      }
    }
    return "";
  }, [gradingEval, tempExamScore, tempExamSelections, tempRubricSelections, tempChecklistSelections, tempChecklist3LvlSelections, tempObservationSelections, gradingScale]);
  const handleSaveStudentGrade = () => {
    if (!gradingStudent || !gradingEval) return;
    if (liveCalculatedScore === "") {
      alert("Por favor, registre el calificativo antes de guardar.");
      return;
    }
    const match = grades.find((g) => g.studentId === gradingStudent.id && g.evaluationId === gradingEval.id);
    const payload = {
      studentId: gradingStudent.id,
      courseId: selectedCourseId,
      competenceId: selectedCompetenceId,
      evaluationId: gradingEval.id,
      instrument: gradingEval.type,
      score: liveCalculatedScore,
      bimester: selectedBimester,
      unit: selectedUnit,
      teacherId: currentRole === "teacher" ? currentUser?.id : "admin_1",
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
    if (liveCalculatedScore === "") return;
    const match = grades.find((g) => g.studentId === gradingStudent.id && g.evaluationId === gradingEval.id);
    const payload = {
      studentId: gradingStudent.id,
      courseId: selectedCourseId,
      competenceId: selectedCompetenceId,
      evaluationId: gradingEval.id,
      instrument: gradingEval.type,
      score: liveCalculatedScore,
      bimester: selectedBimester,
      unit: selectedUnit,
      teacherId: currentRole === "teacher" ? currentUser?.id : "admin_1",
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
    const currentIndex = enrolledStudents.findIndex((s) => s.id === gradingStudent.id);
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
    const currentIndex = enrolledStudents.findIndex((s) => s.id === gradingStudent.id);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= enrolledStudents.length) {
      nextIndex = 0;
    }
    const nextStudent = enrolledStudents[nextIndex];
    handleOpenGradingCell(nextStudent, gradingEval);
  };
  const calculateStudentOverallAverage = (studentId) => {
    if (activeEvaluations.length === 0) return "-";
    const scores = activeEvaluations.map((evalItem) => {
      const g = grades.find((record) => record.studentId === studentId && record.evaluationId === evalItem.id);
      return g ? g.score : null;
    }).filter((s) => s !== null && s !== void 0 && s !== "");
    if (scores.length === 0) return "-";
    const isLiteral = gradingScale === "literal";
    if (isLiteral) {
      const points = scores.map((s) => {
        if (s === "AD") return 4;
        if (s === "A") return 3;
        if (s === "B") return 2;
        if (s === "C") return 1;
        return null;
      }).filter((n) => n !== null);
      if (points.length === 0) return "-";
      const avg = points.reduce((sum, val) => sum + val, 0) / points.length;
      if (avg >= 3.5) return "AD";
      if (avg >= 2.5) return "A";
      if (avg >= 1.5) return "B";
      return "C";
    } else {
      const numericScores = scores.map((s) => parseFloat(s)).filter((n) => !isNaN(n));
      if (numericScores.length === 0) return "-";
      return numericScores.reduce((sum, val) => sum + val, 0) / numericScores.length;
    }
  };
  const getCompetenceAverage = (studentId, competenceId) => {
    const compEvals = evaluations.filter(
      (e) => e.courseId === selectedCourseId && e.competenceId === competenceId && (e.bimester || "1") === selectedBimester && (e.unit !== void 0 && e.unit !== null ? String(e.unit) : "0") === String(selectedUnit) && !e.isReinforcement
    );
    if (compEvals.length === 0) return "-";
    const scores = compEvals.map((evalItem) => {
      const g = grades.find((record) => record.studentId === studentId && record.evaluationId === evalItem.id);
      return g ? g.score : null;
    }).filter((s) => s !== null && s !== void 0 && s !== "");
    if (scores.length === 0) return "-";
    const isLiteral = gradingScale === "literal";
    if (isLiteral) {
      const points = scores.map((s) => {
        if (s === "AD") return 4;
        if (s === "A") return 3;
        if (s === "B") return 2;
        if (s === "C") return 1;
        return null;
      }).filter((n) => n !== null);
      if (points.length === 0) return "-";
      const avg = points.reduce((sum, val) => sum + val, 0) / points.length;
      if (avg >= 3.5) return "AD";
      if (avg >= 2.5) return "A";
      if (avg >= 1.5) return "B";
      return "C";
    } else {
      const numericScores = scores.map((s) => parseFloat(s)).filter((n) => !isNaN(n));
      if (numericScores.length === 0) return "-";
      return numericScores.reduce((sum, val) => sum + val, 0) / numericScores.length;
    }
  };
  const getCompetenceReinforcementAverage = (studentId, competenceId) => {
    const compReinEvals = evaluations.filter(
      (e) => e.courseId === selectedCourseId && e.competenceId === competenceId && (e.bimester || "1") === selectedBimester && e.isReinforcement === true
    );
    if (compReinEvals.length === 0) return "-";
    const scores = compReinEvals.map((evalItem) => {
      const record = reinforcementGrades.find(
        (g) => g.studentId === studentId && g.evaluationId === evalItem.id && String(g.bimester || "1") === String(selectedBimester)
      );
      return record && record.score !== void 0 && record.score !== "" ? record.score : null;
    }).filter((s) => s !== null);
    if (scores.length === 0) return "-";
    const isLiteral = gradingScale === "literal";
    if (isLiteral) {
      const points = scores.map((s) => {
        if (s === "AD") return 4;
        if (s === "A") return 3;
        if (s === "B") return 2;
        if (s === "C") return 1;
        return null;
      }).filter((n) => n !== null);
      if (points.length === 0) return "-";
      const avg = points.reduce((sum, val) => sum + val, 0) / points.length;
      if (avg >= 3.5) return "AD";
      if (avg >= 2.5) return "A";
      if (avg >= 1.5) return "B";
      return "C";
    } else {
      const numericScores = scores.map((s) => parseFloat(s)).filter((n) => !isNaN(n));
      if (numericScores.length === 0) return "-";
      return numericScores.reduce((sum, val) => sum + val, 0) / numericScores.length;
    }
  };
  const getFinalCompetenceGrade = (regAvg, reinfAvg) => {
    if (regAvg === "-") return "-";
    if (reinfAvg === "-") return regAvg;
    const isLiteral = gradingScale === "literal";
    if (isLiteral) {
      const valMap = { "AD": 4, "A": 3, "B": 2, "C": 1 };
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
  const handleExportConsolidatedExcel = async () => {
    if (!activeCourse) return alert("Seleccione un curso para exportar.");
    try {
      const response = await axios.post("/api/excel/export-consolidated", {
        courseName: activeCourse.name,
        gradeLevel: `${selectedGrade} - Secc. ${selectedSection}`,
        bimester: selectedBimester,
        unit: selectedUnit,
        competencies: activeCourse.competencies || [],
        students: enrolledStudents,
        grades: grades.filter(
          (g) => g.courseId === selectedCourseId && (g.bimester || "1") === selectedBimester && (g.unit !== void 0 && g.unit !== null ? String(g.unit) : "0") === selectedUnit
        ),
        reinforcementGrades: reinforcementGrades || [],
        evaluations: evaluations.filter((e) => e.courseId === selectedCourseId),
        gradingScale
      }, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Consolidado_Competencias_${activeCourse.name.replace(/\s+/g, "_")}_B${selectedBimester}_U${selectedUnit}.xlsx`;
      link.click();
    } catch (error) {
      console.error("Failed to export report:", error);
      alert("Error al generar el reporte del consolidado en Excel.");
    }
  };
  const handleExportEvalGrades = async (evalItem) => {
    try {
      const evalGrades = grades.filter((g) => g.evaluationId === evalItem.id);
      const response = await axios.post("/api/excel/export-evaluation-grades", {
        evaluation: evalItem,
        students: enrolledStudents,
        grades: evalGrades
      }, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Notas_${evalItem.name.replace(/\s+/g, "_")}.xlsx`;
      link.click();
    } catch (error) {
      console.error("Failed to export evaluation grades:", error);
      alert("Error al exportar calificaciones del instrumento a Excel.");
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
    const evalItem = evaluations.find((ev) => ev.id === importingEvalId);
    if (!evalItem) {
      alert("Error: evaluaci\xF3n no encontrada.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("evaluation", JSON.stringify(evalItem));
      const response = await axios.post("/api/excel/import-evaluation-grades", formData);
      const { grades: parsedGrades, count } = response.data;
      if (count === 0) {
        alert("No se encontraron calificaciones en el archivo.");
        return;
      }
      const confirmed = window.confirm(`Se encontraron ${count} calificaciones. \xBFDeseas importarlas?`);
      if (!confirmed) return;
      const batchPayloads = [];
      parsedGrades.forEach((pg) => {
        const student = enrolledStudents.find((s) => s.dni === pg.dni || s.name === pg.name);
        if (!student || pg.score === "" || pg.score === "-") return;
        batchPayloads.push({
          studentId: student.id,
          courseId: selectedCourseId,
          competenceId: selectedCompetenceId,
          evaluationId: importingEvalId,
          instrument: evalItem.type,
          score: pg.score,
          teacherId: currentUser?.id || "tch_1",
          bimester: selectedBimester,
          unit: selectedUnit,
          details: pg.details
        });
      });
      const saved = saveGradesBatch(batchPayloads);
      alert(`Importaci\xF3n completada: ${saved} calificaciones guardadas.`);
    } catch (error) {
      console.error("Failed to import evaluation grades:", error);
      alert("Error al importar calificaciones. Verifica que el archivo tenga el formato correcto.");
    } finally {
      setImportingEvalId(null);
      e.target.value = "";
    }
  };
  const backupFileInputRef = useRef(null);
  const handleFullBackup = async () => {
    try {
      const response = await axios.post("/api/excel/export-full-backup", {
        grades,
        evaluations,
        students: contextStudents,
        courses: contextCourses
      }, { responseType: "json" });
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `backup_sga_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
      link.click();
      alert(`Backup completado: ${response.data.totalGrades} calificaciones respaldadas.`);
    } catch (error) {
      console.error("Failed to create backup:", error);
      alert("Error al generar el backup completo.");
    }
  };
  const [restoringBackup, setRestoringBackup] = useState(false);
  const handleBackupFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoringBackup(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("existingGrades", JSON.stringify(grades));
      const response = await axios.post("/api/excel/import-full-backup", formData);
      const { missingCount, grades: missingGrades, totalInBackup, backupInfo } = response.data;
      if (missingCount === 0) {
        alert(`\u2705 Backup verificado: las ${totalInBackup} calificaciones ya existen. No hay nada que restaurar.`);
        return;
      }
      const proceed = window.confirm(
        `Backup del ${new Date(backupInfo.exportedAt).toLocaleDateString("es-PE")}
Total en backup: ${totalInBackup}
Ya existentes: ${totalInBackup - missingCount}
Faltantes por restaurar: ${missingCount}

\xBFRestaurar solo las ${missingCount} calificaciones faltantes?
(No se sobrescribir\xE1 ninguna nota existente)`
      );
      if (!proceed) return;
      let saved = 0;
      let skipped = 0;
      missingGrades.forEach((pg) => {
        const student = contextStudents.find((s) => s.id === pg.studentId);
        if (!student) {
          skipped++;
          return;
        }
        const evalObj = evaluations.find((e2) => e2.id === pg.evaluationId);
        if (!evalObj) {
          skipped++;
          return;
        }
        saveGrade({
          studentId: pg.studentId,
          courseId: pg.courseId,
          competenceId: pg.competenceId,
          evaluationId: pg.evaluationId,
          instrument: pg.instrument || evalObj.type,
          score: pg.score,
          teacherId: currentUser?.id || "tch_1",
          bimester: pg.bimester || "1",
          unit: pg.unit ?? "0",
          details: pg.details || null
        });
        saved++;
      });
      alert(
        `\u2705 Restauraci\xF3n completada:
  \u2022 ${saved} calificaciones restauradas
` + (skipped > 0 ? `  \u2022 ${skipped} omitidas (sin estudiante/evaluaci\xF3n)
` : "") + `  \u2022 ${totalInBackup - missingCount} ya exist\xEDan (sin cambios)`
      );
    } catch (error) {
      console.error("Failed to restore backup:", error);
      alert("Error al restaurar backup. Verifica que el archivo sea un backup v\xE1lido (.json).");
    } finally {
      setRestoringBackup(false);
      e.target.value = "";
    }
  };
  const handleProcessImportRawText = (text) => {
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const firstLine = lines[0];
    let sep = "	";
    if (firstLine.includes("	")) sep = "	";
    else if (firstLine.includes(";")) sep = ";";
    else if (firstLine.includes(",")) sep = ",";
    const rows = lines.map((l) => l.split(sep).map((c) => c.trim()));
    setParsedRows(rows);
    const firstRow = rows[0];
    const newMappings = {};
    firstRow.forEach((cell, idx) => {
      const cleanCell = cell.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (cleanCell.includes("dni") || cleanCell.includes("documento") || /^\d{8}$/.test(cell)) {
        newMappings[idx] = "dni";
      } else if (cleanCell.includes("nombre") || cleanCell.includes("apellido") || cleanCell.includes("estudiante") || cleanCell.includes("alumno")) {
        newMappings[idx] = "name";
      } else if (cleanCell.includes("nota") || cleanCell.includes("calif") || cleanCell.includes("score") || cleanCell.includes("eval") || ["ad", "a", "b", "c"].includes(cell.toLowerCase())) {
        newMappings[idx] = "grade";
      } else {
        if (idx === 0) newMappings[idx] = "dni";
        else if (idx === 1) newMappings[idx] = "name";
        else if (idx === 2) newMappings[idx] = "grade";
        else newMappings[idx] = "ignore";
      }
    });
    setColumnMappings(newMappings);
  };
  useEffect(() => {
    handleProcessImportRawText(importRawText);
  }, [importRawText]);
  const importPreview = useMemo(() => {
    if (parsedRows.length === 0) return [];
    const dniColIndex = Object.keys(columnMappings).find((k) => columnMappings[k] === "dni");
    const nameColIndex = Object.keys(columnMappings).find((k) => columnMappings[k] === "name");
    const gradeColIndex = Object.keys(columnMappings).find((k) => columnMappings[k] === "grade");
    const cleanName = (str) => {
      if (!str) return "";
      return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
    };
    return parsedRows.map((row, rIdx) => {
      const rowDni = dniColIndex !== void 0 ? row[dniColIndex] : "";
      const rowName = nameColIndex !== void 0 ? row[nameColIndex] : "";
      const rowGrade = gradeColIndex !== void 0 ? row[gradeColIndex] : "";
      let student = null;
      let method = "none";
      if (rowDni) {
        const cleanD = rowDni.replace(/[^0-9]/g, "");
        if (cleanD.length === 8) {
          student = enrolledStudents.find((s) => s.dni === cleanD);
          if (student) method = "dni";
        }
      }
      if (!student && rowName) {
        const cleanRN = cleanName(rowName);
        student = enrolledStudents.find((s) => cleanName(s.name) === cleanRN);
        if (student) method = "name_exact";
      }
      if (!student && rowName) {
        const cleanRN = cleanName(rowName);
        const rowWords = cleanRN.split(" ").filter((w) => w.length > 2);
        if (rowWords.length > 0) {
          let bestMatch = null;
          let maxScore = 0;
          enrolledStudents.forEach((s) => {
            const sClean = cleanName(s.name);
            const sWords = sClean.split(" ");
            let score = 0;
            rowWords.forEach((w) => {
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
            method = "name_fuzzy";
          }
        }
      }
      let validGrade = rowGrade;
      const isLiteral = gradingScale === "literal";
      if (isLiteral) {
        const upper = String(rowGrade).toUpperCase().trim();
        if (["AD", "A", "B", "C"].includes(upper)) {
          validGrade = upper;
        } else {
          validGrade = "";
        }
      } else {
        const parsedGrade = parseFloat(rowGrade);
        const limit = parseFloat(gradingScale);
        if (!isNaN(parsedGrade) && parsedGrade >= 0 && parsedGrade <= limit) {
          validGrade = parsedGrade;
        } else {
          validGrade = "";
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
        status: student ? method === "dni" || method === "name_exact" ? "success" : "warning" : "danger"
      };
    });
  }, [parsedRows, columnMappings, enrolledStudents, gradingScale]);
  const handleApplyImport = async () => {
    if (importPreview.length === 0) return alert("No hay registros para importar.");
    if (!importTargetEvalId) return alert("Seleccione una columna de evaluaci\xF3n de destino.");
    let targetEvalId = importTargetEvalId;
    if (importTargetEvalId === "new") {
      if (!newImportEvalName.trim()) return alert("Ingrese un nombre para la nueva actividad.");
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
    importPreview.forEach((item) => {
      if (item.student && item.validGrade !== "") {
        const match = grades.find((g) => g.studentId === item.student.id && g.evaluationId === targetEvalId);
        const payload = {
          studentId: item.student.id,
          courseId: selectedCourseId,
          competenceId: selectedCompetenceId,
          evaluationId: targetEvalId,
          instrument: "Examen",
          score: item.validGrade,
          bimester: selectedBimester,
          unit: selectedUnit,
          teacherId: currentRole === "teacher" ? currentUser?.id : "admin_1",
          lastKnownUpdate: match?.updatedAt || null,
          details: {
            rubricSelections: {},
            checklistSelections: {},
            observationSelections: {},
            obsComments: "Nota cargada por importador flexible"
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
      setImportRawText("");
      setImportFeedback(null);
    }, 2e3);
  };
  const handleSaveEvalConfig = () => {
    if (!editingEvalConfig) return;
    saveEvaluation(editingEvalConfig);
    setEditingEvalConfig(null);
  };
  const handleExportExcel = async () => {
    if (!activeCourse) return alert("Seleccione un curso para exportar.");
    try {
      const response = await axios.post("/api/excel/export-grades", {
        courseName: activeCourse.name,
        gradeLevel: `${selectedGrade} - Secc. ${selectedSection}`,
        bimester: selectedBimester,
        unit: selectedUnit,
        competencies: activeCourse.competencies || [],
        students: enrolledStudents,
        grades: grades.filter(
          (g) => g.courseId === selectedCourseId && (g.bimester || "1") === selectedBimester && (g.unit !== void 0 && g.unit !== null ? String(g.unit) : "0") === selectedUnit
        )
      }, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Reporte_Notas_${activeCourse.name.replace(/\s+/g, "_")}_B${selectedBimester}_U${selectedUnit}.xlsx`;
      link.click();
    } catch (error) {
      console.error("Failed to export report:", error);
      alert("Error al generar el reporte en Excel.");
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "text-3xl font-extrabold tracking-tight" }, "Registro de Calificaciones"), /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 dark:text-slate-400 mt-1" }, "Evaluaci\xF3n formativa. Cuadr\xEDcula Excel interactiva con instrumentos editables independientes.")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleFullBackup,
      className: "border-[3.5px] border-[#3b82f6] hover:bg-blue-50 dark:hover:bg-blue-950/20 text-[#3b82f6] bg-white dark:bg-slate-900 rounded-2xl px-5 py-3 flex items-center gap-2 text-xs font-black transition-all active:scale-95 shadow-sm",
      title: "Respalda TODAS las calificaciones con detalles (claves, r\xFAbricas, listas) en un archivo JSON"
    },
    /* @__PURE__ */ React.createElement(Download, { className: "h-4.5 w-4.5" }),
    "Backup Completo"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => backupFileInputRef.current?.click(),
      className: "border-[3.5px] border-[#8b5cf6] hover:bg-violet-50 dark:hover:bg-violet-950/20 text-[#8b5cf6] bg-white dark:bg-slate-900 rounded-2xl px-5 py-3 flex items-center gap-2 text-xs font-black transition-all active:scale-95 shadow-sm",
      title: "Restaura solo las calificaciones faltantes desde un backup (no sobrescribe)"
    },
    /* @__PURE__ */ React.createElement(Upload, { className: "h-4.5 w-4.5" }),
    "Restaurar Backup"
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: backupFileInputRef,
      type: "file",
      accept: ".json",
      style: { display: "none" },
      onChange: handleBackupFileSelected
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "glass-card p-6 space-y-4" }, !isEmbedded ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-400 mb-1.5" }, "Grado de Estudios"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: selectedGrade,
      onChange: (e) => {
        setSelectedGrade(e.target.value);
        setSelectedCourseId("");
      },
      className: "w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2.5 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900"
    },
    /* @__PURE__ */ React.createElement("option", { value: "Todas" }, "Todos los Grados"),
    availableGrades.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }, g))
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-400 mb-1.5" }, "Curso / Materia"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: selectedCourseId,
      onChange: (e) => setSelectedCourseId(e.target.value),
      className: "w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2.5 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900"
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "Seleccione Curso"),
    visibleCourses.map((c) => {
      const asgs = c.assignments || [];
      const relevantAsgs = currentRole === "teacher" ? asgs.filter((a) => a.teacherId === currentUser?.id) : asgs;
      const gradesText = Array.from(new Set(relevantAsgs.map((a) => a.gradeLevel))).join(", ");
      return /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.name, " (", gradesText, ")");
    })
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-400 mb-1.5" }, "Competencia a Evaluar"), viewMode === "consolidado" ? /* @__PURE__ */ React.createElement("div", { className: "w-full rounded-xl border border-slate-200 bg-slate-100/60 px-3.5 py-2.5 text-sm font-bold dark:border-slate-800 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 italic" }, "Todas las Competencias") : /* @__PURE__ */ React.createElement(
    "select",
    {
      value: selectedCompetenceId,
      onChange: (e) => setSelectedCompetenceId(e.target.value),
      className: "w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2.5 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900"
    },
    activeCourse?.competencies?.map((comp) => /* @__PURE__ */ React.createElement("option", { key: comp.id, value: comp.id }, comp.name)),
    !activeCourse?.competencies?.length && /* @__PURE__ */ React.createElement("option", { value: "" }, "Sin competencias configuradas")
  ))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/40" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-400 mb-1.5" }, "Secci\xF3n del Aula"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: selectedSection,
      onChange: (e) => setSelectedSection(e.target.value),
      className: "w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2.5 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900"
    },
    /* @__PURE__ */ React.createElement("option", { value: "Todas" }, "Todas las Secciones"),
    availableSections.map((s) => /* @__PURE__ */ React.createElement("option", { key: s, value: s }, "Secci\xF3n ", s))
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-400 mb-1.5" }, "Bimestre"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: selectedBimester,
      onChange: (e) => setSelectedBimester(e.target.value),
      className: "w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2.5 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900"
    },
    bimestersOptions.map((opt) => /* @__PURE__ */ React.createElement("option", { key: opt.value, value: opt.value }, opt.label))
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-400 mb-1.5" }, "Unidad de Aprendizaje"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: selectedUnit,
      onChange: (e) => setSelectedUnit(e.target.value),
      className: "w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2.5 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900"
    },
    unitOptions.map((opt) => /* @__PURE__ */ React.createElement("option", { key: opt.value, value: opt.value }, opt.label))
  )))) : /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-400 mb-1.5" }, "Competencia a Evaluar"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: selectedCompetenceId,
      onChange: (e) => setSelectedCompetenceId(e.target.value),
      className: "w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2.5 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900 font-bold text-indigo-600 dark:text-indigo-400"
    },
    activeCourse?.competencies?.map((comp) => /* @__PURE__ */ React.createElement("option", { key: comp.id, value: comp.id }, comp.name)),
    !activeCourse?.competencies?.length && /* @__PURE__ */ React.createElement("option", { value: "" }, "Sin competencias configuradas")
  )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col justify-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold uppercase text-slate-400" }, "Contexto de Notas Activo"), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-extrabold text-slate-700 dark:text-slate-200 mt-1 uppercase tracking-wider" }, selectedGrade, " - SECCI\xD3N ", selectedSection, " \u2022 Bimestre ", selectedBimester, " \u2022 Unidad ", selectedUnit)))), /* @__PURE__ */ React.createElement("div", { className: "flex border-b border-slate-200 dark:border-slate-800/80 gap-1" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setViewMode("auxiliar"),
      className: `px-5 py-3 text-xs font-bold border-b-2 uppercase tracking-wider transition-all ${viewMode === "auxiliar" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold" : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650"}`
    },
    "Registro Auxiliar"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setViewMode("consolidado"),
      className: `px-5 py-3 text-xs font-bold border-b-2 uppercase tracking-wider transition-all ${viewMode === "consolidado" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold" : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650"}`
    },
    "Consolidado de Competencias"
  )), /* @__PURE__ */ React.createElement("div", { className: "glass-card p-6 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center border-b border-slate-100 pb-4 dark:border-slate-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(FileSpreadsheet, { className: "h-5 w-5 text-indigo-500" }), /* @__PURE__ */ React.createElement("h4", { className: "text-lg font-bold" }, "Cuadr\xEDcula de Evaluaciones")), selectedCourseId && selectedCompetenceId && /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowCurriculumMap(!showCurriculumMap),
      className: `btn-neuro-secondary flex items-center gap-1.5 text-xs py-2 px-3 transition hover:scale-105 active:scale-95 ${showCurriculumMap ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200" : ""}`
    },
    /* @__PURE__ */ React.createElement(Info, { className: "h-4 w-4" }),
    showCurriculumMap ? "Ocultar Curr\xEDculo" : "Ver Mapa Curricular"
  ), activeEvaluations.length === 0 && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleAutoGenerateEvaluations,
      className: "btn-neuro-success flex items-center gap-1.5 text-xs py-2 px-3 hover:scale-105 active:scale-95 transition-transform"
    },
    /* @__PURE__ */ React.createElement(Sparkles, { className: "h-4 w-4" }),
    "Cargar Demo"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowCreateModal(true),
      className: "btn-neuro-primary flex items-center gap-1.5 text-xs py-2 px-3 hover:scale-105 active:scale-95 transition-transform"
    },
    /* @__PURE__ */ React.createElement(Plus, { className: "h-4 w-4" }),
    "Nueva Actividad"
  ))), viewMode === "consolidado" ? /* @__PURE__ */ React.createElement("div", { className: "w-full overflow-hidden space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800" }, /* @__PURE__ */ React.createElement("table", { className: "w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-slate-100 text-xs font-bold uppercase text-slate-700 dark:bg-slate-900/60 dark:text-slate-300" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { rowSpan: "2", className: "px-4 py-3 w-12 border border-slate-200 dark:border-slate-800 text-center" }, "N\xB0"), /* @__PURE__ */ React.createElement("th", { rowSpan: "2", className: "px-4 py-3 min-w-[200px] border border-slate-200 dark:border-slate-800" }, "Estudiante"), /* @__PURE__ */ React.createElement("th", { rowSpan: "2", className: "px-4 py-3 w-28 border border-slate-200 dark:border-slate-800 text-center" }, "DNI"), activeCourse?.competencies?.map((comp, idx) => /* @__PURE__ */ React.createElement("th", { key: comp.id, colSpan: "3", className: "px-3 py-2 border border-slate-200 dark:border-slate-800 text-center" }, /* @__PURE__ */ React.createElement("span", { className: "font-extrabold text-slate-900 dark:text-white block truncate max-w-[280px]", title: comp.name }, "C", idx + 1, ": ", comp.name))), (!activeCourse?.competencies || activeCourse.competencies.length === 0) && /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 border border-slate-200 dark:border-slate-800 text-slate-400 font-semibold text-center italic" }, "Sin competencias asignadas")), /* @__PURE__ */ React.createElement("tr", null, activeCourse?.competencies?.map((comp) => /* @__PURE__ */ React.createElement(React.Fragment, { key: comp.id }, /* @__PURE__ */ React.createElement("th", { className: "px-2 py-1.5 border border-slate-200 dark:border-slate-800 text-center font-bold text-[10px] w-20 bg-indigo-50/15" }, "Regular"), /* @__PURE__ */ React.createElement("th", { className: "px-2 py-1.5 border border-slate-200 dark:border-slate-800 text-center font-bold text-[10px] w-20 bg-purple-50/15" }, "Refuerzo"), /* @__PURE__ */ React.createElement("th", { className: "px-2 py-1.5 border border-slate-200 dark:border-slate-800 text-center font-bold text-[10px] w-20 bg-emerald-50/15" }, "Final"))))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-slate-200 dark:divide-slate-800" }, enrolledStudents.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 3 + (activeCourse?.competencies?.length || 0) * 3, className: "px-6 py-10 text-center text-slate-450 italic" }, "No se encontraron estudiantes matriculados.")) : enrolledStudents.map((std, idx) => /* @__PURE__ */ React.createElement("tr", { key: std.id, className: "hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition" }, /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 font-bold text-slate-400 border border-slate-200 dark:border-slate-800 text-center" }, idx + 1), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement("img", { src: std.avatar, alt: std.name, className: "h-7 w-7 rounded-full object-cover border border-slate-200" }), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-xs" }, std.name))), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 font-mono text-xs font-semibold border border-slate-200 dark:border-slate-800 text-center" }, std.dni), activeCourse?.competencies?.map((comp) => {
    const regAvg = getCompetenceAverage(std.id, comp.id);
    const reinfAvg = getCompetenceReinforcementAverage(std.id, comp.id);
    const finalGrade = getFinalCompetenceGrade(regAvg, reinfAvg);
    const isPassing = (grade) => {
      if (grade === "-") return true;
      if (gradingScale === "literal") return ["AD", "A", "B"].includes(grade);
      return parseFloat(grade) >= (gradingScale === "20" ? 11 : 6);
    };
    const getGradeClass = (grade, highlight = false) => {
      if (grade === "-") return "text-slate-400 font-black text-sm";
      if (grade === "AD") return highlight ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-black px-3 py-1 rounded-xl text-sm" : "text-emerald-600 dark:text-emerald-400 font-black text-sm";
      if (grade === "A") return highlight ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-black px-3 py-1 rounded-xl text-sm" : "text-indigo-500 font-black text-sm";
      if (grade === "B") return highlight ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 font-black px-3 py-1 rounded-xl text-sm" : "text-amber-555 font-black text-sm";
      if (grade === "C") return highlight ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 font-black px-3 py-1 rounded-xl text-sm" : "text-rose-550 dark:text-rose-500 font-black text-sm";
      const num = parseFloat(grade);
      const isPass = gradingScale === "20" ? num >= 11 : num >= 6;
      if (isPass) {
        return highlight ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 font-black px-3 py-1 rounded-xl text-sm" : "text-emerald-500 font-black text-sm";
      }
      return highlight ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 font-black px-3 py-1 rounded-xl text-sm" : "text-rose-550 dark:text-rose-450 font-black text-sm";
    };
    return /* @__PURE__ */ React.createElement(React.Fragment, { key: comp.id }, /* @__PURE__ */ React.createElement("td", { className: "px-2 py-2.5 text-center border border-slate-200 dark:border-slate-800 bg-indigo-50/5" }, /* @__PURE__ */ React.createElement("span", { className: getGradeClass(regAvg) }, regAvg)), /* @__PURE__ */ React.createElement("td", { className: "px-2 py-2.5 text-center border border-slate-200 dark:border-slate-800 bg-purple-50/5" }, reinfAvg !== "-" ? /* @__PURE__ */ React.createElement("span", { className: "text-purple-650 dark:text-purple-400 flex items-center justify-center gap-1 font-black text-sm", title: "Refuerzo" }, /* @__PURE__ */ React.createElement(Sparkles, { className: "h-3.5 w-3.5 inline text-purple-400" }), reinfAvg) : /* @__PURE__ */ React.createElement("span", { className: "text-slate-300 dark:text-slate-700 font-black text-sm" }, "-")), /* @__PURE__ */ React.createElement("td", { className: "px-2 py-2.5 text-center border border-slate-200 dark:border-slate-800 bg-emerald-50/5" }, reinfAvg !== "-" && isPassing(reinfAvg) && getFinalCompetenceGrade(regAvg, reinfAvg) !== regAvg ? /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center gap-0.5" }, /* @__PURE__ */ React.createElement("span", { className: getGradeClass(finalGrade, true) }, finalGrade), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-purple-500 font-mono font-bold", title: `Regular: ${regAvg}` }, "(Ref: ", regAvg, ")")) : /* @__PURE__ */ React.createElement("span", { className: getGradeClass(finalGrade, true) }, finalGrade)));
  }))))))) : /* @__PURE__ */ React.createElement("div", { className: "flex flex-col lg:flex-row gap-6 items-start w-full" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1 w-full overflow-hidden space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800" }, /* @__PURE__ */ React.createElement("table", { className: "w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-slate-100 text-xs font-bold uppercase text-slate-700 dark:bg-slate-900/60 dark:text-slate-300" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 w-12 border border-slate-200 dark:border-slate-800" }, "N\xB0"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 min-w-[200px] border border-slate-200 dark:border-slate-800" }, "Estudiante"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 w-28 border border-slate-200 dark:border-slate-800" }, "DNI"), activeEvaluations.map((evalItem) => /* @__PURE__ */ React.createElement("th", { key: evalItem.id, className: "px-3 py-2 border border-slate-200 dark:border-slate-800 text-center min-w-[140px]" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-between h-full gap-2 py-1" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-900 dark:text-white", title: evalItem.name }, evalItem.name), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded font-mono text-indigo-600 dark:text-indigo-300 font-bold uppercase" }, evalItem.type), evalItem.capacityId && (() => {
    const cap = activeCompetence?.capacities?.find((c) => c.id === evalItem.capacityId);
    if (!cap) return null;
    return /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-slate-450 dark:text-slate-550 font-semibold max-w-[125px] truncate mt-0.5", title: cap.name }, "Cap: ", cap.name);
  })(), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1.5 pt-1" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => handleOpenConfigModal(evalItem),
      title: "Configurar Instrumento",
      className: "p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-500 transition"
    },
    /* @__PURE__ */ React.createElement(Settings, { className: "h-3.5 w-3.5" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setCopyingEvaluation(evalItem),
      title: "Copiar Instrumento",
      className: "p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-500 transition"
    },
    /* @__PURE__ */ React.createElement(Copy, { className: "h-3.5 w-3.5" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => handleExportEvalGrades(evalItem),
      title: "Exportar a Excel",
      className: "p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-500 transition"
    },
    /* @__PURE__ */ React.createElement(Download, { className: "h-3.5 w-3.5" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => handleImportEvalGrades(evalItem),
      title: "Importar desde Excel",
      className: "p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-amber-500 transition"
    },
    /* @__PURE__ */ React.createElement(Upload, { className: "h-3.5 w-3.5" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        if (window.confirm(`\xBFDeseas eliminar la columna "${evalItem.name}" y todas sus calificaciones?`)) {
          deleteEvaluation(evalItem.id);
        }
      },
      title: "Eliminar Columna",
      className: "p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-rose-500 transition"
    },
    /* @__PURE__ */ React.createElement(Trash2, { className: "h-3.5 w-3.5" })
  ))))), activeEvaluations.length === 0 && /* @__PURE__ */ React.createElement("th", { className: "px-6 py-3 border border-slate-200 dark:border-slate-800 text-slate-400 font-semibold text-center italic" }, "Sin actividades evaluativas"), /* @__PURE__ */ React.createElement("th", { className: "px-4 py-3 text-center w-28 border border-slate-200 dark:border-slate-800 bg-indigo-50/30 dark:bg-indigo-950/10" }, "Consolidado"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-slate-200 dark:divide-slate-800" }, enrolledStudents.length === 0 ? /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 4 + activeEvaluations.length, className: "px-6 py-10 text-center text-slate-400 font-semibold italic space-y-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-slate-500" }, "No se encontraron estudiantes matriculados en esta secci\xF3n."), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-450 font-normal mt-1 block" }, "(Grado seleccionado: ", /* @__PURE__ */ React.createElement("strong", { className: "text-slate-600 dark:text-slate-200" }, selectedGrade), ", Filtro de secci\xF3n seleccionado: ", /* @__PURE__ */ React.createElement("strong", { className: "text-slate-600 dark:text-slate-200" }, selectedSection), ")"), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-400 font-normal mt-1.5 block" }, "Tip: Aseg\xFArese de que los alumnos importados tengan asignado el grado y secci\xF3n correspondientes en su ficha de estudiante."))) : enrolledStudents.map((std, idx) => {
    const finalAvg = calculateStudentOverallAverage(std.id);
    return /* @__PURE__ */ React.createElement("tr", { key: std.id, className: "hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition" }, /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 font-bold text-slate-400 border border-slate-200 dark:border-slate-800" }, idx + 1), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ React.createElement("img", { src: std.avatar, alt: std.name, className: "h-7 w-7 rounded-full object-cover border border-slate-200" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-xs" }, std.name)))), /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 font-mono text-xs font-semibold border border-slate-200 dark:border-slate-800" }, std.dni), activeEvaluations.map((evalItem) => {
      const score = getCellScore(std.id, evalItem.id);
      return /* @__PURE__ */ React.createElement(
        "td",
        {
          key: evalItem.id,
          onClick: () => handleOpenGradingCell(std, evalItem),
          className: "px-2 py-2.5 text-center border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer hover:bg-indigo-50/25 dark:hover:bg-indigo-950/10"
        },
        /* @__PURE__ */ React.createElement("span", { className: (score === "AD" ? "text-emerald-600 dark:text-emerald-400" : score === "A" ? "text-indigo-650" : score === "B" ? "text-amber-500" : score === "C" ? "text-rose-500" : typeof score === "number" && score >= (gradingScale === "20" ? 11 : 6) ? "text-indigo-500" : typeof score === "number" && score < (gradingScale === "20" ? 11 : 6) ? "text-rose-500" : "text-slate-400") + " font-black text-base" }, score)
      );
    }), activeEvaluations.length === 0 && /* @__PURE__ */ React.createElement("td", { className: "px-4 py-3 border border-slate-200 dark:border-slate-800 text-center text-slate-350 dark:text-slate-750 italic text-xs" }, "Pulse 'Nueva Actividad'"), /* @__PURE__ */ React.createElement("td", { className: "px-3 py-2.5 text-center border border-slate-200 dark:border-slate-800 bg-indigo-50/20 dark:bg-indigo-950/5" }, /* @__PURE__ */ React.createElement("span", { className: `px-3.5 py-1.5 rounded-xl text-sm font-black ${finalAvg === "AD" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : finalAvg === "A" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" : finalAvg === "B" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40" : finalAvg === "C" ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40" : typeof finalAvg === "number" && finalAvg >= (gradingScale === "20" ? 11 : 6) ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40" : typeof finalAvg === "number" && finalAvg < (gradingScale === "20" ? 11 : 6) ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40" : "bg-slate-50 text-slate-400"}` }, finalAvg)));
  })))), activeEvaluations.length === 0 && selectedCourseId && selectedCompetenceId && /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-350 text-center space-y-3 mt-4 animate-in fade-in duration-200" }, /* @__PURE__ */ React.createElement(ClipboardCheck, { className: "h-10 w-10 text-indigo-500 animate-pulse" }), /* @__PURE__ */ React.createElement("h5", { className: "font-bold text-sm text-slate-700 dark:text-slate-300" }, "No hay actividades evaluativas creadas"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500 max-w-sm" }, "Para calificar a los alumnos en esta competencia, cree una nueva actividad o cargue el conjunto preconfigurado de demostraci\xF3n."), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleAutoGenerateEvaluations,
      className: "btn-neuro-success text-xs py-1.5 px-3 flex items-center gap-1 hover:scale-105 active:scale-95 transition-transform"
    },
    /* @__PURE__ */ React.createElement(Sparkles, { className: "h-3.5 w-3.5" }),
    "Cargar Demo"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowCreateModal(true),
      className: "btn-neuro-primary text-xs py-1.5 px-3 flex items-center gap-1 hover:scale-105 active:scale-95 transition-transform"
    },
    /* @__PURE__ */ React.createElement(Plus, { className: "h-3.5 w-3.5" }),
    "Nueva Actividad"
  )))), /* @__PURE__ */ React.createElement(
    "input",
    {
      ref: fileInputRef,
      type: "file",
      accept: ".xlsx,.xls",
      style: { display: "none" },
      onChange: handleFileSelected
    }
  ), showCurriculumMap && /* @__PURE__ */ React.createElement("div", { className: "w-full lg:w-80 shrink-0 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 h-[600px] overflow-y-auto animate-in slide-in-from-right-4 duration-200" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2.5" }, /* @__PURE__ */ React.createElement("h5", { className: "font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(BookOpen, { className: "h-4 w-4 text-indigo-500" }), "Mapa Curricular"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowCurriculumMap(false),
      className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
    },
    "Ocultar"
  )), activeCompetence ? /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black text-indigo-500 uppercase tracking-widest block" }, "Competencia"), /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug" }, activeCompetence.name)), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 pt-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black text-slate-400 uppercase tracking-widest block" }, "Capacidades e Indicadores"), activeCompetence.capacities && activeCompetence.capacities.map((cap) => /* @__PURE__ */ React.createElement("div", { key: cap.id, className: "space-y-2 bg-white dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/30 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-extrabold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded shrink-0" }, "Capacidad"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-850 dark:text-slate-200 leading-tight" }, cap.name)), /* @__PURE__ */ React.createElement("div", { className: "pl-3 border-l border-indigo-100 dark:border-indigo-900/60 space-y-1.5 mt-1.5" }, cap.desempenos && cap.desempenos.map((des) => /* @__PURE__ */ React.createElement("div", { key: des.id, className: "text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed" }, "\u2022 ", des.description)), (!cap.desempenos || cap.desempenos.length === 0) && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-400 italic" }, "Sin desempe\xF1os definidos")))), (!activeCompetence.capacities || activeCompetence.capacities.length === 0) && /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-400 italic block" }, "No hay capacidades configuradas en esta competencia."))) : /* @__PURE__ */ React.createElement("div", { className: "text-center py-8 text-slate-400 italic" }, "Seleccione una competencia para visualizar su mapa.")))), showCreateModal && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" }, /* @__PURE__ */ React.createElement("div", { className: "glass-card max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3" }, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Plus, { className: "h-5 w-5 text-indigo-500" }), "Crear Actividad Evaluativa"), /* @__PURE__ */ React.createElement("button", { onClick: () => setShowCreateModal(false), className: "text-slate-400 hover:text-slate-600" }, /* @__PURE__ */ React.createElement(X, { className: "h-5 w-5" }))), /* @__PURE__ */ React.createElement("form", { onSubmit: handleCreateEvaluation, className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-400 mb-1.5" }, "Nombre de la Actividad"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      required: true,
      placeholder: "Ej: Tarea 1: Ensayos, Exposici\xF3n 2...",
      value: newEvalName,
      onChange: (e) => setNewEvalName(e.target.value),
      className: "w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-400 mb-1.5" }, "Capacidad Evaluada (CNEB)"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: newEvalCapacityId,
      onChange: (e) => setNewEvalCapacityId(e.target.value),
      className: "w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2.5 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900"
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "Ninguna (Evaluaci\xF3n General)"),
    activeCompetence?.capacities?.map((cap) => /* @__PURE__ */ React.createElement("option", { key: cap.id, value: cap.id }, cap.name))
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-400 mb-1.5" }, "Instrumento de Registro"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: newEvalType,
      onChange: (e) => setNewEvalType(e.target.value),
      className: "w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900"
    },
    /* @__PURE__ */ React.createElement("option", { value: "Examen" }, "Examen / Nota Directa"),
    /* @__PURE__ */ React.createElement("option", { value: "Rubrica" }, "R\xFAbrica de Criterios"),
    /* @__PURE__ */ React.createElement("option", { value: "Lista de Cotejo" }, "Lista de Cotejo"),
    /* @__PURE__ */ React.createElement("option", { value: "Lista de Cotejo 3 Niveles" }, "Lista de Cotejo (3 Niveles)"),
    /* @__PURE__ */ React.createElement("option", { value: "Guia de Observacion" }, "Gu\xEDa de Observaci\xF3n")
  )), /* @__PURE__ */ React.createElement("div", { className: "flex justify-end gap-2 pt-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowCreateModal(false),
      className: "btn-neuro-secondary text-xs px-4 py-2"
    },
    "Cancelar"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      className: "btn-neuro-primary text-xs px-4 py-2"
    },
    "Crear Columna"
  ))))), editingEvalConfig && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" }, /* @__PURE__ */ React.createElement("div", { className: "glass-card max-w-2xl w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-200" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Settings, { className: "h-5 w-5 text-indigo-500" }), "Editar Instrumento: ", editingEvalConfig.name), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-400 mt-0.5" }, "A\xF1ade, edita o quita criterios e indicadores seg\xFAn las necesidades del instrumento.")), /* @__PURE__ */ React.createElement("button", { onClick: () => setEditingEvalConfig(null), className: "text-slate-400 hover:text-slate-600" }, /* @__PURE__ */ React.createElement(X, { className: "h-5 w-5" }))), /* @__PURE__ */ React.createElement("div", { className: "space-y-4 max-h-[60vh] overflow-y-auto pr-1" }, editingEvalConfig.type === "Rubrica" && /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold uppercase text-slate-400" }, "Criterios de la R\xFAbrica"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        const newCrit = {
          id: `crit_${Date.now()}`,
          criteria: "Nuevo Criterio",
          descriptors: { AD: "", A: "", B: "", C: "" }
        };
        const config = editingEvalConfig.instrumentConfig || { criteriaList: [] };
        config.criteriaList = [...config.criteriaList || [], newCrit];
        setEditingEvalConfig({ ...editingEvalConfig, instrumentConfig: config });
      },
      className: "text-xs text-indigo-600 font-bold hover:underline"
    },
    "+ Agregar Criterio"
  )), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, editingEvalConfig.instrumentConfig?.criteriaList?.map((crit, idx) => {
    const colors = ["border-blue-500/30", "border-purple-500/30", "border-emerald-500/30", "border-amber-500/30"];
    const borderColor = colors[idx % colors.length];
    return /* @__PURE__ */ React.createElement("div", { key: crit.id, className: `p-4 bg-white dark:bg-slate-900 rounded-2xl border-[3.5px] ${borderColor} space-y-3.5 shadow-sm` }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center gap-3" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: crit.criteria,
        onChange: (e) => {
          const list = [...editingEvalConfig.instrumentConfig.criteriaList];
          list[idx].criteria = e.target.value;
          setEditingEvalConfig({
            ...editingEvalConfig,
            instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
          });
        },
        className: "flex-1 font-black text-xs bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200/80 focus:border-indigo-500 focus:bg-white transition",
        placeholder: "Nombre del Criterio..."
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const list = editingEvalConfig.instrumentConfig.criteriaList.filter((c) => c.id !== crit.id);
          setEditingEvalConfig({
            ...editingEvalConfig,
            instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
          });
        },
        className: "text-[10px] text-rose-500 font-bold hover:underline"
      },
      "Eliminar"
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs" }, ["AD", "A", "B", "C"].map((level) => /* @__PURE__ */ React.createElement("div", { key: level, className: "space-y-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase" }, level, " - Desempe\xF1o:"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        rows: "2",
        value: crit.descriptors?.[level] || "",
        placeholder: `Descriptor para nivel ${level}...`,
        onChange: (e) => {
          const list = [...editingEvalConfig.instrumentConfig.criteriaList];
          if (!list[idx].descriptors) list[idx].descriptors = {};
          list[idx].descriptors[level] = e.target.value;
          setEditingEvalConfig({
            ...editingEvalConfig,
            instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
          });
        },
        className: "w-full text-[11px] rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200/80 p-2 focus:border-indigo-500 focus:bg-white transition"
      }
    )))));
  }))), editingEvalConfig.type === "Lista de Cotejo 3 Niveles" && /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold uppercase text-slate-400" }, "Criterios de Cotejo (3 Niveles)"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        const newCrit = { id: `crit_3lvl_${Date.now()}`, name: "Nuevo Criterio", points: 5, indicators: [] };
        const config = editingEvalConfig.instrumentConfig || { criteriaList: [] };
        config.criteriaList = [...config.criteriaList || [], newCrit];
        setEditingEvalConfig({ ...editingEvalConfig, instrumentConfig: config });
      },
      className: "text-xs text-indigo-600 font-bold hover:underline"
    },
    "+ Agregar Criterio"
  )), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, editingEvalConfig.instrumentConfig?.criteriaList?.map((crit, cIdx) => {
    const colors = ["border-blue-500/30", "border-purple-500/30", "border-emerald-500/30", "border-amber-500/30"];
    const borderColor = colors[cIdx % colors.length];
    return /* @__PURE__ */ React.createElement("div", { key: crit.id, className: `p-4 bg-white dark:bg-slate-900 rounded-2xl border-[3.5px] ${borderColor} space-y-3.5 shadow-sm` }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-1 w-full" }, /* @__PURE__ */ React.createElement("span", { className: "h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 flex items-center justify-center font-black text-xs shrink-0 border border-slate-200" }, cIdx + 1), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: crit.name,
        placeholder: "Nombre del criterio...",
        onChange: (e) => {
          const list = [...editingEvalConfig.instrumentConfig.criteriaList];
          list[cIdx].name = e.target.value;
          setEditingEvalConfig({
            ...editingEvalConfig,
            instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
          });
        },
        className: "flex-1 font-black text-xs bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:bg-white transition"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 shrink-0 justify-between sm:justify-start w-full sm:w-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-500 uppercase font-black" }, "Puntos:"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value: crit.points,
        min: "0",
        max: "20",
        onChange: (e) => {
          const list = [...editingEvalConfig.instrumentConfig.criteriaList];
          list[cIdx].points = parseFloat(e.target.value) || 0;
          setEditingEvalConfig({
            ...editingEvalConfig,
            instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
          });
        },
        className: "w-14 text-center text-xs bg-slate-50 dark:bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-200 font-black focus:border-indigo-500 focus:bg-white transition"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 ml-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const list = [...editingEvalConfig.instrumentConfig.criteriaList];
          const newInd = { id: `ind_3lvl_${Date.now()}`, text: "Nuevo indicador" };
          list[cIdx].indicators = [...list[cIdx].indicators || [], newInd];
          setEditingEvalConfig({
            ...editingEvalConfig,
            instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
          });
        },
        className: "text-[10px] text-indigo-650 font-bold hover:underline"
      },
      "+ Agregar Subcriterio"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const list = editingEvalConfig.instrumentConfig.criteriaList.filter((c) => c.id !== crit.id);
          setEditingEvalConfig({
            ...editingEvalConfig,
            instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
          });
        },
        className: "text-[10px] text-rose-500 font-bold hover:underline"
      },
      "Eliminar"
    )))), /* @__PURE__ */ React.createElement("div", { className: "pl-6 border-l-2 border-dashed border-slate-200 dark:border-slate-800 space-y-2" }, crit.indicators?.map((ind, iIdx) => /* @__PURE__ */ React.createElement("div", { key: ind.id, className: "flex gap-2 items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-400 font-bold" }, cIdx + 1, ".", iIdx + 1), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: ind.text,
        placeholder: "Escribe el subcriterio o indicador...",
        onChange: (e) => {
          const list = [...editingEvalConfig.instrumentConfig.criteriaList];
          list[cIdx].indicators[iIdx].text = e.target.value;
          setEditingEvalConfig({
            ...editingEvalConfig,
            instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
          });
        },
        className: "flex-1 text-xs bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:bg-white transition"
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const list = [...editingEvalConfig.instrumentConfig.criteriaList];
          list[cIdx].indicators = list[cIdx].indicators.filter((i) => i.id !== ind.id);
          setEditingEvalConfig({
            ...editingEvalConfig,
            instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
          });
        },
        className: "p-1 hover:bg-slate-200 rounded text-rose-455"
      },
      /* @__PURE__ */ React.createElement(X, { className: "h-3.5 w-3.5" })
    ))), (!crit.indicators || crit.indicators.length === 0) && /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-400 italic pl-2" }, "No hay subcriterios. Presione '+ Agregar Subcriterio'.")));
  }))), editingEvalConfig.type === "Lista de Cotejo" && /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold uppercase text-slate-400" }, "Indicadores de Cotejo"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        const newItem = { id: `item_${Date.now()}`, text: "Nuevo indicador de cotejo" };
        const config = editingEvalConfig.instrumentConfig || { items: [] };
        config.items = [...config.items || [], newItem];
        setEditingEvalConfig({ ...editingEvalConfig, instrumentConfig: config });
      },
      className: "text-xs text-indigo-600 font-bold hover:underline"
    },
    "+ Agregar Indicador"
  )), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, editingEvalConfig.instrumentConfig?.items?.map((item, idx) => /* @__PURE__ */ React.createElement("div", { key: item.id, className: "flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border-[3.5px] border-blue-500/30 dark:border-blue-500/25 shadow-sm" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-black text-slate-400 w-6 text-center" }, idx + 1), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: item.text,
      onChange: (e) => {
        const list = [...editingEvalConfig.instrumentConfig.items];
        list[idx].text = e.target.value;
        setEditingEvalConfig({
          ...editingEvalConfig,
          instrumentConfig: { ...editingEvalConfig.instrumentConfig, items: list }
        });
      },
      className: "flex-1 text-xs bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:bg-white transition font-semibold"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        const list = editingEvalConfig.instrumentConfig.items.filter((i) => i.id !== item.id);
        setEditingEvalConfig({
          ...editingEvalConfig,
          instrumentConfig: { ...editingEvalConfig.instrumentConfig, items: list }
        });
      },
      className: "p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-rose-500"
    },
    /* @__PURE__ */ React.createElement(Trash2, { className: "h-4 w-4" })
  ))))), editingEvalConfig.type === "Guia de Observacion" && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold uppercase text-slate-400" }, "Niveles de Logro del Comportamiento"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        const newLvl = { id: `lvl_${Date.now()}`, name: "Nivel", label: "Descripci\xF3n" };
        const config = editingEvalConfig.instrumentConfig || { levels: [], criteriaList: [] };
        config.levels = [...config.levels || [], newLvl];
        setEditingEvalConfig({ ...editingEvalConfig, instrumentConfig: config });
      },
      className: "text-xs text-indigo-600 font-bold hover:underline"
    },
    "+ Agregar Nivel"
  )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2" }, editingEvalConfig.instrumentConfig?.levels?.map((lvl, idx) => /* @__PURE__ */ React.createElement("div", { key: lvl.id, className: "flex gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg items-center" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: lvl.name,
      placeholder: "Sigla (ej: SI)",
      onChange: (e) => {
        const list = [...editingEvalConfig.instrumentConfig.levels];
        list[idx].name = e.target.value;
        setEditingEvalConfig({
          ...editingEvalConfig,
          instrumentConfig: { ...editingEvalConfig.instrumentConfig, levels: list }
        });
      },
      className: "w-16 text-xs bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 text-center font-bold"
    }
  ), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: lvl.label,
      placeholder: "Nombre del nivel (ej: Siempre)",
      onChange: (e) => {
        const list = [...editingEvalConfig.instrumentConfig.levels];
        list[idx].label = e.target.value;
        setEditingEvalConfig({
          ...editingEvalConfig,
          instrumentConfig: { ...editingEvalConfig.instrumentConfig, levels: list }
        });
      },
      className: "flex-1 text-xs bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-200"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        const list = editingEvalConfig.instrumentConfig.levels.filter((l) => l.id !== lvl.id);
        setEditingEvalConfig({
          ...editingEvalConfig,
          instrumentConfig: { ...editingEvalConfig.instrumentConfig, levels: list }
        });
      },
      className: "p-1 hover:bg-slate-200 rounded text-rose-500"
    },
    /* @__PURE__ */ React.createElement(X, { className: "h-4 w-4" })
  ))))), /* @__PURE__ */ React.createElement("div", { className: "space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold uppercase text-slate-400" }, "Criterios e Indicadores"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        const newCrit = { id: `obs_crit_${Date.now()}`, name: "Nuevo Criterio de Actitud", indicators: [] };
        const config = editingEvalConfig.instrumentConfig || { criteriaList: [], levels: [] };
        config.criteriaList = [...config.criteriaList || [], newCrit];
        setEditingEvalConfig({ ...editingEvalConfig, instrumentConfig: config });
      },
      className: "text-xs text-indigo-600 font-bold hover:underline"
    },
    "+ Agregar Criterio"
  )), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, editingEvalConfig.instrumentConfig?.criteriaList?.map((crit, cIdx) => {
    const colors = ["border-blue-500/30", "border-purple-500/30", "border-emerald-500/30", "border-amber-500/30"];
    const borderColor = colors[cIdx % colors.length];
    return /* @__PURE__ */ React.createElement("div", { key: crit.id, className: `p-4 bg-white dark:bg-slate-900 rounded-2xl border-[3.5px] ${borderColor} space-y-3.5 shadow-sm` }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center gap-3" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: crit.name,
        onChange: (e) => {
          const list = [...editingEvalConfig.instrumentConfig.criteriaList];
          list[cIdx].name = e.target.value;
          setEditingEvalConfig({
            ...editingEvalConfig,
            instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
          });
        },
        className: "flex-1 font-black text-xs bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:bg-white transition",
        placeholder: "Nombre del Criterio..."
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const list = [...editingEvalConfig.instrumentConfig.criteriaList];
          const newInd = { id: `obs_ind_${Date.now()}`, text: "Nuevo indicador observable" };
          list[cIdx].indicators = [...list[cIdx].indicators || [], newInd];
          setEditingEvalConfig({
            ...editingEvalConfig,
            instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
          });
        },
        className: "text-[10px] text-indigo-650 font-bold hover:underline"
      },
      "+ Agregar Indicador"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const list = editingEvalConfig.instrumentConfig.criteriaList.filter((c) => c.id !== crit.id);
          setEditingEvalConfig({
            ...editingEvalConfig,
            instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
          });
        },
        className: "text-[10px] text-rose-500 font-bold hover:underline"
      },
      "Eliminar"
    ))), /* @__PURE__ */ React.createElement("div", { className: "pl-6 border-l-2 border-dashed border-slate-200 dark:border-slate-800 space-y-2" }, crit.indicators?.map((ind, iIdx) => /* @__PURE__ */ React.createElement("div", { key: ind.id, className: "flex gap-2 items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-400 font-bold" }, "\u2022"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: ind.text,
        onChange: (e) => {
          const list = [...editingEvalConfig.instrumentConfig.criteriaList];
          list[cIdx].indicators[iIdx].text = e.target.value;
          setEditingEvalConfig({
            ...editingEvalConfig,
            instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
          });
        },
        className: "flex-1 text-xs bg-slate-50 dark:bg-slate-955 px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:bg-white transition font-semibold",
        placeholder: "Escribe el indicador..."
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const list = [...editingEvalConfig.instrumentConfig.criteriaList];
          list[cIdx].indicators = list[cIdx].indicators.filter((i) => i.id !== ind.id);
          setEditingEvalConfig({
            ...editingEvalConfig,
            instrumentConfig: { ...editingEvalConfig.instrumentConfig, criteriaList: list }
          });
        },
        className: "p-1 hover:bg-slate-200 rounded text-rose-455"
      },
      /* @__PURE__ */ React.createElement(X, { className: "h-3.5 w-3.5" })
    ))), (!crit.indicators || crit.indicators.length === 0) && /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-400 italic pl-2" }, "No hay indicadores. Presione '+ Agregar Indicador'.")));
  })))), editingEvalConfig.type === "Examen" && (() => {
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
    return /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border-[3.5px] border-violet-500/30 dark:border-violet-500/20 gap-3 shadow-sm" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black text-slate-400 block uppercase" }, "Puntaje M\xE1ximo del Examen"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value: config.maxScore || 100,
        onChange: (e) => updateConfig(questionsList, parseInt(e.target.value) || 100),
        className: "w-24 mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black dark:border-slate-800 dark:bg-slate-900 focus:bg-white focus:border-indigo-500 transition"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "text-left sm:text-right" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black text-slate-400 block uppercase" }, "Total de Puntos Acumulado"), /* @__PURE__ */ React.createElement("span", { className: `text-base font-black ${totalPoints === (config.maxScore || 100) ? "text-emerald-600 dark:text-emerald-450" : "text-rose-500"}` }, totalPoints, " / ", config.maxScore || 100, " pts"), totalPoints !== (config.maxScore || 100) && /* @__PURE__ */ React.createElement("span", { className: "block text-[9px] text-rose-400 font-medium italic mt-0.5" }, "Se recomienda que coincida con el m\xE1ximo"))), /* @__PURE__ */ React.createElement("div", { className: "space-y-3.5" }, questionsList.map((q, idx) => /* @__PURE__ */ React.createElement("div", { key: q.id, className: "p-4 bg-white dark:bg-slate-900 rounded-2xl border-[3.5px] border-indigo-500/30 dark:border-indigo-500/20 space-y-3.5 shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 flex items-center justify-center font-black text-xs shrink-0 border border-slate-200" }, idx + 1), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: q.text,
        onChange: (e) => {
          const list = [...questionsList];
          list[idx].text = e.target.value;
          updateConfig(list);
        },
        placeholder: "Enunciado de la pregunta o criterio...",
        className: "flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900 focus:bg-white focus:border-indigo-500 transition"
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value: q.points,
        onChange: (e) => {
          const list = [...questionsList];
          list[idx].points = parseInt(e.target.value) || 0;
          updateConfig(list);
        },
        className: "w-14 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-center font-black dark:border-slate-800 dark:bg-slate-900 focus:bg-white focus:border-indigo-500 transition",
        placeholder: "Pts",
        title: "Puntos para esta pregunta"
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-400 font-bold" }, "pts")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const list = questionsList.filter((item) => item.id !== q.id);
          updateConfig(list);
        },
        className: "text-rose-500 hover:text-rose-700 p-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition",
        title: "Eliminar Pregunta"
      },
      /* @__PURE__ */ React.createElement(Trash2, { className: "h-4 w-4" })
    )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-4 text-xs font-semibold pl-7 flex-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-450 uppercase" }, "Tipo de Pregunta:"), !q.hasSubQuestions ? /* @__PURE__ */ React.createElement(
      "select",
      {
        value: q.type || "direct",
        onChange: (e) => {
          const list = [...questionsList];
          const newType = e.target.value;
          list[idx].type = newType;
          if (newType === "choice" && (!q.options || q.options.length === 0)) {
            list[idx].options = [
              { id: `opt_${Date.now()}_1`, label: "Clave A" },
              { id: `opt_${Date.now()}_2`, label: "Clave B" }
            ];
            list[idx].correctValue = list[idx].options[0].id;
          } else if (newType === "matching") {
            if (!q.options || q.options.length === 0) {
              list[idx].options = [
                { id: `opt_${Date.now()}_1`, label: "Enlace A" },
                { id: `opt_${Date.now()}_2`, label: "Enlace B" }
              ];
            }
            if (!q.subQuestions || q.subQuestions.length === 0) {
              list[idx].subQuestions = [
                { id: `sq_${Date.now()}_1`, text: "Premisa 1", correctValue: list[idx].options?.[0]?.id || `opt_${Date.now()}_1` },
                { id: `sq_${Date.now()}_2`, text: "Premisa 2", correctValue: list[idx].options?.[1]?.id || `opt_${Date.now()}_1` }
              ];
            }
          }
          updateConfig(list);
        },
        className: "rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold dark:border-slate-800 dark:bg-slate-900"
      },
      /* @__PURE__ */ React.createElement("option", { value: "direct" }, "Calificaci\xF3n Directa (\u2713/\u2717)"),
      /* @__PURE__ */ React.createElement("option", { value: "choice" }, "Opci\xF3n M\xFAltiple (Alternativas con Clave)"),
      /* @__PURE__ */ React.createElement("option", { value: "matching" }, "Relacionar Columnas (Subpreguntas)")
    ) : /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded-md border border-slate-200/40" }, "Contenedor (Varias Subpreguntas)")), /* @__PURE__ */ React.createElement("label", { className: "flex items-center gap-1.5 cursor-pointer select-none" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        checked: !!q.hasSubQuestions,
        onChange: (e) => {
          const list = [...questionsList];
          const checked = e.target.checked;
          list[idx].hasSubQuestions = checked;
          if (checked) {
            list[idx].subQuestions = [
              {
                id: `subq_${Date.now()}_1`,
                type: "direct",
                text: `Subpregunta ${idx + 1}.1`,
                options: [],
                correctValue: ""
              }
            ];
          } else {
            list[idx].subQuestions = [];
            list[idx].type = "direct";
          }
          updateConfig(list);
        },
        className: "rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-3.5 w-3.5"
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-450 uppercase font-black" }, "Habilitar Subpreguntas"))), !q.hasSubQuestions && q.type === "choice" && /* @__PURE__ */ React.createElement("div", { className: "pl-7 border-l-2 border-indigo-200 dark:border-indigo-900/60 space-y-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-slate-400 block uppercase" }, "Alternativas (Selecciona el bot\xF3n de opci\xF3n para marcar la Clave Correcta)"), /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5" }, (q.options || []).map((opt, oIdx) => /* @__PURE__ */ React.createElement("div", { key: opt.id, className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "radio",
        name: `correct_${q.id}`,
        checked: q.correctValue === opt.id,
        onChange: () => {
          const list = [...questionsList];
          list[idx].correctValue = opt.id;
          updateConfig(list);
        },
        className: "text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5",
        title: "Marcar como clave correcta"
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: opt.label,
        onChange: (e) => {
          const list = [...questionsList];
          list[idx].options[oIdx].label = e.target.value;
          updateConfig(list);
        },
        className: "flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs dark:border-slate-800 dark:bg-slate-900 font-medium",
        placeholder: "Escribe la alternativa..."
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const list = [...questionsList];
          list[idx].options = q.options.filter((o) => o.id !== opt.id);
          if (q.correctValue === opt.id && list[idx].options.length > 0) {
            list[idx].correctValue = list[idx].options[0].id;
          }
          updateConfig(list);
        },
        className: "text-slate-400 hover:text-rose-500 p-1 transition",
        title: "Eliminar Opci\xF3n",
        disabled: q.options.length <= 1
      },
      /* @__PURE__ */ React.createElement(X, { className: "h-3.5 w-3.5" })
    )))), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const list = [...questionsList];
          const optId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          list[idx].options = [
            ...q.options || [],
            { id: optId, label: `Opci\xF3n ${String.fromCharCode(65 + (q.options?.length || 0))}` }
          ];
          updateConfig(list);
        },
        className: "text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mt-1"
      },
      "+ Agregar Alternativa"
    )), !q.hasSubQuestions && q.type === "matching" && /* @__PURE__ */ React.createElement("div", { className: "pl-7 border-l-2 border-indigo-200 dark:border-indigo-900/60 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-slate-400 block uppercase" }, "1. Opciones de Enlace (Ej: 11 a\xF1os, 8 a\xF1os)"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2" }, (q.options || []).map((opt, oIdx) => /* @__PURE__ */ React.createElement("div", { key: opt.id, className: "flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-150 dark:border-slate-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-black text-slate-400 uppercase" }, "Opt ", String.fromCharCode(65 + oIdx)), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: opt.label,
        onChange: (e) => {
          const list = [...questionsList];
          list[idx].options[oIdx].label = e.target.value;
          updateConfig(list);
        },
        className: "flex-1 bg-transparent border-0 p-0 text-xs font-bold text-slate-700 dark:text-slate-350 focus:ring-0 focus:outline-none",
        placeholder: "Valor..."
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const list = [...questionsList];
          list[idx].options = q.options.filter((o) => o.id !== opt.id);
          if (list[idx].subQuestions) {
            list[idx].subQuestions.forEach((subQ) => {
              if (subQ.correctValue === opt.id) {
                subQ.correctValue = list[idx].options[0]?.id || "";
              }
            });
          }
          updateConfig(list);
        },
        className: "text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-slate-150 dark:hover:bg-slate-800 transition",
        title: "Eliminar Opci\xF3n",
        disabled: q.options.length <= 1
      },
      /* @__PURE__ */ React.createElement(X, { className: "h-3.5 w-3.5" })
    )))), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const list = [...questionsList];
          const optId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          list[idx].options = [
            ...q.options || [],
            { id: optId, label: `Enlace ${String.fromCharCode(65 + (q.options?.length || 0))}` }
          ];
          updateConfig(list);
        },
        className: "text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
      },
      "+ A\xF1adir Opci\xF3n de Enlace"
    )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2 border-t border-slate-150 dark:border-slate-800/80 pt-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-slate-400 block uppercase" }, "2. Elementos a Relacionar y su Clave Correcta"), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, (q.subQuestions || []).map((subQ, sIdx) => /* @__PURE__ */ React.createElement("div", { key: subQ.id, className: "p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2 items-start sm:items-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-1 w-full" }, /* @__PURE__ */ React.createElement("span", { className: "h-4 w-4 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-black text-[9px] shrink-0" }, sIdx + 1), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: subQ.text,
        onChange: (e) => {
          const list = [...questionsList];
          list[idx].subQuestions[sIdx].text = e.target.value;
          updateConfig(list);
        },
        className: "flex-1 bg-transparent border-0 border-b border-dashed border-slate-200 dark:border-slate-800 p-0 text-xs font-semibold text-slate-700 dark:text-slate-330 focus:ring-0 focus:border-indigo-500",
        placeholder: "Premisa a relacionar..."
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-bold text-slate-400 uppercase" }, "Clave:"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: subQ.correctValue,
        onChange: (e) => {
          const list = [...questionsList];
          list[idx].subQuestions[sIdx].correctValue = e.target.value;
          updateConfig(list);
        },
        className: "rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none"
      },
      q.options.map((opt) => /* @__PURE__ */ React.createElement("option", { key: opt.id, value: opt.id }, opt.label))
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const list = [...questionsList];
          list[idx].subQuestions = q.subQuestions.filter((s) => s.id !== subQ.id);
          updateConfig(list);
        },
        className: "text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition",
        title: "Eliminar Elemento",
        disabled: q.subQuestions.length <= 1
      },
      /* @__PURE__ */ React.createElement(Trash2, { className: "h-3.5 w-3.5" })
    ))))), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const list = [...questionsList];
          const subQId = `sq_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          list[idx].subQuestions = [
            ...q.subQuestions || [],
            { id: subQId, text: `Premisa ${q.subQuestions?.length + 1}`, correctValue: q.options[0]?.id || "" }
          ];
          updateConfig(list);
        },
        className: "text-[9px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline flex items-center gap-1"
      },
      "+ A\xF1adir Elemento a Relacionar"
    ))), q.hasSubQuestions && /* @__PURE__ */ React.createElement("div", { className: "pl-7 border-l-2 border-dashed border-indigo-205 dark:border-indigo-900/60 space-y-4" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black text-slate-450 block uppercase tracking-wide" }, "Configuraci\xF3n de Subpreguntas"), /* @__PURE__ */ React.createElement("div", { className: "space-y-3.5" }, (q.subQuestions || []).map((subQ, sIdx) => {
      const updateSubQ = (updatedFields) => {
        const list = [...questionsList];
        list[idx].subQuestions[sIdx] = {
          ...list[idx].subQuestions[sIdx],
          ...updatedFields
        };
        updateConfig(list);
      };
      return /* @__PURE__ */ React.createElement("div", { key: subQ.id, className: "p-3 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "h-4.5 w-4.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-[9px] shrink-0" }, idx + 1, ".", sIdx + 1), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          value: subQ.text,
          onChange: (e) => updateSubQ({ text: e.target.value }),
          placeholder: "Enunciado de la subpregunta...",
          className: "flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900"
        }
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            const list = [...questionsList];
            list[idx].subQuestions = q.subQuestions.filter((item) => item.id !== subQ.id);
            updateConfig(list);
          },
          className: "text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition",
          title: "Eliminar Subpregunta",
          disabled: q.subQuestions.length <= 1
        },
        /* @__PURE__ */ React.createElement(Trash2, { className: "h-3.5 w-3.5" })
      )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-4 text-xs font-semibold pl-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-slate-455 uppercase" }, "Tipo:"), /* @__PURE__ */ React.createElement(
        "select",
        {
          value: subQ.type || "direct",
          onChange: (e) => {
            const newType = e.target.value;
            const updated = { type: newType };
            if (newType === "choice" && (!subQ.options || subQ.options.length === 0)) {
              updated.options = [
                { id: `opt_${Date.now()}_1`, label: "Clave A" },
                { id: `opt_${Date.now()}_2`, label: "Clave B" }
              ];
              updated.correctValue = updated.options[0].id;
            } else if (newType === "matching") {
              if (!subQ.options || subQ.options.length === 0) {
                updated.options = [
                  { id: `opt_${Date.now()}_1`, label: "Enlace A" },
                  { id: `opt_${Date.now()}_2`, label: "Enlace B" }
                ];
              }
              if (!subQ.subQuestions || subQ.subQuestions.length === 0) {
                updated.subQuestions = [
                  { id: `sq_${Date.now()}_1`, text: "Premisa 1", correctValue: updated.options?.[0]?.id || `opt_${Date.now()}_1` },
                  { id: `sq_${Date.now()}_2`, text: "Premisa 2", correctValue: updated.options?.[1]?.id || `opt_${Date.now()}_1` }
                ];
              }
            }
            updateSubQ(updated);
          },
          className: "rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold dark:border-slate-800 dark:bg-slate-900"
        },
        /* @__PURE__ */ React.createElement("option", { value: "direct" }, "Calificaci\xF3n Directa (\u2713/\u2717)"),
        /* @__PURE__ */ React.createElement("option", { value: "choice" }, "Opci\xF3n M\xFAltiple"),
        /* @__PURE__ */ React.createElement("option", { value: "matching" }, "Relacionar Columnas")
      ))), subQ.type === "choice" && /* @__PURE__ */ React.createElement("div", { className: "pl-6 border-l-2 border-indigo-200 dark:border-indigo-900/60 space-y-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-bold text-slate-400 block uppercase" }, "Alternativas"), /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5" }, (subQ.options || []).map((opt, oIdx) => /* @__PURE__ */ React.createElement("div", { key: opt.id, className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "radio",
          name: `correct_${q.id}_${subQ.id}`,
          checked: subQ.correctValue === opt.id,
          onChange: () => updateSubQ({ correctValue: opt.id }),
          className: "text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
        }
      ), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          value: opt.label,
          onChange: (e) => {
            const opts = [...subQ.options];
            opts[oIdx].label = e.target.value;
            updateSubQ({ options: opts });
          },
          className: "flex-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs dark:border-slate-800 dark:bg-slate-900 font-medium",
          placeholder: "Escribe la alternativa..."
        }
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            const opts = subQ.options.filter((o) => o.id !== opt.id);
            const updateFields = { options: opts };
            if (subQ.correctValue === opt.id && opts.length > 0) {
              updateFields.correctValue = opts[0].id;
            }
            updateSubQ(updateFields);
          },
          className: "text-slate-400 hover:text-rose-500 p-1 transition",
          title: "Eliminar Opci\xF3n",
          disabled: subQ.options.length <= 1
        },
        /* @__PURE__ */ React.createElement(X, { className: "h-3 w-3" })
      )))), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            const optId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
            updateSubQ({
              options: [
                ...subQ.options || [],
                { id: optId, label: `Opci\xF3n ${String.fromCharCode(65 + (subQ.options?.length || 0))}` }
              ]
            });
          },
          className: "text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mt-1"
        },
        "+ Agregar Alternativa"
      )), subQ.type === "matching" && /* @__PURE__ */ React.createElement("div", { className: "pl-6 border-l-2 border-indigo-200 dark:border-indigo-900/60 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-bold text-slate-400 block uppercase" }, "1. Opciones de Enlace"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2" }, (subQ.options || []).map((opt, oIdx) => /* @__PURE__ */ React.createElement("div", { key: opt.id, className: "flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-150 dark:border-slate-800" }, /* @__PURE__ */ React.createElement("span", { className: "text-[8px] font-black text-slate-400 uppercase" }, "Opt ", String.fromCharCode(65 + oIdx)), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          value: opt.label,
          onChange: (e) => {
            const opts = [...subQ.options];
            opts[oIdx].label = e.target.value;
            updateSubQ({ options: opts });
          },
          className: "flex-1 bg-transparent border-0 p-0 text-xs font-bold text-slate-700 dark:text-slate-350 focus:ring-0 focus:outline-none",
          placeholder: "Valor..."
        }
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            const opts = subQ.options.filter((o) => o.id !== opt.id);
            const updateFields = { options: opts };
            if (subQ.subQuestions) {
              const nestedSubQs = subQ.subQuestions.map((nestedSub) => {
                if (nestedSub.correctValue === opt.id) {
                  return { ...nestedSub, correctValue: opts[0]?.id || "" };
                }
                return nestedSub;
              });
              updateFields.subQuestions = nestedSubQs;
            }
            updateSubQ(updateFields);
          },
          className: "text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-slate-150 dark:hover:bg-slate-800 transition",
          title: "Eliminar Opci\xF3n",
          disabled: subQ.options.length <= 1
        },
        /* @__PURE__ */ React.createElement(X, { className: "h-3 w-3" })
      )))), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            const optId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
            updateSubQ({
              options: [
                ...subQ.options || [],
                { id: optId, label: `Enlace ${String.fromCharCode(65 + (subQ.options?.length || 0))}` }
              ]
            });
          },
          className: "text-[8px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        },
        "+ A\xF1adir Opci\xF3n de Enlace"
      )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2 border-t border-slate-150 dark:border-slate-800/80 pt-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-bold text-slate-400 block uppercase" }, "2. Elementos a Relacionar y su Clave Correcta"), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, (subQ.subQuestions || []).map((nestedSub, nsIdx) => /* @__PURE__ */ React.createElement("div", { key: nestedSub.id, className: "p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2 items-start sm:items-center" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 flex-1 w-full" }, /* @__PURE__ */ React.createElement("span", { className: "h-4 w-4 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-black text-[9px] shrink-0" }, nsIdx + 1), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          value: nestedSub.text,
          onChange: (e) => {
            const nested = [...subQ.subQuestions];
            nested[nsIdx].text = e.target.value;
            updateSubQ({ subQuestions: nested });
          },
          className: "flex-1 bg-transparent border-0 border-b border-dashed border-slate-200 dark:border-slate-800 p-0 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-0 focus:border-indigo-500",
          placeholder: "Premisa a relacionar..."
        }
      )), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-[8px] font-bold text-slate-400 uppercase" }, "Clave:"), /* @__PURE__ */ React.createElement(
        "select",
        {
          value: nestedSub.correctValue,
          onChange: (e) => {
            const nested = [...subQ.subQuestions];
            nested[nsIdx].correctValue = e.target.value;
            updateSubQ({ subQuestions: nested });
          },
          className: "rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-[9px] font-bold text-slate-700 dark:text-slate-300 outline-none"
        },
        subQ.options.map((opt) => /* @__PURE__ */ React.createElement("option", { key: opt.id, value: opt.id }, opt.label))
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            const nested = subQ.subQuestions.filter((s) => s.id !== nestedSub.id);
            updateSubQ({ subQuestions: nested });
          },
          className: "text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition",
          title: "Eliminar Elemento",
          disabled: subQ.subQuestions.length <= 1
        },
        /* @__PURE__ */ React.createElement(Trash2, { className: "h-3 w-3" })
      ))))), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            const nestedId = `sq_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
            updateSubQ({
              subQuestions: [
                ...subQ.subQuestions || [],
                { id: nestedId, text: `Premisa ${subQ.subQuestions?.length + 1}`, correctValue: subQ.options[0]?.id || "" }
              ]
            });
          },
          className: "text-[8px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline flex items-center gap-1"
        },
        "+ A\xF1adir Elemento a Relacionar"
      ))));
    })), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const list = [...questionsList];
          const subQId = `subq_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          list[idx].subQuestions = [
            ...q.subQuestions || [],
            {
              id: subQId,
              type: "direct",
              text: `Subpregunta ${idx + 1}.${(q.subQuestions?.length || 0) + 1}`,
              options: [],
              correctValue: ""
            }
          ];
          updateConfig(list);
        },
        className: "text-[10px] font-black text-indigo-650 dark:text-indigo-400 hover:underline flex items-center gap-1"
      },
      "+ Agregar Subpregunta a este bloque"
    ))))), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const newQ = {
            id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            type: "choice",
            text: `Pregunta ${questionsList.length + 1}`,
            points: 20,
            options: [
              { id: `opt_${Date.now()}_1`, label: "Opci\xF3n A" },
              { id: `opt_${Date.now()}_2`, label: "Opci\xF3n B" },
              { id: `opt_${Date.now()}_3`, label: "Opci\xF3n C" }
            ],
            correctValue: `opt_${Date.now()}_1`
          };
          updateConfig([...questionsList, newQ]);
        },
        className: "w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-xs font-black text-slate-500 hover:text-indigo-650 hover:border-indigo-300 dark:hover:text-indigo-400 dark:hover:border-indigo-900 transition bg-white/30 dark:bg-slate-900/10"
      },
      "+ A\xF1adir Pregunta al Examen"
    ));
  })()), /* @__PURE__ */ React.createElement("div", { className: "flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setEditingEvalConfig(null),
      className: "btn-neuro-secondary text-xs px-4 py-2"
    },
    "Cerrar"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleSaveEvalConfig,
      className: "btn-neuro-primary text-xs px-4 py-2"
    },
    "Guardar Configuraci\xF3n"
  )))), gradingStudent && gradingEval && createPortal(
    /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 overflow-y-auto text-slate-800" }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-[10%] right-[-100px] w-[400px] h-[400px] bg-purple-200/10 rounded-full blur-[100px] pointer-events-none z-0" }), /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-[10%] left-[-100px] w-[300px] h-[300px] bg-blue-200/10 rounded-full blur-[80px] pointer-events-none z-0" }), /* @__PURE__ */ React.createElement("div", { className: "glass-card max-w-6xl w-full bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-[0_20px_60px_rgba(15,23,42,0.12)] rounded-3xl p-6 space-y-5 my-8 animate-in fade-in zoom-in-95 duration-200 relative z-10" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center border-b border-slate-200/80 pb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row items-center gap-4 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/60 w-full text-slate-800" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleNavToPreviousStudent,
        className: "btn-outline h-8 w-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-purple-650",
        title: "Alumno Anterior"
      },
      /* @__PURE__ */ React.createElement(ChevronLeft, { className: "h-4.5 w-4.5" })
    ), /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col sm:flex-row items-center gap-3 truncate text-center sm:text-left" }, /* @__PURE__ */ React.createElement(
      "img",
      {
        src: gradingStudent.avatar || (gradingStudent.gender === "Femenino" ? "/avatar_female.webp" : "/avatar_male.webp"),
        alt: "Avatar",
        className: "h-12 w-12 rounded-full object-cover border-2 border-purple-500/20"
      }
    ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 justify-center sm:justify-start" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-500 uppercase tracking-widest font-black" }, "Calificar a:"), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-black uppercase" }, "Evaluaci\xF3n Formativa")), /* @__PURE__ */ React.createElement("span", { className: "text-base font-black text-slate-850 block" }, gradingStudent.name), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5 mt-1 justify-center sm:justify-start" }, /* @__PURE__ */ React.createElement("span", { className: "text-[8px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-250/60" }, "Cuadro de Honor"), /* @__PURE__ */ React.createElement("span", { className: "text-[8px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-250/60" }, "Asistencia Perfecta")))), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: handleNavToNextStudent,
        className: "btn-outline h-8 w-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-purple-650",
        title: "Siguiente Alumno"
      },
      /* @__PURE__ */ React.createElement(ChevronRight, { className: "h-4.5 w-4.5" })
    )), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setGradingStudent(null);
          setGradingEval(null);
        },
        className: "text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 h-10 w-10 flex items-center justify-center rounded-xl transition active:scale-90 ml-3 shrink-0 border border-slate-200 shadow-sm"
      },
      /* @__PURE__ */ React.createElement(X, { className: "h-5 w-5" })
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10 text-slate-800" }, /* @__PURE__ */ React.createElement("aside", { className: "col-span-12 lg:col-span-3 flex flex-col justify-between p-5 bg-slate-50/60 rounded-2xl border border-slate-200/60 min-h-[300px]" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-6 w-full" }, /* @__PURE__ */ React.createElement("h3", { className: "text-xs font-black text-slate-600 uppercase tracking-widest border-b border-slate-200/60 pb-2" }, "Resumen de Calificaciones ", /* @__PURE__ */ React.createElement("span", { className: "text-[8.5px] font-normal text-slate-400 block mt-1" }, "(Tiempo Real)")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 lg:grid-cols-1 gap-6 justify-items-center" }, activeCourse?.competencies?.slice(0, 3).map((comp, cIdx) => {
      const regAvg = getCompetenceAverage(gradingStudent.id, comp.id);
      const reinfAvg = getCompetenceReinforcementAverage(gradingStudent.id, comp.id);
      const finalGrade = getFinalCompetenceGrade(regAvg, reinfAvg);
      let pct = 0;
      let color = "text-blue-500";
      if (finalGrade !== "-") {
        if (gradingScale === "literal") {
          pct = { AD: 100, A: 75, B: 50, C: 25 }[finalGrade] || 0;
          color = finalGrade === "AD" ? "text-emerald-600" : finalGrade === "A" ? "text-amber-500" : "text-rose-500";
        } else {
          const val = parseFloat(finalGrade);
          pct = isNaN(val) ? 0 : val / (gradingScale === "20" ? 20 : 10) * 100;
          color = val >= (gradingScale === "20" ? 14 : 7) ? "text-emerald-600" : val >= (gradingScale === "20" ? 11 : 6) ? "text-amber-500" : "text-rose-500";
        }
      }
      return /* @__PURE__ */ React.createElement("div", { key: comp.id, className: "flex flex-col items-center text-center" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-16 h-16 mb-2" }, /* @__PURE__ */ React.createElement("svg", { className: "w-full h-full -rotate-90", viewBox: "0 0 36 36" }, /* @__PURE__ */ React.createElement("path", { className: "text-slate-100", d: "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831", fill: "transparent", stroke: "currentColor", strokeWidth: "2" }), /* @__PURE__ */ React.createElement("path", { className: color, d: "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831", fill: "transparent", stroke: "currentColor", strokeDasharray: `${pct}, 100`, strokeLinecap: "round", strokeWidth: "2.5" })), /* @__PURE__ */ React.createElement("div", { className: `absolute inset-0 flex items-center justify-center font-black text-sm ${color}` }, finalGrade)), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-slate-500 font-bold uppercase tracking-wider block truncate max-w-[150px]", title: comp.name }, comp.name || `Competencia ${cIdx + 1}`));
    }), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center text-center pt-4 border-t border-slate-200/60 w-full" }, /* @__PURE__ */ React.createElement("div", { className: "relative w-20 h-20 mb-2" }, /* @__PURE__ */ React.createElement("svg", { className: "w-full h-full -rotate-90", viewBox: "0 0 36 36" }, /* @__PURE__ */ React.createElement("path", { className: "text-slate-100", d: "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831", fill: "transparent", stroke: "currentColor", strokeWidth: "2" }), /* @__PURE__ */ React.createElement("path", { className: "text-indigo-650", d: "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831", fill: "transparent", stroke: "currentColor", strokeDasharray: `${(() => {
      const overall = (() => {
        if (!activeCourse?.competencies || activeCourse.competencies.length === 0) return "-";
        let sum = 0, count = 0;
        activeCourse.competencies.forEach((comp) => {
          const regAvg = getCompetenceAverage(gradingStudent.id, comp.id);
          const reinfAvg = getCompetenceReinforcementAverage(gradingStudent.id, comp.id);
          const finalGrade = getFinalCompetenceGrade(regAvg, reinfAvg);
          if (finalGrade !== "-") {
            if (gradingScale === "literal") {
              sum += { AD: 4, A: 3, B: 2, C: 1 }[finalGrade] || 0;
            } else {
              sum += parseFloat(finalGrade) || 0;
            }
            count++;
          }
        });
        if (count === 0) return "-";
        const avg = sum / count;
        if (gradingScale === "literal") {
          if (avg >= 3.5) return "AD";
          if (avg >= 2.5) return "A";
          if (avg >= 1.5) return "B";
          return "C";
        }
        return avg.toFixed(1);
      })();
      return overall === "-" ? 0 : gradingScale === "literal" ? { AD: 100, A: 75, B: 50, C: 25 }[overall] || 0 : parseFloat(overall) / (gradingScale === "20" ? 20 : 10) * 100;
    })()}, 100`, strokeLinecap: "round", strokeWidth: "3" })), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 flex items-center justify-center font-black text-lg text-indigo-650" }, (() => {
      if (!activeCourse?.competencies || activeCourse.competencies.length === 0) return "-";
      let sum = 0, count = 0;
      activeCourse.competencies.forEach((comp) => {
        const regAvg = getCompetenceAverage(gradingStudent.id, comp.id);
        const reinfAvg = getCompetenceReinforcementAverage(gradingStudent.id, comp.id);
        const finalGrade = getFinalCompetenceGrade(regAvg, reinfAvg);
        if (finalGrade !== "-") {
          if (gradingScale === "literal") {
            sum += { AD: 4, A: 3, B: 2, C: 1 }[finalGrade] || 0;
          } else {
            sum += parseFloat(finalGrade) || 0;
          }
          count++;
        }
      });
      if (count === 0) return "-";
      const avg = sum / count;
      if (gradingScale === "literal") {
        if (avg >= 3.5) return "AD";
        if (avg >= 2.5) return "A";
        if (avg >= 1.5) return "B";
        return "C";
      }
      return avg.toFixed(1);
    })())), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-500 font-extrabold uppercase tracking-widest" }, "Promedio General"))))), /* @__PURE__ */ React.createElement("main", { className: "col-span-12 lg:col-span-9 flex flex-col justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "text-left mb-3 px-1.5 flex items-center justify-between border-b border-slate-200/60 pb-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs text-slate-500 font-bold" }, "Actividad: ", /* @__PURE__ */ React.createElement("strong", { className: "text-purple-650" }, gradingEval.name), " (", gradingEval.type, ")")), /* @__PURE__ */ React.createElement("div", { className: "space-y-4 max-h-[62vh] overflow-y-auto pr-1 custom-scrollbar" }, gradingEval.type === "Examen" && (() => {
      const config = gradingEval.instrumentConfig || {};
      const questions = config.questions || [];
      if (questions.length === 0) {
        return /* @__PURE__ */ React.createElement("div", { className: "space-y-5 max-w-xl mx-auto py-2" }, /* @__PURE__ */ React.createElement("div", { className: "glass-card p-4.5 bg-indigo-500/5 border-indigo-500/10 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-black text-slate-800 dark:text-slate-200" }, 'Ficha Interactiva: Comprensi\xF3n "El Dedo M\xE1gico"'), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500 dark:text-slate-400 font-medium" }, "Registre las respuestas del alumno haciendo clic en las opciones correspondientes.")), /* @__PURE__ */ React.createElement("div", { className: "text-right shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-black uppercase text-slate-400 block" }, "Puntaje"), /* @__PURE__ */ React.createElement("span", { className: "text-lg font-black text-indigo-650 dark:text-indigo-400" }, getExamScore(tempExamSelections), " / 20"))), /* @__PURE__ */ React.createElement("div", { className: "glass-card p-4 space-y-3" }, /* @__PURE__ */ React.createElement("h5", { className: "text-[11px] font-black text-slate-700 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-2" }, /* @__PURE__ */ React.createElement("span", { className: "h-5 w-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-black text-[10px]" }, "1"), "Une con flechas (Relaciona personajes)"), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, [
          { id: "narradora", label: "Narradora", icon: "\u{1F469}\u200D\u{1F9B0}" },
          { id: "philip", label: "Philip", icon: "\u{1F466}" },
          { id: "william", label: "William", icon: "\u{1F9D1}" },
          { id: "gregg", label: "Se\xF1or Gregg", icon: "\u{1F468}" }
        ].map((char) => {
          const selectedOption = tempExamSelections.q1?.[char.id];
          return /* @__PURE__ */ React.createElement("div", { key: char.id, className: "grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80" }, /* @__PURE__ */ React.createElement("div", { className: "sm:col-span-4 flex items-center gap-2 pr-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-slate-700 dark:text-slate-350" }, char.icon, " ", char.label)), /* @__PURE__ */ React.createElement("div", { className: "sm:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full" }, [
            { value: "11_years", label: "11 a\xF1os", badge: "\u{1F382}" },
            { value: "8_years", label: "8 a\xF1os", badge: "8\uFE0F\u20E3" },
            { value: "magic_finger", label: "Dedo M\xE1gico", badge: "\u261D\uFE0F" },
            { value: "hunt", label: "Caza", badge: "\u{1F52B}" }
          ].map((opt) => {
            const isSelected = selectedOption === opt.value;
            return /* @__PURE__ */ React.createElement(
              "button",
              {
                key: opt.value,
                type: "button",
                onClick: () => {
                  setTempExamSelections((prev) => {
                    const q1 = { ...prev.q1 };
                    q1[char.id] = isSelected ? null : opt.value;
                    return { ...prev, q1 };
                  });
                },
                className: `px-2 py-1.5 rounded-lg border text-[10px] font-black flex items-center justify-center gap-1 transition-all truncate ${isSelected ? "bg-indigo-650 text-white border-indigo-600 shadow-sm" : "bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100/50"}`,
                title: opt.label
              },
              /* @__PURE__ */ React.createElement("span", null, opt.badge),
              /* @__PURE__ */ React.createElement("span", null, opt.label)
            );
          })));
        }))), /* @__PURE__ */ React.createElement("div", { className: "glass-card p-4 space-y-3" }, /* @__PURE__ */ React.createElement("h5", { className: "text-[11px] font-black text-slate-700 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-2" }, /* @__PURE__ */ React.createElement("span", { className: "h-5 w-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-black text-[10px]" }, "2"), "Completa los espacios"), /* @__PURE__ */ React.createElement("div", { className: "p-2 bg-amber-500/5 border border-amber-500/10 rounded-xl flex flex-wrap gap-2 justify-center items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-black uppercase text-amber-600" }, "Palabras:"), ["bosque", "rojo", "cervatillo", "escopeta"].map((w) => /* @__PURE__ */ React.createElement("span", { key: w, className: "px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-350 border border-amber-200/50 rounded text-[9px] font-black" }, w))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2.5" }, [
          { id: "a", text: "a. Cuando la narradora se enfada ve todo _________." },
          { id: "b", text: "b. Philip ten\xEDa su propia _________." },
          { id: "c", text: "c. Los Gregg regresaron del _________ despu\xE9s de cazar." },
          { id: "d", text: "d. El animal que llevaban era un hermoso _________." }
        ].map((sentence) => {
          const selectedVal = tempExamSelections.q2?.[sentence.id];
          return /* @__PURE__ */ React.createElement("div", { key: sentence.id, className: "grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 bg-slate-55/20 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80" }, /* @__PURE__ */ React.createElement("div", { className: "sm:col-span-6" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-snug" }, sentence.text)), /* @__PURE__ */ React.createElement("div", { className: "sm:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full" }, ["rojo", "escopeta", "bosque", "cervatillo"].map((word) => {
            const isSelected = selectedVal === word;
            return /* @__PURE__ */ React.createElement(
              "button",
              {
                key: word,
                type: "button",
                onClick: () => {
                  setTempExamSelections((prev) => {
                    const q2 = { ...prev.q2 };
                    q2[sentence.id] = isSelected ? null : word;
                    return { ...prev, q2 };
                  });
                },
                className: `px-2 py-1.5 rounded-lg border text-[10px] font-black transition-all uppercase text-center truncate ${isSelected ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-white dark:bg-slate-950 text-slate-550 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100/50"}`
              },
              word
            );
          })));
        }))), /* @__PURE__ */ React.createElement("div", { className: "glass-card p-4 space-y-3" }, /* @__PURE__ */ React.createElement("h5", { className: "text-[11px] font-black text-slate-700 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-2" }, /* @__PURE__ */ React.createElement("span", { className: "h-5 w-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-black text-[10px]" }, "3"), "Ordena los hechos (del 1 al 4)"), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, [
          { id: "evC", text: "La se\xF1ora Winter llama tonta a la narradora." },
          { id: "evD", text: "La narradora intenta convencer a Philip y William de no cazar." },
          { id: "evB", text: "Los Gregg regresan con un cervatillo cazado." },
          { id: "evA", text: "La narradora apunta con el Dedo M\xE1gico a la familia Gregg." }
        ].map((event) => {
          const selectedVal = tempExamSelections.q3?.[event.id];
          return /* @__PURE__ */ React.createElement("div", { key: event.id, className: "grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80" }, /* @__PURE__ */ React.createElement("div", { className: "sm:col-span-8" }, /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-bold text-slate-700 dark:text-slate-300 pr-2 leading-relaxed" }, event.text)), /* @__PURE__ */ React.createElement("div", { className: "sm:col-span-4 grid grid-cols-4 gap-1.5 w-full justify-items-center" }, ["1", "2", "3", "4"].map((num) => {
            const isSelected = selectedVal === num;
            return /* @__PURE__ */ React.createElement(
              "button",
              {
                key: num,
                type: "button",
                onClick: () => {
                  setTempExamSelections((prev) => {
                    const q3 = { ...prev.q3 };
                    q3[event.id] = isSelected ? null : num;
                    return { ...prev, q3 };
                  });
                },
                className: `h-7 w-full rounded-lg border text-[10px] font-black transition-all flex items-center justify-center ${isSelected ? "bg-amber-500 text-white border-amber-500 shadow-sm" : "bg-white dark:bg-slate-950 text-slate-550 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100/50"}`
              },
              num
            );
          })));
        }))), /* @__PURE__ */ React.createElement("div", { className: "glass-card p-4 space-y-3" }, /* @__PURE__ */ React.createElement("h5", { className: "text-[11px] font-black text-slate-700 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-2" }, /* @__PURE__ */ React.createElement("span", { className: "h-5 w-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-black text-[10px]" }, "4"), "Clasifica en la tabla"), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, [
          { id: "cazar", text: "Cazar animales", icon: "\u{1F52B}" },
          { id: "proteger", text: "Proteger a los animales", icon: "\u{1F496}" },
          { id: "burlarse", text: "Burlarse de los dem\xE1s", icon: "\u{1F639}" },
          { id: "convencer", text: "Convencer a sus amigos", icon: "\u{1F4AC}" }
        ].map((action) => {
          const selectedVal = tempExamSelections.q4?.[action.id];
          return /* @__PURE__ */ React.createElement("div", { key: action.id, className: "grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80" }, /* @__PURE__ */ React.createElement("div", { className: "sm:col-span-6 flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs" }, action.icon), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] font-bold text-slate-700 dark:text-slate-300" }, action.text)), /* @__PURE__ */ React.createElement("div", { className: "sm:col-span-6 grid grid-cols-2 gap-1.5 w-full" }, [
            { value: "le_gusta", label: "Le gusta \u{1F60A}", color: "border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20" },
            { value: "no_le_gusta", label: "No le gusta \u{1F641}", color: "border-rose-500 text-rose-600 bg-rose-50/50 dark:bg-rose-950/20" }
          ].map((opt) => {
            const isSelected = selectedVal === opt.value;
            return /* @__PURE__ */ React.createElement(
              "button",
              {
                key: opt.value,
                type: "button",
                onClick: () => {
                  setTempExamSelections((prev) => {
                    const q4 = { ...prev.q4 };
                    q4[action.id] = isSelected ? null : opt.value;
                    return { ...prev, q4 };
                  });
                },
                className: `px-2.5 py-1.5 rounded-lg border text-[10px] font-black transition-all text-center truncate ${isSelected ? `${opt.color} border-2 shadow-sm font-black` : "bg-white dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-100/50"}`
              },
              opt.label
            );
          })));
        }))), /* @__PURE__ */ React.createElement("div", { className: "glass-card p-4 space-y-3" }, /* @__PURE__ */ React.createElement("h5", { className: "text-[11px] font-black text-slate-700 dark:text-slate-350 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-2" }, /* @__PURE__ */ React.createElement("span", { className: "h-5 w-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-black text-[10px]" }, "5"), "\xBFPor qu\xE9 utiliz\xF3 el Dedo M\xE1gico contra los Gregg?"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2" }, [
          { value: "jugar", label: "Porque quer\xEDa jugar con ellos.", icon: "\u26BD" },
          { value: "feliz", label: "Porque estaba feliz por la cacer\xEDa.", icon: "\u{1F60A}" },
          { value: "enfado", label: "Porque se enfad\xF3 al ver que cazaban animales.", icon: "\u{1F621}" },
          { value: "escopetas", label: "Porque quer\xEDa ense\xF1arles a usar escopetas.", icon: "\u{1F52B}" }
        ].map((opt) => {
          const isSelected = tempExamSelections.q5 === opt.value;
          return /* @__PURE__ */ React.createElement(
            "button",
            {
              key: opt.value,
              type: "button",
              onClick: () => {
                setTempExamSelections((prev) => ({
                  ...prev,
                  q5: isSelected ? null : opt.value
                }));
              },
              className: `p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${isSelected ? "bg-indigo-600 text-white border-indigo-500 border-2 shadow-md font-black" : "bg-slate-50 dark:bg-slate-900/40 text-slate-650 dark:text-slate-400 border-slate-150 dark:border-slate-800/65 hover:bg-slate-100/50"}`
            },
            /* @__PURE__ */ React.createElement("span", { className: "text-sm shrink-0" }, opt.icon),
            /* @__PURE__ */ React.createElement("span", { className: "text-[9.5px] leading-snug font-bold" }, opt.label)
          );
        }))));
      }
      let obtainedPoints = 0;
      let totalMaxPoints = 0;
      questions.forEach((q) => {
        const pts = parseFloat(q.points) || 0;
        totalMaxPoints += pts;
        if (q.hasSubQuestions && q.subQuestions && q.subQuestions.length > 0) {
          const subQs = q.subQuestions;
          const subQPts = pts / subQs.length;
          const qSelections = tempExamSelections[q.id] || {};
          subQs.forEach((subQ) => {
            const selectedVal = qSelections[subQ.id];
            if (subQ.type === "choice") {
              if (selectedVal === subQ.correctValue) {
                obtainedPoints += subQPts;
              }
            } else if (subQ.type === "matching") {
              const subMatchQs = subQ.subQuestions || [];
              const matchQPts = subMatchQs.length > 0 ? subQPts / subMatchQs.length : 0;
              const matchSelections = selectedVal || {};
              subMatchQs.forEach((mQ) => {
                if (matchSelections[mQ.id] === mQ.correctValue) {
                  obtainedPoints += matchQPts;
                }
              });
            } else {
              if (selectedVal === true) {
                obtainedPoints += subQPts;
              }
            }
          });
        } else {
          if (q.type === "choice") {
            if (tempExamSelections[q.id] === q.correctValue) {
              obtainedPoints += pts;
            }
          } else if (q.type === "matching") {
            const subQs = q.subQuestions || [];
            const subQPts = subQs.length > 0 ? pts / subQs.length : 0;
            const qSelections = tempExamSelections[q.id] || {};
            subQs.forEach((subQ) => {
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
      return /* @__PURE__ */ React.createElement("div", { className: "space-y-5 max-w-xl mx-auto py-2" }, /* @__PURE__ */ React.createElement("div", { className: "glass-card p-4.5 bg-indigo-500/5 border-indigo-500/10 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide" }, "Ficha del Examen Personalizado"), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-505 dark:text-slate-400 font-semibold mt-0.5" }, "Seleccione la respuesta marcada por el alumno o califique de forma directa.")), /* @__PURE__ */ React.createElement("div", { className: "text-right shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-bold uppercase text-slate-450 block" }, "Resultado"), /* @__PURE__ */ React.createElement("div", { className: "flex items-baseline gap-1 justify-end" }, /* @__PURE__ */ React.createElement("span", { className: "text-base font-black text-indigo-650 dark:text-indigo-400" }, obtainedPoints, " / ", totalMaxPoints), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-slate-400 font-bold ml-0.5" }, "pts")), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded mt-1 inline-block" }, "Nota: ", liveCalculatedScore))), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, questions.map((q, idx) => {
        const selectedVal = tempExamSelections[q.id];
        const isDirect = q.type === "direct";
        const isChoice = q.type === "choice";
        const isMatching = q.type === "matching";
        return /* @__PURE__ */ React.createElement("div", { key: q.id, className: "glass-card p-4 space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start border-b border-slate-100 dark:border-slate-800/80 pb-2" }, /* @__PURE__ */ React.createElement("h5", { className: "text-[11px] font-black text-slate-700 dark:text-slate-350 uppercase tracking-wider flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "h-5 w-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-black text-[10px]" }, idx + 1), q.text), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black text-indigo-650 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded shrink-0" }, q.points, " pts")), !q.hasSubQuestions && isDirect && /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3.5" }, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => {
              setTempExamSelections((prev) => ({
                ...prev,
                [q.id]: selectedVal === true ? null : true
              }));
            },
            className: `py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition active:scale-95 font-black text-[11px] ${selectedVal === true ? "bg-emerald-600 border-emerald-600 text-white shadow-md" : "bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-455 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100"}`
          },
          /* @__PURE__ */ React.createElement("span", null, "\u2713"),
          " Correcto (+",
          q.points,
          " pts)"
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => {
              setTempExamSelections((prev) => ({
                ...prev,
                [q.id]: selectedVal === false ? null : false
              }));
            },
            className: `py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition active:scale-95 font-black text-[11px] ${selectedVal === false ? "bg-rose-500 border-rose-500 text-white shadow-md" : "bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-455 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100"}`
          },
          /* @__PURE__ */ React.createElement("span", null, "\u2717"),
          " Incorrecto (+0 pts)"
        )), !q.hasSubQuestions && isChoice && /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-2 text-[11px] font-semibold" }, (q.options || []).map((opt) => {
          const isSelected = selectedVal === opt.id;
          const isCorrectKey = q.correctValue === opt.id;
          let btnStyles = "bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-800 hover:bg-slate-100";
          if (selectedVal !== void 0 && selectedVal !== null) {
            if (isSelected) {
              if (isCorrectKey) {
                btnStyles = "bg-emerald-600 border-emerald-600 text-white font-black shadow-md";
              } else {
                btnStyles = "bg-rose-500 border-rose-500 text-white font-black shadow-md";
              }
            } else if (isCorrectKey) {
              btnStyles = "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-400 dark:border-emerald-800 border-2 font-bold";
            }
          }
          return /* @__PURE__ */ React.createElement(
            "button",
            {
              key: opt.id,
              type: "button",
              onClick: () => {
                setTempExamSelections((prev) => ({
                  ...prev,
                  [q.id]: isSelected ? null : opt.id
                }));
              },
              className: `p-2.5 rounded-xl border text-left flex justify-between items-center gap-2 transition active:scale-[0.99] font-bold ${btnStyles}`
            },
            /* @__PURE__ */ React.createElement("span", null, opt.label),
            selectedVal !== void 0 && selectedVal !== null && /* @__PURE__ */ React.createElement(React.Fragment, null, isSelected && isCorrectKey && /* @__PURE__ */ React.createElement("span", { className: "text-[8.5px] bg-white/20 px-1.5 py-0.5 rounded font-black uppercase" }, "\u2713 CORRECTO"), isSelected && !isCorrectKey && /* @__PURE__ */ React.createElement("span", { className: "text-[8.5px] bg-white/20 px-1.5 py-0.5 rounded font-black uppercase" }, "\u2717 INCORRECTO"), !isSelected && isCorrectKey && /* @__PURE__ */ React.createElement("span", { className: "text-[8.5px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider" }, "\u2605 CLAVE CORRECTA"))
          );
        })), !q.hasSubQuestions && isMatching && /* @__PURE__ */ React.createElement("div", { className: "border border-slate-155 dark:border-slate-800/80 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80" }, (q.subQuestions || []).map((subQ, sIdx) => {
          const qSelections = selectedVal || {};
          const subQSelectedVal = qSelections[subQ.id];
          const optCount = q.options?.length || 4;
          let gridColsClass = "grid-cols-2 sm:grid-cols-4";
          if (optCount === 2) gridColsClass = "grid-cols-2";
          else if (optCount === 3) gridColsClass = "grid-cols-3";
          else if (optCount === 5) gridColsClass = "grid-cols-2 sm:grid-cols-5";
          else if (optCount > 5) gridColsClass = "grid-cols-2 sm:grid-cols-6";
          return /* @__PURE__ */ React.createElement("div", { key: subQ.id, className: "grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3.5 bg-slate-55/20 dark:bg-slate-900/15 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors" }, /* @__PURE__ */ React.createElement("div", { className: "sm:col-span-4 flex items-center gap-2 pr-2" }, /* @__PURE__ */ React.createElement("span", { className: "h-4.5 w-4.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-[9px] shrink-0" }, sIdx + 1), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-slate-700 dark:text-slate-350 leading-tight" }, subQ.text)), /* @__PURE__ */ React.createElement("div", { className: `sm:col-span-8 grid ${gridColsClass} gap-1.5 w-full` }, (q.options || []).map((opt) => {
            const isSelected = subQSelectedVal === opt.id;
            const isCorrectKey = subQ.correctValue === opt.id;
            let btnStyles = "bg-white dark:bg-slate-950 text-slate-550 dark:text-slate-400 border-slate-205 dark:border-slate-800 hover:bg-slate-100/50";
            if (subQSelectedVal !== void 0 && subQSelectedVal !== null && subQSelectedVal !== "") {
              if (isSelected) {
                if (isCorrectKey) {
                  btnStyles = "bg-emerald-600 text-white border-emerald-600 shadow-sm font-black";
                } else {
                  btnStyles = "bg-rose-500 text-white border-rose-500 shadow-sm font-black";
                }
              } else if (isCorrectKey) {
                btnStyles = "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border-emerald-400 dark:border-emerald-800 border font-bold";
              }
            }
            return /* @__PURE__ */ React.createElement(
              "button",
              {
                key: opt.id,
                type: "button",
                onClick: () => {
                  setTempExamSelections((prev) => {
                    const qSel = { ...prev[q.id] || {} };
                    qSel[subQ.id] = isSelected ? null : opt.id;
                    return { ...prev, [q.id]: qSel };
                  });
                },
                className: `px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all active:scale-95 text-center truncate ${btnStyles}`,
                title: opt.label
              },
              opt.label
            );
          })));
        })), q.hasSubQuestions && q.subQuestions && q.subQuestions.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "space-y-4 pt-1" }, q.subQuestions.map((subQ, sIdx) => {
          const subQSelectedVal = selectedVal?.[subQ.id];
          const isSubDirect = subQ.type === "direct";
          const isSubChoice = subQ.type === "choice";
          const isSubMatching = subQ.type === "matching";
          const subQPts = (q.points / q.subQuestions.length).toFixed(1);
          return /* @__PURE__ */ React.createElement("div", { key: subQ.id, className: "p-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start border-b border-slate-100 dark:border-slate-800/80 pb-2" }, /* @__PURE__ */ React.createElement("h6", { className: "text-[10.5px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 leading-snug" }, /* @__PURE__ */ React.createElement("span", { className: "h-4.5 w-4.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-[9px] shrink-0" }, idx + 1, ".", sIdx + 1), subQ.text), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-bold text-slate-450 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0" }, subQPts, " pts")), isSubDirect && /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: () => {
                setTempExamSelections((prev) => {
                  const qSel = { ...prev[q.id] || {} };
                  qSel[subQ.id] = subQSelectedVal === true ? null : true;
                  return { ...prev, [q.id]: qSel };
                });
              },
              className: `py-1.5 px-3 rounded-lg border flex items-center justify-center gap-1.5 transition active:scale-95 font-bold text-[10px] ${subQSelectedVal === true ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" : "bg-white dark:bg-slate-955 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-805 hover:bg-slate-100"}`
            },
            /* @__PURE__ */ React.createElement("span", null, "\u2713"),
            " Correcto"
          ), /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: () => {
                setTempExamSelections((prev) => {
                  const qSel = { ...prev[q.id] || {} };
                  qSel[subQ.id] = subQSelectedVal === false ? null : false;
                  return { ...prev, [q.id]: qSel };
                });
              },
              className: `py-1.5 px-3 rounded-lg border flex items-center justify-center gap-1.5 transition active:scale-95 font-bold text-[10px] ${subQSelectedVal === false ? "bg-rose-500 border-rose-500 text-white shadow-sm" : "bg-white dark:bg-slate-955 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-805 hover:bg-slate-100"}`
            },
            /* @__PURE__ */ React.createElement("span", null, "\u2717"),
            " Incorrecto"
          )), isSubChoice && /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-2 text-[10px] font-semibold font-bold" }, (subQ.options || []).map((opt) => {
            const isSelected = subQSelectedVal === opt.id;
            const isCorrectKey = subQ.correctValue === opt.id;
            let btnStyles = "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100";
            if (subQSelectedVal !== void 0 && subQSelectedVal !== null && subQSelectedVal !== "") {
              if (isSelected) {
                if (isCorrectKey) {
                  btnStyles = "bg-emerald-600 border-emerald-600 text-white font-bold shadow-sm";
                } else {
                  btnStyles = "bg-rose-500 border-rose-500 text-white font-bold shadow-sm";
                }
              } else if (isCorrectKey) {
                btnStyles = "bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400 border-emerald-400 dark:border-emerald-805 border-2 font-bold";
              }
            }
            return /* @__PURE__ */ React.createElement(
              "button",
              {
                key: opt.id,
                type: "button",
                onClick: () => {
                  setTempExamSelections((prev) => {
                    const qSel = { ...prev[q.id] || {} };
                    qSel[subQ.id] = isSelected ? null : opt.id;
                    return { ...prev, [q.id]: qSel };
                  });
                },
                className: `p-2 rounded-lg border text-left flex justify-between items-center gap-2 transition active:scale-[0.99] font-bold ${btnStyles}`
              },
              /* @__PURE__ */ React.createElement("span", null, opt.label),
              subQSelectedVal !== void 0 && subQSelectedVal !== null && subQSelectedVal !== "" && /* @__PURE__ */ React.createElement(React.Fragment, null, isSelected && isCorrectKey && /* @__PURE__ */ React.createElement("span", { className: "text-[8px] bg-white/20 px-1 py-0.5 rounded font-black uppercase" }, "\u2713 CORRECTO"), isSelected && !isCorrectKey && /* @__PURE__ */ React.createElement("span", { className: "text-[8px] bg-white/20 px-1 py-0.5 rounded font-black uppercase" }, "\u2717 INCORRECTO"), !isSelected && isCorrectKey && /* @__PURE__ */ React.createElement("span", { className: "text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider" }, "\u2605 CLAVE"))
            );
          })), isSubMatching && /* @__PURE__ */ React.createElement("div", { className: "border border-slate-150 dark:border-slate-800/80 rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-950" }, (subQ.subQuestions || []).map((nestedSub, nsIdx) => {
            const subQMatchingSelections = subQSelectedVal || {};
            const matchSelection = subQMatchingSelections[nestedSub.id];
            const optCount = subQ.options?.length || 4;
            let gridColsClass = "grid-cols-2 sm:grid-cols-4";
            if (optCount === 2) gridColsClass = "grid-cols-2";
            else if (optCount === 3) gridColsClass = "grid-cols-3";
            else if (optCount === 5) gridColsClass = "grid-cols-2 sm:grid-cols-5";
            return /* @__PURE__ */ React.createElement("div", { key: nestedSub.id, className: "grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2.5 bg-transparent hover:bg-slate-50/30 dark:hover:bg-slate-900/20 transition-colors" }, /* @__PURE__ */ React.createElement("div", { className: "sm:col-span-5 flex items-center gap-1.5 pr-1" }, /* @__PURE__ */ React.createElement("span", { className: "h-4 w-4 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-[8.5px] shrink-0" }, nsIdx + 1), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-semibold text-slate-700 dark:text-slate-350 leading-tight" }, nestedSub.text)), /* @__PURE__ */ React.createElement("div", { className: `sm:col-span-7 grid ${gridColsClass} gap-1 w-full` }, (subQ.options || []).map((opt) => {
              const isSelected = matchSelection === opt.id;
              const isCorrectKey = nestedSub.correctValue === opt.id;
              let btnStyles = "bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-450 border-slate-200 dark:border-slate-800 hover:bg-slate-100/50";
              if (matchSelection !== void 0 && matchSelection !== null && matchSelection !== "") {
                if (isSelected) {
                  if (isCorrectKey) {
                    btnStyles = "bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold";
                  } else {
                    btnStyles = "bg-rose-500 text-white border-rose-500 shadow-sm font-bold";
                  }
                } else if (isCorrectKey) {
                  btnStyles = "bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400 border-emerald-350 dark:border-emerald-805 border font-bold";
                }
              }
              return /* @__PURE__ */ React.createElement(
                "button",
                {
                  key: opt.id,
                  type: "button",
                  onClick: () => {
                    setTempExamSelections((prev) => {
                      const mainSel = { ...prev[q.id] || {} };
                      const subSel = { ...mainSel[subQ.id] || {} };
                      subSel[nestedSub.id] = isSelected ? null : opt.id;
                      mainSel[subQ.id] = subSel;
                      return { ...prev, [q.id]: mainSel };
                    });
                  },
                  className: `px-1.5 py-1 rounded-md border text-[9px] font-bold transition-all active:scale-95 text-center truncate ${btnStyles}`,
                  title: opt.label
                },
                opt.label
              );
            })));
          })));
        })));
      })));
    })(), gradingEval.type === "Rubrica" && /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, gradingEval.instrumentConfig?.criteriaList?.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-rose-500 text-center py-4 italic" }, "No se han configurado criterios en este instrumento. Cierre y presione el icono de engranaje para configurarla.") : gradingEval.instrumentConfig?.criteriaList?.map((crit) => {
      const selectedVal = tempRubricSelections[crit.id];
      return /* @__PURE__ */ React.createElement("div", { key: crit.id, className: "p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/50 space-y-2.5" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-black text-slate-700 dark:text-slate-300" }, crit.criteria), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-[10px] font-semibold" }, ["AD", "A", "B", "C"].map((level) => {
        const descText = crit.descriptors?.[level] || "Sin descripci\xF3n para el nivel.";
        const isSelected = selectedVal === level;
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: level,
            type: "button",
            onClick: () => {
              setTempRubricSelections((prev) => {
                const next = { ...prev };
                if (next[crit.id] === level) {
                  delete next[crit.id];
                } else {
                  next[crit.id] = level;
                }
                return next;
              });
            },
            className: `p-2.5 rounded-lg border text-left flex flex-col justify-between h-full gap-1.5 transition-all ${isSelected ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-950 dark:text-white border-2 scale-[1.02]" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-400 hover:text-slate-600"}`
          },
          /* @__PURE__ */ React.createElement("span", { className: "font-extrabold uppercase text-[11px] text-indigo-500" }, level),
          /* @__PURE__ */ React.createElement("span", { className: "leading-snug text-[9px] line-clamp-3" }, descText)
        );
      })));
    })), gradingEval.type === "Lista de Cotejo 3 Niveles" && /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, gradingEval.instrumentConfig?.criteriaList?.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-rose-500 text-center py-4 italic" }, "No se han configurado criterios en la lista. Cierre y configurela.") : gradingEval.instrumentConfig?.criteriaList?.map((crit, cIdx) => {
      const points = parseFloat(crit.points) || 0;
      const colors = ["border-blue-500/35", "border-purple-500/35", "border-emerald-500/35", "border-amber-500/35"];
      const borderColor = colors[cIdx % colors.length];
      return /* @__PURE__ */ React.createElement("div", { key: crit.id, className: `p-4 bg-white dark:bg-slate-900 rounded-2xl border-[3.5px] ${borderColor} space-y-3.5 shadow-sm` }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide" }, crit.name), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black text-indigo-650 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded shrink-0" }, points, " pts")), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, crit.indicators?.map((ind, iIdx) => {
        const selectedVal = tempChecklist3LvlSelections[ind.id];
        let rowStyle = "bg-white border-slate-150 dark:border-slate-800";
        if (selectedVal === "A") {
          rowStyle = "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 border-2";
        } else if (selectedVal === "B") {
          rowStyle = "bg-amber-55/25 dark:bg-amber-950/20 border-amber-500 border-2";
        } else if (selectedVal === "C") {
          rowStyle = "bg-rose-50/50 dark:bg-rose-950/20 border-rose-500 border-2";
        }
        return /* @__PURE__ */ React.createElement("div", { key: ind.id, className: `flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center p-2.5 rounded-xl border transition-all duration-200 ${rowStyle}` }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-semibold text-slate-700 dark:text-slate-350 pr-2" }, ind.text), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1 shrink-0 w-full sm:w-auto" }, /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => {
              setTempChecklist3LvlSelections((prev) => ({
                ...prev,
                [ind.id]: selectedVal === "A" ? null : "A"
              }));
            },
            className: `h-8 w-8 rounded-full flex items-center justify-center font-black text-xs transition active:scale-95 border-2 ${selectedVal === "A" ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/25" : "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"}`,
            title: "Logrado"
          },
          "A"
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => {
              setTempChecklist3LvlSelections((prev) => ({
                ...prev,
                [ind.id]: selectedVal === "B" ? null : "B"
              }));
            },
            className: `h-8 w-8 rounded-full flex items-center justify-center font-black text-xs transition active:scale-95 border-2 ${selectedVal === "B" ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25" : "bg-amber-50/30 dark:bg-amber-950/10 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"}`,
            title: "En Proceso"
          },
          "B"
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            type: "button",
            onClick: () => {
              setTempChecklist3LvlSelections((prev) => ({
                ...prev,
                [ind.id]: selectedVal === "C" ? null : "C"
              }));
            },
            className: `h-8 w-8 rounded-full flex items-center justify-center font-black text-xs transition active:scale-95 border-2 ${selectedVal === "C" ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25" : "bg-rose-50/30 dark:bg-rose-950/10 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25"}`,
            title: "En Inicio"
          },
          "C"
        )));
      }), (!crit.indicators || crit.indicators.length === 0) && /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-400 italic" }, "No hay subcriterios en este criterio.")));
    })), gradingEval.type === "Lista de Cotejo" && /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, gradingEval.instrumentConfig?.items?.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-rose-500 text-center py-4 italic" }, "No se han configurado indicadores en la lista. Cierre y configurela.") : gradingEval.instrumentConfig?.items?.map((item) => {
      const isChecked = !!tempChecklistSelections[item.id];
      return /* @__PURE__ */ React.createElement(
        "label",
        {
          key: item.id,
          className: "flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 transition select-none"
        },
        /* @__PURE__ */ React.createElement(
          "input",
          {
            type: "checkbox",
            checked: isChecked,
            onChange: (e) => {
              setTempChecklistSelections((prev) => ({ ...prev, [item.id]: e.target.checked }));
            },
            className: "h-4.5 w-4.5 rounded text-indigo-600 focus:ring-indigo-500"
          }
        ),
        /* @__PURE__ */ React.createElement("span", { className: "text-xs font-semibold text-slate-700 dark:text-slate-300" }, item.text)
      );
    })), gradingEval.type === "Guia de Observacion" && /* @__PURE__ */ React.createElement("div", { className: "space-y-5" }, gradingEval.instrumentConfig?.criteriaList?.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "text-xs text-rose-500 text-center py-4 italic" }, "No se han configurado criterios ni indicadores observacionales.") : gradingEval.instrumentConfig?.criteriaList?.map((crit) => /* @__PURE__ */ React.createElement("div", { key: crit.id, className: "space-y-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-extrabold uppercase text-slate-400 tracking-wider" }, "Criterio: ", crit.name), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, crit.indicators?.map((ind) => {
      const selectedLvl = tempObservationSelections[ind.id];
      return /* @__PURE__ */ React.createElement("div", { key: ind.id, className: "p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/40 space-y-2" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-slate-600 dark:text-slate-350" }, ind.text), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5 pt-1" }, gradingEval.instrumentConfig?.levels?.map((lvl) => /* @__PURE__ */ React.createElement(
        "button",
        {
          key: lvl.id,
          type: "button",
          onClick: () => {
            setTempObservationSelections((prev) => {
              const next = { ...prev };
              if (next[ind.id] === lvl.id) {
                delete next[ind.id];
              } else {
                next[ind.id] = lvl.id;
              }
              return next;
            });
          },
          className: `px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${selectedLvl === lvl.id ? "border-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 shadow-sm" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-400 hover:text-slate-600"}`
        },
        lvl.label,
        " (",
        lvl.name,
        ")"
      ))));
    })))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3" }, /* @__PURE__ */ React.createElement("label", { className: "block text-[10px] font-bold uppercase text-slate-400" }, "Observaciones Generales"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        rows: "3",
        placeholder: "Registrar an\xE9cdotas, comportamientos o justificaciones evidenciadas...",
        value: tempObsComments,
        onChange: (e) => setTempObsComments(e.target.value),
        className: "w-full text-xs rounded-xl border border-slate-200 bg-white/50 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900"
      }
    )))))), /* @__PURE__ */ React.createElement("div", { className: "p-4 bg-indigo-50/80 border border-indigo-100/80 rounded-2xl flex items-center justify-between text-center gap-3 text-slate-800" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-indigo-650 font-bold uppercase tracking-wider block" }, "Nota Resultante"), /* @__PURE__ */ React.createElement("span", { className: "text-2xl font-black text-indigo-700" }, typeof liveCalculatedScore === "number" ? liveCalculatedScore.toFixed(1) : liveCalculatedScore)), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setGradingStudent(null);
          setGradingEval(null);
        },
        className: "btn-neuro-secondary text-xs px-4 py-2"
      },
      "Cancelar"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setTempExamScore(gradingScale === "literal" ? "A" : 0);
          setTempExamSelections({});
          setTempRubricSelections({});
          setTempChecklistSelections({});
          setTempObservationSelections({});
          setTempObsComments("");
        },
        className: "px-4 py-2 border border-red-200 dark:border-red-900/60 hover:border-red-400 dark:hover:border-red-700 bg-red-50/50 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-650 dark:text-red-400 text-xs font-bold rounded-xl transition"
      },
      "Limpiar"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleSaveStudentGrade,
        className: "btn-neuro-primary text-xs px-4.5 py-2 flex items-center gap-1.5"
      },
      /* @__PURE__ */ React.createElement(Check, { className: "h-4 w-4" }),
      "Guardar Nota"
    ))))),
    document.body
  ), showImportModal && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" }, /* @__PURE__ */ React.createElement("div", { className: "glass-card max-w-4xl w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-200 font-sans" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono" }, "SISGESMAFI Importer"), /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-black mt-1 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Upload, { className: "h-5 w-5 text-indigo-500" }), "Importador Flexible de Calificaciones"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500" }, "Suba un archivo CSV/TXT o copie y pegue datos directamente de Excel.")), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setShowImportModal(false);
        setImportRawText("");
        setImportFeedback(null);
      },
      className: "text-slate-400 hover:text-slate-650"
    },
    /* @__PURE__ */ React.createElement(X, { className: "h-5 w-5" })
  )), importFeedback ? /* @__PURE__ */ React.createElement("div", { className: `p-6 text-center rounded-2xl border ${importFeedback.success ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 text-emerald-800 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/20 border-rose-250 text-rose-800 dark:text-rose-300"} space-y-2` }, /* @__PURE__ */ React.createElement(CheckSquare, { className: "h-12 w-12 mx-auto text-emerald-500 animate-bounce" }), /* @__PURE__ */ React.createElement("h4", { className: "font-extrabold text-sm" }, importFeedback.success ? "\xA1\xC9xito!" : "Ocurri\xF3 un problema"), /* @__PURE__ */ React.createElement("p", { className: "text-xs" }, importFeedback.message)) : /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 items-start" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-4 w-full" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-450 mb-1.5" }, "1. Subir Archivo o Pegar Datos"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-center w-full mb-3" }, /* @__PURE__ */ React.createElement("label", { className: "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-350 rounded-xl cursor-pointer bg-white/50 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-850/50 transition" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center pt-3 pb-3" }, /* @__PURE__ */ React.createElement(Upload, { className: "w-6 h-6 mb-1.5 text-slate-400" }), /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-slate-500 font-bold" }, "Haga clic para seleccionar archivo (.csv, .txt)"), /* @__PURE__ */ React.createElement("p", { className: "text-[9px] text-slate-400 mt-0.5" }, "O simplemente pegue los datos abajo")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "file",
      accept: ".csv,.txt",
      onChange: (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          setImportRawText(evt.target.result);
        };
        reader.readAsText(file);
      },
      className: "hidden"
    }
  ))), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      rows: "6",
      placeholder: "Seleccione las celdas en su archivo Excel, c\xF3pielas (Ctrl+C) y p\xE9guelas aqu\xED (Ctrl+V)\nDNI	Nombre del alumno	Calificaci\xF3n\n72846152	Alvarado Ruiz, Mar\xEDa	AD\n83917462	Bustamante Prado, Juan	B",
      value: importRawText,
      onChange: (e) => setImportRawText(e.target.value),
      className: "w-full text-[11px] font-mono rounded-xl border border-slate-200 bg-white/50 p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 leading-relaxed"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-250 dark:border-slate-800 rounded-xl space-y-3" }, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-450" }, "2. Actividad de Destino en SISGESMAFI"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-[10px] font-bold text-slate-450 mb-1" }, "Columna donde guardar notas"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: importTargetEvalId,
      onChange: (e) => {
        setImportTargetEvalId(e.target.value);
        if (e.target.value === "new") {
          setNewImportEvalCapacityId(activeCompetence?.capacities?.[0]?.id || "");
        }
      },
      className: "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-205"
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "-- Seleccionar Columna --"),
    activeEvaluations.map((ev) => /* @__PURE__ */ React.createElement("option", { key: ev.id, value: ev.id }, ev.name, " (", ev.type, ")")),
    /* @__PURE__ */ React.createElement("option", { value: "new" }, "+ Crear Nueva Actividad de Evaluaci\xF3n")
  )), importTargetEvalId === "new" && /* @__PURE__ */ React.createElement("div", { className: "space-y-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/40 animate-in fade-in duration-200" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-[10px] font-bold text-slate-450 mb-1 font-sans" }, "Nombre de Nueva Actividad"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: newImportEvalName,
      onChange: (e) => setNewImportEvalName(e.target.value),
      className: "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-950",
      placeholder: "Ej: Examen Importado de Excel"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-[10px] font-bold text-slate-450 mb-1" }, "Instrumento"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: newImportEvalType,
      onChange: (e) => setNewImportEvalType(e.target.value),
      className: "w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-205"
    },
    /* @__PURE__ */ React.createElement("option", { value: "Examen" }, "Examen / Nota Directa"),
    /* @__PURE__ */ React.createElement("option", { value: "Rubrica" }, "R\xFAbrica de Criterios"),
    /* @__PURE__ */ React.createElement("option", { value: "Lista de Cotejo" }, "Lista de Cotejo"),
    /* @__PURE__ */ React.createElement("option", { value: "Lista de Cotejo 3 Niveles" }, "Lista de Cotejo (3 Niveles)"),
    /* @__PURE__ */ React.createElement("option", { value: "Guia de Observacion" }, "Gu\xEDa de Observaci\xF3n")
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-[10px] font-bold text-slate-450 mb-1" }, "Capacidad CNEB"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: newImportEvalCapacityId,
      onChange: (e) => setNewImportEvalCapacityId(e.target.value),
      className: "w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-205"
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "Evaluaci\xF3n General"),
    activeCompetence?.capacities?.map((cap) => /* @__PURE__ */ React.createElement("option", { key: cap.id, value: cap.id }, cap.name))
  )))))), /* @__PURE__ */ React.createElement("div", { className: "space-y-4 w-full h-[450px] flex flex-col" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-450 mb-1.5" }, "3. Configurar Mapeo de Columnas Detectadas"), parsedRows.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 grid grid-cols-3 gap-2" }, parsedRows[0].map((cell, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "space-y-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-black text-slate-400 block uppercase" }, "Columna ", idx + 1, ' ("', cell.substring(0, 10), '...")'), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: columnMappings[idx] || "ignore",
      onChange: (e) => setColumnMappings({ ...columnMappings, [idx]: e.target.value }),
      className: "w-full rounded bg-white px-1.5 py-1 text-[11px] font-bold border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-indigo-650 dark:text-indigo-400"
    },
    /* @__PURE__ */ React.createElement("option", { value: "ignore" }, "Ignorar Columna"),
    /* @__PURE__ */ React.createElement("option", { value: "dni" }, "Mapear a DNI / Dto."),
    /* @__PURE__ */ React.createElement("option", { value: "name" }, "Mapear a Nombres"),
    /* @__PURE__ */ React.createElement("option", { value: "grade" }, "Mapear a Nota")
  )))) : /* @__PURE__ */ React.createElement("div", { className: "text-center py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400 italic" }, "Cargue un archivo o pegue datos de Excel para ver sus columnas.")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-hidden flex flex-col" }, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-450 mb-1.5" }, "4. Previsualizaci\xF3n del Emparejamiento"), importPreview.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/40" }, /* @__PURE__ */ React.createElement("table", { className: "w-full border-collapse text-left text-[11px]" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-slate-100 dark:bg-slate-900/60 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "p-2 border-r border-slate-200 dark:border-slate-800" }, "Fila Excel"), /* @__PURE__ */ React.createElement("th", { className: "p-2 border-r border-slate-200 dark:border-slate-800" }, "Alumno Emparejado (SISGESMAFI)"), /* @__PURE__ */ React.createElement("th", { className: "p-2 text-center w-20" }, "Nota Detectada"))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-slate-200 dark:divide-slate-800/60" }, importPreview.map((item, idx) => /* @__PURE__ */ React.createElement("tr", { key: idx, className: "hover:bg-slate-50 dark:hover:bg-slate-950/40 transition" }, /* @__PURE__ */ React.createElement("td", { className: "p-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap overflow-hidden max-w-[150px] truncate leading-tight font-mono text-[10px]" }, item.rowName || item.rowDni ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-700 dark:text-slate-300" }, item.rowName || "Sin Nombre"), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-slate-400 block mt-0.5 font-sans" }, "DNI: ", item.rowDni || "-")) : /* @__PURE__ */ React.createElement("span", { className: "text-slate-350 italic" }, "Fila vac\xEDa o incompleta")), /* @__PURE__ */ React.createElement("td", { className: "p-2 border-r border-slate-200 dark:border-slate-800 leading-tight" }, item.student ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-850 dark:text-slate-100" }, item.student.name), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 mt-0.5" }, /* @__PURE__ */ React.createElement("span", { className: `text-[8px] px-1 rounded font-bold uppercase ${item.status === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}` }, item.method === "dni" ? "DNI exacto" : item.method === "name_exact" ? "Nombre exacto" : "Nombre aproximado"))) : /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 text-rose-500" }, /* @__PURE__ */ React.createElement(AlertTriangle, { className: "h-3 w-3 inline shrink-0" }), /* @__PURE__ */ React.createElement("span", { className: "font-bold italic" }, "No emparejado / No encontrado"))), /* @__PURE__ */ React.createElement("td", { className: "p-2 text-center font-bold font-mono" }, item.student ? item.validGrade !== "" ? /* @__PURE__ */ React.createElement("span", { className: "text-indigo-600 dark:text-indigo-400 font-extrabold text-xs" }, item.validGrade) : /* @__PURE__ */ React.createElement("span", { className: "text-rose-500 italic text-[10px]", title: `El formato de nota "${item.rowGrade}" es inv\xE1lido para la escala ${gradingScale}` }, "Nota inv\xE1lida (", item.rowGrade, ")") : /* @__PURE__ */ React.createElement("span", { className: "text-slate-300 font-normal" }, "-"))))))) : /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-slate-450 italic text-xs py-8" }, /* @__PURE__ */ React.createElement(FileText, { className: "h-8 w-8 text-slate-300 mb-1.5" }), "Esperando datos de calificaciones...")))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        setShowImportModal(false);
        setImportRawText("");
        setImportFeedback(null);
      },
      className: "btn-neuro-secondary text-xs px-4 py-2"
    },
    "Cerrar"
  ), !importFeedback && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleApplyImport,
      disabled: importPreview.length === 0 || !importTargetEvalId,
      className: "btn-neuro-primary text-xs px-5 py-2 flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
    },
    /* @__PURE__ */ React.createElement(Check, { className: "h-4 w-4" }),
    "Aplicar Notas Importadas"
  )))), copyingEvaluation && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" }, /* @__PURE__ */ React.createElement("div", { className: "glass-card p-6 max-w-lg w-full space-y-4 shadow-2xl border border-white/20" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800" }, /* @__PURE__ */ React.createElement("h4", { className: "font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Copy, { className: "h-5 w-5 text-indigo-500" }), "Copiar Instrumento"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setCopyingEvaluation(null),
      className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold leading-none"
    },
    "\xD7"
  )), /* @__PURE__ */ React.createElement("form", { onSubmit: handleCopyEvaluationSubmit, className: "space-y-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-slate-500" }, "Duplicar\xE1 el instrumento ", /* @__PURE__ */ React.createElement("strong", { className: "text-slate-800 dark:text-slate-200 font-bold" }, '"', copyingEvaluation.name, '"'), " (", copyingEvaluation.type, ") con su configuraci\xF3n de criterios y descriptores hacia el destino especificado."), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-400 mb-1.5" }, "Curso Destino"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: targetCourseId,
      onChange: (e) => setTargetCourseId(e.target.value),
      className: "w-full rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:border-indigo-500"
    },
    visibleCourses.map((c) => {
      const asgs = c.assignments || [];
      const relevantAsgs = currentRole === "teacher" ? asgs.filter((a) => a.teacherId === currentUser?.id) : asgs;
      const gradesText = Array.from(new Set(relevantAsgs.map((a) => a.gradeLevel))).join(", ");
      return /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.name, " (", gradesText, ")");
    })
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-400 mb-1.5" }, "Competencia Destino"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: targetCompetenceId,
      onChange: (e) => setTargetCompetenceId(e.target.value),
      className: "w-full rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:border-indigo-500"
    },
    targetCompetencies.map((comp) => /* @__PURE__ */ React.createElement("option", { key: comp.id, value: comp.id }, comp.name)),
    targetCompetencies.length === 0 && /* @__PURE__ */ React.createElement("option", { value: "" }, "Sin competencias")
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-400 mb-1.5" }, "Capacidad Destino"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: targetCapacityId,
      onChange: (e) => setTargetCapacityId(e.target.value),
      className: "w-full rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:border-indigo-500"
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "Ninguna (Malla Libre)"),
    targetCapacities.map((cap) => /* @__PURE__ */ React.createElement("option", { key: cap.id, value: cap.id }, cap.name))
  )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-400 mb-1.5" }, "Bimestre"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: targetBimester,
      onChange: (e) => setTargetBimester(e.target.value),
      className: "w-full rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:border-indigo-500"
    },
    bimestersOptions.map((opt) => /* @__PURE__ */ React.createElement("option", { key: opt.value, value: opt.value }, opt.label))
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-400 mb-1.5" }, "Unidad"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: targetUnit,
      onChange: (e) => setTargetUnit(e.target.value),
      className: "w-full rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:border-indigo-500"
    },
    (() => {
      let units = [];
      if (targetBimester === "1") units = [{ value: "0", label: "U0" }, { value: "1", label: "U1" }];
      else if (targetBimester === "2") units = [{ value: "2", label: "U2" }, { value: "3", label: "U3" }];
      else if (targetBimester === "3") units = [{ value: "4", label: "U4" }, { value: "5", label: "U5" }];
      else if (targetBimester === "4") units = [{ value: "6", label: "U6" }, { value: "7", label: "U7" }];
      const unitEnabled = (num) => activePeriods?.units?.[String(num)] !== false;
      return units.filter((u) => unitEnabled(u.value)).map((u) => /* @__PURE__ */ React.createElement("option", { key: u.value, value: u.value }, u.label));
    })()
  ))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-400 mb-1.5" }, "Grado Destino"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: targetGrade,
      onChange: (e) => setTargetGrade(e.target.value),
      className: "w-full rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:border-indigo-500"
    },
    targetAvailableGrades.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }, g))
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "block text-xs font-bold uppercase text-slate-400 mb-1.5" }, "Secci\xF3n Destino"), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: targetSection,
      onChange: (e) => setTargetSection(e.target.value),
      className: "w-full rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3 py-2 text-xs font-semibold focus:border-indigo-500"
    },
    targetAvailableSections.map((s) => /* @__PURE__ */ React.createElement("option", { key: s, value: s }, "Secci\xF3n ", s))
  ))), /* @__PURE__ */ React.createElement("div", { className: "bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2" }, /* @__PURE__ */ React.createElement("label", { className: "flex items-start gap-2.5 cursor-pointer select-none font-bold text-xs" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: copyGradesOption && sameClassSelected,
      disabled: !sameClassSelected,
      onChange: (e) => setCopyGradesOption(e.target.checked),
      className: "rounded h-4 w-4 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 mt-0.5"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "space-y-0.5" }, /* @__PURE__ */ React.createElement("span", { className: sameClassSelected ? "text-slate-850 dark:text-slate-200 font-extrabold" : "text-slate-400 cursor-not-allowed font-medium" }, "Copiar tambi\xE9n las calificaciones (notas) de los estudiantes."), !sameClassSelected && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-amber-500 font-semibold block leading-tight mt-1" }, "\u26A0\uFE0F Las notas solo se pueden copiar si el grado y secci\xF3n de destino son id\xE9nticos al origen (", selectedGrade, " - Secci\xF3n ", selectedSection, ").")))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setCopyingEvaluation(null),
      className: "btn-neuro-secondary text-xs py-2 px-4"
    },
    "Cancelar"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      className: "btn-neuro-primary text-xs py-2 px-5"
    },
    "Copiar Instrumento"
  ))))));
}
export default GradingPortal;
