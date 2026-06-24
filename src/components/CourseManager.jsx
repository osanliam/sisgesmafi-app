import React, { useState, useContext } from 'react';
import { DatabaseContext } from '../context/DatabaseContext';
import { Plus, BookOpen, Clock, CalendarRange, Check, BarChart4, Pencil, Trash2 } from 'lucide-react';

function CourseManager() {
  const { courses, teachers, addCourse, updateCourse, deleteCourse } = useContext(DatabaseContext);

  // Form states
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseGrade, setNewCourseGrade] = useState('1ro Secundaria');
  const [newCourseSection, setNewCourseSection] = useState('Todas');
  const [newCourseTeacher, setNewCourseTeacher] = useState('');

  const [editingCourse, setEditingCourse] = useState(null);

  // Assignment states
  const [addingAsgCourseId, setAddingAsgCourseId] = useState(null);
  const [asgTeacher, setAsgTeacher] = useState('');
  const [asgGrade, setAsgGrade] = useState('1ro Secundaria');
  const [asgSections, setAsgSections] = useState([]);

  // Dedicated curriculum editor modal state
  const [curricularEditorCourse, setCurricularEditorCourse] = useState(null);
  const [selectedCompId, setSelectedCompId] = useState('');
  
  // Adding state
  const [newCompName, setNewCompName] = useState('');
  const [newCompWeight, setNewCompWeight] = useState(30);
  const [newCapName, setNewCapName] = useState('');
  const [newDesDesc, setNewDesDesc] = useState({}); // { capacityId: '' }

  // Editing state (inline edit)
  const [editingCompId, setEditingCompId] = useState(null);
  const [editingCompName, setEditingCompName] = useState('');
  const [editingCompWeight, setEditingCompWeight] = useState(30);

  const [editingCapId, setEditingCapId] = useState(null);
  const [editingCapName, setEditingCapName] = useState('');

  const [editingDesId, setEditingDesId] = useState(null);
  const [editingDesDesc, setEditingDesDesc] = useState('');

  // Schedule editor state
  const [editingScheduleCourseId, setEditingScheduleCourseId] = useState(null);
  const [schedDay, setSchedDay] = useState('Lunes');
  const [schedTime, setSchedTime] = useState('08:00 - 09:30');
  const [schedClassroom, setSchedClassroom] = useState('Aula 101');

  // Active view tab: mesh vs schedule grid
  const [viewMode, setViewMode] = useState('mesh'); // mesh, schedule

  const handleCreateCourse = (e) => {
    e.preventDefault();
    if (!newCourseName) return alert('Por favor ingrese el nombre del curso.');
    
    addCourse({
      name: newCourseName,
      assignments: [],
      competencies: [],
      schedule: []
    });

    setNewCourseName('');
    setShowAddCourse(false);
  };

  // CNEB Curricular Hierarchy Handlers (Competencias -> Capacidades -> Desempeños)
  const handleAddCompetence = (courseId) => {
    if (!newCompName.trim()) return alert('Ingrese el nombre de la competencia.');
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const newComp = {
      id: `comp_${Date.now()}`,
      name: newCompName.trim(),
      weight: parseInt(newCompWeight) || 0,
      capacities: []
    };

    const updated = [...(course.competencies || []), newComp];
    updateCourse(courseId, { competencies: updated });
    setNewCompName('');
    setNewCompWeight(30);
    setSelectedCompId(newComp.id);

    // Sync state for modal
    if (curricularEditorCourse && curricularEditorCourse.id === courseId) {
      setCurricularEditorCourse({ ...curricularEditorCourse, competencies: updated });
    }
  };

  const handleUpdateCompetence = (courseId, compId) => {
    if (!editingCompName.trim()) return alert('El nombre no puede estar vacío.');
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const updatedComps = (course.competencies || []).map(comp => {
      if (comp.id === compId) {
        return {
          ...comp,
          name: editingCompName.trim(),
          weight: parseInt(editingCompWeight) || 0
        };
      }
      return comp;
    });

    updateCourse(courseId, { competencies: updatedComps });
    setEditingCompId(null);

    // Sync state for modal
    if (curricularEditorCourse && curricularEditorCourse.id === courseId) {
      setCurricularEditorCourse({ ...curricularEditorCourse, competencies: updatedComps });
    }
  };

  const handleDeleteCompetence = (courseId, compId) => {
    if (!window.confirm('¿Está seguro de eliminar esta competencia? Se eliminarán todas sus capacidades e indicadores.')) return;
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const updated = (course.competencies || []).filter(c => c.id !== compId);
    updateCourse(courseId, { competencies: updated });
    if (selectedCompId === compId) {
      setSelectedCompId(updated.length > 0 ? updated[0].id : '');
    }

    // Sync state for modal
    if (curricularEditorCourse && curricularEditorCourse.id === courseId) {
      setCurricularEditorCourse({ ...curricularEditorCourse, competencies: updated });
    }
  };

  const handleAddCapacity = (courseId, compId) => {
    if (!newCapName.trim()) return alert('Ingrese el nombre de la capacidad.');
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const newCap = {
      id: `cap_${Date.now()}`,
      name: newCapName.trim(),
      desempenos: []
    };

    const updatedComps = (course.competencies || []).map(comp => {
      if (comp.id === compId) {
        return {
          ...comp,
          capacities: [...(comp.capacities || []), newCap]
        };
      }
      return comp;
    });

    updateCourse(courseId, { competencies: updatedComps });
    setNewCapName('');

    // Sync state for modal
    if (curricularEditorCourse && curricularEditorCourse.id === courseId) {
      setCurricularEditorCourse({ ...curricularEditorCourse, competencies: updatedComps });
    }
  };

  const handleUpdateCapacity = (courseId, compId, capId) => {
    if (!editingCapName.trim()) return alert('El nombre no puede estar vacío.');
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const updatedComps = (course.competencies || []).map(comp => {
      if (comp.id === compId) {
        const updatedCaps = (comp.capacities || []).map(cap => {
          if (cap.id === capId) {
            return { ...cap, name: editingCapName.trim() };
          }
          return cap;
        });
        return { ...comp, capacities: updatedCaps };
      }
      return comp;
    });

    updateCourse(courseId, { competencies: updatedComps });
    setEditingCapId(null);

    // Sync state for modal
    if (curricularEditorCourse && curricularEditorCourse.id === courseId) {
      setCurricularEditorCourse({ ...curricularEditorCourse, competencies: updatedComps });
    }
  };

  const handleDeleteCapacity = (courseId, compId, capId) => {
    if (!window.confirm('¿Está seguro de eliminar esta capacidad? Se eliminarán todos sus desempeños.')) return;
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const updatedComps = (course.competencies || []).map(comp => {
      if (comp.id === compId) {
        const updatedCaps = (comp.capacities || []).filter(cap => cap.id !== capId);
        return { ...comp, capacities: updatedCaps };
      }
      return comp;
    });

    updateCourse(courseId, { competencies: updatedComps });

    // Sync state for modal
    if (curricularEditorCourse && curricularEditorCourse.id === courseId) {
      setCurricularEditorCourse({ ...curricularEditorCourse, competencies: updatedComps });
    }
  };

  const handleAddDesempeno = (courseId, compId, capId) => {
    const desc = newDesDesc[capId];
    if (!desc || !desc.trim()) return alert('Ingrese la descripción del desempeño.');
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const newDes = {
      id: `des_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      description: desc.trim()
    };

    const updatedComps = (course.competencies || []).map(comp => {
      if (comp.id === compId) {
        const updatedCaps = (comp.capacities || []).map(cap => {
          if (cap.id === capId) {
            return {
              ...cap,
              desempenos: [...(cap.desempenos || []), newDes]
            };
          }
          return cap;
        });
        return { ...comp, capacities: updatedCaps };
      }
      return comp;
    });

    updateCourse(courseId, { competencies: updatedComps });
    setNewDesDesc(prev => ({ ...prev, [capId]: '' }));

    // Sync state for modal
    if (curricularEditorCourse && curricularEditorCourse.id === courseId) {
      setCurricularEditorCourse({ ...curricularEditorCourse, competencies: updatedComps });
    }
  };

  const handleUpdateDesempeno = (courseId, compId, capId, desId) => {
    if (!editingDesDesc.trim()) return alert('La descripción no puede estar vacía.');
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const updatedComps = (course.competencies || []).map(comp => {
      if (comp.id === compId) {
        const updatedCaps = (comp.capacities || []).map(cap => {
          if (cap.id === capId) {
            const updatedDes = (cap.desempenos || []).map(des => {
              if (des.id === desId) {
                return { ...des, description: editingDesDesc.trim() };
              }
              return des;
            });
            return { ...cap, desempenos: updatedDes };
          }
          return cap;
        });
        return { ...comp, capacities: updatedCaps };
      }
      return comp;
    });

    updateCourse(courseId, { competencies: updatedComps });
    setEditingDesId(null);

    // Sync state for modal
    if (curricularEditorCourse && curricularEditorCourse.id === courseId) {
      setCurricularEditorCourse({ ...curricularEditorCourse, competencies: updatedComps });
    }
  };

  const handleDeleteDesempeno = (courseId, compId, capId, desId) => {
    if (!window.confirm('¿Está seguro de eliminar este desempeño?')) return;
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const updatedComps = (course.competencies || []).map(comp => {
      if (comp.id === compId) {
        const updatedCaps = (comp.capacities || []).map(cap => {
          if (cap.id === capId) {
            const updatedDes = (cap.desempenos || []).filter(des => des.id !== desId);
            return { ...cap, desempenos: updatedDes };
          }
          return cap;
        });
        return { ...comp, capacities: updatedCaps };
      }
      return comp;
    });

    updateCourse(courseId, { competencies: updatedComps });

    // Sync state for modal
    if (curricularEditorCourse && curricularEditorCourse.id === courseId) {
      setCurricularEditorCourse({ ...curricularEditorCourse, competencies: updatedComps });
    }
  };

  const handleAddSchedule = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const newSlot = {
      day: schedDay,
      time: schedTime,
      classroom: schedClassroom
    };

    const updatedSchedule = [...(course.schedule || []), newSlot];
    updateCourse(courseId, { schedule: updatedSchedule });
  };

  const handleDeleteSchedule = (courseId, index) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    const updated = course.schedule.filter((_, idx) => idx !== index);
    updateCourse(courseId, { schedule: updated });
  };

  // Compile weekly timetable mapping
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const timeSlots = ['08:00 - 09:30', '10:00 - 11:30', '12:00 - 13:30'];

  return (
    <div className="space-y-6 text-white min-h-screen bg-[#060a14] p-4 sm:p-8">

      <style>{`
        .glass-card-ecc {
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
        }
        .tint-cyan { background: rgba(0, 240, 255, 0.03); border-color: rgba(0, 240, 255, 0.15); }
        .tint-magenta { background: rgba(254, 0, 254, 0.03); border-color: rgba(254, 0, 254, 0.15); }
        .tint-lime { background: rgba(0, 247, 166, 0.03); border-color: rgba(0, 247, 166, 0.15); }

        .glow-cyan { filter: drop-shadow(0 0 8px rgba(0, 240, 255, 0.6)); }
        .glow-magenta { filter: drop-shadow(0 0 8px rgba(254, 0, 254, 0.6)); }
        .glow-lime { filter: drop-shadow(0 0 8px rgba(0, 247, 166, 0.6)); }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>

      
      {/* Module Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="glass-card-ecc tint-magenta p-6 rounded-3xl w-full sm:w-auto border-l-4 border-l-kinetic-magenta relative overflow-hidden">
          <div className="absolute -right-4 -top-4 h-24 w-24 bg-kinetic-magenta/20 rounded-full blur-2xl"></div>
          <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-kinetic-magenta glow-magenta" />
            Cursos y Horarios
          </h2>
          <p className="text-kinetic-magenta font-bold text-sm mt-1">
            Gestione el plan curricular, asigne docentes y estructure los horarios.
          </p>
        </div>

        {/* Action Toggle buttons */}
        <div className="flex items-center gap-3">
          <div className="bg-transparent/10  p-1 rounded-xl text-xs font-semibold flex">
            <button 
              onClick={() => setViewMode('mesh')}
              className={`px-3 py-1.5 rounded-lg transition ${viewMode === 'mesh' ? 'bg-transparent  text-kinetic-cyan shadow' : 'text-slate-500 hover:text-slate-200'}`}
            >
              Mallas Curriculares
            </button>
            <button 
              onClick={() => setViewMode('schedule')}
              className={`px-3 py-1.5 rounded-lg transition ${viewMode === 'schedule' ? 'bg-transparent  text-kinetic-cyan shadow' : 'text-slate-500 hover:text-slate-200'}`}
            >
              Horario Integrado
            </button>
          </div>
          
          <button 
            onClick={() => setShowAddCourse(!showAddCourse)}
            className="px-6 py-3 rounded-xl bg-kinetic-cyan hover:bg-cyan-400 text-white text-xs font-black tracking-widest transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] py-1.5 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Crear Curso
          </button>
        </div>
      </div>

      {/* Add Course Form */}
      {showAddCourse && (
        <form onSubmit={handleCreateCourse} className="glass-card p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <h4 className="font-bold border-b border-white/10 pb-4">Crear Curso Nuevo</h4>
          <div className="max-w-md">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Nombre de la Asignatura / Curso</label>
              <input 
                type="text" required placeholder="Ej: Comunicación, Matemáticas, etc." value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-transparent/50 px-3.5 py-2.5 text-sm focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan  "
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10 ">
            <button type="button" onClick={() => setShowAddCourse(false)} className="px-6 py-3 rounded-xl bg-transparent/5 hover:bg-transparent/10 text-white text-xs font-black tracking-wider transition-colors border border-white/10">Cancelar</button>
            <button type="submit" className="px-6 py-3 rounded-xl bg-kinetic-cyan hover:bg-cyan-400 text-white text-xs font-black tracking-widest transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)]">Crear Asignatura</button>
          </div>
        </form>
      )}

      {/* Mode 1: Curriculum Meshes List */}
      {viewMode === 'mesh' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {courses.map(course => {
            return (
              <div key={course.id} className="glass-card p-6 space-y-4">
                
                <div className="flex justify-between items-start border-b border-white/10 pb-4">
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-2xl tracking-tight text-white">{course.name}</h3>
                        <div className="flex gap-1 animate-in fade-in">
                          <button 
                            onClick={() => setEditingCourse(course)}
                            className="p-1 rounded text-slate-400 hover:text-kinetic-cyan hover:bg-transparent/5 dark:hover:bg-slate-800 transition"
                            title="Editar Nombre del Curso"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm(`¿Está seguro de eliminar el curso ${course.name}?\nSe eliminarán todas las asignaciones horarias y competencias.`)) {
                                deleteCourse(course.id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-transparent/5 dark:hover:bg-slate-800 transition"
                            title="Eliminar Curso"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setAddingAsgCourseId(addingAsgCourseId === course.id ? null : course.id);
                          setAsgTeacher('');
                          setAsgSections([]);
                        }}
                        className="btn-neuro-primary text-[10px] py-1 px-2.5 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Asignar Docente
                      </button>
                    </div>

                    <div className="space-y-1.5 mt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Docentes y Secciones Asignados:</span>
                      
                      {(course.assignments || []).map((asg, idx) => {
                        const teacher = teachers.find(t => t.id === asg.teacherId);
                        return (
                          <div key={idx} className="flex flex-wrap items-center justify-between gap-2 bg-transparent/5 /40 p-2.5 rounded-xl border border-white/10 /30 text-xs">
                            <span className="font-bold text-slate-300 dark:text-slate-200">
                              {teacher?.name || 'Docente'} ({asg.gradeLevel})
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-transparent/5 bg-transparent/5 text-cyan-400 dark:text-cyan-200 font-extrabold px-2 py-0.5 rounded border border-kinetic-cyan/20">
                                Secciones: {asg.sections ? asg.sections.join(', ') : 'Ninguna'}
                              </span>
                              <button 
                                type="button"
                                onClick={() => {
                                  if (window.confirm('¿Está seguro de quitar esta asignación?')) {
                                    const updated = course.assignments.filter((_, i) => i !== idx);
                                    updateCourse(course.id, { assignments: updated });
                                  }
                                }}
                                className="text-[10px] text-rose-500 font-bold hover:underline ml-1"
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {(!course.assignments || course.assignments.length === 0) && (
                        <span className="text-xs text-slate-400 italic block py-1">Sin docentes asignados</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-form to Add Assignment */}
                {addingAsgCourseId === course.id && (
                  <div className="p-4 bg-transparent/5/50 /60 rounded-2xl border border-white/10/50 /60 space-y-3.5 animate-in fade-in duration-200 text-xs">
                    <p className="font-extrabold text-slate-200 dark:text-slate-200 uppercase text-[10px] tracking-wider">Nueva Asignación de Docente</p>
                    
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Docente</label>
                      <select 
                        value={asgTeacher} 
                        onChange={(e) => setAsgTeacher(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-transparent/70   px-3 py-2 text-xs font-semibold"
                      >
                        <option value="">Seleccione Docente</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Grado</label>
                        <select 
                          value={asgGrade} 
                          onChange={(e) => setAsgGrade(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-transparent/70   px-3 py-2 text-xs font-semibold"
                        >
                          <option value="1ro Secundaria">1ro Secundaria</option>
                          <option value="2do Secundaria">2do Secundaria</option>
                          <option value="3ro Secundaria">3ro Secundaria</option>
                          <option value="4to Secundaria">4to Secundaria</option>
                          <option value="5to Secundaria">5to Secundaria</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Secciones</label>
                        <div className="flex flex-wrap gap-2 pt-1.5">
                          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(sec => {
                            const isChecked = asgSections.includes(sec);
                            return (
                              <label key={sec} className="flex items-center gap-1 cursor-pointer select-none font-bold">
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setAsgSections(asgSections.filter(s => s !== sec));
                                    } else {
                                      setAsgSections([...asgSections, sec]);
                                    }
                                  }}
                                  className="rounded h-4 w-4 text-kinetic-cyan focus:ring-kinetic-cyan"
                                />
                                <span>{sec}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3.5 border-t border-white/10/30 /40">
                      <button 
                        type="button" 
                        onClick={() => setAddingAsgCourseId(null)}
                        className="px-3 py-2 bg-transparent/10 hover:bg-transparent/20  dark:hover:bg-slate-700 rounded-xl font-bold transition active:scale-95"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          if (!asgTeacher) return alert('Por favor, seleccione un docente.');
                          if (asgSections.length === 0) return alert('Por favor, seleccione al menos una sección.');
                          
                          const newAsg = {
                            teacherId: asgTeacher,
                            gradeLevel: asgGrade,
                            sections: asgSections
                          };
                          const updated = [...(course.assignments || []), newAsg];
                          updateCourse(course.id, { assignments: updated });
                          
                          setAsgTeacher('');
                          setAsgSections([]);
                          setAddingAsgCourseId(null);
                        }}
                        className="px-3 py-2 bg-kinetic-cyan hover:bg-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.4)] text-white rounded-xl font-bold transition active:scale-95"
                      >
                        Asignar
                      </button>
                    </div>
                  </div>
                )}

                {/* 1. Competencies Summary Panel */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      Plan Curricular (CNEB)
                    </span>
                    <button 
                      type="button"
                      onClick={() => {
                        setCurricularEditorCourse(course);
                        if (course.competencies && course.competencies.length > 0) {
                          setSelectedCompId(course.competencies[0].id);
                        } else {
                          setSelectedCompId('');
                        }
                      }}
                      className="text-xs text-kinetic-cyan font-extrabold hover:underline flex items-center gap-1"
                    >
                      Gestionar Plan Curricular
                    </button>
                  </div>

                  {/* Summary Card Details */}
                  {(() => {
                    let compCount = course.competencies ? course.competencies.length : 0;
                    let capCount = 0;
                    let desCount = 0;
                    if (course.competencies) {
                      course.competencies.forEach(comp => {
                        if (comp.capacities) {
                          capCount += comp.capacities.length;
                          comp.capacities.forEach(cap => {
                            if (cap.desempenos) {
                              desCount += cap.desempenos.length;
                            }
                          });
                        } else if (comp.desempenos) {
                          desCount += comp.desempenos.length;
                        }
                      });
                    }

                    return (
                      <div className="bg-transparent/5/50 /40 p-3.5 rounded-xl border border-white/10/50 /20 text-xs flex items-center justify-between">
                        <div className="grid grid-cols-3 gap-4 text-center flex-1 pr-4">
                          <div>
                            <span className="block text-lg font-bold text-slate-300 dark:text-slate-200">{compCount}</span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Competencias</span>
                          </div>
                          <div className="border-x border-white/10/50 /50">
                            <span className="block text-lg font-bold text-slate-300 dark:text-slate-200">{capCount}</span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Capacidades</span>
                          </div>
                          <div>
                            <span className="block text-lg font-bold text-slate-300 dark:text-slate-200">{desCount}</span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Desempeños</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCurricularEditorCourse(course);
                            if (course.competencies && course.competencies.length > 0) {
                              setSelectedCompId(course.competencies[0].id);
                            } else {
                              setSelectedCompId('');
                            }
                          }}
                          className="bg-transparent/5 hover:bg-transparent/10 bg-transparent/5 dark:hover:bg-indigo-900/60 text-cyan-400 dark:text-cyan-200 font-bold px-3 py-2 rounded-xl border border-kinetic-cyan/20 transition hover:scale-105 active:scale-95 text-xs text-center shrink-0"
                        >
                          Configurar
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Schedule Panel */}
                <div className="space-y-3 pt-3 border-t border-white/10 ">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Programación Horaria:
                    </span>
                    <button 
                      onClick={() => setEditingScheduleCourseId(editingScheduleCourseId === course.id ? null : course.id)}
                      className="text-xs text-kinetic-cyan font-bold hover:underline"
                    >
                      {editingScheduleCourseId === course.id ? 'Cerrar' : '+ Programar'}
                    </button>
                  </div>

                  {editingScheduleCourseId === course.id && (
                    <div className="p-3 bg-transparent/5 /60 rounded-xl grid grid-cols-3 gap-2">
                      <select 
                        value={schedDay} onChange={(e) => setSchedDay(e.target.value)}
                        className="rounded-lg border border-white/10 bg-transparent px-2 py-1.5 text-xs  "
                      >
                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select 
                        value={schedTime} onChange={(e) => setSchedTime(e.target.value)}
                        className="rounded-lg border border-white/10 bg-transparent px-2 py-1.5 text-xs  "
                      >
                        {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input 
                        type="text" placeholder="Aula (e.g. 101)" value={schedClassroom} onChange={(e) => setSchedClassroom(e.target.value)}
                        className="rounded-lg border border-white/10 bg-transparent px-2 py-1.5 text-xs  "
                      />
                      <button 
                        type="button" 
                        onClick={() => handleAddSchedule(course.id)}
                        className="col-span-3 bg-kinetic-cyan hover:bg-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.4)] text-white rounded-lg py-1.5 text-xs font-bold mt-1"
                      >
                        Añadir Bloque Horario
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {course.schedule && course.schedule.map((slot, index) => (
                      <span 
                        key={index} 
                        className="bg-transparent/10  text-[10px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer hover:bg-rose-50 hover:text-rose-600 transition"
                        onClick={() => {
                          if (editingScheduleCourseId === course.id) {
                            handleDeleteSchedule(course.id, index);
                          }
                        }}
                        title={editingScheduleCourseId === course.id ? "Haga clic para eliminar" : ""}
                      >
                        📅 {slot.day} {slot.time} ({slot.classroom})
                        {editingScheduleCourseId === course.id && <span className="text-rose-500 font-bold ml-1">×</span>}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Mode 2: Timetable Schedule Grid */}
      {viewMode === 'schedule' && (
        <div className="glass-card-ecc p-8 rounded-[2rem] overflow-x-auto relative overflow-hidden">
          <div className="flex items-center gap-2 border-b border-white/10 pb-6 mb-6">
            <CalendarRange className="h-6 w-6 text-kinetic-cyan glow-cyan" />
            <h4 className="text-2xl font-black text-white">Horario Semanal Integrado</h4>
          </div>

          <table className="min-w-[700px] w-full border-collapse">
            <thead>
              <tr className="bg-transparent/5">
                <th className="border-b border-white/10 p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-32">Horario</th>
                {days.map(day => (
                  <th key={day} className="border-b border-white/10 p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => (
                <tr key={time} className="h-28">
                  <td className="border-r border-white/10 p-3 text-xs font-black text-white text-center bg-transparent/5">{time}</td>
                  {days.map(day => {
                    // Find course(s) scheduled in this day + time
                    const matches = [];
                    courses.forEach(c => {
                      c.schedule && c.schedule.forEach(slot => {
                        if (slot.day === day && slot.time === time) {
                          matches.push({ course: c, classroom: slot.classroom });
                        }
                      });
                    });

                    return (
                      <td key={day} className="border border-white/5 p-3 align-top bg-[#0b1326]/30">
                        <div className="space-y-1.5 h-full overflow-y-auto">
                          {matches.map(({ course, classroom }, idx) => {
                            const assignedTeachers = (course.assignments || []).map(asg => {
                              const t = teachers.find(teach => teach.id === asg.teacherId);
                              return t ? t.name : '';
                            }).filter(Boolean);
                            const teachersText = Array.from(new Set(assignedTeachers)).join(', ');

                            return (
                              <div key={idx} className="bg-transparent/5 border-l-4 border-kinetic-cyan p-3 rounded-xl text-[10px] space-y-1 font-semibold">
                                <p className="font-black text-white truncate">{course.name}</p>
                                <p className="text-slate-400 truncate">{classroom}</p>
                                {teachersText && <p className="text-slate-500 font-bold italic truncate">{teachersText}</p>}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 bg-[#060a14]/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="glass-card-ecc p-8 max-w-md w-full space-y-6 shadow-2xl rounded-[2rem]">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h4 className="font-extrabold text-2xl tracking-tight text-white">Modificar Datos del Curso</h4>
              <button 
                type="button" 
                onClick={() => setEditingCourse(null)}
                className="text-slate-400 hover:text-white text-3xl font-black transition"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!editingCourse.name) return alert('Por favor ingrese el nombre del curso.');
              updateCourse(editingCourse.id, { name: editingCourse.name });
              setEditingCourse(null);
              alert('Datos del curso actualizados con éxito.');
            }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Nombre del Curso</label>
                <input 
                  type="text" required value={editingCourse.name || ''} 
                  onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-transparent/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-4 ">
                <button 
                  type="button" 
                  onClick={() => setEditingCourse(null)} 
                  className="px-6 py-3 rounded-xl bg-transparent/5 hover:bg-transparent/10 text-white text-xs font-black tracking-wider transition-colors border border-white/10"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-3 rounded-xl bg-kinetic-cyan hover:bg-cyan-400 text-white text-xs font-black tracking-widest transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Curriculum Editor Modal */}
      {curricularEditorCourse && (
        <div className="fixed inset-0 bg-[#060a14]/80 backdrop-blur-lg flex items-center justify-center z-50 p-4 sm:p-6 md:p-8 animate-in fade-in duration-300">
          <div className="glass-card-ecc w-full max-w-7xl h-[90vh] rounded-[2rem] shadow-2xl border border-white/20 flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-transparent/5">
              <div>
                <h3 className="font-extrabold text-xl text-white dark:text-white flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-kinetic-cyan glow-cyan" />
                  Plan Curricular: <span className="text-kinetic-cyan dark:text-cyan-300">{curricularEditorCourse.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Define las competencias, capacidades e indicadores de logro bajo el enfoque CNEB.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setCurricularEditorCourse(null)}
                className="p-2 rounded-full hover:bg-transparent/10 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-300 dark:hover:text-slate-200 transition text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Body (Split Pane) */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Left Sidebar: Competencias List (30% width) */}
              <div className="w-full md:w-1/3 border-r border-white/10 flex flex-col bg-black/20 custom-scrollbar overflow-y-auto p-4 space-y-4">
                
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Competencias</h4>
                  {(() => {
                    const totalWeight = (curricularEditorCourse.competencies || []).reduce((acc, c) => acc + (c.weight || 0), 0);
                    return (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${totalWeight === 100 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'}`}>
                        Peso Total: {totalWeight}% / 100%
                      </span>
                    );
                  })()}
                </div>

                {/* Add Competencia Form */}
                <div className="bg-transparent/5 p-4 rounded-2xl border border-white/10 space-y-2.5">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Agregar Competencia</span>
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="Nombre de la competencia..." 
                      value={newCompName} 
                      onChange={(e) => setNewCompName(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-transparent/5 px-4 py-2.5 text-xs text-white focus:border-kinetic-magenta focus:ring-1 focus:ring-kinetic-magenta transition-all outline-none"
                    />
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="Peso %" 
                        value={newCompWeight} 
                        onChange={(e) => setNewCompWeight(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-transparent/5 px-4 py-2.5 text-xs text-white focus:border-kinetic-magenta focus:ring-1 focus:ring-kinetic-magenta transition-all outline-none"
                      />
                      <button 
                        type="button" 
                        onClick={() => handleAddCompetence(curricularEditorCourse.id)}
                        className="bg-kinetic-magenta text-white rounded-xl px-4 text-xs font-black transition active:scale-95 shrink-0 shadow-[0_0_10px_rgba(254,0,254,0.4)]"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                </div>

                {/* Competencias List */}
                <div className="space-y-2">
                  {(curricularEditorCourse.competencies || []).map(comp => {
                    const isSelected = selectedCompId === comp.id;
                    const isEditing = editingCompId === comp.id;

                    return (
                      <div 
                        key={comp.id} 
                        onClick={() => !isEditing && setSelectedCompId(comp.id)}
                        className={`group relative p-3.5 rounded-2xl border transition text-left cursor-pointer ${
                          isSelected 
                            ? 'bg-kinetic-magenta/10 border-kinetic-magenta/40 shadow-[0_0_10px_rgba(254,0,254,0.1)]' 
                            : 'bg-transparent/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="text" 
                              value={editingCompName} 
                              onChange={(e) => setEditingCompName(e.target.value)}
                              className="w-full rounded-lg border border-white/10 bg-transparent px-2 py-1 text-xs  "
                            />
                            <div className="flex gap-2">
                              <input 
                                type="number" 
                                value={editingCompWeight} 
                                onChange={(e) => setEditingCompWeight(e.target.value)}
                                className="w-20 rounded-lg border border-white/10 bg-transparent px-2 py-1 text-xs  "
                              />
                              <button 
                                type="button" 
                                onClick={() => handleUpdateCompetence(curricularEditorCourse.id, comp.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-2 text-[10px] font-bold"
                              >
                                Guardar
                              </button>
                              <button 
                                type="button" 
                                onClick={() => setEditingCompId(null)}
                                className="bg-transparent/20 dark:bg-slate-700 text-slate-300 dark:text-slate-200 rounded-lg px-2 text-[10px] font-bold"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <span className={`font-bold text-xs ${isSelected ? 'text-white font-black' : 'text-slate-300'}`}>
                                {comp.name}
                              </span>
                              <span className="shrink-0 text-[10px] font-black bg-transparent/10 px-2 py-0.5 rounded text-slate-300">
                                {comp.weight}%
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center pt-2">
                              <span className="text-[10px] text-slate-400">
                                {comp.capacities ? comp.capacities.length : 0} Capacidades
                              </span>
                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition duration-150">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCompId(comp.id);
                                    setEditingCompName(comp.name);
                                    setEditingCompWeight(comp.weight);
                                  }}
                                  className="text-[10px] text-slate-400 hover:text-kinetic-cyan font-bold"
                                >
                                  Editar
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCompetence(curricularEditorCourse.id, comp.id);
                                  }}
                                  className="text-[10px] text-rose-500 hover:text-rose-700 font-bold"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {(curricularEditorCourse.competencies || []).length === 0 && (
                    <div className="text-center py-6 text-slate-400 italic text-xs">
                      No hay competencias creadas aún.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Main Area: Selected Competency, Capacidades & Desempeños (70% width) */}
              <div className="w-full md:w-2/3 flex flex-col overflow-y-auto p-8 space-y-6 bg-transparent custom-scrollbar">
                {(() => {
                  const selectedComp = (curricularEditorCourse.competencies || []).find(c => c.id === selectedCompId);
                  
                  if (!selectedComp) {
                    return (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12 space-y-2">
                        <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-300" />
                        <p className="text-sm font-semibold">Seleccione una competencia de la lista para ver y gestionar sus capacidades e indicadores.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6 text-white min-h-screen bg-[#060a14] p-4 sm:p-8">

      <style>{`
        .glass-card-ecc {
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
        }
        .tint-cyan { background: rgba(0, 240, 255, 0.03); border-color: rgba(0, 240, 255, 0.15); }
        .tint-magenta { background: rgba(254, 0, 254, 0.03); border-color: rgba(254, 0, 254, 0.15); }
        .tint-lime { background: rgba(0, 247, 166, 0.03); border-color: rgba(0, 247, 166, 0.15); }

        .glow-cyan { filter: drop-shadow(0 0 8px rgba(0, 240, 255, 0.6)); }
        .glow-magenta { filter: drop-shadow(0 0 8px rgba(254, 0, 254, 0.6)); }
        .glow-lime { filter: drop-shadow(0 0 8px rgba(0, 247, 166, 0.6)); }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>

                      {/* Selected Comp Header */}
                      <div className="border-b border-white/10  pb-4">
                        <span className="text-[10px] font-black text-kinetic-cyan uppercase tracking-widest block mb-1">Competencia Seleccionada</span>
                        <h4 className="font-extrabold text-2xl tracking-tight text-white leading-snug">{selectedComp.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">Peso en promedio final: <strong className="text-slate-400 dark:text-slate-350">{selectedComp.weight}%</strong></p>
                      </div>

                      {/* Capacidades List */}
                      <div className="space-y-6 text-white min-h-screen bg-[#060a14] p-4 sm:p-8">

      <style>{`
        .glass-card-ecc {
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
        }
        .tint-cyan { background: rgba(0, 240, 255, 0.03); border-color: rgba(0, 240, 255, 0.15); }
        .tint-magenta { background: rgba(254, 0, 254, 0.03); border-color: rgba(254, 0, 254, 0.15); }
        .tint-lime { background: rgba(0, 247, 166, 0.03); border-color: rgba(0, 247, 166, 0.15); }

        .glow-cyan { filter: drop-shadow(0 0 8px rgba(0, 240, 255, 0.6)); }
        .glow-magenta { filter: drop-shadow(0 0 8px rgba(254, 0, 254, 0.6)); }
        .glow-lime { filter: drop-shadow(0 0 8px rgba(0, 247, 166, 0.6)); }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>

                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Capacidades e Indicadores de Logro</h5>
                        
                        {(selectedComp.capacities || []).map(cap => {
                          const isEditingCap = editingCapId === cap.id;
                          return (
                            <div key={cap.id} className="p-4 sm:p-5 bg-transparent/5 rounded-2xl border border-white/10 space-y-4">
                              
                              {/* Capacity Header */}
                              <div className="flex justify-between items-start gap-4 border-b border-white/10 pb-3">
                                <div className="flex-1">
                                  {isEditingCap ? (
                                    <div className="flex gap-2">
                                      <input 
                                        type="text" 
                                        value={editingCapName} 
                                        onChange={(e) => setEditingCapName(e.target.value)}
                                        className="flex-1 rounded-xl border border-white/10 bg-transparent px-3 py-1.5 text-xs font-semibold dark:border-slate-850 "
                                      />
                                      <button 
                                        type="button" 
                                        onClick={() => handleUpdateCapacity(curricularEditorCourse.id, selectedComp.id, cap.id)}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-3 text-xs font-bold active:scale-95"
                                      >
                                        Guardar
                                      </button>
                                      <button 
                                        type="button" 
                                        onClick={() => setEditingCapId(null)}
                                        className="bg-transparent/20 dark:bg-slate-700 text-slate-300 dark:text-slate-200 rounded-xl px-3 text-xs font-bold active:scale-95"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-start gap-2">
                                      <span className="text-xs font-bold bg-transparent/50/10 text-cyan-400 dark:text-cyan-200 px-2 py-0.5 rounded text-[10px] shrink-0 mt-0.5">Capacidad</span>
                                      <h6 className="font-extrabold text-sm text-slate-850 dark:text-slate-200 leading-snug">{cap.name}</h6>
                                    </div>
                                  )}
                                </div>

                                {!isEditingCap && (
                                  <div className="flex gap-2 shrink-0">
                                    <button 
                                      onClick={() => {
                                        setEditingCapId(cap.id);
                                        setEditingCapName(cap.name);
                                      }}
                                      className="text-xs text-slate-500 hover:text-kinetic-cyan font-bold"
                                    >
                                      Editar
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteCapacity(curricularEditorCourse.id, selectedComp.id, cap.id)}
                                      className="text-xs text-rose-500 hover:text-rose-700 font-bold"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Nested Desempeños */}
                              <div className="space-y-3 pl-4 border-l-2 border-kinetic-magenta/30">
                                <span className="text-[10px] font-black text-kinetic-cyan dark:text-cyan-300 uppercase tracking-widest block">Desempeños / Criterios de Evaluación</span>
                                
                                {(cap.desempenos || []).map(des => {
                                  const isEditingDes = editingDesId === des.id;

                                  return (
                                    <div key={des.id} className="group/des flex justify-between items-start gap-4 bg-black/30 p-4 rounded-xl border border-white/5 text-xs text-slate-300 leading-relaxed shadow-sm">
                                      {isEditingDes ? (
                                        <div className="flex-1 flex flex-col gap-2">
                                          <textarea 
                                            rows="3"
                                            value={editingDesDesc} 
                                            onChange={(e) => setEditingDesDesc(e.target.value)}
                                            className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-xs font-medium  "
                                          />
                                          <div className="flex gap-2 justify-end">
                                            <button 
                                              type="button" 
                                              onClick={() => handleUpdateDesempeno(curricularEditorCourse.id, selectedComp.id, cap.id, des.id)}
                                              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold active:scale-95"
                                            >
                                              Guardar
                                            </button>
                                            <button 
                                              type="button" 
                                              onClick={() => setEditingDesId(null)}
                                              className="bg-transparent/20 dark:bg-slate-700 text-slate-300 dark:text-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-bold active:scale-95"
                                            >
                                              Cancelar
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <span className="flex-1">• {des.description}</span>
                                          <div className="flex gap-1.5 shrink-0 opacity-0 group-hover/des:opacity-100 transition duration-150">
                                            <button 
                                              onClick={() => {
                                                setEditingDesId(des.id);
                                                setEditingDesDesc(des.description);
                                              }}
                                              className="text-[10px] text-slate-400 hover:text-kinetic-cyan font-bold"
                                            >
                                              Editar
                                            </button>
                                            <button 
                                              onClick={() => handleDeleteDesempeno(curricularEditorCourse.id, selectedComp.id, cap.id, des.id)}
                                              className="text-[10px] text-rose-400 hover:text-rose-600 font-bold"
                                            >
                                              Quitar
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}

                                {(cap.desempenos || []).length === 0 && (
                                  <p className="text-[11px] text-slate-400 italic pl-1">No hay criterios o desempeños para esta capacidad.</p>
                                )}

                                {/* Add Desempeño Input */}
                                <div className="flex gap-2 pt-2">
                                  <textarea 
                                    rows="2"
                                    placeholder="Describa el desempeño que demuestre el logro de esta capacidad..." 
                                    value={newDesDesc[cap.id] || ''} 
                                    onChange={(e) => setNewDesDesc({ ...newDesDesc, [cap.id]: e.target.value })}
                                    className="flex-1 rounded-xl border border-white/10 bg-transparent px-3 py-2 text-xs focus:ring-1 focus:ring-kinetic-cyan  "
                                  />
                                  <button 
                                    type="button" 
                                    onClick={() => handleAddDesempeno(curricularEditorCourse.id, selectedComp.id, cap.id)}
                                    className="bg-kinetic-cyan hover:bg-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.4)] text-white rounded-xl px-3 py-2 text-xs font-bold active:scale-95 shrink-0 h-fit self-end"
                                  >
                                    Añadir
                                  </button>
                                </div>

                              </div>

                            </div>
                          );
                        })}

                        {(selectedComp.capacities || []).length === 0 && (
                          <div className="text-center py-8 bg-transparent/5 /20 rounded-2xl border border-white/10  text-slate-400 italic text-xs">
                            No hay capacidades registradas en esta competencia.
                          </div>
                        )}
                      </div>

                      {/* Add Capacity Section */}
                      <div className="border-t border-white/10  pt-5 space-y-3">
                        <span className="text-xs font-extrabold text-slate-650 dark:text-slate-350 uppercase tracking-wider block">Agregar Nueva Capacidad</span>
                        <div className="flex gap-3">
                          <input 
                            type="text" 
                            placeholder="Nombre de la nueva capacidad..." 
                            value={newCapName} 
                            onChange={(e) => setNewCapName(e.target.value)}
                            className="flex-1 rounded-xl border border-white/10 bg-transparent/5/50 /60 px-3.5 py-2.5 text-xs focus:bg-transparent "
                          />
                          <button 
                            type="button" 
                            onClick={() => handleAddCapacity(curricularEditorCourse.id, selectedComp.id)}
                            className="bg-kinetic-cyan hover:bg-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.4)] text-white rounded-xl px-5 py-2 text-xs font-bold transition active:scale-95 shrink-0"
                          >
                            Agregar Capacidad
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-transparent/5 dark:bg-slate-950/20 border-t border-white/10  flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setCurricularEditorCourse(null)} 
                className="px-8 py-3 rounded-xl bg-kinetic-magenta hover:bg-fuchsia-500 text-white text-xs font-black tracking-widest transition-all shadow-[0_0_15px_rgba(254,0,254,0.4)]"
              >
                Cerrar Editor
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default CourseManager;
