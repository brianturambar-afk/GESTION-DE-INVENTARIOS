/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Layers, 
  Trash2, 
  Plus, 
  FileText, 
  Percent, 
  ShieldCheck, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertTriangle,
  X,
  ExternalLink,
  Flame
} from 'lucide-react';
import { BillOfMaterials, MermaRegistro, Product } from '../types';

interface BomScrapManagementProps {
  boms: BillOfMaterials[];
  mermas: MermaRegistro[];
  products: Product[];
  onAddBOM: (bomData: any) => Promise<void>;
  onAddMerma: (mermaData: any) => Promise<void>;
}

export default function BomScrapManagement({
  boms,
  mermas,
  products,
  onAddBOM,
  onAddMerma
}: BomScrapManagementProps) {
  const [activeTab, setActiveTab] = useState<'BOM' | 'MERMAS'>('BOM');
  const [isBomModalOpen, setIsBomModalOpen] = useState(false);
  const [isMermaModalOpen, setIsMermaModalOpen] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  // BOM Form State
  const [bomForm, setBomForm] = useState({
    skuProductoTerminado: products.find(p => p.bienType === 'PRODUCTO_TERMINADO')?.sku || '',
    version: 'REV-1.0',
    vigencia: '2026-01-01 AL 2028-12-31',
    rendimientoEsperado: 98.0,
    justificacionTecnicaMermas: 'Merma generada por corte y ajuste de calibración térmica en línea SMT.',
    aprobadoPorIngenieria: 'Ing. Fernando Gamboa',
    componentes: [
      {
        skuInsumo: products[0]?.sku || '',
        cantidadRequerida: 1.0,
        porcentajeMerma: 1.5,
        porcentajeDesperdicio: 0.5
      }
    ]
  });

  // Merma Form State
  const [mermaForm, setMermaForm] = useState({
    sku: products[0]?.sku || '',
    cantidad: 10,
    tipoProceso: 'Ensamble SMT & Soldadura',
    porcentajeRealVsBOM: 1.2,
    motivoTecnico: 'Descarte por falla en prueba de rigidez dieléctrica.',
    destino: 'DESTRUCCION_FISCAL' as 'DESTRUCCION_FISCAL' | 'DONACION_AUTORIZADA' | 'RECICLAJE_MRO' | 'RETORNO',
    testigoSAToNotario: 'Lic. Roberto Garza (Notario Público No. 14)',
    evidenciaFotograficaUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
  });

  const handleCreateBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pt = products.find(p => p.sku === bomForm.skuProductoTerminado);
      const payload = {
        ...bomForm,
        nombreProducto: pt?.name || 'Producto Terminado',
        componentes: bomForm.componentes.map(c => {
          const insumo = products.find(p => p.sku === c.skuInsumo);
          return {
            ...c,
            nombreInsumo: insumo?.name || c.skuInsumo,
            unidadMedida: insumo?.unidadMedida || 'PZA'
          };
        })
      };
      await onAddBOM(payload);
      setIsBomModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al guardar BOM');
    }
  };

  const handleCreateMerma = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const item = products.find(p => p.sku === mermaForm.sku);
      const payload = {
        ...mermaForm,
        nombre: item?.name || mermaForm.sku,
        unidadMedida: item?.unidadMedida || 'PZA'
      };
      await onAddMerma(payload);
      setIsMermaModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al registrar merma');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              TRAZABILIDAD Y MERMAS • IMMEX
            </span>
            <span className="text-xs text-slate-500">Listas de Materiales & Manifiestos de Destrucción</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">
            Listas de Materiales (BOM) & Control de Mermas y Desperdicios
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fórmulas de explosión de insumos autorizadas, porcentaje justificado técnicamente y actas de destrucción fiscal o donación ante testigos autorizados del SAT.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'BOM' ? (
            <button
              onClick={() => setIsBomModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Nueva Lista (BOM)</span>
            </button>
          ) : (
            <button
              onClick={() => setIsMermaModalOpen(true)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Flame className="w-4 h-4" />
              <span>Levantar Acta de Destrucción / Merma</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('BOM')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'BOM' 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Listas de Materiales (BOM) ({boms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('MERMAS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'MERMAS' 
              ? 'bg-rose-600 text-white shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Control de Mermas & Destrucciones ({mermas.length})</span>
        </button>
      </div>

      {/* TAB 1: BOM (Listas de Materiales) */}
      {activeTab === 'BOM' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boms.map(bom => (
              <div 
                key={bom.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                      {bom.version} • VIGENCIA {bom.vigencia}
                    </span>
                    <h3 className="font-mono font-bold text-sm text-slate-900 dark:text-white mt-1">
                      {bom.skuProductoTerminado}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">{bom.nombreProducto}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-lg">
                      Rendimiento: {bom.rendimientoEsperado}%
                    </span>
                  </div>
                </div>

                {/* Insumos requeridos por unidad de producto terminado */}
                <div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                    Insumos y Mermas Técnicas por Unidad:
                  </span>
                  
                  <div className="space-y-2">
                    {bom.componentes.map((comp, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                        <div>
                          <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{comp.skuInsumo}</p>
                          <p className="text-[10px] text-slate-500">{comp.nombreInsumo}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-indigo-600">
                            {comp.cantidadRequerida} {comp.unidadMedida}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Merma: {comp.porcentajeMerma}% • Desperdicio: {comp.porcentajeDesperdicio}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Justificación técnica */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    Justificación Técnica Legal:
                  </span>
                  <p className="italic">"{bom.justificacionTecnicaMermas}"</p>
                  <p className="mt-1 text-[10px] text-slate-500 font-medium">
                    Aprobado por: {bom.aprobadoPorIngenieria} ({bom.fechaAprobacion.slice(0, 10)})
                  </p>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Control de Mermas & Destrucciones Fiscales */}
      {activeTab === 'MERMAS' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                  Registro Oficial de Mermas, Destrucciones & Donaciones
                </h2>
                <p className="text-xs text-slate-500">
                  Manifiestos con fe pública y evidencia fotográfica para respaldar saldos ante el SAT
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Fecha & Manifiesto</th>
                    <th className="py-3 px-4">Insumo / Mercancía</th>
                    <th className="py-3 px-4">Cantidad</th>
                    <th className="py-3 px-4">Destino Legal</th>
                    <th className="py-3 px-4">Justificación Técnica</th>
                    <th className="py-3 px-4">Testigo / Notario</th>
                    <th className="py-3 px-4 text-center">Evidencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mermas.map(merma => (
                    <tr key={merma.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{merma.folioManifiesto}</p>
                        <p className="text-[10px] text-slate-500">{merma.fecha.slice(0, 10)}</p>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-slate-800 dark:text-slate-100">{merma.sku}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{merma.nombre}</p>
                      </td>

                      <td className="py-3 px-4 font-bold text-rose-600 font-mono">
                        {merma.cantidad} {merma.unidadMedida}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          {merma.destino.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-[200px]">
                        <p className="text-slate-700 dark:text-slate-300 truncate">{merma.motivoTecnico}</p>
                        <span className="text-[10px] text-slate-500">Proceso: {merma.tipoProceso}</span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{merma.testigoSAToNotario || 'Inspector SAT'}</p>
                        <span className="text-[10px] text-emerald-600 font-semibold">{merma.estatus}</span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {merma.evidenciaFotograficaUrl ? (
                          <button
                            onClick={() => setSelectedPhotoUrl(merma.evidenciaFotograficaUrl || null)}
                            className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 hover:bg-indigo-100 cursor-pointer"
                            title="Ver Evidencia Fotográfica"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Sin Foto</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ver Evidencia Fotográfica de Destrucción */}
      {selectedPhotoUrl && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Evidencia Fotográfica de Destrucción Fiscal SAT
              </h3>
              <button onClick={() => setSelectedPhotoUrl(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <img 
              src={selectedPhotoUrl} 
              alt="Evidencia fotográfica de destrucción" 
              className="w-full h-64 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner"
            />
            <p className="text-[11px] text-slate-500">
              Fotografía requerida por las RGCE para respaldar la materialidad de la destrucción de mermas y descarte de residuos industriales no retornables.
            </p>
          </div>
        </div>
      )}

      {/* Modal: Crear BOM */}
      {isBomModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Nueva Lista de Materiales (BOM)
              </h3>
              <button onClick={() => setIsBomModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBOM} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  SKU Producto Terminado (Salida) *
                </label>
                <select
                  value={bomForm.skuProductoTerminado}
                  onChange={(e) => setBomForm({ ...bomForm, skuProductoTerminado: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs text-slate-800 dark:text-white"
                >
                  {products.map(p => (
                    <option key={p.sku} value={p.sku}>{p.sku} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Versión / Revisión *</label>
                  <input
                    type="text"
                    value={bomForm.version}
                    onChange={(e) => setBomForm({ ...bomForm, version: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Rendimiento Esperado (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bomForm.rendimientoEsperado}
                    onChange={(e) => setBomForm({ ...bomForm, rendimientoEsperado: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Insumo Componente Principal *
                </label>
                <select
                  value={bomForm.componentes[0]?.skuInsumo}
                  onChange={(e) => {
                    const newComp = [...bomForm.componentes];
                    newComp[0].skuInsumo = e.target.value;
                    setBomForm({ ...bomForm, componentes: newComp });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs text-slate-800 dark:text-white"
                >
                  {products.map(p => (
                    <option key={p.sku} value={p.sku}>{p.sku} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">% Merma Técnica Justificada</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bomForm.componentes[0]?.porcentajeMerma}
                    onChange={(e) => {
                      const newComp = [...bomForm.componentes];
                      newComp[0].porcentajeMerma = Number(e.target.value);
                      setBomForm({ ...bomForm, componentes: newComp });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">% Desperdicio</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bomForm.componentes[0]?.porcentajeDesperdicio}
                    onChange={(e) => {
                      const newComp = [...bomForm.componentes];
                      newComp[0].porcentajeDesperdicio = Number(e.target.value);
                      setBomForm({ ...bomForm, componentes: newComp });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Justificación Técnica Legal (Para Auditoría SAT) *
                </label>
                <textarea
                  rows={2}
                  value={bomForm.justificacionTecnicaMermas}
                  onChange={(e) => setBomForm({ ...bomForm, justificacionTecnicaMermas: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsBomModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-semibold"
                >
                  Guardar BOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Merma / Destrucción */}
      {isMermaModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Levantar Acta de Destrucción / Merma
              </h3>
              <button onClick={() => setIsMermaModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMerma} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Insumo a Destruir / Merma *</label>
                <select
                  value={mermaForm.sku}
                  onChange={(e) => setMermaForm({ ...mermaForm, sku: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs text-slate-800 dark:text-white"
                >
                  {products.map(p => (
                    <option key={p.sku} value={p.sku}>{p.sku} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Cantidad a Destruir *</label>
                  <input
                    type="number"
                    min="1"
                    value={mermaForm.cantidad}
                    onChange={(e) => setMermaForm({ ...mermaForm, cantidad: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs dark:text-white font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Destino Legal *</label>
                  <select
                    value={mermaForm.destino}
                    onChange={(e) => setMermaForm({ ...mermaForm, destino: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs text-slate-800 dark:text-white"
                  >
                    <option value="DESTRUCCION_FISCAL">DESTRUCCIÓN FISCAL (Incinera/Tritura)</option>
                    <option value="DONACION_AUTORIZADA">DONACIÓN AUTORIZADA SAT</option>
                    <option value="RECICLAJE_MRO">RECICLAJE / MRO</option>
                    <option value="RETORNO">RETORNO AL EXTRANJERO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Motivo Técnico de Descarte *</label>
                <input
                  type="text"
                  value={mermaForm.motivoTecnico}
                  onChange={(e) => setMermaForm({ ...mermaForm, motivoTecnico: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Testigo Notarial o Funcionario SAT</label>
                <input
                  type="text"
                  value={mermaForm.testigoSAToNotario}
                  onChange={(e) => setMermaForm({ ...mermaForm, testigoSAToNotario: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsMermaModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl font-semibold"
                >
                  Asentar Acta de Destrucción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
