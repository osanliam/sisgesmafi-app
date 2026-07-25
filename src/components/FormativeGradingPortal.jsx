import React, { useState, useMemo, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, ListTree, Calculator, MessageSquareText, RotateCcw, Copy, ChevronDown, AlertTriangle, X } from 'lucide-react';
import { DatabaseContext } from '../context/DatabaseContext';

// Components
import GradebookClassic from './GradebookClassic';
import GradebookCNEB from './GradebookCNEB';
import GradebookConclusions from './GradebookConclusions';
import InstrumentBuilderModal from './InstrumentBuilderModal';
import { canViewEvaluation } from '../utils/evaluationAccess';

export default function FormativeGradingPortal({ 
  course, 
  enrolledStudents, 
  selectedSection,
  selectedBimester,
  selectedUnit
}) {
  if (!course || !course.id) return null;
  const { 
    evaluations, 
    saveEvaluation, 
    saveGrade, 
    saveGradesBatch, 
    grades, 
    revertCNEBMigrationsSelective,
    currentRole,
    currentUser
  } = useContext(DatabaseContext);
  
  const [activeView, setActiveView] = useState('classic'); // 'classic', 'matrix', 'conclusions'
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedCompetenceId, setSelectedCompetenceId] = useState('');

  // Period / Bimester configurations derived from props
  const bimesterNumber = selectedBimester || '2';
  const selectedPeriod = `Bimestre ${bimesterNumber}`;

  // Transversal copy states
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceCompId, setCopySourceCompId] = useState('');
  const [copyTargetCompId, setCopyTargetCompId] = useState('');

  // Selective reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetMode, setResetMode] = useState('all'); // 'all' | 'section' | 'competence' | 'instrument'
  const [resetSection, setResetSection] = useState('');
  const [resetCompetenceId, setResetCompetenceId] = useState('');
  const [resetEvalId, setResetEvalId] = useState('');
  const [resetting, setResetting] = useState(false);

  // Extract competencies structure from course
  const structure = course.competencies || [];

  // Auto-select first competence if not set
  useEffect(() => {
    if (structure.length > 0 && !selectedCompetenceId) {
      setSelectedCompetenceId(structure[0].id);
    } else if (structure.length > 0 && selectedCompetenceId) {
      if (!structure.some(c => c.id === selectedCompetenceId)) {
        setSelectedCompetenceId(structure[0].id);
      }
    }
  }, [structure, selectedCompetenceId]);

  // Filter evaluations for this course, period, and unit
  const allCourseEvals = useMemo(() => {
    return evaluations.filter(e => {
      if (!canViewEvaluation(e, { role: currentRole, userId: currentUser?.id, section: selectedSection })) return false;
      if (e.courseId !== course.id) return false;
      if (e.isReinforcement) return false;
      if (e._isClonedMigration) return false; // hide clones from formative view
      if (e.period !== selectedPeriod && e.bimester !== bimesterNumber) return false;
      if (selectedCompetenceId && e.competenceId !== selectedCompetenceId) return false;
      
      // Filter by unit (cast to string to prevent mismatch)
      if (e.unit !== undefined && e.unit !== null && String(e.unit) !== String(selectedUnit)) return false;
      
      // Section isolation
      if (e.section && selectedSection && e.section.toLowerCase() !== selectedSection.toLowerCase()) return false;
      
      // If this is a legacy evaluation (no section), check if a section-specific migrated evaluation exists.
      if (!e.section && selectedSection) {
        const hasMigratedCopy = evaluations.some(other => other.id === `${e.id}_${selectedSection.toLowerCase()}`);
        if (hasMigratedCopy) return false;
      }
      
      return true;
    });
  }, [evaluations, course.id, selectedPeriod, bimesterNumber, selectedCompetenceId, selectedSection, selectedUnit, currentRole, currentUser]);

  // formativeEvals is used for matrix and conclusions
  const formativeEvals = useMemo(() => allCourseEvals.filter(e => e.isFormative), [allCourseEvals]);

  // The CNEB matrix and conclusions are fed by Registro Oficial (CRUD),
  // never by formative copies, workshop marks, or reinforcement.
  const officialCrudEvalsForBimester = useMemo(() => {
    return evaluations.filter(e => {
      if (!canViewEvaluation(e, { role: currentRole, userId: currentUser?.id, section: selectedSection })) return false;
      if (e.courseId !== course.id) return false;
      if (e.isReinforcement) return false;
      if (e._isClonedMigration) return false; // hide clones
      if (e.period !== selectedPeriod && e.bimester !== bimesterNumber) return false;
      if (e.isFormative) return false;
      
      // Section isolation
      if (e.section && selectedSection && e.section.toLowerCase() !== selectedSection.toLowerCase()) return false;
      
      // If this is a legacy evaluation (no section), check if a section-specific migrated evaluation exists.
      if (!e.section && selectedSection) {
        const hasMigratedCopy = evaluations.some(other => other.id === `${e.id}_${selectedSection.toLowerCase()}`);
        if (hasMigratedCopy) return false;
      }
      
      return true;
    });
  }, [evaluations, course.id, selectedPeriod, bimesterNumber, selectedSection, currentRole, currentUser]);

  const officialCrudEvals = useMemo(() => officialCrudEvalsForBimester.filter(e =>
    e.unit === undefined || e.unit === null || String(e.unit) === String(selectedUnit)
  ), [officialCrudEvalsForBimester, selectedUnit]);

  const handleCreateInstrument = async (evalData) => {
    const newId = `eval_${Date.now()}`;
    await saveEvaluation({
      ...evalData,
      id: newId,
      courseId: course.id,
      section: selectedSection,
      period: selectedPeriod,
      bimester: bimesterNumber,
      unit: selectedUnit,
      createdAt: new Date().toISOString(),
      isFormative: true
    });
    setShowBuilder(false);
  };

  const handleGradeChange = async (studentId, evaluationId, payload) => {
    const evaluation = evaluations.find(e => e.id === evaluationId);
    const competenceId = evaluation ? evaluation.competenceId : '';
    await saveGrade({
      studentId,
      courseId: course.id,
      competenceId,
      evaluationId,
      bimester: bimesterNumber,
      unit: selectedUnit,
      score: payload.score,
      details: payload.details || null,
      updatedAt: new Date().toISOString()
    });
  };

  const executeCopyGrades = async () => {
    if (!copySourceCompId || !copyTargetCompId) return;
    if (copySourceCompId === copyTargetCompId) {
      alert("La competencia de origen y destino no pueden ser la misma.");
      return;
    }

    // Filter evaluations of the source competence for this course, bimester, and unit
    const sourceEvals = evaluations.filter(e => {
      if (!canViewEvaluation(e, { role: currentRole, userId: currentUser?.id, section: selectedSection })) return false;
      if (e.courseId !== course.id) return false;
      if (e.period !== selectedPeriod && e.bimester !== bimesterNumber) return false;
      if (e.competenceId !== copySourceCompId) return false;
      if (e.unit !== undefined && e.unit !== null && String(e.unit) !== String(selectedUnit)) return false;
      if (e.section && selectedSection && e.section.toLowerCase() !== selectedSection.toLowerCase()) return false;
      return true;
    });

    if (sourceEvals.length === 0) {
      alert("No se encontraron instrumentos en la competencia de origen para este bimestre y unidad.");
      return;
    }

    const sourceName = structure.find(c => c.id === copySourceCompId)?.name || 'Origen';
    const targetName = structure.find(c => c.id === copyTargetCompId)?.name || 'Destino';

    if (!window.confirm(`¿Estás seguro de que deseas copiar las notas desde "${sourceName}" hacia "${targetName}"?\nSe duplicarán ${sourceEvals.length} instrumentos y sus respectivas notas.`)) {
      return;
    }

    try {
      const gradePayloads = [];

      for (const oldEval of sourceEvals) {
        const newEvalId = `eval_copy_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // 1. Create duplicate evaluation with target competence id
        const clonedEval = {
          ...oldEval,
          id: newEvalId,
          competenceId: copyTargetCompId,
          name: `${oldEval.name} (Copia TIC)`,
          createdAt: new Date().toISOString()
        };
        await saveEvaluation(clonedEval);

        // 2. Prepare duplicate student grades
        const oldGrades = grades.filter(g => g.evaluationId === oldEval.id);
        oldGrades.forEach(g => {
          gradePayloads.push({
            studentId: g.studentId,
            courseId: course.id,
            competenceId: copyTargetCompId,
            evaluationId: newEvalId,
            instrument: clonedEval.name,
            score: g.score,
            teacherId: g.teacherId || currentUser?.id || 'admin_1',
            details: g.details || null,
            bimester: bimesterNumber,
            unit: selectedUnit
          });
        });
      }

      // 3. Batch save copied grades
      if (gradePayloads.length > 0) {
        await saveGradesBatch(gradePayloads);
      }

      alert("Copia de calificaciones realizada con éxito.");
      setShowCopyModal(false);
    } catch (err) {
      console.error("Error al copiar calificaciones:", err);
      alert("Ocurrió un error al copiar las calificaciones: " + err.message);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Contextual Header Portaled to ClassroomManager */}
      {(() => {
        const portalTarget = document.getElementById('classroom-context-header-slot');
        const headerContent = (
          <div className="flex flex-col gap-4 w-full text-left mt-2">
            {/* Row 1: Competence and action buttons */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 w-full">
              <div className="flex-1 w-full max-w-md">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Competencia a Evaluar</label>
                <select 
                  value={selectedCompetenceId} 
                  onChange={(e) => setSelectedCompetenceId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3.5 py-2 text-sm font-semibold text-slate-200 outline-none focus:border-indigo-500"
                >
                  {structure.map(comp => (
                    <option key={comp.id} value={comp.id}>{comp.name}</option>
                  ))}
                  {!structure.length && <option value="">Sin competencias configuradas</option>}
                </select>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:mt-5">
                <button 
                  onClick={() => {
                    const ticComp = structure.find(c => 
                      c.name.toLowerCase().includes('virtuales') || 
                      c.name.toLowerCase().includes('tic') || 
                      c.name.toLowerCase().includes('desenvuelve')
                    );
                    const otherComp = structure.find(c => c.id !== ticComp?.id);
                    setCopySourceCompId(otherComp?.id || '');
                    setCopyTargetCompId(ticComp?.id || '');
                    setShowCopyModal(true);
                  }}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-lg shadow-indigo-600/20"
                  title="Copiar calificaciones entre competencias"
                >
                  <Copy className="h-3.5 w-3.5" /> Copiar Notas (Transversal)
                </button>

                <button 
                  onClick={() => setShowResetModal(true)}
                  className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-lg shadow-rose-600/20"
                  title="Restablecer migraciones CNEB selectivamente"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Restablecer Migraciones
                </button>

                <button 
                  onClick={() => setShowBuilder(true)}
                  className="btn-neuro-primary flex items-center justify-center gap-1.5 text-xs py-2 px-3 hover:scale-105 active:scale-95 transition-all font-bold shadow-lg shadow-indigo-650/15"
                >
                  <Plus className="h-4 w-4" /> Crear Instrumento
                </button>
              </div>
            </div>

            {/* Row 2: View Switcher Tabs as seen in Image 1 */}
            <div className="flex bg-slate-100 dark:bg-[#0B1021]/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full md:w-max">
              <button 
                onClick={() => setActiveView('classic')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-black transition-all ${
                  activeView === 'classic' ? 'bg-[#005ac2] dark:bg-[#5b61f9] text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Calculator className="h-4 w-4" /> Registro Oficial (CRUD)
              </button>
              <button 
                onClick={() => setActiveView('matrix')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-black transition-all ${
                  activeView === 'matrix' ? 'bg-[#005ac2] dark:bg-[#5b61f9] text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <ListTree className="h-4 w-4" /> Matriz CNEB (Bottom-Up)
              </button>
              <button 
                onClick={() => setActiveView('conclusions')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-black transition-all ${
                  activeView === 'conclusions' ? 'bg-[#005ac2] dark:bg-[#5b61f9] text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <MessageSquareText className="h-4 w-4" /> Conclusiones Descriptivas
              </button>
            </div>
          </div>
        );
        return portalTarget ? createPortal(headerContent, portalTarget) : headerContent;
      })()}

      {/* Render Active View */}
      <div className="mt-4">
        {activeView === 'classic' && (
          <GradebookClassic 
            course={course}
            structure={structure}
            allCourseEvals={allCourseEvals}
            formativeEvals={formativeEvals}
            studentGrades={grades}
            enrolledStudents={enrolledStudents}
            handleGradeChange={handleGradeChange}
            selectedCompetenceId={selectedCompetenceId}
            selectedSection={selectedSection}
            selectedUnit={selectedUnit}
          />
        )}

        {activeView === 'matrix' && (
          <GradebookCNEB 
            structure={structure}
            officialCrudEvals={officialCrudEvals}
            studentGrades={grades}
            enrolledStudents={enrolledStudents}
            selectedUnit={selectedUnit}
          />
        )}

        {activeView === 'conclusions' && (
          <GradebookConclusions 
            structure={structure}
            officialCrudEvals={officialCrudEvalsForBimester}
            studentGrades={grades}
            enrolledStudents={enrolledStudents}
            courseId={course.id}
            selectedPeriod={selectedPeriod}
            selectedUnit={selectedUnit}
          />
        )}
      </div>

      {showBuilder && (
        <InstrumentBuilderModal 
          onClose={() => setShowBuilder(false)}
          onSave={handleCreateInstrument}
          structure={structure}
        />
      )}

      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1021]/95 max-w-md w-full p-6 text-left shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Copy className="h-5 w-5 text-[#005ac2] dark:text-indigo-400" /> Copiar Calificaciones
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Esta herramienta duplicará todos los instrumentos de evaluación y las calificaciones ingresadas en la competencia de origen hacia la de destino para el bimestre y la unidad de aprendizaje activos.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Competencia Origen (Desde donde copiar)</label>
              <select 
                value={copySourceCompId} 
                onChange={(e) => setCopySourceCompId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:border-[#005ac2] dark:focus:border-indigo-500 outline-none"
              >
                <option value="">Selecciona origen...</option>
                {structure.map(comp => (
                  <option key={comp.id} value={comp.id}>{comp.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Competencia Destino (Hacia donde copiar)</label>
              <select 
                value={copyTargetCompId} 
                onChange={(e) => setCopyTargetCompId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:border-[#005ac2] dark:focus:border-indigo-500 outline-none"
              >
                <option value="">Selecciona destino...</option>
                {structure.map(comp => (
                  <option key={comp.id} value={comp.id}>{comp.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-850 pt-4">
              <button 
                onClick={() => setShowCopyModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white font-semibold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={executeCopyGrades}
                className="px-4 py-2 rounded-lg bg-[#005ac2] hover:bg-[#004bb0] dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-650/20"
              >
                Copiar Notas
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ===== MODAL: Restablecer Migraciones Selectivo ===== */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0d1526] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-rose-50 dark:bg-rose-950/20">
              <div className="flex items-center gap-2.5">
                <RotateCcw className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                <h3 className="font-black text-base text-slate-800 dark:text-white">Restablecer Migraciones</h3>
              </div>
              <button onClick={() => setShowResetModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Selecciona el alcance del restablecimiento. Las notas originales se restaurarán y podrás volver a migrar.
              </p>

              {/* Mode selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Alcance</label>
                <div className="grid grid-cols-2 gap-2">
                  {[['all','Todo el curso'],['section','Por sección'],['competence','Por competencia'],['instrument','Por instrumento']].map(([mode, label]) => (
                    <button
                      key={mode}
                      onClick={() => setResetMode(mode)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                        resetMode === mode
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-rose-400'
                      }`}
                    >{label}</button>
                  ))}
                </div>
              </div>

              {/* Conditional selectors */}
              {resetMode === 'section' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Sección</label>
                  <select
                    value={resetSection}
                    onChange={e => setResetSection(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none"
                  >
                    <option value="">Selecciona sección...</option>
                    {['A','B','C','D','E'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {resetMode === 'competence' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Competencia</label>
                  <select
                    value={resetCompetenceId}
                    onChange={e => setResetCompetenceId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none"
                  >
                    <option value="">Selecciona competencia...</option>
                    {structure.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {resetMode === 'instrument' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">Instrumento</label>
                  <select
                    value={resetEvalId}
                    onChange={e => setResetEvalId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none"
                  >
                    <option value="">Selecciona instrumento...</option>
                    {evaluations
                      .filter(e => e.courseId === course.id && e.isMigratedToCNEB && !e._isClonedMigration)
                      .map(e => <option key={e.id} value={e.id}>{e.name}</option>)
                    }
                  </select>
                </div>
              )}

              {/* Warning */}
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg px-3 py-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {resetMode === 'all'
                    ? 'Se restablecerán TODAS las migraciones del curso.'
                    : 'Solo se afectará el alcance seleccionado. El resto permanece intacto.'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white font-semibold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={resetting || (resetMode === 'section' && !resetSection) || (resetMode === 'competence' && !resetCompetenceId) || (resetMode === 'instrument' && !resetEvalId)}
                onClick={async () => {
                  setResetting(true);
                  const filters = resetMode === 'all' ? {}
                    : resetMode === 'section' ? { section: resetSection }
                    : resetMode === 'competence' ? { competenceId: resetCompetenceId }
                    : { evaluationId: resetEvalId };
                  await revertCNEBMigrationsSelective(filters);
                  setResetting(false);
                  setShowResetModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-rose-600/20"
              >
                {resetting ? 'Restableciendo...' : 'Restablecer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
