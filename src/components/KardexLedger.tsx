/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity, 
  Search, 
  FileSpreadsheet, 
  User, 
  Tag, 
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import { Movement, MovementType } from '../types';

interface KardexLedgerProps {
  movements: Movement[];
}

export default function KardexLedger({ movements }: KardexLedgerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedOperator, setSelectedOperator] = useState<string>('All');

  // --- Dynamic Operators List ---
  const operators = useMemo(() => {
    const set = new Set(movements.map(m => m.user));
    return Array.from(set);
  }, [movements]);

  // --- Filtered Movements ---
  const filteredMovements = useMemo(() => {
    return movements
      .filter((m) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          m.sku.toLowerCase().includes(term) || 
          m.productName.toLowerCase().includes(term) ||
          m.reason.toLowerCase().includes(term) ||
          m.reference.toLowerCase().includes(term);

        const matchesType = selectedType === 'All' || m.type === selectedType;
        const matchesOperator = selectedOperator === 'All' || m.user === selectedOperator;

        return matchesSearch && matchesType && matchesOperator;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Newest first
  }, [movements, searchTerm, selectedType, selectedOperator]);

  // --- Export to CSV Simulated Handler ---
  const handleExportCSV = () => {
    // Generate simple csv file representation
    const headers = ['ID', 'Fecha/Hora', 'SKU', 'Producto', 'Tipo', 'Cantidad', 'Operador', 'Ticket/Ref', 'Justificación'];
    const rows = filteredMovements.map(m => [
      m.id,
      new Date(m.timestamp).toLocaleString('es-ES'),
      m.sku,
      m.productName,
      m.type,
      m.quantity,
      m.user,
      m.reference,
      m.reason.replace(/"/g, '""')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `auditoria_kardex_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header and Export action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Kardex de Auditoría</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Libro contable e historial inmutable de movimientos de almacén.</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filteredMovements.length === 0}
          className="flex items-center space-x-1 px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all shadow-xs self-start sm:self-center disabled:opacity-50"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          <span>Exportar Libro (CSV)</span>
        </button>
      </div>

      {/* High density context box explaining Kardex */}
      <div className="bg-slate-900/5 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-xl flex items-start space-x-3 text-xs text-slate-600 dark:text-slate-400">
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-semibold text-slate-800 dark:text-slate-200">Integridad de Auditoría B2B (Kardex Law)</strong>
          <p>
            Este registro es estrictamente inmutable. De acuerdo a principios contables e impositivos, no existe la edición directa de stocks ni la eliminación de transacciones. Cualquier corrección debe aplicarse mediante un contra-movimiento de tipo <strong className="text-amber-600 dark:text-amber-400 font-medium">AJUSTE</strong> justificando el número de auditoría respectivo.
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-3 lg:space-y-0">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por SKU, Producto, Justificación o Referencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400 dark:focus:ring-blue-500 font-sans"
          />
        </div>

        {/* Multi-Filter selects */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Movement Type */}
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Tipo:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs font-medium py-1.5 px-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg focus:outline-hidden"
            >
              <option value="All">Todos</option>
              <option value="ENTRADA">ENTRADA (Ingreso)</option>
              <option value="SALIDA">SALIDA (Retiro)</option>
              <option value="AJUSTE">AJUSTE (Auditoría)</option>
            </select>
          </div>

          {/* Operator Select */}
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Operador:</span>
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="text-xs font-medium py-1.5 px-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg focus:outline-hidden max-w-[180px]"
            >
              <option value="All">Todos los Operadores</option>
              {operators.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table view */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Fecha/Hora</th>
                <th className="py-3 px-4">Código SKU</th>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4 text-center">Tipo</th>
                <th className="py-3 px-4 text-right">Cantidad</th>
                <th className="py-3 px-4">Ticket/Ref</th>
                <th className="py-3 px-4">Responsable</th>
                <th className="py-3 px-4">Justificación / Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <span className="font-medium">No se registraron movimientos con los filtros activos</span>
                    <p className="text-[10px] text-slate-400 mt-1">Haga una transacción desde el catálogo para ver el registro inmediato.</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(m.timestamp).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {m.sku}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-[150px] truncate">
                        {m.productName}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          m.type === 'ENTRADA' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                          m.type === 'SALIDA' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' :
                          'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}>
                          {m.type === 'ENTRADA' ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          ) : m.type === 'SALIDA' ? (
                            <ArrowDownLeft className="h-3 w-3 mr-1" />
                          ) : (
                            <Activity className="h-3 w-3 mr-1" />
                          )}
                          {m.type}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className={`py-3.5 px-4 text-right font-mono font-semibold ${
                        m.type === 'ENTRADA' ? 'text-emerald-600 dark:text-emerald-400' :
                        m.type === 'SALIDA' ? 'text-rose-600 dark:text-rose-400' :
                        m.quantity > 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {m.type === 'ENTRADA' ? '+' : ''}
                        {m.quantity}
                      </td>

                      {/* Reference Ticket */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {m.reference}
                      </td>

                      {/* Operator User */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 max-w-[140px] truncate">
                        <User className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{m.user}</span>
                      </td>

                      {/* Reason / Justification */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-[220px] truncate" title={m.reason}>
                        {m.reason}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
