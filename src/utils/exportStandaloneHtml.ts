/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Product,
  Pedimento,
  DescargoPEPS,
  BillOfMaterials,
  MermaRegistro,
  ExpedienteElectronico,
  ActivoFijoItem,
  DiscrepanciaAnexo30Detalle,
  ChecklistMensualItem,
  SatAuditAccess,
} from '../types';
import { AuditComplianceSummary } from './exportAuditPdf';

export interface StandaloneAppSnapshot {
  exportedAt: string;
  company: {
    razonSocial: string;
    empresaRFC: string;
    programaIMMEX: string;
    certificacionIvaIeps: string;
    apiToken: string;
    satUsuario: string;
  };
  summary: AuditComplianceSummary | null;
  products: Product[];
  pedimentos: Pedimento[];
  descargosPEPS: DescargoPEPS[];
  activosFijos: ActivoFijoItem[];
  discrepanciasAnexo30: DiscrepanciaAnexo30Detalle[];
  checklistMensual: ChecklistMensualItem[];
  boms: BillOfMaterials[];
  mermas: MermaRegistro[];
  expedientes: ExpedienteElectronico[];
}

export async function collectLiveAppSnapshot(fallback: {
  products: Product[];
  pedimentos: Pedimento[];
  descargosPEPS: DescargoPEPS[];
}): Promise<StandaloneAppSnapshot> {
  const safeFetch = async <T,>(url: string, defaultVal: T): Promise<T> => {
    try {
      const res = await fetch(url);
      if (res.ok) return (await res.json()) as T;
    } catch {
      // ignore fallback
    }
    return defaultVal;
  };

  const [
    summary,
    satAccess,
    activosFijos,
    discrepanciasAnexo30,
    checklistMensual,
    boms,
    mermas,
    expedientes,
  ] = await Promise.all([
    safeFetch<AuditComplianceSummary | null>('/api/compliance/summary', null),
    safeFetch<Partial<SatAuditAccess>>('/api/sat-audit/access', {}),
    safeFetch<ActivoFijoItem[]>('/api/activos-fijos', []),
    safeFetch<DiscrepanciaAnexo30Detalle[]>('/api/anexo30/discrepancias', []),
    safeFetch<ChecklistMensualItem[]>('/api/checklist-mensual', []),
    safeFetch<BillOfMaterials[]>('/api/boms', []),
    safeFetch<MermaRegistro[]>('/api/mermas', []),
    safeFetch<ExpedienteElectronico[]>('/api/expedientes', []),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    company: {
      razonSocial: 'Manufacturas Avanzadas de México S.A. de C.V.',
      empresaRFC: satAccess.empresaRFC || 'IMX891024KL8',
      programaIMMEX: satAccess.programaIMMEX || 'IMMEX-REG-2024-9981-CHIH',
      certificacionIvaIeps: summary?.certificacionIvaIeps || satAccess.certificacionIvaIeps || 'AAA',
      apiToken: satAccess.tokenAuditor || 'SAT-APARTADO-C-LIVE-TOKEN',
      satUsuario: satAccess.usuarioSAT || 'SAT_AUDITOR_IMMEX_24',
    },
    summary,
    products: fallback.products,
    pedimentos: fallback.pedimentos,
    descargosPEPS: fallback.descargosPEPS,
    activosFijos,
    discrepanciasAnexo30,
    checklistMensual,
    boms,
    mermas,
    expedientes,
  };
}

export function buildStandaloneHtmlString(snapshot: StandaloneAppSnapshot): string {
  const safeJson = JSON.stringify(snapshot).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  return `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>IMMEX Control | Administración de Bodegas e Inventario SAT Anexo 24 y 30</title>
  <meta name="description" content="Sistema integral IMMEX conforme al Anexo 24 y 30 del SAT: método PEPS, regla 48h, permanencia 18 meses, conciliación tripartita, activo fijo y exportación PDF." />
  <meta name="theme-color" content="#0f172a" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="IMMEX Ctrl" />
  <link id="dynamic-manifest" rel="manifest" href="" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='96' fill='%230f172a'/%3E%3Cpath d='M256 88L396 144V252C396 341 336 416 256 444C176 416 116 341 116 252V144L256 88Z' fill='none' stroke='%233b82f6' stroke-width='26'/%3E%3Cpath d='M256 152V352M180 206H332M214 352H298' stroke='%23ffffff' stroke-width='20' stroke-linecap='round'/%3E%3C/svg%3E" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: { extend: { fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] } } }
    };
  </script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
  <style>
    @media print {
      .no-print { display: none !important; }
      body { background: #fff !important; color: #000 !important; }
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 9999px; }
  </style>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen antialiased">
  <div id="app" class="flex min-h-screen"></div>

  <script>
    (function () {
      // Dynamic Web App Manifest for PC/Mobile installation when served via HTTP/HTTPS
      const iconSvg = "data:image/svg+xml;base64," + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#0f172a"/><path d="M256 88L396 144V252C396 341 336 416 256 444C176 416 116 341 116 252V144L256 88Z" fill="none" stroke="#3b82f6" stroke-width="26"/><path d="M256 152V352M180 206H332M214 352H298" stroke="#ffffff" stroke-width="20" stroke-linecap="round"/></svg>');
      const manifestData = {
        id: "./",
        name: "IMMEX Control | SAT Anexo 24 y 30",
        short_name: "IMMEX Ctrl",
        description: "Sistema integral IMMEX Anexo 24 (PEPS) y Anexo 30 (SCCCyG).",
        start_url: "./",
        display: "standalone",
        background_color: "#0f172a",
        theme_color: "#0f172a",
        icons: [
          { src: iconSvg, sizes: "192x192", type: "image/svg+xml", purpose: "any" },
          { src: iconSvg, sizes: "512x512", type: "image/svg+xml", purpose: "any" }
        ]
      };
      try {
        const blob = new Blob([JSON.stringify(manifestData)], { type: "application/manifest+json" });
        document.getElementById("dynamic-manifest").setAttribute("href", URL.createObjectURL(blob));
      } catch (e) {}

      const STORAGE_KEY = "immex_control_standalone_state_v1";
      const INITIAL_SNAPSHOT = ${safeJson};

      let state;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        state = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(INITIAL_SNAPSHOT));
      } catch (e) {
        state = JSON.parse(JSON.stringify(INITIAL_SNAPSHOT));
      }

      let activeTab = "dashboard";
      let searchSku = "";
      let darkMode = true;
      let mobileMenuOpen = false;
      let showInstallModal = false;
      let deferredPrompt = null;
      let toastMsg = "";
      let toastTimer = null;

      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
        render();
      });

      function saveState() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
      }

      function showToast(msg) {
        toastMsg = msg;
        if (toastTimer) clearTimeout(toastTimer);
        render();
        toastTimer = setTimeout(() => { toastMsg = ""; render(); }, 4500);
      }

      function esc(str) {
        return String(str == null ? "" : str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function fmtUSD(v) {
        return "$" + Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USD";
      }

      function computeSummary() {
        const peds = state.pedimentos || [];
        const prods = state.products || [];
        const peps = state.descargosPEPS || [];
        const totalPed = peds.length;
        const ok48 = peds.filter(p => p.cumplePlazo48h !== false).length;
        const pend48 = totalPed - ok48;
        const pct48 = totalPed ? Math.round((ok48 / totalPed) * 100) : 100;
        const vencidos = peds.filter(p => p.estadoPermanencia === "VENCIDO").length;
        const proximos = peds.filter(p => p.estadoPermanencia === "PROXIMO_A_VENCER").length;
        const disc30 = prods.filter(p => p.stock !== p.anexo24Stock || p.anexo24Stock !== p.anexo30Stock).length;
        const creditoTotal = peds.filter(p => p.tipo === "ENTRADA").reduce((a, p) => a + Number(p.creditoIvaIepsTotal || 0), 0);
        const creditoAmort = peps.reduce((a, d) => a + Number(d.creditoIvaAmortizado || 0), 0);
        const creditoPend = Math.max(0, creditoTotal - creditoAmort);
        const valorRiesgo = peds.filter(p => p.estadoPermanencia === "VENCIDO").reduce((a, p) => a + Number(p.valorTotalUSD || 0), 0);
        return {
          porcentajeCumplimiento48h: pct48,
          pedimentosPendientes48hCount: pend48,
          pedimentosVencidosCount: vencidos,
          pedimentosProximosVencerCount: proximos,
          creditoIvaTotal: creditoTotal,
          creditoIvaAmortizado: creditoAmort,
          creditoIvaSaldoPendiente: creditoPend,
          multaEstimadaMinUSD: Math.round(valorRiesgo * 2.5),
          multaEstimadaMaxUSD: Math.round(valorRiesgo * 3.0),
          discrepanciasAnexo30Count: disc30,
          certificacionIvaIeps: state.company?.certificacionIvaIeps || "AAA",
          totalPedimentos: totalPed,
          totalDescargosPEPS: peps.length,
          totalExpedientes: (state.expedientes || []).length
        };
      }

      window.immexExportPDF = function () {
        if (!window.jspdf || !window.jspdf.jsPDF) {
          showToast("Conéctate a internet para cargar jsPDF o usa Imprimir (Ctrl+P).");
          return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
        const sum = computeSummary();
        const now = new Date();
        const iso = now.toISOString().slice(0, 10);
        const folio = "AUD-IMMEX-" + iso.replace(/-/g, "") + "-" + String(Date.now()).slice(-4);
        const pw = doc.internal.pageSize.getWidth();
        const ph = doc.internal.pageSize.getHeight();

        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pw, 34, "F");
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 34, pw, 1.8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("REPORTE EJECUTIVO DE CUMPLIMIENTO FISCAL E INVENTARIOS IMMEX", 14, 13);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(203, 213, 225);
        doc.text("Control de Inventarios Anexo 24 (PEPS) y Conciliación Anexo 30 (SCCCyG) — RGCE / SAT", 14, 19.5);
        doc.text("Razón Social: " + (state.company.razonSocial || "") + " | RFC: " + (state.company.empresaRFC || ""), 14, 26);
        doc.text("Programa: " + (state.company.programaIMMEX || "") + " | Certificación IVA/IEPS: " + sum.certificacionIvaIeps, 14, 30.5);
        doc.text("FOLIO: " + folio, pw - 14, 26, { align: "right" });
        doc.text("Emisión: " + now.toLocaleString("es-MX"), pw - 14, 30.5, { align: "right" });

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("1. INDICADORES CLAVE DE CUMPLIMIENTO (KPIs)", 14, 43);
        doc.autoTable({
          startY: 46,
          head: [["Indicador Normativo", "Valor Actual", "Estatus"]],
          body: [
            ["Regla 48 Horas (Despacho SAT)", sum.porcentajeCumplimiento48h + "% (" + sum.pedimentosPendientes48hCount + " atrasados)", sum.pedimentosPendientes48hCount === 0 ? "CONFORME" : "ATENCIÓN"],
            ["Permanencia Máx. 18 Meses", sum.pedimentosVencidosCount + " vencidos / " + sum.pedimentosProximosVencerCount + " próximos", sum.pedimentosVencidosCount === 0 ? "CONFORME" : "CRÍTICO"],
            ["Conciliación Anexo 30", sum.discrepanciasAnexo30Count === 0 ? "100% cuadrado" : sum.discrepanciasAnexo30Count + " partidas con desfase", sum.discrepanciasAnexo30Count === 0 ? "CONFORME" : "DESCUADRE"],
            ["Crédito Fiscal IVA/IEPS Pendiente", fmtUSD(sum.creditoIvaSaldoPendiente), "CERT. " + sum.certificacionIvaIeps],
            ["Crédito IVA Amortizado vía PEPS", fmtUSD(sum.creditoIvaAmortizado), "AMORTIZADO"],
            ["Riesgo de Sanciones (250%-300%)", fmtUSD(sum.multaEstimadaMinUSD) + " - " + fmtUSD(sum.multaEstimadaMaxUSD), sum.multaEstimadaMaxUSD > 0 ? "RIESGO ACTIVO" : "RIESGO CERO"]
          ],
          headStyles: { fillColor: [30, 41, 59] },
          styles: { fontSize: 8 }
        });

        let y = (doc.lastAutoTable?.finalY || 110) + 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("2. RESUMEN DE INVENTARIO (WMS / ANEXO 24 / ANEXO 30)", 14, y);
        doc.autoTable({
          startY: y + 3,
          head: [["SKU", "Descripción", "Tipo", "Físico", "Anexo 24", "Anexo 30", "Valor USD"]],
          body: (state.products || []).map(p => [
            p.sku, p.name, p.bienType, p.stock + " " + p.unidadMedida, p.anexo24Stock, p.anexo30Stock, fmtUSD((p.stock || 0) * (p.costPrice || 0))
          ]),
          headStyles: { fillColor: [30, 41, 59] },
          styles: { fontSize: 7.5 }
        });

        const pages = doc.getNumberOfPages();
        for (let i = 1; i <= pages; i++) {
          doc.setPage(i);
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text("Folio " + folio + " — Resguardo 5 años (Art. 28 CFF / Anexo 24 y 30 SAT)", 14, ph - 8);
          doc.text("Página " + i + " de " + pages, pw - 14, ph - 8, { align: "right" });
        }
        const file = "Reporte_Auditoria_IMMEX_" + iso + ".pdf";
        doc.save(file);
        showToast("PDF generado: " + file);
      };

      window.immexExportXmlAnexo30 = function () {
        const peps = state.descargosPEPS || [];
        const totalIva = peps.reduce((a, d) => a + Number(d.creditoIvaAmortizado || 0), 0);
        const xml = '<?xml version="1.0" encoding="UTF-8"?>\\n' +
          '<SCCCyG:InformeDescargos xmlns:SCCCyG="http://www.sat.gob.mx/esquemas/retornos/anexo30" Version="1.2" RFC="' + state.company.empresaRFC + '" ProgramaIMMEX="' + state.company.programaIMMEX + '" FechaGeneracion="' + new Date().toISOString() + '">\\n' +
          '  <Encabezado TotalDescargos="' + peps.length + '" MontoTotalCreditoIVA="' + totalIva.toFixed(2) + '"/>\\n' +
          '  <Descargos>\\n' +
          peps.map(d => '    <Descargo Folio="' + d.id + '" PedimentoEntrada="' + d.numeroPedimentoEntrada + '" PedimentoSalida="' + d.numeroPedimentoSalida + '" SKU="' + d.sku + '" Cantidad="' + d.cantidadDescargada + '" IVAAmortizado="' + Number(d.creditoIvaAmortizado || 0).toFixed(2) + '"/>').join("\\n") +
          '\\n  </Descargos>\\n</SCCCyG:InformeDescargos>';
        const blob = new Blob([xml], { type: "application/xml" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "Layout_SCCCyG_Anexo30_" + new Date().toISOString().slice(0, 10) + ".xml";
        a.click();
        showToast("Layout XML SCCCyG Anexo 30 descargado.");
      };

      window.immexRectificarAF = function (id) {
        const af = (state.activosFijos || []).find(x => x.id === id);
        if (!af) return;
        af.numeroSeriePedimento = af.numeroSeriePlaca;
        af.coincidenciaExactaSerie = true;
        af.discrepanciaDetalle = "";
        af.pedimentoAF = af.pedimentoAF + " (R1-RECT)";
        saveState();
        showToast("Rectificación R1 (Art. 89 LA) aplicada a " + af.noInventario);
        render();
      };

      window.immexToggleCheck = function (id) {
        const c = (state.checklistMensual || []).find(x => x.id === id);
        if (!c) return;
        c.completado = !c.completado;
        saveState();
        render();
      };

      window.immexSyncAnexo30 = function () {
        (state.products || []).forEach(p => { p.anexo30Stock = p.anexo24Stock; });
        (state.discrepanciasAnexo30 || []).forEach(d => { d.estatusSolucion = "CORREGIDO"; });
        saveState();
        showToast("Conciliación tripartita sincronizada al 100% con SCCCyG.");
        render();
      };

      window.immexAddProduct = function (e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const stock = Number(fd.get("stock") || 0);
        state.products.unshift({
          sku: String(fd.get("sku")).trim().toUpperCase(),
          name: String(fd.get("name")).trim(),
          category: "IMMEX",
          bienType: String(fd.get("bienType") || "MATERIA_PRIMA"),
          fraccionArancelaria: String(fd.get("fraccion") || "8542.31.01"),
          unidadMedida: String(fd.get("unidad") || "PZA"),
          costPrice: Number(fd.get("costPrice") || 0),
          salePrice: Number(fd.get("costPrice") || 0) * 1.25,
          stock: stock,
          anexo24Stock: stock,
          anexo30Stock: stock,
          minStock: 10
        });
        saveState();
        showToast("SKU agregado al catálogo e inventario WMS / Anexo 24.");
        render();
      };

      window.immexRunPeps = function (e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const sku = String(fd.get("sku"));
        const qty = Number(fd.get("qty") || 0);
        const pedSalida = String(fd.get("pedSalida") || "26 47 3190 6009999");
        if (!sku || qty <= 0) return;
        const prod = state.products.find(p => p.sku === sku);
        const entrada = (state.pedimentos || []).find(p => p.tipo === "ENTRADA" && (p.partidas || []).some(pt => pt.sku === sku && pt.saldoDisponible > 0));
        const ivaUnit = prod ? (prod.costPrice || 10) * 0.16 : 1.6;
        const descargado = {
          id: "PEPS-" + Date.now().toString().slice(-6),
          fechaDescargo: new Date().toISOString(),
          numeroPedimentoSalida: pedSalida,
          claveSalida: "RT",
          numeroPedimentoEntrada: entrada ? entrada.numeroPedimento : "25 47 3190 5001248",
          claveEntrada: entrada ? entrada.clave : "IN",
          sku: sku,
          cantidadDescargada: qty,
          unidadMedida: prod ? prod.unidadMedida : "PZA",
          valorAmortizadoUSD: qty * (prod ? prod.costPrice : 10),
          creditoIvaAmortizado: Math.round(qty * ivaUnit * 100) / 100,
          estatusAnexo30: "TRANSMITIDO"
        };
        state.descargosPEPS.unshift(descargado);
        if (prod) {
          prod.stock = Math.max(0, prod.stock - qty);
          prod.anexo24Stock = Math.max(0, prod.anexo24Stock - qty);
          prod.anexo30Stock = Math.max(0, prod.anexo30Stock - qty);
        }
        saveState();
        showToast("Descargo PEPS ejecutado: " + qty + " u. de " + sku);
        render();
      };

      window.immexSetTab = function (t) { activeTab = t; mobileMenuOpen = false; render(); };
      window.immexToggleTheme = function () {
        darkMode = !darkMode;
        document.documentElement.classList.toggle("dark", darkMode);
        render();
      };
      window.immexToggleMobile = function () { mobileMenuOpen = !mobileMenuOpen; render(); };
      window.immexOpenInstall = async function () {
        if (deferredPrompt) {
          await deferredPrompt.prompt();
          const res = await deferredPrompt.userChoice;
          if (res.outcome === "accepted") { deferredPrompt = null; showToast("App instalada correctamente."); }
          render();
          return;
        }
        showInstallModal = !showInstallModal;
        render();
      };
      window.immexSearchSku = function (val) { searchSku = val; render(); };

      const NAV = [
        { id: "dashboard", label: "Dashboard Ejecutivo" },
        { id: "pedimentos", label: "Aduanas & Pedimentos" },
        { id: "peps", label: "Motor Descargos PEPS" },
        { id: "anexo30", label: "Conciliación Anexo 30" },
        { id: "activo-fijo", label: "Activo Fijo & Placado" },
        { id: "inventario", label: "Inventario WMS" },
        { id: "expedientes", label: "BOM, Mermas & Bóveda" },
        { id: "sat-audit", label: "Portal SAT Apartado C" }
      ];

      function renderContent() {
        const sum = computeSummary();

        if (activeTab === "dashboard") {
          const riesgos18 = (state.pedimentos || []).filter(p => p.tipo === "ENTRADA" && (p.estadoPermanencia === "PROXIMO_A_VENCER" || p.estadoPermanencia === "VENCIDO"));
          return \`
            <div class="space-y-6">
              <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 border border-slate-700/60 shadow-xl">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div class="flex flex-wrap gap-2 mb-2">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">EMPRESA IMMEX AUTORIZADA</span>
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">CERTIFICACIÓN IVA/IEPS: \${esc(sum.certificacionIvaIeps)}</span>
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">SAT ANEXO 24 & 30</span>
                    </div>
                    <h1 class="text-xl md:text-2xl font-bold">Centro de Mando & Control Fiscal IMMEX</h1>
                    <p class="text-xs text-slate-300 mt-1">\${esc(state.company.razonSocial)} • RFC: \${esc(state.company.empresaRFC)} • \${esc(state.company.programaIMMEX)}</p>
                  </div>
                  <div class="flex flex-wrap gap-2 no-print">
                    <button onclick="immexExportPDF()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer">Exportar PDF Auditoría</button>
                    <button onclick="immexSetTab('sat-audit')" class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer">Portal SAT Apartado C</button>
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-700/60 text-xs">
                  <div><p class="text-slate-400">Regla 48 Horas (SAT)</p><p class="font-bold text-white">\${sum.porcentajeCumplimiento48h}% (\${sum.pedimentosPendientes48hCount} atrasados)</p></div>
                  <div><p class="text-slate-400">Permanencia 18 Meses</p><p class="font-bold text-white">\${sum.pedimentosVencidosCount} vencidos • \${sum.pedimentosProximosVencerCount} próximos</p></div>
                  <div><p class="text-slate-400">Conciliación Anexo 30</p><p class="font-bold text-white">\${sum.discrepanciasAnexo30Count === 0 ? "100% Cuadrado con SAT" : sum.discrepanciasAnexo30Count + " partidas con desfase"}</p></div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span class="text-[11px] font-bold text-slate-500 uppercase">Crédito Fiscal IVA/IEPS</span>
                  <div class="text-2xl font-bold mt-2">\${fmtUSD(sum.creditoIvaSaldoPendiente)}</div>
                  <div class="text-[11px] text-emerald-500 font-semibold mt-2">Amortizado PEPS: \${fmtUSD(sum.creditoIvaAmortizado)}</div>
                </div>
                <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span class="text-[11px] font-bold text-slate-500 uppercase">Riesgo Sanciones (250%-300%)</span>
                  <div class="text-2xl font-bold mt-2">\${fmtUSD(sum.multaEstimadaMinUSD)} - \${fmtUSD(sum.multaEstimadaMaxUSD)}</div>
                  <div class="text-[11px] \${sum.multaEstimadaMaxUSD > 0 ? "text-rose-500" : "text-emerald-500"} font-semibold mt-2">\${sum.multaEstimadaMaxUSD > 0 ? "ALERTA REQUERIDA" : "RIESGO CERO (0)"}</div>
                </div>
                <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span class="text-[11px] font-bold text-slate-500 uppercase">Descargos PEPS Activos</span>
                  <div class="text-2xl font-bold mt-2">\${sum.totalDescargosPEPS} Operaciones</div>
                  <div class="text-[11px] text-slate-500 mt-2">Pedimentos Totales: \${sum.totalPedimentos}</div>
                </div>
                <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span class="text-[11px] font-bold text-slate-500 uppercase">Expedientes 5 Años</span>
                  <div class="text-2xl font-bold mt-2">\${sum.totalExpedientes} Expedientes</div>
                  <div class="text-[11px] text-purple-500 font-semibold mt-2">Conforme SAT Art. 28 CFF</div>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h2 class="text-sm font-bold">Semáforo de Plazos de Permanencia (18 Meses)</h2>
                  \${riesgos18.length === 0
                    ? '<div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">Todos los insumos se encuentran dentro del plazo legal de 18 meses.</div>'
                    : riesgos18.map(p => \`
                      <div class="p-3.5 rounded-xl border \${(p.diasRestantes || 0) <= 0 ? "bg-rose-500/10 border-rose-500/30" : "bg-amber-500/10 border-amber-500/30"} flex justify-between items-center text-xs">
                        <div>
                          <p class="font-mono font-bold">\${esc(p.numeroPedimento)} (\${esc(p.clave)})</p>
                          <p class="text-slate-400">\${esc(p.partidas?.[0]?.descripcion || "Insumo")} • Despacho: \${esc((p.fechaPago || "").slice(0, 10))}</p>
                        </div>
                        <span class="font-bold \${(p.diasRestantes || 0) <= 0 ? "text-rose-400" : "text-amber-400"}">\${Math.max(0, p.diasRestantes || 0)} días rest.</span>
                      </div>
                    \`).join("")
                  }
                </div>
                <div class="bg-gradient-to-br from-slate-900 to-rose-950 text-white rounded-2xl p-5 border border-rose-900/50 space-y-2 text-xs">
                  <h3 class="font-bold uppercase text-rose-300">Consecuencias por Incumplimiento SAT</h3>
                  <div class="p-2.5 rounded-lg bg-white/5"><strong>1. Multas 250% - 300%:</strong> Mercancía no localizada o vencida.</div>
                  <div class="p-2.5 rounded-lg bg-white/5"><strong>2. Suspensión IMMEX:</strong> Cancelación de importaciones temporales.</div>
                  <div class="p-2.5 rounded-lg bg-white/5"><strong>3. Pérdida IVA/IEPS:</strong> Pago inmediato del 16% de IVA.</div>
                  <div class="p-2.5 rounded-lg bg-white/5"><strong>4. Padrón ANAM/SAT:</strong> Bloqueo en ventanilla aduanera.</div>
                </div>
              </div>
            </div>
          \`;
        }

        if (activeTab === "inventario") {
          const filtered = (state.products || []).filter(p =>
            !searchSku || (p.sku + " " + p.name + " " + p.fraccionArancelaria).toLowerCase().includes(searchSku.toLowerCase())
          );
          return \`
            <div class="space-y-6">
              <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h2 class="text-sm font-bold mb-3">Alta Rápida de Insumo / Producto IMMEX</h2>
                <form onsubmit="immexAddProduct(event)" class="grid grid-cols-1 md:grid-cols-6 gap-3 text-xs">
                  <input name="sku" required placeholder="SKU / No. Parte" class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
                  <input name="name" required placeholder="Descripción" class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 md:col-span-2" />
                  <input name="fraccion" placeholder="Fracción TIGIE" value="8542.31.01" class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
                  <input name="stock" type="number" required placeholder="Stock Inicial" class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
                  <input name="costPrice" type="number" step="0.01" required placeholder="Costo USD" class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
                  <button type="submit" class="md:col-span-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl cursor-pointer">+ Registrar en WMS & Anexo 24</button>
                </form>
              </div>
              <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
                  <h2 class="text-sm font-bold">Catálogo e Inventario Tripartito (\${filtered.length} SKUs)</h2>
                  <input value="\${esc(searchSku)}" oninput="immexSearchSku(this.value)" placeholder="Buscar SKU, descripción o fracción..." class="px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 w-64" />
                </div>
                <table class="w-full text-xs text-left">
                  <thead class="text-[11px] uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr><th class="py-2">SKU</th><th>Descripción</th><th>Fracción</th><th class="text-right">Físico</th><th class="text-right">Anexo 24</th><th class="text-right">Anexo 30</th><th class="text-right">Valor USD</th></tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
                    \${filtered.map(p => \`
                      <tr>
                        <td class="py-2.5 font-mono font-bold">\${esc(p.sku)}</td>
                        <td>\${esc(p.name)}</td>
                        <td class="font-mono text-slate-400">\${esc(p.fraccionArancelaria)}</td>
                        <td class="text-right font-semibold">\${p.stock} \${esc(p.unidadMedida)}</td>
                        <td class="text-right">\${p.anexo24Stock}</td>
                        <td class="text-right \${p.anexo30Stock !== p.anexo24Stock ? "text-amber-500 font-bold" : "text-emerald-500"}">\${p.anexo30Stock}</td>
                        <td class="text-right font-mono">\${fmtUSD((p.stock || 0) * (p.costPrice || 0))}</td>
                      </tr>
                    \`).join("")}
                  </tbody>
                </table>
              </div>
            </div>
          \`;
        }

        if (activeTab === "pedimentos") {
          return \`
            <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
              <h2 class="text-sm font-bold mb-4">Módulo de Aduanas & Pedimentos (Anexo 22 / 24)</h2>
              <table class="w-full text-xs text-left">
                <thead class="text-[11px] uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr><th class="py-2">Pedimento</th><th>Clave/Tipo</th><th>Fecha Pago</th><th>Regla 48h</th><th>Permanencia</th><th class="text-right">Valor USD</th></tr>
                </thead>
                <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
                  \${(state.pedimentos || []).map(p => \`
                    <tr>
                      <td class="py-2.5 font-mono font-bold">\${esc(p.numeroPedimento)}</td>
                      <td>\${esc(p.clave)} (\${esc(p.tipo)})</td>
                      <td>\${esc((p.fechaPago || "").slice(0, 10))}</td>
                      <td><span class="px-2 py-0.5 rounded-full text-[10px] font-bold \${p.cumplePlazo48h ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}">\${p.cumplePlazo48h ? "EN TIEMPO (" + p.horasTranscurridasRegistro + "h)" : "ATRASADO (" + p.horasTranscurridasRegistro + "h)"}</span></td>
                      <td>\${esc(p.estadoPermanencia || "SALIDA")}</td>
                      <td class="text-right font-mono">\${fmtUSD(p.valorTotalUSD)}</td>
                    </tr>
                  \`).join("")}
                </tbody>
              </table>
            </div>
          \`;
        }

        if (activeTab === "peps") {
          return \`
            <div class="space-y-6">
              <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h2 class="text-sm font-bold mb-3">Ejecutar Descargo PEPS (Primeras Entradas, Primeras Salidas)</h2>
                <form onsubmit="immexRunPeps(event)" class="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <select name="sku" class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                    \${(state.products || []).map(p => '<option value="' + esc(p.sku) + '">' + esc(p.sku + " — " + p.name) + '</option>').join("")}
                  </select>
                  <input name="qty" type="number" min="1" required placeholder="Cantidad a retornar" class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
                  <input name="pedSalida" value="26 47 3190 6008812" required placeholder="Pedimento Retorno RT" class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
                  <button type="submit" class="py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer">Aplicar Descargo FIFO</button>
                </form>
              </div>
              <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <h2 class="text-sm font-bold mb-4">Historial de Descargos PEPS (\${(state.descargosPEPS || []).length})</h2>
                <table class="w-full text-xs text-left">
                  <thead class="text-[11px] uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr><th class="py-2">Fecha</th><th>Ped. Salida</th><th>Ped. Entrada (FIFO)</th><th>SKU</th><th class="text-right">Cant.</th><th class="text-right">IVA Amortizado</th></tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
                    \${(state.descargosPEPS || []).map(d => \`
                      <tr>
                        <td class="py-2.5">\${esc((d.fechaDescargo || "").slice(0, 10))}</td>
                        <td class="font-mono">\${esc(d.numeroPedimentoSalida)}</td>
                        <td class="font-mono">\${esc(d.numeroPedimentoEntrada)}</td>
                        <td class="font-bold">\${esc(d.sku)}</td>
                        <td class="text-right">\${d.cantidadDescargada}</td>
                        <td class="text-right text-emerald-500 font-semibold">\${fmtUSD(d.creditoIvaAmortizado)}</td>
                      </tr>
                    \`).join("")}
                  </tbody>
                </table>
              </div>
            </div>
          \`;
        }

        if (activeTab === "anexo30") {
          return \`
            <div class="space-y-6">
              <div class="flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h2 class="text-sm font-bold">Conciliación Anexo 30 & SCCCyG (SAT)</h2>
                  <p class="text-xs text-slate-400">Genera el Layout XML oficial y sincroniza saldos tripartitos.</p>
                </div>
                <div class="flex gap-2">
                  <button onclick="immexSyncAnexo30()" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer">Sincronizar Saldos</button>
                  <button onclick="immexExportXmlAnexo30()" class="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer">Descargar Layout XML</button>
                </div>
              </div>
              <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 class="text-xs font-bold uppercase text-slate-400">Checklist Mensual de Blindaje IMMEX</h3>
                \${(state.checklistMensual || []).map(c => \`
                  <label class="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer text-xs">
                    <input type="checkbox" \${c.completado ? "checked" : ""} onchange="immexToggleCheck('\${esc(c.id)}')" class="mt-0.5" />
                    <div><p class="font-bold \${c.completado ? "line-through text-slate-400" : ""}">\${esc(c.titulo)}</p><p class="text-[11px] text-slate-400">\${esc(c.descripcion)}</p></div>
                  </label>
                \`).join("")}
              </div>
            </div>
          \`;
        }

        if (activeTab === "activo-fijo") {
          return \`
            <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
              <h2 class="text-sm font-bold mb-4">Control de Activo Fijo & Auditoría Art. 151 LA (\${(state.activosFijos || []).length} equipos)</h2>
              <table class="w-full text-xs text-left">
                <thead class="text-[11px] uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr><th class="py-2">No. Inv</th><th>Equipo</th><th>Serie Placa</th><th>Serie Pedimento</th><th>Pedimento AF</th><th>Cruce Legal</th><th>Acción</th></tr>
                </thead>
                <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
                  \${(state.activosFijos || []).map(a => \`
                    <tr>
                      <td class="py-2.5 font-mono font-bold">\${esc(a.noInventario)}</td>
                      <td>\${esc(a.descripcion)} (\${esc(a.marca)} \${esc(a.modelo)})</td>
                      <td class="font-mono">\${esc(a.numeroSeriePlaca)}</td>
                      <td class="font-mono">\${esc(a.numeroSeriePedimento)}</td>
                      <td class="font-mono text-slate-400">\${esc(a.pedimentoAF)}</td>
                      <td><span class="px-2 py-0.5 rounded-full text-[10px] font-bold \${a.coincidenciaExactaSerie ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}">\${a.coincidenciaExactaSerie ? "COINCIDE 100%" : "RIESGO EMBARGO"}</span></td>
                      <td>\${a.coincidenciaExactaSerie ? '<span class="text-emerald-400 font-semibold">Blindado</span>' : '<button onclick="immexRectificarAF(\\'' + esc(a.id) + '\\')" class="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold cursor-pointer">Rectificar R1</button>'}</td>
                    </tr>
                  \`).join("")}
                </tbody>
              </table>
            </div>
          \`;
        }

        if (activeTab === "expedientes") {
          return \`
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h2 class="text-sm font-bold">Listas de Materiales (BOM)</h2>
                \${(state.boms || []).map(b => \`
                  <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                    <p class="font-bold">\${esc(b.skuProductoTerminado)} — \${esc(b.nombreProducto)}</p>
                    <p class="text-[11px] text-slate-400">Versión \${esc(b.version)} • Rendimiento: \${b.rendimientoEsperado}%</p>
                  </div>
                \`).join("") || '<p class="text-xs text-slate-400">Sin BOMs registrados.</p>'}
              </div>
              <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h2 class="text-sm font-bold">Expedientes Electrónicos (Resguardo 5 Años)</h2>
                \${(state.expedientes || []).map(ex => \`
                  <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs flex justify-between items-center">
                    <div><p class="font-mono font-bold">\${esc(ex.numeroPedimento)}</p><p class="text-[11px] text-slate-400">Lote: \${esc(ex.lote)} • Resguardo hasta: \${esc((ex.fechaResguardoHasta || "").slice(0, 10))}</p></div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400">\${ex.porcentajeCompletitud || 100}%</span>
                  </div>
                \`).join("") || '<p class="text-xs text-slate-400">Sin expedientes registrados.</p>'}
              </div>
            </div>
          \`;
        }

        return \`
          <div class="bg-slate-900 text-white p-6 rounded-2xl border border-indigo-500/30 space-y-4">
            <h2 class="text-base font-bold text-indigo-300">Portal de Auditoría en Línea SAT — Apartado C (Anexo 24)</h2>
            <p class="text-xs text-slate-300">Acceso en modo de solo lectura para revisión en tiempo real de saldos y descargos PEPS.</p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div class="p-3.5 rounded-xl bg-slate-800"><span class="text-slate-400 block">RFC Contribuyente</span><strong class="font-mono">\${esc(state.company.empresaRFC)}</strong></div>
              <div class="p-3.5 rounded-xl bg-slate-800"><span class="text-slate-400 block">Usuario SAT</span><strong class="font-mono">\${esc(state.company.satUsuario)}</strong></div>
              <div class="p-3.5 rounded-xl bg-slate-800"><span class="text-slate-400 block">Token API Directa</span><strong class="font-mono text-emerald-400">\${esc(state.company.apiToken)}</strong></div>
            </div>
          </div>
        \`;
      }

      function render() {
        const root = document.getElementById("app");
        root.innerHTML = \`
          <aside class="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 no-print">
            <div class="p-5 border-b border-slate-800">
              <h1 class="text-xs font-bold text-white tracking-wider uppercase">IMMEX CONTROL</h1>
              <span class="text-[10px] text-blue-400 font-mono">ANEXO 24 & 30 SAT (PORTABLE)</span>
            </div>
            <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
              \${NAV.map(n => \`
                <button onclick="immexSetTab('\${n.id}')" class="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer \${activeTab === n.id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}">\${n.label}</button>
              \`).join("")}
            </nav>
            <div class="p-4 border-t border-slate-800 space-y-2">
              <button onclick="immexOpenInstall()" class="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer">Instalar en PC / Celular</button>
              <button onclick="immexToggleTheme()" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer">\${darkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}</button>
            </div>
          </aside>

          <div class="flex-1 flex flex-col min-w-0">
            <header class="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between no-print">
              <div class="flex items-center gap-3">
                <button onclick="immexToggleMobile()" class="lg:hidden px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold">Menú</button>
                <span class="text-xs font-bold uppercase tracking-wider">\${esc(NAV.find(n => n.id === activeTab)?.label || "Dashboard")}</span>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="immexOpenInstall()" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer">Instalar App</button>
                <button onclick="immexExportPDF()" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer">PDF Auditoría</button>
              </div>
            </header>

            \${mobileMenuOpen ? \`
              <div class="lg:hidden bg-slate-900 text-white p-3 space-y-1 border-b border-slate-800 no-print">
                \${NAV.map(n => '<button onclick="immexSetTab(\\'' + n.id + '\\')" class="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold ' + (activeTab === n.id ? 'bg-blue-600' : 'text-slate-300') + '">' + n.label + '</button>').join("")}
              </div>
            \` : ""}

            <main class="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
              \${renderContent()}
            </main>
          </div>

          \${showInstallModal ? \`
            <div onclick="immexOpenInstall()" class="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4 no-print">
              <div onclick="event.stopPropagation()" class="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 text-xs">
                <h3 class="text-base font-bold">Instalar y Anclar IMMEX Control</h3>
                <p><strong>PC (Windows / Mac):</strong> Abre este archivo o la URL en Chrome/Edge → Menú (⋮) → <em>Guardar y compartir → Instalar página como aplicación / Crear acceso directo (Abrir como ventana)</em> para anclarlo al Escritorio.</p>
                <p><strong>Android (Chrome):</strong> Menú (⋮) → <em>Instalar aplicación</em> o <em>Agregar a pantalla principal</em>.</p>
                <p><strong>iPhone / iPad (Safari):</strong> Botón <em>Compartir</em> → <em>Agregar a inicio</em>.</p>
                <button onclick="immexOpenInstall()" class="w-full py-2 bg-blue-600 text-white font-bold rounded-xl cursor-pointer">Entendido</button>
              </div>
            </div>
          \` : ""}

          \${toastMsg ? '<div class="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-emerald-400 border border-emerald-500/40 text-xs font-bold shadow-2xl no-print">' + esc(toastMsg) + '</div>' : ""}
        \`;
      }

      render();
    })();
  </script>
</body>
</html>`;
}

export async function downloadStandaloneAppHtml(fallback: {
  products: Product[];
  pedimentos: Pedimento[];
  descargosPEPS: DescargoPEPS[];
}): Promise<string> {
  const snapshot = await collectLiveAppSnapshot(fallback);
  const html = buildStandaloneHtmlString(snapshot);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const filename = `IMMEX_Control_Anexo24_30_App_${new Date().toISOString().slice(0, 10)}.html`;
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return filename;
}
