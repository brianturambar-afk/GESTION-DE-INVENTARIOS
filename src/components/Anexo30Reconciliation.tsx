/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  RefreshCw, 
  ShieldCheck, 
  DollarSign, 
  ArrowRight, 
  FileCheck, 
  HelpCircle,
  AlertOctagon,
  Download,
  Layers,
  FileCode,
  Calendar,
  ClipboardList,
  AlertCircle,
  CheckSquare,
  Square,
  FileText,
  Eye,
  X
} from 'lucide-react';
import { 
  ConciliacionAnexo30Item, 
  DiscrepanciaAnexo30Detalle, 
  ScccgyTransmision, 
  ChecklistMensualItem 
} from '../types';

interface Anexo30ReconciliationProps {
  onTransmitSuccess?: () => void;
}

export default function Anexo30Reconciliation({ onTransmitSuccess }: Anexo30ReconciliationProps) {
  const [activeTab, setActiveTab] = useState<'TRIPARTITA' | 'DISCREPANCIAS_MAPEO' | 'LAYOUT_XML' | 'CHECKLIST_MENSUAL'>('TRIPARTITA');
  
  // Data states
  const [items, setItems] = useState<ConciliacionAnexo30Item[]>([]);
  const [scccygReportes, setScccygReportes] = useState<any[]>([]);
  const [discrepancias, setDiscrepancias] = useState<DiscrepanciaAnexo30Detalle[]>([]);
  const [transmisiones, setTransmisiones] = useState<ScccgyTransmision[]>([]);
  const [checklist, setChecklist] = useState<ChecklistMensualItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Transmission state
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionAcuse, setTransmissionAcuse] = useState<string | null>(null);

  // XML modal preview
  const [selectedXml, setSelectedXml] = useState<string | null>(null);

  // Inconformidad SAT Modal
  const [isInconformidadModalOpen, setIsInconformidadModalOpen] = useState(false);
  const [selectedDiscrepancia, setSelectedDiscrepancia] = useState<DiscrepanciaAnexo30Detalle | null>(null);
  const [motivoAclaracion, setMotivoAclaracion] = useState('Error en el balance de créditos del portal SCCCyG por inconsistencia de timbre aduanero.');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resConcil, resScccyg, resDisc, resTx, resChk] = await Promise.all([
        fetch('/api/anexo30/conciliacion'),
        fetch('/api/anexo30/scccyg-reportes'),
        fetch('/api/anexo30/discrepancias'),
        fetch('/api/anexo30/transmisiones-scccyg'),
        fetch('/api/checklist-mensual')
      ]);

      if (resConcil.ok) setItems(await resConcil.json());
      if (resScccyg.ok) setScccygReportes(await resScccyg.json());
      if (resDisc.ok) setDiscrepancias(await resDisc.json());
      if (resTx.ok) setTransmisiones(await resTx.json());
      if (resChk.ok) setChecklist(await resChk.json());
    } catch (err) {
      console.error('Error fetching Anexo 30 data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransmitirSAT = async (sku?: string) => {
    setIsTransmitting(true);
    setTransmissionAcuse(null);
    try {
      const res = await fetch('/api/anexo30/transmitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku })
      });
      if (res.ok) {
        const data = await res.json();
        setTransmissionAcuse(data.acuseSAT);
        await fetchData();
        if (onTransmitSuccess) onTransmitSuccess();
      }
    } catch (err) {
      alert('Error al transmitir al portal SAT Anexo 30');
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleGenerarLayoutXml = async () => {
    setIsTransmitting(true);
    try {
      const res = await fetch('/api/anexo30/transmisiones-scccyg/generar-layout-xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodo: '2026-OCTUBRE-Q2', tipoInforme: 'DESCARGO_PEPS' })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedXml(data.xml);
        await fetchData();
        alert('¡Layout XML generado exitosamente según especificación técnica del SAT SCCCyG!');
      }
    } catch (err) {
      alert('Error al generar XML');
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleResolverDiscrepancia = async (id: string, tipoResolucion: string) => {
    try {
      const res = await fetch(`/api/anexo30/discrepancias/${id}/resolver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipoResolucion })
      });
      if (res.ok) {
        await fetchData();
        alert('¡Discrepancia solventada! El crédito fiscal ha sido regularizado en el portal.');
      }
    } catch (err) {
      alert('Error al solventar discrepancia');
    }
  };

  const handlePresentarAclaracionSAT = async () => {
    if (!selectedDiscrepancia) return;
    try {
      const res = await fetch('/api/anexo30/aclaracion-sat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedimento: selectedDiscrepancia.pedimentoAfectado,
          sku: selectedDiscrepancia.sku,
          motivoInconformidad: motivoAclaracion
        })
      });
      if (res.ok) {
        const data = await res.json();
        setIsInconformidadModalOpen(false);
        await fetchData();
        alert(`¡Aviso de Aclaración presentado ante el SAT! Folio oficial: ${data.acuse.folioAclaracion}`);
      }
    } catch (err) {
      alert('Error al presentar aclaración ante el SAT');
    }
  };

  const handleToggleChecklist = async (item: ChecklistMensualItem) => {
    try {
      const res = await fetch(`/api/checklist-mensual/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completado: !item.completado })
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      alert('Error al actualizar checklist');
    }
  };

  const discrepanciasCount = items.filter(i => i.estadoCuadratura !== 'CUADRATURA_TOTAL').length;
  const creditoTotalEnRiesgo = items.reduce((acc, i) => acc + i.creditoFiscalIVAEnRiesgoUSD, 0);
  const totalDiscrepanciasMapeadas = discrepancias.filter(d => d.estatusSolucion === 'PENDIENTE').length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              PARTE 1 • ANEXO 30 vs ANEXO 24 SAT
            </span>
            <span className="text-xs text-slate-500">Sistema de Control de Cuentas de Créditos y Garantías (SCCCyG)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">
            Procedimiento de Conciliación & Transmisión de Descargos SCCCyG
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Regla de Oro IMMEX: <strong>Saldo Físico en Almacén = Saldo en Anexo 24 = Saldo en Portal de Retornos del Anexo 30</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleTransmitirSAT()}
            disabled={isTransmitting || discrepanciasCount === 0}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:bg-slate-400"
          >
            <Send className="w-4 h-4" />
            <span>{isTransmitting ? 'Transmitiendo al SAT...' : 'Transmitir Descargos al SCCCyG'}</span>
          </button>
          
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
            title="Recalcular Cuadratura"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Triangulation Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 border border-indigo-900/40 text-white shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 text-center">
          
          {/* Pillar 1 */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Pilar 1</span>
            <p className="text-xs text-indigo-300 font-semibold mb-1">Saldo Físico en Almacén</p>
            <p className="text-2xl font-black text-white">
              {items.reduce((acc, i) => acc + i.saldoFisicoAlmacen, 0)} <span className="text-xs font-normal text-slate-400">pzas</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Conteo cíclico en racks y bahías</p>
          </div>

          {/* Pillar 2 */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Pilar 2</span>
            <p className="text-xs text-indigo-300 font-semibold mb-1">Saldo en Anexo 24 (PEPS)</p>
            <p className="text-2xl font-black text-indigo-400">
              {items.reduce((acc, i) => acc + i.saldoAnexo24, 0)} <span className="text-xs font-normal text-slate-400">pzas</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Control de descargos automatizados</p>
          </div>

          {/* Pillar 3 */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Pilar 3</span>
            <p className="text-xs text-indigo-300 font-semibold mb-1">Portal Retornos Anexo 30 (SAT)</p>
            <p className="text-2xl font-black text-blue-400">
              {items.reduce((acc, i) => acc + i.saldoPortalAnexo30, 0)} <span className="text-xs font-normal text-slate-400">pzas</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Cuenta corriente de crédito fiscal</p>
          </div>

        </div>

        {/* Status bar in banner */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2">
            {discrepanciasCount === 0 ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Conciliación Tripartita 100% Cuadrada (Cero Contingencia Fiscal)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <AlertOctagon className="w-4 h-4 text-amber-400 animate-pulse" />
                {discrepanciasCount} SKU(s) con desfase. Crédito fiscal IVA en riesgo: ${creditoTotalEnRiesgo.toFixed(2)} USD
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-400">
            Frecuencia obligatoria: <strong>Mensual / Trimestral</strong> (Regla de Oro para evitar pérdida de Certificación IVA/IEPS).
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('TRIPARTITA')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'TRIPARTITA'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>1. Extracción & Cuadratura Tripartita</span>
        </button>

        <button
          onClick={() => setActiveTab('DISCREPANCIAS_MAPEO')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'DISCREPANCIAS_MAPEO'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>2. Mapeo de Discrepancias Frecuentes</span>
          {totalDiscrepanciasMapeadas > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
              {totalDiscrepanciasMapeadas}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('LAYOUT_XML')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'LAYOUT_XML'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>3. Transmisiones SCCCyG (Layout XML)</span>
        </button>

        <button
          onClick={() => setActiveTab('CHECKLIST_MENSUAL')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'CHECKLIST_MENSUAL'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>4. Checklist Mensual Blindaje IMMEX</span>
        </button>
      </div>

      {/* TAB 1: TRIPARTITE REPORT & COMPARISON */}
      {activeTab === 'TRIPARTITA' && (
        <div className="space-y-6">
          
          {/* SCCCyG vs Anexo 24 by Pedimento and Fracción */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                  Reporte de Saldos por Pedimento: Anexo 24 vs SCCCyG (Portal SAT)
                </h2>
                <p className="text-xs text-slate-500">
                  Desglosado a la misma fecha de corte por Fracción Arancelaria, Cantidad y Crédito IVA amparado
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerarLayoutXml}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Generar Layout XML</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Pedimento de Importación</th>
                    <th className="py-3 px-4">Fracción / SKU</th>
                    <th className="py-3 px-4 text-center">Importado</th>
                    <th className="py-3 px-4 text-center">Descargado PEPS</th>
                    <th className="py-3 px-4 text-center">Saldo Anexo 24</th>
                    <th className="py-3 px-4 text-center">Saldo SCCCyG (SAT)</th>
                    <th className="py-3 px-4 text-right">Crédito IVA Saldo</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {scccygReportes.map(rep => {
                    const isOk = rep.estadoConciliacion === 'CONCILIADO';
                    return (
                      <tr key={rep.numeroPedimento} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${!isOk ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}`}>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-100">
                          {rep.numeroPedimento}
                          <span className="ml-1 text-[10px] text-slate-400 font-normal">({rep.clave})</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{rep.fraccionArancelaria}</p>
                          <p className="text-[10px] text-slate-500">{rep.descripcion}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                          {rep.cantidadImportada} pzas
                        </td>
                        <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">
                          {rep.descargadoAnexo24} pzas
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                          {rep.saldoAnexo24} pzas
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-blue-600 dark:text-blue-400">
                          {rep.saldoPortalSCCCyG} pzas
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 dark:text-white">
                          ${rep.creditoIvaSaldoAnexo24USD.toFixed(2)} USD
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOk
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 animate-pulse'
                          }`}>
                            {isOk ? 'CONCILIADO' : `DESFASE (${rep.diferenciaUnidades > 0 ? `+${rep.diferenciaUnidades}` : rep.diferenciaUnidades})`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tripartite SKU Inventory Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                Cuadratura Tripartita por Artículo (Físico vs Anexo 24 vs SCCCyG)
              </h2>
              <p className="text-xs text-slate-500">
                Verificación simultánea del inventario real en piso contra registros de pedimento y créditos de certificación IVA/IEPS
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">SKU & Descripción</th>
                    <th className="py-3 px-4 text-center">Físico (Almacén)</th>
                    <th className="py-3 px-4 text-center">Anexo 24 (Sistema)</th>
                    <th className="py-3 px-4 text-center">SCCCyG (Portal SAT)</th>
                    <th className="py-3 px-4 text-center">Diferencias</th>
                    <th className="py-3 px-4 text-center">Estado de Cuadratura</th>
                    <th className="py-3 px-4 text-right">Acción Requerida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map(item => {
                    const isCuadrado = item.estadoCuadratura === 'CUADRATURA_TOTAL';
                    return (
                      <tr key={item.sku} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{item.sku}</p>
                          <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{item.descripcion}</p>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                          {item.saldoFisicoAlmacen} pzas
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                          {item.saldoAnexo24} pzas
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-blue-600 dark:text-blue-400">
                          {item.saldoPortalAnexo30} pzas
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          {item.diferencia24Vs30 !== 0 ? (
                            <span className="text-amber-600 font-bold">
                              SAT: {item.diferencia24Vs30 > 0 ? `+${item.diferencia24Vs30}` : item.diferencia24Vs30}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold">0 (Cuadrado)</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isCuadrado 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' 
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                          }`}>
                            {isCuadrado ? 'CUADRATURA 100%' : 'PENDIENTE TRANSMISIÓN SAT'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {!isCuadrado ? (
                            <button
                              onClick={() => handleTransmitirSAT(item.sku)}
                              disabled={isTransmitting}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Transmitir Descargo
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500">Conciliado</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: MAPEO DE DISCREPANCIAS FRECUENTES (LAS 4 CAUSAS TÍPICAS) */}
      {activeTab === 'DISCREPANCIAS_MAPEO' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-1">
              Mapeo de Causas Frecuentes de Descuadre (Anexo 24 vs Anexo 30)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              El SAT emite requerimientos de crédito fiscal principalmente por 4 inconsistencias operativas. Aquí puede revisar cada causa y ejecutar su Plan de Corrección y Regularización:
            </p>

            <div className="space-y-4">
              {discrepancias.map(d => {
                const isResolved = d.estatusSolucion !== 'PENDIENTE';
                return (
                  <div 
                    key={d.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isResolved 
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50' 
                        : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.tipoCausa === 'DESCARGO_NO_TRANSMITIDO' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                            d.tipoCausa === 'RECTIFICACION_R1_PENDIENTE' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                            d.tipoCausa === 'VIRTUAL_V1_EXTEMPORANEO' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {d.tipoCausa === 'DESCARGO_NO_TRANSMITIDO' ? '1. Informe de Descargo No Transmitido / Rechazado' :
                             d.tipoCausa === 'RECTIFICACION_R1_PENDIENTE' ? '2. Rectificación de Pedimento R1 No Avisada' :
                             d.tipoCausa === 'VIRTUAL_V1_EXTEMPORANEO' ? '3. Pedimento Complementario / Virtual V1 Extemporáneo' :
                             '4. Bajas por Merma/Desperdicio sin Informe'}
                          </span>

                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-white">
                            Pedimento: {d.pedimentoAfectado}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                          {d.descripcion} ({d.sku})
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {d.detalleTecnico}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Crédito IVA en Riesgo</span>
                        <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
                          ${d.montoIvaDiscrepanciaUSD.toFixed(2)} USD
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>Estatus Solución:</span>
                        <span className={`font-bold ${isResolved ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {d.estatusSolucion === 'ACLARADO_SAT' ? `Aclarado ante SAT (${d.folioAvisoAclaracionSAT})` :
                           d.estatusSolucion === 'TRANSMITIDO_CORREGIDO' ? 'Transmitido Corregido al SCCCyG' : 'Pendiente de Regularización'}
                        </span>
                      </div>

                      {!isResolved && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleResolverDiscrepancia(d.id, 'CORRECCION_RECHAZO')}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Corregir y Reenviar al SCCCyG</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedDiscrepancia(d);
                              setIsInconformidadModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Aviso de Aclaración (Inconformidad SAT)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSMISIONES SCCCyG (LAYOUT XML) */}
      {activeTab === 'LAYOUT_XML' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-white">
                  Bitácora de Transmisiones Electrónicas al SCCCyG
                </h2>
                <p className="text-xs text-slate-500">
                  Historial de layouts XML transmitidos con firmas digitales, acuses y timbrado SAT
                </p>
              </div>

              <button
                onClick={handleGenerarLayoutXml}
                disabled={isTransmitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <FileCode className="w-4 h-4" />
                <span>Generar y Transmitir Nuevo Layout XML</span>
              </button>
            </div>

            <div className="space-y-3">
              {transmisiones.map(tx => (
                <div 
                  key={tx.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">{tx.id}</span>
                      <span>•</span>
                      <span>Período: {tx.periodo}</span>
                      <span>•</span>
                      <span className="text-slate-500">{new Date(tx.fechaTransmision).toLocaleString()}</span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      {tx.estatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <div>Tipo Informe: <strong>{tx.tipoInforme}</strong></div>
                    <div>Descargos Procesados: <strong>{tx.totalDescargos}</strong></div>
                    <div>IVA Amortizado: <strong className="text-emerald-600">${tx.montoIvaAbonadoUSD.toFixed(2)} USD</strong></div>
                    <div>Acuse SAT: <strong className="font-mono text-[10px]">{tx.acuseSATFirma?.slice(0, 20)}...</strong></div>
                  </div>

                  {tx.xmlGenerado && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">XML Layout SAT V1.2</span>
                      <button
                        onClick={() => setSelectedXml(tx.xmlGenerado || null)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver XML Oficial</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CHECKLIST MENSUAL BLINDAJE IMMEX */}
      {activeTab === 'CHECKLIST_MENSUAL' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                REGLA DE ORO IMMEX
              </span>
              <span className="text-xs text-slate-500">Supervisión Periódica Mensual y Trimestral</span>
            </div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              Checklist de Control Mensual de Blindaje Aduanero (Anexo 24 y 30)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Esperar a que venza el plazo de permanencia de 18 meses para conciliar deriva en suspensión inmediata de la Certificación IVA/IEPS y multas del 250% al 300%. Complete estas 7 revisiones clave cada mes:
            </p>
          </div>

          <div className="space-y-3">
            {checklist.map(item => (
              <div 
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                  item.completado
                    ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500'
                    : 'bg-white dark:bg-slate-800/80 border-indigo-200 dark:border-indigo-900/50 shadow-xs'
                }`}
                onClick={() => handleToggleChecklist(item)}
              >
                <div className="mt-0.5 shrink-0">
                  {item.completado ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 hover:text-indigo-600" />
                  )}
                </div>

                <div className="flex-1 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-bold ${item.completado ? 'line-through text-slate-500' : 'text-slate-800 dark:text-white'}`}>
                      {item.titulo}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {item.frecuencia}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.descripcion}
                  </p>

                  {item.observaciones && (
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                      Bitácora: {item.observaciones}
                    </p>
                  )}

                  {item.completado && item.fechaVerificacion && (
                    <p className="text-[10px] text-slate-400">
                      Verificado el {item.fechaVerificacion} por {item.responsable || 'Auditor'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL XML PREVIEW */}
      {selectedXml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  Layout XML Oficial del SAT SCCCyG (Anexo 30)
                </h3>
              </div>
              <button 
                onClick={() => setSelectedXml(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-emerald-400 border border-slate-800 whitespace-pre-wrap">
              {selectedXml}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">Esquema XSD validado conforme a la RGCE Regla 7.2.1</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const blob = new Blob([selectedXml], { type: 'application/xml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `SCCCyG_InformeDescargos_${Date.now()}.xml`;
                    a.click();
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Archivo XML</span>
                </button>
                <button
                  onClick={() => setSelectedXml(null)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INCONFORMIDAD ANTE EL SAT */}
      {isInconformidadModalOpen && selectedDiscrepancia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  Aviso de Aclaración de Saldos (Inconformidad SAT)
                </h3>
              </div>
              <button 
                onClick={() => setIsInconformidadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <p><strong>Pedimento:</strong> <span className="font-mono">{selectedDiscrepancia.pedimentoAfectado}</span></p>
              <p><strong>Artículo:</strong> {selectedDiscrepancia.descripcion} ({selectedDiscrepancia.sku})</p>
              <p><strong>Crédito Fiscal IVA:</strong> ${selectedDiscrepancia.montoIvaDiscrepanciaUSD.toFixed(2)} USD</p>
              <p className="text-[11px] text-slate-500 pt-1">
                Fundamento Legal: Regla 7.2.1 de las RGCE. Este trámite congela el plazo de 18 meses ante la autoridad mientras se resuelve el error técnico en el portal del SAT.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                Motivo Técnico de la Inconformidad:
              </label>
              <textarea
                value={motivoAclaracion}
                onChange={e => setMotivoAclaracion(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsInconformidadModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handlePresentarAclaracionSAT}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
              >
                Presentar Aviso con Folio Digital SAT
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
