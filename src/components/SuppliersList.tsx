/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Plus, 
  X, 
  Boxes, 
  AlertTriangle,
  ChevronRight,
  PackageCheck,
  Building
} from 'lucide-react';
import { Supplier, Product } from '../types';

interface SuppliersListProps {
  suppliers: Supplier[];
  products: Product[];
  onAddSupplier: (supplier: { name: string; contact: string; phone: string; email: string }) => Promise<void>;
  onNavigateToTab: (tab: string) => void;
}

export default function SuppliersList({ suppliers, products, onAddSupplier, onNavigateToTab }: SuppliersListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');

  // --- Calculate products per supplier ---
  const supplierProductsMap = useMemo(() => {
    const map: { [supplierName: string]: Product[] } = {};
    
    // Initialize map
    suppliers.forEach(s => {
      map[s.name] = [];
    });

    products.forEach(p => {
      if (p.suppliers && p.suppliers.length > 0) {
        p.suppliers.forEach(suppName => {
          if (!map[suppName]) {
            map[suppName] = [];
          }
          map[suppName].push(p);
        });
      }
    });

    return map;
  }, [suppliers, products]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('El nombre de la empresa proveedora es obligatorio.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setFormError('Ingrese un correo electrónico de contacto válido.');
      return;
    }

    try {
      await onAddSupplier({
        name: name.trim(),
        contact: contact.trim() || 'N/A',
        phone: phone.trim() || 'N/A',
        email: email.trim(),
      });
      setIsModalOpen(false);
      setName('');
      setContact('');
      setPhone('');
      setEmail('');
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el proveedor.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Directorio de Proveedores</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Administración de canales de suministro y asignación de SKU.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1 px-4 py-2 text-sm font-medium bg-slate-900 text-white dark:bg-blue-600 hover:opacity-95 rounded-xl transition-all shadow-xs self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Registrar Proveedor</span>
        </button>
      </div>

      {/* Grid listing suppliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 py-16 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
            <Building className="h-10 w-10 mx-auto opacity-30 mb-2" />
            <span className="font-medium text-xs">Sin Proveedores en Directorio</span>
            <p className="text-[10px] mt-1 text-slate-400">Registre un proveedor para vincularlo a sus SKUs en el catálogo.</p>
          </div>
        ) : (
          suppliers.map(s => {
            const linkedProducts = supplierProductsMap[s.name] || [];
            const criticalCount = linkedProducts.filter(p => p.stock <= p.minStock).length;

            return (
              <div 
                key={s.id} 
                className={`bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all hover:shadow-md ${
                  criticalCount > 0 ? 'border-amber-400 dark:border-amber-500/40' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.id}</span>
                    {criticalCount > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 animate-pulse">
                        <AlertTriangle className="h-2.5 w-2.5 mr-1 shrink-0" />
                        Reabastecimiento
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={s.name}>{s.name}</h3>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center space-x-2">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{s.contact}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono truncate">{s.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono truncate" title={s.email}>{s.email}</span>
                  </div>
                </div>

                {/* Associated Products details */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg space-y-2 border border-slate-100 dark:border-slate-800/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Artículos Asignados ({linkedProducts.length})</span>
                  {linkedProducts.length === 0 ? (
                    <span className="text-[10px] text-slate-400 block">Ningún producto asignado en catálogo.</span>
                  ) : (
                    <div className="space-y-1 max-h-[80px] overflow-y-auto pr-1">
                      {linkedProducts.map(p => (
                        <div key={p.sku} className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-500 truncate max-w-[150px]">{p.sku}</span>
                          <span className={`font-semibold ${p.stock <= p.minStock ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>{p.stock} u.</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* CTA Action */}
                <button
                  onClick={() => onNavigateToTab('products')}
                  className="w-full py-1.5 text-center text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center space-x-1"
                >
                  <span>Ver en Catálogo</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: REGISTER SUPPLIER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Registrar Proveedor en Directorio</h3>
                <p className="text-[11px] text-slate-400">Añada un canal de suministro corporativo.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSupplier} className="p-5 space-y-4">
              {formError && (
                <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs">
                  {formError}
                </div>
              )}

              {/* Company Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Nombre de la Empresa</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Distribuciones Industriales S.A."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden"
                />
              </div>

              {/* Contact Person */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Representante de Contacto</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Ej. Ing. Miguel Ángel"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden"
                />
              </div>

              {/* Contact details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Teléfono de Oficina</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+52 55 1234 5678"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@empresa.com"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs font-medium rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white dark:bg-blue-600 hover:opacity-90 text-xs font-medium rounded-lg"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
