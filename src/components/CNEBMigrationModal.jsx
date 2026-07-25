import React, { useState } from 'react';
import { X, Wand2, AlertTriangle } from 'lucide-react';

export default function CNEBMigrationModal({ evaluation, structure, selectedCompetenceId, onClose, onMigrate }) {
  const [selectedDesempenoIds, setSelectedDesempenoIds] = useState(() => {
    const targetCompId = evaluation.competenceId || selectedCompetenceId;
    const allIds = [];
    (structure || []).forEach(comp => {
      if (comp.id === targetCompId) {
        (comp.capacities || []).forEach(cap => {
          (cap.desempenos || []).forEach(des => {
            allIds.push(des.id);
          });
        });
      }
    });
    return allIds;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDesempenoIds.length === 0) {
      alert('Por favor, selecciona al menos un desempeño.');
      return;
    }
    onMigrate(evaluation, selectedDesempenoIds);
  };

  const handleToggle = (id) => {
    setSelectedDesempenoIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-2 text-indigo-400">
            <Wand2 className="h-5 w-5" />
            <h3 className="text-lg font-black">Asistente de Migración</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-6 space-y-4">
            
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
              <div className="text-sm text-indigo-200/80 leading-relaxed">
                <p className="mb-2">Vas a transformar el examen <strong>{evaluation.name}</strong> al nuevo esquema Formativo CNEB.</p>
                <p>Las notas globales que ya habías puesto se agruparán en un único ítem, inyectando la calificación directamente al Desempeño que selecciones a continuación.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Desempeño(s) Principal(es) Evaluado(s)</label>
              <div className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 max-h-60 overflow-y-auto space-y-2">
                {(structure || []).length === 0 && (
                  <p className="text-sm text-slate-500 italic p-2">No hay competencias definidas.</p>
                )}
                {(structure || []).map(comp => (
                  <div key={comp.id} className="mb-4">
                    <div className="font-bold text-xs uppercase text-indigo-400 bg-indigo-900/20 p-2 rounded mb-1">
                      COMP: {comp.name || 'Competencia'}
                    </div>
                    <div className="pl-2 space-y-1">
                      {(comp.capacities || []).map(cap => (
                        <div key={cap.id}>
                          <div className="text-xs text-slate-400 font-semibold mb-1">
                            {(cap.name || 'Capacidad')}
                          </div>
                          <div className="pl-3 space-y-1">
                            {(cap.desempenos || []).map(des => (
                              <label key={des.id} className="flex items-start gap-2 text-sm text-slate-300 hover:text-white cursor-pointer group">
                                <input 
                                  type="checkbox" 
                                  className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-950 cursor-pointer"
                                  checked={selectedDesempenoIds.includes(des.id)}
                                  onChange={() => handleToggle(des.id)}
                                />
                                <span className="leading-tight group-hover:text-indigo-200 transition-colors">
                                  {(des.description || des.desc || 'Desempeño')}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-950">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-2 rounded-lg font-bold text-sm transition"
            >
              <Wand2 className="h-4 w-4" /> Migrar a Matriz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
