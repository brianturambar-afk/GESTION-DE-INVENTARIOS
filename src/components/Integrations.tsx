/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, 
  Webhook as WebhookIcon, 
  Terminal, 
  Play, 
  Layers, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Link, 
  Eye, 
  Copy,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { Webhook, WebhookLog } from '../types';

interface IntegrationsProps {
  webhooks: Webhook[];
  webhookLogs: WebhookLog[];
  onAddWebhook: (url: string, events: string[]) => Promise<void>;
  onToggleWebhook: (id: string) => Promise<void>;
  onDeleteWebhook: (id: string) => Promise<void>;
}

export default function Integrations({ 
  webhooks, 
  webhookLogs, 
  onAddWebhook, 
  onToggleWebhook, 
  onDeleteWebhook 
}: IntegrationsProps) {
  // --- Form Webhook states ---
  const [newUrl, setNewUrl] = useState('');
  const [eventCritical, setEventCritical] = useState(true);
  const [eventMovement, setEventMovement] = useState(false);
  const [formError, setFormError] = useState('');
  const [isCopied, setIsCopied] = useState<{ [key: string]: boolean }>({});

  // --- API Tester states ---
  const [apiResponse, setApiResponse] = useState<string>('// Presione "Ejecutar Consulta" para realizar una llamada real a la API.');
  const [apiLoading, setApiLoading] = useState(false);
  const [activeEndpoint, setActiveEndpoint] = useState<'products' | 'movements' | 'suppliers'>('products');

  // --- Helpers ---
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied({ ...isCopied, [id]: true });
    setTimeout(() => {
      setIsCopied({ ...isCopied, [id]: false });
    }, 2000);
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newUrl.trim()) {
      setFormError('La URL del Webhook es obligatoria.');
      return;
    }

    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      setFormError('La URL debe comenzar con http:// o https://.');
      return;
    }

    const events: string[] = [];
    if (eventCritical) events.push('STOCK_CRITICAL');
    if (eventMovement) events.push('MOVEMENT_REGISTERED');

    if (events.length === 0) {
      setFormError('Seleccione al menos un evento para suscribirse.');
      return;
    }

    try {
      await onAddWebhook(newUrl.trim(), events);
      setNewUrl('');
      setEventCritical(true);
      setEventMovement(false);
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el Webhook.');
    }
  };

  const handleTestApi = async (endpoint: 'products' | 'movements' | 'suppliers') => {
    setActiveEndpoint(endpoint);
    setApiLoading(true);
    try {
      const res = await fetch(`/api/${endpoint}`);
      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setApiResponse(JSON.stringify({ error: 'Error de red', message: err.message }, null, 2));
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Integraciones & API Hub</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Exposición de endpoints, diagramas de base de datos relacional y configuración de Webhooks B2B.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: DB Schema and API tester */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Módulo 1: Database Relational Schema Spec */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Esquema Físico y Relaciones (PostgreSQL / Relacional)</h2>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Modelado entidad-relación optimizado con restricciones de clave externa para evitar huérfanos y Ledger inmutable (Kardex logic).
            </p>

            {/* Visual SQL relational design */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Product Card Schema */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800/80 rounded-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">TABLE products</span>
                  <span className="text-[10px] uppercase font-semibold text-blue-500">Catálogo</span>
                </div>
                <div className="space-y-1.5 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">sku VARCHAR(50) [PK]</span>
                    <span>NOT NULL UNIQUE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>name VARCHAR(150)</span>
                    <span>NOT NULL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>category VARCHAR(80)</span>
                    <span>NOT NULL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>cost_price DECIMAL(12,2)</span>
                    <span>NOT NULL DEFAULT 0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>sale_price DECIMAL(12,2)</span>
                    <span>NOT NULL DEFAULT 0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-500">stock INTEGER</span>
                    <span>DERIVED / ATOM-READONLY</span>
                  </div>
                  <div className="flex justify-between">
                    <span>min_stock INTEGER</span>
                    <span>NOT NULL DEFAULT 5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>created_at TIMESTAMP</span>
                    <span>DEFAULT NOW()</span>
                  </div>
                </div>
              </div>

              {/* Movement Card Schema */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800/80 rounded-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">TABLE movements</span>
                  <span className="text-[10px] uppercase font-semibold text-rose-500">Ledger (Kardex)</span>
                </div>
                <div className="space-y-1.5 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>id VARCHAR(50) [PK]</span>
                    <span>NOT NULL UNIQUE</span>
                  </div>
                  <div className="flex justify-between text-blue-600 dark:text-blue-400">
                    <span className="font-bold">sku VARCHAR(50) [FK]</span>
                    <span>REFERENCES products(sku)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>type VARCHAR(15)</span>
                    <span>'ENTRADA' | 'SALIDA' | 'AJUSTE'</span>
                  </div>
                  <div className="flex justify-between">
                    <span>quantity INTEGER</span>
                    <span>NOT NULL (SIGNED)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>user_operator VARCHAR(100)</span>
                    <span>NOT NULL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>reason TEXT</span>
                    <span>NOT NULL (MANDATORY)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>reference VARCHAR(100)</span>
                    <span>NOT NULL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>timestamp TIMESTAMP</span>
                    <span>DEFAULT NOW()</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Relationship Specs text */}
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <div className="font-semibold flex items-center">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 shrink-0 text-blue-500" />
                Regla de Invariante de Negocio (Disparador PostgreSQL o Middleware Server):
              </div>
              <p className="pl-5 text-[11px]">
                <code>UPDATE products SET stock = stock + NEW.quantity WHERE sku = NEW.sku;</code> se gatilla automáticamente al insertar en <code>movements</code>. Ningún API ni cliente expone actualización directa de stock sobre la tabla <code>products</code>.
              </p>
            </div>
          </div>

          {/* Módulo 2: API Endpoints Docs & Console Tester */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="h-5 w-5 text-emerald-500" />
                <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">API de Integración ERP (Rest endpoints)</h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold">
                API V1 LIVE
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pruebe y consuma datos en tiempo real mediante endpoints estandarizados. Haga click en Ejecutar para lanzar la llamada física al backend.
            </p>

            {/* Interactive Selector Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleTestApi('products')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                  activeEndpoint === 'products'
                    ? 'bg-slate-950 text-white border-slate-950 dark:bg-blue-600 dark:border-blue-600'
                    : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                }`}
              >
                GET /api/products
              </button>
              <button
                onClick={() => handleTestApi('movements')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                  activeEndpoint === 'movements'
                    ? 'bg-slate-950 text-white border-slate-950 dark:bg-blue-600 dark:border-blue-600'
                    : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                }`}
              >
                GET /api/movements
              </button>
              <button
                onClick={() => handleTestApi('suppliers')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                  activeEndpoint === 'suppliers'
                    ? 'bg-slate-950 text-white border-slate-950 dark:bg-blue-600 dark:border-blue-600'
                    : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                }`}
              >
                GET /api/suppliers
              </button>
            </div>

            {/* Code view wrapper */}
            <div className="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-900 text-slate-300 font-mono text-[10px] p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-500">
                <span>RESPUESTA JSON ({activeEndpoint === 'products' ? 'Productos Catalogados' : activeEndpoint === 'movements' ? 'Kardex' : 'Proveedores'})</span>
                <button 
                  onClick={() => handleCopy(apiResponse, 'api_code')}
                  className="flex items-center space-x-1 hover:text-white transition-all"
                >
                  <Copy className="h-3 w-3" />
                  <span>{isCopied['api_code'] ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <pre className="overflow-x-auto max-h-[180px] text-[11px] leading-relaxed select-all">
                {apiLoading ? '// Cargando respuesta desde servidor...' : apiResponse}
              </pre>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Webhooks setup & Simulation logs */}
        <div className="space-y-8">
          
          {/* Módulo 3: Webhook configurator */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <WebhookIcon className="h-5 w-5 text-blue-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Canales Webhook (Eventos)</h2>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registre y despache payloads JSON a sistemas externos (Sistemas ERP, canas de Slack/Teams, etc.) cuando ocurran eventos críticos.
            </p>

            {/* Form */}
            <form onSubmit={handleCreateWebhook} className="space-y-3">
              {formError && (
                <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs">
                  {formError}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Endpoint Webhook URL</label>
                <input
                  type="text"
                  placeholder="https://api.empresa.com/hooks/stock"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden"
                />
              </div>

              {/* Event checkboxes */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Eventos suscritos</span>
                <div className="space-y-1.5 border border-slate-100 dark:border-slate-800 p-2 rounded-lg">
                  <label className="flex items-center space-x-2 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventCritical}
                      onChange={() => setEventCritical(!eventCritical)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>STOCK_CRITICAL (Bajo stock de seguridad)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventMovement}
                      onChange={() => setEventMovement(!eventMovement)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>MOVEMENT_REGISTERED (Cualquier entrada/salida)</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 text-xs font-semibold bg-slate-900 text-white dark:bg-blue-600 hover:opacity-90 rounded-lg transition-all"
              >
                Suscribir Webhook
              </button>
            </form>

            {/* Active Webhooks List */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/60">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Webhooks Registrados ({webhooks.length})</span>
              {webhooks.length === 0 ? (
                <span className="text-xs text-slate-400 block py-2">Ningún canal registrado.</span>
              ) : (
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {webhooks.map(wh => (
                    <div key={wh.id} className="p-2.5 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-between text-xs">
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="text-slate-700 dark:text-slate-300 truncate font-mono text-[10px]">{wh.url}</div>
                        <div className="flex gap-1 flex-wrap">
                          {wh.events.map(ev => (
                            <span key={ev} className="text-[8px] px-1 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 rounded-sm">{ev}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => onToggleWebhook(wh.id)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            wh.isActive 
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' 
                              : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                          }`}
                        >
                          {wh.isActive ? 'Activo' : 'Pausa'}
                        </button>
                        <button
                          onClick={() => onDeleteWebhook(wh.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Módulo 4: Webhook Real-time firing simulation logs */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">Bitácora de Eventos Fired</span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" title="Listener activo"></span>
            </div>
            
            <p className="text-[11px] text-slate-400">
              Logs del simulador de Webhooks. Registre transacciones que lleven productos por debajo de su stock mínimo para ver eventos <strong className="text-rose-600">STOCK_CRITICAL</strong> dispararse en vivo.
            </p>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {webhookLogs.length === 0 ? (
                <div className="py-6 text-center text-slate-400 flex flex-col items-center justify-center space-y-2 border border-dashed border-slate-100 dark:border-slate-800 rounded-lg">
                  <WebhookIcon className="h-6 w-6 opacity-30" />
                  <span className="text-[10px]">No hay despachos registrados</span>
                </div>
              ) : (
                webhookLogs.map(log => {
                  return (
                    <div key={log.id} className="p-2 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 rounded-lg text-[10px] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">{log.event}</span>
                        <span className="font-mono text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 truncate font-mono text-[9px]">{log.url}</div>
                      
                      <details className="cursor-pointer group">
                        <summary className="text-[9px] text-slate-400 hover:text-slate-600 flex items-center select-none font-medium">
                          <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform mr-1" />
                          Ver Payload JSON Despachado
                        </summary>
                        <pre className="mt-1.5 p-2 bg-slate-950 text-slate-300 rounded font-mono text-[9px] overflow-x-auto leading-relaxed whitespace-pre">
                          {log.payload}
                        </pre>
                      </details>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
