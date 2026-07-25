import React, { useState, useContext } from 'react';
import { DatabaseContext } from '../context/DatabaseContext';

function Login() {
  const { loginWithCredentials } = useContext(DatabaseContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError('');
    
    // Auto fill helpful presets for testing
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin');
    } else {
      setUsername('');
      setPassword('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate premium visual latency
    setTimeout(() => {
      const result = loginWithCredentials(username.trim(), password.trim());
      setIsLoading(false);
      if (!result.success) {
        setError(result.message || 'DNI o contraseña incorrectos.');
      }
    }, 1200);
  };

  // Helper to determine placeholder and description based on role
  const getRoleGuidance = () => {
    switch (selectedRole) {
      case 'admin':
        return {
          placeholder: 'admin o DNI',
          helper: 'Usa "admin" para ingresar al sistema de pruebas'
        };
      case 'director':
        return {
          placeholder: 'DNI del Director',
          helper: 'Ingresa tu DNI registrado como Director'
        };
      case 'maestro':
        return {
          placeholder: 'DNI del Docente',
          helper: 'Ingresa tu DNI registrado como docente'
        };
      case 'alumno':
        return {
          placeholder: 'DNI del Alumno',
          helper: 'Ingresa tu DNI registrado como estudiante'
        };
      case 'padre':
        return {
          placeholder: 'p_DNI (ej: p_12345678)',
          helper: 'Escribe "p_" seguido del DNI de su hijo'
        };
      default:
        return {
          placeholder: 'DNI o usuario',
          helper: 'Usa tus credenciales oficiales'
        };
    }
  };

  const guidance = getRoleGuidance();

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-transparent font-sans text-slate-800 relative overflow-x-hidden">
      <style>{`
        .floating-shape {
            position: absolute;
            z-index: 0;
            filter: blur(90px);
            opacity: 0.2;
            animation: float 20s infinite alternate ease-in-out;
        }

        @keyframes float {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(50px, -70px) scale(1.12); }
            100% { transform: translate(-30px, 30px) scale(1); }
        }

        .gradient-btn {
            background: linear-gradient(135deg, #e11d48 0%, #be123c 100%);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .gradient-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 28px rgba(225, 29, 72, 0.35);
        }

        .emoji-3d {
            font-size: 1.8rem;
            line-height: 1;
            filter: drop-shadow(0 1px 0 #b3b3b3) 
                    drop-shadow(0 2px 0 #999) 
                    drop-shadow(0 3px 0 #808080)
                    drop-shadow(0 4px 4px rgba(0,0,0,0.25));
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-block;
        }

        .role-card:hover .emoji-3d {
            transform: translateY(-4px) scale(1.15) rotate(5deg);
            filter: drop-shadow(0 1px 0 #e11d48) 
                    drop-shadow(0 2px 0 #be123c) 
                    drop-shadow(0 4px 6px rgba(225, 29, 72, 0.35));
        }

        .role-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            border: 1px solid rgba(226, 232, 240, 0.8);
            background-color: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(4px);
        }

        .role-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
            border-color: rgba(225, 29, 72, 0.3);
        }

        .role-radio:checked + .role-card {
            border-color: #e11d48;
            background-color: rgba(225, 29, 72, 0.06);
            transform: translateY(-4px);
            box-shadow: 0 10px 20px rgba(225, 29, 72, 0.15);
        }

        .role-radio:checked + .role-card .emoji-3d {
            transform: scale(1.1) translateZ(5px);
            filter: drop-shadow(0 1px 0 #e11d48) 
                    drop-shadow(0 2px 0 #be123c) 
                    drop-shadow(0 4px 6px rgba(225, 29, 72, 0.4));
        }
      `}</style>

      {/* Modern Abstract Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="floating-shape bg-gradient-to-tr from-[#e11d48] to-[#ffcbd5] w-[600px] h-[600px] rounded-full -top-40 -left-40 opacity-40"></div>
        <div className="floating-shape bg-gradient-to-tr from-rose-100 to-amber-100 w-[500px] h-[500px] rounded-full top-1/4 -right-40 opacity-40"></div>
        <div className="floating-shape bg-gradient-to-tr from-emerald-50 to-teal-50 w-[400px] h-[400px] rounded-full -bottom-20 left-1/3 opacity-30"></div>
      </div>

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(225,29,72,0.12)] overflow-hidden border border-white/40 dark:border-slate-800/50">
        
        {/* Visual Impact Side */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-16 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 relative overflow-hidden border-r border-slate-200/60 dark:border-slate-800">
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
          </div>
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-3.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-3 pr-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <img src="/logo.png" alt="Logo Manuel Fidencio" className="h-10 w-auto object-contain shrink-0" />
              <span className="text-xs font-black text-slate-700 dark:text-slate-250 tracking-wider uppercase">Portal de Acceso</span>
            </div>
            <div className="space-y-4 pt-8 text-slate-800 dark:text-slate-100">
              <h1 className="text-4xl font-extrabold leading-tight text-slate-900 dark:text-white">
                El futuro de la <br/>
                <span className="bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent font-black">educación</span> hoy.
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-350 max-w-sm leading-relaxed font-medium">
                Gestiona, aprende y haz seguimiento al rendimiento escolar en el portal digital oficial de la I.E. Manuel Fidencio Hidalgo Flores.
              </p>
            </div>
          </div>
          <div className="relative z-10">
            <div className="relative">
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl opacity-40 animate-pulse"></div>
              <img 
                alt="Modern Educational Illustration" 
                className="w-full h-auto rounded-[32px] shadow-lg border border-slate-200/50 dark:border-slate-800 transform -rotate-1 hover:rotate-0 transition-transform duration-700 bg-white" 
                src="/educational_3d_light.jpg"
              />
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="lg:col-span-7 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white/40 dark:bg-transparent">
          <div className="w-full max-w-[520px] mx-auto space-y-10">
            <div className="flex flex-col items-center text-center space-y-4">
              <img 
                src="/logo.png" 
                alt="Logo Colegio Manuel Fidencio Hidalgo Flores" 
                className="h-24 w-auto object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.08)] transform hover:scale-105 transition-transform duration-300" 
              />
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
                  IE Manuel Fidencio
                </h1>
                <h1 className="text-2xl md:text-3xl font-black text-[#e11d48] dark:text-[#f43f5e] tracking-tight uppercase leading-none">
                  Hidalgo Flores
                </h1>
                <p className="text-[10px] md:text-xs font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest pt-1">
                  Nueva Cajamarca
                </p>
              </div>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 w-full text-center space-y-1">
                <h2 className="text-sm font-black text-slate-850 dark:text-slate-200 tracking-wider uppercase">Acceso Intranet</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ingresa tus credenciales para acceder a la plataforma escolar.</p>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-450 text-xs font-semibold flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Role Selection */}
              <div className="space-y-3.5">
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block">
                  Selecciona tu perfil institucional
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {/* Admin */}
                  <label className="relative block group">
                    <input 
                      type="radio" 
                      name="role" 
                      value="admin"
                      checked={selectedRole === 'admin'}
                      onChange={() => handleRoleChange('admin')}
                      className="role-radio sr-only" 
                    />
                    <div className="role-card flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-center gap-1.5 h-full">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-blue-50/50 dark:bg-blue-950/20 transition-all">
                        <span className="emoji-3d">🛠️</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">Admin</span>
                    </div>
                  </label>

                  {/* Director */}
                  <label className="relative block group">
                    <input 
                      type="radio" 
                      name="role" 
                      value="director"
                      checked={selectedRole === 'director'}
                      onChange={() => handleRoleChange('director')}
                      className="role-radio sr-only" 
                    />
                    <div className="role-card flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-center gap-1.5 h-full">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-rose-50/50 dark:bg-rose-950/20 transition-all">
                        <span className="emoji-3d">🏛️</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">Director</span>
                    </div>
                  </label>

                  {/* Teacher */}
                  <label className="relative block group">
                    <input 
                      type="radio" 
                      name="role" 
                      value="maestro"
                      checked={selectedRole === 'maestro'}
                      onChange={() => handleRoleChange('maestro')}
                      className="role-radio sr-only" 
                    />
                    <div className="role-card flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-center gap-1.5 h-full">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-emerald-50/50 dark:bg-emerald-950/20 transition-all">
                        <span className="emoji-3d">📚</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">Docente</span>
                    </div>
                  </label>

                  {/* Student */}
                  <label className="relative block group">
                    <input 
                      type="radio" 
                      name="role" 
                      value="alumno"
                      checked={selectedRole === 'alumno'}
                      onChange={() => handleRoleChange('alumno')}
                      className="role-radio sr-only" 
                    />
                    <div className="role-card flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-center gap-1.5 h-full">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-orange-50/50 dark:bg-orange-950/20 transition-all">
                        <span className="emoji-3d">🎓</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">Alumno</span>
                    </div>
                  </label>

                  {/* Parent */}
                  <label className="relative block group">
                    <input 
                      type="radio" 
                      name="role" 
                      value="padre"
                      checked={selectedRole === 'padre'}
                      onChange={() => handleRoleChange('padre')}
                      className="role-radio sr-only" 
                    />
                    <div className="role-card flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-800 rounded-2xl text-center gap-1.5 h-full">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-purple-50/50 dark:bg-purple-950/20 transition-all">
                        <span className="emoji-3d">👪</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">Padre</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor="email">DNI o Usuario</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#e11d48] transition-colors text-xl">alternate_email</span>
                    <input 
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl focus:ring-4 focus:ring-rose-500/5 focus:border-[#e11d48] outline-none transition-all text-sm font-medium" 
                      id="email" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={guidance.placeholder} 
                      required 
                      type="text"
                    />
                  </div>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">{guidance.helper}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor="password">Contraseña</label>
                    <a className="text-[11px] text-[#e11d48] dark:text-rose-400 font-bold hover:underline" href="#" onClick={(e) => { e.preventDefault(); alert("Por favor contacte al administrador de TI para recuperar sus credenciales."); }}>Recuperar contraseña</a>
                  </div>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#e11d48] transition-colors text-xl">lock_person</span>
                    <input 
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl focus:ring-4 focus:ring-rose-500/5 focus:border-[#e11d48] outline-none transition-all text-sm font-medium" 
                      id="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      required 
                      type={showPassword ? "text" : "password"}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black transition-colors text-xl"
                    >
                      {showPassword ? "visibility_off" : "visibility"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Login Button */}
              <button 
                className="gradient-btn w-full py-4.5 rounded-[20px] text-sm text-white font-black flex items-center justify-center gap-2.5 shadow-xl active:scale-[0.98] transition-all" 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar ahora</span>
                    <span className="material-symbols-outlined text-lg">login</span>
                  </>
                )}
              </button>

            </form>

            <div className="pt-6 text-center border-t border-slate-100 dark:border-slate-850">
              <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                ¿Problemas para acceder? <a className="text-[#e11d48] dark:text-rose-400 font-extrabold hover:underline" href="#" onClick={(e) => { e.preventDefault(); alert("Contacte a la mesa de ayuda: soporte@institucion.edu"); }}>Soporte técnico</a>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;
