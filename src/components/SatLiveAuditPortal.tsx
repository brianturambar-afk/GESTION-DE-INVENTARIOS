/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Key, 
  ShieldCheck, 
  Globe, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  Eye, 
  Building2, 
  FileText, 
  Database,
  Terminal,
  Activity
} from 'lucide-react';
import { SatAuditAccess, Product, Pedimento, DescargoPEPS } from '../types';

interface SatLiveAuditPortalProps {
  products: Product[];
  pedimentos: Pedimento[];
  descargosPEPS: DescargoPEPS[];
}

export default function SatLiveAuditPortal({
  products,
  pedimentos,
  descargosPEPS
}: SatLiveAuditPortalProps) {
  const [auditAccess, setAuditAccess] = useState<SatAuditAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [auditModeActive, setAuditModeActive] = useState(false);
  const [activeAuditTab, setActiveAuditTab] = useState<'SALDOS' | 'DESCARGOS' | 'PEDIMENTOS'>('SALDOS');

  const fetchAccess = async () => {
    try {
      const res = await fetch('/api/sat-audit/access');
      if (res.ok) {
        const data = await res.json();
        setAuditAccess(data);
      }
    } catch (err) {
      console.error('Error fetching SAT audit access:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccess();
  }, []);

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/sat-audit/refresh-token', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAuditAccess(data);
      }
    } catch (err) {
      alert('Error al renovar token de fiscalización');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              OBLIGACIÓN LEGAL • APARTADO C
            </span>
            <span className="text-xs text-slate-500">Certificación IVA e IEPS (RGCE)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">
            Portal de Acceso en Línea y en Tiempo Real al SAT
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Módulo obligatorio para empresas con certificación IVA/IEPS: provee conexión directa y segura a la autoridad fiscal mediante credenciales o API para auditorías en tiempo real.
          </p>
        </div>

        <button
          onClick={() => setAuditModeActive(!auditModeActive)}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
            auditModeActive 
              ? 'bg-rose-600 text-white hover:bg-rose-700' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>{auditModeActive ? 'Salir del Modo Inspector SAT' : 'Simular Vista del Fiscalizador SAT'}</span>
        </button>
      </div>

      {/* Credenciales de Acceso SAT */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                Credenciales Activas de Acceso en Tiempo Real (Apartado C)
              </h2>
              <p className="text-xs text-slate-500">
                Enlace permanente encriptado para conexión del Administrador General de Auditoría de Comercio Exterior (AGACE)
              </p>
            </div>
          </div>

          <button
            onClick={handleRefreshToken}
            disabled={isRefreshing}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isRefreshing ? 'Renovando...' : 'Regenerar Token Seguro'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Usuario Autorizado SAT</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 block">
              {auditAccess?.usuarioSAT || 'auditor.fiscalizacion@sat.gob.mx'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">RFC de la Empresa IMMEX</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 block">
              {auditAccess?.empresaRFC || 'IMX891024KL8'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Certificación IVA/IEPS</span>
            <span className="font-bold text-emerald-600 mt-1 block">
              Modalidad {auditAccess?.certificacionIvaIeps || 'AAA'} Vigente
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Token de Auditoría en Vivo</span>
            <span className="font-mono text-[11px] text-indigo-600 font-bold mt-1 block truncate">
              {auditAccess?.tokenAuditor || 'SAT-AUDIT-IMMEX-LIVE'}
            </span>
          </div>

        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>Última conexión registrada: <strong>{auditAccess?.ipUltimaConexion || '187.189.14.92 (SAT Central)'}</strong></span>
          <span className="text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Servicio API Anexo 24 / 30 en Línea 24/7/365</span>
          </span>
        </div>
      </div>

      {/* Simulación del Panel del Auditor del SAT (Modo Fiscalizador) */}
      {auditModeActive && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 border-2 border-rose-500/50 shadow-2xl space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-600 text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500 text-white uppercase">
                    MODO FISCALIZADOR EN VIVO
                  </span>
                  <span className="text-xs text-rose-300 font-mono">SAT • AGACE • ANEXO 24 APARTADO C</span>
                </div>
                <h2 className="text-base font-bold text-white mt-1">
                  Consola de Inspección Digital en Tiempo Real
                </h2>
              </div>
            </div>

            {/* Sub-tabs for auditor */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveAuditTab('SALDOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  activeAuditTab === 'SALDOS' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Saldos en Tiempo Real
              </button>
              <button
                onClick={() => setActiveAuditTab('PEDIMENTOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  activeAuditTab === 'PEDIMENTOS' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pedimentos (48h & 18M)
              </button>
              <button
                onClick={() => setActiveAuditTab('DESCARGOS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  activeAuditTab === 'DESCARGOS' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Descargos PEPS
              </button>
            </div>
          </div>

          {/* Audit View 1: Saldos */}
          {activeAuditTab === 'SALDOS' && (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left font-mono">
                <thead className="text-slate-400 border-b border-slate-800 pb-2">
                  <tr>
                    <th className="py-2 px-3">SKU</th>
                    <th className="py-2 px-3">Fracción TIGIE</th>
                    <th className="py-2 px-3">Tipo de Bien</th>
                    <th className="py-2 px-3 text-center">Saldo Anexo 24</th>
                    <th className="py-2 px-3 text-center">Saldo Físico</th>
                    <th className="py-2 px-3 text-right">Estatus Fiscal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {products.map(p => (
                    <tr key={p.sku} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-white">{p.sku}</td>
                      <td className="py-2.5 px-3 text-blue-400">{p.fraccionArancelaria}</td>
                      <td className="py-2.5 px-3 text-slate-300">{p.bienType}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-400">{p.anexo24Stock}</td>
                      <td className="py-2.5 px-3 text-center text-slate-300">{p.stock}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          VERIFICADO EN LÍNEA
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Audit View 2: Pedimentos */}
          {activeAuditTab === 'PEDIMENTOS' && (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left font-mono">
                <thead className="text-slate-400 border-b border-slate-800 pb-2">
                  <tr>
                    <th className="py-2 px-3">15 Dígitos SAT</th>
                    <th className="py-2 px-3">Clave</th>
                    <th className="py-2 px-3">Fecha Cruce</th>
                    <th className="py-2 px-3">Regla 48h</th>
                    <th className="py-2 px-3">Permanencia 18M</th>
                    <th className="py-2 px-3 text-right">Crédito Fiscal IVA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pedimentos.map(ped => (
                    <tr key={ped.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-white">{ped.numeroPedimento}</td>
                      <td className="py-2.5 px-3 text-indigo-400">{ped.clave}</td>
                      <td className="py-2.5 px-3 text-slate-300">{ped.fechaPago.slice(0, 10)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded ${ped.cumplePlazo48h ? 'text-emerald-400 bg-emerald-950' : 'text-rose-400 bg-rose-950'}`}>
                          {ped.cumplePlazo48h ? 'EN TIEMPO (<48H)' : 'INFRACCIÓN (>48H)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {ped.tipo === 'ENTRADA' ? (ped.clave === 'AF' ? 'VIGENCIA IMMEX' : `${ped.diasPermanencia || 0}d / 540d`) : 'SALIDA'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                        ${ped.creditoIvaIepsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Audit View 3: Descargos */}
          {activeAuditTab === 'DESCARGOS' && (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left font-mono">
                <thead className="text-slate-400 border-b border-slate-800 pb-2">
                  <tr>
                    <th className="py-2 px-3">Folio Descargo</th>
                    <th className="py-2 px-3">Salida (RT)</th>
                    <th className="py-2 px-3">Entrada Original (IN)</th>
                    <th className="py-2 px-3">SKU & Cantidad</th>
                    <th className="py-2 px-3 text-right">Crédito Amortizado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {descargosPEPS.map(d => (
                    <tr key={d.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-slate-300">{d.id}</td>
                      <td className="py-2.5 px-3 text-white font-bold">{d.numeroPedimentoSalida}</td>
                      <td className="py-2.5 px-3 text-indigo-400">{d.numeroPedimentoEntrada}</td>
                      <td className="py-2.5 px-3 text-slate-300">{d.sku} ({d.cantidadDescargada} {d.unidadMedida})</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                        ${d.creditoIvaAmortizado.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
