import re

with open('CourseManager.jsx', 'r') as f:
    content = f.read()

# 1. Inject styles at the beginning of the return statement
style_block = """
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
"""

# Find return (
#     <div className="space-y-6">
content = content.replace(
    '<div className="space-y-6">',
    f'<div className="space-y-6 text-white min-h-screen bg-[#060a14] p-4 sm:p-8">\n{style_block}'
)

# 2. Header
old_header = """      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-indigo-500" />
            Cursos y Horarios
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestione el plan curricular, asigne docentes y estructure los horarios.
          </p>
        </div>
        <button 
          onClick={() => setShowAddCourse(true)}
          className="btn-neuro-primary text-sm flex items-center gap-2 px-5 py-2.5"
        >
          <Plus className="h-4 w-4" />
          Nuevo Curso
        </button>
      </div>"""

new_header = """      {/* Header section */}
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
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setShowAddCourse(true)}
            className="px-6 py-3 rounded-2xl bg-kinetic-magenta hover:bg-fuchsia-500 text-white text-sm font-black tracking-widest transition-all shadow-[0_0_15px_rgba(254,0,254,0.4)] flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nuevo Curso
          </button>
        </div>
      </div>"""
content = content.replace(old_header, new_header)

# Replace 'bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex gap-1 w-fit' with glass-card-ecc
content = content.replace('bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl flex gap-1 w-fit', 'glass-card-ecc p-1.5 rounded-2xl flex gap-1 w-fit border border-white/10')
# Replace tab buttons
content = content.replace(
    "`px-4 py-2 text-xs font-bold rounded-lg transition-all ${ viewMode === 'mesh' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`",
    "`px-6 py-2.5 text-xs font-black tracking-widest uppercase rounded-xl transition-all ${ viewMode === 'mesh' ? 'bg-kinetic-magenta text-white shadow-[0_0_10px_rgba(254,0,254,0.4)]' : 'text-slate-400 hover:text-white'}`"
)
content = content.replace(
    "`px-4 py-2 text-xs font-bold rounded-lg transition-all ${ viewMode === 'schedule' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`",
    "`px-6 py-2.5 text-xs font-black tracking-widest uppercase rounded-xl transition-all ${ viewMode === 'schedule' ? 'bg-kinetic-magenta text-white shadow-[0_0_10px_rgba(254,0,254,0.4)]' : 'text-slate-400 hover:text-white'}`"
)

# Replace <div className="space-y-6"> for Course Grid
# "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
content = content.replace(
    'className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"',
    'className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10"'
)

# Course Cards
content = content.replace('glass-card p-0 overflow-hidden flex flex-col', 'glass-card-ecc rounded-[2rem] overflow-hidden flex flex-col border border-white/10 hover:border-kinetic-magenta/50 transition-all duration-300 group')
content = content.replace('bg-indigo-50/50 dark:bg-indigo-900/20 p-5 border-b border-indigo-100 dark:border-indigo-800', 'bg-white/5 p-6 border-b border-white/10 relative')
content = content.replace('h-4 w-4 text-indigo-500', 'h-4 w-4 text-kinetic-magenta')
content = content.replace('text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800 p-1.5 rounded text-xs font-bold transition', 'text-kinetic-magenta hover:bg-kinetic-magenta/20 p-2 rounded-xl text-xs font-black transition')
content = content.replace('text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-1.5 rounded text-xs font-bold transition', 'text-rose-400 hover:bg-rose-500/20 p-2 rounded-xl text-xs font-black transition')
content = content.replace('text-lg font-extrabold text-slate-900 dark:text-white leading-tight', 'text-xl font-black text-white leading-tight')

# Stats in cards
content = content.replace('bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 font-bold shadow-sm', 'bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 text-[10px] text-slate-300 font-black tracking-wider shadow-sm')

# Card body
content = content.replace('p-5 flex-1 flex flex-col gap-4', 'p-6 flex-1 flex flex-col gap-5')

# Docentes Asignados section
content = content.replace('text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2', 'text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2')
content = content.replace('border border-slate-100 dark:border-slate-800 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/50', 'border border-white/10 p-3 rounded-2xl bg-white/5')
content = content.replace('text-xs font-bold text-slate-700 dark:text-slate-200', 'text-xs font-bold text-white')
content = content.replace('text-[10px] text-slate-500', 'text-[10px] text-slate-400')
content = content.replace('bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded mr-1 mb-1 border border-indigo-200 dark:border-indigo-800 text-[9px] font-bold', 'bg-kinetic-magenta/20 text-kinetic-magenta px-2 py-1 rounded-lg mr-1.5 mb-1.5 border border-kinetic-magenta/30 text-[9px] font-black')

# Plan Curricular Preview
content = content.replace('bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50 text-xs flex justify-between items-center', 'bg-kinetic-lime/10 text-kinetic-lime p-4 rounded-2xl border border-kinetic-lime/20 text-xs flex justify-between items-center')
content = content.replace('bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-3 rounded-xl border border-amber-100 dark:border-amber-800/50 text-xs flex justify-between items-center', 'bg-amber-500/10 text-amber-400 p-4 rounded-2xl border border-amber-500/20 text-xs flex justify-between items-center')

# Action button
content = content.replace('btn-neuro-secondary text-xs w-full py-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30', 'w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-black tracking-widest transition-colors border border-white/10')

# Schedule section
content = content.replace('bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5', 'bg-[#0b1326]/50 p-3 rounded-2xl border border-white/10 flex flex-wrap gap-2')
content = content.replace('bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded text-[10px] text-slate-600 dark:text-slate-300 shadow-sm cursor-pointer hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition', 'bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-[10px] text-slate-300 shadow-sm cursor-pointer hover:border-rose-400 hover:bg-rose-500/20 transition')

# Timetable grid
content = content.replace('glass-card p-6 overflow-x-auto', 'glass-card-ecc p-8 rounded-[2rem] overflow-x-auto relative overflow-hidden')
content = content.replace('border-b border-slate-100 pb-4 dark:border-slate-800 mb-6', 'border-b border-white/10 pb-6 mb-6')
content = content.replace('h-5 w-5 text-indigo-500', 'h-6 w-6 text-kinetic-cyan glow-cyan')
content = content.replace('<h4 className="text-lg font-bold">Horario Semanal Integrado</h4>', '<h4 className="text-2xl font-black text-white">Horario Semanal Integrado</h4>')

# Table specific replacements
content = content.replace('border border-slate-200 dark:border-slate-800 p-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-center w-32', 'border-b border-white/10 p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-32')
content = content.replace('border border-slate-200 dark:border-slate-800 p-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-center', 'border-b border-white/10 p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center')
content = content.replace('border border-slate-200 dark:border-slate-800 p-3 text-xs font-bold text-center bg-slate-50/50 dark:bg-slate-900/20', 'border-r border-white/10 p-3 text-xs font-black text-white text-center bg-white/5')
content = content.replace('border border-slate-200 dark:border-slate-800 p-2.5 align-top', 'border border-white/5 p-3 align-top bg-[#0b1326]/30')
content = content.replace('bg-slate-100 dark:bg-slate-900', 'bg-white/5')
content = content.replace('className="min-w-[700px] w-full border-collapse border border-slate-200 dark:border-slate-800"', 'className="min-w-[700px] w-full border-collapse"')

# Grid items inside timetable
content = content.replace('bg-indigo-50 dark:bg-indigo-950/40 border-l-4 border-indigo-500 p-2 rounded-lg text-[10px] space-y-1 font-semibold', 'bg-white/5 border-l-4 border-kinetic-cyan p-3 rounded-xl text-[10px] space-y-1 font-semibold')
content = content.replace('font-bold text-indigo-950 dark:text-indigo-200 truncate', 'font-black text-white truncate')

# Modals
# Add Course / Edit Course Modals
# Wait, let's just make sure we replace the common ones in the modals
content = content.replace('fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200', 'fixed inset-0 bg-[#060a14]/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200')
content = content.replace('fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 md:p-8 animate-in fade-in duration-300', 'fixed inset-0 bg-[#060a14]/80 backdrop-blur-lg flex items-center justify-center z-50 p-4 sm:p-6 md:p-8 animate-in fade-in duration-300')

# Modal panels
content = content.replace('glass-card p-6 max-w-md w-full space-y-4 shadow-2xl border border-white/20', 'glass-card-ecc p-8 max-w-md w-full space-y-6 shadow-2xl rounded-[2rem]')
content = content.replace('border-b border-slate-100 pb-3 dark:border-slate-800', 'border-b border-white/10 pb-4')
content = content.replace('text-lg text-slate-900 dark:text-white', 'text-2xl tracking-tight text-white')
content = content.replace('text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold', 'text-slate-400 hover:text-white text-3xl font-black transition')

content = content.replace('bg-white dark:bg-slate-900 w-full max-w-6xl h-[85vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800', 'glass-card-ecc w-full max-w-7xl h-[90vh] rounded-[2rem] shadow-2xl border border-white/20')
content = content.replace('bg-slate-50/50 dark:bg-slate-950/20', 'bg-white/5')
content = content.replace('px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center', 'px-8 py-6 border-b border-white/10 flex justify-between items-center')

# Labels and inputs
content = content.replace('block text-xs font-bold uppercase text-slate-400 mb-1.5', 'block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2')
content = content.replace('w-full rounded-xl border border-slate-200 bg-white/50 px-3.5 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900', 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none')

# Assign teacher modal inputs (could be slightly different)
content = content.replace('w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900', 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-kinetic-cyan focus:ring-1 focus:ring-kinetic-cyan transition-all outline-none')

# Buttons in Modals
content = content.replace('btn-neuro-secondary text-xs', 'px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-black tracking-wider transition-colors border border-white/10')
content = content.replace('btn-neuro-primary text-xs', 'px-6 py-3 rounded-xl bg-kinetic-cyan hover:bg-cyan-400 text-slate-900 text-xs font-black tracking-widest transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)]')

# Curricular Editor specifics
content = content.replace('w-full md:w-1/3 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/30 dark:bg-slate-950/5', 'w-full md:w-1/3 border-r border-white/10 flex flex-col bg-black/20 custom-scrollbar')
content = content.replace('w-full md:w-2/3 flex flex-col overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-900', 'w-full md:w-2/3 flex flex-col overflow-y-auto p-8 space-y-6 bg-transparent custom-scrollbar')

content = content.replace('bg-slate-100/50 dark:bg-slate-800/30 p-3 rounded-2xl border border-slate-200/40 dark:border-slate-700/20', 'bg-white/5 p-4 rounded-2xl border border-white/10')
content = content.replace('w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900', 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:border-kinetic-magenta focus:ring-1 focus:ring-kinetic-magenta transition-all outline-none')
content = content.replace('bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 text-xs font-bold transition active:scale-95 shrink-0', 'bg-kinetic-magenta text-white rounded-xl px-4 text-xs font-black transition active:scale-95 shrink-0 shadow-[0_0_10px_rgba(254,0,254,0.4)]')

content = content.replace('bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/50', 'bg-kinetic-magenta/10 border-kinetic-magenta/40 shadow-[0_0_10px_rgba(254,0,254,0.1)]')
content = content.replace('bg-white dark:bg-slate-900 border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-850', 'bg-white/5 border-white/10 hover:border-white/20')

content = content.replace('text-indigo-950 dark:text-indigo-200', 'text-white font-black')
content = content.replace('text-slate-800 dark:text-slate-250', 'text-slate-300')
content = content.replace('bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500', 'bg-white/10 px-2 py-0.5 rounded text-slate-300')

content = content.replace('bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800', 'bg-white/5 rounded-2xl border border-white/10')
content = content.replace('border-b border-slate-200/45 dark:border-slate-800/45', 'border-b border-white/10')

content = content.replace('bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40', 'bg-black/30 p-4 rounded-xl border border-white/5')
content = content.replace('text-slate-600 dark:text-slate-400', 'text-slate-300')
content = content.replace('border-l-2 border-indigo-500/20', 'border-l-2 border-kinetic-magenta/30')

content = content.replace('btn-neuro-primary px-5 py-2.5 text-xs font-bold', 'px-8 py-3 rounded-xl bg-kinetic-magenta hover:bg-fuchsia-500 text-white text-xs font-black tracking-widest transition-all shadow-[0_0_15px_rgba(254,0,254,0.4)]')

with open('CourseManager.jsx', 'w') as f:
    f.write(content)
