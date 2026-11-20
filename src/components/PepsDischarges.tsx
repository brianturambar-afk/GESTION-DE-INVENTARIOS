/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Play, 
  History, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  FileCheck, 
  Layers, 
  AlertCircle, 
  Download,
  Search,
  Sparkles
} from 'lucide-react';
import { DescargoPEPS, Pedimento, Product } from '../types';

interface PepsDischargesProps {
  descargosPEPS: DescargoPEPS[];
  pedimentos: Pedimento[];
  products: Product[];
  onExecutePeps: (pedimentoSalidaId: string, sku: string, cantidadSalida: number) => Promise<any>;
}

export default function PepsDischarges({
  descargosPEPS,
  pedimentos,
  products,
  onExecutePeps
}: PepsDischargesProps) {
  const [selectedSalidaPedimento, setSelectedSalidaPedimento] = useState<string>('');
  const [selectedSku, setSelectedSku] = useState<string>(products[0]?.sku || '');
  const [cantidadDescargo, setCantidadDescargo] = useState<number>(50);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastExecutionResult, setLastExecutionResult] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Salida pedimentos available
  const pedimentosSalida = pedimentos.filter(p => p.tipo === 'SALIDA');
  // Entrada pedimentos with available balances for preview
  const entradasConSaldo = pedimentos.filter(
    p => p.tipo === 'ENTRADA' && p.partidas.some(pt => pt.saldoDisponible > 0)
  ).sort((a, b) => new Date(a.fechaPago).getTime() - new Date(b.fechaPago).getTime());

  const handleRunPeps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSalidaPedimento) {
      alert('Por favor seleccione un Pedimento de Salida (RT/V1/V5) para asociar el descargo.');
      return;
    }
    if (cantidadDescargo <= 0) {
      alert('La cantidad a descargar debe ser mayor a cero.');
      return;
    }

    setIsExecuting(true);
    setLastExecutionResult(null);
    try {
      const result = await onExecutePeps(selectedSalidaPedimento, selectedSku, cantidadDescargo);
      setLastExecutionResult(result);
    } catch (err: any) {
      alert(err.message || 'Error al ejecutar el descargo PEPS.');
    } finally {
      setIsExecuting(false);
    }
  };

  const filteredDescargos = descargosPEPS.filter(d => 
    d.numeroPedimentoSalida.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.numeroPedimentoEntrada.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              REGLA OBLIGATORIA SAT • ANEXO 24
            </span>
            <span className="text-xs text-slate-500">Método de Primeras Entradas, Primeras Salidas</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">
            Motor de Descargos PEPS Automatizado
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Asocia de forma automatizada las salidas (exportaciones/retornos RT) a las importaciones temporales (IN) más antiguas, amortizando saldos y actualizando créditos fiscales IVA/IEPS.
          </p>
        </div>

        <button
          onClick={() => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(descargosPEPS, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `Reporte_Descargos_PEPS_Anexo24_${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
          }}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Reporte de Descargos</span>
        </button>
      </div>

      {/* Main Execution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form: Run PEPS Engine */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">
              Ejecutar Descargo PEPS
            </h2>
          </div>

          <form onSubmit={handleRunPeps} className="space-y-4 text-xs">
            
            {/* Pedimento de Salida */}
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Pedimento de Salida / Retorno (RT / V1) *
              </label>
              {pedimentosSalida.length === 0 ? (
                <p className="text-rose-500 text-[11px] p-2 bg-rose-50 rounded-lg">
                  No hay pedimentos de salida registrados. Por favor registre uno en el módulo de Aduanas.
                </p>
              ) : (
                <select
                  value={selectedSalidaPedimento}
                  onChange={(e) => setSelectedSalidaPedimento(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white"
                  required
                >
                  <option value="">-- Seleccione Pedimento de Retorno --</option>
                  {pedimentosSalida.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.numeroPedimento} ({p.clave} - {p.proveedorCliente})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* SKU a Descargar */}
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Insumo / Mercancía a Descargar *
              </label>
              <select
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white"
              >
                {products.map(p => (
                  <option key={p.sku} value={p.sku}>
                    {p.sku} - {p.name} (Saldo: {p.anexo24Stock})
                  </option>
                ))}
              </select>
            </div>

            {/* Cantidad a Descargar */}
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Cantidad a Descargar (Unidades) *
              </label>
              <input
                type="number"
                min="1"
                value={cantidadDescargo}
                onChange={(e) => setCantidadDescargo(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white"
                required
              />
            </div>

            {/* Botón de Ejecución */}
            <button
              type="submit"
              disabled={isExecuting || pedimentosSalida.length === 0}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:bg-slate-400"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isExecuting ? 'Procesando FIFO...' : 'Ejecutar Descargo PEPS'}</span>
            </button>

            <p className="text-[10px] text-slate-500 leading-relaxed text-center">
              El motor buscará automáticamente las importaciones temporales (IN) con fecha de pago más antigua que tengan saldo disponible para este SKU.
            </p>

          </form>

          {/* Feedback de la última ejecución */}
          {lastExecutionResult && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{lastExecutionResult.mensaje}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Se generaron {lastExecutionResult.descargosGenerados?.length} folios de descargo PEPS sincronizados con Anexo 30.
              </p>
            </div>
          )}

        </div>

        {/* Right 2 Cols: Entradas Temporales Antiguas Pendientes de Descargar */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                Fila de Espera FIFO: Importaciones Temporales Más Antiguas
              </h2>
              <p className="text-[11px] text-slate-500">
                Orden cronológico ascendente (Primeras en entrar serán las primeras en descargarse)
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              FIFO Queue
            </span>
          </div>

          <div className="space-y-3">
            {entradasConSaldo.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No hay importaciones temporales con saldo disponible en este momento.
              </p>
            ) : (
              entradasConSaldo.map((ped, index) => {
                const totalSaldoDisponible = ped.partidas.reduce((acc, p) => acc + p.saldoDisponible, 0);
                const totalOriginal = ped.partidas.reduce((acc, p) => acc + p.cantidadOriginal, 0);
                const porcentajeConsumido = Math.round(((totalOriginal - totalSaldoDisponible) / totalOriginal) * 100);

                return (
                  <div 
                    key={ped.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-all bg-slate-50/50 dark:bg-slate-800/40"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100">
                            {ped.numeroPedimento} ({ped.clave})
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Fecha de Cruce: {ped.fechaPago.slice(0, 10)} • {ped.proveedorCliente}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {totalSaldoDisponible} pzas disponibles
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {porcentajeConsumido}% descargado
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${porcentajeConsumido}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Historial de Descargos PEPS Registrados */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4 p-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">
              Historial de Descargos PEPS Registrados
            </h2>
            <p className="text-xs text-slate-500">
              Trazabilidad legal de asociación entre Pedimento de Entrada ➔ Retorno
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por pedimento o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3">Fecha & Folio</th>
                <th className="py-3 px-3">Pedimento Salida (Retorno)</th>
                <th className="py-3 px-3">Pedimento Entrada (Origen PEPS)</th>
                <th className="py-3 px-3">SKU & Cantidad</th>
                <th className="py-3 px-3">Crédito IVA Amortizado</th>
                <th className="py-3 px-3">Saldo Restante</th>
                <th className="py-3 px-3 text-right">Estatus Anexo 30</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDescargos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No hay descargos PEPS registrados con el término de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredDescargos.map(descargo => (
                  <tr key={descargo.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3">
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{descargo.id}</p>
                      <p className="text-[10px] text-slate-500">{descargo.fechaDescargo.slice(0, 10)}</p>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                        {descargo.numeroPedimentoSalida}
                      </span>
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                        {descargo.claveSalida}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                        {descargo.numeroPedimentoEntrada}
                      </span>
                      <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                        {descargo.claveEntrada}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{descargo.sku}</p>
                      <p className="text-[11px] text-indigo-600 font-bold">
                        {descargo.cantidadDescargada} {descargo.unidadMedida}
                      </p>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-emerald-600">
                        +${descargo.creditoIvaAmortizado.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-slate-600 dark:text-slate-400 font-mono">
                        {descargo.saldoRestanteEntrada} pzas
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                        {descargo.estatusAnexo30}
                      </span>
                      {descargo.acuseSAT && (
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate max-w-[140px] ml-auto">
                          {descargo.acuseSAT}
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
