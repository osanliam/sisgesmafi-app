import React, { useState } from 'react';
import { createCnebMatrixCalculator } from '../utils/cnebAggregation';

export default function GradebookCNEB({ 
  structure, 
  officialCrudEvals,
  studentGrades, 
  enrolledStudents,
  selectedUnit
}) {
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  const calculateStudentMatrix = (studentId) => createCnebMatrixCalculator({
    evaluations: officialCrudEvals,
    grades: studentGrades,
    studentId,
    unit: selectedUnit,
    structure
  });

  const convertToLetter = (numericScore) => {
    if (numericScore === null || numericScore === undefined) return '-';
    if (String(selectedUnit) === '2') return numericScore >= 3 ? 'A' : numericScore === 2 ? 'B' : 'C';
    if (numericScore >= 18) return 'AD';
    if (numericScore >= 14) return 'A';
    if (numericScore >= 11) return 'B';
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

  return (
    <div className="overflow-x-auto rounded-lg border border-kinetic-cyan/50 shadow-[0_0_8px_rgba(99,102,241,0.1)] dark:border-kinetic-cyan/50 mt-6 relative bg-white dark:bg-[#0B1021]">
      <table className="w-full text-left border-collapse min-w-[1200px]">
        <thead>
          <tr>
            <th rowSpan={3} className="p-3 w-56 min-w-[224px] max-w-[224px] bg-slate-100 dark:bg-slate-950 border-b border-r border-slate-300 dark:border-slate-750 text-slate-700 dark:text-slate-300 font-extrabold sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.04)] text-[11px] uppercase tracking-wide">Alumno</th>
            {structure.map(comp => (
              <th key={comp.id} colSpan={
                (comp.capacities || []).reduce((acc, cap) => acc + (cap.desempenos || []).length, 0) + (comp.capacities || []).length + 1
              } className="p-2.5 bg-indigo-500/10 border-b border-r border-slate-300 dark:border-slate-750 text-center">
                <div className="text-[10px] font-black text-[#005ac2] dark:text-indigo-400 uppercase tracking-widest">{comp.name}</div>
              </th>
            ))}
          </tr>
          <tr>
            {structure.map(comp => (
              <React.Fragment key={`cap_${comp.id}`}>
                {(comp.capacities || []).map(cap => (
                  <th key={cap.id} colSpan={(cap.desempenos || []).length + 1} className="p-2.5 bg-emerald-500/10 border-b border-r border-slate-300 dark:border-slate-750 text-center">
                    <div className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-450 truncate max-w-[200px] mx-auto uppercase" title={cap.name}>{cap.name}</div>
                  </th>
                ))}
                <th rowSpan={2} className="p-2 bg-indigo-500/20 border-b border-r border-slate-300 dark:border-slate-750 text-center w-16">
                  <div className="text-[9px] font-black text-indigo-700 dark:text-indigo-300 transform -rotate-90 origin-center whitespace-nowrap h-24 flex items-center justify-center translate-y-8 uppercase">PROM. COMP.</div>
                </th>
              </React.Fragment>
            ))}
          </tr>
          <tr>
            {structure.map(comp => (
              <React.Fragment key={`des_${comp.id}`}>
                {(comp.capacities || []).map(cap => (
                  <React.Fragment key={`des2_${cap.id}`}>
                    {(cap.desempenos || []).map((des, idx) => (
                      <th key={des.id} className="p-2 bg-slate-50 dark:bg-slate-900 border-b border-r border-slate-300 dark:border-slate-750 text-center w-12">
                        <div className="text-[8px] font-extrabold text-slate-600 dark:text-slate-400 transform -rotate-90 origin-center whitespace-nowrap h-24 flex items-center justify-center translate-y-8 uppercase" title={des.description || des.desc}>
                          D. {idx + 1}
                        </div>
                      </th>
                    ))}
                    <th className="p-2 bg-emerald-500/20 border-b border-r border-slate-300 dark:border-slate-750 text-center w-14">
                      <div className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 transform -rotate-90 origin-center whitespace-nowrap h-24 flex items-center justify-center translate-y-8 uppercase">PROM. CAP.</div>
                    </th>
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {enrolledStudents.map(student => {
            const matrix = calculateStudentMatrix(student.id);
            return (
              <tr key={student.id} className="border-b border-slate-300 dark:border-slate-700/80 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                <td className="p-2.5 border-r border-slate-300 dark:border-slate-750 sticky left-0 z-10 bg-white dark:bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.02)] w-56 min-w-[224px] max-w-[224px]">
                  <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate" title={student.name}>{student.name}</div>
                </td>
                
                {structure.map(comp => (
                  <React.Fragment key={`tr_comp_${comp.id}`}>
                    {(comp.capacities || []).map(cap => (
                      <React.Fragment key={`tr_cap_${cap.id}`}>
                        {(cap.desempenos || []).map(des => {
                          const val = matrix.getDesempenoGrade(des.id);
                          const evidence = matrix.getDesempenoEvidence(des.id);
                          const score = convertToLetter(val);
                          const style = getGradeStyle(score);
                          return (
                            <td
                              key={des.id}
                              onClick={() => evidence.length && setSelectedEvidence({ student, desempeno: des, score, evidence })}
                              className={`p-2 border-b border-r border-slate-300 dark:border-slate-750 text-center transition-all duration-200 ${style.bgClass} ${evidence.length ? 'cursor-pointer hover:brightness-95' : ''}`}
                              title={evidence.length ? `Ver ${evidence.length} evidencia(s) de este desempeño` : 'Sin evidencias registradas'}
                            >
                              <span className={`block font-extrabold text-xs ${style.textClass}`}>
                                {score}
                              </span>
                              {evidence.length > 0 && (
                                <span className="mt-1 block text-[8px] font-black uppercase tracking-tight text-slate-500 dark:text-slate-400">
                                  {evidence.length} ev.
                                </span>
                              )}
                            </td>
                          );
                        })}
                        {(() => {
                          const capScore = convertToLetter(matrix.getCapacityGrade(cap));
                          const capStyle = getGradeStyle(capScore);
                          return (
                            <td className={`p-2.5 border-b border-r border-slate-300 dark:border-slate-750 text-center transition-all duration-200 ${capStyle.bgClass}`}>
                              <span className={`font-black text-xs ${capStyle.textClass}`}>
                                {capScore}
                              </span>
                            </td>
                          );
                        })()}
                      </React.Fragment>
                    ))}
                    {(() => {
                      const compScore = convertToLetter(matrix.getCompetencyGrade(comp));
                      const compStyle = getGradeStyle(compScore);
                      return (
                        <td className={`p-3 border-b border-r border-slate-300 dark:border-slate-750 text-center transition-all duration-200 ${compStyle.bgClass}`}>
                          <span className={`font-black text-sm ${compStyle.textClass}`}>
                            {compScore}
                          </span>
                        </td>
                      );
                    })()}
                  </React.Fragment>
                ))}
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
      {selectedEvidence && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={() => setSelectedEvidence(null)}>
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900" onClick={event => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Trazabilidad del desempeño</p>
                <h3 className="mt-1 text-base font-black text-slate-800 dark:text-white">{selectedEvidence.desempeno.description || selectedEvidence.desempeno.desc || 'Desempeño'}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">{selectedEvidence.student.name}</p>
              </div>
              <button type="button" onClick={() => setSelectedEvidence(null)} className="rounded-lg px-3 py-2 text-xs font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cerrar</button>
            </div>
            <div className="space-y-2">
              {selectedEvidence.evidence.map((item, index) => (
                <div key={`${item.evaluationId}_${index}`} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-slate-800 dark:text-slate-100">{item.instrumentName}</p>
                    <p className="mt-1 text-[10px] font-medium text-slate-500">{item.evidenceName}{item.projected ? ' · Evidencia proyectada desde instrumento sin desempeño vinculado' : ''}</p>
                  </div>
                  <span className={`shrink-0 rounded-lg px-3 py-2 text-sm font-black ${getGradeStyle(convertToLetter(item.value)).bgClass} ${getGradeStyle(convertToLetter(item.value)).textClass}`}>
                    {convertToLetter(item.value)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3 dark:bg-indigo-950/30">
              <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">Promedio del desempeño</span>
              <span className={`text-xl font-black ${getGradeStyle(selectedEvidence.score).textClass}`}>{selectedEvidence.score}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
