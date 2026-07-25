import React, { useState, useContext, useEffect } from 'react';
import { Save, Download } from 'lucide-react';
import { DatabaseContext } from '../context/DatabaseContext';
import { createCnebMatrixCalculator } from '../utils/cnebAggregation';

const CONCLUSIONS_FOR_C = {
  'se comunica oralmente en su lengua materna': 'Se comunica oralmente en situaciones cercanas; recupera información explícita y expresa algunas ideas. Requiere apoyo para organizar y ampliar sus intervenciones, inferir información, emplear recursos verbales y no verbales pertinentes, e interactuar y sustentar opiniones según el propósito y el contexto.',
  'lee diversos tipos de textos escritos en su lengua materna': 'Lee textos de diversa tipología e identifica información explícita. Requiere apoyo para inferir relaciones e intenciones, integrar información relevante, elaborar conclusiones y evaluar críticamente el contenido, la forma y el contexto del texto a partir de evidencias.',
  'escribe diversos tipos de textos en su lengua materna': 'Escribe textos breves considerando parcialmente el propósito y destinatario. Requiere apoyo para organizar y desarrollar ideas con coherencia, usar conectores, vocabulario y convenciones ortográficas pertinentes, así como revisar su texto para mejorar su adecuación, cohesión y sentido.'
};

const normalizeCompetenceName = (name = '') => name
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const getAutomaticConclusion = (competenceName) => {
  const normalizedName = normalizeCompetenceName(competenceName);
  const matches = (...terms) => terms.every(term => normalizedName.includes(term));

  // Los nombres creados por cada institución pueden llevar el área, códigos o
  // signos adicionales. Se reconoce la competencia por sus palabras clave,
  // sin aplicar el texto a competencias distintas.
  if (matches('comunica oralmente', 'lengua materna')) {
    return CONCLUSIONS_FOR_C['se comunica oralmente en su lengua materna'];
  }
  if (matches('lee diversos tipos', 'textos', 'lengua materna')) {
    return CONCLUSIONS_FOR_C['lee diversos tipos de textos escritos en su lengua materna'];
  }
  if (matches('escribe diversos tipos', 'textos', 'lengua materna')) {
    return CONCLUSIONS_FOR_C['escribe diversos tipos de textos en su lengua materna'];
  }

  const matchingKey = Object.keys(CONCLUSIONS_FOR_C).find(key =>
    normalizedName === key || normalizedName.startsWith(key) || key.startsWith(normalizedName)
  );
  return matchingKey ? CONCLUSIONS_FOR_C[matchingKey] : '';
};

export default function GradebookConclusions({ 
  structure, 
  officialCrudEvals,
  studentGrades, 
  enrolledStudents,
  courseId,
  selectedPeriod,
  selectedUnit
}) {
  const { conclusions, saveConclusion } = useContext(DatabaseContext);
  const [localConclusions, setLocalConclusions] = useState({});

  const unitIds = [...new Set((officialCrudEvals || [])
    .map(evaluation => evaluation.unit)
    .filter(unit => unit !== undefined && unit !== null)
    .map(String))]
    .sort((left, right) => Number(left) - Number(right));

  const convertToLetter = (numericScore, unit = selectedUnit) => {
    if (numericScore === null || numericScore === undefined) return '-';
    if (String(unit) === '2') return numericScore >= 3 ? 'A' : numericScore === 2 ? 'B' : 'C';
    if (numericScore >= 18) return 'AD';
    if (numericScore >= 14) return 'A';
    if (numericScore >= 11) return 'B';
    return 'C';
  };

  const calculateUnitGrade = (studentId, competency, unit) => {
    const unitEvaluations = officialCrudEvals.filter(evaluation => String(evaluation.unit) === String(unit));
    const matrix = createCnebMatrixCalculator({
      evaluations: unitEvaluations,
      grades: studentGrades,
      studentId,
      unit,
      structure
    });
    return convertToLetter(matrix.getCompetencyGrade(competency), unit);
  };

  const calculateUnitsAverage = (unitGrades) => {
    const values = unitGrades.map(({ grade }) => ({ AD: 4, A: 3, B: 2, C: 1 }[grade])).filter(Boolean);
    if (!values.length) return '-';
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    if (unitGrades.length === 1 && String(unitGrades[0].unit) === '2') {
      const rounded = Math.round(average);
      return rounded >= 3 ? 'A' : rounded === 2 ? 'B' : 'C';
    }
    if (average >= 3.5) return 'AD';
    if (average >= 2.5) return 'A';
    if (average >= 1.5) return 'B';
    return 'C';
  };

  const getGradeStyle = (score) => {
    if (!score || score === '-') {
      return {
        bgClass: 'bg-transparent',
        textClass: 'text-slate-400 dark:text-slate-500'
      };
    }
    const val = String(score).toUpperCase();
    if (val === 'AD') {
      return {
        bgClass: 'cell-grade-ad',
        textClass: 'text-blue-600 dark:text-blue-400 font-bold'
      };
    }
    if (val === 'A') {
      return {
        bgClass: 'cell-grade-a',
        textClass: 'text-emerald-600 dark:text-emerald-400 font-bold'
      };
    }
    if (val === 'B') {
      return {
        bgClass: 'cell-grade-b',
        textClass: 'text-amber-600 dark:text-amber-400 font-bold'
      };
    }
    if (val === 'C') {
      return {
        bgClass: 'cell-grade-c',
        textClass: 'text-rose-600 dark:text-rose-400 font-bold'
      };
    }
    return {
      bgClass: 'bg-transparent',
      textClass: 'text-slate-600 dark:text-slate-400 font-bold'
    };
  };

  const getSavedConclusion = (studentId, compId) => {
    const existing = conclusions?.find(
      c => c.studentId === studentId && c.courseId === courseId && c.competencyId === compId && c.period === selectedPeriod
    );
    return existing ? existing.text : '';
  };

  const handleConclusionChange = (studentId, compId, value) => {
    setLocalConclusions(prev => ({
      ...prev,
      [`${studentId}_${compId}`]: value
    }));
  };

  const handleSaveConclusion = async (studentId, compId) => {
    const val = localConclusions[`${studentId}_${compId}`];
    if (val !== undefined) {
      await saveConclusion(studentId, courseId, compId, selectedPeriod, val);
      alert('Conclusión guardada correctamente');
    }
  };

  const automaticConclusionRows = enrolledStudents.flatMap(student => structure.flatMap(comp => {
    const unitGrades = unitIds.map(unit => ({ unit, grade: calculateUnitGrade(student.id, comp, unit) }))
      .filter(({ grade }) => grade !== '-');
    const finalGrade = calculateUnitsAverage(unitGrades);
    const conclusion = finalGrade === 'C' ? getAutomaticConclusion(comp.name) : '';
    return conclusion ? [{ student, comp, finalGrade, conclusion }] : [];
  }));

  // Se guardan solo los textos que aún no existen; así se preserva una
  // conclusión que haya sido personalizada por el docente.
  useEffect(() => {
    automaticConclusionRows.forEach(({ student, comp, conclusion }) => {
      if (!getSavedConclusion(student.id, comp.id)?.trim()) {
        saveConclusion(student.id, courseId, comp.id, selectedPeriod, conclusion);
      }
    });
  }, [conclusions, courseId, selectedPeriod, studentGrades, officialCrudEvals, enrolledStudents, structure]);

  const handleExportAutomaticConclusions = async () => {
    if (!automaticConclusionRows.length) {
      alert('No hay conclusiones descriptivas de nivel C para exportar.');
      return;
    }

    try {
      const response = await fetch('/api/excel/export-descriptive-conclusions-siagie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: structure?.[0]?.courseName || 'Comunicación',
          gradeLevel: enrolledStudents?.[0]?.gradeLevel || '',
          section: enrolledStudents?.[0]?.section || '',
          bimester: selectedPeriod,
          unit: selectedUnit,
          conclusions: automaticConclusionRows.map(({ student, comp, finalGrade, conclusion }) => ({
            dni: student.dni || '',
            studentName: student.name || '',
            gradeLevel: student.gradeLevel || '',
            section: student.section || '',
            competence: comp.name,
            finalGrade,
            conclusion
          }))
        })
      });
      if (!response.ok) throw new Error('No se pudo generar el archivo.');
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Conclusiones_Descriptivas_SIAGIE_${selectedPeriod.replace(/\s+/g, '_')}.xlsx`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
    } catch (error) {
      console.error(error);
      alert('No se pudo descargar el Excel de conclusiones.');
    }
  };

  return (
    <div className="space-y-3 mt-6">
      <div className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-amber-800 dark:bg-amber-950/20">
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Las conclusiones de Comunicación se agregan automáticamente para calificativo C.</p>
        <button onClick={handleExportAutomaticConclusions} className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-amber-400">
          <Download className="h-3.5 w-3.5" /> Descargar Excel SIAGIE
        </button>
      </div>
    <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-750 relative bg-white dark:bg-[#0B1021]">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr>
            <th className="p-3 w-56 min-w-[224px] max-w-[224px] bg-slate-100 dark:bg-slate-950 border-b border-r border-slate-300 dark:border-slate-750 text-slate-700 dark:text-slate-350 font-extrabold sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)] text-[11px] uppercase tracking-wide">Alumno</th>
            {structure.map(comp => (
              <th key={comp.id} className="p-3 bg-indigo-500/10 border-b border-r border-slate-300 dark:border-slate-750 text-center w-64">
                <div className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest truncate" title={comp.name}>{comp.name}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {enrolledStudents.map(student => {
            return (
              <tr key={student.id} className="border-b border-slate-300 dark:border-slate-750/80 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                <td className="p-3 border-r border-slate-300 dark:border-slate-750 sticky left-0 z-10 bg-white dark:bg-slate-900 align-top shadow-[2px_0_5px_rgba(0,0,0,0.02)] w-56 min-w-[224px] max-w-[224px]">
                  <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 pt-2 truncate" title={student.name}>{student.name}</div>
                </td>
                
                {structure.map(comp => {
                  const unitGrades = unitIds.map(unit => ({ unit, grade: calculateUnitGrade(student.id, comp, unit) }))
                    .filter(({ grade }) => grade !== '-');
                  const letterGrade = calculateUnitsAverage(unitGrades);
                  const needsConclusion = letterGrade === 'C';
                  
                  const savedText = getSavedConclusion(student.id, comp.id);
                  const automaticText = needsConclusion ? getAutomaticConclusion(comp.name) : '';
                  const currentText = localConclusions[`${student.id}_${comp.id}`] !== undefined 
                                        ? localConclusions[`${student.id}_${comp.id}`] 
                                        : (savedText || automaticText);
                  const style = getGradeStyle(letterGrade);

                  return (
                    <td key={comp.id} className="p-3.5 border-b border-r border-slate-300 dark:border-slate-750 bg-slate-50/20 dark:bg-slate-950 align-top">
                      <div className="flex flex-col gap-3">
                        <div className={`flex justify-between items-center p-2 rounded-xl border-2 shadow-sm ${style.bgClass}`}>
                          <span className="text-[10px] font-black text-slate-650 dark:text-slate-400 uppercase ml-1">Promedio unidades</span>
                          <span className={`text-2xl font-black font-sans leading-none mr-1 ${style.textClass}`}>
                            {letterGrade}
                          </span>
                        </div>
                        {unitGrades.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {unitGrades.map(({ unit, grade }) => (
                              <span key={unit} className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[9px] font-black text-slate-600 dark:text-slate-300">
                                U{unit}: {grade}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {needsConclusion && (
                          <div className="flex flex-col gap-2 mt-1">
                            <label className="text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">Conclusión Descriptiva Requerida</label>
                            <textarea
                              className="w-full h-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-700 dark:text-slate-300 focus:border-[#005ac2] dark:focus:border-amber-500 outline-none resize-none shadow-sm"
                              placeholder="Redacta la conclusión descriptiva explicando por qué el alumno no logró la competencia..."
                              value={currentText}
                              onChange={e => handleConclusionChange(student.id, comp.id, e.target.value)}
                            />
                            {currentText !== savedText && (
                              <button
                                onClick={() => handleSaveConclusion(student.id, comp.id)}
                                className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-2 rounded-xl text-xs font-black transition w-full shadow-sm active:scale-95"
                              >
                                <Save className="h-3.5 w-3.5" /> Guardar Conclusión
                              </button>
                            )}
                          </div>
                        )}
                        
                        {!needsConclusion && letterGrade !== '-' && (
                          <div className="text-[10px] text-slate-500 italic mt-1 text-center font-medium">
                            No requiere conclusión obligatoria.
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {enrolledStudents.length === 0 && (
            <tr>
              <td colSpan={100} className="p-8 text-center text-slate-500">
                No hay estudiantes matriculados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </div>
  );
}
