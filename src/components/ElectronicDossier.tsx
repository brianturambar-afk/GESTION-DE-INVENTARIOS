/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Download, 
  Search, 
  Lock, 
  FileCheck,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';
import { ExpedienteElectronico, DocumentoMaterialidad } from '../types';

interface ElectronicDossierProps {
  expedientes: ExpedienteElectronico[];
}

export default function ElectronicDossier({ expedientes }: ElectronicDossierProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpediente, setSelectedExpediente] = useState<ExpedienteElectronico | null>(expedientes[0] || null);

  const filteredExpedientes = expedientes.filter(e => 
    e.numeroPedimento.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.lote.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDocTypeLabel = (tipo: DocumentoMaterialidad['tipo']) => {
    switch (tipo) {
      case 'PEDIMENTO_FACTURA_CFDI': return '1. Pedimento & Factura CFDI / CCE';
      case 'TRANSPORTE_CARTA_PORTE': return '2. Carta Porte / Bill of Lading';
      case 'RECEPCION_ALMACEN_WMS': return '3. Entrada WMS & Pesaje';
      case 'ORDEN_PRODUCCION_BOM': return '4. Orden de Ensamble & BOM';
      case 'PEDIMENTO_RETORNO': return '5. Pedimento de Retorno / V1';
      case 'PRUEBA_PAGO_CONTRATOS': return '6. Pruebas de Pago & Nómina (Materialidad)';
      default: return tipo;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              REQUERIMIENTO 3 SAT • MATERIALIDAD
            </span>
            <span className="text-xs text-slate-500">Expediente Electrónico por Lote y Pedimento</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">
            Expediente Digital de Comercio Exterior (Resguardo 5 Años)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Resguardo obligatorio durante un mínimo de <strong>5 años</strong> de los 6 pilares de materialidad para desvirtuar presunciones de comercialización ilegal en el mercado nacional.
          </p>
        </div>
      </div>

      {/* Normative Notice */}
      <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/30 text-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-purple-600 shrink-0" />
          <div>
            <p className="font-bold text-purple-900 dark:text-purple-300">
              Criterio de Materialidad del SAT (Art. 69-B CFF y Art. 108 Ley Aduanera)
            </p>
            <p className="text-purple-700 dark:text-purple-400 text-[11px] mt-0.5">
              No basta tener el pedimento; se debe probar la existencia física, logística, manufactura real ligada a BOM, retornos y comprobantes de pago de nómina.
            </p>
          </div>
        </div>
        <span className="font-mono text-purple-800 dark:text-purple-300 font-bold bg-white dark:bg-slate-900 px-3 py-1 rounded-xl shadow-xs shrink-0">
          5 Años Resguardo
        </span>
      </div>

      {/* Main Grid: Selector & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Dossier List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por pedimento o lote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs dark:text-white"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredExpedientes.map(exp => {
              const isSelected = selectedExpediente?.id === exp.id;
              return (
                <div
                  key={exp.id}
                  onClick={() => setSelectedExpediente(exp)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-800 shadow-xs' 
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {exp.numeroPedimento}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      exp.porcentajeCompletitud === 100 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {exp.porcentajeCompletitud}% Completo
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1">
                    Lote: <strong className="text-slate-700 dark:text-slate-300 font-mono">{exp.lote}</strong>
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Cruce: {exp.fechaOperacion.slice(0, 10)}</span>
                    <span className="text-purple-600 font-semibold">{exp.aniosRestantesResguardo} años rest.</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Selected Dossier Detail */}
        <div className="lg:col-span-2 space-y-4">
          {selectedExpediente ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              
              {/* Top Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-purple-600 font-bold bg-purple-50 dark:bg-purple-950 px-2.5 py-0.5 rounded">
                    EXPEDIENTE DIGITAL DE MATERIALIDAD
                  </span>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    Pedimento: {selectedExpediente.numeroPedimento}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Lote Asociado: {selectedExpediente.lote} • Cruce: {selectedExpediente.fechaOperacion.slice(0, 10)}
                  </p>
                </div>

                <div className="text-right sm:shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600">
                    <Clock className="w-4 h-4" />
                    <span>{selectedExpediente.aniosRestantesResguardo} Años Restantes de Resguardo</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Fecha límite legal: {selectedExpediente.fechaResguardoObligatorio.slice(0, 10)}
                  </p>
                </div>
              </div>

              {/* 6 Document Checklist */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Los 6 Pilares de Soporte de Materialidad:
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {selectedExpediente.documentos.map((doc, idx) => {
                    const isValidado = doc.estatusValidacion === 'VALIDADO_COMPLETO';
                    return (
                      <div 
                        key={idx}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isValidado 
                            ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800' 
                            : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg mt-0.5 ${
                            isValidado ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : 'bg-amber-50 text-amber-600 dark:bg-amber-950'
                          }`}>
                            {isValidado ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-800 dark:text-slate-200">
                              {getDocTypeLabel(doc.tipo)}
                            </p>
                            <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                              {doc.nombreArchivo}
                            </p>
                            <p className="text-[10px] text-slate-500 italic mt-0.5">
                              {doc.observaciones}
                            </p>
                          </div>
                        </div>

                        <div className="text-right sm:shrink-0 flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isValidado 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {doc.estatusValidacion}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center text-slate-400 border border-slate-200 dark:border-slate-800">
              Seleccione un expediente de la lista para consultar su materialidad.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
