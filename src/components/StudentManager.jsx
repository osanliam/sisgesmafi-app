import React, { useState, useContext, useRef } from 'react';
import { DatabaseContext } from '../context/DatabaseContext';
import { Download, Upload, Plus, Trash2, Pencil, Search, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';

function StudentManager({
  isEmbedded = false
}) {
  const { students, addStudent, updateStudent, deleteStudent, setStudents } = useContext(DatabaseContext);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal / Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    dni: '', name: '', email: '', gradeLevel: '1ro Secundaria', section: 'A', age: '', gender: 'Masculino',
    motherName: '', motherDni: '', motherPhone: '',
    fatherName: '', fatherDni: '', fatherPhone: '',
    avatar: ''
  });

  const [editingStudent, setEditingStudent] = useState(null);

  // Import feedback
  const [importStatus, setImportStatus] = useState(null); // null, 'loading', 'success', 'error'
  const [importCount, setImportCount] = useState(0);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.dni || !formData.name) return alert('Por favor complete DNI y Nombre.');

    // Auto-calculate parent attributes for backward compatibility
    const pName = formData.motherName || formData.fatherName || 'No asignado';
    const pPhone = formData.motherPhone || formData.fatherPhone || '';
    
    const newStudentData = {
      ...formData,
      parentName: pName,
      parentPhone: pPhone,
      parentEmail: '',
      email: formData.email || `${formData.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.')}@sga.edu`
    };

    addStudent(newStudentData);
    setFormData({
      dni: '', name: '', email: '', gradeLevel: '1ro Secundaria', section: 'A', age: '', gender: 'Masculino',
      motherName: '', motherDni: '', motherPhone: '',
      fatherName: '', fatherDni: '', fatherPhone: '',
      avatar: ''
    });
    setShowAddForm(false);
    alert('Estudiante registrado con éxito.');
  };

  // Download blank import template
  const handleDownloadTemplate = () => {
    window.open('/api/excel/template', '_blank');
  };

  // Upload and import XLSX file
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    setImportStatus('loading');

    try {
      const response = await axios.post('/api/excel/import-students', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success && response.data.students) {
        const imported = response.data.students;
        
        // Merge without overwriting duplicate DNIs (merging fields)
        let mergedList = [...students];
        let newCount = 0;

        imported.forEach(imp => {
          const matchIdx = mergedList.findIndex(s => s.dni === imp.dni);
          if (matchIdx > -1) {
            // Update existing parent info or fields if not present
            mergedList[matchIdx] = { ...mergedList[matchIdx], ...imp };
          } else {
            // Create a new record with standard avatar
            const isMale = imp.gender === 'Masculino';
            mergedList.push({
              id: `std_${imp.dni}`,
              avatar: isMale ? '/avatar_male.webp' : '/avatar_female.webp',
              ...imp
            });
            newCount++;
          }
        });

        setStudents(mergedList);
        localStorage.setItem('sga_students', JSON.stringify(mergedList));
        
        // Sync with the server central db.json
        try {
          await axios.post('/api/db/save', {
            collectionName: 'students',
            data: mergedList
          });
        } catch (err) {
          console.error('Failed to sync imported students with server:', err);
        }
        
        setImportCount(newCount);
        setImportStatus('success');
      } else {
        setImportStatus('error');
      }
    } catch (error) {
      console.error('Failed to import Excel:', error);
      setImportStatus('error');
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    // Clear status toast after 4s
    setTimeout(() => setImportStatus(null), 4000);
  };

  // Filter students based on search
  const filteredStudents = students.filter(std => 
    std.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    std.dni.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (std.gradeLevel || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (std.section || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Distribute and sort students by Grade, then Section, then Name
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const gradeA = a.gradeLevel || '';
    const gradeB = b.gradeLevel || '';
    const gradeCompare = gradeA.localeCompare(gradeB, 'es', { numeric: true });
    if (gradeCompare !== 0) return gradeCompare;

    const secA = a.section || '';
    const secB = b.section || '';
    const secCompare = secA.localeCompare(secB, 'es');
    if (secCompare !== 0) return secCompare;

    const nameA = a.name || '';
    const nameB = b.name || '';
    return nameA.localeCompare(nameB, 'es');
  });

  return (
    <div className="space-y-6">
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
      `}</style>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {!isEmbedded ? (
          <div className="glass-card-ecc tint-cyan p-6 rounded-3xl w-full sm:w-auto border-l-4 border-l-kinetic-cyan">
            <h2 className="text-3xl font-black tracking-tight text-white">Gestión de Estudiantes</h2>
            <p className="text-[#00f0ff] font-bold text-sm mt-1">Control del alumnado, apoderados e importaciones masivas.</p>
          </div>
        ) : (
          <div className="glass-card-ecc tint-cyan p-6 rounded-3xl w-full sm:w-auto border-l-4 border-l-kinetic-cyan">
            <h3 className="font-black text-white text-xl">Directorio de Estudiantes</h3>
            <p className="text-sm font-bold text-[#b9cacb] mt-1">Gestione fichas de matricula, datos de padres e importaciones masivas.</p>
          </div>
        )}
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleDownloadTemplate} 
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-black tracking-wider transition-colors border border-white/10 flex items-center gap-2"
            title="Descargar Plantilla Excel"
          >
            <Download className="h-4 w-4 text-kinetic-cyan" />
            Descargar Plantilla
          </button>
          
          <button 
            onClick={() => fileInputRef.current.click()} 
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-black tracking-wider transition-colors border border-white/10 flex items-center gap-2"
            title="Importar Alumnos desde Excel"
          >
            <Upload className="h-4 w-4 text-kinetic-lime" />
            Importar Excel
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".xlsx" 
            className="hidden" 
          />

          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-kinetic-cyan to-kinetic-cyan/80 text-[#0b1326] text-xs font-black tracking-wider transition-colors shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Estudiante
          </button>
        </div>
      </div>

      {/* Import Status Alert Banners */}
      {importStatus && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 shadow-md border ${
          importStatus === 'loading' 
            ? 'bg-kinetic-cyan/10 text-kinetic-cyan border-kinetic-cyan/20' 
            : importStatus === 'success'
              ? 'bg-kinetic-lime/10 text-kinetic-lime border-kinetic-lime/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        }`}>
          {importStatus === 'loading' && <span className="animate-spin glow-cyan">🌀</span>}
          {importStatus === 'success' && <Check className="h-5 w-5 glow-lime" />}
          {importStatus === 'error' && <AlertCircle className="h-5 w-5" />}
          <div>
            <p className="font-bold text-sm">
              {importStatus === 'loading' && 'Procesando hoja Excel...'}
              {importStatus === 'success' && `¡Importación Completada!`}
              {importStatus === 'error' && 'Error al importar archivo. Verifique el formato.'}
            </p>
            {importStatus === 'success' && (
              <p className="text-xs opacity-90 mt-0.5 font-medium text-white">Se agregaron/actualizaron {importCount} estudiantes exitosamente.</p>
            )}
          </div>
        </div>
      )}

      {/* Register Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="glass-card-ecc p-8 rounded-[2rem] space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <h4 className="font-black text-white text-xl border-b border-white/10 pb-4">Registrar Estudiante Manualmente</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">DNI *</label>
              <input 
                type="text" required name="dni" value={formData.dni} onChange={handleInputChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Apellidos y nombres *</label>
              <input 
                type="text" required name="name" value={formData.name} onChange={handleInputChange}
                placeholder="e.g. Pérez Quispe, Juan"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Correo Institucional</label>
              <input 
                type="email" name="email" value={formData.email} onChange={handleInputChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Edad</label>
              <input 
                type="number" name="age" value={formData.age} onChange={handleInputChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Sexo</label>
              <select 
                name="gender" value={formData.gender} onChange={handleInputChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none font-bold [&>option]:bg-[#0b1326]"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Grado de estudios</label>
              <select 
                name="gradeLevel" value={formData.gradeLevel} onChange={handleInputChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none font-bold [&>option]:bg-[#0b1326]"
              >
                <option value="1ro Secundaria">1ro Secundaria</option>
                <option value="2do Secundaria">2do Secundaria</option>
                <option value="3ro Secundaria">3ro Secundaria</option>
                <option value="4to Secundaria">4to Secundaria</option>
                <option value="5to Secundaria">5to Secundaria</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Sección</label>
              <select 
                name="section" value={formData.section} onChange={handleInputChange}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none font-bold [&>option]:bg-[#0b1326]"
              >
                <option value="A">Sección A</option>
                <option value="B">Sección B</option>
                <option value="C">Sección C</option>
                <option value="D">Sección D</option>
                <option value="E">Sección E</option>
                <option value="F">Sección F</option>
                <option value="G">Sección G</option>
                <option value="H">Sección H</option>
              </select>
            </div>

            {/* Mother details */}
            <div className="md:col-span-3 border-t border-white/10 pt-4 mt-2">
              <h5 className="font-black text-white text-lg mb-4">Datos de la Madre</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Apellidos y nombres</label>
                  <input 
                    type="text" name="motherName" value={formData.motherName} onChange={handleInputChange}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">DNI de la madre</label>
                  <input 
                    type="text" name="motherDni" value={formData.motherDni} onChange={handleInputChange}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Celular de la madre</label>
                  <input 
                    type="text" name="motherPhone" value={formData.motherPhone} onChange={handleInputChange}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Father details */}
            <div className="md:col-span-3 border-t border-white/10 pt-4 mt-2">
              <h5 className="font-black text-white text-lg mb-4">Datos del Padre</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Apellidos y nombres</label>
                  <input 
                    type="text" name="fatherName" value={formData.fatherName} onChange={handleInputChange}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">DNI del padre</label>
                  <input 
                    type="text" name="fatherDni" value={formData.fatherDni} onChange={handleInputChange}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Celular del padre</label>
                  <input 
                    type="text" name="fatherPhone" value={formData.fatherPhone} onChange={handleInputChange}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-3 border-t border-white/10 pt-4 mt-2">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Foto de Perfil</label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="shrink-0">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Vista previa" className="h-16 w-16 rounded-full object-cover border-2 border-kinetic-cyan glow-cyan" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center text-slate-400 font-bold text-[10px]">Sin Foto</div>
                  )}
                </div>
                <div className="flex-1 w-full space-y-3">
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData(prev => ({ ...prev, avatar: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer transition-colors"
                    />
                  </div>
                  <input 
                    type="text" 
                    name="avatar" 
                    placeholder="O pegue URL de imagen..." 
                    value={formData.avatar} 
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)} 
              className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-black tracking-wider uppercase transition-colors border border-white/10"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-kinetic-cyan to-kinetic-cyan/80 text-[#0b1326] text-xs font-black tracking-wider uppercase transition-colors shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              Guardar Estudiante
            </button>
          </div>
        </form>
      )}

      {/* Directory Table and Search */}
      <div className="glass-card-ecc p-8 rounded-[2rem] space-y-6 relative overflow-hidden">
        <div className="absolute -left-10 -top-10 h-32 w-32 bg-kinetic-cyan/5 rounded-full blur-2xl" />
        <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-kinetic-magenta/5 rounded-full blur-2xl" />

        {/* Search Input */}
        <div className="relative w-full max-w-xl z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por DNI, Nombre, Grado o Sección..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
          />
        </div>

        {/* Directory Grid */}
        <div className="overflow-x-auto rounded-[1.5rem] border border-white/10 bg-[#0b1326]/50 z-10 relative">
          <table className="w-full border-collapse text-left text-sm text-slate-400">
            <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-6 py-5">Estudiante</th>
                <th className="px-6 py-5">DNI</th>
                <th className="px-6 py-5">Grado y Sección</th>
                <th className="px-6 py-5">Edad / Sexo</th>
                <th className="px-6 py-5">Padres / Apoderados</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400 font-bold">
                    No se encontraron estudiantes registrados.
                  </td>
                </tr>
              ) : (
                sortedStudents.map(std => (
                  <tr key={std.id} className="hover:bg-white/5 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={std.avatar} alt={std.name} className="h-12 w-12 rounded-[1rem] object-cover border border-white/10 shadow-lg" />
                        <div>
                          <p className="font-black text-white text-base">{std.name}</p>
                          <p className="text-[11px] font-bold text-kinetic-lime mt-0.5">{std.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-white">{std.dni}</td>
                    <td className="px-6 py-4">
                      <span className="bg-kinetic-cyan/10 text-kinetic-cyan text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-kinetic-cyan/20 glow-cyan">
                        {std.gradeLevel} - {std.section || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-black">{std.age ? `${std.age} años` : 'N/A'}</p>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">{std.gender || 'Otro'}</p>
                    </td>
                    <td className="px-6 py-4 text-xs space-y-1.5">
                      {std.motherName && (
                        <p className="text-slate-300 font-bold">
                          <span className="font-black uppercase tracking-wider text-kinetic-magenta text-[10px]">Madre:</span> {std.motherName} {std.motherDni ? `(DNI: ${std.motherDni})` : ''} {std.motherPhone ? `[Cel: ${std.motherPhone}]` : ''}
                        </p>
                      )}
                      {std.fatherName && (
                        <p className="text-slate-300 font-bold">
                          <span className="font-black uppercase tracking-wider text-kinetic-lime text-[10px]">Padre:</span> {std.fatherName} {std.fatherDni ? `(DNI: ${std.fatherDni})` : ''} {std.fatherPhone ? `[Cel: ${std.fatherPhone}]` : ''}
                        </p>
                      )}
                      {!std.motherName && !std.fatherName && (
                        <p className="text-slate-500 italic font-medium">No especificados</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingStudent(std)}
                          className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-kinetic-cyan hover:bg-kinetic-cyan/10 transition-all active:scale-95 border border-white/10 hover:border-kinetic-cyan/20"
                          title="Modificar Datos"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(`¿Está seguro de eliminar a ${std.name}?`)) {
                              deleteStudent(std.id);
                            }
                          }}
                          className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all active:scale-95 border border-white/10 hover:border-rose-500/20"
                          title="Eliminar Estudiante"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal Overlay */}
      {editingStudent && (
        <div className="fixed inset-0 bg-[#0b1326]/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="glass-card-ecc p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6 rounded-[2rem] border border-white/20">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h4 className="font-black text-2xl text-white tracking-tight">Modificar Datos del Estudiante</h4>
              <button 
                type="button" 
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-white transition-colors text-3xl font-black leading-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!editingStudent.dni || !editingStudent.name) return alert('Por favor complete DNI y Nombre.');

              // Auto-calculate parent attributes for backward compatibility
              const pName = editingStudent.motherName || editingStudent.fatherName || 'No asignado';
              const pPhone = editingStudent.motherPhone || editingStudent.fatherPhone || '';
              
              const updatedStudentData = {
                ...editingStudent,
                parentName: pName,
                parentPhone: pPhone
              };

              updateStudent(editingStudent.id, updatedStudentData);
              setEditingStudent(null);
              alert('Datos del estudiante actualizados con éxito.');
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">DNI *</label>
                  <input 
                    type="text" required value={editingStudent.dni || ''} 
                    onChange={(e) => setEditingStudent({ ...editingStudent, dni: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Apellidos y Nombres *</label>
                  <input 
                    type="text" required value={editingStudent.name || ''} 
                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Correo Institucional</label>
                  <input 
                    type="email" value={editingStudent.email || ''} 
                    onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Edad</label>
                  <input 
                    type="number" value={editingStudent.age || ''} 
                    onChange={(e) => setEditingStudent({ ...editingStudent, age: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Sexo</label>
                  <select 
                    value={editingStudent.gender || 'Masculino'} 
                    onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-bold focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none [&>option]:bg-[#0b1326]"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Grado de estudios</label>
                  <select 
                    value={editingStudent.gradeLevel || '1ro Secundaria'} 
                    onChange={(e) => setEditingStudent({ ...editingStudent, gradeLevel: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-bold focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none [&>option]:bg-[#0b1326]"
                  >
                    <option value="1ro Secundaria">1ro Secundaria</option>
                    <option value="2do Secundaria">2do Secundaria</option>
                    <option value="3ro Secundaria">3ro Secundaria</option>
                    <option value="4to Secundaria">4to Secundaria</option>
                    <option value="5to Secundaria">5to Secundaria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Sección</label>
                  <select 
                    value={editingStudent.section || 'A'} 
                    onChange={(e) => setEditingStudent({ ...editingStudent, section: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white font-bold focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none [&>option]:bg-[#0b1326]"
                  >
                    <option value="A">Sección A</option>
                    <option value="B">Sección B</option>
                    <option value="C">Sección C</option>
                    <option value="D">Sección D</option>
                    <option value="E">Sección E</option>
                    <option value="F">Sección F</option>
                    <option value="G">Sección G</option>
                    <option value="H">Sección H</option>
                  </select>
                </div>

                {/* Mother details */}
                <div className="md:col-span-2 border-t border-white/10 pt-4 mt-2">
                  <h5 className="font-black text-white text-lg mb-4">Datos de la Madre</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Apellidos y nombres</label>
                      <input 
                        type="text" value={editingStudent.motherName || ''} 
                        onChange={(e) => setEditingStudent({ ...editingStudent, motherName: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">DNI</label>
                      <input 
                        type="text" value={editingStudent.motherDni || ''} 
                        onChange={(e) => setEditingStudent({ ...editingStudent, motherDni: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Celular</label>
                      <input 
                        type="text" value={editingStudent.motherPhone || ''} 
                        onChange={(e) => setEditingStudent({ ...editingStudent, motherPhone: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Father details */}
                <div className="md:col-span-2 border-t border-white/10 pt-4 mt-2">
                  <h5 className="font-black text-white text-lg mb-4">Datos del Padre</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Apellidos y nombres</label>
                      <input 
                        type="text" value={editingStudent.fatherName || ''} 
                        onChange={(e) => setEditingStudent({ ...editingStudent, fatherName: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">DNI</label>
                      <input 
                        type="text" value={editingStudent.fatherDni || ''} 
                        onChange={(e) => setEditingStudent({ ...editingStudent, fatherDni: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Celular</label>
                      <input 
                        type="text" value={editingStudent.fatherPhone || ''} 
                        onChange={(e) => setEditingStudent({ ...editingStudent, fatherPhone: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 border-t border-white/10 pt-4 mt-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Foto de Perfil</label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="shrink-0">
                      {editingStudent.avatar ? (
                        <img src={editingStudent.avatar} alt="Vista previa" className="h-16 w-16 rounded-full object-cover border-2 border-kinetic-cyan glow-cyan" />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center text-slate-400 font-bold text-[10px]">Sin Foto</div>
                      )}
                    </div>
                    <div className="flex-1 w-full space-y-3">
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditingStudent(prev => ({ ...prev, avatar: reader.result }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer transition-colors"
                        />
                      </div>
                      <input 
                        type="text" 
                        placeholder="O pegue URL de imagen..." 
                        value={editingStudent.avatar || ''} 
                        onChange={(e) => setEditingStudent({ ...editingStudent, avatar: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
                <button 
                  type="button" 
                  onClick={() => setEditingStudent(null)} 
                  className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-black tracking-wider uppercase transition-colors border border-white/10"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-kinetic-cyan to-kinetic-cyan/80 text-[#0b1326] text-xs font-black tracking-wider uppercase transition-colors shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default StudentManager;
