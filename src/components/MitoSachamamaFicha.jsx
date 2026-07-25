import React from 'react';
import { Calendar, MapPin, Users, BookOpen } from 'lucide-react';

export const getMitoScore = (selections) => {
  let score = 0;
  if (!selections) return 0;
  
  // Q1: Secuencia de Hechos (6 items: Bien = 1 pt, Regular = 0.5 pt, Mal = 0) => Max 6 pts
  if (selections.q1) {
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(key => {
      if (selections.q1[key] === 'bien') score += 1;
      else if (selections.q1[key] === 'medio') score += 0.5;
    });
  }

  // Q2: Personajes (2 items: Bien = 1 pt, Regular = 0.5 pt, Mal = 0) => Max 2 pts
  if (selections.q2) {
    ['cazador', 'serpiente'].forEach(key => {
      if (selections.q2[key] === 'bien') score += 1;
      else if (selections.q2[key] === 'medio') score += 0.5;
    });
  }

  // Q3: Dónde y Cuándo (2 items: Bien = 1 pt, Regular = 0.5 pt, Mal = 0) => Max 2 pts
  if (selections.q3) {
    ['donde', 'cuando'].forEach(key => {
      if (selections.q3[key] === 'bien') score += 1;
      else if (selections.q3[key] === 'medio') score += 0.5;
    });
  }

  // Q4: Problema (1 item: Bien = 2 pts, Regular = 1 pt, Mal = 0) => Max 2 pts
  if (selections.q4 === 'bien') score += 2;
  else if (selections.q4 === 'medio') score += 1;

  // Q5: Aprendizaje (1 item: Bien = 2 pts, Regular = 1 pt, Mal = 0) => Max 2 pts
  if (selections.q5 === 'bien') score += 2;
  else if (selections.q5 === 'medio') score += 1;

  // Q6: Preguntas (4 items: Bien = 1.5 pts, Regular = 0.75 pt, Mal = 0) => Max 6 pts
  if (selections.q6) {
    ['p1', 'p2', 'p3', 'p4'].forEach(key => {
      if (selections.q6[key] === 'bien') score += 1.5;
      else if (selections.q6[key] === 'medio') score += 0.75;
    });
  }

  return score;
};

// 3D Mini Icons
const MiniMapPin3D = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="miniPinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#be123c" />
      </linearGradient>
      <filter id="miniPinGlow">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#be123c" floodOpacity="0.25" />
      </filter>
    </defs>
    <path d="M12 2 C8.1 2, 5 5.1, 5 9 C5 14.2, 12 22, 12 22 C12 22, 19 14.2, 19 9 C19 5.1, 15.9 2, 12 2 Z" fill="url(#miniPinGrad)" filter="url(#miniPinGlow)" />
    <circle cx="12" cy="9" r="3.5" fill="#ffffff" />
  </svg>
);

const MiniCalendar3D = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="miniCalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <filter id="miniCalGlow">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0284c7" floodOpacity="0.25" />
      </filter>
    </defs>
    <rect x="3" y="6" width="18" height="15" rx="3" fill="#ffffff" stroke="#e0f2fe" strokeWidth="1" />
    <path d="M3 6 C3 4.5, 4.5 3, 6 3 H18 C19.5 3, 21 4.5, 21 6 V10 H3 Z" fill="url(#miniCalGrad)" filter="url(#miniCalGlow)" />
    <circle cx="7" cy="14" r="1.5" fill="#38bdf8" />
    <circle cx="12" cy="14" r="1.5" fill="#0284c7" />
    <circle cx="17" cy="14" r="1.5" fill="#0284c7" />
    <circle cx="7" cy="18" r="1.5" fill="#0284c7" />
    <circle cx="12" cy="18" r="1.5" fill="#38bdf8" />
    <circle cx="17" cy="18" r="1.5" fill="#0284c7" />
  </svg>
);

// 3D Number Badges
const StepBadge3D = ({ num }) => (
  <span className="bg-gradient-to-tr from-[#005ac2] to-[#60a5fa] text-white w-8 h-8 rounded-full flex items-center justify-center font-extrabold shrink-0 shadow-[0_4px_10px_rgba(0,90,194,0.3)] border border-white/20">
    {num}
  </span>
);

const StepBadge3DSmall = ({ num }) => (
  <span className="bg-gradient-to-tr from-[#005ac2] to-[#60a5fa] text-white w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 shadow-[0_3px_8px_rgba(0,90,194,0.3)] border border-white/20">
    {num}
  </span>
);

export default function MitoSachamamaFicha({ tempExamSelections, setTempExamSelections }) {
  const getItemCardStyle = (section, key) => {
    const selectionsObj = tempExamSelections || {};
    const selected = key === null ? selectionsObj[section] : selectionsObj[section]?.[key];
    
    if (selected === 'bien') {
      return {
        cardBg: 'bg-gradient-to-br from-[#ecfdf5] to-[#f0fdf4] dark:from-[#064e3b]/10 dark:to-[#022c22]/10 border-emerald-300 dark:border-emerald-800/80 shadow-emerald-500/5 shadow-sm',
        titleText: 'text-emerald-900 dark:text-emerald-300',
        claveBg: 'bg-emerald-100/60 dark:bg-emerald-950/30 border-emerald-200/50',
        claveLabel: 'text-emerald-700 dark:text-emerald-450',
        claveText: 'text-emerald-800/90 dark:text-emerald-350'
      };
    }
    if (selected === 'medio') {
      return {
        cardBg: 'bg-gradient-to-br from-[#fefcbf] to-[#fffde7] dark:from-[#78350f]/10 dark:to-[#451a03]/10 border-amber-300 dark:border-amber-800/80 shadow-amber-500/5 shadow-sm',
        titleText: 'text-amber-900 dark:text-amber-300',
        claveBg: 'bg-amber-100/60 dark:bg-amber-950/30 border-amber-250/50',
        claveLabel: 'text-amber-700 dark:text-amber-450',
        claveText: 'text-amber-800/90 dark:text-amber-350'
      };
    }
    if (selected === 'mal') {
      return {
        cardBg: 'bg-gradient-to-br from-[#fee2e2] to-[#fef2f2] dark:from-[#7f1d1d]/10 dark:to-[#450a0a]/10 border-rose-300 dark:border-rose-800/80 shadow-rose-500/5 shadow-sm',
        titleText: 'text-rose-900 dark:text-rose-300',
        claveBg: 'bg-rose-100/60 dark:bg-rose-950/30 border-rose-200/50',
        claveLabel: 'text-rose-700 dark:text-rose-450',
        claveText: 'text-rose-800/90 dark:text-rose-350'
      };
    }
    return {
      cardBg: 'bg-slate-50/40 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/80',
      titleText: 'text-slate-800 dark:text-slate-200',
      claveBg: 'bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-850/80',
      claveLabel: 'text-[#005ac2] dark:text-[#60a5fa]',
      claveText: 'text-slate-650 dark:text-slate-400'
    };
  };

  const handleSelect = (section, key, value) => {
    setTempExamSelections(prev => {
      if (key === null) {
        // Flat field
        return {
          ...prev,
          [section]: prev[section] === value ? null : value
        };
      } else {
        // Nested section field
        const sectionData = { ...prev[section] };
        sectionData[key] = sectionData[key] === value ? null : value;
        return {
          ...prev,
          [section]: sectionData
        };
      }
    });
  };

  const renderTripleSelector = (section, key, pointsLabel) => {
    const selectionsObj = tempExamSelections || {};
    const selected = key === null ? selectionsObj[section] : selectionsObj[section]?.[key];
    
    const btnActiveBien = selected === 'bien' 
      ? 'bg-gradient-to-br from-[#dcfce7] to-[#f0fdf4] dark:from-[#064e3b]/20 dark:to-[#022c22]/20 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-400 font-extrabold shadow-sm scale-[1.03] ring-1 ring-emerald-500/10' 
      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-400';
      
    const btnActiveMedio = selected === 'medio' 
      ? 'bg-gradient-to-br from-[#fef9c3] to-[#fffde7] dark:from-[#78350f]/20 dark:to-[#451a03]/20 border-amber-400 dark:border-amber-700 text-amber-800 dark:text-amber-400 font-extrabold shadow-sm scale-[1.03] ring-1 ring-amber-500/10' 
      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-400';
      
    const btnActiveMal = selected === 'mal' 
      ? 'bg-gradient-to-br from-[#fee2e2] to-[#fef2f2] dark:from-[#7f1d1d]/20 dark:to-[#450a0a]/20 border-red-400 dark:border-red-750 text-red-800 dark:text-red-400 font-extrabold shadow-sm scale-[1.03] ring-1 ring-red-500/10' 
      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-400';

    return (
      <div className="grid grid-cols-3 gap-2.5 mt-3">
        <button
          type="button"
          onClick={() => handleSelect(section, key, 'bien')}
          className={`border-2 py-2 rounded-lg text-xs font-black transition-all active:scale-95 flex flex-col items-center justify-center ${btnActiveBien}`}
        >
          <span>Bien</span>
          <span className="text-[9px] opacity-80 font-normal">({pointsLabel ? `+${pointsLabel.bien}` : ''})</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelect(section, key, 'medio')}
          className={`border-2 py-2 rounded-lg text-xs font-black transition-all active:scale-95 flex flex-col items-center justify-center ${btnActiveMedio}`}
        >
          <span>Regular</span>
          <span className="text-[9px] opacity-80 font-normal">({pointsLabel ? `+${pointsLabel.medio}` : ''})</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelect(section, key, 'mal')}
          className={`border-2 py-2 rounded-lg text-xs font-black transition-all active:scale-95 flex flex-col items-center justify-center ${btnActiveMal}`}
        >
          <span>Mal</span>
          <span className="text-[9px] opacity-80 font-normal">(+0)</span>
        </button>
      </div>
    );
  };

  const selectionsObj = tempExamSelections || {};

  // Q1 score
  let q1Score = 0;
  if (selectionsObj.q1) {
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(key => {
      if (selectionsObj.q1[key] === 'bien') q1Score += 1;
      else if (selectionsObj.q1[key] === 'medio') q1Score += 0.5;
    });
  }

  // Q2 score
  let q2Score = 0;
  if (selectionsObj.q2) {
    ['cazador', 'serpiente'].forEach(key => {
      if (selectionsObj.q2[key] === 'bien') q2Score += 1;
      else if (selectionsObj.q2[key] === 'medio') q2Score += 0.5;
    });
  }

  // Q3 score
  let q3Score = 0;
  if (selectionsObj.q3) {
    ['donde', 'cuando'].forEach(key => {
      if (selectionsObj.q3[key] === 'bien') q3Score += 1;
      else if (selectionsObj.q3[key] === 'medio') q3Score += 0.5;
    });
  }

  // Q4 score
  let q4Score = 0;
  if (selectionsObj.q4 === 'bien') q4Score += 2;
  else if (selectionsObj.q4 === 'medio') q4Score += 1;

  // Q5 score
  let q5Score = 0;
  if (selectionsObj.q5 === 'bien') q5Score += 2;
  else if (selectionsObj.q5 === 'medio') q5Score += 1;

  // Q6 score
  let q6Score = 0;
  if (selectionsObj.q6) {
    ['p1', 'p2', 'p3', 'p4'].forEach(key => {
      if (selectionsObj.q6[key] === 'bien') q6Score += 1.5;
      else if (selectionsObj.q6[key] === 'medio') q6Score += 0.75;
    });
  }

  const q1Items = [
    { id: 'h1', num: '1.1', text: 'El cazador llevaba una semana sin cazar nada.', weight: '5.0', pts: 1, clave: 'Decidió internarse más en la selva en busca de caza.' },
    { id: 'h2', num: '1.2', text: 'Se desató una lluvia y buscó refugio bajo un árbol caído.', weight: '5.0', pts: 1, clave: 'Se refugió de la tempestad en un gran tronco.' },
    { id: 'h3', num: '1.3', text: 'Un temblor destruyó su refugio y apagó su fogata.', weight: '5.0', pts: 1, clave: 'Por curiosidad, observó los extremos del enorme tronco.' },
    { id: 'h4', num: '1.4', text: 'Al descubrir el otro extremo del árbol, vio huesos.', weight: '5.0', pts: 1, clave: 'Vio una calavera humana y huesos de otros animales.' },
    { id: 'h5', num: '1.5', text: 'Un venado fue atraído hacia la base del árbol.', weight: '5.0', pts: 1, clave: 'Un animal grande pasó cerca y fue jalado por el tronco.' },
    { id: 'h6', num: '1.6', text: 'El cazador comprendió el peligro y huyó del lugar.', weight: '5.0', pts: 1, clave: 'Escapó a toda prisa al ver que el tronco tenía ojos.' }
  ];

  const q2Items = [
    { id: 'cazador', num: '2.1', text: 'El Cazador 🤠', weight: '5.0', pts: 1, clave: 'Personaje principal, audaz cazador de la Amazonía.' },
    { id: 'serpiente', num: '2.2', text: 'La Serpiente (Sachamama) 🐍', weight: '5.0', pts: 1, clave: 'Boa gigante y deidad de la selva con poder de atracción.' }
  ];

  const q3Items = [
    { id: 'donde', num: '3.1', text: '¿DÓNDE? (Lugar)', weight: '5.0', pts: 1, clave: 'En las profundidades de la selva amazónica.' },
    { id: 'cuando', num: '3.2', text: '¿CUÁNDO? (Tiempo)', weight: '5.0', pts: 1, clave: 'En una época antigua, durante una fuerte tempestad.' }
  ];

  const q6Items = [
    { id: 'p1', num: '6.1', text: '¿Qué es la Sachamama?', weight: '7.5', pts: 1.5, clave: 'Es una deidad selvática, una gigantesca boa de tierra (Madre de la Tierra).' },
    { id: 'p2', num: '6.2', text: '¿Qué poderes tiene la Sachamama?', weight: '7.5', pts: 1.5, clave: 'Hipnotizar con su mirada y jalar o atraer a los seres vivos hacia ella.' },
    { id: 'p3', num: '6.3', text: '¿Qué cosas salvó al cazador de ser devorado?', weight: '7.5', pts: 1.5, clave: 'El tronco ya estaba digiriendo al venado y que el cazador comprendió a tiempo el peligro.' },
    { id: 'p4', num: '6.4', text: '¿Qué título le pondrías a este mito?', weight: '7.5', pts: 1.5, clave: 'Respuesta abierta (debe guardar relación directa con el mito y su moraleja).' }
  ];

  return (
    <div className="space-y-6 max-w-xl mx-auto py-2 text-left">
      
      {/* Header Banner */}
      <div className="p-5 rounded-lg bg-gradient-to-r from-[#005ac2] to-[#1976D2] text-white flex items-center justify-between shadow-lg shadow-blue-500/10">
        <div>
          <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider">
            Ficha de Evaluación: El Mito de la Sachamama
          </h4>
          <p className="text-[10px] text-blue-100 font-semibold mt-1">
            Herramienta interactiva para la calificación de lectura comprensiva y análisis textual.
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[9px] font-black uppercase text-blue-200 block">PUNTAJE TOTAL</span>
          <span className="text-lg font-black text-cyan-300">
            {getMitoScore(tempExamSelections)} / 20.0 pts
          </span>
        </div>
      </div>

      {/* Info Alert */}
      <div className="flex items-start gap-3 bg-[#005ac2]/5 border border-[#005ac2]/20 p-4 rounded-lg">
        <span className="material-symbols-outlined text-[#005ac2] dark:text-[#60a5fa] shrink-0 text-lg">info</span>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
          Registre las respuestas de la evaluación. Si el alumno ya cuenta con respuestas en la evaluación oficial, presione <strong>"Jalar Ficha Oficial"</strong>.
        </p>
      </div>

      {/* 1. SECUENCIA DE HECHOS */}
      <section className="question-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm hover:border-[#005ac2] dark:hover:border-[#005ac2] hover:shadow-md transition-all duration-300">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <StepBadge3D num="1" />
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Secuencia de Hechos (Pregunta 1)
            </h2>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[#005ac2] dark:text-[#60a5fa] font-black text-sm">
              {q1Score} / 6.0 pts
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PUNTAJE</div>
          </div>
        </div>
        
        <div className="space-y-4">
          {q1Items.map(item => {
            const cardStyle = getItemCardStyle('q1', item.id);
            return (
              <div key={item.id} className={`p-4 rounded-lg border-2 transition-all duration-300 ${cardStyle.cardBg} space-y-3`}>
                <div className="flex justify-between items-start gap-4">
                  <span className={`text-xs font-semibold ${cardStyle.titleText}`}>
                    {item.num} {item.text}
                  </span>
                  <span className="bg-slate-100/80 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded shrink-0 border border-slate-200/20">
                    PESO: {item.weight}% ({item.pts} pt)
                  </span>
                </div>
                
                <div className={`p-3 rounded-lg border ${cardStyle.claveBg}`}>
                  <span className={`text-[10px] font-black block mb-0.5 uppercase tracking-wide ${cardStyle.claveLabel}`}>
                    CLAVE:
                  </span>
                  <p className={`text-xs italic leading-relaxed ${cardStyle.claveText}`}>
                    {item.clave}
                  </p>
                </div>
                {renderTripleSelector('q1', item.id, { bien: '1.0', medio: '0.5' })}
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. PERSONAJES */}
      <section className="question-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm hover:border-[#005ac2] dark:hover:border-[#005ac2] hover:shadow-md transition-all duration-300">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <StepBadge3D num="2" />
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Personajes del Mito (Pregunta 2)
            </h2>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[#005ac2] dark:text-[#60a5fa] font-black text-sm">
              {q2Score} / 2.0 pts
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PUNTAJE</div>
          </div>
        </div>
        
        <div className="space-y-4">
          {q2Items.map(item => {
            const cardStyle = getItemCardStyle('q2', item.id);
            return (
              <div key={item.id} className={`p-4 rounded-lg border-2 transition-all duration-300 ${cardStyle.cardBg} space-y-3`}>
                <div className="flex justify-between items-start gap-4">
                  <span className={`text-xs font-semibold ${cardStyle.titleText}`}>
                    {item.num} {item.text}
                  </span>
                  <span className="bg-slate-100/80 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded shrink-0 border border-slate-200/20">
                    PESO: {item.weight}% ({item.pts} pt)
                  </span>
                </div>
                
                <div className={`p-3 rounded-lg border ${cardStyle.claveBg}`}>
                  <span className={`text-[10px] font-black block mb-0.5 uppercase tracking-wide ${cardStyle.claveLabel}`}>
                    CLAVE:
                  </span>
                  <p className={`text-xs italic leading-relaxed ${cardStyle.claveText}`}>
                    {item.clave}
                  </p>
                </div>
                {renderTripleSelector('q2', item.id, { bien: '1.0', medio: '0.5' })}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. LUGAR Y TIEMPO */}
      <section className="question-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm hover:border-[#005ac2] dark:hover:border-[#005ac2] hover:shadow-md transition-all duration-300">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <StepBadge3D num="3" />
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Contexto Espacio-Temporal (Pregunta 3)
            </h2>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[#005ac2] dark:text-[#60a5fa] font-black text-sm">
              {q3Score} / 2.0 pts
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PUNTAJE</div>
          </div>
        </div>
        
        <div className="space-y-4">
          {q3Items.map(item => {
            const cardStyle = getItemCardStyle('q3', item.id);
            return (
              <div key={item.id} className={`p-4 rounded-lg border-2 transition-all duration-300 ${cardStyle.cardBg} space-y-3`}>
                <div className="flex justify-between items-start gap-4">
                  <span className={`text-xs font-semibold flex items-center gap-1.5 ${cardStyle.titleText}`}>
                    {item.id === 'donde' ? <MiniMapPin3D /> : <MiniCalendar3D />}
                    {item.num} {item.text}
                  </span>
                  <span className="bg-slate-100/80 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded shrink-0 border border-slate-200/20">
                    PESO: {item.weight}% ({item.pts} pt)
                  </span>
                </div>
                
                <div className={`p-3 rounded-lg border ${cardStyle.claveBg}`}>
                  <span className={`text-[10px] font-black block mb-0.5 uppercase tracking-wide ${cardStyle.claveLabel}`}>
                    CLAVE:
                  </span>
                  <p className={`text-xs italic leading-relaxed ${cardStyle.claveText}`}>
                    {item.clave}
                  </p>
                </div>
                {renderTripleSelector('q3', item.id, { bien: '1.0', medio: '0.5' })}
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Q4. PROBLEMA */}
        {(() => {
          const cardStyle = getItemCardStyle('q4', null);
          return (
            <section className={`question-card border-2 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between ${cardStyle.cardBg}`}>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200/40 pb-3">
                  <div className="flex items-center gap-2">
                    <StepBadge3DSmall num="4" />
                    <h2 className={`text-xs font-black uppercase tracking-wide ${cardStyle.titleText}`}>
                      Problema Principal
                    </h2>
                  </div>
                  <div className={`font-black text-xs ${cardStyle.titleText}`}>
                    {q4Score} / 2.0 pts
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-500/80 font-bold uppercase tracking-wider">
                    <span>Pregunta 4</span>
                    <span className="bg-slate-100/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200/20">PESO: 10.0%</span>
                  </div>
                  <p className={`text-xs font-semibold ${cardStyle.titleText}`}>
                    ¿Cuál es el problema principal del cazador? Escrito en una frase.
                  </p>
                  <div className={`p-3 rounded-lg border ${cardStyle.claveBg}`}>
                    <span className={`text-[10px] font-black block mb-0.5 uppercase tracking-wide ${cardStyle.claveLabel}`}>
                      CLAVE:
                    </span>
                    <p className={`text-xs italic leading-relaxed ${cardStyle.claveText}`}>
                      El cazador se refugia sin saberlo en el cuerpo de la Sachamama (boa de tierra gigante).
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                {renderTripleSelector('q4', null, { bien: '2.0', medio: '1.0' })}
              </div>
            </section>
          );
        })()}

        {/* Q5. APRENDIZAJE */}
        {(() => {
          const cardStyle = getItemCardStyle('q5', null);
          return (
            <section className={`question-card border-2 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between ${cardStyle.cardBg}`}>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200/40 pb-3">
                  <div className="flex items-center gap-2">
                    <StepBadge3DSmall num="5" />
                    <h2 className={`text-xs font-black uppercase tracking-wide ${cardStyle.titleText}`}>
                      Moraleja / Aprendizaje
                    </h2>
                  </div>
                  <div className={`font-black text-xs ${cardStyle.titleText}`}>
                    {q5Score} / 2.0 pts
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-500/80 font-bold uppercase tracking-wider">
                    <span>Pregunta 5</span>
                    <span className="bg-slate-100/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200/20">PESO: 10.0%</span>
                  </div>
                  <p className={`text-xs font-semibold ${cardStyle.titleText}`}>
                    ¿Qué aprendió el cazador al final del mito?
                  </p>
                  <div className={`p-3 rounded-lg border ${cardStyle.claveBg}`}>
                    <span className={`text-[10px] font-black block mb-0.5 uppercase tracking-wide ${cardStyle.claveLabel}`}>
                      CLAVE:
                    </span>
                    <p className={`text-xs italic leading-relaxed ${cardStyle.claveText}`}>
                      Respetar la selva y sus misterios, y no confiarse de lo que parece inerte.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                {renderTripleSelector('q5', null, { bien: '2.0', medio: '1.0' })}
              </div>
            </section>
          );
        })()}
      </div>

      {/* 6. COMPRENSIÓN Y ANÁLISIS */}
      <section className="question-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm hover:border-[#005ac2] dark:hover:border-[#005ac2] hover:shadow-md transition-all duration-300">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <StepBadge3D num="6" />
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Comprensión y Análisis (Pregunta 6)
            </h2>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[#005ac2] dark:text-[#60a5fa] font-black text-sm">
              {q6Score} / 6.0 pts
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PUNTAJE</div>
          </div>
        </div>
        
        <div className="space-y-4">
          {q6Items.map(item => {
            const cardStyle = getItemCardStyle('q6', item.id);
            return (
              <div key={item.id} className={`p-4 rounded-lg border-2 transition-all duration-300 ${cardStyle.cardBg} space-y-3`}>
                <div className="flex justify-between items-start gap-4">
                  <span className={`text-xs font-semibold ${cardStyle.titleText}`}>
                    {item.num} {item.text}
                  </span>
                  <span className="bg-slate-100/80 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded shrink-0 border border-slate-200/20">
                    PESO: {item.weight}% ({item.pts} pts)
                  </span>
                </div>
                
                <div className={`p-3 rounded-lg border ${cardStyle.claveBg}`}>
                  <span className={`text-[10px] font-black block mb-0.5 uppercase tracking-wide ${cardStyle.claveLabel}`}>
                    CLAVE:
                  </span>
                  <p className={`text-xs italic leading-relaxed ${cardStyle.claveText}`}>
                    {item.clave}
                  </p>
                </div>
                {renderTripleSelector('q6', item.id, { bien: '1.5', medio: '0.75' })}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
