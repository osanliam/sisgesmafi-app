import React, { useContext, useMemo, useState } from 'react';
import { DatabaseContext } from '../context/DatabaseContext';
import { Award, Calendar, AlertTriangle, FileText, Bell } from 'lucide-react';

function ParentPortal() {
  const { currentUser, students, courses, grades, attendance, conduct, notifications, gradingScale } = useContext(DatabaseContext);

  // Find the child associated with this parent
  const child = useMemo(() => {
    return students.find(s => s.id === currentUser.childId) || students[0];
  }, [students, currentUser]);

  // Selected course to inspect grades
  const [selectedCourseId, setSelectedCourseId] = useState('');

  // Child's courses based on grade level and section assignments
  const childCourses = useMemo(() => {
    if (!child) return [];
    return courses.filter(c => 
      (c.assignments || []).some(asg => 
        asg.gradeLevel.toLowerCase() === (child.gradeLevel || '').toLowerCase() &&
        (asg.sections || []).some(sec => sec.toLowerCase() === (child.section || '').toLowerCase())
      )
    );
  }, [courses, child]);

  // Auto select first course
  React.useEffect(() => {
    if (childCourses.length > 0) {
      setSelectedCourseId(childCourses[0].id);
    }
  }, [childCourses]);

  const activeCourse = useMemo(() => {
    return courses.find(c => c.id === selectedCourseId);
  }, [courses, selectedCourseId]);

  // Child's grades for selected course
  const courseGrades = useMemo(() => {
    if (!child || !selectedCourseId) return [];
    return grades.filter(g => g.studentId === child.id && g.courseId === selectedCourseId);
  }, [grades, child, selectedCourseId]);

  // Calculate attendance counters for this child
  const attendanceSummary = useMemo(() => {
    if (!child) return { present: 0, late: 0, absent: 0, excused: 0, rate: 100 };
    const stdAtts = attendance.filter(a => a.type === 'student' && a.targetId === child.id);
    
    const present = stdAtts.filter(a => a.status === 'present').length;
    const late = stdAtts.filter(a => a.status === 'late').length;
    const absent = stdAtts.filter(a => a.status === 'absent').length;
    const excused = stdAtts.filter(a => a.status === 'excused').length;
    
    const rate = stdAtts.length > 0 
      ? Math.round(((present + late + excused) / stdAtts.length) * 100)
      : 100;

    return { present, late, absent, excused, rate };
  }, [attendance, child]);

  // Child's conduct history
  const childConduct = useMemo(() => {
    if (!child) return [];
    return conduct.filter(rec => rec.studentId === child.id);
  }, [conduct, child]);

  return (
    <div className="space-y-6">
      
      {/* Header Profile card */}
      {child && (
        <div className="glass-card p-6 bg-gradient-to-r from-violet-950 to-indigo-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 border-none">
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <img 
              src={child.avatar} 
              alt={child.name} 
              className="h-20 w-20 rounded-2xl object-cover border-2 border-white/20 shadow-md"
            />
            <div>
              <span className="text-[10px] bg-white/25 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">Portal de Apoderados</span>
              <h3 className="text-2xl font-black mt-2">{currentUser.name}</h3>
              <p className="text-xs text-indigo-200 mt-0.5">Representante legal de: <span className="font-bold text-white">{child.name}</span></p>
              <p className="text-xs text-indigo-300 font-semibold">{child.gradeLevel}</p>
            </div>
          </div>

          <div className="flex gap-4 text-center text-xs font-bold shrink-0">
            <div className="bg-white/10 px-4 py-3 rounded-2xl border border-white/10">
              <p className="text-indigo-300 uppercase text-[9px] tracking-wider font-bold">Asistencia</p>
              <p className="text-xl font-extrabold text-white mt-0.5">{attendanceSummary.rate}%</p>
            </div>
            <div className="bg-white/10 px-4 py-3 rounded-2xl border border-white/10">
              <p className="text-indigo-300 uppercase text-[9px] tracking-wider font-bold">Conducta</p>
              <p className={`text-xl font-extrabold mt-0.5 ${childConduct.filter(c=>c.type==='incident').length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {childConduct.reduce((sum, c) => sum + c.points, 100)} Pts
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column (2/3 width) - Competencies Grades */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 mb-6">
              <h4 className="text-lg font-bold flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-500" />
                Notas por Competencia
              </h4>

              <select 
                value={selectedCourseId} 
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold dark:border-slate-800 dark:bg-slate-900"
              >
                {childCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* List competencies and grading scales */}
            <div className="space-y-4">
              {activeCourse?.competencies?.map(comp => {
                const gradeObj = courseGrades.find(g => g.competenceId === comp.id);
                const score = gradeObj ? gradeObj.score : null;
                
                // Color tags based on scores
                let scoreColor = 'bg-slate-100 text-slate-500 dark:bg-slate-900';
                let scoreLabel = 'Sin registrar';
                if (score !== null) {
                  const scoreStr = String(score);
                  if (scoreStr === 'AD') {
                    scoreColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
                    scoreLabel = 'Destacado';
                  } else if (scoreStr === 'A') {
                    scoreColor = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
                    scoreLabel = 'Logrado';
                  } else if (scoreStr === 'B') {
                    scoreColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
                    scoreLabel = 'Proceso';
                  } else if (scoreStr === 'C') {
                    scoreColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
                    scoreLabel = 'Inicio';
                  } else {
                    const num = parseFloat(score);
                    if (!isNaN(num)) {
                      const isScale20 = num > 10 || gradingScale === '20';
                      if (isScale20) {
                        if (num < 11.0) {
                          scoreColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
                          scoreLabel = 'Inicio';
                        } else if (num < 14.0) {
                          scoreColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
                          scoreLabel = 'Proceso';
                        } else if (num < 18.0) {
                          scoreColor = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
                          scoreLabel = 'Logrado';
                        } else {
                          scoreColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
                          scoreLabel = 'Destacado';
                        }
                      } else {
                        if (num < 6.0) {
                          scoreColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
                          scoreLabel = 'Inicio';
                        } else if (num < 8.5) {
                          scoreColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
                          scoreLabel = 'Proceso';
                        } else if (num < 9.5) {
                          scoreColor = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300';
                          scoreLabel = 'Logrado';
                        } else {
                          scoreColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
                          scoreLabel = 'Destacado';
                        }
                      }
                    }
                  }
                }

                return (
                  <div key={comp.id} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100/50 dark:border-slate-800/10 rounded-2xl transition hover:scale-[1.005]">
                    <div>
                      <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{comp.name}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Instrumento evaluado: <span className="font-semibold">{gradeObj?.instrument || 'Pendiente'}</span></p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${scoreColor}`}>
                        {scoreLabel}
                      </span>
                      <span className="text-xl font-black text-slate-800 dark:text-white">
                        {score !== null ? (typeof score === 'number' ? score.toFixed(1) : score) : '-.-'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {!activeCourse?.competencies?.length && (
                <p className="text-slate-400 text-center py-6">No hay competencias definidas en esta materia.</p>
              )}
            </div>

          </div>

          {/* Incidents & Merits section */}
          <div className="glass-card p-6">
            <h4 className="text-lg font-bold border-b border-slate-100 pb-4 dark:border-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-indigo-500" />
              Reportes de Comportamiento
            </h4>

            <div className="space-y-3">
              {childConduct.length === 0 ? (
                <p className="text-slate-400 text-center py-4 text-xs font-semibold">Excelente comportamiento: Cero incidencias o reportes.</p>
              ) : (
                childConduct.map(rec => {
                  const isMerit = rec.type === 'merit';
                  return (
                    <div 
                      key={rec.id} 
                      className={`p-3.5 rounded-xl border flex justify-between items-center text-xs ${
                        isMerit 
                          ? 'bg-emerald-50/20 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30' 
                          : 'bg-rose-50/20 border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/30'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{rec.category}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{rec.description}</p>
                      </div>
                      <span className={`font-black px-2 py-1 rounded ${
                        isMerit ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/30'
                      }`}>
                        {rec.points > 0 ? `+${rec.points}` : rec.points}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column (1/3 width) - Attendance stats & Announcements */}
        <div className="space-y-6">
          
          {/* Attendance Cards */}
          <div className="glass-card p-6 space-y-4">
            <h4 className="text-lg font-bold border-b border-slate-100 pb-4 dark:border-slate-800 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              Asistencia Escolar
            </h4>
            
            <div className="grid grid-cols-4 gap-2.5 text-center text-[10px] font-bold">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-2.5 rounded-xl text-emerald-800 dark:text-emerald-200">
                <p className="text-sm font-black">{attendanceSummary.present}</p>
                Pre
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-2.5 rounded-xl text-amber-800 dark:text-amber-200">
                <p className="text-sm font-black">{attendanceSummary.late}</p>
                Tar
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 p-2.5 rounded-xl text-purple-800 dark:text-purple-200">
                <p className="text-sm font-black">{attendanceSummary.excused}</p>
                Perm
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-2.5 rounded-xl text-rose-800 dark:text-rose-200">
                <p className="text-sm font-black">{attendanceSummary.absent}</p>
                Fal
              </div>
            </div>
          </div>

          {/* Institutional Notifications */}
          <div className="glass-card p-6 space-y-4">
            <h4 className="text-lg font-bold border-b border-slate-100 pb-4 dark:border-slate-800 flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-500" />
              Notificaciones
            </h4>

            <div className="space-y-3">
              {notifications.map(not => (
                <div key={not.id} className="p-3 bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/30 rounded-xl space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold">{not.date}</span>
                  <h5 className="font-bold text-xs text-indigo-900 dark:text-indigo-200">{not.title}</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{not.content}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default ParentPortal;
