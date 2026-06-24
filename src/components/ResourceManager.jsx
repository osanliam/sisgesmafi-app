import React, { useState, useContext } from 'react';
import { DatabaseContext } from '../context/DatabaseContext';
import { Boxes, CalendarDays, Plus, HelpCircle, Pencil, Trash2, X } from 'lucide-react';

function ResourceManager() {
  const { 
    resources, 
    addResource, 
    updateResource, 
    deleteResource, 
    reserveResource, 
    deleteReservation, 
    teachers 
  } = useContext(DatabaseContext);

  // Reservation form states
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || '');
  const [reserveDate, setReserveDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('08:00 - 10:00');
  const [purpose, setPurpose] = useState('');

  const [showReserveModal, setShowReserveModal] = useState(false);

  // New resource creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Equipo');
  const [newLocation, setNewLocation] = useState('');
  const [newStatus, setNewStatus] = useState('disponible');

  // Resource editing states
  const [editingResource, setEditingResource] = useState(null);

  const handleReserve = (e) => {
    e.preventDefault();
    if (!selectedResourceId || !teacherId || !purpose) {
      return alert('Complete todos los datos de la reserva.');
    }

    reserveResource(selectedResourceId, {
      teacherId,
      date: reserveDate,
      timeSlot,
      purpose
    });

    setPurpose('');
    setShowReserveModal(false);
    alert('Reserva guardada con éxito.');
  };

  const handleCreateResource = (e) => {
    e.preventDefault();
    if (!newName || !newLocation) {
      return alert('Por favor complete los campos obligatorios.');
    }

    addResource({
      name: newName,
      type: newType,
      location: newLocation,
      status: newStatus
    });

    setNewName('');
    setNewType('Equipo');
    setNewLocation('');
    setNewStatus('disponible');
    setShowCreateModal(false);
    alert('Recurso creado con éxito.');
  };

  const handleDeleteResource = (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este recurso? Se perderán todas sus reservas asociadas.')) {
      deleteResource(id);
      alert('Recurso eliminado con éxito.');
    }
  };

  const handleCancelReservation = (resourceId, reservationId) => {
    if (window.confirm('¿Está seguro de que desea cancelar esta reserva?')) {
      deleteReservation(resourceId, reservationId);
      alert('Reserva cancelada con éxito.');
    }
  };

  const openReserve = (resId) => {
    setSelectedResourceId(resId);
    setShowReserveModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Recursos e Inventario</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gestión de aulas, laboratorios y préstamo de equipos tecnológicos.</p>
        </div>
        <div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-neuro-primary flex items-center gap-1.5 text-xs py-2 px-3.5"
          >
            <Plus className="h-4 w-4" />
            Nuevo Recurso
          </button>
        </div>
      </div>

      {/* Booking Form Card */}
      {showReserveModal && (
        <form onSubmit={handleReserve} className="glass-card p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <h4 className="font-bold border-b border-slate-100 pb-3 dark:border-slate-800">Programar Préstamo / Reserva</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Recurso seleccionado</label>
              <select 
                value={selectedResourceId} onChange={(e) => setSelectedResourceId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 font-bold"
              >
                {resources.map(res => (
                  <option key={res.id} value={res.id}>{res.name} ({res.type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Docente Solicitante</label>
              <select 
                value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 font-bold">Fecha</label>
              <input 
                type="date" value={reserveDate} onChange={(e) => setReserveDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Módulo Horario</label>
              <select 
                value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
              >
                <option value="08:00 - 10:00">08:00 - 10:00</option>
                <option value="10:00 - 12:00">10:00 - 12:00</option>
                <option value="12:00 - 14:00">12:00 - 14:00</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Finalidad / Curso</label>
              <input 
                type="text" required placeholder="e.g. Laboratorio de Física Avanzada..." value={purpose} onChange={(e) => setPurpose(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={() => setShowReserveModal(false)} className="btn-neuro-secondary text-xs">Cancelar</button>
            <button type="submit" className="btn-neuro-primary text-xs">Guardar Reserva</button>
          </div>
        </form>
      )}

      {/* Inventory Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {resources.map(res => (
          <div key={res.id} className="glass-card p-6 space-y-4 flex flex-col justify-between">
            
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-slate-400">
                  {res.type}
                </span>
                
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                    res.status === 'disponible' 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                      : res.status === 'mantenimiento'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                  }`}>
                    {res.status}
                  </span>
                  
                  <button 
                    onClick={() => setEditingResource(res)}
                    className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    title="Editar recurso"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteResource(res.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                    title="Eliminar recurso"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="font-bold text-lg text-slate-900 dark:text-white leading-snug">{res.name}</h4>
              <p className="text-xs text-slate-400 font-medium">Ubicación: {res.location}</p>
            </div>

            {/* List Reservations */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Reservas Agendadas:</span>
              {res.reservations.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Sin reservas programadas</span>
              ) : (
                res.reservations.map(resrv => {
                  const teacher = teachers.find(t => t.id === resrv.teacherId);
                  return (
                    <div key={resrv.id} className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl text-[10px] border border-slate-150/40 space-y-0.5 flex justify-between items-start gap-2">
                      <div className="flex-1 space-y-0.5">
                        <p className="font-bold text-slate-800 dark:text-slate-200">📅 {resrv.date} ({resrv.timeSlot})</p>
                        <p className="text-slate-400 font-medium">Finalidad: {resrv.purpose}</p>
                        {teacher && <p className="text-indigo-600 dark:text-indigo-400 font-bold">Solicitante: {teacher.name}</p>}
                      </div>
                      <button
                        onClick={() => handleCancelReservation(res.id, resrv.id)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded transition shrink-0 mt-0.5"
                        title="Cancelar reserva"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <button 
              onClick={() => openReserve(res.id)}
              className="w-full btn-neuro-secondary flex items-center justify-center gap-1.5 text-xs py-2 mt-4"
            >
              <CalendarDays className="h-4 w-4" />
              Reservar Recurso
            </button>

          </div>
        ))}
      </div>

      {/* Create Resource Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="glass-card p-6 max-w-md w-full space-y-4 shadow-2xl border border-white/20">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
              <h4 className="font-extrabold text-lg text-slate-900 dark:text-white">Registrar Nuevo Recurso</h4>
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold line-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateResource} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Nombre del Recurso *</label>
                <input 
                  type="text" required value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Proyector EPSON B, Aula 102"
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Tipo</label>
                <select 
                  value={newType} onChange={(e) => setNewType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                >
                  <option value="Equipo">Equipo</option>
                  <option value="Espacio">Espacio</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Ubicación *</label>
                <input 
                  type="text" required value={newLocation} 
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Pabellón B 2do Piso"
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Estado Inicial</label>
                <select 
                  value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                >
                  <option value="disponible">Disponible</option>
                  <option value="prestado">Prestado</option>
                  <option value="mantenimiento">Mantenimiento</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-neuro-secondary text-xs">Cancelar</button>
                <button type="submit" className="btn-neuro-primary text-xs">Crear Recurso</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Resource Modal */}
      {editingResource && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="glass-card p-6 max-w-md w-full space-y-4 shadow-2xl border border-white/20">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 dark:border-slate-800">
              <h4 className="font-extrabold text-lg text-slate-900 dark:text-white">Modificar Recurso</h4>
              <button 
                type="button" 
                onClick={() => setEditingResource(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold line-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!editingResource.name || !editingResource.location) {
                return alert('Complete todos los campos obligatorios.');
              }
              updateResource(editingResource.id, editingResource);
              setEditingResource(null);
              alert('Recurso actualizado con éxito.');
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5 font-bold">Nombre del Recurso *</label>
                <input 
                  type="text" required value={editingResource.name || ''} 
                  onChange={(e) => setEditingResource({ ...editingResource, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Tipo</label>
                <select 
                  value={editingResource.type || 'Equipo'} 
                  onChange={(e) => setEditingResource({ ...editingResource, type: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                >
                  <option value="Equipo">Equipo</option>
                  <option value="Espacio">Espacio</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Ubicación *</label>
                <input 
                  type="text" required value={editingResource.location || ''} 
                  onChange={(e) => setEditingResource({ ...editingResource, location: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Estado</label>
                <select 
                  value={editingResource.status || 'disponible'} 
                  onChange={(e) => setEditingResource({ ...editingResource, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                >
                  <option value="disponible">Disponible</option>
                  <option value="prestado">Prestado</option>
                  <option value="mantenimiento">Mantenimiento</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingResource(null)} className="btn-neuro-secondary text-xs">Cancelar</button>
                <button type="submit" className="btn-neuro-primary text-xs">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default ResourceManager;
