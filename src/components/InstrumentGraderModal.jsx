import React, { useMemo, useState, useEffect } from 'react';
import { X, Save, AlertCircle, RefreshCw, Check, AlertTriangle, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import MitoSachamamaFicha, { getMitoScore } from './MitoSachamamaFicha';
import { adaptInstrumentForGrading } from '../utils/instrumentAdapter';
import { ratioToLiteralGrade } from '../utils/evaluationAccess';

// Helper to calculate score of the clickable "El Dedo Mágico" exam
export const getExamScore = (selections) => {
  let score = 0;
  if (!selections) return 0;
  
  if (selections.q1) {
    if (selections.q1.narradora === 'magic_finger') score += 1;
    if (selections.q1.philip === '8_years') score += 1;
    if (selections.q1.william === '11_years') score += 1;
    if (selections.q1.gregg === 'hunt') score += 1;
  }
  
  if (selections.q2) {
    if (selections.q2.a === 'rojo') score += 1;
    if (selections.q2.b === 'escopeta') score += 1;
    if (selections.q2.c === 'bosque') score += 1;
    if (selections.q2.d === 'cervatillo') score += 1;
  }
  
  if (selections.q3) {
    if (selections.q3.evC === '1') score += 1;
    if (selections.q3.evD === '2') score += 1;
    if (selections.q3.evB === '3') score += 1;
    if (selections.q3.evA === '4') score += 1;
  }
  
  if (selections.q4) {
    if (selections.q4.cazar === 'no_le_gusta') score += 1;
    if (selections.q4.proteger === 'le_gusta') score += 1;
    if (selections.q4.burlarse === 'no_le_gusta') score += 1;
    if (selections.q4.convencer === 'le_gusta') score += 1;
  }
  
  if (selections.q5 === 'enfado') {
    score += 4;
  }
  
  return score;
};

// Helper to calculate score of a single custom item
export const calculateItemScore = (item, selections) => {
  const pts = parseFloat(item.maxScore) || 0;
  if (!selections) return 0;

  if (item.type === 'choice') {
    const selectedVal = selections[item.id];
    return selectedVal === item.correctValue ? pts : 0;
  }
  
  if (item.type === 'matching') {
    const subQs = item.subQuestions || [];
    if (subQs.length === 0) return 0;
    const subQPts = pts / subQs.length;
    const qSelections = selections[item.id] || {};
    let obtained = 0;
    subQs.forEach(subQ => {
      const selectedVal = qSelections[subQ.id];
      if (selectedVal && (selectedVal === subQ.correctValue || (item.options?.find(o => o.id === selectedVal)?.label === subQ.correctValue))) {
        obtained += subQPts;
      }
    });
    return parseFloat(obtained.toFixed(1));
  }
  
  if (item.type === 'abc') {
    const grade = selections[item.id + '_abc_grade'];
    if (grade === 'A' || grade === 'Bien') return pts;
    if (grade === 'B' || grade === 'Medio') return pts / 2;
    return 0;
  }
  
  if (item.type === 'direct') {
    const val = selections[item.id];
    return val === true ? pts : 0;
  }
  
  if (item.type === 'numeric') {
    const val = selections[item.id];
    return (val !== undefined && val !== null && !isNaN(val)) ? Number(val) : 0;
  }
  
  if (item.type === 'subquestions') {
    const subQs = item.subQuestions || [];
    if (subQs.length === 0) return 0;
    const subQPts = pts / subQs.length;
    const qSelections = selections[item.id] || {};
    let obtained = 0;
    subQs.forEach(subQ => {
      const selectedVal = qSelections[subQ.id];
      if (subQ.type === 'choice') {
        if (selectedVal === subQ.correctValue) {
          obtained += subQPts;
        }
      } else if (subQ.type === 'abc') {
        const grade = qSelections[subQ.id + '_abc_grade'];
        if (grade === 'A' || grade === 'Bien') obtained += subQPts;
        else if (grade === 'B' || grade === 'Medio') obtained += subQPts / 2;
      } else if (subQ.type === 'numeric') {
        if (selectedVal !== undefined && selectedVal !== null && !isNaN(selectedVal)) {
          obtained += Number(selectedVal);
        }
      } else { // direct
        if (selectedVal === true) {
          obtained += subQPts;
        }
      }
    });
    return parseFloat(obtained.toFixed(1));
  }
  
  return 0;
};

// Normalize historical variants to the exact values used by the workshop
// buttons.  Keeping this canonical form is essential: the item calculator
// and the visual selected state both depend on these three labels.
const normalizeSavedSelections = (value) => {
  if (Array.isArray(value)) return value.map(normalizeSavedSelections);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeSavedSelections(item)]));
  }
  if (String(value).toLowerCase() === 'bien') return 'Bien';
  if (['medio', 'regular', 'más o menos', 'mas o menos'].includes(String(value).toLowerCase())) return 'Medio';
  if (String(value).toLowerCase() === 'mal') return 'Mal';
  return value;
};

// Helper for grade styling using pastel colors
const getGradeStyle = (val) => {
  if (val === 'AD') {
    return {
      bgClass: 'bg-gradient-to-br from-[#dbeafe] to-[#eff6ff] dark:from-[#1e3a8a]/20 dark:to-[#172554]/20 border-blue-300 dark:border-blue-800/80 shadow-sm shadow-blue-500/5',
      textClass: 'text-blue-850 dark:text-blue-400'
    };
  }
  if (val === 'A') {
    return {
      bgClass: 'bg-gradient-to-br from-[#dcfce7] to-[#f0fdf4] dark:from-[#064e3b]/20 dark:to-[#022c22]/20 border-emerald-300 dark:border-emerald-800/80 shadow-sm shadow-emerald-500/5',
      textClass: 'text-emerald-800 dark:text-emerald-450'
    };
  }
  if (val === 'B') {
    return {
      bgClass: 'bg-gradient-to-br from-[#fef9c3] to-[#fffde7] dark:from-[#78350f]/20 dark:to-[#451a03]/20 border-amber-300 dark:border-amber-800/80 shadow-sm shadow-amber-500/5',
      textClass: 'text-amber-700 dark:text-amber-450'
    };
  }
  if (val === 'C') {
    return {
      bgClass: 'bg-gradient-to-br from-[#fee2e2] to-[#fef2f2] dark:from-[#7f1d1d]/20 dark:to-[#450a0a]/20 border-red-300 dark:border-red-800/80 shadow-sm shadow-red-500/5',
      textClass: 'text-red-650 dark:text-red-400'
    };
  }
  return {
    bgClass: 'bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-slate-300 dark:border-slate-700',
    textClass: 'text-slate-650 dark:text-slate-400'
  };
};

export default function InstrumentGraderModal({ 
  student, 
  instrument: sourceInstrument,
  initialGrade, 
  studentGrades,
  enrolledStudents = [],
  onClose, 
  onSave,
  officialEvaluationId,
  isInline = false
}) {
  const instrument = useMemo(() => adaptInstrumentForGrading(sourceInstrument), [sourceInstrument]);
  const [currentStudentId, setCurrentStudentId] = useState(student.id);
  const [itemScores, setItemScores] = useState({});
  const [tempExamSelections, setTempExamSelections] = useState({});
  const [tempRubricSelections, setTempRubricSelections] = useState({});

  // Resolve corresponding legacy evaluation to pull its details/scores
  const idParts = instrument.id.split('_');
  const isSectionSuffix = ['a', 'b', 'c', 'd', 'e', 'todas'].includes(idParts[idParts.length - 1]);
  // A formative copy keeps its own ID, but must read the complete official
  // record from which it was created.  This prevents an empty formative ficha
  // from masking the saved official selections.
  const parentEvalId = officialEvaluationId || instrument.copiedFromEvaluationId ||
    (isSectionSuffix ? idParts.slice(0, -1).join('_') : instrument.id);

  const currentIndex = enrolledStudents.findIndex(s => s.id === currentStudentId);
  const currentStudent = enrolledStudents[currentIndex] || student;
  const rubricCriteria = instrument.instrumentConfig?.criteriaList || [];
  const hasRubric = rubricCriteria.length > 0;
  const findBestGrade = (evaluationId) => (studentGrades || [])
    .filter(grade => grade.studentId === currentStudentId && grade.evaluationId === evaluationId)
    .sort((left, right) => {
      const leftDetailCount = Object.keys(left.details || {}).length;
      const rightDetailCount = Object.keys(right.details || {}).length;
      if (leftDetailCount !== rightDetailCount) return rightDetailCount - leftDetailCount;
      return new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime();
    })[0];
  const hasResponseDetails = (grade) => Boolean(
    grade?.details && (
      Object.keys(grade.details.rubricSelections || {}).length ||
      Object.keys(grade.details.examSelections || {}).length ||
      Object.keys(grade.details.itemScores || {}).length
    )
  );

  const saveCurrentStudentDataSilently = (studentId) => {
    let finalItemScores = {};
    if (hasItems) {
      (instrument.items || []).forEach(item => {
        const isOverride = itemScores[item.id] !== undefined && itemScores[item.id] !== null && itemScores[item.id] !== '';
        finalItemScores[item.id] = isOverride 
          ? itemScores[item.id] 
          : calculateItemScore(item, tempExamSelections);
      });
    }

    onSave(studentId, {
      score: finalLiteralScore,
      details: {
        itemScores: finalItemScores,
        manualOverrides: itemScores,
        examSelections: tempExamSelections,
        rubricSelections: tempRubricSelections
      }
    });
  };

  const handlePrevStudent = () => {
    if (currentIndex > 0) {
      saveCurrentStudentDataSilently(currentStudentId);
      setCurrentStudentId(enrolledStudents[currentIndex - 1].id);
    }
  };

  const handleNextStudent = () => {
    if (currentIndex < enrolledStudents.length - 1) {
      saveCurrentStudentDataSilently(currentStudentId);
      setCurrentStudentId(enrolledStudents[currentIndex + 1].id);
    }
  };

  useEffect(() => {
    const formativeGrade = findBestGrade(instrument.id);
    const officialSourceGrade = findBestGrade(parentEvalId);
    // A formative instrument first shows its own saved work.  When it has not
    // been answered yet, it falls back to the official source for viewing.
    const currentGrade = hasResponseDetails(formativeGrade) ? formativeGrade : officialSourceGrade;
    if (currentGrade?.details?.manualOverrides) {
      setItemScores(currentGrade.details.manualOverrides);
    } else {
      const initialOverrides = {};
      if (currentGrade?.details?.itemScores && currentGrade?.details?.examSelections) {
        const savedScores = currentGrade.details.itemScores;
        const examSelections = currentGrade.details.examSelections;
        (instrument.items || []).forEach(item => {
          const savedScore = savedScores[item.id];
          if (savedScore !== undefined && savedScore !== null && savedScore !== '') {
            const calculated = calculateItemScore(item, examSelections);
            if (parseFloat(savedScore) !== parseFloat(calculated)) {
              initialOverrides[item.id] = savedScore;
            }
          }
        });
      }
      setItemScores(initialOverrides);
    }
    if (currentGrade?.details?.examSelections) {
      setTempExamSelections(normalizeSavedSelections(currentGrade.details.examSelections));
    } else {
      setTempExamSelections({});
    }
    setTempRubricSelections(currentGrade?.details?.rubricSelections || {});
  }, [currentStudentId, studentGrades, parentEvalId, instrument.items]);

  const handleScoreChange = (itemId, val) => {
    setItemScores(prev => ({ ...prev, [itemId]: val }));
  };

  const handleSelectionChange = (key, val) => {
    setTempExamSelections(prev => ({ ...prev, [key]: val }));
  };

  const selectedTemplate = tempExamSelections?.selectedTemplate || (instrument.name?.toLowerCase().includes('sachamama') || instrument.name?.toLowerCase().includes('mit') ? 'mito' : 'dedo');
  const isMito = selectedTemplate === 'mito';

  // Compute calculated values
  const hasItems = (instrument.items || []).length > 0;

  const totalObtained = hasItems
    ? (instrument.items || []).reduce((acc, item) => {
        // If there's a manual override, use it; otherwise compute it from selections
        const scoreVal = itemScores[item.id] !== undefined && itemScores[item.id] !== null && itemScores[item.id] !== ''
          ? parseFloat(itemScores[item.id]) || 0
          : calculateItemScore(item, tempExamSelections);
        return acc + scoreVal;
      }, 0)
    : (isMito ? getMitoScore(tempExamSelections) : getExamScore(tempExamSelections));

  const totalMax = hasItems
    ? (instrument.items || []).reduce((acc, item) => acc + (parseFloat(item.maxScore) || 0), 0)
    : 20;

  const ratio = totalMax > 0 ? (totalObtained / totalMax) : 0;
  const maxGradeScale = instrument.maxGradeScale || (instrument.type === 'Rúbrica' ? 'AD' : 'A');
  
  let finalLiteralScore = 'C';
  let numericEquivalent = 0;
  if (hasRubric) {
    const values = rubricCriteria.map(criterion => ({ AD: 4, A: 3, B: 2, C: 1 }[tempRubricSelections[criterion.id]])).filter(Boolean);
    const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    if (String(instrument.unit) === '2') {
      finalLiteralScore = average >= 2.5 ? 'A' : average >= 1.5 ? 'B' : 'C';
    } else if (average >= 3.5) finalLiteralScore = 'AD';
    else if (average >= 2.5) finalLiteralScore = 'A';
    else if (average >= 1.5) finalLiteralScore = 'B';
    numericEquivalent = average;
  } else {
    // One source of truth for every literal range. It rounds 83.999...% to
    // the displayed 84% before evaluating the Unit 3 A threshold.
    finalLiteralScore = ratioToLiteralGrade(ratio, {
      unit: instrument.unit,
      maxGradeScale
    });
    numericEquivalent = parseFloat((ratio * (maxGradeScale === 'AD' ? 4.0 : 3.0)).toFixed(1));
  }

  const officialGrade = findBestGrade(parentEvalId);

  const handlePullOfficialGrade = () => {
    if (!officialGrade) {
      alert("No se encontró una calificación oficial ingresada para este estudiante en esta actividad.");
      return;
    }
    
    if (officialGrade.details?.rubricSelections) {
      setTempRubricSelections(officialGrade.details.rubricSelections);
      alert("¡Ficha importada! Criterios y calificativos cargados de la evaluación oficial.");
    } else if (!hasItems) {
      if (officialGrade.details?.examSelections) {
        setTempExamSelections(normalizeSavedSelections(officialGrade.details.examSelections));
        alert("¡Ficha importada! Respuestas y selecciones cargadas de la evaluación oficial.");
      } else {
        alert("La evaluación oficial no tiene las respuestas detalladas cargadas.");
      }
    } else {
      if (officialGrade.details?.examSelections) {
        setTempExamSelections(normalizeSavedSelections(officialGrade.details.examSelections));
      }
      if (officialGrade.details?.manualOverrides) {
        setItemScores(officialGrade.details.manualOverrides);
        alert("¡Ficha importada! Respuestas y puntajes cargados desde el registro de Calificaciones Oficiales.");
      } else if (officialGrade.details?.itemScores) {
        const initialOverrides = {};
        const savedScores = officialGrade.details.itemScores;
        const examSelections = officialGrade.details.examSelections || {};
        (instrument.items || []).forEach(item => {
          const savedScore = savedScores[item.id];
          if (savedScore !== undefined && savedScore !== null && savedScore !== '') {
            const calculated = calculateItemScore(item, examSelections);
            if (parseFloat(savedScore) !== parseFloat(calculated)) {
              initialOverrides[item.id] = savedScore;
            }
          }
        });
        setItemScores(initialOverrides);
        alert("¡Ficha importada! Respuestas y puntajes cargados desde el registro de Calificaciones Oficiales.");
      } else {
        const scoreVal = parseFloat(officialGrade.score);
        if (!isNaN(scoreVal)) {
          const itemScoresMap = {};
          (instrument.items || []).forEach(item => {
            itemScoresMap[item.id] = scoreVal;
          });
          setItemScores(itemScoresMap);
          alert("¡Nota importada! Se cargó la nota de la evaluación oficial.");
        } else {
          alert("La evaluación oficial del alumno aún no tiene notas cargadas.");
        }
      }
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    let finalItemScores = {};
    if (hasItems) {
      (instrument.items || []).forEach(item => {
        const isOverride = itemScores[item.id] !== undefined && itemScores[item.id] !== null && itemScores[item.id] !== '';
        finalItemScores[item.id] = isOverride 
          ? itemScores[item.id] 
          : calculateItemScore(item, tempExamSelections);
      });
    }

    onSave(currentStudentId, {
      score: finalLiteralScore,
      details: {
        itemScores: finalItemScores,
        manualOverrides: itemScores,
        examSelections: tempExamSelections,
        rubricSelections: tempRubricSelections
      }
    });
    alert(`Nota guardada para ${currentStudent.name} (${finalLiteralScore})`);
    onClose();
  };

  const handleClear = () => {
    if (window.confirm(`¿Deseas limpiar todas las respuestas y puntajes de ${currentStudent.name}?`)) {
      setTempExamSelections({});
      setTempRubricSelections({});
      setItemScores({});
    }
  };

  const renderTemplateSelector = () => (
    <div className="flex items-center gap-3 bg-slate-955 p-3 rounded-lg border border-slate-800 justify-between mb-4 max-w-xl mx-auto w-full">
      <span className="text-xs font-bold text-slate-400">Ficha Interactiva:</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTempExamSelections(prev => ({ ...prev, selectedTemplate: 'dedo' }))}
          className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
            selectedTemplate === 'dedo' 
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-sm shadow-indigo-500/10' 
              : 'bg-slate-900/40 text-slate-500 border border-slate-800 hover:text-slate-400'
          }`}
        >
          El Dedo Mágico
        </button>
        <button
          type="button"
          onClick={() => setTempExamSelections(prev => ({ ...prev, selectedTemplate: 'mito' }))}
          className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
            selectedTemplate === 'mito' 
              ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40 shadow-sm shadow-teal-500/10' 
              : 'bg-slate-900/40 text-slate-500 border border-slate-800 hover:text-slate-400'
          }`}
        >
          Mito de la Sachamama
        </button>
      </div>
    </div>
  );

  const getItemStyles = (type, index) => {
    const colors = [
      { border: 'border-indigo-500/25', bg: 'bg-indigo-950/10', text: 'text-indigo-400', gradient: 'from-indigo-500 to-indigo-650' },
      { border: 'border-emerald-500/25', bg: 'bg-emerald-950/10', text: 'text-emerald-400', gradient: 'from-emerald-500 to-emerald-650' },
      { border: 'border-amber-500/25', bg: 'bg-amber-950/10', text: 'text-amber-400', gradient: 'from-amber-500 to-amber-650' },
      { border: 'border-pink-500/25', bg: 'bg-pink-950/10', text: 'text-pink-400', gradient: 'from-pink-500 to-pink-650' },
      { border: 'border-sky-500/25', bg: 'bg-sky-950/10', text: 'text-sky-400', gradient: 'from-sky-500 to-sky-650' },
      { border: 'border-violet-500/25', bg: 'bg-violet-950/10', text: 'text-violet-400', gradient: 'from-violet-500 to-violet-650' }
    ];
    return colors[index % colors.length];
  };

  const getItemCardStyles = (item, selections, index) => {
    const defaultStyles = getItemStyles(item.type, index);
    let grade = null;
    
    if (item.type === 'direct') {
      const val = selections[item.id];
      if (val === true) grade = 'bien';
      else if (val === false) grade = 'mal';
    } else if (item.type === 'choice') {
      const val = selections[item.id];
      if (val !== undefined && val !== null) {
        grade = val === item.correctValue ? 'bien' : 'mal';
      }
    } else if (item.type === 'abc') {
      const val = selections[item.id + '_abc_grade'];
      if (val === 'Bien') grade = 'bien';
      else if (val === 'Medio') grade = 'medio';
      else if (val === 'Mal') grade = 'mal';
    }
    
    if (grade === 'bien') {
      return {
        bg: 'bg-gradient-to-br from-[#ecfdf5] to-[#f0fdf4] dark:from-[#064e3b]/10 dark:to-[#022c22]/10',
        border: 'border-emerald-300 dark:border-emerald-800/80 shadow-emerald-500/5',
        text: 'text-emerald-900 dark:text-emerald-300',
        gradient: 'from-emerald-500 to-emerald-600',
        badgeBg: 'bg-emerald-100/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-250/50',
        labelColor: 'text-emerald-800 dark:text-emerald-400'
      };
    }
    if (grade === 'medio') {
      return {
        bg: 'bg-gradient-to-br from-[#fefcbf] to-[#fffde7] dark:from-[#78350f]/10 dark:to-[#451a03]/10',
        border: 'border-amber-300 dark:border-amber-800/80 shadow-amber-500/5',
        text: 'text-amber-900 dark:text-amber-300',
        gradient: 'from-amber-500 to-amber-600',
        badgeBg: 'bg-amber-100/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border-amber-250/50',
        labelColor: 'text-amber-800 dark:text-amber-400'
      };
    }
    if (grade === 'mal') {
      return {
        bg: 'bg-gradient-to-br from-[#fee2e2] to-[#fef2f2] dark:from-[#7f1d1d]/10 dark:to-[#450a0a]/10',
        border: 'border-rose-300 dark:border-rose-800/80 shadow-rose-500/5',
        text: 'text-rose-900 dark:text-rose-300',
        gradient: 'from-rose-500 to-rose-600',
        badgeBg: 'bg-rose-100/60 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 border-rose-250/50',
        labelColor: 'text-rose-800 dark:text-rose-400'
      };
    }
    
    return {
      bg: 'bg-slate-50/40 dark:bg-slate-900/30',
      border: 'border-slate-200 dark:border-slate-800/80',
      text: 'text-slate-800 dark:text-slate-200',
      gradient: defaultStyles.gradient,
      badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 border-slate-200/20',
      labelColor: 'text-slate-500 dark:text-slate-400'
    };
  };

  const getSubQCardStyles = (itemId, subQ, selections) => {
    const subQSelections = selections[itemId] || {};
    let grade = null;

    if (subQ.type === 'direct') {
      const val = subQSelections[subQ.id];
      if (val === true) grade = 'bien';
      else if (val === false) grade = 'mal';
    } else if (subQ.type === 'choice') {
      const val = subQSelections[subQ.id];
      if (val !== undefined && val !== null) {
        grade = val === subQ.correctValue ? 'bien' : 'mal';
      }
    } else if (subQ.type === 'abc') {
      const val = subQSelections[subQ.id + '_abc_grade'];
      if (val === 'Bien') grade = 'bien';
      else if (val === 'Medio') grade = 'medio';
      else if (val === 'Mal') grade = 'mal';
    }

    if (grade === 'bien') {
      return {
        cardBg: 'bg-gradient-to-br from-[#ecfdf5] to-[#f0fdf4] dark:from-[#064e3b]/10 dark:to-[#022c22]/10 border-emerald-300 dark:border-emerald-800/80 shadow-emerald-500/5 shadow-sm',
        titleText: 'text-emerald-900 dark:text-emerald-300',
        badgeBg: 'bg-emerald-100/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-250/50',
        numBg: 'bg-emerald-500 text-white border-emerald-600'
      };
    }
    if (grade === 'medio') {
      return {
        cardBg: 'bg-gradient-to-br from-[#fefcbf] to-[#fffde7] dark:from-[#78350f]/10 dark:to-[#451a03]/10 border-amber-300 dark:border-amber-800/80 shadow-amber-500/5 shadow-sm',
        titleText: 'text-amber-900 dark:text-amber-300',
        badgeBg: 'bg-amber-100/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 border-amber-250/50',
        numBg: 'bg-amber-500 text-white border-amber-600'
      };
    }
    if (grade === 'mal') {
      return {
        cardBg: 'bg-gradient-to-br from-[#fee2e2] to-[#fef2f2] dark:from-[#7f1d1d]/10 dark:to-[#450a0a]/10 border-rose-300 dark:border-rose-800/80 shadow-rose-500/5 shadow-sm',
        titleText: 'text-rose-900 dark:text-rose-300',
        badgeBg: 'bg-rose-100/60 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 border-rose-250/50',
        numBg: 'bg-rose-500 text-white border-rose-600'
      };
    }

    return {
      cardBg: 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/80',
      titleText: 'text-slate-850 dark:text-slate-200',
      badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-250/20',
      numBg: 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-450 border-slate-350/20'
    };
  };

  const outerWrapperClass = isInline 
    ? "w-full animate-in fade-in" 
    : "fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in";

  const containerClass = isInline 
    ? "bg-[#0B1021]/95 border border-slate-800 rounded-lg w-full shadow-2xl flex flex-col backdrop-blur-md" 
    : "bg-[#0B1021]/95 border border-slate-800 rounded-lg w-full max-w-6xl shadow-2xl flex flex-col overflow-hidden h-[92vh] max-h-[92vh] backdrop-blur-md";

  const formClass = isInline 
    ? "flex flex-col text-left" 
    : "flex flex-col flex-1 overflow-hidden text-left";

  const contentClass = isInline 
    ? "p-6 space-y-4" 
    : "p-6 overflow-y-auto space-y-4 flex-1";

  return (
    <div className={outerWrapperClass}>
      <div className={containerClass}>
        
        {/* Premium student navigation header */}
        <div className="px-6 py-5 border-b border-slate-900 bg-[#0B1021]/60 flex items-center justify-between relative">
          <div className="flex items-center gap-4 flex-1 justify-center relative select-none">
            
            {/* Prev Student Arrow */}
            <button 
              type="button"
              onClick={handlePrevStudent}
              disabled={currentIndex <= 0}
              className="h-10 w-10 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition disabled:opacity-20 disabled:pointer-events-none active:scale-95 shrink-0"
              title="Alumno Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Avatar & Info */}
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-650 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-500/25 border-2 border-slate-800">
                {currentStudent.name ? currentStudent.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?'}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[7.5px] tracking-widest font-black uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded-md">
                    Calificar a: Evaluación Formativa
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide uppercase leading-tight mt-0.5" title={currentStudent.name}>
                  {currentStudent.name}
                </h3>
                <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5 uppercase tracking-wider">
                  Actividad: {instrument.name}
                </span>
              </div>
            </div>

            {/* Next Student Arrow */}
            <button 
              type="button"
              onClick={handleNextStudent}
              disabled={currentIndex >= enrolledStudents.length - 1}
              className="h-10 w-10 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition disabled:opacity-20 disabled:pointer-events-none active:scale-95 shrink-0"
              title="Siguiente Alumno"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

          </div>

          <button onClick={onClose} className="h-9 w-9 rounded-lg bg-slate-900/40 hover:bg-slate-800 border border-slate-850 text-slate-500 hover:text-white transition flex items-center justify-center shrink-0 ml-3">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={formClass}>
          <div className={contentClass}>
            
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-start gap-2 max-w-md">
                <AlertCircle className="h-4.5 w-4.5 text-amber-450 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  Registre las respuestas de la evaluación. Si el alumno ya cuenta con respuestas en la evaluación oficial, presione "Jalar Ficha Oficial".
                </p>
              </div>
              {officialGrade && (
                <button
                  type="button"
                  onClick={handlePullOfficialGrade}
                  className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-transform active:scale-95 shadow-md shadow-indigo-600/20 whitespace-nowrap"
                  title="Jalar respuestas y notas de la ficha oficial"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Jalar Ficha Oficial
                </button>
              )}
            </div>

            {hasRubric ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 p-4 text-xs text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-200">
                  Selecciona el calificativo registrado para cada criterio. Los criterios cargados provienen de la ficha oficial del alumno.
                </div>
                {rubricCriteria.map((criterion, index) => {
                  const selected = tempRubricSelections[criterion.id];
                  const levels = ['AD', 'A', 'B', 'C'].filter(level => criterion.descriptors?.[level]);
                  return (
                    <div key={criterion.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="mb-3 flex items-start gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white">{index + 1}</span>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100">{criterion.criteria}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {levels.map(level => {
                          const isSelected = selected === level;
                          const style = getGradeStyle(level);
                          return (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setTempRubricSelections(previous => ({
                                ...previous,
                                [criterion.id]: isSelected ? null : level
                              }))}
                              className={`rounded-lg border-2 p-3 text-left transition ${isSelected ? `${style.bgClass} shadow-md` : 'border-slate-200 bg-slate-50 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800'}`}
                            >
                              <span className={`block text-sm font-black ${isSelected ? style.textClass : 'text-slate-600 dark:text-slate-300'}`}>{level}</span>
                              <span className="mt-1 block text-[10px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">{criterion.descriptors[level]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : !hasItems ? (
              // Legacy hardcoded exams (El Dedo Magico / Sachamama)
              <div className="space-y-4">
                {renderTemplateSelector()}
                
                {isMito ? (
                  <MitoSachamamaFicha 
                    tempExamSelections={tempExamSelections}
                    setTempExamSelections={setTempExamSelections}
                  />
                ) : (
                  <div className="space-y-5 max-w-xl mx-auto py-2">
                    <div className="p-5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 border-none text-white flex items-center justify-between shadow-xl shadow-indigo-500/30">
                      <div>
                        <h4 className="text-xs font-black text-slate-200">
                          Ficha Interactiva: Comprensión "El Dedo Mágico"
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Seleccione las opciones correspondientes a las respuestas del alumno.
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-black uppercase text-indigo-200 block">Puntaje</span>
                        <span className="text-lg font-black text-cyan-400">
                          {getExamScore(tempExamSelections)} / 20
                        </span>
                      </div>
                    </div>

                    {/* 1. UNE CON FLECHAS */}
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-3">
                      <h5 className="text-[11px] font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                        <span className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-black text-[10px]">1</span>
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
                            <div key={char.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 bg-slate-900/40 rounded-lg border border-slate-850">
                              <div className="sm:col-span-4 flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-250">{char.icon} {char.label}</span>
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
                                          ? 'bg-indigo-600 text-white border-indigo-550'
                                          : 'bg-transparent text-slate-400 border-slate-800 hover:bg-slate-800'
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
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-3">
                      <h5 className="text-[11px] font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                        <span className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-black text-[10px]">2</span>
                        Completa los espacios
                      </h5>
                      <div className="p-2 bg-slate-900 rounded-lg flex flex-wrap gap-2 justify-center items-center">
                        <span className="text-[9px] font-black uppercase text-amber-500">Palabras:</span>
                        {['bosque', 'rojo', 'cervatillo', 'escopeta'].map(w => (
                          <span key={w} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[9px] font-black">{w}</span>
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
                            <div key={sentence.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 bg-slate-900/40 rounded-lg border border-slate-850">
                              <div className="sm:col-span-6">
                                <p className="text-[11px] font-bold text-slate-250 leading-snug">{sentence.text}</p>
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
                                          ? 'bg-emerald-600 text-white border-emerald-500'
                                          : 'bg-transparent text-slate-400 border-slate-800 hover:bg-slate-800'
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
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-3">
                      <h5 className="text-[11px] font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                        <span className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-black text-[10px]">3</span>
                        Ordena los hechos (del 1 al 4)
                      </h5>
                      <div className="space-y-2">
                        {[
                          { id: 'evC', text: 'La señora Winter llama tonta a la narradora.' },
                          { id: 'evD', text: 'La narradora intenta convencer a Philip y William de no cazar.' },
                          { id: 'evB', text: 'Los Gregg regresaron con un cervatillo cazado.' },
                          { id: 'evA', text: 'La narradora apunta con el Dedo Mágico a la familia Gregg.' }
                        ].map(event => {
                          const selectedVal = tempExamSelections.q3?.[event.id];
                          return (
                            <div key={event.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 bg-slate-900/40 rounded-lg border border-slate-850">
                              <div className="sm:col-span-8">
                                <p className="text-[11px] font-bold text-slate-250 leading-relaxed">{event.text}</p>
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
                                      className={`h-7 w-7 rounded-full border text-[10px] font-black flex items-center justify-center transition-all ${
                                        isSelected
                                          ? 'bg-indigo-600 text-white border-indigo-500'
                                          : 'bg-transparent text-slate-500 border-slate-850 hover:bg-slate-850 hover:text-slate-300'
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

                    {/* 4. LE GUSTA / NO LE GUSTA */}
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-3">
                      <h5 className="text-[11px] font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                        <span className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-black text-[10px]">4</span>
                        Completa la tabla (Le gusta / No le gusta)
                      </h5>
                      <div className="space-y-2">
                        {[
                          { id: 'cazar', text: 'Cazar animales silvestres.' },
                          { id: 'proteger', text: 'Proteger a los animales silvestres.' },
                          { id: 'burlarse', text: 'Burlarse de la narradora.' },
                          { id: 'convencer', text: 'Convencer a sus amigos de no cazar.' }
                        ].map(action => {
                          const selectedOption = tempExamSelections.q4?.[action.id];
                          return (
                            <div key={action.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 bg-slate-900/40 rounded-lg border border-slate-850">
                              <div className="sm:col-span-6">
                                <p className="text-[11px] font-bold text-slate-250 leading-snug">{action.text}</p>
                              </div>
                              <div className="sm:col-span-6 grid grid-cols-2 gap-2">
                                {[
                                  { value: 'le_gusta', label: 'Le gusta', color: 'bg-emerald-600 border-emerald-500' },
                                  { value: 'no_le_gusta', label: 'No le gusta', color: 'bg-rose-650 border-rose-500' }
                                ].map(opt => {
                                  const isSelected = selectedOption === opt.value;
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
                                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-black transition-all ${
                                        isSelected
                                          ? `${opt.color} text-white`
                                          : 'bg-transparent text-slate-400 border-slate-800 hover:bg-slate-800'
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

                    {/* 5. MULTIPLE CHOICE */}
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-3">
                      <h5 className="text-[11px] font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                        <span className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-black text-[10px]">5</span>
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
                                  ? 'bg-indigo-600 text-white border-indigo-550 border-2 font-black'
                                  : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:bg-slate-800'
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
                )}
              </div>
            ) : (
              // Dynamic Questionnaire Editor / Grader
              <div className="space-y-5">
                {(instrument.items || []).map((item, index) => {
                  const calculatedScore = calculateItemScore(item, tempExamSelections);
                  const isOverride = itemScores[item.id] !== undefined && itemScores[item.id] !== null && itemScores[item.id] !== '';
                  const displayedScore = isOverride ? itemScores[item.id] : calculatedScore;
                  const cardStyle = getItemCardStyles(item, tempExamSelections, index);

                  return (
                    <div key={item.id} className={`p-4 ${cardStyle.bg} border-2 ${cardStyle.border} rounded-lg space-y-4 shadow-lg transition-all duration-300`}>
                      
                      {/* Card Header */}
                      <div className="flex justify-between items-start border-b border-slate-200/60 dark:border-slate-800 pb-2.5 gap-2">
                        <div className="space-y-1">
                          <h5 className={`text-[11.5px] font-black uppercase tracking-wider flex items-center gap-2 ${cardStyle.text}`}>
                            <span className={`h-5 w-5 rounded-full bg-gradient-to-br ${cardStyle.gradient} text-white flex items-center justify-center font-black text-[10px]`}>
                              {index + 1}
                            </span>
                            {item.text}
                          </h5>
                          <span className={`text-[9.5px] font-black px-2 py-0.5 rounded border uppercase tracking-widest inline-block ${cardStyle.badgeBg}`}>
                            Tipo: {item.type}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold text-slate-500 block uppercase">Peso / Valor</span>
                          <span className="text-sm font-black text-amber-500">{parseFloat(displayedScore || 0).toFixed(1)}% / {parseFloat(item.maxScore || 0).toFixed(1)}%</span>
                        </div>
                      </div>

                      {/* 1. DIRECTA QUESTION */}
                      {item.type === 'direct' && (
                        <div className="grid grid-cols-2 gap-3 max-w-sm">
                          <button
                            type="button"
                            onClick={() => handleSelectionChange(item.id, tempExamSelections[item.id] === true ? null : true)}
                            className={`py-2 px-3 rounded-lg border-2 flex items-center justify-center gap-2 transition font-black text-xs ${
                              tempExamSelections[item.id] === true
                                ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg'
                                : 'bg-white text-emerald-600 border-slate-200 hover:bg-emerald-50/50'
                            }`}
                          >
                            ✓ Correcto (+{item.maxScore}%)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectionChange(item.id, tempExamSelections[item.id] === false ? null : false)}
                            className={`py-2 px-3 rounded-lg border-2 flex items-center justify-center gap-2 transition font-black text-xs ${
                              tempExamSelections[item.id] === false
                                ? 'bg-rose-500 border-rose-600 text-white shadow-lg'
                                : 'bg-white text-rose-600 border-slate-200 hover:bg-rose-50/50'
                            }`}
                          >
                            ✗ Incorrecto (+0%)
                          </button>
                        </div>
                      )}

                      {/* 2. CHOICE OPTIONS */}
                      {item.type === 'choice' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                          {(item.options || []).map(opt => {
                            const isSelected = tempExamSelections[item.id] === opt.id;
                            const isConfigCorrect = item.correctValue === opt.id;
                            
                            let btnStyles = isConfigCorrect 
                              ? 'bg-white text-emerald-600 border-slate-250 hover:bg-emerald-50/50' 
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700';
                            
                            if (isSelected) {
                              btnStyles = isConfigCorrect 
                                ? 'bg-emerald-500 border-emerald-600 text-white font-black shadow-lg' 
                                : 'bg-rose-500 border-rose-600 text-white font-black shadow-lg';
                            }

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleSelectionChange(item.id, isSelected ? null : opt.id)}
                                className={`p-2.5 rounded-lg border-2 text-left flex justify-between items-center transition active:scale-95 ${btnStyles}`}
                              >
                                <span>{opt.label}</span>
                                {isConfigCorrect && (
                                  <span className="text-[8px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Clave</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* 3. MATCHING PAIRS */}
                      {item.type === 'matching' && (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-200 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                          {(item.subQuestions || []).map((subQ, sIdx) => {
                            const qSelections = tempExamSelections[item.id] || {};
                            const subQSelectedVal = qSelections[subQ.id];
                            const subQPts = (item.maxScore / item.subQuestions.length).toFixed(1);

                            return (
                              <div key={subQ.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition">
                                <div className="md:col-span-4 flex items-center gap-2">
                                  <span className="h-4.5 w-4.5 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 flex items-center justify-center font-bold text-[9px]">
                                    {sIdx + 1}
                                  </span>
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{subQ.text}</span>
                                </div>
                                <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-1.5 w-full">
                                  {(item.options || []).map(opt => {
                                    const isSelected = subQSelectedVal === opt.id;
                                    const isCorrect = subQ.correctValue === opt.label || subQ.correctValue === opt.id;
                                    
                                    let btnStyles = 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700';
                                    if (isSelected) {
                                      btnStyles = isCorrect 
                                        ? 'bg-emerald-500 border-emerald-600 text-white font-black shadow-md' 
                                        : 'bg-rose-500 border-rose-600 text-white font-black shadow-md';
                                    }

                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                          const prevSel = { ...(tempExamSelections[item.id] || {}) };
                                          prevSel[subQ.id] = isSelected ? null : opt.id;
                                          handleSelectionChange(item.id, prevSel);
                                        }}
                                        className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-black transition truncate ${btnStyles}`}
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

                      {/* 4. OPEN QUESTION (ABC RANGE) */}
                      {item.type === 'abc' && (
                        <div className="space-y-3">
                          {item.suggestedAnswer && (
                            <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-650 dark:text-slate-350 flex items-start gap-2.5 max-w-xl">
                              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded shrink-0 font-black uppercase tracking-wider">Clave / Guía:</span>
                              <span className="font-semibold leading-relaxed">{item.suggestedAnswer}</span>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <span className="block text-[9.5px] font-bold text-slate-500 uppercase">Calificación de Rango:</span>
                            <div className="grid grid-cols-3 gap-3 max-w-xl">
                              {[
                                { val: 'Bien', label: 'Bien', pts: item.maxScore, key: 'Bien', selectedColor: 'bg-emerald-500 border-emerald-600 text-white shadow-lg', defaultColor: 'bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50/50' },
                                { val: 'Medio', label: 'Más o menos', pts: item.maxScore / 2, key: 'Medio', selectedColor: 'bg-amber-500 border-amber-600 text-white shadow-lg', defaultColor: 'bg-white border-slate-200 text-amber-600 hover:bg-amber-50/50' },
                                { val: 'Mal', label: 'Mal', pts: 0, key: 'Mal', selectedColor: 'bg-rose-500 border-rose-600 text-white shadow-lg', defaultColor: 'bg-white border-slate-200 text-rose-600 hover:bg-rose-50/50' }
                              ].map(opt => {
                                const isSelected = tempExamSelections[item.id + '_abc_grade'] === opt.key;
                                return (
                                  <button
                                    key={opt.val}
                                    type="button"
                                    onClick={() => handleSelectionChange(item.id + '_abc_grade', isSelected ? null : opt.key)}
                                    className={`py-2 px-2 rounded-lg border-2 flex flex-col items-center justify-center transition font-black text-xs ${
                                      isSelected ? opt.selectedColor : opt.defaultColor
                                    }`}
                                  >
                                    <span>{opt.label}</span>
                                    <span className="text-[9px] font-normal opacity-85 mt-0.5">(+{parseFloat(opt.pts || 0).toFixed(1)}%)</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 5. NUMERIC DIRECT */}
                      {item.type === 'numeric' && (
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/35 p-3 rounded-lg border border-slate-200 dark:border-slate-800 max-w-lg">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Valor obtenido:</span>
                          <input 
                            type="number" 
                            min="0"
                            max={item.maxScore}
                            step="0.1"
                            value={tempExamSelections[item.id] !== undefined && tempExamSelections[item.id] !== null ? tempExamSelections[item.id] : ''}
                            onChange={e => handleSelectionChange(item.id, e.target.value === '' ? null : Number(e.target.value))}
                            className="w-20 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-center font-bold text-amber-600 dark:text-amber-400 text-sm focus:border-indigo-500 outline-none"
                            placeholder="Ej: 15"
                          />
                          <span className="text-xs text-slate-500">/ {item.maxScore}%</span>
                        </div>
                      )}

                      {/* 6. SUBQUESTIONS CONTAINER */}
                      {item.type === 'subquestions' && (
                        <div className="space-y-3.5 pt-1 pl-1.5 border-l-2 border-slate-200 dark:border-slate-800">
                          {(item.subQuestions || []).map((subQ, sIdx) => {
                            const subQSelectedVal = (tempExamSelections[item.id] || {})[subQ.id];
                            const subQPts = item.maxScore / item.subQuestions.length;
                            const subQCardStyle = getSubQCardStyles(item.id, subQ, tempExamSelections);

                            return (
                              <div key={subQ.id} className={`p-3 rounded-lg border-2 space-y-2 transition-all duration-300 ${subQCardStyle.cardBg}`}>
                                <div className="flex justify-between items-start border-b border-slate-200/50 dark:border-slate-800 pb-1.5">
                                  <h6 className={`text-[10.5px] font-black flex items-center gap-1.5 ${subQCardStyle.titleText}`}>
                                    <span className={`h-4.5 w-4.5 rounded-md text-white flex items-center justify-center font-bold text-[9.5px] ${subQCardStyle.numBg}`}>
                                      {index + 1}.{sIdx + 1}
                                    </span>
                                    {subQ.text}
                                  </h6>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${subQCardStyle.badgeBg}`}>
                                    Peso: {parseFloat(subQPts.toFixed(1))}%
                                  </span>
                                </div>

                                {/* Sub Direct */}
                                {subQ.type === 'direct' && (
                                  <div className="grid grid-cols-2 gap-2.5 max-w-sm">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const prev = { ...(tempExamSelections[item.id] || {}) };
                                        prev[subQ.id] = subQSelectedVal === true ? null : true;
                                        handleSelectionChange(item.id, prev);
                                      }}
                                      className={`py-1.5 px-3 rounded-lg border-2 text-[10.5px] font-black transition ${
                                        subQSelectedVal === true
                                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-md'
                                          : 'bg-white text-emerald-600 border-slate-200 hover:bg-emerald-50/50'
                                      }`}
                                    >
                                      ✓ Correcto
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const prev = { ...(tempExamSelections[item.id] || {}) };
                                        prev[subQ.id] = subQSelectedVal === false ? null : false;
                                        handleSelectionChange(item.id, prev);
                                      }}
                                      className={`py-1.5 px-3 rounded-lg border-2 text-[10.5px] font-black transition ${
                                        subQSelectedVal === false
                                          ? 'bg-rose-500 border-rose-600 text-white shadow-md'
                                          : 'bg-white text-rose-600 border-slate-200 hover:bg-rose-50/50'
                                      }`}
                                    >
                                      ✗ Incorrecto
                                    </button>
                                  </div>
                                )}

                                {/* Sub Choice */}
                                {subQ.type === 'choice' && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {(subQ.options || []).map(sopt => {
                                      const isSelected = subQSelectedVal === sopt.id;
                                      const isCorrect = subQ.correctValue === sopt.id;

                                      let btnStyles = isCorrect 
                                        ? 'bg-white text-emerald-650 border-slate-250 hover:bg-emerald-50/40' 
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100';
                                      
                                      if (isSelected) {
                                        btnStyles = isCorrect 
                                          ? 'bg-emerald-500 border-emerald-600 text-white font-black shadow-lg' 
                                          : 'bg-rose-500 border-rose-600 text-white font-black shadow-lg';
                                      }

                                      return (
                                        <button
                                          key={sopt.id}
                                          type="button"
                                          onClick={() => {
                                            const prev = { ...(tempExamSelections[item.id] || {}) };
                                            prev[subQ.id] = isSelected ? null : sopt.id;
                                            handleSelectionChange(item.id, prev);
                                          }}
                                          className={`p-2 rounded-lg border-2 text-left text-[10px] font-bold flex justify-between items-center transition ${btnStyles}`}
                                        >
                                          <span>{sopt.label}</span>
                                          {isCorrect && (
                                            <span className="text-[7.5px] bg-emerald-500/20 text-emerald-600 px-1 py-0.5 rounded font-black tracking-widest uppercase">Clave</span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Sub Abc */}
                                {subQ.type === 'abc' && (
                                  <div className="space-y-2.5">
                                    {subQ.suggestedAnswer && (
                                      <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-250 dark:border-slate-850/80 text-[10px] text-slate-600 dark:text-slate-350 flex items-start gap-1.5">
                                        <span className="text-[9px] bg-indigo-55 text-indigo-600 px-1.5 py-0.5 rounded shrink-0 font-bold uppercase tracking-wide">Clave:</span>
                                        <span className="font-medium leading-relaxed">{subQ.suggestedAnswer}</span>
                                      </div>
                                    )}
                                    <div className="grid grid-cols-3 gap-2 max-w-md">
                                      {[
                                        { key: 'Bien', label: 'Bien', pts: subQPts, selectedColor: 'bg-emerald-500 border-emerald-600 text-white shadow', defaultColor: 'bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50/50' },
                                        { key: 'Medio', label: 'Más o menos', pts: subQPts / 2, selectedColor: 'bg-amber-500 border-amber-600 text-white shadow', defaultColor: 'bg-white border-slate-200 text-amber-600 hover:bg-amber-50/50' },
                                        { key: 'Mal', label: 'Mal', pts: 0, selectedColor: 'bg-rose-500 border-rose-600 text-white shadow', defaultColor: 'bg-white border-slate-200 text-rose-600 hover:bg-rose-50/50' }
                                      ].map(opt => {
                                        const isSelected = (tempExamSelections[item.id] || {})[subQ.id + '_abc_grade'] === opt.key;
                                        return (
                                          <button
                                            key={opt.key}
                                            type="button"
                                            onClick={() => {
                                              const prev = { ...(tempExamSelections[item.id] || {}) };
                                              prev[subQ.id + '_abc_grade'] = isSelected ? null : opt.key;
                                              handleSelectionChange(item.id, prev);
                                            }}
                                            className={`py-1 px-1.5 rounded-lg border-2 text-[10px] font-black flex flex-col items-center justify-center transition ${
                                              isSelected ? opt.selectedColor : opt.defaultColor
                                            }`}
                                          >
                                            <span>{opt.label}</span>
                                            <span className="text-[8px] font-normal opacity-85 mt-0.5">(+{opt.pts.toFixed(1)}%)</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Sub Numeric */}
                                {subQ.type === 'numeric' && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-500">Puntaje:</span>
                                    <input 
                                      type="number" 
                                      min="0"
                                      max={subQPts}
                                      step="0.1"
                                      value={subQSelectedVal !== undefined && subQSelectedVal !== null ? subQSelectedVal : ''}
                                      onChange={e => {
                                        const prev = { ...(tempExamSelections[item.id] || {}) };
                                        prev[subQ.id] = e.target.value === '' ? null : Number(e.target.value);
                                        handleSelectionChange(item.id, prev);
                                      }}
                                      className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-2 py-0.5 text-center text-xs text-amber-600 dark:text-amber-400 font-bold outline-none focus:border-indigo-500"
                                      placeholder="Puntos..."
                                    />
                                    <span className="text-[10px] text-slate-550">/ {parseFloat(subQPts.toFixed(1))}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Manual Score Input (Override) */}
                      <div className="mt-3 bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-200 dark:border-slate-850 flex items-center justify-between text-xs gap-3">
                        <span className="text-slate-600 dark:text-slate-450 font-bold flex items-center gap-1">
                          <HelpCircle className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                          ¿Deseas sobreescribir el puntaje de esta pregunta manualmente?
                        </span>
                        <div className="flex items-center gap-2">
                          {isOverride && (
                            <button
                              type="button"
                              onClick={() => {
                                const prev = { ...itemScores };
                                delete prev[item.id];
                                setItemScores(prev);
                              }}
                              className="text-[9px] font-black text-rose-600 hover:underline uppercase tracking-wider bg-rose-50 px-2 py-1 rounded border border-rose-100"
                            >
                              Limpiar Manual
                            </button>
                          )}
                          <input 
                            type="number"
                            min="0"
                            max={item.maxScore}
                            step="0.1"
                            value={itemScores[item.id] !== undefined ? itemScores[item.id] : ''}
                            onChange={e => handleScoreChange(item.id, e.target.value)}
                            placeholder={calculatedScore}
                            className="w-16 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-750 rounded px-2 py-1 text-center font-bold text-indigo-650 dark:text-indigo-300 focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-900 flex flex-col sm:flex-row justify-between items-center bg-slate-50 dark:bg-[#0B1021]/85 gap-4">
            <div className="flex items-center gap-4 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 px-4 py-2.5 rounded-lg shadow-sm">
              <div className={`flex items-center justify-center w-14 h-14 rounded-lg border-2 font-sans font-black text-3xl shadow-sm ${getGradeStyle(finalLiteralScore).bgClass} ${getGradeStyle(finalLiteralScore).textClass}`}>
                {finalLiteralScore}
              </div>
              <div className="text-left">
                <span className="block text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest leading-none mb-1.5">Nota Resultante</span>
                <span className="text-[10.5px] text-slate-700 dark:text-slate-350 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-850 font-bold">
                  {(ratio * 100).toFixed(0)}% (Equiv: {numericEquivalent.toFixed(1)} / {maxGradeScale === 'AD' ? '4.0' : '3.0'})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button 
                type="button" 
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-900 font-bold text-xs transition active:scale-95 whitespace-nowrap"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleClear}
                className="px-5 py-2.5 rounded-lg bg-slate-900 border border-slate-850 text-slate-300 hover:bg-slate-800 font-bold text-xs transition active:scale-95 whitespace-nowrap"
              >
                Limpiar
              </button>
              <button 
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-[#5b61f9] hover:bg-[#4d52e5] text-white font-extrabold text-xs transition shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
              >
                <Save className="h-4 w-4" /> Guardar Nota
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
