let fs = require('fs');

let dashboard = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');
let classroom = fs.readFileSync('src/components/ClassroomManager.jsx', 'utf8');

// 1. Extract Bento Grid
let bentoStart = dashboard.indexOf('<div className="md:p-4 overflow-y-auto">');
let bentoHtml = dashboard.substring(bentoStart);
let endIdx = bentoHtml.indexOf('  );\n}');
bentoHtml = bentoHtml.substring(0, endIdx).trim();

// 2. Modify Bento HTML for ClassroomManager
bentoHtml = bentoHtml.replace(
  /<button className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-orange-500[^>]*>[\s\S]*?Registrar Calificaciones[\s\S]*?<\/button>/,
  `<button onClick={() => setActiveSubTab('grading')} disabled={!selectedCourseId} className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-orange-500 text-white font-headline-md text-body-lg font-bold hover:scale-105 active:scale-95 transition-all glow-shadow-primary shadow-lg shadow-purple-500/40 disabled:opacity-50 disabled:pointer-events-none">
    Registrar Calificaciones
  </button>`
);

bentoHtml = bentoHtml.replace(
  /<button className="px-8 py-4 rounded-full glass-panel text-white[^>]*>[\s\S]*?Ver Reportes[\s\S]*?<\/button>/,
  `<button onClick={() => setActiveSubTab('reports')} disabled={!selectedCourseId} className="px-8 py-4 rounded-full glass-panel text-white font-headline-md text-body-lg hover:bg-white/10 hover:scale-105 active:scale-95 transition-all border border-white/20 disabled:opacity-50 disabled:pointer-events-none">
    Ver Reportes
  </button>`
);

const replaceCard = (html, title, action, disabledCheck) => {
    const regex = new RegExp(`(<div className="snap-start min-w-\\[300px\\] shrink-0 organic-card[\\s\\S]*?<h3 className="font-display-lg text-headline-xl text-white mb-2">${title}</h3>[\\s\\S]*?</div>\\s*</div>)`,"g");
    return html.replace(regex, (match) => {
        return match.replace('<div className="snap-start', `<div onClick={() => ${disabledCheck} ? null : setActiveSubTab('${action}')} className="snap-start ${disabledCheck ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`);
    });
};

bentoHtml = replaceCard(bentoHtml, 'Cursos y Secciones', 'selector', 'false');
bentoHtml = replaceCard(bentoHtml, 'Asistencia Oficial', 'attendance', '!selectedCourseId');
bentoHtml = replaceCard(bentoHtml, 'Calificaciones', 'grading', '!selectedCourseId');
bentoHtml = replaceCard(bentoHtml, 'Conducta', 'conduct', '!selectedCourseId');

// Replace static text
bentoHtml = bentoHtml.replace('1RO SECUNDARIA - SECCIÓN A', '{activeCourseName ? `${activeCourseName} (${selectedGrade} - Secc. ${selectedSection})` : "SELECCIONE UN CURSO"}');
bentoHtml = bentoHtml.replace('{stats.presentCount}', '{studentAverages.count > 0 ? Math.round(studentAverages.count * 0.95) : 0}'); 
bentoHtml = bentoHtml.replace('{stats.totalStudents}', '{studentAverages.count || 0}');
bentoHtml = bentoHtml.replace('{stats.attendanceRate}%', '{studentAverages.count > 0 ? 95 : 0}%');
bentoHtml = bentoHtml.replace('{stats.classAverage}', '{studentAverages.final}');

// 3. Extract original ClassroomManager content
let classReturnStart = classroom.indexOf('  return (\n    <div className="space-y-6">');
let classContentStart = classReturnStart + '  return (\n    <div className="space-y-6">'.length;
let classContentEnd = classroom.lastIndexOf('    </div>\n  );\n}');

let originalContent = classroom.substring(classContentStart, classContentEnd).trim();

// 4. Build final file
let topPart = classroom.substring(0, classReturnStart);
topPart = topPart.replace("const [activeSubTab, setActiveSubTab] = useState('selector');", "const [activeSubTab, setActiveSubTab] = useState('overview');");

let finalHtml = `  return (
    <div className="space-y-6">
      {activeSubTab === 'overview' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          ${bentoHtml}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
          <button 
            onClick={() => setActiveSubTab('overview')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full font-bold text-sm transition-all shadow-sm w-fit"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Volver al Dashboard
          </button>
          
          ${originalContent}
        </div>
      )}
    </div>
  );
}`;

let finalClassroom = topPart + finalHtml + '\n\nexport default ClassroomManager;\n';

fs.writeFileSync('src/components/ClassroomManager.jsx', finalClassroom, 'utf8');

let opens = (finalClassroom.match(/<div/g) || []).length;
let closes = (finalClassroom.match(/<\/div>/g) || []).length;
console.log('Final counts:', opens, closes);
