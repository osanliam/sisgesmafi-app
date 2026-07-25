import React, { useState, useContext, useRef } from 'react';
import { DatabaseContext } from '../context/DatabaseContext';
import { Plus, UserCheck, GraduationCap, Download, Upload, Check, AlertCircle, Trash2, Pencil, Mail } from 'lucide-react';
import axios from 'axios';

function TeacherManager({
  isEmbedded = false,
  filterRoleGroup = 'all'
}) {
  const { teachers, courses, addTeacher, updateTeacher, deleteTeacher, setTeachers } = useContext(DatabaseContext);

  // Sync default role based on filterRoleGroup
  React.useEffect(() => {
    if (isEmbedded) {
      if (filterRoleGroup === 'teachers') {
        setRole('Docente');
      } else if (filterRoleGroup === 'admins') {
        setRole('Administrador');
      }
    }
  }, [filterRoleGroup, isEmbedded]);

  // Filter list based on filterRoleGroup
  const visibleTeachers = React.useMemo(() => {
    let list = teachers;
    if (isEmbedded && filterRoleGroup === 'teachers') {
      list = teachers.filter(t => (t.role || 'Docente') === 'Docente');
    } else if (isEmbedded && filterRoleGroup === 'admins') {
      list = teachers.filter(t => (t.role || 'Docente') !== 'Docente');
    }
    return list;
  }, [teachers, isEmbedded, filterRoleGroup]);
  
  // State for forms
  const [showForm, setShowForm] = useState(false);
  const [dni, setDni] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Masculino');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Docente');
  const [avatar, setAvatar] = useState('');

  const [editingTeacher, setEditingTeacher] = useState(null);

  // Course assignments modal/dropdown states
  const [assigningTeacherId, setAssigningTeacherId] = useState(null);

  // Bulk import states
  const [importStatus, setImportStatus] = useState(null); // null, 'loading', 'success', 'error'
  const [importCount, setImportCount] = useState(0);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !dni || !birthDate || !phone) {
      return alert('Por favor complete todos los campos obligatorios (*).');
    }
    
    const name = `${firstName} ${lastName}`;
    addTeacher({
      dni,
      firstName,
      lastName,
      name,
      email,
      gender,
      birthDate,
      phone,
      role,
      avatar: avatar || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?w=150`,
      courses: []
    });

    // Reset fields
    setDni('');
    setLastName('');
    setFirstName('');
    setEmail('');
    setGender('Masculino');
    setBirthDate('');
    setPhone('');
    setRole(isEmbedded && filterRoleGroup === 'admins' ? 'Administrador' : 'Docente');
    setAvatar('');
    setShowForm(false);
  };

  // Toggle class assignments
  const handleToggleCourse = (teacherId, courseId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    let updatedCourses = teacher.courses ? [...teacher.courses] : [];
    if (updatedCourses.includes(courseId)) {
      updatedCourses = updatedCourses.filter(cid => cid !== courseId);
    } else {
      updatedCourses.push(courseId);
    }

    updateTeacher(teacherId, { courses: updatedCourses });
  };

  // Download template Excel sheet
  const handleDownloadTemplate = () => {
    window.open('/api/excel/template-teachers', '_blank');
  };

  // Upload Excel file and merge teachers
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    setImportStatus('loading');

    try {
      const response = await axios.post('/api/excel/import-teachers', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success && response.data.teachers) {
        const imported = response.data.teachers;
        
        let mergedList = [...teachers];
        let newCount = 0;

        imported.forEach(imp => {
          // Look up duplicate using email or DNI
          const matchIdx = mergedList.findIndex(t => t.email === imp.email || (imp.dni && t.dni === imp.dni));
          
          // Map course name strings from Excel (coursesFromExcel) to actual course IDs in frontend courses
          const matchedCourseIds = [];
          if (imp.coursesFromExcel && imp.role === 'Docente') {
            imp.coursesFromExcel.forEach(cName => {
              const matchedCourse = courses.find(c => c.name.trim().toLowerCase() === cName.trim().toLowerCase());
              if (matchedCourse) {
                matchedCourseIds.push(matchedCourse.id);
              }
            });
          }
          
          const teacherRecord = {
            ...imp,
            courses: matchedCourseIds
          };
          delete teacherRecord.coursesFromExcel; // clean up temp field

          if (matchIdx > -1) {
            // merge fields
            mergedList[matchIdx] = { ...mergedList[matchIdx], ...teacherRecord };
          } else {
            // new staff with random avatar
            mergedList.push({
              avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?w=150`,
              ...teacherRecord
            });
            newCount++;
          }
        });

        // Save to central server context
        setTeachers(mergedList);

        setImportCount(newCount);
        setImportStatus('success');
      } else {
        setImportStatus('error');
      }
    } catch (error) {
      console.error('Failed to import teachers:', error);
      setImportStatus('error');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setImportStatus(null), 4000);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Director':
        return 'bg-kinetic-magenta/10 text-kinetic-magenta border-kinetic-magenta/20 glow-magenta';
      case 'Subdirector Académico':
      case 'Subdirector Administrativo':
        return 'bg-kinetic-lime/10 text-kinetic-lime border-kinetic-lime/20 glow-lime';
      case 'Administrador':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Docente':
      default:
        return 'bg-kinetic-cyan/10 text-kinetic-cyan border-kinetic-cyan/20 glow-cyan';
    }
  };

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
      `}</style>      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {!isEmbedded ? (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border-l-4 border-l-[#e11d48] w-full sm:w-auto text-left">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Gestión de Personal y Docentes</h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-xs mt-1">Directorio unificado de cargos directivos, administrativos y docentes.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border-l-4 border-l-[#e11d48] w-full sm:w-auto text-left">
            <h3 className="font-black text-slate-900 dark:text-white text-lg">
              {filterRoleGroup === 'teachers' ? 'Directorio de Docentes' : 'Directorio de Administrativos'}
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              {filterRoleGroup === 'teachers' 
                ? 'Administre el personal docente y sus asignaciones de asignaturas.' 
                : 'Administre el personal directivo, administrativo y de coordinación escolar.'}
            </p>
          </div>
        )}
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleDownloadTemplate} 
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
            title="Descargar Plantilla Excel de Personal"
          >
            <Download className="h-4 w-4 text-[#e11d48] dark:text-rose-400" />
            Descargar Plantilla
          </button>
          
          <button 
            onClick={() => fileInputRef.current.click()} 
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
            title="Importar Personal desde Excel"
          >
            <Upload className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Importar Excel
          </button>
          
          <button 
            onClick={() => {
              if (window.confirm("⚠️ ¿ESTÁ SEGURO DE ELIMINAR A TODO EL PERSONAL?\n\nEsta acción borrará todas las cuentas de docentes, director, subdirectores y administradores. Esta acción no se puede deshacer.")) {
                setTeachers([]);
              }
            }}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-black tracking-wider transition-colors border border-rose-200 flex items-center gap-2"
            title="Limpiar todo el personal de la base de datos"
          >
            <Trash2 className="h-4 w-4" />
            Limpiar Todo
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".xlsx" 
            className="hidden" 
          />

          <button 
            onClick={() => setShowForm(!showForm)} 
            className="px-4 py-2 rounded-xl bg-[#e11d48] hover:bg-rose-700 text-white text-xs font-black tracking-wider transition-all shadow-[0_4px_12px_rgba(225,29,72,0.15)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.25)] flex items-center gap-2 transform active:translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Registrar Personal
          </button>
        </div>
      </div>

      {/* Import Status Alert Banners */}
      {importStatus && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 shadow-md border ${
          importStatus === 'loading' 
            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900/30' 
            : importStatus === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/30'
              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-300 dark:border-rose-900/30'
        }`}>
          {importStatus === 'loading' && <span className="animate-spin text-blue-600">🌀</span>}
          {importStatus === 'success' && <Check className="h-5 w-5 text-emerald-600" />}
          {importStatus === 'error' && <AlertCircle className="h-5 w-5 text-rose-600" />}
          <div>
            <p className="font-bold text-sm">
              {importStatus === 'loading' && 'Procesando hoja de personal...'}
              {importStatus === 'success' && `¡Importación Completada!`}
              {importStatus === 'error' && 'Error al importar archivo. Verifique el formato.'}
            </p>
            {importStatus === 'success' && (
              <p className="text-xs opacity-90 mt-0.5 font-medium text-slate-600 dark:text-slate-400">Se agregaron/actualizaron {importCount} registros de personal exitosamente.</p>
            )}
          </div>
        </div>
      )}

      {/* Register Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] animate-in fade-in slide-in-from-top-4 duration-300 text-left">
          <h4 className="font-black text-slate-900 dark:text-white text-xl border-b border-slate-100 dark:border-slate-800 pb-4">Registrar Nuevo Personal / Docente</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-2">DNI *</label>
              <input 
                type="text" required value={dni} onChange={(e) => setDni(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-2">Nombres *</label>
              <input 
                type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-2">Apellidos *</label>
              <input 
                type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-2">Correo Electrónico *</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-2">Género *</label>
              <select 
                value={gender} onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] outline-none transition-all font-bold [&>option]:bg-white dark:[&>option]:bg-slate-900"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-2">Fecha de Nacimiento *</label>
              <input 
                type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-2">Número de Celular *</label>
              <input 
                type="text" required value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-2">Cargo *</label>
              {isEmbedded && filterRoleGroup === 'teachers' ? (
                <input 
                  type="text" 
                  readOnly 
                  value="Docente"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-400 font-bold outline-none cursor-not-allowed"
                />
              ) : (
                <select 
                  value={role} onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] outline-none transition-all font-bold [&>option]:bg-white dark:[&>option]:bg-slate-900"
                >
                  {isEmbedded && filterRoleGroup === 'admins' ? (
                    <>
                      <option value="Administrador">Administrador</option>
                      <option value="Director">Director</option>
                      <option value="Subdirector Académico">Subdirector Académico</option>
                      <option value="Subdirector Administrativo">Subdirector Administrativo</option>
                    </>
                  ) : (
                    <>
                      <option value="Docente">Docente</option>
                      <option value="Director">Director</option>
                      <option value="Subdirector Académico">Subdirector Académico</option>
                      <option value="Subdirector Administrativo">Subdirector Administrativo</option>
                      <option value="Administrador">Administrador</option>
                    </>
                  )}
                </select>
              )}
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-2">Foto de Perfil</label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="shrink-0">
                  {avatar ? (
                    <img src={avatar} alt="Vista previa" className="h-16 w-16 rounded-full object-cover border border-slate-200 dark:border-slate-800" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-[10px]">Sin Foto</div>
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
                            setAvatar(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 dark:file:bg-slate-800 dark:file:text-slate-300 cursor-pointer transition-colors"
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="O pegue URL de imagen..." 
                    value={avatar} 
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 text-xs font-black tracking-wider uppercase transition-colors border border-slate-200 dark:border-slate-700">Cancelar</button>
            <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#e11d48] hover:bg-rose-700 text-white text-xs font-black tracking-wider uppercase transition-colors shadow-sm">Guardar Registro</button>
          </div>
        </form>
      )}

      {/* Directory Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-left">
        {visibleTeachers.map((teacher, index) => {
          const themeStyle = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800';
          const themeGlow = 'bg-rose-500/5 rounded-full blur-xl';
          
          return (
          <div key={teacher.id} className={`${themeStyle} rounded-2xl border p-6 flex flex-col justify-between space-y-6 hover:-translate-y-0.5 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden group`}>
            
            <div className={`absolute -right-4 -bottom-4 h-24 w-24 rounded-full blur-xl transition-colors ${themeGlow}`} />

            <div className="absolute top-6 right-6 flex gap-2 z-10">
              <button 
                onClick={() => setEditingTeacher(teacher)}
                className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-[#e11d48] text-slate-500 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-colors"
                title="Modificar Datos"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={() => {
                  if (window.confirm(`¿Está seguro de eliminar a ${teacher.name}?`)) {
                    deleteTeacher(teacher.id);
                  }
                }}
                className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-colors"
                title="Eliminar Registro"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            
            <div className="flex items-center gap-5 relative z-10 text-left">
              <img src={teacher.avatar} alt={teacher.name} className="h-16 w-16 rounded-full object-cover border border-slate-200 dark:border-slate-800 shadow-sm" />
              <div>
                <div className="flex flex-col items-start gap-2 mb-1">
                  <span className={`inline-block text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                    teacher.role === 'Docente' 
                      ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/30' 
                      : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/30'
                  }`}>
                    {teacher.role || 'Docente'}
                  </span>
                </div>
                <h4 className="font-black text-lg text-slate-900 dark:text-white leading-tight">{teacher.name}</h4>
                <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-[#e11d48] dark:text-rose-400" />
                  {teacher.email}
                </div>
              </div>
            </div>

            {/* Profile specifications */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 border-t border-slate-100 dark:border-slate-800 pt-5 relative z-10 text-left text-xs">
              <div>
                <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest block mb-1">DNI</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{teacher.dni || '-'}</span>
              </div>
              <div>
                <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest block mb-1">Celular</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{teacher.phone || '-'}</span>
              </div>
              <div>
                <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest block mb-1">Género</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{teacher.gender || '-'}</span>
              </div>
              <div>
                <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest block mb-1">F. Nacimiento</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{teacher.birthDate || '-'}</span>
              </div>
              {teacher.role === 'Docente' && (
                <div className="col-span-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest block mb-1">Grados y Secciones a Cargo</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    {(() => {
                      const assignedGroups = [];
                      courses.forEach(c => {
                        (c.assignments || []).forEach(asg => {
                          if (asg.teacherId === teacher.id) {
                            const sectionsText = asg.sections && asg.sections.length > 0 ? asg.sections.join(', ') : 'Ninguna';
                            assignedGroups.push(`${asg.gradeLevel} (${sectionsText})`);
                          }
                        });
                      });
                      return assignedGroups.length > 0 ? assignedGroups.join('; ') : 'Ninguno';
                    })()}
                  </span>
                </div>
              )}
            </div>

            {teacher.role === 'Docente' && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 relative z-10 text-left">
                <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest block mb-3">Cursos Asignados:</span>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const assignedGroups = [];
                    courses.forEach(c => {
                      (c.assignments || []).forEach(asg => {
                        if (asg.teacherId === teacher.id) {
                          const sectionsText = asg.sections && asg.sections.length > 0 ? asg.sections.join(', ') : 'Ninguna';
                          assignedGroups.push({
                            id: `${c.id}_${asg.gradeLevel}`,
                            text: `${c.name} (${asg.gradeLevel} - Secc. ${sectionsText})`
                          });
                        }
                      });
                    });
                    if (assignedGroups.length === 0) {
                      return <span className="text-sm font-bold text-slate-500 italic">Ningún curso asignado</span>;
                    }
                    return assignedGroups.map(asg => (
                      <span key={asg.id} className="bg-rose-50 text-[#e11d48] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-rose-100">
                        {asg.text}
                      </span>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Course Assigner Actions (only for Docente) */}
            {teacher.role === 'Docente' && (
              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center relative z-10">
                <button 
                  onClick={() => setAssigningTeacherId(assigningTeacherId === teacher.id ? null : teacher.id)}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-black tracking-wider uppercase transition-colors border border-slate-200 dark:border-slate-750 flex items-center gap-2"
                >
                  <GraduationCap className="h-4 w-4 text-[#e11d48]" />
                  Asignar Cursos
                </button>

                {assigningTeacherId === teacher.id && (
                  <div className="absolute left-0 bottom-full mb-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl z-20 w-72 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200 text-left">
                    <p className="font-black text-slate-900 dark:text-white text-sm tracking-tight">Asignación de Cursos</p>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-xs leading-relaxed">
                      La asignación de grados y secciones se gestiona directamente desde el módulo de <strong className="text-[#e11d48]">Cursos y Planificación</strong>, agregando al docente dentro de la asignatura correspondiente.
                    </p>
                    <button 
                      onClick={() => setAssigningTeacherId(null)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#e11d48] text-white text-xs font-black tracking-wider uppercase transition-colors mt-2"
                    >
                      Entendido
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )})}
      </div>

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl text-left">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <h4 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">Modificar Datos del Personal</h4>
              <button 
                type="button" 
                onClick={() => setEditingTeacher(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors text-3xl font-black leading-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!editingTeacher.firstName || !editingTeacher.lastName || !editingTeacher.email || !editingTeacher.dni || !editingTeacher.birthDate || !editingTeacher.phone) {
                return alert('Por favor complete todos los campos obligatorios (*).');
              }
              const name = `${editingTeacher.firstName} ${editingTeacher.lastName}`;
              updateTeacher(editingTeacher.id, { ...editingTeacher, name });
              setEditingTeacher(null);
              alert('Ficha de personal actualizada con éxito.');
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">DNI *</label>
                  <input 
                    type="text" required value={editingTeacher.dni || ''} 
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, dni: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Nombres *</label>
                  <input 
                    type="text" required value={editingTeacher.firstName || ''} 
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, firstName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Apellidos *</label>
                  <input 
                    type="text" required value={editingTeacher.lastName || ''} 
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, lastName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Correo Electrónico *</label>
                  <input 
                    type="email" required value={editingTeacher.email || ''} 
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Celular *</label>
                  <input 
                    type="text" required value={editingTeacher.phone || ''} 
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-850 dark:text-slate-100 placeholder-slate-450 focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Fecha Nacimiento *</label>
                  <input 
                    type="date" required value={editingTeacher.birthDate || ''} 
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, birthDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-850 dark:text-slate-100 focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Sexo</label>
                  <select 
                    value={editingTeacher.gender || 'Masculino'} 
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, gender: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-850 dark:text-slate-100 font-bold focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] transition-all outline-none [&>option]:bg-white dark:[&>option]:bg-slate-900"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Cargo / Rol</label>
                  <select 
                    value={editingTeacher.role || 'Docente'} 
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, role: e.target.value })}
                    disabled={isEmbedded}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-850 dark:text-slate-100 font-bold focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] transition-all outline-none [&>option]:bg-white dark:[&>option]:bg-slate-900"
                  >
                    <option value="Docente">Docente</option>
                    <option value="Auxiliar">Auxiliar</option>
                    <option value="Coordinador">Coordinador</option>
                    <option value="Director">Director</option>
                    <option value="Subdirector">Subdirector</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Foto de Perfil</label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="shrink-0">
                      {editingTeacher.avatar ? (
                        <img src={editingTeacher.avatar} alt="Vista previa" className="h-16 w-16 rounded-full object-cover border border-slate-200 dark:border-slate-800" />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-[10px]">Sin Foto</div>
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
                                setEditingTeacher(prev => ({ ...prev, avatar: reader.result }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 dark:file:bg-slate-800 dark:file:text-slate-300 cursor-pointer transition-colors"
                        />
                      </div>
                      <input 
                        type="text" 
                        placeholder="O pegue URL de imagen..." 
                        value={editingTeacher.avatar || ''} 
                        onChange={(e) => setEditingTeacher({ ...editingTeacher, avatar: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-[#e11d48] focus:ring-1 focus:ring-[#e11d48] outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                <button 
                  type="button" 
                  onClick={() => setEditingTeacher(null)} 
                  className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 text-xs font-black tracking-wider uppercase transition-colors border border-slate-200 dark:border-slate-700"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-xl bg-[#e11d48] hover:bg-rose-700 text-white text-xs font-black tracking-wider uppercase transition-colors shadow-sm"
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

export default TeacherManager;
