/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowUpDown, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  X, 
  Tag, 
  Boxes, 
  Activity, 
  User, 
  Hash, 
  AlertCircle,
  MapPin,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Product, MovementType, BienType } from '../types';

interface ProductCatalogProps {
  products: Product[];
  suppliers: Array<{ id: string; name: string }>;
  onAddProduct: (product: any) => Promise<void>;
  onEditProduct: (sku: string, data: any) => Promise<void>;
  onDeleteProduct: (sku: string) => Promise<void>;
  onRegisterMovement: (sku: string, type: MovementType, quantity: number, user: string, reason: string, reference: string, direction?: 'INCREMENT' | 'DECREMENT') => Promise<void>;
  quickReorderSku?: string | null;
  clearQuickReorder?: () => void;
}

const CATEGORIES = [
  'Circuitos Integrados', 
  'Sensores Industriales', 
  'Equipos Ensamblados', 
  'Maquinaria de Ensamble', 
  'Contenedores de Tráiler', 
  'Electrónica',
  'Materia Prima General'
];

export default function ProductCatalog({ 
  products, 
  suppliers,
  onAddProduct, 
  onEditProduct, 
  onDeleteProduct, 
  onRegisterMovement,
  quickReorderSku,
  clearQuickReorder
}: ProductCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBienType, setSelectedBienType] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'all' | 'critical'>('all');
  const [sortField, setSortField] = useState<keyof Product>('sku');
  const [sortAsc, setSortAsc] = useState(true);

  // Modals & Drawer States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Movement drawer state
  const [isMovementDrawerOpen, setIsMovementDrawerOpen] = useState(false);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<Product | null>(null);

  // Form States: Product
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [bienType, setBienType] = useState<BienType>('MATERIA_PRIMA');
  const [fraccionArancelaria, setFraccionArancelaria] = useState('8542.31.01');
  const [unidadMedida, setUnidadMedida] = useState<'PZA' | 'KG' | 'LT' | 'MTR' | 'JGO' | 'MILLAR'>('PZA');
  const [costPrice, setCostPrice] = useState('0');
  const [salePrice, setSalePrice] = useState('0');
  const [minStock, setMinStock] = useState('10');
  const [initialStock, setInitialStock] = useState('0');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [pasillo, setPasillo] = useState('P-01');
  const [rack, setRack] = useState('R-01');
  const [nivel, setNivel] = useState('N-01');
  const [posicion, setPosicion] = useState('POS-01');
  const [productError, setProductError] = useState('');

  // Form States: Movement (Kardex)
  const [movType, setMovType] = useState<MovementType>('ENTRADA');
  const [movQty, setMovQty] = useState('1');
  const [movUser, setMovUser] = useState('');
  const [movReason, setMovReason] = useState('');
  const [movRef, setMovRef] = useState('');
  const [movAdjustmentDirection, setMovAdjustmentDirection] = useState<'INCREMENT' | 'DECREMENT'>('DECREMENT');
  const [movementError, setMovementError] = useState('');

  // Quick Reorder trigger
  React.useEffect(() => {
    if (quickReorderSku) {
      const prod = products.find(p => p.sku === quickReorderSku);
      if (prod) {
        openMovementDrawer(prod, 'ENTRADA');
        setMovQty(Math.max(1, prod.minStock * 2 - prod.stock).toString());
        setMovReason('Reabastecimiento urgente de stock mínimo');
        setMovRef('OC-AUTO-' + Date.now().toString().slice(-4));
      }
      if (clearQuickReorder) clearQuickReorder();
    }
  }, [quickReorderSku, products]);

  const openAddProductModal = () => {
    setEditingProduct(null);
    setSku('');
    setName('');
    setCategory(CATEGORIES[0]);
    setBienType('MATERIA_PRIMA');
    setFraccionArancelaria('8542.31.01');
    setUnidadMedida('PZA');
    setCostPrice('0');
    setSalePrice('0');
    setMinStock('10');
    setInitialStock('0');
    setSelectedSuppliers([]);
    setPasillo('P-01');
    setRack('R-01');
    setNivel('N-01');
    setPosicion('POS-01');
    setProductError('');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setSku(product.sku);
    setName(product.name);
    setCategory(product.category);
    setBienType(product.bienType || 'MATERIA_PRIMA');
    setFraccionArancelaria(product.fraccionArancelaria || '8542.31.01');
    setUnidadMedida(product.unidadMedida || 'PZA');
    setCostPrice(product.costPrice.toString());
    setSalePrice(product.salePrice.toString());
    setMinStock(product.minStock.toString());
    setInitialStock(product.stock.toString());
    setSelectedSuppliers(product.suppliers || []);
    setPasillo(product.locationRack?.pasillo || 'P-01');
    setRack(product.locationRack?.rack || 'R-01');
    setNivel(product.locationRack?.nivel || 'N-01');
    setPosicion(product.locationRack?.posicion || 'POS-01');
    setProductError('');
    setIsProductModalOpen(true);
  };

  const openMovementDrawer = (product: Product, type: MovementType = 'ENTRADA') => {
    setSelectedProductForMovement(product);
    setMovType(type);
    setMovQty('1');
    setMovReason('');
    setMovRef('');
    setMovAdjustmentDirection('DECREMENT');
    setMovementError('');
    setIsMovementDrawerOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductError('');

    if (!sku.trim() || !name.trim() || !fraccionArancelaria.trim()) {
      setProductError('SKU, nombre y Fracción Arancelaria TIGIE son obligatorios según el SAT.');
      return;
    }

    const dataPayload = {
      sku: sku.trim(),
      name: name.trim(),
      category: category.trim(),
      bienType,
      fraccionArancelaria: fraccionArancelaria.trim(),
      unidadMedida,
      costPrice: parseFloat(costPrice) || 0,
      salePrice: parseFloat(salePrice) || 0,
      minStock: parseInt(minStock) || 0,
      stock: editingProduct ? undefined : (parseInt(initialStock) || 0),
      suppliers: selectedSuppliers,
      locationRack: {
        pasillo,
        rack,
        nivel,
        posicion
      }
    };

    try {
      if (editingProduct) {
        await onEditProduct(editingProduct.sku, dataPayload);
      } else {
        await onAddProduct(dataPayload);
      }
      setIsProductModalOpen(false);
    } catch (err: any) {
      setProductError(err.message || 'Error al guardar el producto');
    }
  };

  const handleRegisterTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setMovementError('');

    if (!selectedProductForMovement) return;

    const qty = parseInt(movQty);
    if (isNaN(qty) || qty <= 0) {
      setMovementError('La cantidad debe ser un entero positivo.');
      return;
    }

    if (!movUser.trim()) {
      setMovementError('Debe ingresar el nombre del usuario operador responsable.');
      return;
    }

    if (!movReason.trim()) {
      setMovementError('El motivo o justificación técnica es obligatorio.');
      return;
    }

    if (movType === 'SALIDA' && selectedProductForMovement.stock < qty) {
      setMovementError(`Stock insuficiente. Existencias: ${selectedProductForMovement.stock} u.`);
      return;
    }

    try {
      await onRegisterMovement(
        selectedProductForMovement.sku,
        movType,
        qty,
        movUser.trim(),
        movReason.trim(),
        movRef.trim() || 'SYS-IMMEX',
        movType === 'AJUSTE' ? movAdjustmentDirection : undefined
      );
      setIsMovementDrawerOpen(false);
    } catch (err: any) {
      setMovementError(err.message || 'Error al registrar la transacción.');
    }
  };

  const toggleSupplierSelection = (suppName: string) => {
    if (selectedSuppliers.includes(suppName)) {
      setSelectedSuppliers(selectedSuppliers.filter(s => s !== suppName));
    } else {
      setSelectedSuppliers([...selectedSuppliers, suppName]);
    }
  };

  const handleDeleteClick = async (product: Product) => {
    const confirmDelete = window.confirm(`¿Está seguro que desea eliminar ${product.sku} (${product.name}) del catálogo del Anexo 24?`);
    if (confirmDelete) {
      try {
        await onDeleteProduct(product.sku);
      } catch (err: any) {
        alert(err.message || 'Error al eliminar');
      }
    }
  };

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          p.sku.toLowerCase().includes(term) || 
          p.name.toLowerCase().includes(term) ||
          p.fraccionArancelaria.toLowerCase().includes(term);
        const matchesBien = selectedBienType === 'ALL' || p.bienType === selectedBienType;
        const matchesStock = stockFilter === 'all' || p.stock <= p.minStock;
        return matchesSearch && matchesBien && matchesStock;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
          return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
        }
      });
  }, [products, searchTerm, selectedBienType, stockFilter, sortField, sortAsc]);

  return (
    <div className="space-y-6">
      
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              APARTADO A • CATÁLOGOS IMMEX
            </span>
            <span className="text-xs text-slate-500">Materiales, Mercancías, Activos Fijos y Contenedores</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Catálogo Oficial de Bienes (Anexo 24 SAT)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registro de fracciones arancelarias TIGIE, saldos físicos vs Anexo 24 vs Anexo 30 y ubicaciones de almacén.
          </p>
        </div>
        <button
          onClick={openAddProductModal}
          className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm cursor-pointer self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Ítem al Catálogo</span>
        </button>
      </div>

      {/* Control Bar: Search, Bien Type, Stock Level */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por SKU, Nombre o Fracción TIGIE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedBienType}
              onChange={(e) => setSelectedBienType(e.target.value)}
              className="text-xs font-medium py-1.5 px-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Todos los Tipos de Bien</option>
              <option value="MATERIA_PRIMA">Materia Prima (18m)</option>
              <option value="COMPONENTE">Componente (18m)</option>
              <option value="PRODUCTO_TERMINADO">Producto Terminado (Retorno)</option>
              <option value="ACTIVO_FIJO">Activo Fijo / Maquinaria</option>
              <option value="CONTENEDOR_TRAILER">Contenedores & Cajas</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                stockFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setStockFilter('critical')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all flex items-center space-x-1 ${
                stockFilter === 'critical'
                  ? 'bg-white dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>Críticos ({products.filter(p => p.stock <= p.minStock).length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 cursor-pointer" onClick={() => handleSort('sku')}>
                  <div className="flex items-center space-x-1 font-mono">
                    <span>SKU & Fracción</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center space-x-1">
                    <span>Descripción & Tipo</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Ubicación Rack</th>
                <th className="py-3.5 px-4 text-center">Físico</th>
                <th className="py-3.5 px-4 text-center">Anexo 24</th>
                <th className="py-3.5 px-4 text-center">Anexo 30</th>
                <th className="py-3.5 px-4 text-center">Kardex Transaccional</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((p) => {
                const isCritical = p.stock <= p.minStock;
                const isDiscrepant = p.stock !== p.anexo24Stock || p.anexo24Stock !== p.anexo30Stock;
                return (
                  <tr 
                    key={p.sku} 
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${
                      isCritical ? 'bg-rose-500/5 dark:bg-rose-950/10' : ''
                    }`}
                  >
                    {/* SKU & Fracción */}
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-100">{p.sku}</p>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-semibold">
                        TIGIE: {p.fraccionArancelaria}
                      </p>
                    </td>

                    {/* Description & Type */}
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-900 dark:text-white truncate max-w-[220px]">{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          p.bienType === 'ACTIVO_FIJO' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                          p.bienType === 'MATERIA_PRIMA' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' :
                          p.bienType === 'CONTENEDOR_TRAILER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {p.bienType?.replace('_', ' ') || 'MATERIA PRIMA'}
                        </span>
                        <span className="text-[10px] text-slate-400">{p.category}</span>
                      </div>
                    </td>

                    {/* Rack */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {p.locationRack ? `${p.locationRack.pasillo} / ${p.locationRack.rack} / ${p.locationRack.nivel}` : 'Sin Rack'}
                    </td>

                    {/* Físico */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-100">
                      {p.stock} <span className="text-[9px] text-slate-400">{p.unidadMedida}</span>
                    </td>

                    {/* Anexo 24 */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {p.anexo24Stock}
                    </td>

                    {/* Anexo 30 */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                      {p.anexo30Stock}
                    </td>

                    {/* Quick Operations */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openMovementDrawer(p, 'ENTRADA')}
                          title="Registrar Entrada"
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 border border-slate-200 dark:border-slate-700 cursor-pointer"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openMovementDrawer(p, 'SALIDA')}
                          title="Registrar Salida / Retorno"
                          disabled={p.stock === 0}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-30"
                        >
                          <ArrowDownLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openMovementDrawer(p, 'AJUSTE')}
                          title="Ajuste Físico"
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 border border-slate-200 dark:border-slate-700 cursor-pointer"
                        >
                          <Activity className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openEditProductModal(p)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingProduct ? 'Editar Ítem del Catálogo IMMEX' : 'Registrar Nuevo Ítem en Catálogo Anexo 24'}
                </h3>
                <p className="text-[11px] text-slate-500">Clasificación arancelaria y ubicación en bodega</p>
              </div>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {productError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-600 text-xs font-medium flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{productError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">SKU / No. de Parte *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProduct}
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-mono text-xs dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Fracción TIGIE (SAT) *</label>
                  <input
                    type="text"
                    required
                    value={fraccionArancelaria}
                    onChange={(e) => setFraccionArancelaria(e.target.value)}
                    placeholder="Ej: 8542.31.01"
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-mono text-xs dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción de la Mercancía *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Bien IMMEX *</label>
                  <select
                    value={bienType}
                    onChange={(e) => setBienType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs dark:text-white font-medium"
                  >
                    <option value="MATERIA_PRIMA">Materia Prima (Plazo 18m)</option>
                    <option value="COMPONENTE">Componente (Plazo 18m)</option>
                    <option value="PRODUCTO_TERMINADO">Producto Terminado (Retorno)</option>
                    <option value="ACTIVO_FIJO">Activo Fijo / Maquinaria (Placado)</option>
                    <option value="CONTENEDOR_TRAILER">Contenedor / Caja Tráiler</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Unidad de Medida (TIGIE)</label>
                  <select
                    value={unidadMedida}
                    onChange={(e) => setUnidadMedida(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 text-xs dark:text-white"
                  >
                    <option value="PZA">PZA (Piezas)</option>
                    <option value="KG">KG (Kilogramos)</option>
                    <option value="LT">LT (Litros)</option>
                    <option value="MTR">MTR (Metros)</option>
                    <option value="JGO">JGO (Juego)</option>
                    <option value="MILLAR">MILLAR</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">Ubicación en Almacén</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Pasillo</label>
                    <input type="text" value={pasillo} onChange={(e) => setPasillo(e.target.value)} className="w-full bg-white dark:bg-slate-800 border rounded p-1.5 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Rack</label>
                    <input type="text" value={rack} onChange={(e) => setRack(e.target.value)} className="w-full bg-white dark:bg-slate-800 border rounded p-1.5 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Nivel</label>
                    <input type="text" value={nivel} onChange={(e) => setNivel(e.target.value)} className="w-full bg-white dark:bg-slate-800 border rounded p-1.5 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Posición</label>
                    <input type="text" value={posicion} onChange={(e) => setPosicion(e.target.value)} className="w-full bg-white dark:bg-slate-800 border rounded p-1.5 text-xs" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold"
                >
                  Guardar Ítem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER: KARDEX TRANSACTION */}
      {isMovementDrawerOpen && selectedProductForMovement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full sm:h-[95vh] rounded-none sm:rounded-2xl border-l sm:border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Transacción en Kardex IMMEX</h3>
                <p className="text-[11px] font-mono text-slate-500">{selectedProductForMovement.sku}</p>
              </div>
              <button onClick={() => setIsMovementDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterTransaction} className="p-5 space-y-4 flex-1 overflow-y-auto text-xs">
              {movementError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-600 font-medium">{movementError}</div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Tipo de Movimiento</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ENTRADA', 'SALIDA', 'AJUSTE'] as MovementType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMovType(t)}
                      className={`py-2 rounded-xl font-bold cursor-pointer ${movType === t ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Cantidad ({selectedProductForMovement.unidadMedida})</label>
                <input
                  type="number"
                  min="1"
                  value={movQty}
                  onChange={(e) => setMovQty(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Usuario Responsable</label>
                <input
                  type="text"
                  value={movUser}
                  onChange={(e) => setMovUser(e.target.value)}
                  placeholder="Ej: Andrés López (Almacén)"
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Motivo / Pedimento de Referencia</label>
                <textarea
                  rows={2}
                  value={movReason}
                  onChange={(e) => setMovReason(e.target.value)}
                  placeholder="Explique el origen o destino de la mercancía"
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl p-2.5"
                  required
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsMovementDrawerOpen(false)} className="px-4 py-2 border rounded-xl">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold">
                  Confirmar {movType}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
