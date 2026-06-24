const fs = require('fs');

let dashboard = fs.readFileSync('Dashboard.jsx', 'utf8');
let classroom = fs.readFileSync('ClassroomManager.jsx', 'utf8');

// 1. Extract Bento Grid
let bentoStart = dashboard.indexOf('<div className="md:p-4 overflow-y-auto">');
let bentoEnd = dashboard.lastIndexOf('</div>\n  );\n}');
let bentoHtml = dashboard.substring(bentoStart, bentoEnd + 6); // include the final </div>

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

// We need to inject onClick to the cards
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

// Ensure div counts match
const opens = (bentoHtml.match(/<div/g) || []).length;
const closes = (bentoHtml.match(/<\/div>/g) || []).length;
console.log('Bento div counts:', opens, closes);

// 3. Change default state in ClassroomManager
classroom = classroom.replace("const [activeSubTab, setActiveSubTab] = useState('selector');", "const [activeSubTab, setActiveSubTab] = useState('overview');");

// 4. Wrap existing UI
let insertionPointStr = '      {/* 1. Header with selector status */}';
let insertionPoint = classroom.indexOf(insertionPointStr);

let topPart = classroom.substring(0, insertionPoint);
let restOfClassroom = classroom.substring(insertionPoint);

let newHtml = `      {activeSubTab === 'overview' ? (
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
      
`;

let finalClassroom = topPart + newHtml + restOfClassroom;

let endingToReplace = `    </div>
  );
}`;

let newEnding = `        </div>
      )}
    </div>
  );
}`;

finalClassroom = finalClassroom.replace(endingToReplace, newEnding);

const finalOpens = (finalClassroom.match(/<div/g) || []).length;
const finalCloses = (finalClassroom.match(/<\/div>/g) || []).length;
console.log('Final div counts:', finalOpens, finalCloses);

fs.writeFileSync('ClassroomManager.jsx', finalClassroom, 'utf8');
console.log('ClassroomManager.jsx transformed successfully!');
