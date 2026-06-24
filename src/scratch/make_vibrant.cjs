const fs = require('fs');
const path = require('path');

const file = '/Users/osmer/.gemini/antigravity/scratch/academic-management-system/frontend/src/components/GradingPortal.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Resumen de Calificaciones Donut Charts
content = content.replace(/strokeWidth="2\.5"/g, 'strokeWidth="4.5" className={`${color} drop-shadow-[0_0_8px_rgba(var(--color),0.5)]`} style={{ "--color": color === "text-emerald-600" ? "16,185,129" : (color === "text-amber-500" ? "245,158,11" : "239,68,68") }}');
content = content.replace(/strokeWidth="3"/g, 'strokeWidth="5" className={`text-indigo-600 drop-shadow-[0_0_12px_rgba(79,70,229,0.5)]`}');

// 2. Resumen Aside styling
content = content.replace(
  'col-span-12 lg:col-span-3 flex flex-col justify-between p-5 bg-slate-50/60 rounded-2xl border border-slate-200/60 min-h-[300px]',
  'col-span-12 lg:col-span-3 flex flex-col justify-between p-5 bg-gradient-to-b from-white to-slate-50 rounded-2xl border border-indigo-100 shadow-lg shadow-indigo-500/10 min-h-[300px]'
);

// 3. Ficha del Examen Personalizado box
content = content.replace(
  'glass-card p-4.5 bg-indigo-500/5 border-indigo-500/10 flex items-center justify-between',
  'p-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 border-none text-white flex items-center justify-between shadow-xl shadow-indigo-500/30'
);
content = content.replace(
  'text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide',
  'text-sm font-black text-white uppercase tracking-wider drop-shadow-md'
);
content = content.replace(
  'text-[10px] text-slate-505 dark:text-slate-400 font-semibold mt-0.5',
  'text-[10px] text-indigo-100 font-semibold mt-1'
);
content = content.replace(
  'text-[9px] font-bold uppercase text-slate-450 block',
  'text-[10px] font-bold uppercase text-indigo-200 block tracking-widest'
);
content = content.replace(
  'text-base font-black text-indigo-650 dark:text-indigo-400',
  'text-xl font-black text-white drop-shadow-md'
);
content = content.replace(
  'text-[9px] text-slate-400 font-bold ml-0.5',
  'text-[10px] text-indigo-200 font-bold ml-1'
);
content = content.replace(
  'text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded mt-1 inline-block',
  'text-[11px] font-black text-white bg-emerald-500/90 shadow-sm shadow-emerald-500/50 border border-emerald-400/50 px-2.5 py-0.5 rounded mt-1.5 inline-block'
);

// 4. Correcto / Incorrecto Buttons
content = content.replace(
  /bg-emerald-600 border-emerald-600 text-white shadow-md/g,
  'bg-gradient-to-r from-emerald-500 to-emerald-400 border-emerald-400 text-white shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-500/30'
);
content = content.replace(
  /bg-rose-500 border-rose-500 text-white shadow-md/g,
  'bg-gradient-to-r from-rose-500 to-rose-400 border-rose-400 text-white shadow-lg shadow-rose-500/40 ring-2 ring-rose-500/30'
);

// 5. Choice Buttons
content = content.replace(
  /bg-emerald-600 border-emerald-600 text-white font-black shadow-md/g,
  'bg-gradient-to-r from-emerald-500 to-emerald-400 border-emerald-400 text-white font-black shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-500/30'
);
content = content.replace(
  /bg-rose-500 border-rose-500 text-white font-black shadow-md/g,
  'bg-gradient-to-r from-rose-500 to-rose-400 border-rose-400 text-white font-black shadow-lg shadow-rose-500/40 ring-2 ring-rose-500/30'
);

// 6. Matching Option Buttons
content = content.replace(
  /bg-amber-500 text-white border-amber-500 shadow-sm/g,
  'bg-gradient-to-r from-amber-500 to-amber-400 text-white border-amber-400 shadow-lg shadow-amber-500/40 ring-2 ring-amber-500/30'
);

// 7. Guardar Nota Button
content = content.replace(
  /className="btn-neuro-primary text-xs px-4\.5 py-2 flex items-center gap-1\.5"/g,
  'className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/40 border-none text-xs px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"'
);

// 8. Other general vibrant updates
content = content.replace(
  /bg-indigo-100 dark:bg-indigo-950\/60 text-indigo-650 dark:text-indigo-400/g,
  'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/30'
);

fs.writeFileSync(file, content);
console.log('Applied vibrant styles.');
