/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Plus, 
  Printer, 
  Camera, 
  FileText, 
  Layers, 
  ArrowRight, 
  RotateCcw, 
  QrCode, 
  Barcode, 
  Building2, 
  Download, 
  Eye, 
  X,
  ClipboardCheck,
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { ActivoFijoItem, AuditoriaActivoFijoResult } from '../types';

export default function ActivoFijoAudit() {
  const [activeTab, setActiveTab] = useState<'MATRIZ' | 'AUDITORIA_PASO_PASO' | 'PLACADO_IMPRESION'>('MATRIZ');
  const [activos, setActivos] = useState<ActivoFijoItem[]>([]);
  const [auditorias, setAuditorias] = useState<AuditoriaActivoFijoResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  
  // Modals
  const [selectedActivo, setSelectedActivo] = useState<ActivoFijoItem | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isPlatePrintModalOpen, setIsPlatePrintModalOpen] = useState(false);
  const [isR1RectifyModalOpen, setIsR1RectifyModalOpen] = useState(false);
  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);
  
  // Audit runner state
  const [isExecutingAudit, setIsExecutingAudit] = useState(false);
  const [auditSuccessMsg, setAuditSuccessMsg] = useState<string | null>(null);

  // Rectify R1 form
  const [rectifyJustification, setRectifyJustification] = useState('Subsanación de errata mecanográfica en pedimento AF original bajo Art. 89 de la Ley Aduanera.');
  const [rectifySubmitting, setRectifySubmitting] = useState(false);

  // New asset form
  const [newAsset, setNewAsset] = useState({
    noInventario: `EQ-2026-0${Math.floor(10 + Math.random() * 90)}`,
    descripcion: '',
    marca: '',
    modelo: '',
    numeroSeriePlaca: '',
    pedimentoAF: '26 43 3123 600',
    numeroSeriePedimento: '',
    ubicacionFisica: 'Planta 1 - Nave A',
    estatus: 'ACTIVO' as const,
    submaquiladorNombre: '',
    avisoTrasladoFolio: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resActivos, resAuditorias] = await Promise.all([
        fetch('/api/activos-fijos'),
        fetch('/api/auditorias-activo-fijo')
      ]);
      if (resActivos.ok) setActivos(await resActivos.json());
      if (resAuditorias.ok) setAuditorias(await resAuditorias.json());
    } catch (err) {
      console.error('Error fetching fixed assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExecuteAudit = async () => {
    setIsExecutingAudit(true);
    setAuditSuccessMsg(null);
    try {
      const res = await fetch('/api/auditorias-activo-fijo/ejecutar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditorResponsable: 'Lic. Mariana Valdez (Auditor Interno de Aduanas)' })
      });
      if (res.ok) {
        const data = await res.json();
        setAuditSuccessMsg(data.auditoria.resumenHallazgos);
        await fetchData();
      }
    } catch (err) {
      alert('Error al ejecutar protocolo de auditoría');
    } finally {
      setIsExecutingAudit(false);
    }
  };

  const handleApplyRectificacionR1 = async () => {
    if (!selectedActivo) return;
    setRectifySubmitting(true);
    try {
      const res = await fetch(`/api/activos-fijos/${selectedActivo.id}/rectificar-r1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ justificacion: rectifyJustification })
      });
      if (res.ok) {
        const data = await res.json();
        setIsR1RectifyModalOpen(false);
        await fetchData();
        alert(`¡Rectificación R1 autorizada! Pedimento rectificado: ${data.activo.pedimentoAF}. Blindaje contra embargo SAT restablecido.`);
      }
    } catch (err) {
      alert('Error al rectificar pedimento');
    } finally {
      setRectifySubmitting(false);
    }
  };

  const handleCreateNewAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/activos-fijos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset)
      });
      if (res.ok) {
        setIsNewAssetModalOpen(false);
        await fetchData();
        setNewAsset({
          noInventario: `EQ-2026-0${Math.floor(10 + Math.random() * 90)}`,
          descripcion: '',
          marca: '',
          modelo: '',
          numeroSeriePlaca: '',
          pedimentoAF: '26 43 3123 600',
          numeroSeriePedimento: '',
          ubicacionFisica: 'Planta 1 - Nave A',
          estatus: 'ACTIVO',
          submaquiladorNombre: '',
          avisoTrasladoFolio: ''
        });
      }
    } catch (err) {
      alert('Error al registrar activo fijo');
    }
  };

  const filteredActivos = activos.filter(a => {
    const matchesSearch = 
      a.noInventario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.numeroSeriePlaca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.pedimentoAF.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'TODOS' || a.estatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalActivos = activos.length;
  const discrepanciasSerie = activos.filter(a => !a.coincidenciaExactaSerie).length;
  const enSubmaquila = activos.filter(a => a.estatus === 'SUBMAQUILADOR').length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              PARTE 2 • REQUERIMIENTOS SAT IMMEX
            </span>
            <span className="text-xs text-slate-500">Permanencia por Vigencia del Programa & Art. 151 Ley Aduanera</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">
            Control Obligatorio de Activo Fijo (Maquinaria & Equipo)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Blindaje integral: Placado inalterable, coincidencia 100% de placa vs pedimento, expediente electrónico de 4 documentos y auditoría preventiva.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsNewAssetModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Activo Fijo</span>
          </button>

          <button
            onClick={fetchData}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
            title="Recargar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Parque de Maquinaria</span>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{totalActivos} equipos</p>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">Permanencia: Vigencia Programa IMMEX</p>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs ${
          discrepanciasSerie > 0
            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
            : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Coincidencia Placa vs Pedimento</span>
            {discrepanciasSerie > 0 ? (
              <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <p className={`text-2xl font-black ${discrepanciasSerie > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {discrepanciasSerie > 0 ? `${discrepanciasSerie} en Riesgo Crítico` : '100% Conciliado'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {discrepanciasSerie > 0 ? 'Riesgo de embargo precautorio Art. 151 LA' : 'Cero omisiones de caracteres'}
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Activos con Submaquilador</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{enSubmaquila} moldes/equipos</p>
          <p className="text-[11px] text-blue-600 mt-1 font-medium">Amparados con Aviso de Traslado V1</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Expediente Digital 4 Soporte</span>
            <FileText className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white">
            {activos.filter(a => a.expedienteAF?.completo).length} / {totalActivos}
          </p>
          <p className="text-[11px] text-purple-600 mt-1 font-medium">Pedimento + Invoice + Ficha + V1</p>
        </div>
      </div>

      {/* Critical Alert Banner if Typo Detected */}
      {discrepanciasSerie > 0 && (
        <div className="p-4 bg-rose-500/10 border-2 border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-900 dark:text-rose-200">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-sm text-rose-700 dark:text-rose-300">
              ¡ALERTA ADUANERA: Discrepancia Mecanográfica en Número de Serie de Activo Fijo!
            </p>
            <p>
              El SAT / ANAM sanciona la omisión de un solo dígito o guión en el pedimento AF como causal de embargo precautorio bajo el <strong>Artículo 151 Fracción II de la Ley Aduanera</strong> (mercancía que no acredita su legal estancia).
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => {
                  const errorItem = activos.find(a => !a.coincidenciaExactaSerie);
                  if (errorItem) {
                    setSelectedActivo(errorItem);
                    setIsR1RectifyModalOpen(true);
                  }
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Aplicar Rectificación de Pedimento R1 (Art. 89 LA)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('MATRIZ')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'MATRIZ'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Matriz de Control de Activo Fijo (WMS / ERP)</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDITORIA_PASO_PASO')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'AUDITORIA_PASO_PASO'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Protocolo de Auditoría Preventiva (3 Pasos)</span>
          {discrepanciasSerie > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('PLACADO_IMPRESION')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'PLACADO_IMPRESION'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Placas Metálicas & Marbetes QR</span>
        </button>
      </div>

      {/* TAB 1: MATRIZ DE CONTROL WMS / ERP */}
      {activeTab === 'MATRIZ' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          
          {/* Controls bar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por N° Inventario, Serie, Marca o Pedimento..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Filtrar Estatus:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
              >
                <option value="TODOS">Todos los estatus</option>
                <option value="ACTIVO">Activo</option>
                <option value="EN_USO">En Uso</option>
                <option value="SUBMAQUILADOR">Submaquilador (Aviso V1)</option>
                <option value="MANTENIMIENTO_EXTERNO">Mantenimiento Externo</option>
                <option value="EN_DESUSO">En Desuso</option>
              </select>
            </div>
          </div>

          {/* Table conforming to SAT requirements */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">N° Inventario</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4">Marca</th>
                  <th className="py-3 px-4">Modelo</th>
                  <th className="py-3 px-4">N° de Serie (Placa vs Pedimento)</th>
                  <th className="py-3 px-4">Pedimento AF</th>
                  <th className="py-3 px-4">Ubicación Física (Rack / Área)</th>
                  <th className="py-3 px-4">Estatus</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredActivos.map(item => {
                  const hasDiscrepancy = !item.coincidenciaExactaSerie;
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
                        hasDiscrepancy ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {item.noInventario}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100 max-w-[200px] truncate" title={item.descripcion}>
                        {item.descripcion}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {item.marca}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono">
                        {item.modelo}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200">
                            <span>Placa:</span>
                            <span className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">{item.numeroSeriePlaca}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                            <span>Pedimento:</span>
                            <span className={hasDiscrepancy ? 'text-rose-600 font-bold bg-rose-100 dark:bg-rose-950 px-1 rounded' : 'text-slate-600 dark:text-slate-400'}>
                              {item.numeroSeriePedimento}
                            </span>
                          </div>

                          {hasDiscrepancy ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-600">
                              <AlertTriangle className="w-3 h-3" />
                              Descuadre (Omisión de dígito)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600">
                              <CheckCircle2 className="w-3 h-3" />
                              100% Coincidente
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold text-[11px]">
                          {item.pedimentoAF}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {item.ubicacionFisica}
                        </span>
                        {item.estatus === 'SUBMAQUILADOR' && item.avisoTrasladoFolio && (
                          <p className="text-[10px] text-blue-500 font-mono mt-0.5">
                            Aviso: {item.avisoTrasladoFolio}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.estatus === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                          item.estatus === 'EN_USO' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' :
                          item.estatus === 'SUBMAQUILADOR' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {item.estatus.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasDiscrepancy ? (
                            <button
                              onClick={() => {
                                setSelectedActivo(item);
                                setIsR1RectifyModalOpen(true);
                              }}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="Rectificar con Art. 89 LA"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Rectificar R1</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedActivo(item);
                                setIsPlatePrintModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                              title="Ver Placa Metálica / Imprimir Marbete"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedActivo(item);
                              setIsPhotoModalOpen(true);
                            }}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                            title="Ver las 3 Fotografías de Auditoría"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PROTOCOLO DE AUDITORÍA PREVENTIVA DE ACTIVO FIJO (PASO A PASO) */}
      {activeTab === 'AUDITORIA_PASO_PASO' && (
        <div className="space-y-6">
          
          {/* Visual Step-by-Step Diagram matching User Prompt */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-900/50 shadow-xl">
            <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-4">
              Protocolo de Auditoría Preventiva de Activo Fijo (Simulación SAT / ANAM)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              
              {/* Step 1 */}
              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Muestreo Físico (Barrido en Planta)</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1.5 pl-2 list-disc list-inside">
                  <li>Recorrido con escáner/tablet en 100% de naves y bodegas.</li>
                  <li>Levantamiento de las 3 fotografías obligatorias por activo.</li>
                  <li>Validación de estado (Activo, En Desuso, Submaquila).</li>
                </ul>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Cruce Documental (Pedimento vs Bien)</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1.5 pl-2 list-disc list-inside">
                  <li>Cotejo de número de serie de placa vs pedimento Anexo 24.</li>
                  <li>Detección de erratas mecanográficas u omisiones de dígitos.</li>
                  <li>Verificación de riesgo de embargo Art. 151 Fracc. II LA.</li>
                </ul>
              </div>

              {/* Step 3 */}
              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Plan de Saneamiento & Regularización</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1.5 pl-2 list-disc list-inside">
                  <li><strong>Rectificación R1:</strong> Art. 89 LA para solventar erratas de serie.</li>
                  <li><strong>Regularización:</strong> Reglas 2.5.1 / 2.5.2 RGCE si falta pedimento.</li>
                  <li><strong>Submaquila:</strong> Formalización de avisos de traslado o pedimento V1.</li>
                </ul>
              </div>

            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs text-slate-400">
                Ejecute esta auditoría preventiva de forma mensual para blindar la planta antes de cualquier visita domiciliaria del SAT.
              </p>

              <button
                onClick={handleExecuteAudit}
                disabled={isExecutingAudit}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:bg-slate-700"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>{isExecutingAudit ? 'Ejecutando Barrido en Bodegas...' : 'Ejecutar Auditoría Preventiva de Campo'}</span>
              </button>
            </div>
          </div>

          {/* Execution Result Banner */}
          {auditSuccessMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                  Resultado de la Auditoría Preventiva
                </p>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {auditSuccessMsg}
                </p>
              </div>
            </div>
          )}

          {/* Audit History Log */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Historial de Auditorías Preventivas Realizadas</span>
            </h3>

            <div className="space-y-3">
              {auditorias.map(audit => (
                <div 
                  key={audit.id} 
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">{audit.id}</span>
                      <span>•</span>
                      <span>{new Date(audit.fecha).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="text-slate-500">{audit.auditorResponsable}</span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      audit.estatusPlanSaneamiento === 'CONCILIADO_TOTAL'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                    }`}>
                      {audit.estatusPlanSaneamiento === 'CONCILIADO_TOTAL' ? 'CONCILIADO 100%' : 'REQUIERE RECTIFICACIÓN R1'}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {audit.resumenHallazgos}
                  </p>

                  <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>Equipos inspeccionados: <strong>{audit.totalActivosInspeccionados}</strong></span>
                    <span>Conformes: <strong className="text-emerald-600">{audit.activosConformes}</strong></span>
                    <span>Inconsistencias serie: <strong className="text-rose-600">{audit.inconsistenciasMecanograficas}</strong></span>
                    <span>En submaquila: <strong>{audit.activosConSubmaquilador}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: PLACADO METÁLICO E IMPRESIÓN */}
      {activeTab === 'PLACADO_IMPRESION' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="max-w-2xl">
              <h2 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                Generador de Placas Metálicas e Identificación Inalterable
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                El SAT exige que toda maquinaria importada bajo IMMEX cuente con placa o marbete visible que contenga: <strong>Marca, Modelo, Número de Serie exacto, Pedimento de Importación AF y Código QR / RFID</strong> para lectura inmediata en inspecciones de campo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activos.map(item => (
                <div 
                  key={item.id}
                  className="p-5 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl shadow-md relative overflow-hidden flex flex-col justify-between"
                >
                  {/* Metal Rivet Mockups */}
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600 absolute top-2 left-2 border border-slate-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600 absolute top-2 right-2 border border-slate-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600 absolute bottom-2 left-2 border border-slate-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600 absolute bottom-2 right-2 border border-slate-500"></div>

                  <div>
                    <div className="text-center pb-2 border-b border-slate-300 dark:border-slate-700">
                      <span className="text-[9px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                        ACTIVO FIJO IMMEX • CONTROL ADUANERO
                      </span>
                      <h4 className="font-mono font-black text-sm text-slate-800 dark:text-white mt-0.5">
                        {item.noInventario}
                      </h4>
                    </div>

                    <div className="py-3 space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="text-slate-500 text-[9px] uppercase font-bold block">Descripción:</span>
                        <span className="font-semibold">{item.descripcion}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 text-[9px] uppercase font-bold block">Marca:</span>
                          <span className="font-bold">{item.marca}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[9px] uppercase font-bold block">Modelo:</span>
                          <span className="font-mono">{item.modelo}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[9px] uppercase font-bold block">Número de Serie (Placa):</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 inline-block">
                          {item.numeroSeriePlaca}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 text-[9px] uppercase font-bold block">Pedimento AF Oficial SAT:</span>
                        <span className="font-mono font-black text-indigo-700 dark:text-indigo-400 text-xs">
                          {item.pedimentoAF}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-300 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                      <QrCode className="w-5 h-5 text-slate-800 dark:text-white" />
                      <span>{item.marbeteRFID}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedActivo(item);
                        setIsPlatePrintModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Imprimir Placa</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: LAS 3 FOTOGRAFÍAS OBLIGATORIAS POR ACTIVO (SAT MATERIALIDAD) */}
      {isPhotoModalOpen && selectedActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded">
                  EXPEDIENTE FOTOGRÁFICO DE MATERIALIDAD
                </span>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mt-1">
                  Las 3 Fotografías de Control: {selectedActivo.noInventario} ({selectedActivo.descripcion})
                </h3>
              </div>
              <button 
                onClick={() => setIsPhotoModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              En revisiones de gabinete o visitas domiciliarias de la ANAM/SAT, estas 3 tomas acreditan la existencia física, trazabilidad del serial de fabricante y etiquetado interno.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Photo 1: General view */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Vista General en Ubicación</span>
                </span>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-100 dark:bg-slate-800 relative group">
                  <img 
                    src={selectedActivo.fotos.vistaGeneralUrl} 
                    alt="Vista General" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                    Ubicación: {selectedActivo.ubicacionFisica}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">Perspectiva completa en nave con entorno operativo.</p>
              </div>

              {/* Photo 2: Manufacturer's Plate */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Placa Metálica Fabricante</span>
                </span>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-100 dark:bg-slate-800 relative group">
                  <img 
                    src={selectedActivo.fotos.placaFabricanteUrl} 
                    alt="Placa Fabricante" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                    Serie: {selectedActivo.numeroSeriePlaca}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">Número de serie, modelo y marca grabados por fabricante.</p>
              </div>

              {/* Photo 3: Internal Inventory Tag */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Etiqueta / Marbete Interno</span>
                </span>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-100 dark:bg-slate-800 relative group">
                  <img 
                    src={selectedActivo.fotos.marbeteControlInternoUrl} 
                    alt="Marbete Interno" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                    {selectedActivo.marbeteRFID}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">Marbete inalterable con QR y código de barras interno.</p>
              </div>

            </div>

            {/* Electronic Dossier links */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Documentación Electrónica del Activo Fijo (4 Soportes)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 font-semibold">Pedimento AF:</p>
                  <p className="font-mono font-bold text-indigo-600 truncate">{selectedActivo.expedienteAF.pedimentoAFUrl || 'Amparado'}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 font-semibold">Factura / Invoice:</p>
                  <p className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate">{selectedActivo.expedienteAF.facturaComercialInvoiceUrl || 'Amparado'}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 font-semibold">Ficha Técnica / Manual:</p>
                  <p className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate">{selectedActivo.expedienteAF.fichaTecnicaManualUrl || 'Amparado'}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-500 font-semibold">Aviso Traslado / V1:</p>
                  <p className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate">{selectedActivo.avisoTrasladoFolio || 'No requerido'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: APLICAR RECTIFICACIÓN R1 (ART. 89 LEY ADUANERA) */}
      {isR1RectifyModalOpen && selectedActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600">
                  <RotateCcw className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    Rectificación de Pedimento R1
                  </h3>
                  <p className="text-xs text-slate-500">Fundamento Legal: Artículo 89 de la Ley Aduanera</p>
                </div>
              </div>
              <button 
                onClick={() => setIsR1RectifyModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-bold">Diagnóstico de Inconsistencia:</p>
              <p>
                • Serie en Placa Física del Fabricante: <strong className="font-mono font-black">{selectedActivo.numeroSeriePlaca}</strong>
              </p>
              <p>
                • Serie en Pedimento Actual: <span className="font-mono text-rose-600 line-through font-bold">{selectedActivo.numeroSeriePedimento}</span>
              </p>
              <p className="text-[11px] text-slate-500 pt-1">
                La rectificación R1 actualizará el campo del pedimento ante el SAAI/SAT para que coincida exactamente con la placa física, extinguiendo la causal de embargo precautorio bajo Art. 151 LA.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Justificación Técnica para la Rectificación R1:
                </label>
                <textarea
                  value={rectifyJustification}
                  onChange={e => setRectifyJustification(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Pedimento Rectificado Resultante:
                </label>
                <input
                  type="text"
                  disabled
                  value={`${selectedActivo.pedimentoAF.slice(0, 10)} (R1-RECTIFICADO)`}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-indigo-600 font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsR1RectifyModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyRectificacionR1}
                disabled={rectifySubmitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm disabled:bg-slate-400"
              >
                {rectifySubmitting ? 'Transmitiendo R1 al SAT...' : 'Autorizar y Aplicar Rectificación R1'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: IMPRIMIR PLACA METÁLICA CON CÓDIGO QR Y CÓDIGO DE BARRAS */}
      {isPlatePrintModalOpen && selectedActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Impresión de Marbete de Control de Activo Fijo
              </h3>
              <button 
                onClick={() => setIsPlatePrintModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Plate Mockup */}
            <div id="printable-plate" className="p-6 bg-slate-100 border-4 border-slate-800 rounded-2xl text-slate-900 shadow-lg space-y-3 font-sans">
              <div className="border-b-2 border-slate-800 pb-2 text-center">
                <p className="text-[10px] font-black tracking-widest text-slate-700 uppercase">
                  PROGRAMA IMMEX • ACTIVO FIJO ADUANAS SAT
                </p>
                <h2 className="text-lg font-black font-mono tracking-tight text-slate-950">
                  {selectedActivo.noInventario}
                </h2>
              </div>

              <div className="text-xs space-y-1.5">
                <p><strong>DESCRIPCIÓN:</strong> {selectedActivo.descripcion}</p>
                <p><strong>MARCA / MODELO:</strong> {selectedActivo.marca} / {selectedActivo.modelo}</p>
                <div className="p-1.5 bg-white border border-slate-400 rounded text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">N° DE SERIE DEL FABRICANTE (INALTERABLE):</span>
                  <span className="text-sm font-mono font-black">{selectedActivo.numeroSeriePlaca}</span>
                </div>
                <p className="text-center"><strong>PEDIMENTO AF SAT:</strong> <span className="font-mono font-bold text-indigo-900">{selectedActivo.pedimentoAF}</span></p>
                <p className="text-[10px] text-center text-slate-600">UBICACIÓN: {selectedActivo.ubicacionFisica}</p>
              </div>

              <div className="border-t-2 border-slate-800 pt-3 flex items-center justify-around">
                <div className="text-center font-mono text-[9px]">
                  <QrCode className="w-12 h-12 mx-auto" />
                  <span className="font-bold">{selectedActivo.noInventario}</span>
                </div>
                <div className="text-center font-mono text-[9px]">
                  <Barcode className="w-14 h-8 mx-auto" />
                  <span className="font-bold">{selectedActivo.marbeteRFID}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-slate-500">Formato apto para placa de aluminio anodizado o marbete térmico.</p>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Marbete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: REGISTRAR NUEVO ACTIVO FIJO */}
      {isNewAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Registrar Nuevo Activo Fijo (IMMEX)
              </h3>
              <button 
                onClick={() => setIsNewAssetModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewAsset} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">N° Inventario Interno:</label>
                  <input
                    type="text"
                    required
                    value={newAsset.noInventario}
                    onChange={e => setNewAsset({ ...newAsset, noInventario: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Estatus:</label>
                  <select
                    value={newAsset.estatus}
                    onChange={e => setNewAsset({ ...newAsset, estatus: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="EN_USO">En Uso</option>
                    <option value="SUBMAQUILADOR">Submaquilador (Aviso V1)</option>
                    <option value="MANTENIMIENTO_EXTERNO">Mantenimiento Externo</option>
                    <option value="EN_DESUSO">En Desuso</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Descripción de la Maquinaria/Herramental:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Célula de Ensamble Fanuc / Molde de Inyección"
                  value={newAsset.descripcion}
                  onChange={e => setNewAsset({ ...newAsset, descripcion: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Marca:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Fanuc, Husky, Haas"
                    value={newAsset.marca}
                    onChange={e => setNewAsset({ ...newAsset, marca: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Modelo:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. R-2000iC"
                    value={newAsset.modelo}
                    onChange={e => setNewAsset({ ...newAsset, modelo: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Serie en Placa Física del Fabricante:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Exacto como en la placa"
                    value={newAsset.numeroSeriePlaca}
                    onChange={e => setNewAsset({ ...newAsset, numeroSeriePlaca: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Serie en Pedimento AF:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Tal como viene en pedimento"
                    value={newAsset.numeroSeriePedimento}
                    onChange={e => setNewAsset({ ...newAsset, numeroSeriePedimento: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Pedimento AF (15 Dígitos SAT):</label>
                  <input
                    type="text"
                    required
                    placeholder="26 43 3123 6001234"
                    value={newAsset.pedimentoAF}
                    onChange={e => setNewAsset({ ...newAsset, pedimentoAF: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Ubicación Física (Rack / Nave):</label>
                  <input
                    type="text"
                    required
                    placeholder="Planta 1 - Nave B"
                    value={newAsset.ubicacionFisica}
                    onChange={e => setNewAsset({ ...newAsset, ubicacionFisica: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
              </div>

              {newAsset.estatus === 'SUBMAQUILADOR' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div>
                    <label className="block text-purple-900 dark:text-purple-300 font-semibold mb-1">Nombre del Submaquilador:</label>
                    <input
                      type="text"
                      placeholder="Empresa Maquiladora S.A."
                      value={newAsset.submaquiladorNombre}
                      onChange={e => setNewAsset({ ...newAsset, submaquiladorNombre: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-700 rounded-lg dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-purple-900 dark:text-purple-300 font-semibold mb-1">Folio Aviso Traslado / V1:</label>
                    <input
                      type="text"
                      placeholder="AVISO-TRAS-2026-XX"
                      value={newAsset.avisoTrasladoFolio}
                      onChange={e => setNewAsset({ ...newAsset, avisoTrasladoFolio: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-700 rounded-lg dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewAssetModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                >
                  Guardar Activo Fijo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
