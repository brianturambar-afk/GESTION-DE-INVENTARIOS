/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Plus, 
  AlertOctagon, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  FileText, 
  ShieldAlert, 
  Building,
  UserCheck,
  Search,
  X,
  Scale
} from 'lucide-react';
import { TomaFisicaInventario, Product } from '../types';

interface CyclicInventoryAuditProps {
  inventariosCiclicos: TomaFisicaInventario[];
  products: Product[];
  onAddTomaFisica: (tomaData: any) => Promise<void>;
}

export default function CyclicInventoryAudit({
  inventariosCiclicos,
  products,
  onAddTomaFisica
}: CyclicInventoryAuditProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    sku: products[0]?.sku || '',
    auditorResponsable: 'Ing. Carlos Mendoza (Auditor Aduanero)',
    zonaAlmacen: 'Pasillo P-01 / Rack R-04',
    conteoFisicoReal: 100,
    justificacionInvestigacion: ''
  });

  const selectedProduct = products.find(p => p.sku === formData.sku);
  const saldoTeorico = selectedProduct?.anexo24Stock || 0;
  const diferenciaPreview = formData.conteoFisicoReal - saldoTeorico;

  // Calculadora preview de multa del 250% al 300%
  const faltantePreview = diferenciaPreview < 0 ? Math.abs(diferenciaPreview) : 0;
  const valorUnitarioUSD = selectedProduct?.costPrice || 10;
  const valorTotalUSD = faltantePreview * valorUnitarioUSD;
  const multaMinUSD = valorTotalUSD * 2.5; // 250%
  const multaMaxUSD = valorTotalUSD * 3.0; // 300%

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAddTomaFisica(formData);
      setIsModalOpen(false);
      setFormData({
        sku: products[0]?.sku || '',
        auditorResponsable: 'Ing. Carlos Mendoza (Auditor Aduanero)',
        zonaAlmacen: 'Pasillo P-01 / Rack R-04',
        conteoFisicoReal: 100,
        justificacionInvestigacion: ''
      });
    } catch (err: any) {
      alert(err.message || 'Error al registrar toma física');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalMultasRiesgoMXN = inventariosCiclicos.reduce((acc, i) => acc + (i.montoRiesgoMultaMXN || 0), 0);
  const faltantesCount = inventariosCiclicos.filter(i => i.tipoDiscrepancia === 'FALTANTE_RIESGO_CONTRABANDO').length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
              AUDITORÍA PREVENTIVA • RGCE
            </span>
            <span className="text-xs text-slate-500">Tomas Físicas de Inventario Cíclico</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">
            Inventarios Cíclicos & Calculadora de Sanciones Fiscales
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Detección oportuna de faltantes antes de visitas del SAT. Un faltante no justificado se sanciona como <strong>contrabando o importación definitiva omitida</strong> (Multa del 250% al 300%).
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Toma Física Cíclica</span>
        </button>
      </div>

      {/* Sanciones & Contingencia Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tomas Cíclicas Realizadas
            </span>
            <ClipboardCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {inventariosCiclicos.length} <span className="text-xs font-normal text-slate-400">Auditorías</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Conteo físico directo en racks y tarimas</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Faltantes Críticos Detectados
            </span>
            <div className={`p-1.5 rounded-lg ${faltantesCount === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold mt-2 ${faltantesCount === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {faltantesCount} <span className="text-xs font-normal text-slate-400">Discrepancias</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {faltantesCount === 0 ? 'Sin riesgo de contrabando' : 'Requiere regularización inmediata vía A1'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Multa Estimada 250% - 300%
            </span>
            <DollarSign className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 mt-2">
            ${totalMultasRiesgoMXN.toLocaleString('es-MX')} <span className="text-xs font-normal text-slate-400">MXN</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Sanción legal potencial si el SAT audita hoy</p>
        </div>

      </div>

      {/* Tabla de Tomas Físicas */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">
              Libro de Actas de Tomas Físicas de Inventario
            </h2>
            <p className="text-xs text-slate-500">
              Historial de conteos de auditoría de control interno aduanero
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Fecha & Folio Acta</th>
                <th className="py-3 px-4">Auditor & Zona</th>
                <th className="py-3 px-4">SKU & Nombre</th>
                <th className="py-3 px-4 text-center">Teórico Anexo 24</th>
                <th className="py-3 px-4 text-center">Conteo Físico</th>
                <th className="py-3 px-4 text-center">Discrepancia</th>
                <th className="py-3 px-4 text-right">Riesgo Multa MXN</th>
                <th className="py-3 px-4 text-right">Estatus Ajuste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {inventariosCiclicos.map(toma => {
                const isCuadrado = toma.tipoDiscrepancia === 'CUADRADO';
                const isFaltante = toma.tipoDiscrepancia === 'FALTANTE_RIESGO_CONTRABANDO';
                return (
                  <tr key={toma.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{toma.actaFolio || toma.id}</p>
                      <p className="text-[10px] text-slate-500">{toma.fechaToma.slice(0, 10)}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{toma.auditorResponsable}</p>
                      <p className="text-[10px] text-slate-500">{toma.zonaAlmacen}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-100">{toma.sku}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{toma.nombre}</p>
                    </td>

                    <td className="py-3 px-4 text-center font-mono">
                      {toma.saldoTeoricoAnexo24} pzas
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white font-mono">
                      {toma.conteoFisicoReal} pzas
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCuadrado ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                        isFaltante ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                      }`}>
                        {toma.diferencia === 0 ? 'EXACTO (0)' : `${toma.diferencia > 0 ? `+${toma.diferencia}` : toma.diferencia} pzas`}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {toma.montoRiesgoMultaMXN > 0 ? (
                        <span className="font-bold text-rose-600 font-mono">
                          ${toma.montoRiesgoMultaMXN.toLocaleString('es-MX')} MXN
                        </span>
                      ) : (
                        <span className="text-slate-400">$0.00</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {toma.estatusAjuste}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Registrar Toma Física */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  Registrar Toma Física de Inventario
                </h3>
                <p className="text-xs text-slate-500">
                  Conteo cíclico para regularización previa al SAT
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  SKU a Auditar *
                </label>
                <select
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white"
                >
                  {products.map(p => (
                    <option key={p.sku} value={p.sku}>
                      {p.sku} - {p.name} (Saldo Sistema: {p.anexo24Stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Auditor Responsable *
                  </label>
                  <input
                    type="text"
                    value={formData.auditorResponsable}
                    onChange={(e) => setFormData({ ...formData, auditorResponsable: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Zona / Pasillo / Rack *
                  </label>
                  <input
                    type="text"
                    value={formData.zonaAlmacen}
                    onChange={(e) => setFormData({ ...formData, zonaAlmacen: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Conteo Físico Real Encontrado en Almacén *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.conteoFisicoReal}
                  onChange={(e) => setFormData({ ...formData, conteoFisicoReal: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs dark:text-white font-bold"
                  required
                />
              </div>

              {/* Calculadora en tiempo real del impacto */}
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                diferenciaPreview < 0 ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50' :
                diferenciaPreview > 0 ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50' :
                'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span>Diferencia vs Saldo Teórico ({saldoTeorico} pzas):</span>
                  <span className={diferenciaPreview < 0 ? 'text-rose-600' : diferenciaPreview > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                    {diferenciaPreview === 0 ? '100% Cuadrado' : `${diferenciaPreview} pzas`}
                  </span>
                </div>

                {diferenciaPreview < 0 && (
                  <div className="pt-2 border-t border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-800 dark:text-rose-300 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                      <span>¡ALERTA FISCAL: FALTANTE DE MERCANCÍA TEMPORAL!</span>
                    </p>
                    <p>
                      El SAT presume que las {faltantePreview} piezas se comercializaron ilegalmente en México sin pagar impuestos.
                    </p>
                    <p className="font-bold">
                      Multa Estimada del 250% al 300%: ${multaMinUSD.toLocaleString()} - ${multaMaxUSD.toLocaleString()} USD
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Justificación de Auditoría / Causa de Desviación
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Conteo físico validado. Diferencia investigada por descarte en pruebas de calibración SMT."
                  value={formData.justificacionInvestigacion}
                  onChange={(e) => setFormData({ ...formData, justificacionInvestigacion: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700"
                >
                  {isSubmitting ? 'Guardando...' : 'Asentar Acta de Toma Física'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
