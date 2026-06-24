const fs = require('fs');
const path = require('path');

const filesToTransform = [
  'ClassroomManager.jsx',
  'AttendanceTracker.jsx',
  'GradingPortal.jsx',
  'ConductLogger.jsx',
  'ReinforcementGrading.jsx'
];

const styleBlock = `      <style>{\`
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
      \`}</style>
`;

for (const file of filesToTransform) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Inject styles if it's ClassroomManager
  if (file === 'ClassroomManager.jsx') {
    if (!content.includes('.glass-card-ecc')) {
      content = content.replace(
        '<div className="space-y-6">',
        `<div className="space-y-6 text-white min-h-screen bg-[#060a14] p-4 sm:p-8">\n${styleBlock}`
      );
    }

    // Rewrite ClassroomManager Header
    content = content.replace(
      /<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white\/80 dark:bg-slate-900\/55[^>]+>/,
      '<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">'
    );
    // Replace the icon container
    content = content.replace(
      /<div className="h-16 w-16 shrink-0 bg-gradient-to-tr from-sky-400\/20 to-indigo-500\/20[^>]+>[\s\S]*?<\/div>/,
      ''
    );
    // Replace the title div
    content = content.replace(
      /<div className="space-y-1">\s*<h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Gestión de Aula<\/h2>/,
      `<div className="glass-card-ecc tint-cyan p-6 rounded-3xl w-full sm:w-auto border-l-4 border-l-kinetic-cyan relative overflow-hidden">
        <div className="absolute -right-4 -top-4 h-24 w-24 bg-kinetic-cyan/20 rounded-full blur-2xl"></div>
        <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-kinetic-cyan glow-cyan" />
          Gestión de Aula
        </h2>`
    );

    // Replace tabs in ClassroomManager
    content = content.replace(/border-slate-200\/40/g, 'border-white/10');
    content = content.replace(/border-slate-100/g, 'border-white/10');
    content = content.replace(/border-slate-200/g, 'border-white/10');
    content = content.replace(/bg-white\/80/g, 'glass-card-ecc');
    content = content.replace(/bg-slate-50/g, 'bg-white/5');
    content = content.replace(/bg-slate-100\/50/g, 'bg-white/10');
    
    // Select styling
    content = content.replace(/bg-white dark:bg-slate-900 border border-indigo-500\/30 shadow-\[0_0_8px_rgba\(99,102,241,0\.1\)\] dark:border-indigo-500\/30/g, 'bg-transparent border border-kinetic-cyan shadow-[0_0_8px_rgba(0,240,255,0.4)]');
  }

  // Global replaces for all files
  content = content.replace(/text-indigo-650/g, 'text-cyan-400');
  content = content.replace(/text-indigo-600/g, 'text-kinetic-cyan');
  content = content.replace(/text-indigo-500/g, 'text-kinetic-cyan');
  content = content.replace(/text-indigo-700/g, 'text-cyan-400');
  content = content.replace(/text-indigo-400/g, 'text-cyan-300');
  content = content.replace(/text-indigo-300/g, 'text-cyan-200');

  content = content.replace(/bg-indigo-600 hover:bg-indigo-500/g, 'bg-kinetic-cyan hover:bg-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)] text-slate-900');
  content = content.replace(/bg-indigo-50\/50/g, 'bg-white/5');
  content = content.replace(/bg-indigo-50/g, 'bg-white/5');
  content = content.replace(/bg-indigo-100/g, 'bg-white/10');
  content = content.replace(/bg-indigo-500\/10/g, 'bg-kinetic-cyan/20');
  content = content.replace(/bg-indigo-600/g, 'bg-kinetic-cyan');

  content = content.replace(/border-indigo-100\/10/g, 'border-kinetic-cyan/20');
  content = content.replace(/border-indigo-100\/20/g, 'border-kinetic-cyan/20');
  content = content.replace(/border-indigo-100/g, 'border-kinetic-cyan/30');
  content = content.replace(/border-indigo-500\/20/g, 'border-kinetic-cyan/40');
  content = content.replace(/border-indigo-500\/30/g, 'border-kinetic-cyan/50');
  content = content.replace(/border-indigo-500/g, 'border-kinetic-cyan');

  content = content.replace(/hover:text-indigo-600/g, 'hover:text-kinetic-cyan');
  content = content.replace(/hover:text-indigo-500/g, 'hover:text-kinetic-cyan');
  content = content.replace(/hover:bg-indigo-100/g, 'hover:bg-kinetic-cyan/20');
  content = content.replace(/hover:bg-indigo-50/g, 'hover:bg-white/5');

  content = content.replace(/dark:bg-indigo-950\/40/g, 'bg-white/5');
  content = content.replace(/dark:bg-indigo-900\/60/g, 'hover:bg-white/10');
  content = content.replace(/dark:text-indigo-400/g, '');
  content = content.replace(/dark:text-indigo-300/g, '');

  content = content.replace(/text-slate-900/g, 'text-white');
  content = content.replace(/text-slate-850/g, 'text-white');
  content = content.replace(/text-slate-800/g, 'text-slate-200');
  content = content.replace(/text-slate-700/g, 'text-slate-200');
  content = content.replace(/text-slate-600/g, 'text-slate-300');
  content = content.replace(/text-slate-550/g, 'text-slate-400');
  content = content.replace(/text-slate-500/g, 'text-slate-400');

  content = content.replace(/bg-slate-50/g, 'bg-white/5');
  content = content.replace(/bg-slate-100/g, 'bg-white/10');
  content = content.replace(/bg-slate-200/g, 'bg-white/20');
  
  content = content.replace(/border-slate-100/g, 'border-white/10');
  content = content.replace(/border-slate-200/g, 'border-white/10');
  content = content.replace(/border-slate-300/g, 'border-white/20');

  content = content.replace(/dark:bg-slate-[0-9]+(\/[0-9]+)?/g, '');
  content = content.replace(/dark:border-slate-[0-9]+(\/[0-9]+)?/g, '');
  content = content.replace(/dark:text-slate-[0-9]+/g, '');
  content = content.replace(/dark:hover:bg-slate-[0-9]+(\/[0-9]+)?/g, '');
  content = content.replace(/dark:hover:text-slate-[0-9]+/g, '');
  content = content.replace(/dark:ring-slate-[0-9]+/g, '');

  content = content.replace(/bg-white\/80/g, 'glass-card-ecc');
  content = content.replace(/bg-white\/90/g, 'glass-card-ecc');
  content = content.replace(/bg-white(?!\/[0-9]+)/g, 'bg-transparent');

  content = content.replace(/shadow-sm/g, '');
  content = content.replace(/shadow-md/g, 'shadow-[0_0_15px_rgba(0,0,0,0.5)]');

  content = content.replace(/focus:ring-indigo-500/g, 'focus:ring-kinetic-cyan');
  content = content.replace(/focus:border-indigo-500/g, 'focus:border-kinetic-cyan');

  // Some components use 'glass-card' which we might want to replace with 'glass-card-ecc'
  content = content.replace(/className="glass-card /g, 'className="glass-card-ecc border border-white/10 ');

  // Table borders
  content = content.replace(/border-slate-200/g, 'border-white/10');
  content = content.replace(/border-b border-slate-200/g, 'border-b border-white/10');

  fs.writeFileSync(filePath, content);
}
