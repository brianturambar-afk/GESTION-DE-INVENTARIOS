/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  FileText, 
  Boxes, 
  RefreshCw, 
  ExternalLink, 
  DollarSign,
  AlertOctagon,
  ArrowRight,
  Database,
  Layers,
  Calendar,
  Building2,
  Lock,
  FileDown,
  Loader2,
  FileCode2
} from 'lucide-react';
import { Product, Pedimento, DescargoPEPS } from '../types';
import { exportExecutiveAuditPDF, AuditCompanyInfo } from '../utils/exportAuditPdf';

interface ComplianceSummary {
  porcentajeCumplimiento48h: number;
  pedimentosPendientes48hCount: number;
  pedimentosVencidosCount: number;
  pedimentosProximosVencerCount: number;
  creditoIvaTotal: number;
  creditoIvaAmortizado: number;
  creditoIvaSaldoPendiente: number;
  multaEstimadaMinUSD: number;
  multaEstimadaMaxUSD: number;
  valorFaltantesMXN: number;
  discrepanciasAnexo30Count: number;
  certificacionIvaIeps: string;
  totalPedimentos: number;
  totalDescargosPEPS: number;
  totalBOMs: number;
  totalExpedientes: number;
}

interface DashboardProps {
  products: Product[];
  pedimentos: Pedimento[];
  descargosPEPS: DescargoPEPS[];
  onNavigateToTab: (tabId: string) => void;
  onDownloadHtml?: () => void;
}

export default function Dashboard({
  products,
  pedimentos,
  descargosPEPS,
  onNavigateToTab,
  onDownloadHtml
}: DashboardProps) {
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfExportNotice, setPdfExportNotice] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/compliance/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Error fetching compliance summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [pedimentos, products, descargosPEPS]);

  const handleExportAuditPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    setPdfExportNotice(null);

    try {
      let companyInfo: AuditCompanyInfo | null = null;
      try {
        const accessRes = await fetch('/api/sat-audit/access');
        if (accessRes.ok) {
          companyInfo = await accessRes.json();
        }
      } catch {
        // Fallback to institutional defaults inside exportExecutiveAuditPDF
      }

      const filename = exportExecutiveAuditPDF({
        summary,
        products,
        pedimentos,
        descargosPEPS,
        companyInfo,
      });

      setPdfExportNotice(`Reporte de auditoría generado: ${filename}`);
      setTimeout(() => {
        setPdfExportNotice(null);
      }, 6000);
    } catch (err) {
      console.error('Error al exportar reporte PDF:', err);
      setPdfExportNotice('Error al generar el PDF de auditoría. Intenta nuevamente.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Insumos críticos o próximos a vencer (>14 meses de permanencia)
  const insumosEnRiesgo18M = pedimentos.filter(
    p => p.tipo === 'ENTRADA' && p.clave === 'IN' && (p.estadoPermanencia === 'PROXIMO_A_VENCER' || p.estadoPermanencia === 'VENCIDO')
  );

  // Pedimentos en riesgo de regla 48 horas
  const pedimentos48hCriticos = pedimentos.filter(p => !p.cumplePlazo48h);

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Status IMMEX & Certificación SAT */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 border border-slate-700/60 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                EMPRESA IMMEX AUTORIZADA
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                CERTIFICACIÓN IVA/IEPS: {summary?.certificacionIvaIeps || 'AAA'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                SAT ANEXO 24 & 30
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Centro de Mando & Control Fiscal de Inventarios IMMEX
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Sistema automatizado de control de almacenes conforme a las Reglas Generales de Comercio Exterior (RGCE). Cumplimiento en tiempo real de método de descargo PEPS, regla de 48 horas, plazos de 18 meses y conciliación tripartita de Anexo 30.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportAuditPdf}
              disabled={isExportingPdf || loading}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>{isExportingPdf ? 'Generando PDF...' : 'Exportar PDF Auditoría'}</span>
            </button>
            {onDownloadHtml && (
              <button
                onClick={onDownloadHtml}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-600/80 shadow-lg transition-all cursor-pointer"
              >
                <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Descargar HTML</span>
              </button>
            )}
            <button
              onClick={() => onNavigateToTab('sat-audit')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Portal SAT Apartado C</span>
            </button>
            <button
              onClick={fetchSummary}
              title="Actualizar Indicadores"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {pdfExportNotice && (
          <div className="mt-4 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs flex items-center gap-2 relative z-10">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{pdfExportNotice}</span>
          </div>
        )}

        {/* 3 Pilares Normativos Semáforo Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-700/60 text-xs">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${summary?.pedimentosPendientes48hCount === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Regla 48 Horas (Despacho SAT)</p>
              <p className="font-bold text-white">
                {summary?.porcentajeCumplimiento48h || 100}% en cumplimiento 
                {summary?.pedimentosPendientes48hCount ? ` (${summary.pedimentosPendientes48hCount} atrasados)` : ' (Óptimo)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${summary?.pedimentosVencidosCount === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Permanencia Máx. 18 Meses (Insumos)</p>
              <p className="font-bold text-white">
                {summary?.pedimentosVencidosCount || 0} vencidos • {summary?.pedimentosProximosVencerCount || 0} próximos a vencer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${summary?.discrepanciasAnexo30Count === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Conciliación Anexo 30</p>
              <p className="font-bold text-white">
                {summary?.discrepanciasAnexo30Count === 0 ? '100% Cuadrado con SAT' : `${summary?.discrepanciasAnexo30Count} partidas en desfase`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards: Fiscal & Operativo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Crédito Fiscal IVA/IEPS Otorgado */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Crédito Fiscal IVA/IEPS
            </span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            ${(summary?.creditoIvaSaldoPendiente || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">USD</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Garantizado bajo Certificación <strong className="text-blue-500">{summary?.certificacionIvaIeps || 'AAA'}</strong> ante el SAT.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Amortizado vía PEPS:</span>
            <span className="font-semibold text-emerald-600">${(summary?.creditoIvaAmortizado || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Card 2: Calculadora de Riesgo de Sanciones (250% - 300%) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Riesgo de Sanciones SAT
            </span>
            <div className={`p-2 rounded-xl ${summary?.multaEstimadaMaxUSD && summary.multaEstimadaMaxUSD > 0 ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            ${(summary?.multaEstimadaMinUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })} - ${(summary?.multaEstimadaMaxUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })} <span className="text-xs font-normal text-slate-400">USD</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Multa legal del <strong>250% al 300%</strong> sobre mercancía no localizada o vencida.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Estatus de Contingencia:</span>
            <span className={`font-semibold ${summary?.multaEstimadaMaxUSD && summary.multaEstimadaMaxUSD > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {summary?.multaEstimadaMaxUSD && summary.multaEstimadaMaxUSD > 0 ? 'ALERTA REQUERIDA' : 'RIESGO CERO (0)'}
            </span>
          </div>
        </div>

        {/* Card 3: Descargos PEPS Automatizados */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Descargos PEPS Activos
            </span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {summary?.totalDescargosPEPS || 0} <span className="text-xs font-normal text-slate-400">Operaciones</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Asociación de salidas (retornos RT) a entradas temporales más antiguas.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Pedimentos Totales:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{summary?.totalPedimentos || 0}</span>
          </div>
        </div>

        {/* Card 4: Expediente Electrónico 5 Años */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Expedientes de Materialidad
            </span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {summary?.totalExpedientes || 0} <span className="text-xs font-normal text-slate-400">Expedientes</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Resguardo mínimo de 5 años con los 6 documentos de materialidad aduanera.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Estatus de Bóveda:</span>
            <span className="font-semibold text-purple-600">Conforme SAT Art. 28 CFF</span>
          </div>
        </div>

      </div>

      {/* Middle Section: Alertas Normativas Inmediatas & Acciones Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Alertas Críticas (18 Meses & 48 Horas) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Card: Monitor de Plazos de Permanencia (18 Meses) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                  Semáforo de Plazos de Permanencia (Máximo 18 Meses)
                </h2>
              </div>
              <button 
                onClick={() => onNavigateToTab('pedimentos')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>Ver Pedimentos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {insumosEnRiesgo18M.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                      Todos los insumos y materias primas se encuentran dentro del plazo de 18 meses.
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                      No hay riesgo de multas del 250% por mercancía vencida en almacén.
                    </p>
                  </div>
                </div>
              ) : (
                insumosEnRiesgo18M.map(ped => {
                  const diasRestantes = ped.diasRestantes || 0;
                  const isVencido = diasRestantes <= 0;
                  return (
                    <div 
                      key={ped.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isVencido 
                          ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50' 
                          : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isVencido ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {isVencido ? 'VENCIDO (>18 MESES)' : 'PRÓXIMO A VENCER'}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                            Pedimento: {ped.numeroPedimento}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">Clave {ped.clave}</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          Insumo: <span className="font-semibold">{ped.partidas?.[0]?.descripcion || 'Partida de Insumo'}</span> ({ped.partidas?.[0]?.saldoDisponible || 0} pzas con saldo)
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Fecha de Despacho: {ped.fechaPago.slice(0, 10)} • Días en permanencia: <strong>{ped.diasPermanencia || 0} días</strong>
                        </p>
                      </div>

                      <div className="text-right sm:shrink-0">
                        <p className={`text-sm font-bold ${isVencido ? 'text-rose-600' : 'text-amber-600'}`}>
                          {isVencido ? '0 Días Restantes' : `${diasRestantes} Días Restantes`}
                        </p>
                        <button
                          onClick={() => onNavigateToTab('peps')}
                          className="mt-1 text-[11px] px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-all cursor-pointer"
                        >
                          Descargar vía PEPS
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Card: Regla de 48 Horas para Registro Aduanero */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                  Control del Plazo de 48 Horas para Registro Aduanero
                </h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                Anexo 24 RGCE
              </span>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                Toda operación aduanera debe registrarse en el sistema dentro de un plazo perentorio máximo de <strong>48 horas</strong> a partir del despacho o cruce aduanero.
              </p>

              <div className="space-y-2">
                {pedimentos.slice(0, 3).map(ped => (
                  <div key={ped.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${ped.cumplePlazo48h ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-rose-100 text-rose-700'}`}>
                        {ped.cumplePlazo48h ? <CheckCircle2 className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {ped.numeroPedimento} ({ped.clave} - {ped.tipo})
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Registrado a las <strong>{ped.horasTranscurridasRegistro} horas</strong> del cruce aduanal
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      ped.cumplePlazo48h 
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' 
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                    }`}>
                      {ped.cumplePlazo48h ? 'EN TIEMPO (<48H)' : 'INFRACCIÓN (>48H)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right 1 Col: Consecuencias por Incumplimiento & Quick Actions */}
        <div className="space-y-4">
          
          {/* Card: Matriz de Consecuencias por Incumplimiento SAT */}
          <div className="bg-gradient-to-br from-slate-900 to-rose-950 text-white rounded-2xl p-5 border border-rose-900/50 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                Consecuencias por Incumplimiento
              </h3>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <p className="font-bold text-rose-300">1. Multas del 250% al 300%</p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Sobre el valor comercial de mercancías no localizadas en tomas físicas de inventario.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <p className="font-bold text-rose-300">2. Suspensión / Cancelación IMMEX</p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Imposibilidad inmediata de continuar importando temporalmente insumos sin aranceles.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <p className="font-bold text-rose-300">3. Pérdida de Certificación IVA/IEPS</p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Exigencia del pago inmediato del 16% de IVA en todas las operaciones aduaneras futuras.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <p className="font-bold text-rose-300">4. Suspensión de Padrón ANAM/SAT</p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Bloqueo en ventanilla aduanera por falta de materialidad o inconsistencias en Anexo 24.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3">
              Módulos del Sistema
            </h3>

            <button
              onClick={() => onNavigateToTab('peps')}
              className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
                  Motor de Descargos PEPS
                </p>
                <p className="text-[10px] text-slate-500">Asociación FIFO de retornos y amortización</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => onNavigateToTab('anexo30')}
              className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
                  Conciliación Anexo 30 & SCCCyG (Parte 1)
                </p>
                <p className="text-[10px] text-slate-500">Mapeo de las 4 discrepancias y Layout XML</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => onNavigateToTab('activo-fijo')}
              className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
                  Control de Activo Fijo (Parte 2)
                </p>
                <p className="text-[10px] text-slate-500">Auditoría preventiva 3 pasos, 3 fotos y Rectificación R1</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => onNavigateToTab('placado')}
              className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
                  Placado de Activo Fijo & Racks
                </p>
                <p className="text-[10px] text-slate-500">Generación de marbetes y RFID de maquinaria</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => onNavigateToTab('expedientes')}
              className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
                  Expediente Digital 5 Años
                </p>
                <p className="text-[10px] text-slate-500">Bóveda de materialidad y trazabilidad</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
