/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, Pedimento, DescargoPEPS } from '../types';

export interface AuditComplianceSummary {
  porcentajeCumplimiento48h: number;
  pedimentosPendientes48hCount: number;
  pedimentosVencidosCount: number;
  pedimentosProximosVencerCount: number;
  creditoIvaTotal: number;
  creditoIvaAmortizado: number;
  creditoIvaSaldoPendiente: number;
  multaEstimadaMinUSD: number;
  multaEstimadaMaxUSD: number;
  valorFaltantesMXN: number;
  discrepanciasAnexo30Count: number;
  certificacionIvaIeps: string;
  totalPedimentos: number;
  totalDescargosPEPS: number;
  totalBOMs: number;
  totalExpedientes: number;
}

export interface AuditCompanyInfo {
  empresaRFC?: string;
  razonSocial?: string;
  programaIMMEX?: string;
}

interface ExportAuditPdfParams {
  summary: AuditComplianceSummary | null;
  products: Product[];
  pedimentos: Pedimento[];
  descargosPEPS: DescargoPEPS[];
  companyInfo?: AuditCompanyInfo | null;
}

const BIEN_TYPE_LABELS: Record<string, string> = {
  MATERIA_PRIMA: 'Materia Prima',
  COMPONENTE: 'Componente',
  PRODUCTO_TERMINADO: 'Prod. Terminado',
  ACTIVO_FIJO: 'Activo Fijo',
  CONTENEDOR_TRAILER: 'Contenedor',
  MRO_INSUMO: 'MRO Insumo',
};

function formatCurrencyUSD(amount: number): string {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USD`;
}

function getLastTableY(doc: jsPDF, fallback: number): number {
  const lastTable = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable;
  return lastTable?.finalY ?? fallback;
}

export function exportExecutiveAuditPDF({
  summary,
  products,
  pedimentos,
  descargosPEPS,
  companyInfo,
}: ExportAuditPdfParams): string {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timeStr = now.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const isoDateSlug = now.toISOString().slice(0, 10);
  const folio = `AUD-IMMEX-${isoDateSlug.replace(/-/g, '')}-${now.getTime().toString().slice(-4)}`;

  const rfc = companyInfo?.empresaRFC || 'IMX891024KL8';
  const razonSocial = companyInfo?.razonSocial || 'Manufacturas Avanzadas de México S.A. de C.V.';
  const programaImmex = companyInfo?.programaIMMEX || 'IMMEX-REG-2024-9981-CHIH';
  const certIva = summary?.certificacionIvaIeps || 'AAA';

  // --- ENCABEZADO CORPORATIVO ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 34, 'F');

  doc.setFillColor(79, 70, 229); // indigo-600 accent bar
  doc.rect(0, 34, pageWidth, 1.8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.text('REPORTE EJECUTIVO DE CUMPLIMIENTO FISCAL E INVENTARIOS IMMEX', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(
    'Control de Inventarios Anexo 24 (Método PEPS) y Conciliación de Créditos Anexo 30 (SCCCyG) — RGCE / SAT',
    margin,
    19.5
  );

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Razón Social: ${razonSocial}  |  RFC: ${rfc}`, margin, 26);
  doc.text(
    `Programa: ${programaImmex}  |  Certificación IVA/IEPS: ${certIva}`,
    margin,
    30.5
  );

  // Folio & timestamp box on top right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(165, 180, 252);
  doc.text(`FOLIO: ${folio}`, pageWidth - margin, 26, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Emisión: ${dateStr} ${timeStr}`, pageWidth - margin, 30.5, { align: 'right' });

  let cursorY = 43;

  // --- SECCIÓN 1: KPIs ACTUALES Y SEMÁFORO DE CUMPLIMIENTO ---
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('1. INDICADORES CLAVE DE CUMPLIMIENTO (KPIs) Y ESTADO FISCAL', margin, cursorY);
  cursorY += 3;

  const cumplimiento48h = summary?.porcentajeCumplimiento48h ?? 100;
  const pendientes48h = summary?.pedimentosPendientes48hCount ?? 0;
  const vencidos18m = summary?.pedimentosVencidosCount ?? 0;
  const proximos18m = summary?.pedimentosProximosVencerCount ?? 0;
  const discrepancias30 = summary?.discrepanciasAnexo30Count ?? 0;
  const creditoTotal = summary?.creditoIvaTotal ?? 0;
  const creditoAmortizado = summary?.creditoIvaAmortizado ?? 0;
  const creditoPendiente = summary?.creditoIvaSaldoPendiente ?? 0;
  const multaMin = summary?.multaEstimadaMinUSD ?? 0;
  const multaMax = summary?.multaEstimadaMaxUSD ?? 0;

  const kpiRows = [
    [
      'Regla 48 Horas (Despacho SAT)',
      `${cumplimiento48h}% en cumplimiento (${pendientes48h} atrasados)`,
      pendientes48h === 0 ? 'CONFORME' : 'ATENCIÓN',
    ],
    [
      'Permanencia Máx. 18 Meses (Insumos)',
      `${vencidos18m} vencidos / ${proximos18m} próximos a vencer`,
      vencidos18m === 0 ? (proximos18m === 0 ? 'CONFORME' : 'PREVENTIVO') : 'CRÍTICO',
    ],
    [
      'Conciliación Tripartita Anexo 30',
      discrepancias30 === 0
        ? '100% cuadrado (Físico = Anexo 24 = SCCCyG)'
        : `${discrepancias30} partidas con desfase reportado`,
      discrepancias30 === 0 ? 'CONFORME' : 'DESCUADRE',
    ],
    [
      'Crédito Fiscal IVA/IEPS Total Otorgado',
      formatCurrencyUSD(creditoTotal),
      `CERT. ${certIva}`,
    ],
    [
      'Crédito Fiscal Amortizado vía PEPS',
      formatCurrencyUSD(creditoAmortizado),
      'AMORTIZADO',
    ],
    [
      'Saldo Pendiente de Crédito Fiscal IVA/IEPS',
      formatCurrencyUSD(creditoPendiente),
      'VIGENTE',
    ],
    [
      'Riesgo Estimado de Sanciones SAT (250%-300%)',
      `${formatCurrencyUSD(multaMin)} - ${formatCurrencyUSD(multaMax)}`,
      multaMax > 0 ? 'RIESGO ACTIVO' : 'RIESGO CERO',
    ],
    [
      'Operaciones PEPS / Pedimentos / Expedientes 5 Años',
      `${summary?.totalDescargosPEPS ?? descargosPEPS.length} descargos PEPS  |  ${summary?.totalPedimentos ?? pedimentos.length} pedimentos  |  ${summary?.totalExpedientes ?? 0} expedientes`,
      'ART. 28 CFF',
    ],
  ];

  autoTable(doc, {
    startY: cursorY,
    head: [['Indicador Normativo / Fiscal', 'Valor Actual Reportado', 'Estatus']],
    body: kpiRows,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.4,
    },
    columnStyles: {
      0: { cellWidth: 68, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        const text = String(data.cell.raw || '');
        if (text === 'CRÍTICO' || text === 'RIESGO ACTIVO' || text === 'ATENCIÓN') {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fillColor = [254, 242, 242];
        } else if (text === 'DESCUADRE' || text === 'PREVENTIVO') {
          data.cell.styles.textColor = [180, 83, 9];
          data.cell.styles.fillColor = [255, 251, 235];
        } else {
          data.cell.styles.textColor = [4, 120, 87];
          data.cell.styles.fillColor = [236, 253, 245];
        }
      }
    },
  });

  cursorY = getLastTableY(doc, cursorY + 60) + 9;

  // --- SECCIÓN 2: RESUMEN DE INVENTARIO (CONCILIACIÓN TRIPARTITA) ---
  const totalUnidadesFisicas = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalUnidadesA24 = products.reduce((acc, p) => acc + (p.anexo24Stock || 0), 0);
  const totalUnidadesA30 = products.reduce((acc, p) => acc + (p.anexo30Stock || 0), 0);
  const valorInventarioUSD = products.reduce(
    (acc, p) => acc + (p.stock || 0) * (p.costPrice || 0),
    0
  );
  const skusConDiferencia = products.filter(
    (p) => p.stock !== p.anexo24Stock || p.anexo24Stock !== p.anexo30Stock
  ).length;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('2. RESUMEN DE INVENTARIO Y CONCILIACIÓN TRIPARTITA (WMS / ANEXO 24 / ANEXO 30)', margin, cursorY);
  cursorY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Total SKUs: ${products.length}   |   Existencia Física: ${totalUnidadesFisicas.toLocaleString('es-MX')} u.   |   Valor Total Almacén: ${formatCurrencyUSD(valorInventarioUSD)}   |   Partidas con Desfase: ${skusConDiferencia}`,
    margin,
    cursorY
  );
  cursorY += 3;

  const inventoryRows = products.map((p) => {
    const diff = p.stock - p.anexo30Stock;
    const isCuadrado = p.stock === p.anexo24Stock && p.anexo24Stock === p.anexo30Stock;
    const totalVal = (p.stock || 0) * (p.costPrice || 0);
    return [
      p.sku,
      `${p.name}\nFracción: ${p.fraccionArancelaria || 'N/A'}`,
      BIEN_TYPE_LABELS[p.bienType] || p.bienType,
      `${p.stock.toLocaleString('es-MX')} ${p.unidadMedida}`,
      p.anexo24Stock.toLocaleString('es-MX'),
      p.anexo30Stock.toLocaleString('es-MX'),
      isCuadrado ? 'CUADRADO' : `DESFASE (${diff > 0 ? '+' : ''}${diff})`,
      formatCurrencyUSD(totalVal),
    ];
  });

  // Add totals footer row
  inventoryRows.push([
    'TOTALES',
    `${products.length} referencias registradas en catálogo IMMEX`,
    '-',
    totalUnidadesFisicas.toLocaleString('es-MX'),
    totalUnidadesA24.toLocaleString('es-MX'),
    totalUnidadesA30.toLocaleString('es-MX'),
    skusConDiferencia === 0 ? '100% OK' : `${skusConDiferencia} CON DESFASE`,
    formatCurrencyUSD(valorInventarioUSD),
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [
      [
        'SKU / Parte',
        'Descripción & Fracción TIGIE',
        'Tipo Bien',
        'Físico WMS',
        'Anexo 24',
        'Anexo 30',
        'Conciliación',
        'Valor (USD)',
      ],
    ],
    body: inventoryRows,
    margin: { left: margin, right: margin },
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.2,
      textColor: [30, 41, 59],
      cellPadding: 2,
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: 'bold' },
      1: { cellWidth: 50 },
      2: { cellWidth: 22 },
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 16, halign: 'right' },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 21, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 21, halign: 'right' },
    },
    didParseCell: (data) => {
      const isLastRow = data.row.index === inventoryRows.length - 1;
      if (data.section === 'body' && isLastRow) {
        data.cell.styles.fillColor = [226, 232, 240];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [15, 23, 42];
      } else if (data.section === 'body' && data.column.index === 6) {
        const val = String(data.cell.raw || '');
        if (val.startsWith('DESFASE')) {
          data.cell.styles.textColor = [180, 83, 9];
        } else {
          data.cell.styles.textColor = [4, 120, 87];
        }
      }
    },
  });

  cursorY = getLastTableY(doc, cursorY + 50) + 9;

  // --- SECCIÓN 3: MONITOR DE PEDIMENTOS (18 MESES Y REGLA 48 HORAS) ---
  if (cursorY > pageHeight - 55) {
    doc.addPage();
    cursorY = 20;
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('3. CONTROL ADUANERO DE PEDIMENTOS (PLAZO 18 MESES Y REGLA 48 HORAS)', margin, cursorY);
  cursorY += 3;

  const pedimentosRows = pedimentos.slice(0, 12).map((ped) => {
    const firstPartida = ped.partidas?.[0];
    const plazo48Label = ped.cumplePlazo48h
      ? `OK (${ped.horasTranscurridasRegistro}h)`
      : `INFRACCIÓN (${ped.horasTranscurridasRegistro}h)`;
    const permLabel =
      ped.tipo === 'ENTRADA'
        ? ped.estadoPermanencia === 'VENCIDO'
          ? 'VENCIDO (0d)'
          : ped.estadoPermanencia === 'PROXIMO_A_VENCER'
            ? `PRÓXIMO (${ped.diasRestantes ?? 0}d)`
            : ped.estadoPermanencia === 'DESCARGADO_TOTAL'
              ? 'DESCARGADO'
              : `VIGENTE (${ped.diasRestantes ?? '-'}d)`
        : 'SALIDA / RETORNO';

    return [
      ped.numeroPedimento,
      `${ped.clave} (${ped.tipo})`,
      ped.fechaPago.slice(0, 10),
      firstPartida ? `${firstPartida.sku} (${firstPartida.saldoDisponible} disp.)` : 'N/A',
      plazo48Label,
      permLabel,
      formatCurrencyUSD(ped.valorTotalUSD || 0),
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    head: [
      [
        'No. Pedimento',
        'Clave / Tipo',
        'Fecha Pago',
        'Partida Principal / Saldo',
        'Regla 48h',
        'Permanencia 18M',
        'Valor (USD)',
      ],
    ],
    body:
      pedimentosRows.length > 0
        ? pedimentosRows
        : [['Sin pedimentos registrados en el periodo actual', '-', '-', '-', '-', '-', '-']],
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.2,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold' },
      1: { cellWidth: 21 },
      2: { cellWidth: 20 },
      3: { cellWidth: 42 },
      4: { cellWidth: 24, halign: 'center' },
      5: { cellWidth: 26, halign: 'center' },
      6: { cellWidth: 23, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && (data.column.index === 4 || data.column.index === 5)) {
        const text = String(data.cell.raw || '');
        if (text.includes('INFRACCIÓN') || text.includes('VENCIDO')) {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        } else if (text.includes('PRÓXIMO')) {
          data.cell.styles.textColor = [180, 83, 9];
          data.cell.styles.fontStyle = 'bold';
        } else if (text.includes('OK') || text.includes('VIGENTE') || text.includes('DESCARGADO')) {
          data.cell.styles.textColor = [4, 120, 87];
        }
      }
    },
  });

  cursorY = getLastTableY(doc, cursorY + 40) + 9;

  // --- SECCIÓN 4: DESCARGOS PEPS RECIENTES ---
  if (descargosPEPS.length > 0) {
    if (cursorY > pageHeight - 55) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('4. TRAZABILIDAD DE DESCARGOS PEPS Y AMORTIZACIÓN DE CRÉDITO IVA', margin, cursorY);
    cursorY += 3;

    const pepsRows = descargosPEPS.slice(0, 10).map((d) => [
      d.fechaDescargo.slice(0, 10),
      `${d.numeroPedimentoSalida} (${d.claveSalida})`,
      `${d.numeroPedimentoEntrada} (${d.claveEntrada})`,
      d.sku,
      `${d.cantidadDescargada.toLocaleString('es-MX')} ${d.unidadMedida}`,
      formatCurrencyUSD(d.creditoIvaAmortizado || 0),
      d.estatusAnexo30,
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: [
        [
          'Fecha',
          'Pedimento Salida',
          'Pedimento Entrada (FIFO)',
          'SKU',
          'Cantidad',
          'IVA Amortizado',
          'Anexo 30',
        ],
      ],
      body: pepsRows,
      margin: { left: margin, right: margin },
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.2,
        textColor: [30, 41, 59],
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 19 },
        1: { cellWidth: 36 },
        2: { cellWidth: 36 },
        3: { cellWidth: 27, fontStyle: 'bold' },
        4: { cellWidth: 21, halign: 'right' },
        5: { cellWidth: 26, halign: 'right' },
        6: { cellWidth: 23, halign: 'center' },
      },
    });

    cursorY = getLastTableY(doc, cursorY + 35) + 12;
  }

  // --- BLOQUE DE VALIDACIÓN Y FIRMAS PARA AUDITORÍA ---
  if (cursorY > pageHeight - 38) {
    doc.addPage();
    cursorY = 26;
  }

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(margin, cursorY + 12, margin + 72, cursorY + 12);
  doc.line(pageWidth - margin - 72, cursorY + 12, pageWidth - margin, cursorY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Responsable de Comercio Exterior / Anexo 24', margin + 36, cursorY + 16.5, {
    align: 'center',
  });
  doc.text('Auditoría Interna / Control de Almacenes', pageWidth - margin - 36, cursorY + 16.5, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Nombre, Firma y Fecha de Revisión', margin + 36, cursorY + 20.5, { align: 'center' });
  doc.text('Nombre, Firma y Sello de Validación', pageWidth - margin - 36, cursorY + 20.5, {
    align: 'center',
  });

  // --- PIE DE PÁGINA EN TODAS LAS PÁGINAS ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Folio ${folio} — Resguardo digital obligatorio por 5 años (Art. 28 y 30 CFF / RGCE Anexo 24 y 30).`,
      margin,
      pageHeight - 8.5
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 8.5, {
      align: 'right',
    });
  }

  const filename = `Reporte_Auditoria_IMMEX_${isoDateSlug}_${folio.slice(-4)}.pdf`;
  doc.save(filename);
  return filename;
}
