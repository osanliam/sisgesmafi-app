import React, { useState, useContext, useRef } from 'react';
import { FileEdit, CheckCircle, Settings, Download, Upload, Trash2, Copy, ClipboardList, MoreVertical } from 'lucide-react';
import axios from 'axios';
import InstrumentGraderModal from './InstrumentGraderModal';
import InstrumentBuilderModal from './InstrumentBuilderModal';
import { DatabaseContext } from '../context/DatabaseContext';
import { ratioToLiteralGrade } from '../utils/evaluationAccess';

export default function GradebookClassic({ 
  course,
  structure, 
  allCourseEvals,
  formativeEvals, 
  studentGrades, 
  enrolledStudents, 
  handleGradeChange,
  selectedCompetenceId,
  selectedSection,
  selectedUnit
}) {
  const { 
    deleteEvaluation, 
    deleteFormativeEvaluation,
    saveGradesBatch, 
    saveEvaluation,
    grades,
    saveGrade,
    missingGradesAsC,
    saveMissingGradesAsC
  } = useContext(DatabaseContext);

  const [activeGradingSession, setActiveGradingSession] = useState(null);
  const [editingEvaluation, setEditingEvaluation] = useState(null);

  const fileInputRef = useRef(null);
  const [importingEvalId, setImportingEvalId] = useState(null);

  const handleOpenGrader = (student, evalItem) => {
    const existingGrade = (studentGrades || []).find(g => g.studentId === student.id && g.evaluationId === evalItem.id);
    setActiveGradingSession({ student, evalItem, existingGrade });
  };

  const handleSaveGrades = (payload) => {
    const { evalItem, student } = activeGradingSession;
    handleGradeChange(student.id, evalItem.id, payload);

    // If this instrument has been migrated, also update the CNEB clone so the
    // GradingPortal stays in sync with what the teacher edited here.
    if (evalItem.isMigratedToCNEB && selectedSection) {
      const cloneId = `${evalItem.id}_${selectedSection.toLowerCase()}`;
      const score = payload?.score;
      if (score !== undefined && score !== null && score !== '') {
        // Convert numeric score to letter if needed
        let letterScore = score;
        if (!['AD','A','B','C','-'].includes(String(score))) {
          const num = parseFloat(score) || 0;
          const ratio = num / 20;
          letterScore = ratioToLiteralGrade(ratio, {
            unit: evalItem.unit ?? selectedUnit,
            maxGradeScale: evalItem.maxGradeScale || 'AD'
          });
        }
        saveGrade({
          studentId: student.id,
          evaluationId: cloneId,
          score: letterScore,
          details: payload?.details || {}
        });
      }
    }

    setActiveGradingSession(null);
  };

  const formatScore = (score, evaluation) => {
    if (score === undefined || score === null) return '-';
    if (String(evaluation?.unit ?? selectedUnit) === '2' && !['A', 'B', 'C', '-'].includes(String(score).toUpperCase())) {
      return ratioToLiteralGrade((parseFloat(score) || 0) / 20, { unit: '2', maxGradeScale: 'A' });
    }
    return score;
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

  const calculateConsolidated = (studentId) => {
    let sum = 0;
    let count = 0;
    let isCNEB = false;
    const isUnit2 = String(selectedUnit) === '2';
    const evaluationIds = new Set(allCourseEvals.map(ev => ev.id));
    const hasStoredLiteralScores = (studentGrades || []).some(grade =>
      evaluationIds.has(grade.evaluationId) && ['AD', 'A', 'B', 'C'].includes(String(grade.score || '').trim().toUpperCase())
    );
    const usesLiteralScale = isUnit2 || String(selectedUnit) === '3' || hasStoredLiteralScores || allCourseEvals.some(ev =>
      ev.gradingScale === 'literal' || ev.maxGradeScale === 'A' || ev.maxGradeScale === 'AD'
    );

    allCourseEvals.forEach(ev => {
      const grade = (studentGrades || []).find(g => g.studentId === studentId && g.evaluationId === ev.id);
      if (grade && grade.score !== undefined && grade.score !== null && grade.score !== '' && grade.score !== '-') {
        const val = grade.score;
        if (isUnit2) {
          const literal = formatScore(val, ev);
          const equivalent = literal === 'A' ? 3 : literal === 'B' ? 2 : 1;
          sum += equivalent;
          count++;
        } else if (['AD', 'A', 'B', 'C'].includes(val)) {
          isCNEB = true;
          const map = { 'AD': 4, 'A': 3, 'B': 2, 'C': 1 };
          sum += map[val];
          count++;
        } else {
          const numVal = parseFloat(val);
          if (!isNaN(numVal)) {
            sum += numVal;
            count++;
          }
        }
      } else if (missingGradesAsC && usesLiteralScale) {
        // This is calculation-only: no C is written into the empty cell.
        sum += 1;
        count++;
        isCNEB = true;
      }
    });

    if (count === 0) return '-';
    const avg = sum / count;
    if (isUnit2) {
      const rounded = Math.round(avg);
      return rounded >= 3 ? 'A' : rounded === 2 ? 'B' : 'C';
    }
    if (isCNEB || usesLiteralScale) {
      if (avg >= 3.5) return 'AD';
      if (avg >= 2.5) return 'A';
      if (avg >= 1.5) return 'B';
      return 'C';
    } else {
      return avg.toFixed(1);
    }
  };

  const handleExportEvalGrades = async (evalItem) => {
    try {
      const evalGrades = (studentGrades || []).filter(g => g.evaluationId === evalItem.id);
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

  const handleImportEvalGrades = (evalItem) => {
    setImportingEvalId(evalItem.id);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !importingEvalId) return;

    const evalItem = allCourseEvals.find(ev => ev.id === importingEvalId);
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

      const batchPayloads = [];
      parsedGrades.forEach(pg => {
        const student = enrolledStudents.find(s => s.dni === pg.dni || s.name === pg.name);
        if (!student || pg.score === '' || pg.score === '-') return;
        
        batchPayloads.push({
          studentId: student.id,
          courseId: course.id,
          competenceId: selectedCompetenceId,
          evaluationId: importingEvalId,
          instrument: evalItem.type,
          score: pg.score,
          teacherId: 'tch_1',
          bimester: '1',
          unit: '0',
          details: pg.details
        });
      });

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



  return (
    <div className="overflow-x-auto rounded-lg border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 mt-6 bg-white dark:bg-[#0B1021]">
      <div className="flex items-center justify-end gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
        <label className="flex cursor-pointer items-center gap-2 text-[10px] font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={missingGradesAsC}
            onChange={event => saveMissingGradesAsC(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
          />
          Vacías cuentan como C en el promedio
        </label>
      </div>
      {/* Hidden file input for Excel import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileSelected} 
        accept=".xlsx, .xls"
      />

      <table className="w-full border-collapse">
        <thead className="bg-white/10 text-xs font-bold uppercase text-slate-200">
          <tr>
            <th className="p-3 w-12 text-center sticky left-0 z-20 bg-[#0B1021]/95 backdrop-blur-sm shadow-[2px_0_5px_rgba(0,0,0,0.2)] text-[11px] font-black uppercase">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-2 shadow-sm text-slate-700 dark:text-slate-300">
                N°
              </div>
            </th>
            <th className="p-3 w-56 min-w-[224px] max-w-[224px] text-center sticky left-0 z-20 bg-[#0B1021]/95 backdrop-blur-sm shadow-[2px_0_5px_rgba(0,0,0,0.2)] text-[11px] font-black uppercase">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-2 shadow-sm text-slate-700 dark:text-slate-300">
                Estudiante
              </div>
            </th>
            {allCourseEvals.map(ev => (
              <th key={ev.id} className="p-1.5 text-center w-[116px] min-w-[116px] max-w-[116px] border-r border-slate-300 dark:border-slate-750">
                <div className="bg-transparent rounded-lg px-2 py-2 border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 flex flex-col items-center h-full gap-1.5 relative">
                  <span className="font-extrabold text-[10px] leading-tight text-slate-800 dark:text-white w-full min-h-[28px] overflow-hidden" title={ev.name} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {ev.name}
                  </span>
                  <span className="text-[8px] bg-slate-200/80 dark:bg-white/5 px-1.5 py-0.5 rounded font-mono text-slate-700 dark:text-cyan-200 font-extrabold uppercase border border-slate-300/40 max-w-full truncate">
                    {ev.type}
                  </span>
                  
                  {ev.isMigratedToCNEB ? (
                    <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Migrado
                      {ev._migratedSections?.length > 0 && (
                        <span className="text-[9px] text-emerald-500/80 dark:text-emerald-500/70">({ev._migratedSections.map(s => s.toUpperCase()).join(',')})</span>
                      )}
                    </span>
                  ) : ev.isFormative ? (
                    <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Formativo
                    </span>
                  ) : (
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-medium">Oficial</span>
                  )}

                  <details className="relative mt-auto [&_summary::-webkit-details-marker]:hidden">
                    <summary className="list-none cursor-pointer p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><MoreVertical className="h-4 w-4" /></summary>
                    <div className="absolute right-0 top-full z-40 mt-1 w-40 rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  {/* Acciones del instrumento */}
                  <div className="flex items-center justify-center gap-1.5 mt-2 border-t border-slate-250 dark:border-white/10 pt-2 w-full">
                    {(ev.isFormative || ev.isMigratedToCNEB) && (
                      <>
                        <button 
                          onClick={() => setEditingEvaluation(ev)}
                          title={ev.isMigratedToCNEB ? "Editar configuración del instrumento" : "Configurar"}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-full text-slate-600 dark:text-slate-350 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-300/40 shadow-sm transition active:scale-90"
                        >
                          <Settings className="h-3 w-3" />
                        </button>
                      </>
                    )}
                    
                    <button 
                      onClick={() => {
                        if (ev.isFormative) {
                          if (!window.confirm(`¿Deseas crear una copia del instrumento "${ev.name}"?`)) return;
                          const newId = `eval_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                          const copiedEval = {
                            ...ev,
                            id: newId,
                            name: `${ev.name} (Copia)`,
                            isMigratedToCNEB: false,
                            _isClonedMigration: false,
                            _migratedSections: [],
                            createdAt: new Date().toISOString()
                          };
                          saveEvaluation(copiedEval);
                        } else {
                          const unitTwo = String(selectedUnit) === '2';
                          const choice = window.prompt(
                            unitTwo
                              ? `Elige el tipo de copia para "${ev.name}":\n1 - Copia exacta (mismo tipo, oficiales)\n2 - Copiar a Formativas (con notas)`
                              : `Escribe 1 para crear una copia exacta de "${ev.name}".`,
                            '1'
                          );
                          if (!choice) return;
                          if (choice === '1') {
                            const newId = `eval_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                            saveEvaluation({
                              ...ev,
                              id: newId,
                              name: `${ev.name} (Copia)`,
                              isMigratedToCNEB: false,
                              _isClonedMigration: false,
                              _migratedSections: [],
                              createdAt: new Date().toISOString()
                            });
                          } else if (choice === '2' && unitTwo) {
                            const newId = `eval_${Date.now()}_formative_${Math.floor(Math.random() * 1000)}`;
                            const newEval = {
                              ...ev,
                              id: newId,
                              name: `${ev.name} (Formativo)`,
                              isFormative: true,
                              copiedFromEvaluationId: ev.id,
                              instrumentConfig: ev.instrumentConfig ? JSON.parse(JSON.stringify(ev.instrumentConfig)) : ev.instrumentConfig,
                              items: ev.items ? JSON.parse(JSON.stringify(ev.items)) : ev.items,
                              isMigratedToCNEB: false,
                              _isClonedMigration: false,
                              createdAt: new Date().toISOString()
                            };
                            saveEvaluation(newEval);
                            const sourceGrades = (grades || []).filter(g => g.evaluationId === ev.id);
                            if (sourceGrades.length > 0) {
                              const copiedGrades = sourceGrades.map(g => ({
                                ...g,
                                id: `grd_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
                                evaluationId: newId,
                                copiedFromGradeId: g.id,
                                copiedFromEvaluationId: ev.id,
                                details: g.details ? JSON.parse(JSON.stringify(g.details)) : g.details,
                                updatedAt: new Date().toISOString()
                              }));
                              saveGradesBatch(copiedGrades);
                            }
                          }
                        }
                      }}
                      title="Copiar Instrumento"
                      className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 rounded-full text-[#005ac2] dark:text-blue-400 border border-blue-200/30 shadow-sm transition active:scale-90"
                    >
                      <Copy className="h-3 w-3" />
                    </button>

                    <button 
                      onClick={async () => {
                        const formativeNotice = ev.isFormative
                          ? `¿Deseas eliminar únicamente el instrumento formativo "${ev.name}" y sus respuestas formativas?\n\nEl instrumento y las notas oficiales no se modificarán.`
                          : `¿Deseas eliminar la columna "${ev.name}" y todas sus calificaciones?`;
                        if (!window.confirm(formativeNotice)) return;
                        const deleted = ev.isFormative
                          ? await deleteFormativeEvaluation(ev.id)
                          : deleteEvaluation(ev.id);
                        if (!deleted) alert('No se pudo eliminar el instrumento. Inténtalo nuevamente.');
                      }}
                      title="Eliminar Columna"
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 rounded-full text-rose-600 dark:text-rose-400 border border-rose-250/30 shadow-sm transition active:scale-90"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>


                  {/* Fila 2: Exportar + Importar Excel */}
                  <div className="flex items-center justify-center gap-1.5 mt-1 pb-0.5 w-full">
                    <button 
                      onClick={() => handleExportEvalGrades(ev)}
                      title="Exportar a Excel"
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 rounded-full text-emerald-600 dark:text-emerald-400 border border-emerald-200/30 shadow-sm transition active:scale-90"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={() => handleImportEvalGrades(ev)}
                      title="Importar desde Excel"
                      className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 rounded-full text-amber-600 dark:text-amber-400 border border-amber-200/30 shadow-sm transition active:scale-90"
                    >
                      <Upload className="h-3 w-3" />
                    </button>
                  </div>
                    </div>
                  </details>
                </div>
              </th>
            ))}
            {allCourseEvals.length > 0 && (
              <th className="p-3 bg-slate-100 dark:bg-indigo-900/60 border-b-2 border-l border-slate-300 dark:border-slate-700 text-slate-800 dark:text-indigo-200 font-black w-28 min-w-[112px] max-w-[112px] sticky right-0 z-20 text-center shadow-[-4px_0_8px_rgba(0,0,0,0.04)] text-[11px] uppercase tracking-wide">
                Promedio
              </th>
            )}
            {allCourseEvals.length === 0 && (
              <th className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 text-slate-500 italic font-normal text-center">
                No hay instrumentos creados aún. Usa el botón "Crear Instrumento".
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {enrolledStudents.map((student, index) => (
            <tr key={student.id} className="border-b border-slate-300 dark:border-slate-700/80 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
              <td className="p-2.5 border-r border-slate-300 dark:border-slate-750 text-center font-mono text-xs text-slate-500 dark:text-slate-400 font-bold">
                {index + 1}
              </td>
              <td className="p-2.5 border-r border-slate-300 dark:border-slate-750 sticky left-0 z-10 bg-white dark:bg-[#0B1021] w-56 min-w-[224px] max-w-[224px]">
                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate" title={student.name}>{student.name}</div>
              </td>
              {allCourseEvals.map(ev => {
                const grade = studentGrades?.find(g => g.studentId === student.id && g.evaluationId === ev.id);
                const score = formatScore(grade?.score, ev);
                const style = getGradeStyle(score);
                return (
                  <td key={ev.id} className={`p-0 border-r border-slate-300 dark:border-slate-800 text-center relative group w-36 min-w-[144px] max-w-[144px] transition-all duration-200 ${style.bgClass}`}>
                    <button 
                      onClick={() => {
                        handleOpenGrader(student, ev);
                      }}
                      className="w-full h-full min-h-[48px] flex flex-col items-center justify-center p-2 bg-transparent border-0 focus:outline-none transition-transform active:scale-95"
                    >
                      <span className={`text-[15px] font-black font-sans leading-none ${style.textClass}`}>
                        {score}
                      </span>
                      {ev.isFormative && (
                        <span className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 text-slate-400 dark:text-slate-500 transition-opacity">
                          <FileEdit className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  </td>
                );
              })}
              {allCourseEvals.length > 0 && (() => {
                const prom = calculateConsolidated(student.id);
                const style = getGradeStyle(prom);
                return (
                  <td className={`p-0 border-l border-slate-300 dark:border-slate-800 text-center sticky right-0 z-10 shadow-[-4px_0_8px_rgba(0,0,0,0.04)] w-28 min-w-[112px] max-w-[112px] transition-all duration-200 ${style.bgClass}`}>
                    <div className="w-full h-full min-h-[48px] flex items-center justify-center p-2 bg-transparent">
                      <span className={`text-[17px] font-black font-sans leading-none ${style.textClass}`}>
                        {prom}
                      </span>
                    </div>
                  </td>
                );
              })()}
              {allCourseEvals.length === 0 && <td className="border-b border-slate-300 dark:border-slate-800"></td>}
            </tr>
          ))}
          {enrolledStudents.length === 0 && (
            <tr>
              <td colSpan={100} className="p-8 text-center text-slate-500">
                No hay estudiantes matriculados en esta sección.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {activeGradingSession && (
        <InstrumentGraderModal 
          student={activeGradingSession.student}
          instrument={activeGradingSession.evalItem}
          initialGrade={activeGradingSession.existingGrade}
          officialEvaluationId={(() => {
            const current = activeGradingSession.evalItem;
            if (!current.isFormative) return null;
            if (current.copiedFromEvaluationId) return current.copiedFromEvaluationId;
            const baseName = String(current.name || '').replace(/\s*\(Formativo\)$/i, '').trim().toLowerCase();
            return allCourseEvals.find(ev => !ev.isFormative && String(ev.name || '').trim().toLowerCase() === baseName)?.id || null;
          })()}
          studentGrades={studentGrades}
          enrolledStudents={enrolledStudents}
          onClose={() => setActiveGradingSession(null)}
          onSave={(studentId, payload) => {
            handleGradeChange(
              studentId, 
              activeGradingSession.evalItem.id, 
              payload
            );
          }}
        />
      )}

      {editingEvaluation && (
        <InstrumentBuilderModal 
          structure={structure}
          initialEvaluation={editingEvaluation}
          onClose={() => setEditingEvaluation(null)}
          onSave={async (updatedData) => {
            await saveEvaluation({
              ...editingEvaluation,
              ...updatedData
            });
            setEditingEvaluation(null);
          }}
        />
      )}
    </div>
  );
}
