/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Smartphone, Monitor, X, Share2, PlusSquare, CheckCircle2, FileCode2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onDownloadHtml?: () => void;
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onDownloadHtml,
  compact = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running as an installed standalone PWA, hide the install button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setInstallSuccess(true);
        return;
      }
    }
    setShowGuideModal(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        title="Instalar en Escritorio (PC) o Celular (Android / iOS)"
        className={
          compact
            ? 'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer'
            : 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm shadow-blue-600/20 transition-all cursor-pointer'
        }
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>{isInstallable ? 'Instalar App' : 'Instalar PC / Móvil'}</span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Instalar y Anclar IMMEX Control</h3>
                  <p className="text-[11px] text-slate-400">
                    Disponible como App Instalable (PWA) en PC, Android y iPhone
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700 dark:text-slate-300">
              {installSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>¡Aplicación instalada correctamente en tu dispositivo!</span>
                </div>
              )}

              {isInstallable && (
                <button
                  onClick={async () => {
                    const ok = await install();
                    if (ok) setInstallSuccess(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar Ahora con 1 Clic</span>
                </button>
              )}

              {/* Desktop PC Guide */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Monitor className="w-4 h-4 text-blue-500" />
                  <span>En PC (Windows / Mac — Chrome o Edge)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <li>Abre la app en una pestaña directa de Chrome o Microsoft Edge.</li>
                  <li>
                    Haz clic en el ícono de <strong>Instalar</strong> (monitor con flecha) en la barra de direcciones, o ve a <strong>Menú (⋮) → Guardar y compartir → Instalar IMMEX Control</strong>.
                  </li>
                  <li>Se creará un acceso directo anclado en tu <strong>Escritorio</strong> y barra de tareas como aplicación nativa.</li>
                </ol>
              </div>

              {/* Android Guide */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>En Celular Android (Chrome)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <li>Toca el menú de opciones <strong>(⋮)</strong> en la esquina superior derecha.</li>
                  <li>Selecciona <strong>Instalar aplicación</strong> o <strong>Agregar a la pantalla principal</strong>.</li>
                  <li>Confirma en <strong>Instalar</strong> para abrirla a pantalla completa sin barra de navegador.</li>
                </ol>
              </div>

              {/* iOS Safari Guide */}
              <div
                className={`p-3.5 rounded-xl border space-y-1.5 ${
                  isIOS
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Share2 className="w-4 h-4 text-indigo-500" />
                  <span>En iPhone / iPad (Safari)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <li>
                    Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
                  </li>
                  <li className="flex items-center gap-1 flex-wrap">
                    <span>Desliza hacia abajo y selecciona</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      <PlusSquare className="w-3 h-3" /> Agregar a inicio
                    </span>
                    <span>.</span>
                  </li>
                  <li>Toca <strong>Agregar</strong> en la esquina superior derecha.</li>
                </ol>
              </div>

              {onDownloadHtml && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">
                    ¿Prefieres llevar la app en un solo archivo offline?
                  </span>
                  <button
                    onClick={() => {
                      onDownloadHtml();
                      setShowGuideModal(false);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Descargar HTML Portable</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
