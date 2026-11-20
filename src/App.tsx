/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  History, 
  Link2, 
  Users, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  LogOut,
  FileText,
  TrendingUp,
  Scale,
  MapPin,
  ClipboardCheck,
  Layers,
  ShieldCheck,
  Lock,
  Building2,
  Bell,
  Cpu,
  FileCode2
} from 'lucide-react';
import { 
  Product, 
  Movement, 
  Supplier, 
  Webhook, 
  WebhookLog, 
  MovementType,
  Pedimento,
  DescargoPEPS,
  BillOfMaterials,
  MermaRegistro,
  TomaFisicaInventario,
  ExpedienteElectronico
} from './types';
import Dashboard from './components/Dashboard';
import ProductCatalog from './components/ProductCatalog';
import KardexLedger from './components/KardexLedger';
import CustomsPedimentos from './components/CustomsPedimentos';
import PepsDischarges from './components/PepsDischarges';
import Anexo30Reconciliation from './components/Anexo30Reconciliation';
import ActivoFijoAudit from './components/ActivoFijoAudit';
import WarehousePlacard from './components/WarehousePlacard';
import CyclicInventoryAudit from './components/CyclicInventoryAudit';
import BomScrapManagement from './components/BomScrapManagement';
import ElectronicDossier from './components/ElectronicDossier';
import SatLiveAuditPortal from './components/SatLiveAuditPortal';
import Integrations from './components/Integrations';
import SuppliersList from './components/SuppliersList';
import Login from './components/Login';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { downloadStandaloneAppHtml } from './utils/exportStandaloneHtml';

export default function App() {
  // --- Navigation & Theme States ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDownloadingHtml, setIsDownloadingHtml] = useState(false);

  // --- User Session States ---
  const [user, setUser] = useState<{ email: string; name: string; role: string } | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('kardex_token'));

  // --- Core API Data States ---
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pedimentos, setPedimentos] = useState<Pedimento[]>([]);
  const [descargosPEPS, setDescargosPEPS] = useState<DescargoPEPS[]>([]);
  const [boms, setBoms] = useState<BillOfMaterials[]>([]);
  const [mermas, setMermas] = useState<MermaRegistro[]>([]);
  const [inventariosCiclicos, setInventariosCiclicos] = useState<TomaFisicaInventario[]>([]);
  const [expedientes, setExpedientes] = useState<ExpedienteElectronico[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);

  // --- Loading & Notification States ---
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [quickReorderSku, setQuickReorderSku] = useState<string | null>(null);

  // --- Fetch All Data from API ---
  const fetchData = async () => {
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const [
        prodRes, 
        movRes, 
        suppRes, 
        pedRes, 
        pepsRes, 
        bomRes, 
        mermaRes, 
        invRes, 
        expRes, 
        whRes, 
        logsRes
      ] = await Promise.all([
        fetch('/api/products', { headers }),
        fetch('/api/movements', { headers }),
        fetch('/api/suppliers', { headers }),
        fetch('/api/pedimentos', { headers }),
        fetch('/api/descargos/peps', { headers }),
        fetch('/api/boms', { headers }),
        fetch('/api/mermas', { headers }),
        fetch('/api/inventarios-ciclicos', { headers }),
        fetch('/api/expedientes', { headers }),
        fetch('/api/webhooks', { headers }),
        fetch('/api/webhook-logs', { headers })
      ]);

      const [
        prodData, 
        movData, 
        suppData, 
        pedData, 
        pepsData, 
        bomData, 
        mermaData, 
        invData, 
        expData, 
        whData, 
        logsData
      ] = await Promise.all([
        prodRes.json(),
        movRes.json(),
        suppRes.json(),
        pedRes.json(),
        pepsRes.json(),
        bomRes.json(),
        mermaRes.json(),
        invRes.json(),
        expRes.json(),
        whRes.json(),
        logsRes.json()
      ]);

      setProducts(prodData || []);
      setMovements(movData || []);
      setSuppliers(suppData || []);
      setPedimentos(pedData || []);
      setDescargosPEPS(pepsData || []);
      setBoms(bomData || []);
      setMermas(mermaData || []);
      setInventariosCiclicos(invData || []);
      setExpedientes(expData || []);
      setWebhooks(whData || []);
      setWebhookLogs(logsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      showToast('Error al conectar con los servidores aduaneros', 'error');
    }
  };

  // --- Session check ---
  useEffect(() => {
    const checkSession = async () => {
      // Automatic authenticated session for the auditor
      const cachedUser = localStorage.getItem('kardex_user');
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      } else {
        const defaultAuditor = { 
          email: 'auditor.immex@sat-control.mx', 
          name: 'Ing. Rodrigo Salinas', 
          role: 'Auditor Aduanero IMMEX' 
        };
        setUser(defaultAuditor);
        localStorage.setItem('kardex_user', JSON.stringify(defaultAuditor));
        localStorage.setItem('kardex_token', 'session-immex-active-token');
      }
      await fetchData();
      setLoading(false);
    };

    checkSession();
  }, [token]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleLoginSuccess = (userData: { email: string; name: string; role: string }, sessionToken: string) => {
    setUser(userData);
    setToken(sessionToken);
    localStorage.setItem('kardex_token', sessionToken);
    localStorage.setItem('kardex_user', JSON.stringify(userData));
    showToast(`Sesión iniciada. ¡Bienvenido ${userData.name}!`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('kardex_token');
    localStorage.removeItem('kardex_user');
    showToast('Sesión cerrada correctamente.', 'success');
  };

  // Dark mode trigger
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- API Mutation Handlers ---

  // 1. Add Pedimento
  const handleAddPedimento = async (pedimentoData: any) => {
    const res = await fetch('/api/pedimentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedimentoData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'No se pudo registrar el pedimento.');
    }

    await fetchData();
    showToast(`Pedimento ${pedimentoData.numeroPedimento} registrado exitosamente.`, 'success');
  };

  // 2. Execute PEPS Discharge
  const handleExecutePeps = async (pedimentoSalidaId: string, sku: string, cantidadSalida: number) => {
    const res = await fetch('/api/descargos/peps/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedimentoSalidaId, sku, cantidadSalida })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al ejecutar descargo PEPS.');
    }

    const data = await res.json();
    await fetchData();
    showToast(data.mensaje || 'Descargo PEPS procesado correctamente.', 'success');
    return data;
  };

  // 3. Add BOM
  const handleAddBOM = async (bomData: any) => {
    const res = await fetch('/api/boms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bomData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al guardar BOM');
    }

    await fetchData();
    showToast('Lista de Materiales (BOM) registrada correctamente.', 'success');
  };

  // 4. Add Merma
  const handleAddMerma = async (mermaData: any) => {
    const res = await fetch('/api/mermas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mermaData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al registrar merma');
    }

    await fetchData();
    showToast('Acta de merma y destrucción asentada ante el SAT.', 'success');
  };

  // 5. Add Toma Física de Inventario
  const handleAddTomaFisica = async (tomaData: any) => {
    const res = await fetch('/api/inventarios-ciclicos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tomaData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al asentar toma física');
    }

    await fetchData();
    showToast('Toma física de inventario cíclico guardada con éxito.', 'success');
  };

  // 6. Add Product
  const handleAddProduct = async (prodData: any) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prodData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'No se pudo crear el producto');
    }

    await fetchData();
    showToast(`Producto ${prodData.sku} registrado en catálogo Anexo 24.`, 'success');
  };

  // 7. Edit Product
  const handleEditProduct = async (sku: string, updatedData: any) => {
    const res = await fetch(`/api/products/${sku}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al actualizar');
    }

    await fetchData();
    showToast(`Especificación de ${sku} actualizada con éxito.`, 'success');
  };

  // 8. Delete Product
  const handleDeleteProduct = async (sku: string) => {
    const res = await fetch(`/api/products/${sku}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al eliminar');
    }

    await fetchData();
    showToast(`Ítem ${sku} removido del catálogo.`, 'success');
  };

  // 9. Register Movement (Kardex)
  const handleRegisterMovement = async (
    sku: string, 
    type: MovementType, 
    quantity: number, 
    user: string, 
    reason: string, 
    reference: string,
    direction?: 'INCREMENT' | 'DECREMENT'
  ) => {
    const res = await fetch('/api/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, type, quantity, user, reason, reference, direction })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al registrar movimiento');
    }

    await fetchData();
    showToast(`Movimiento ${type} registrado en Kardex inmutable.`, 'success');
  };

  // 10. Add Supplier
  const handleAddSupplier = async (supplierData: any) => {
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplierData)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al crear proveedor');
    }

    await fetchData();
    showToast(`Proveedor ${supplierData.name} guardado en directorio.`, 'success');
  };

  // 11. Webhooks
  const handleAddWebhook = async (url: string, events: string[]) => {
    const res = await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, events })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al guardar webhook');
    }

    await fetchData();
    showToast('Webhook registrado correctamente.', 'success');
  };

  const handleToggleWebhook = async (id: string) => {
    const res = await fetch(`/api/webhooks/${id}/toggle`, { method: 'PATCH' });
    if (res.ok) {
      await fetchData();
      showToast('Estado de webhook actualizado.', 'success');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    const res = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchData();
      showToast('Webhook eliminado.', 'success');
    }
  };

  // Navigation Items
  const navigationSections = [
    {
      group: 'Cumplimiento SAT IMMEX',
      items: [
        { id: 'dashboard', label: 'Dashboard Ejecutivo', icon: LayoutDashboard },
        { id: 'pedimentos', label: 'Aduanas & Pedimentos (48h)', icon: FileText },
        { id: 'peps', label: 'Descargos PEPS (Anexo 24)', icon: TrendingUp },
        { id: 'anexo30', label: 'Conciliación Anexo 30 & SCCCyG', icon: Scale },
        { id: 'sat-audit', label: 'Portal SAT Apartado C', icon: Lock },
      ]
    },
    {
      group: 'Bodegas & Activo Fijo',
      items: [
        { id: 'activo-fijo', label: 'Control Activo Fijo (Parte 2)', icon: Cpu },
        { id: 'placado', label: 'Placado & Racks de Bodega', icon: MapPin },
        { id: 'ciclicos', label: 'Inventarios Cíclicos (Multas)', icon: ClipboardCheck },
        { id: 'boms', label: 'BOM & Control de Mermas', icon: Layers },
        { id: 'expedientes', label: 'Expediente Digital 5 Años', icon: ShieldCheck },
      ]
    },
    {
      group: 'Catálogos & Plataforma',
      items: [
        { id: 'products', label: 'Catálogo de Bienes', icon: Boxes },
        { id: 'kardex', label: 'Kardex Ledger Inmutable', icon: History },
        { id: 'suppliers', label: 'Proveedores Extranjeros', icon: Users },
        { id: 'integrations', label: 'API & Webhooks SAT', icon: Link2 },
      ]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <Database className="h-5 w-5 absolute text-blue-600" />
        </div>
        <p className="text-xs text-slate-500 font-mono tracking-wider uppercase animate-pulse">
          Cargando Sistema IMMEX Anexo 24 & 30...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const handleDownloadStandaloneHtml = async () => {
    if (isDownloadingHtml) return;
    setIsDownloadingHtml(true);
    try {
      const filename = await downloadStandaloneAppHtml({
        products,
        pedimentos,
        descargosPEPS,
      });
      showToast(`App HTML descargada: ${filename}`, 'success');
    } catch (err) {
      console.error('Error al descargar HTML standalone:', err);
      showToast('Error al generar el archivo HTML de la aplicación.', 'error');
    } finally {
      setIsDownloadingHtml(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-800 dark:text-slate-100">
      <OfflineIndicator />
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 p-3.5 rounded-xl border flex items-center space-x-3 shadow-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-5">
          <div className={`p-1.5 rounded-lg ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          </div>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{toast.message}</span>
        </div>
      )}

      {/* SIDEBAR: Desktop Layout */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 border-r border-slate-800 shrink-0">
        
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white tracking-wider uppercase">IMMEX CONTROL</h1>
            <span className="text-[9px] text-blue-400 font-mono block">ANEXO 24 & 30 SAT</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {navigationSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <span className="px-3 text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                {sec.group}
              </span>
              {sec.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium tracking-wide transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30' 
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar PWA & Standalone HTML Actions */}
        <div className="px-4 py-3 border-t border-slate-800 space-y-2">
          <PWAInstallButton compact onDownloadHtml={handleDownloadStandaloneHtml} />
          <button
            onClick={handleDownloadStandaloneHtml}
            disabled={isDownloadingHtml}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer disabled:opacity-60"
          >
            <FileCode2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{isDownloadingHtml ? 'Generando HTML...' : 'Descargar App (.html)'}</span>
          </button>
        </div>

        {/* Sidebar Footer: Theme Toggle & Logout */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              title="Cambiar Tema"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:text-rose-200 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-mono text-emerald-400 font-bold block">SAT RGCE COMPLIANT</span>
            <span className="text-[8px] font-mono text-slate-500 block">v2.5.0-IMMEX</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-xs">
          
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="hidden sm:inline">Sistema IMMEX</span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>
              <span className="text-slate-900 dark:text-white font-bold uppercase tracking-wider">
                {navigationSections.flatMap(s => s.items).find(i => i.id === activeTab)?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* User profile, PWA Install & Download HTML */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <PWAInstallButton onDownloadHtml={handleDownloadStandaloneHtml} />

            <button
              onClick={handleDownloadStandaloneHtml}
              disabled={isDownloadingHtml}
              title="Descargar versión HTML completa portable"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-60"
            >
              <FileCode2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{isDownloadingHtml ? 'Exportando...' : 'Descargar HTML'}</span>
            </button>

            <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-full text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Certificación IVA/IEPS: AAA</span>
            </div>

            <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-3 sm:pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-medium">{user.role}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 flex items-center justify-center font-bold text-xs">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-72 bg-slate-900 h-full p-4 flex flex-col justify-between" onClick={e => e.stopPropagation()}>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Scale className="w-5 h-5 text-blue-500" />
                    <span className="font-bold text-xs uppercase text-white tracking-wider">IMMEX CONTROL</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-3 max-h-[75vh] overflow-y-auto">
                  {navigationSections.map((sec, idx) => (
                    <div key={idx} className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block px-2">
                        {sec.group}
                      </span>
                      {sec.items.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                              isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 text-left'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </nav>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2.5">
                <PWAInstallButton compact onDownloadHtml={handleDownloadStandaloneHtml} />
                <button
                  onClick={() => {
                    handleDownloadStandaloneHtml();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Descargar App (.html)</span>
                </button>
                <div className="flex items-center justify-between pt-1">
                  <button onClick={handleLogout} className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                  <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-slate-400">
                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN BODY VIEW */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {activeTab === 'dashboard' && (
            <Dashboard 
              products={products}
              pedimentos={pedimentos}
              descargosPEPS={descargosPEPS}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onDownloadHtml={handleDownloadStandaloneHtml}
            />
          )}

          {activeTab === 'pedimentos' && (
            <CustomsPedimentos 
              pedimentos={pedimentos}
              products={products}
              onAddPedimento={handleAddPedimento}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'peps' && (
            <PepsDischarges 
              descargosPEPS={descargosPEPS}
              pedimentos={pedimentos}
              products={products}
              onExecutePeps={handleExecutePeps}
            />
          )}

          {activeTab === 'anexo30' && (
            <Anexo30Reconciliation 
              onTransmitSuccess={fetchData}
            />
          )}

          {activeTab === 'sat-audit' && (
            <SatLiveAuditPortal 
              products={products}
              pedimentos={pedimentos}
              descargosPEPS={descargosPEPS}
            />
          )}

          {activeTab === 'activo-fijo' && (
            <ActivoFijoAudit />
          )}

          {activeTab === 'placado' && (
            <WarehousePlacard 
              products={products}
              onUpdateProduct={handleEditProduct}
            />
          )}

          {activeTab === 'ciclicos' && (
            <CyclicInventoryAudit 
              inventariosCiclicos={inventariosCiclicos}
              products={products}
              onAddTomaFisica={handleAddTomaFisica}
            />
          )}

          {activeTab === 'boms' && (
            <BomScrapManagement 
              boms={boms}
              mermas={mermas}
              products={products}
              onAddBOM={handleAddBOM}
              onAddMerma={handleAddMerma}
            />
          )}

          {activeTab === 'expedientes' && (
            <ElectronicDossier 
              expedientes={expedientes}
            />
          )}

          {activeTab === 'products' && (
            <ProductCatalog 
              products={products}
              suppliers={suppliers}
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onRegisterMovement={handleRegisterMovement}
              quickReorderSku={quickReorderSku}
              clearQuickReorder={() => setQuickReorderSku(null)}
            />
          )}

          {activeTab === 'kardex' && (
            <KardexLedger 
              movements={movements}
            />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersList 
              suppliers={suppliers}
              products={products}
              onAddSupplier={handleAddSupplier}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'integrations' && (
            <Integrations 
              webhooks={webhooks}
              webhookLogs={webhookLogs}
              onAddWebhook={handleAddWebhook}
              onToggleWebhook={handleToggleWebhook}
              onDeleteWebhook={handleDeleteWebhook}
            />
          )}

        </main>

      </div>

    </div>
  );
}
