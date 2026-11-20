/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Building, 
  DollarSign, 
  Hash, 
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  FileCheck,
  X
} from 'lucide-react';
import { Pedimento, ClavePedimento, Product } from '../types';

interface CustomsPedimentosProps {
  pedimentos: Pedimento[];
  products: Product[];
  onAddPedimento: (pedimentoData: any) => Promise<void>;
  onNavigateToTab?: (tabId: string) => void;
}

export default function CustomsPedimentos({
  pedimentos,
  products,
  onAddPedimento,
  onNavigateToTab
}: CustomsPedimentosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClave, setSelectedClave] = useState<string>('ALL');
  const [selectedTipo, setSelectedTipo] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Pedimento Form State
  const [formData, setFormData] = useState({
    numeroPedimento: '',
    tipo: 'ENTRADA' as 'ENTRADA' | 'SALIDA',
    clave: 'IN' as ClavePedimento,
    aduana: '470 - Ciudad Juárez, Chih.',
    patente: '3190',
    fechaPago: new Date().toISOString().slice(0, 16),
    proveedorCliente: '',
    paisOrigenDestino: 'ESTADOS UNIDOS (USA)',
    tipoCambio: 20.00,
    sku: products[0]?.sku || '',
    cantidad: 100,
    valorUnitarioUSD: 5.00
  });

  // Calculate 15 digits validity
  const cleanDigits = formData.numeroPedimento.replace(/\s+/g, '');
  const is15Digits = cleanDigits.length === 15 && /^\d+$/.test(cleanDigits);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!is15Digits) {
      alert('El número de pedimento debe tener exactamente 15 dígitos numéricos.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedProd = products.find(p => p.sku === formData.sku);
      const valorTotalUSD = Number(formData.cantidad) * Number(formData.valorUnitarioUSD);
      const creditoIvaIepsTotal = formData.tipo === 'ENTRADA' ? Math.round(valorTotalUSD * 0.16 * 100) / 100 : 0;

      const newPedimentoPayload = {
        numeroPedimento: formData.numeroPedimento,
        tipo: formData.tipo,
        clave: formData.clave,
        aduana: formData.aduana,
        patente: formData.patente,
        fechaPago: new Date(formData.fechaPago).toISOString(),
        proveedorCliente: formData.proveedorCliente || (formData.tipo === 'ENTRADA' ? 'Proveedor Extranjero' : 'Cliente Destinatario'),
        paisOrigenDestino: formData.paisOrigenDestino,
        tipoCambio: Number(formData.tipoCambio),
        valorTotalUSD,
        creditoIvaIepsTotal,
        partidas: [
          {
            id: `PART-${Date.now()}`,
            sku: formData.sku,
            descripcion: selectedProd?.name || 'Insumo de Importación',
            fraccion: selectedProd?.fraccionArancelaria || '8542.31.01',
            cantidadOriginal: Number(formData.cantidad),
            cantidadDescargada: 0,
            saldoDisponible: Number(formData.cantidad),
            unidadMedida: selectedProd?.unidadMedida || 'PZA',
            valorUnitarioUSD: Number(formData.valorUnitarioUSD),
            valorTotalUSD,
            ivaIepsCredito: creditoIvaIepsTotal
          }
        ]
      };

      await onAddPedimento(newPedimentoPayload);
      setIsModalOpen(false);
      // Reset
      setFormData({
        numeroPedimento: '',
        tipo: 'ENTRADA',
        clave: 'IN',
        aduana: '470 - Ciudad Juárez, Chih.',
        patente: '3190',
        fechaPago: new Date().toISOString().slice(0, 16),
        proveedorCliente: '',
        paisOrigenDestino: 'ESTADOS UNIDOS (USA)',
        tipoCambio: 20.00,
        sku: products[0]?.sku || '',
        cantidad: 100,
        valorUnitarioUSD: 5.00
      });
    } catch (err: any) {
      alert(err.message || 'Error al registrar pedimento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPedimentos = pedimentos.filter(p => {
    const matchesSearch = 
      p.numeroPedimento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.aduana.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.proveedorCliente.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClave = selectedClave === 'ALL' || p.clave === selectedClave;
    const matchesTipo = selectedTipo === 'ALL' || p.tipo === selectedTipo;
    return matchesSearch && matchesClave && matchesTipo;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              APARTADO A • ANEXO 24
            </span>
            <span className="text-xs text-slate-500">Módulo de Aduanas & Despacho</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">
            Pedimentos Aduaneros de Entrada y Salida
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control de 15 dígitos oficiales SAT, plazo perentorio de 48 horas para captura y plazos de permanencia de 18 meses.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Pedimento Oficial</span>
        </button>
      </div>

      {/* Normative Compliance Infobox */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estructura SAT 15 Dígitos</p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              AA (Año) + AA (Aduana) + PPPP (Patente) + SSSSSSS (Folio)
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Regla 48 Horas</p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              Captura obligatoria antes de 48h desde el despacho aduanero
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Plazo 18 Meses (Insumos)</p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              Permanencia máx. Art. 108 Ley Aduanera (Activo fijo: Vigencia IMMEX)
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por 15 dígitos, aduana, proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Tipo:</span>
          </div>
          <select
            value={selectedTipo}
            onChange={(e) => setSelectedTipo(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="ALL">Todos los Tipos</option>
            <option value="ENTRADA">Entrada (Importación)</option>
            <option value="SALIDA">Salida (Retorno / Virtual)</option>
          </select>

          <select
            value={selectedClave}
            onChange={(e) => setSelectedClave(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="ALL">Todas las Claves</option>
            <option value="IN">IN (Importación Temporal Insumos)</option>
            <option value="AF">AF (Activo Fijo / Maquinaria)</option>
            <option value="RT">RT (Retorno al Extranjero)</option>
            <option value="V1">V1 (Transferencia Virtual)</option>
            <option value="V5">V5 (Transferencia a Residentes)</option>
          </select>
        </div>
      </div>

      {/* Pedimentos Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Pedimento (15 Dígitos)</th>
                <th className="py-3.5 px-4">Clave & Tipo</th>
                <th className="py-3.5 px-4">Aduana & Patente</th>
                <th className="py-3.5 px-4">Fecha Pago & 48h</th>
                <th className="py-3.5 px-4">Permanencia (18M)</th>
                <th className="py-3.5 px-4">Partidas & Saldo</th>
                <th className="py-3.5 px-4 text-right">Valor USD & IVA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPedimentos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No se encontraron pedimentos aduaneros con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredPedimentos.map(ped => {
                  const isEntrada = ped.tipo === 'ENTRADA';
                  return (
                    <tr key={ped.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      
                      {/* 15 Digits */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isEntrada ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40'}`}>
                            {isEntrada ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                              {ped.numeroPedimento}
                            </span>
                            <p className="text-[10px] text-slate-500 truncate max-w-[160px]">{ped.proveedorCliente}</p>
                          </div>
                        </div>
                      </td>

                      {/* Clave & Tipo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ped.clave === 'IN' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' :
                            ped.clave === 'AF' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                            ped.clave === 'RT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {ped.clave}
                          </span>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400">
                            {isEntrada ? 'Importación' : 'Retorno/Virtual'}
                          </span>
                        </div>
                      </td>

                      {/* Aduana & Patente */}
                      <td className="py-3.5 px-4">
                        <p className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[150px]">{ped.aduana}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Patente: {ped.patente}</p>
                      </td>

                      {/* Fecha Pago & 48h Badge */}
                      <td className="py-3.5 px-4">
                        <p className="text-slate-700 dark:text-slate-300">{ped.fechaPago.slice(0, 10)}</p>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          ped.cumplePlazo48h 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800'
                        }`}>
                          {ped.cumplePlazo48h ? `Captura ${ped.horasTranscurridasRegistro}h (<48h)` : `Atraso ${ped.horasTranscurridasRegistro}h`}
                        </span>
                      </td>

                      {/* Permanencia (18M) */}
                      <td className="py-3.5 px-4">
                        {isEntrada ? (
                          ped.clave === 'AF' ? (
                            <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded">
                              Vigencia IMMEX
                            </span>
                          ) : (
                            <div>
                              <div className="flex items-center justify-between text-[10px] mb-1">
                                <span className="text-slate-500">{ped.diasPermanencia || 0}d / 540d</span>
                                <span className={`font-bold ${
                                  ped.estadoPermanencia === 'VENCIDO' ? 'text-rose-600' :
                                  ped.estadoPermanencia === 'PROXIMO_A_VENCER' ? 'text-amber-600' : 'text-emerald-600'
                                }`}>
                                  {ped.diasRestantes}d rest.
                                </span>
                              </div>
                              <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    ped.estadoPermanencia === 'VENCIDO' ? 'bg-rose-500' :
                                    ped.estadoPermanencia === 'PROXIMO_A_VENCER' ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`} 
                                  style={{ width: `${Math.min(100, ((ped.diasPermanencia || 0) / 540) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">N/A (Salida)</span>
                        )}
                      </td>

                      {/* Partidas & Saldo */}
                      <td className="py-3.5 px-4">
                        {ped.partidas?.map((partida, i) => (
                          <div key={i} className="text-[11px]">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{partida.sku}</span>: 
                            <span className="text-slate-500 ml-1">
                              {partida.saldoDisponible} / {partida.cantidadOriginal} {partida.unidadMedida}
                            </span>
                          </div>
                        ))}
                      </td>

                      {/* Valor USD & Crédito IVA */}
                      <td className="py-3.5 px-4 text-right">
                        <p className="font-bold text-slate-900 dark:text-white">
                          ${ped.valorTotalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        {ped.creditoIvaIepsTotal > 0 && (
                          <p className="text-[10px] text-blue-600 font-medium">
                            IVA: +${ped.creditoIvaIepsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Registro de Pedimento Oficial */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  Registrar Pedimento Aduanero
                </h3>
                <p className="text-xs text-slate-500">
                  Formato de 15 dígitos oficial SAT con control de plazos RGCE
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Pedimento 15 Digits */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Número de Pedimento Oficial (15 dígitos SAT) *
                </label>
                <input
                  type="text"
                  placeholder="Ej: 26 47 3190 7001928"
                  value={formData.numeroPedimento}
                  onChange={(e) => setFormData({ ...formData, numeroPedimento: e.target.value })}
                  className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden dark:text-white ${
                    cleanDigits.length === 15 ? 'border-emerald-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                  required
                />
                <div className="flex items-center justify-between mt-1 text-[10px]">
                  <span className={cleanDigits.length === 15 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                    {cleanDigits.length} / 15 dígitos capturados
                  </span>
                  <span className="text-slate-400 font-mono">Estructura: AA AA PPPP SSSSSSS</span>
                </div>
              </div>

              {/* Tipo y Clave */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Operación *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white"
                  >
                    <option value="ENTRADA">ENTRADA (Importación)</option>
                    <option value="SALIDA">SALIDA (Retorno / Transferencia)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Clave de Pedimento (Anexo 22) *
                  </label>
                  <select
                    value={formData.clave}
                    onChange={(e) => setFormData({ ...formData, clave: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white"
                  >
                    <option value="IN">IN - Importación Temporal Insumos (18 meses)</option>
                    <option value="AF">AF - Importación Activo Fijo (Vigencia IMMEX)</option>
                    <option value="RT">RT - Retorno de Mercancías Transformadas</option>
                    <option value="V1">V1 - Transferencias Virtuales IMMEX</option>
                    <option value="V5">V5 - Retorno a Residentes Nacionales</option>
                  </select>
                </div>
              </div>

              {/* Aduana y Patente */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Aduana de Despacho *
                  </label>
                  <input
                    type="text"
                    value={formData.aduana}
                    onChange={(e) => setFormData({ ...formData, aduana: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Patente Aduanal (4 dígitos) *
                  </label>
                  <input
                    type="text"
                    value={formData.patente}
                    onChange={(e) => setFormData({ ...formData, patente: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs dark:text-white font-mono"
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              {/* Fecha de Pago & Despacho */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fecha y Hora de Despacho Aduanero *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.fechaPago}
                    onChange={(e) => setFormData({ ...formData, fechaPago: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs dark:text-white"
                    required
                  />
                  <p className="text-[10px] text-blue-500 mt-1">Inicia conteo perentorio de 48 horas</p>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Cambio Oficial (DOF)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.tipoCambio}
                    onChange={(e) => setFormData({ ...formData, tipoCambio: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs dark:text-white"
                  />
                </div>
              </div>

              {/* Proveedor / Cliente */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Proveedor / Cliente Extranjero
                </label>
                <input
                  type="text"
                  placeholder="Ej: Shin-Etsu Precision Sensors Co."
                  value={formData.proveedorCliente}
                  onChange={(e) => setFormData({ ...formData, proveedorCliente: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs dark:text-white"
                />
              </div>

              {/* Partida Inicial */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="font-bold text-slate-700 dark:text-slate-200 block">
                  Partida Arancelaria del Pedimento
                </span>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-[10px] text-slate-500 mb-1">SKU / Insumo *</label>
                    <select
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs dark:text-white"
                    >
                      {products.map(p => (
                        <option key={p.sku} value={p.sku}>{p.sku} - {p.name.slice(0, 20)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Cantidad *</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.cantidad}
                      onChange={(e) => setFormData({ ...formData, cantidad: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Valor Unitario (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.valorUnitarioUSD}
                      onChange={(e) => setFormData({ ...formData, valorUnitarioUSD: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Valor Total Estimado:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ${(formData.cantidad * formData.valorUnitarioUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !is15Digits}
                  className={`px-5 py-2 rounded-xl font-semibold text-white shadow-sm flex items-center gap-2 cursor-pointer ${
                    is15Digits ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-400 cursor-not-allowed'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Guardando...' : 'Guardar y Validar SAT'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
