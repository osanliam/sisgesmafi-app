import React, { useContext, useState, useEffect } from 'react';
import { DatabaseContext } from '../context/DatabaseContext';

function Dashboard() {
  const { courses, students } = useContext(DatabaseContext);
  const [time, setTime] = useState(new Date());

  // Simular un temporizador para "Next Class"
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Formato de hora tipo cronómetro (HH:MM:SS) para mantener la estética
  const formatTime = () => {
    const hh = String(time.getHours()).padStart(2, '0');
    const mm = String(time.getMinutes()).padStart(2, '0');
    const ss = String(time.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  const themes = ['cyan', 'magenta', 'lime'];

  // Datos mock para el dashboard si no hay cursos en la BD, o para asegurar la estética
  const defaultClasses = [
    { id: '1', name: 'Advanced Physics', section: 'Algebra 2 - Room 302', subSection: 'Evanrue 2 - Room 302', performers: 'Leo, Maya, Ben', theme: 'cyan' },
    { id: '2', name: 'English Literature', section: 'Evolved Class Cards', subSection: 'Algebra 2 - Room 302', performers: 'Leo, Maya, Ben', theme: 'magenta' },
    { id: '3', name: 'History 101', section: 'History 101 - Cards', subSection: 'Algebra 2 - Room 302', performers: 'Leo, Maya, Ben', theme: 'lime' },
  ];

  const displayClasses = courses && courses.length > 0 
    ? courses.map((c, i) => ({
        id: c.id,
        name: c.name,
        section: `${c.gradeLevel} - Sec ${c.section}`,
        subSection: 'Aula asignada',
        performers: 'Ana, Luis, Carlos',
        theme: themes[i % themes.length]
      })) 
    : defaultClasses;

  const themeConfig = {
    cyan: {
      hoverText: 'group-hover:text-kinetic-cyan',
      svgGlow: 'glow-lime',
      svgStroke: '#00f7a6',
      trendColor: 'lime',
      bgBadge: 'bg-kinetic-cyan',
      btnGradient: 'from-kinetic-magenta to-kinetic-magenta/80',
      shadowBtn: 'shadow-magenta-900/20'
    },
    magenta: {
      hoverText: 'group-hover:text-kinetic-magenta',
      svgGlow: 'glow-magenta',
      svgStroke: '#fe00fe',
      trendColor: 'magenta',
      bgBadge: 'bg-kinetic-magenta',
      btnGradient: 'from-kinetic-cyan to-kinetic-cyan/80',
      shadowBtn: 'shadow-cyan-900/20'
    },
    lime: {
      hoverText: 'group-hover:text-kinetic-lime',
      svgGlow: 'glow-cyan',
      svgStroke: '#00f0ff',
      trendColor: 'cyan',
      bgBadge: 'bg-kinetic-lime',
      btnGradient: 'from-kinetic-magenta to-kinetic-magenta/80',
      shadowBtn: 'shadow-magenta-900/20'
    }
  };

  return (
    <div className="w-full h-full relative overflow-y-auto custom-scrollbar font-sans">
      <style>{`
        .mesh-gradient-bg {
          background-color: #0b1326;
          background-image: 
            radial-gradient(at 0% 0%, hsla(180,100%,30%,0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, hsla(300,100%,30%,0.15) 0px, transparent 50%),
            radial-gradient(at 100% 100%, hsla(150,100%,30%,0.15) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsla(220,100%,30%,0.15) 0px, transparent 50%);
        }
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

        .status-pulse {
          animation: kinetic-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes kinetic-pulse {
          0%, 100% { transform: scale(1); opacity: 1; filter: brightness(1); }
          50% { transform: scale(1.1); opacity: 0.7; filter: brightness(1.5); }
        }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(255, 255, 255, 0.1); 
          border-radius: 10px; 
        }
      `}</style>

      <div className="mesh-gradient-bg min-h-full w-full p-4 md:p-8 text-[#dae2fd]">
        
        {/* Title */}
        <h2 className="text-3xl font-bold mb-8 tracking-tight text-white/95">Daily Pulse</h2>

        {/* Top Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          
          {/* Next Class Widget */}
          <div className="glass-card-ecc tint-cyan rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-kinetic-cyan/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-center mb-4 relative z-10">
              <span className="text-sm font-semibold text-kinetic-cyan">Next Class</span>
              <span className="material-symbols-outlined text-kinetic-cyan/60">more_horiz</span>
            </div>
            <div className="relative z-10">
              <h3 className="text-5xl font-bold tracking-tighter text-white mb-2 font-mono group-hover:scale-105 transition-transform origin-left">
                {formatTime()}
              </h3>
              <p className="text-sm text-[#00f0ff]">{displayClasses[0]?.name || 'Algebra 2'} - {displayClasses[0]?.section || 'Room 302'}</p>
            </div>
          </div>

          {/* Pending Grades Widget */}
          <div className="glass-card-ecc tint-magenta rounded-2xl p-6 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-kinetic-magenta/5 to-transparent opacity-50"></div>
            <div className="flex justify-between items-center mb-4 relative z-10">
              <span className="text-sm font-semibold text-kinetic-magenta">Pending Grades</span>
              <div className="relative">
                 <span className="material-symbols-outlined text-kinetic-magenta glow-magenta">notifications</span>
                 <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kinetic-magenta opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-kinetic-magenta"></span>
                  </span>
              </div>
            </div>
            <div className="relative z-10 flex flex-col justify-center mt-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-kinetic-magenta status-pulse glow-magenta"></div>
                <h3 className="text-5xl font-bold text-white">12</h3>
              </div>
              <p className="text-sm text-[#ffabf3] ml-6">2 Sections to Review</p>
            </div>
          </div>

          {/* Student Alerts Widget */}
          <div className="glass-card-ecc tint-lime rounded-2xl p-6 group">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-kinetic-lime">Student Alerts</span>
              <span className="material-symbols-outlined text-kinetic-lime/60 hover:text-kinetic-lime transition-colors cursor-pointer">more_horiz</span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { text: 'Sarah M. - Absent', icon: 'notifications', isAbsent: true },
                { text: 'Project Deadline Today', icon: 'notifications', isAbsent: false },
                { text: 'Parent Meeting Request', icon: 'notifications', isAbsent: false }
              ].map((alert, idx) => (
                <div key={idx} className={`rounded-xl p-3 flex items-center gap-3 border transition-colors cursor-pointer ${alert.isAbsent ? 'bg-kinetic-lime/10 border-kinetic-lime/20 hover:bg-kinetic-lime/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                  <span className={`material-symbols-outlined text-sm ${alert.isAbsent ? 'text-kinetic-lime glow-lime' : 'text-kinetic-cyan glow-cyan'}`}>{alert.icon}</span>
                  <span className={`text-xs font-medium ${alert.isAbsent ? 'text-kinetic-lime' : 'text-white'}`}>{alert.text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Classes List */}
        <div className="flex flex-col gap-5">
          {displayClasses.map((cls) => {
            const theme = themeConfig[cls.theme] || themeConfig.cyan;
            return (
              <div key={cls.id} className="relative group">
                <div className="glass-card-ecc rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all transform hover:-translate-y-1 hover:bg-white/[0.05] duration-300">
                  
                  {/* Class Info */}
                  <div className="flex-1 w-full md:w-auto">
                    <h3 className={`text-xl font-bold text-white mb-1 tracking-tight ${theme.hoverText} transition-colors`}>{cls.name}</h3>
                    <p className="text-sm text-slate-400 mb-0.5">{cls.section}</p>
                    <p className="text-sm text-slate-400">{cls.subSection}</p>
                  </div>

                  {/* Attendance Trend Chart (SVG) */}
                  <div className="flex flex-col items-center justify-center flex-1 w-full md:w-auto">
                    <svg className="w-32 h-10 overflow-visible mb-2" viewBox="0 0 100 30">
                      <defs>
                        <linearGradient id={`trend-${cls.theme}-${cls.id}`} x1="0%" x2="0%" y1="0%" y2="100%">
                          <stop offset="0%" stopColor={theme.svgStroke} stopOpacity="0.4"></stop>
                          <stop offset="100%" stopColor={theme.svgStroke} stopOpacity="0"></stop>
                        </linearGradient>
                      </defs>
                      <path 
                        className={theme.svgGlow} 
                        d={cls.theme === 'magenta' ? "M 0 5 C 30 5, 50 25, 75 20 C 100 15, 110 25, 120 25" : "M 0 25 C 20 25, 30 10, 45 15 C 60 20, 80 5, 120 10"} 
                        fill="none" 
                        stroke={theme.svgStroke} 
                        strokeLinecap="round" 
                        strokeWidth="3">
                      </path>
                      <path 
                        d={cls.theme === 'magenta' ? "M 0 5 C 30 5, 50 25, 75 20 C 100 15, 110 25, 120 25 V 35 H 0 Z" : "M 0 25 C 20 25, 30 10, 45 15 C 60 20, 80 5, 120 10 V 35 H 0 Z"} 
                        fill={`url(#trend-${cls.theme}-${cls.id})`} 
                        stroke="none">
                      </path>
                    </svg>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Attendance Trend</span>
                  </div>

                  {/* Top Performers */}
                  <div className="flex flex-col items-center justify-center flex-1 w-full md:w-auto">
                    <div className="flex -space-x-3 mb-2">
                      <img className="w-10 h-10 rounded-full border-2 border-[#0b1326] object-cover" src="https://i.pravatar.cc/100?img=11" alt="Student" />
                      <img className="w-10 h-10 rounded-full border-2 border-[#0b1326] object-cover" src="https://i.pravatar.cc/100?img=5" alt="Student" />
                      <img className="w-10 h-10 rounded-full border-2 border-[#0b1326] object-cover" src="https://i.pravatar.cc/100?img=8" alt="Student" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Top Performers: {cls.performers}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-none mt-4 md:mt-0 w-full md:w-auto justify-end">
                    <button className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors border border-white/10">
                      View Class
                    </button>
                    <button className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${theme.btnGradient} text-[#0b1326] text-sm font-bold transition-all shadow-lg ${theme.shadowBtn}`}>
                      Grade
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
