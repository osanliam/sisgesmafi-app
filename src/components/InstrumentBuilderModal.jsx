import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2, AlertTriangle, Layers, Link, Check, AlignLeft, RefreshCw, HelpCircle } from 'lucide-react';

export default function InstrumentBuilderModal({ onClose, onSave, structure = [], initialEvaluation }) {
  const curriculumStructure = Array.isArray(structure) ? structure : (structure?.competencies || []);
  const [name, setName] = useState(initialEvaluation ? initialEvaluation.name : '');
  const [type, setType] = useState(initialEvaluation ? initialEvaluation.type : 'Examen'); // Examen, Rúbrica, Práctica
  const [maxGradeScale, setMaxGradeScale] = useState(
    initialEvaluation 
      ? (initialEvaluation.maxGradeScale || 'A') 
      : (type === 'Rúbrica' ? 'AD' : 'A')
  );
  const [competenceId, setCompetenceId] = useState(initialEvaluation ? initialEvaluation.competenceId : '');
  
  // Initialize items
  const [items, setItems] = useState(() => {
    if (initialEvaluation && initialEvaluation.items && initialEvaluation.items.length > 0) {
      return initialEvaluation.items.map(item => ({
        ...item,
        type: item.type || 'direct',
        options: item.options || [],
        subQuestions: item.subQuestions || [],
        correctValue: item.correctValue !== undefined ? item.correctValue : ''
      }));
    }
    return [
      { 
        id: `item_${Date.now()}_1`, 
        text: 'Pregunta 1', 
        desempenoId: '', 
        maxScore: 100, 
        type: 'direct',
        options: [],
        subQuestions: [],
        correctValue: ''
      }
    ];
  });

  const [rubricCriteria, setRubricCriteria] = useState(() => {
    const existing = initialEvaluation?.instrumentConfig?.criteriaList;
    if (Array.isArray(existing) && existing.length > 0) return existing;
    return [
      {
        id: `criterion_${Date.now()}_1`,
        criteria: 'Criterio 1',
        desempenoId: '',
        descriptors: { AD: '', A: '', B: '', C: '' }
      },
      {
        id: `criterion_${Date.now()}_2`,
        criteria: 'Criterio 2',
        desempenoId: '',
        descriptors: { AD: '', A: '', B: '', C: '' }
      }
    ];
  });

  const [autoDistribute, setAutoDistribute] = useState(!initialEvaluation);

  // Recalculate total points
  const totalScore = items.reduce((acc, curr) => acc + (parseFloat(curr.maxScore) || 0), 0);

  // Auto-distribute points equitativamente
  const handleTriggerDistribution = (itemsList) => {
    const N = itemsList.length;
    if (N === 0) return itemsList;
    const baseScore = parseFloat((100 / N).toFixed(1));
    
    // Adjust last item to ensure total is exactly 100
    let sum = 0;
    const distributed = itemsList.map((item, idx) => {
      if (idx === N - 1) {
        const remaining = Math.max(0, 100 - sum);
        // If remaining is decimal, format properly
        return { ...item, maxScore: parseFloat(remaining.toFixed(1)) };
      }
      sum += baseScore;
      return { ...item, maxScore: baseScore };
    });
    return distributed;
  };

  useEffect(() => {
    if (autoDistribute) {
      setItems(prev => handleTriggerDistribution(prev));
    }
  }, [items.length, autoDistribute]);

  const handleAddItem = () => {
    const newItem = {
      id: `item_${Date.now()}_${items.length + 1}`,
      text: `Pregunta ${items.length + 1}`,
      desempenoId: '',
      maxScore: 0,
      type: 'direct',
      options: [],
      subQuestions: [],
      correctValue: ''
    };
    
    const newItems = [...items, newItem];
    if (autoDistribute) {
      setItems(handleTriggerDistribution(newItems));
    } else {
      setItems(newItems);
    }
  };

  const handleRemoveItem = (id) => {
    if (items.length === 1) return alert('Debe haber al menos un ítem.');
    const newItems = items.filter(item => item.id !== id);
    if (autoDistribute) {
      setItems(handleTriggerDistribution(newItems));
    } else {
      setItems(newItems);
    }
  };

  const handleChangeItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Initialize fields depending on question type
        if (field === 'type') {
          if (value === 'choice') {
            updated.options = [
              { id: `opt_${Date.now()}_1`, label: 'Alternativa A' },
              { id: `opt_${Date.now()}_2`, label: 'Alternativa B' },
              { id: `opt_${Date.now()}_3`, label: 'Alternativa C' }
            ];
            updated.correctValue = updated.options[0].id;
            updated.hasSubQuestions = false;
            updated.subQuestions = [];
          } else if (value === 'matching') {
            updated.subQuestions = [
              { id: `pair_${Date.now()}_1`, text: 'Concepto 1', correctValue: 'Relación A' },
              { id: `pair_${Date.now()}_2`, text: 'Concepto 2', correctValue: 'Relación B' }
            ];
            updated.options = [
              { id: 'rel_a', label: 'Relación A' },
              { id: 'rel_b', label: 'Relación B' }
            ];
            updated.hasSubQuestions = false;
          } else if (value === 'subquestions') {
            updated.hasSubQuestions = true;
            updated.subQuestions = [
              { id: `sub_${Date.now()}_1`, text: 'Subpregunta A', type: 'direct', desempenoId: item.desempenoId || '', maxScore: 0.5 },
              { id: `sub_${Date.now()}_2`, text: 'Subpregunta B', type: 'direct', desempenoId: item.desempenoId || '', maxScore: 0.5 }
            ];
            updated.options = [];
          } else if (value === 'abc') {
            updated.options = [];
            updated.subQuestions = [];
            updated.hasSubQuestions = false;
          } else {
            updated.options = [];
            updated.subQuestions = [];
            updated.hasSubQuestions = false;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  // Choice options operations
  const handleAddChoiceOption = (itemId) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const nextId = `opt_${Date.now()}_${(item.options || []).length + 1}`;
        const newOpts = [...(item.options || []), { id: nextId, label: `Alternativa ${(item.options || []).length + 1}` }];
        return { ...item, options: newOpts };
      }
      return item;
    }));
  };

  const handleRemoveChoiceOption = (itemId, optId) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const newOpts = (item.options || []).filter(o => o.id !== optId);
        let correctVal = item.correctValue;
        if (correctVal === optId && newOpts.length > 0) {
          correctVal = newOpts[0].id;
        }
        return { ...item, options: newOpts, correctValue: correctVal };
      }
      return item;
    }));
  };

  const handleEditChoiceOption = (itemId, optId, newText) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const newOpts = (item.options || []).map(o => o.id === optId ? { ...o, label: newText } : o);
        return { ...item, options: newOpts };
      }
      return item;
    }));
  };

  // Matching options operations
  const handleAddMatchingPair = (itemId) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const nextId = `pair_${Date.now()}_${(item.subQuestions || []).length + 1}`;
        const newPairs = [...(item.subQuestions || []), { id: nextId, text: `Concepto ${(item.subQuestions || []).length + 1}`, correctValue: `Respuesta ${(item.subQuestions || []).length + 1}` }];
        
        // Re-generate options from pairs correctValues
        const newOpts = newPairs.map((p, idx) => ({ id: `rel_${idx}`, label: p.correctValue }));
        return { ...item, subQuestions: newPairs, options: newOpts };
      }
      return item;
    }));
  };

  const handleRemoveMatchingPair = (itemId, pairId) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const newPairs = (item.subQuestions || []).filter(p => p.id !== pairId);
        const newOpts = newPairs.map((p, idx) => ({ id: `rel_${idx}`, label: p.correctValue }));
        return { ...item, subQuestions: newPairs, options: newOpts };
      }
      return item;
    }));
  };

  const handleEditMatchingPair = (itemId, pairId, field, val) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const newPairs = (item.subQuestions || []).map(p => {
          if (p.id === pairId) {
            return { ...p, [field]: val };
          }
          return p;
        });
        const newOpts = newPairs.map((p, idx) => ({ id: `rel_${idx}`, label: p.correctValue }));
        return { ...item, subQuestions: newPairs, options: newOpts };
      }
      return item;
    }));
  };

  // Subquestions operations
  const handleAddSubquestion = (itemId) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const nextId = `sub_${Date.now()}_${(item.subQuestions || []).length + 1}`;
        const newSubs = [
          ...(item.subQuestions || []), 
          { id: nextId, text: `Subpregunta ${(item.subQuestions || []).length + 1}`, type: 'direct', desempenoId: item.desempenoId || '', maxScore: 1 }
        ];
        return { ...item, subQuestions: newSubs };
      }
      return item;
    }));
  };

  const handleRemoveSubquestion = (itemId, subId) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const newSubs = (item.subQuestions || []).filter(s => s.id !== subId);
        return { ...item, subQuestions: newSubs };
      }
      return item;
    }));
  };

  const handleEditSubquestion = (itemId, subId, field, val) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const newSubs = (item.subQuestions || []).map(s => {
          if (s.id === subId) {
            const updated = { ...s, [field]: val };
            if (field === 'type' && val === 'choice') {
              updated.options = [
                { id: `sopt_${Date.now()}_1`, label: 'Alternativa A' },
                { id: `sopt_${Date.now()}_2`, label: 'Alternativa B' }
              ];
              updated.correctValue = updated.options[0].id;
            }
            return updated;
          }
          return s;
        });
        return { ...item, subQuestions: newSubs };
      }
      return item;
    }));
  };

  const handleAddSubChoiceOption = (itemId, subId) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const newSubs = (item.subQuestions || []).map(s => {
          if (s.id === subId) {
            const nextId = `sopt_${Date.now()}_${(s.options || []).length + 1}`;
            return {
              ...s,
              options: [...(s.options || []), { id: nextId, label: `Alternativa ${(s.options || []).length + 1}` }]
            };
          }
          return s;
        });
        return { ...item, subQuestions: newSubs };
      }
      return item;
    }));
  };

  const handleRemoveSubChoiceOption = (itemId, subId, optId) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const newSubs = (item.subQuestions || []).map(s => {
          if (s.id === subId) {
            const newOpts = (s.options || []).filter(o => o.id !== optId);
            let correctVal = s.correctValue;
            if (correctVal === optId && newOpts.length > 0) {
              correctVal = newOpts[0].id;
            }
            return { ...s, options: newOpts, correctValue: correctVal };
          }
          return s;
        });
        return { ...item, subQuestions: newSubs };
      }
      return item;
    }));
  };

  const handleEditSubChoiceOption = (itemId, subId, optId, val) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const newSubs = (item.subQuestions || []).map(s => {
          if (s.id === subId) {
            const newOpts = (s.options || []).map(o => o.id === optId ? { ...o, label: val } : o);
            return { ...s, options: newOpts };
          }
          return s;
        });
        return { ...item, subQuestions: newSubs };
      }
      return item;
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Ingrese el nombre del instrumento.');
    if (!competenceId) return alert('Seleccione a qué competencia pertenece el instrumento.');
    
    if (type === 'Rúbrica') {
      if (rubricCriteria.length === 0 || rubricCriteria.some(criterion => !criterion.criteria?.trim())) {
        return alert('Agrega al menos un criterio con nombre en la rúbrica.');
      }
      if (rubricCriteria.some(criterion => !criterion.desempenoId)) {
        return alert('Vincula cada criterio de la rúbrica a un desempeño CNEB.');
      }
    } else {
      // Validate each question has a desempeno
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type === 'subquestions') {
          if ((item.subQuestions || []).length === 0) {
            return alert(`La Pregunta ${i + 1} de tipo Subpreguntas debe tener al menos una subpregunta.`);
          }
          if (item.subQuestions.some(s => !s.desempenoId)) {
            return alert(`Todas las subpreguntas de la Pregunta ${i + 1} deben estar asignadas a un Desempeño CNEB.`);
          }
        } else if (!item.desempenoId) {
          return alert(`La Pregunta ${i + 1} debe estar asignada a un Desempeño CNEB.`);
        }
      }
    }
    
    const newEval = {
      name,
      type,
      maxGradeScale,
      competenceId,
      items: type === 'Rúbrica' ? [] : items,
      instrumentConfig: type === 'Rúbrica' ? { criteriaList: rubricCriteria } : (initialEvaluation?.instrumentConfig || {}),
      isFormative: true
    };
    onSave(newEval);
  };

  const selectedCompetence = curriculumStructure.find(c => c.id === competenceId);

  const getItemStyles = (type, index) => {
    const colors = [
      { border: 'border-indigo-500/25', bg: 'bg-indigo-950/10', text: 'text-indigo-400', badge: 'bg-indigo-500/10 text-indigo-300' },
      { border: 'border-emerald-500/25', bg: 'bg-emerald-950/10', text: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-300' },
      { border: 'border-amber-500/25', bg: 'bg-amber-950/10', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-300' },
      { border: 'border-pink-500/25', bg: 'bg-pink-950/10', text: 'text-pink-400', badge: 'bg-pink-500/10 text-pink-300' },
      { border: 'border-sky-500/25', bg: 'bg-sky-950/10', text: 'text-sky-400', badge: 'bg-sky-500/10 text-sky-300' },
      { border: 'border-violet-500/25', bg: 'bg-violet-950/10', text: 'text-violet-400', badge: 'bg-violet-500/10 text-violet-300' }
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="text-lg font-black text-slate-200">
            {initialEvaluation ? 'Configurar Instrumento de Evaluación' : 'Creador de Instrumento de Evaluación'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
            
            {/* Header Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Nombre del Instrumento</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Examen Bimestral, Rúbrica de Exposición..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Competencia</label>
                <select
                  required
                  value={competenceId}
                  onChange={e => {
                    setCompetenceId(e.target.value);
                    // Reset all items' desempenoId since competence changed
                    setItems(items.map(item => ({ ...item, desempenoId: '' })));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-amber-500 outline-none"
                >
                  <option value="">-- Seleccionar Competencia --</option>
                  {curriculumStructure.map(comp => (
                    <option key={comp.id} value={comp.id}>{comp.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Tipo de Instrumento</label>
                  <select
                    value={type}
                    onChange={e => {
                      const newType = e.target.value;
                      setType(newType);
                      setMaxGradeScale(newType === 'Rúbrica' ? 'AD' : 'A');
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:border-amber-500 outline-none"
                  >
                    <option value="Examen">Examen / Prueba Escrita</option>
                    <option value="Rúbrica">Rúbrica / Guía de Observación</option>
                    <option value="Práctica">Práctica Calificada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Calificación Máxima</label>
                  <select
                    value={maxGradeScale}
                    onChange={e => setMaxGradeScale(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm font-bold text-indigo-400 focus:border-amber-500 outline-none"
                  >
                    <option value="A">Logro Esperado (Hasta A)</option>
                    <option value="AD">Logro Destacado (Hasta AD)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Items Configuration */}
            {type === 'Rúbrica' && (
              <section className="space-y-4">
                <div className="flex flex-col gap-3 border-b border-slate-800 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-amber-400">Matriz de rúbrica</h4>
                    <p className="mt-0.5 text-[10px] text-slate-400">Cada fila es un criterio y cada columna describe el nivel de logro del estudiante.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRubricCriteria(previous => [...previous, {
                      id: `criterion_${Date.now()}`,
                      criteria: `Criterio ${previous.length + 1}`,
                      desempenoId: '',
                      descriptors: { AD: '', A: '', B: '', C: '' }
                    }])}
                    className="flex items-center gap-1.5 self-start rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-300 transition hover:bg-indigo-500/20 sm:self-auto"
                  >
                    <Plus className="h-4 w-4" /> Agregar criterio
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-700">
                  <table className="min-w-[980px] w-full text-left">
                    <thead className="bg-slate-950 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="w-56 p-3">Criterio</th>
                        <th className="min-w-44 p-3 text-sky-300">AD · Destacado</th>
                        <th className="min-w-44 p-3 text-emerald-300">A · Esperado</th>
                        <th className="min-w-44 p-3 text-amber-300">B · En proceso</th>
                        <th className="min-w-44 p-3 text-rose-300">C · En inicio</th>
                        <th className="w-12 p-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {rubricCriteria.map((criterion, index) => (
                        <tr key={criterion.id} className="border-t border-slate-800 align-top">
                          <td className="p-3">
                            <input
                              required
                              value={criterion.criteria}
                              onChange={event => setRubricCriteria(previous => previous.map(item => item.id === criterion.id ? { ...item, criteria: event.target.value } : item))}
                              placeholder="Describe el criterio"
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-100 outline-none focus:border-amber-500"
                            />
                            <select
                              required
                              disabled={!competenceId}
                              value={criterion.desempenoId || ''}
                              onChange={event => setRubricCriteria(previous => previous.map(item => item.id === criterion.id ? { ...item, desempenoId: event.target.value } : item))}
                              className={`mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-[10px] outline-none focus:border-amber-500 ${competenceId ? 'text-slate-300' : 'text-slate-500'}`}
                            >
                              <option value="">{competenceId ? 'Vincular a desempeño CNEB…' : 'Primero seleccione competencia'}</option>
                              {selectedCompetence && (selectedCompetence.capacities || []).map(capacity => (
                                <optgroup key={capacity.id} label={`CAP: ${(capacity.name || '').substring(0, 35)}...`}>
                                  {(capacity.desempenos || []).map(desempeno => {
                                    const description = desempeno.description || desempeno.desc || '';
                                    return <option key={desempeno.id} value={desempeno.id}>{description.length > 70 ? `${description.substring(0, 70)}...` : description}</option>;
                                  })}
                                </optgroup>
                              ))}
                            </select>
                          </td>
                          {['AD', 'A', 'B', 'C'].map(level => (
                            <td key={level} className="p-3">
                              <textarea
                                rows="4"
                                value={criterion.descriptors?.[level] || ''}
                                onChange={event => setRubricCriteria(previous => previous.map(item => item.id === criterion.id ? {
                                  ...item,
                                  descriptors: { ...(item.descriptors || {}), [level]: event.target.value }
                                } : item))}
                                placeholder={`Descriptor para ${level}`}
                                className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 p-2 text-[11px] leading-relaxed text-slate-200 outline-none focus:border-amber-500"
                              />
                            </td>
                          ))}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              disabled={rubricCriteria.length === 1}
                              onClick={() => setRubricCriteria(previous => previous.filter(item => item.id !== criterion.id))}
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-30"
                              title="Eliminar criterio"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-slate-500">Al calificar, el docente seleccionará un nivel por cada criterio y el sistema calculará el resultado formativo.</p>
              </section>
            )}

            {type !== 'Rúbrica' && <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-amber-400">Configuración de Ítems / Preguntas</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Define las preguntas y su tipo de respuesta interactiva.</p>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setAutoDistribute(true);
                      setItems(handleTriggerDistribution(items));
                    }}
                    className="flex items-center gap-1 text-[10px] font-black uppercase text-indigo-400 border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1.5 rounded-lg hover:bg-indigo-500/10 active:scale-95 transition"
                    title="Ajusta equitativamente el peso de todas las preguntas para sumar 100%"
                  >
                    <RefreshCw className="h-3 w-3 animate-spin-slow" /> Equilibrar a 100%
                  </button>
                  <span className={`text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 ${totalScore === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/25 text-rose-350'}`}>
                    {totalScore !== 100 && <AlertTriangle className="h-3.5 w-3.5 text-rose-450 shrink-0" />}
                    Peso Total: <strong className="text-sm">{totalScore}%</strong> / 100%
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                {items.map((item, index) => {
                  const style = getItemStyles(item.type, index);
                  return (
                    <div key={item.id} className={`p-4.5 rounded-xl border ${style.border} ${style.bg} space-y-4 shadow-sm relative group`}>
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        <div className="flex-1 space-y-3 w-full">
                          
                          {/* Title and Type Row */}
                          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${style.text} ${style.badge} px-2.5 py-1 rounded border ${style.border}`}>
                              Pregunta {index + 1}
                            </span>
                          
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Tipo:</label>
                            <select
                              value={item.type || 'direct'}
                              onChange={e => handleChangeItem(item.id, 'type', e.target.value)}
                              className="bg-slate-900 border border-slate-700 text-xs rounded px-2 py-1 font-bold text-slate-350 focus:border-amber-500 outline-none"
                            >
                              <option value="direct">Directa (Correcta / Incorrecta)</option>
                              <option value="choice">Alternativa Múltiple</option>
                              <option value="matching">Relacionar / Une con flechas</option>
                              <option value="abc">Pregunta Abierta (Bien / Más o Menos / Mal)</option>
                              <option value="numeric">Puntaje Numérico Directo</option>
                              <option value="subquestions">Grupo de Subpreguntas</option>
                            </select>
                          </div>
                        </div>

                        {/* Statement / Text */}
                        <input 
                          type="text" 
                          required
                          value={item.text}
                          onChange={e => handleChangeItem(item.id, 'text', e.target.value)}
                          placeholder="Ej: Escribe la pregunta del instrumento..."
                          className="w-full bg-slate-900 border border-slate-750 rounded-xl px-4 py-2 text-sm text-slate-200 focus:border-amber-500 focus:bg-transparent outline-none transition"
                        />

                        {/* Desempeno Dropdown (only visible if not a subquestions container, since subquestions have their own) */}
                        {item.type !== 'subquestions' && (
                          <select
                            required
                            disabled={!competenceId}
                            value={item.desempenoId}
                            onChange={e => handleChangeItem(item.id, 'desempenoId', e.target.value)}
                            className={`w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs focus:border-amber-500 outline-none transition ${!competenceId ? 'text-slate-500' : 'text-slate-300'}`}
                          >
                            <option value="">{competenceId ? '🔗 Vincular a Desempeño CNEB...' : '-- Primero seleccione Competencia --'}</option>
                            {selectedCompetence && (selectedCompetence.capacities || []).map(cap => (
                              <optgroup key={cap.id} label={`CAP: ${(cap.name || '').substring(0, 30)}...`}>
                                {(cap.desempenos || []).map(des => {
                                  const displayText = des.description || des.desc || '';
                                  return (
                                    <option key={des.id} value={des.id}>
                                      {displayText.length > 80 ? displayText.substring(0, 80) + '...' : displayText}
                                    </option>
                                  );
                                })}
                              </optgroup>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Score and Remove Controls */}
                      <div className="flex md:flex-col items-center justify-between md:justify-start gap-4 w-full md:w-auto shrink-0 border-t md:border-t-0 border-slate-800/80 pt-3 md:pt-0">
                        <div className="w-24">
                          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Peso / Valor (%)</label>
                          <input 
                            type="number" 
                            min="0"
                            step="0.1"
                            value={item.maxScore}
                            onChange={e => {
                              setAutoDistribute(false);
                              handleChangeItem(item.id, 'maxScore', parseFloat(e.target.value) || 0);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-center text-amber-400 font-black focus:border-amber-500 outline-none"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2.5 text-slate-500 hover:text-rose-500 transition hover:bg-rose-500/10 rounded-xl border border-slate-850"
                          title="Eliminar pregunta"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>

                    {/* Advanced Configuration Fields based on Type */}
                    <div className="pl-0 md:pl-2">
                      
                      {/* 1. CHOICE OPTIONS EDITOR */}
                      {item.type === 'choice' && (
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-1"><Layers className="h-3 w-3" /> Alternativas</span>
                            <button
                              type="button"
                              onClick={() => handleAddChoiceOption(item.id)}
                              className="text-[10px] font-bold text-amber-500 hover:underline"
                            >
                              + Añadir Alternativa
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {(item.options || []).map(opt => {
                              const isCorrect = item.correctValue === opt.id;
                              return (
                                <div key={opt.id} className={`flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border transition ${isCorrect ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-slate-800'}`}>
                                  <input 
                                    type="radio" 
                                    name={`correct_${item.id}`}
                                    checked={isCorrect}
                                    onChange={() => handleChangeItem(item.id, 'correctValue', opt.id)}
                                    className="h-4 w-4 text-indigo-650 bg-slate-800 border-slate-700 cursor-pointer focus:ring-0"
                                    title="Marcar como clave correcta"
                                  />
                                  <input 
                                    type="text" 
                                    value={opt.label}
                                    onChange={e => handleEditChoiceOption(item.id, opt.id, e.target.value)}
                                    className="flex-1 bg-transparent border-none p-0 text-xs font-semibold text-slate-200 outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveChoiceOption(item.id, opt.id)}
                                    className="text-slate-500 hover:text-rose-500 transition"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 2. MATCHING PAIRS EDITOR */}
                      {item.type === 'matching' && (
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-1"><Link className="h-3 w-3" /> Columnas a Relacionar</span>
                            <button
                              type="button"
                              onClick={() => handleAddMatchingPair(item.id)}
                              className="text-[10px] font-bold text-amber-500 hover:underline"
                            >
                              + Añadir Pareja
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            {(item.subQuestions || []).map((pair, pIdx) => (
                              <div key={pair.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 items-center">
                                <div className="sm:col-span-1 text-[10px] font-bold text-slate-500 text-center">
                                  #{pIdx + 1}
                                </div>
                                <div className="sm:col-span-5">
                                  <input 
                                    type="text" 
                                    value={pair.text}
                                    placeholder="Concepto A"
                                    onChange={e => handleEditMatchingPair(item.id, pair.id, 'text', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div className="sm:col-span-1 text-center text-slate-650 font-bold text-xs">
                                  ↔
                                </div>
                                <div className="sm:col-span-4">
                                  <input 
                                    type="text" 
                                    value={pair.correctValue}
                                    placeholder="Su pareja..."
                                    onChange={e => handleEditMatchingPair(item.id, pair.id, 'correctValue', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-amber-400 font-bold outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div className="sm:col-span-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMatchingPair(item.id, pair.id)}
                                    className="text-slate-500 hover:text-rose-500 transition"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. OPEN QUESTION (ABC RANGES) GUIDE */}
                      {item.type === 'abc' && (
                        <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-850 flex items-start gap-2.5">
                          <AlignLeft className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-[10px] font-black uppercase text-indigo-300 block">Evaluación por Rango</span>
                            <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                              Esta pregunta se evaluará usando un rango de 3 opciones: <strong>Bien</strong> (100% de puntos), <strong>Más o menos</strong> (50% de puntos) y <strong>Mal</strong> (0 puntos).
                            </p>
                            <div className="mt-2">
                              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Respuesta Esperada / Clave sugerida (Opcional):</label>
                              <textarea
                                rows="2"
                                value={item.suggestedAnswer || ''}
                                onChange={e => handleChangeItem(item.id, 'suggestedAnswer', e.target.value)}
                                placeholder="Escribe aquí un resumen de la respuesta correcta para guiarte al calificar..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-355 focus:border-indigo-500 outline-none resize-none transition"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 4. SUBQUESTIONS ANIDATOR */}
                      {item.type === 'subquestions' && (
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-1"><Layers className="h-3 w-3" /> Subpreguntas del Ítem</span>
                            <button
                              type="button"
                              onClick={() => handleAddSubquestion(item.id)}
                              className="text-[10px] font-bold text-amber-500 hover:underline"
                            >
                              + Añadir Subpregunta
                            </button>
                          </div>

                          <div className="space-y-3.5">
                            {(item.subQuestions || []).map((sub, sIdx) => (
                              <div key={sub.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-855 space-y-3 relative">
                                <div className="flex items-start justify-between gap-2 border-b border-slate-900 pb-1.5">
                                  <span className="text-[9px] font-black text-slate-500 uppercase">
                                    Subpregunta {index + 1}.{sIdx + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSubquestion(item.id, sub.id)}
                                    className="text-slate-500 hover:text-rose-500 transition"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                  <div className="md:col-span-5">
                                    <input 
                                      type="text"
                                      required
                                      value={sub.text}
                                      placeholder="Enunciado de la subpregunta..."
                                      onChange={e => handleEditSubquestion(item.id, sub.id, 'text', e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                  <div className="md:col-span-3">
                                    <select
                                      value={sub.type || 'direct'}
                                      onChange={e => handleEditSubquestion(item.id, sub.id, 'type', e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-bold text-slate-350 outline-none"
                                    >
                                      <option value="direct">Directa (C / I)</option>
                                      <option value="choice">Alt. Múltiple</option>
                                      <option value="abc">Abierta (Bien/Medio/Mal)</option>
                                      <option value="numeric">Numérica</option>
                                    </select>
                                  </div>
                                  <div className="md:col-span-4">
                                    <select
                                      required
                                      disabled={!competenceId}
                                      value={sub.desempenoId}
                                      onChange={e => handleEditSubquestion(item.id, sub.id, 'desempenoId', e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 outline-none"
                                    >
                                      <option value="">🔗 Desempeño...</option>
                                      {selectedCompetence && (selectedCompetence.capacities || []).map(cap => (
                                        <optgroup key={cap.id} label={`CAP: ${(cap.name || '').substring(0, 20)}...`}>
                                          {(cap.desempenos || []).map(des => {
                                            const displayText = des.description || des.desc || '';
                                            return (
                                              <option key={des.id} value={des.id}>
                                                {displayText.length > 50 ? displayText.substring(0, 50) + '...' : displayText}
                                              </option>
                                            );
                                          })}
                                        </optgroup>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {/* Sub Choice Options Sub-editor */}
                                {sub.type === 'choice' && (
                                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 space-y-2 mt-1">
                                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                                      <span>Alternativas de Subpregunta</span>
                                      <button
                                        type="button"
                                        onClick={() => handleAddSubChoiceOption(item.id, sub.id)}
                                        className="text-amber-500 hover:underline"
                                      >
                                        + Añadir Opción
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {(sub.options || []).map(sopt => {
                                        const isCorrect = sub.correctValue === sopt.id;
                                        return (
                                          <div key={sopt.id} className={`flex items-center gap-2 bg-slate-950 p-2 rounded border ${isCorrect ? 'border-indigo-500/35 bg-indigo-500/5' : 'border-slate-800'}`}>
                                            <input 
                                              type="radio"
                                              name={`subcorrect_${sub.id}`}
                                              checked={isCorrect}
                                              onChange={() => handleEditSubquestion(item.id, sub.id, 'correctValue', sopt.id)}
                                              className="h-3.5 w-3.5 text-indigo-500 focus:ring-0 cursor-pointer"
                                            />
                                            <input 
                                              type="text"
                                              value={sopt.label}
                                              onChange={e => handleEditSubChoiceOption(item.id, sub.id, sopt.id, e.target.value)}
                                              className="flex-1 bg-transparent border-none p-0 text-[11px] text-slate-300 outline-none"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveSubChoiceOption(item.id, sub.id, sopt.id)}
                                              className="text-slate-500 hover:text-rose-500"
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {sub.type === 'abc' && (
                                  <div className="mt-2 text-left">
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Respuesta Esperada / Clave sugerida (Opcional):</label>
                                    <input 
                                      type="text"
                                      value={sub.suggestedAnswer || ''}
                                      placeholder="Ej: El cazador llevaba una semana sin cazar nada."
                                      onChange={e => handleEditSubquestion(item.id, sub.id, 'suggestedAnswer', e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );})}
              </div>

              <button 
                type="button"
                onClick={handleAddItem}
                className="mt-4 flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2.5 rounded-xl border border-indigo-500/20 transition-transform active:scale-95 shadow-lg shadow-indigo-955/20"
              >
                <Plus className="h-4 w-4" /> Añadir Ítem / Pregunta
              </button>
            </div>}
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
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-2 rounded-lg font-bold text-sm transition"
            >
              <CheckCircle2 className="h-4 w-4" /> Guardar Instrumento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
