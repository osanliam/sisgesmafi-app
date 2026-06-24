const fs = require('fs');

let dashboard = fs.readFileSync('Dashboard.jsx', 'utf8');
let classroom = fs.readFileSync('ClassroomManager.jsx', 'utf8');

// Extract from Dashboard.jsx
let bentoStart = dashboard.indexOf('<div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">');
let navEnd = dashboard.indexOf('{/* Latest Activities List */}');
let bentoHtml = dashboard.slice(bentoStart, navEnd);

// Modify the bentoHtml to link to the activeSubTab
// 1. "Registrar Calificaciones" button
bentoHtml = bentoHtml.replace(
  '<button className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-orange-500',
  '<button onClick={() => setActiveSubTab(\'grading\')} disabled={!selectedCourseId} className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-orange-500'
);

// 2. "Ver Reportes" button
bentoHtml = bentoHtml.replace(
  '<button className="px-8 py-4 rounded-full glass-panel text-white',
  '<button onClick={() => setActiveSubTab(\'reports\')} disabled={!selectedCourseId} className="px-8 py-4 rounded-full glass-panel text-white'
);

// 3. Navigation modules - Cursos y Secciones
bentoHtml = bentoHtml.replace(
  '<div className="snap-start min-w-[300px] shrink-0 organic-card p-6 relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300">',
  '<div onClick={() => setActiveSubTab(\'selector\')} className={`snap-start min-w-[300px] shrink-0 organic-card p-6 relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300 ${activeSubTab === \'selector\' ? \'ring-2 ring-blue-500\' : \'\'}`}>'
);

// 4. Asistencia
bentoHtml = bentoHtml.replace(
  '<div className="snap-start min-w-[300px] shrink-0 organic-card p-6 relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300">',
  '<div onClick={() => setActiveSubTab(\'attendance\')} className={`snap-start min-w-[300px] shrink-0 organic-card p-6 relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300 ${activeSubTab === \'attendance\' ? \'ring-2 ring-purple-500\' : \'\'} ${!selectedCourseId ? \'opacity-50 pointer-events-none\' : \'\'}`}>'
);

// 5. Calificaciones
bentoHtml = bentoHtml.replace(
  '<div className="snap-start min-w-[300px] shrink-0 organic-card p-6 relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300">',
  '<div onClick={() => setActiveSubTab(\'grading\')} className={`snap-start min-w-[300px] shrink-0 organic-card p-6 relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300 ${activeSubTab === \'grading\' ? \'ring-2 ring-red-500\' : \'\'} ${!selectedCourseId ? \'opacity-50 pointer-events-none\' : \'\'}`}>'
);

// 6. GAMA (Conducta)
bentoHtml = bentoHtml.replace(
  '<div className="snap-start min-w-[300px] shrink-0 organic-card p-6 relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300">',
  '<div onClick={() => setActiveSubTab(\'conduct\')} className={`snap-start min-w-[300px] shrink-0 organic-card p-6 relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300 ${activeSubTab === \'conduct\' ? \'ring-2 ring-emerald-500\' : \'\'} ${!selectedCourseId ? \'opacity-50 pointer-events-none\' : \'\'}`}>'
);

// Dynamic text for "AULA ACTIVA"
bentoHtml = bentoHtml.replace(
  '<p className="font-body-lg text-body-lg text-purple-200">1RO SECUNDARIA - SECCIÓN A</p>',
  '<p className="font-body-lg text-body-lg text-purple-200">{activeCourseName ? `${activeCourseName} (${selectedGrade} - Secc. ${selectedSection})` : "SELECCIONE UN CURSO"}</p>'
);

// Replace the old header and 6-card grid in ClassroomManager
let oldHeaderStart = classroom.indexOf('{/* 1. Header with selector status */}');
let oldHeaderEnd = classroom.indexOf('{/* 3. Render content depends on activeSubTab */}');

if (oldHeaderStart !== -1 && oldHeaderEnd !== -1) {
  let newClassroom = classroom.slice(0, oldHeaderStart) + bentoHtml + '\n      </div>\n      ' + classroom.slice(oldHeaderEnd);
  fs.writeFileSync('ClassroomManager.jsx', newClassroom, 'utf8');
  console.log('Successfully updated ClassroomManager.jsx');
} else {
  console.log('Could not find injection points in ClassroomManager.jsx');
}
