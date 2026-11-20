/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Lock, Mail, User, Shield, Server, Sparkles } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: { email: string; name: string; role: string }, token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('OPERATOR'); // OPERATOR, AUDITOR, ADMIN
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
    const body = isRegisterMode 
      ? { email, password, name, role } 
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error en la autenticación');
      }

      // Successful login/register
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        
        {/* Banner with B2B Tech Vibe */}
        <div className="bg-slate-900 dark:bg-slate-950 p-6 text-center border-b border-slate-800 relative">
          <div className="absolute top-4 right-4 flex items-center space-x-1 text-[9px] font-mono text-emerald-500 bg-emerald-950/40 px-2 py-0.5 rounded-sm">
            <Server className="h-3 w-3" />
            <span>CLOUD SYNCHRONIZED</span>
          </div>
          
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-3 shadow-md">
            <Database className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight uppercase">KardexFlow</h2>
          <p className="text-xs text-slate-400 mt-1">Plataforma ERP de Gestión de Inventario B2B</p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <button
              onClick={() => {
                setIsRegisterMode(false);
                setError('');
              }}
              className={`text-xs font-semibold tracking-wider uppercase transition-all pb-2 border-b-2 ${
                !isRegisterMode 
                  ? 'border-blue-600 text-slate-900 dark:text-white' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => {
                setIsRegisterMode(true);
                setError('');
              }}
              className={`text-xs font-semibold tracking-wider uppercase transition-all pb-2 border-b-2 ${
                isRegisterMode 
                  ? 'border-blue-600 text-slate-900 dark:text-white' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Registrarse
            </button>
          </div>

          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-900/30 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name - Register only */}
            {isRegisterMode && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ing. Miguel Ángel"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Correo de la Empresa</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="ejemplo@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder-slate-400 font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder-slate-400 font-mono"
                />
              </div>
            </div>

            {/* Role - Register only */}
            {isRegisterMode && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rol Organizacional</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white focus:outline-hidden"
                  >
                    <option value="OPERATOR">Operador (Entradas y Salidas)</option>
                    <option value="AUDITOR">Auditor de Calidad (Kardex Law)</option>
                    <option value="ADMIN">Administrador General (Acceso Total)</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-sm"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <span>{isRegisterMode ? 'Crear Cuenta' : 'Ingresar al Ledger'}</span>
              )}
            </button>
          </form>

          {/* Explanation on Progressive Web Apps & Client/Cloud storage */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <div className="flex items-start space-x-2 text-[10px] text-slate-500 dark:text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-slate-700 dark:text-slate-300">Sincronización Inteligente de Almacenamiento:</strong>
                <p className="mt-0.5">
                  Los datos se resguardan en la **Nube de Google (Firebase Firestore)** y se cachean en el **Almacenamiento Local (localStorage)** de su computadora. Esto le permite operar con alta velocidad y persistencia sin descargas de tiendas de aplicaciones.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
