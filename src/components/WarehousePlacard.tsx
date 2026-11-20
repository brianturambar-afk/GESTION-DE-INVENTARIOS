/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, 
  QrCode, 
  Printer, 
  MapPin, 
  ShieldCheck, 
  Cpu, 
  Truck, 
  Box, 
  Search, 
  Edit3, 
  CheckCircle2,
  X,
  Layers,
  Barcode
} from 'lucide-react';
import { Product, BienType } from '../types';

interface WarehousePlacardProps {
  products: Product[];
  onUpdateProduct: (sku: string, updatedData: any) => Promise<void>;
}

export default function WarehousePlacard({ products, onUpdateProduct }: WarehousePlacardProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | BienType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPlacardModalOpen, setIsPlacardModalOpen] = useState(false);

  // Placard edit form
  const [editLocation, setEditLocation] = useState({
    pasillo: '',
    rack: '',
    nivel: '',
    posicion: '',
    loteActual: ''
  });

  const [editPlacado, setEditPlacado] = useState({
    marca: '',
    modelo: '',
    numeroSerie: '',
    pedimentoImportacion: '',
    marbeteTag: '',
    codigoBarrasRFID: '',
    fechaInstalacion: ''
  });

  const openPlacardView = (product: Product) => {
    setSelectedProduct(product);
    setIsPlacardModalOpen(true);
  };

  const openEditLocation = (product: Product) => {
    setSelectedProduct(product);
    setEditLocation({
      pasillo: product.locationRack?.pasillo || 'P-01',
      rack: product.locationRack?.rack || 'R-01',
      nivel: product.locationRack?.nivel || 'N-01',
      posicion: product.locationRack?.posicion || 'POS-01',
      loteActual: product.loteActual || `LOT-${Date.now().toString().slice(-6)}`
    });
    setEditPlacado({
      marca: product.placadoActivoFijo?.marca || 'YAMAHA MOTOR CO.',
      modelo: product.placadoActivoFijo?.modelo || 'MODEL-X1',
      numeroSerie: product.placadoActivoFijo?.numeroSerie || `SN-IMMEX-${Date.now().toString().slice(-6)}`,
      pedimentoImportacion: product.placadoActivoFijo?.pedimentoImportacion || '24 47 3948 4001920',
      marbeteTag: product.placadoActivoFijo?.marbeteTag || `MARB-${product.sku}`,
      codigoBarrasRFID: product.placadoActivoFijo?.codigoBarrasRFID || `RFID-${Date.now()}`,
      fechaInstalacion: product.placadoActivoFijo?.fechaInstalacion || new Date().toISOString().slice(0, 10)
    });
    setIsEditModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const payload: any = {
        locationRack: editLocation,
        loteActual: editLocation.loteActual
      };

      if (selectedProduct.bienType === 'ACTIVO_FIJO') {
        payload.placadoActivoFijo = editPlacado;
      }

      await onUpdateProduct(selectedProduct.sku, payload);
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al guardar ubicación');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesFilter = activeFilter === 'ALL' || p.bienType === activeFilter;
    const matchesSearch = 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.placadoActivoFijo?.numeroSerie && p.placadoActivoFijo.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              REQUERIMIENTO 2 SAT
            </span>
            <span className="text-xs text-slate-500">Materialidad, Racks & Placado Físico</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">
            Control Físico en Bodegas & Placado de Activo Fijo
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Identificación e inviolabilidad: Placado obligatorio con marca, modelo, serie y pedimento de importación para maquinaria; y ubicación por rack/lote vinculada al BOM para insumos.
          </p>
        </div>
      </div>

      {/* Normative Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Maquinaria & Activo Fijo</p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              Placado físico obligatorio con código de barras / RFID visible
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Insumos & Racks</p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              Identificación por Lote y Rack 100% coincidente con BOM
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contenedores & Cajas</p>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              Permanencia autorizada durante la vigencia del programa IMMEX
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'ACTIVO_FIJO', 'MATERIA_PRIMA', 'COMPONENTE', 'CONTENEDOR_TRAILER', 'PRODUCTO_TERMINADO'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === tab 
                  ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab === 'ALL' ? 'Todos los Bienes' :
               tab === 'ACTIVO_FIJO' ? 'Maquinaria & Activo Fijo' :
               tab === 'MATERIA_PRIMA' ? 'Materias Primas (18m)' :
               tab === 'COMPONENTE' ? 'Componentes (18m)' :
               tab === 'CONTENEDOR_TRAILER' ? 'Contenedores IMMEX' : 'Producto Terminado'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar SKU, serie, marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs dark:text-white"
          />
        </div>
      </div>

      {/* Grid of Warehouse Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => {
          const isActivoFijo = product.bienType === 'ACTIVO_FIJO';
          return (
            <div 
              key={product.sku}
              className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                isActivoFijo 
                  ? 'border-purple-200 dark:border-purple-900/50' 
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                
                {/* Badge & Type */}
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActivoFijo ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                    product.bienType === 'MATERIA_PRIMA' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' :
                    product.bienType === 'CONTENEDOR_TRAILER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {product.bienType.replace('_', ' ')}
                  </span>

                  <span className="text-[11px] font-mono text-slate-400">
                    Stock: <strong className="text-slate-800 dark:text-white">{product.stock}</strong> {product.unidadMedida}
                  </span>
                </div>

                {/* SKU & Name */}
                <div>
                  <h3 className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {product.sku}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium line-clamp-2">
                    {product.name}
                  </p>
                </div>

                {/* Location / Rack */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span>Ubicación Almacén:</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {product.locationRack ? `${product.locationRack.pasillo} / ${product.locationRack.rack} / ${product.locationRack.nivel}` : 'No Asignada'}
                    </span>
                  </div>

                  {product.loteActual && (
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>Lote de Control:</span>
                      <span className="font-mono text-indigo-600 font-semibold">{product.loteActual}</span>
                    </div>
                  )}
                </div>

                {/* Placado Data for Activo Fijo */}
                {isActivoFijo && product.placadoActivoFijo && (
                  <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/30 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">
                        Placado Oficial SAT
                      </span>
                      <span className="text-[9px] font-mono text-purple-600 bg-purple-100 dark:bg-purple-950 px-1.5 py-0.5 rounded">
                        {product.placadoActivoFijo.marbeteTag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300">
                      Serie: <strong className="font-mono">{product.placadoActivoFijo.numeroSerie}</strong>
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">
                      Pedimento: {product.placadoActivoFijo.pedimentoImportacion}
                    </p>
                  </div>
                )}

              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between gap-2">
                <button
                  onClick={() => openEditLocation(product)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Rack</span>
                </button>

                {isActivoFijo && (
                  <button
                    onClick={() => openPlacardView(product)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Ver Placa Metal / Marbete</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal: Placa Metálica / Marbete Oficial SAT */}
      {isPlacardModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  Placa Física de Maquinaria / Activo Fijo (IMMEX SAT)
                </h3>
              </div>
              <button 
                onClick={() => setIsPlacardModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulador de Placa Metálica Estampada de Alta Inviolabilidad */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 border-4 border-slate-400 dark:border-slate-700 shadow-inner text-slate-900 dark:text-white space-y-4 font-mono relative">
              
              {/* Tornillos de fijación metálicos en esquinas */}
              <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-600 border border-slate-500 shadow-xs flex items-center justify-center text-[7px] text-slate-700 font-bold">+</div>
              <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-600 border border-slate-500 shadow-xs flex items-center justify-center text-[7px] text-slate-700 font-bold">+</div>
              <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-600 border border-slate-500 shadow-xs flex items-center justify-center text-[7px] text-slate-700 font-bold">+</div>
              <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-600 border border-slate-500 shadow-xs flex items-center justify-center text-[7px] text-slate-700 font-bold">+</div>

              <div className="text-center border-b-2 border-slate-400 dark:border-slate-700 pb-2">
                <span className="text-[10px] tracking-widest font-black uppercase text-slate-700 dark:text-slate-300 block">
                  PROGRAMA IMMEX • SAT MÉXICO
                </span>
                <span className="text-xs font-bold tracking-wider uppercase text-slate-900 dark:text-white">
                  MARBETE DE IDENTIFICACIÓN DE ACTIVO FIJO
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block font-sans">MARCA:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedProduct.placadoActivoFijo?.marca || 'YAMAHA MOTOR CO.'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase block font-sans">MODELO:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedProduct.placadoActivoFijo?.modelo || 'YSM20R-DUAL'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[9px] text-slate-500 uppercase block font-sans">NÚMERO DE SERIE OFICIAL:</span>
                <span className="font-bold text-sm text-indigo-700 dark:text-indigo-400 tracking-wider">
                  {selectedProduct.placadoActivoFijo?.numeroSerie || 'SN-YMH-890214-MX'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700">
                <span className="text-[9px] text-slate-500 uppercase block font-sans">PEDIMENTO DE IMPORTACIÓN TEMPORAL (AF):</span>
                <span className="font-bold text-xs text-slate-900 dark:text-white tracking-widest">
                  {selectedProduct.placadoActivoFijo?.pedimentoImportacion || '24 47 3948 4001920'}
                </span>
              </div>

              {/* Barcode & QR Code simulation */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-300 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Barcode className="w-10 h-8 text-slate-800 dark:text-slate-200" />
                  <div>
                    <span className="text-[8px] text-slate-500 block">TAG RFID:</span>
                    <span className="text-[9px] font-bold">{selectedProduct.placadoActivoFijo?.marbeteTag || 'TAG-AF-001'}</span>
                  </div>
                </div>

                <div className="p-1 bg-white rounded border border-slate-300">
                  <QrCode className="w-8 h-8 text-black" />
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Marbete Oficial</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Editar Ubicación en Rack & Placado */}
      {isEditModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Editar Ubicación & Control de Inviolabilidad
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-4 text-xs">
              
              {/* Rack location */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Ubicación Física en Almacén (Pasillo - Rack - Nivel)
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Pasillo</label>
                    <input
                      type="text"
                      value={editLocation.pasillo}
                      onChange={(e) => setEditLocation({ ...editLocation, pasillo: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 text-xs dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Rack</label>
                    <input
                      type="text"
                      value={editLocation.rack}
                      onChange={(e) => setEditLocation({ ...editLocation, rack: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 text-xs dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Nivel</label>
                    <input
                      type="text"
                      value={editLocation.nivel}
                      onChange={(e) => setEditLocation({ ...editLocation, nivel: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 text-xs dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Posición</label>
                    <input
                      type="text"
                      value={editLocation.posicion}
                      onChange={(e) => setEditLocation({ ...editLocation, posicion: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 text-xs dark:text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Número de Lote de Control (BOM Link)
                </label>
                <input
                  type="text"
                  value={editLocation.loteActual}
                  onChange={(e) => setEditLocation({ ...editLocation, loteActual: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 text-xs font-mono dark:text-white"
                />
              </div>

              {/* If Activo Fijo, show placado fields */}
              {selectedProduct.bienType === 'ACTIVO_FIJO' && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <span className="font-bold text-purple-700 dark:text-purple-300 block">
                    Datos del Placado Físico (Maquinaria)
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500">Marca</label>
                      <input
                        type="text"
                        value={editPlacado.marca}
                        onChange={(e) => setEditPlacado({ ...editPlacado, marca: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 text-xs dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Modelo</label>
                      <input
                        type="text"
                        value={editPlacado.modelo}
                        onChange={(e) => setEditPlacado({ ...editPlacado, modelo: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 text-xs dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500">Número de Serie (Grabado en Chasis)</label>
                    <input
                      type="text"
                      value={editPlacado.numeroSerie}
                      onChange={(e) => setEditPlacado({ ...editPlacado, numeroSerie: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 text-xs font-mono dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500">Pedimento de Importación Temporal</label>
                    <input
                      type="text"
                      value={editPlacado.pedimentoImportacion}
                      onChange={(e) => setEditPlacado({ ...editPlacado, pedimentoImportacion: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border rounded-lg p-2 text-xs font-mono dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold"
                >
                  Guardar Datos
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
