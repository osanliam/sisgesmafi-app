import React, { useState, useContext } from 'react';
import { DatabaseContext } from '../context/DatabaseContext';

function Login() {
  const { loginWithCredentials } = useContext(DatabaseContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate small latency for premium feel
    setTimeout(() => {
      const result = loginWithCredentials(username.trim(), password.trim());
      setIsLoading(false);
      if (!result.success) {
        setError(result.message || 'Credenciales inválidas. Intente nuevamente.');
      }
    }, 800);
  };

  return (
    <div 
      className="min-h-screen w-screen flex flex-col relative font-sans text-slate-800"
      style={{
        backgroundColor: '#2a0a0f',
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        backgroundPosition: 'center center'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1a0508]/80 z-0 pointer-events-none"></div>
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-12 py-10 z-10 w-full max-w-[1440px] mx-auto">
        <div className="bg-white shadow-[0_20px_40px_rgba(0,0,0,0.2)] w-full max-w-[480px] rounded-[32px] p-10 flex flex-col relative overflow-hidden">
          
          <div className="text-center mb-10">
            <div className="w-24 h-32 mx-auto mb-4 flex items-center justify-center drop-shadow-md">
              <img 
                alt="Logo" 
                className="w-full h-full object-contain" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0VSGNklkWfrHTBrRp4UhENll4_ZVpovzYPqQ9sYvwVI2z3jWOjEBKZfExPwnmikZULKEOs7Ylsz8PahMRmXpqwtHyJbVU8GAnZnLPhXAYjCOVWJBos0L0RTPoMWyvCSk3nG3oC9KP25TQI1XRQd3ltPHFnOVPjd9n_Q77hb66iF8eVbRG-Bk7nJ7Ms1AprAtDUB8yFtNOHdGd9nr-obCEiI7CSPoWGpl6V5-X7PKp9_emiZUhCZbcR53arb-POCsRK43F7TZMvk8"
              />
            </div>
            <h1 className="text-[28px] md:text-[32px] leading-[36px] md:leading-[40px] text-[#0b1c30] mb-1 tracking-tight font-bold" style={{ fontFamily: '"Playfair Display", serif' }}>
              IE Manuel Fidencio<br/>Hidalgo Flores
            </h1>
            <p className="text-[16px] leading-[24px] text-[#5c647a] tracking-wide font-medium">
              Nueva Cajamarca
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 flex-1">
            <div className="space-y-2 group">
              <label htmlFor="username" className="text-[14px] leading-[20px] tracking-wide flex items-center gap-2 font-bold text-[#3e484d]">
                <span className="material-symbols-outlined text-[16px] text-[#e11d48]">person</span>
                USUARIO O EMAIL
              </label>
              <div className="relative flex items-center rounded-xl bg-white border border-[#bdc8ce] transition-all duration-200 focus-within:shadow-[0_0_0_2px_rgba(225,29,72,0.2)] focus-within:border-[#e11d48]">
                <input 
                  id="username" 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin.mfhf o usuario@mfhf.local" 
                  className="w-full bg-transparent border-none focus:ring-0 py-4 px-4 text-[16px] text-[#0b1c30] placeholder:text-[#bdc8ce] rounded-xl outline-none"
                />
                <span className={`material-symbols-outlined absolute right-4 text-[#e11d48] transition-opacity ${username.length > 5 ? 'opacity-100' : 'opacity-0'}`}>
                  check_circle
                </span>
              </div>
              <p className="text-xs text-[#6e797e] mt-1">Usa tu usuario del sistema o email completo</p>
            </div>

            <div className="space-y-2 group">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-[14px] leading-[20px] tracking-wide flex items-center gap-2 font-bold text-[#3e484d]">
                  <span className="material-symbols-outlined text-[16px] text-[#cca000]">lock</span>
                  CONTRASEÑA
                </label>
              </div>
              <div className="relative flex items-center rounded-xl bg-white border border-[#bdc8ce] transition-all duration-200 focus-within:shadow-[0_0_0_2px_rgba(225,29,72,0.2)] focus-within:border-[#e11d48]">
                <input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-transparent border-none focus:ring-0 py-4 px-4 text-[16px] text-[#0b1c30] placeholder:text-[#bdc8ce] rounded-xl outline-none"
                />
              </div>
              <p className="text-xs text-[#6e797e] mt-1">Mínimo 6 caracteres</p>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#e11d48] text-white text-[16px] py-[14px] px-10 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 font-semibold shadow-md disabled:opacity-70"
              >
                {isLoading ? 'Ingresando...' : 'Ingresar a la Plataforma'}
                {!isLoading && (
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 pt-6 border-t border-[#bdc8ce]/30 text-center">
            <p className="text-[16px] text-[#3e484d]">
              ¿Problemas para iniciar sesión?<br/>
              <a href="#" className="text-[14px] text-[#e11d48] hover:underline font-bold">
                Contacta al administrador
              </a>
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-transparent full-width bottom-0 z-10 w-full backdrop-blur-sm bg-black/20">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-6 w-full max-w-7xl mx-auto border-t border-white/10">
          <p className="text-[16px] text-white/80 mb-4 md:mb-0 text-center md:text-left">
            © 2024 IE Manuel Fidencio Hidalgo Flores. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[12px] font-semibold text-white/80 hover:text-white transition-colors">
              Soporte
            </a>
            <a href="#" className="text-[12px] font-semibold text-white/80 hover:text-white transition-colors">
              Política de Privacidad
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Login;
