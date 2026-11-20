/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { 
  DatabaseState, 
  Product, 
  Movement, 
  Webhook, 
  WebhookLog, 
  Supplier,
  Pedimento,
  DescargoPEPS,
  BillOfMaterials,
  MermaRegistro,
  TomaFisicaInventario,
  ExpedienteElectronico,
  SatAuditAccess,
  ConciliacionAnexo30Item,
  ActivoFijoItem,
  AuditoriaActivoFijoResult,
  DiscrepanciaAnexo30Detalle,
  ScccgyTransmision,
  ChecklistMensualItem
} from './src/types.js';

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'data-store.json');
const CONFIG_FILE = path.join(process.cwd(), 'firebase-applet-config.json');

// Initialize Firebase Admin dynamically using applet config
let dbFirestore: any = null;
if (fs.existsSync(CONFIG_FILE)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    admin.initializeApp({
      projectId: firebaseConfig.projectId
    });
    dbFirestore = getFirestore();
    console.log(`[Firebase] Inicializado con éxito en el proyecto: ${firebaseConfig.projectId}`);
  } catch (err) {
    console.error('[Firebase] Error al inicializar Firebase Admin SDK:', err);
  }
} else {
  console.log('[Firebase] Archivo de configuración firebase-applet-config.json no encontrado. Operando en modo local.');
}

// Helper calculation: 18 months in ms (approx 540 days)
const MESES_18_MS = 540 * 24 * 60 * 60 * 1000;

// Helper: Calcular permanencia de 18 meses
function calcularPermanencia(fechaPagoStr: string) {
  const fechaPago = new Date(fechaPagoStr);
  const ahora = new Date();
  const fechaVencimiento = new Date(fechaPago.getTime() + MESES_18_MS);
  
  const diffTime = ahora.getTime() - fechaPago.getTime();
  const diasPermanencia = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  const diasRestantes = Math.floor((fechaVencimiento.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
  
  let estadoPermanencia: 'VIGENTE' | 'PROXIMO_A_VENCER' | 'VENCIDO' | 'DESCARGADO_TOTAL' = 'VIGENTE';
  if (diasRestantes <= 0) {
    estadoPermanencia = 'VENCIDO';
  } else if (diasRestantes <= 60) {
    estadoPermanencia = 'PROXIMO_A_VENCER';
  }

  return {
    fechaVencimiento18Meses: fechaVencimiento.toISOString(),
    diasPermanencia,
    diasRestantes,
    estadoPermanencia
  };
}

// Helper: Calcular regla de 48 horas
function calcularRegla48Horas(fechaDespachoStr: string, fechaRegistroStr: string) {
  const tDespacho = new Date(fechaDespachoStr).getTime();
  const tRegistro = new Date(fechaRegistroStr).getTime();
  const diffHours = (tRegistro - tDespacho) / (1000 * 60 * 60);
  const horasTranscurridasRegistro = Math.max(0, Math.round(diffHours * 10) / 10);
  const cumplePlazo48h = horasTranscurridasRegistro <= 48;
  return { horasTranscurridasRegistro, cumplePlazo48h };
}

// --- SEED INITIAL IMMEX ADUANAS & WAREHOUSE DATA ---
const DEFAULT_SUPPLIERS: Supplier[] = [
  { id: 'SUP-001', name: 'Microchip Global Components LLC', contact: 'Mark Sterling', phone: '+1 (512) 890-2211', email: 'supplies@microchip-global.com', rfcTaxId: 'MGC-890122-US1', pais: 'ESTADOS UNIDOS', tipoProveedor: 'EXTRANJERO', productsCount: 2 },
  { id: 'SUP-002', name: 'Shin-Etsu Precision Sensors Co.', contact: 'Kenji Takahashi', phone: '+81 3 3242 1100', email: 'sales@shinetsu-sensors.co.jp', rfcTaxId: 'STS-901123-JP2', pais: 'JAPÓN', tipoProveedor: 'EXTRANJERO', productsCount: 2 },
  { id: 'SUP-003', name: 'Aleaciones & Troquelados del Norte S.A. de C.V.', contact: 'Ing. Laura Valenzuela', phone: '+52 (656) 612-4099', email: 'lvalenzuela@alnorth.com.mx', rfcTaxId: 'ATN120409KL9', pais: 'MÉXICO', tipoProveedor: 'NACIONAL_IMMEX', productsCount: 1 },
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    sku: 'INS-ESP32-IC',
    name: 'Microcontrolador ESP32-WROOM-32D (Materia Prima)',
    category: 'Circuitos Integrados',
    bienType: 'MATERIA_PRIMA',
    fraccionArancelaria: '8542.31.01',
    unidadMedida: 'PZA',
    costPrice: 2.80,
    salePrice: 6.50,
    stock: 850,
    anexo24Stock: 850,
    anexo30Stock: 850,
    minStock: 200,
    suppliers: ['Microchip Global Components LLC'],
    locationRack: { pasillo: 'P-01', rack: 'R-04', nivel: 'N-02', posicion: 'POS-12' },
    loteActual: 'LOT-2026-ESP-09',
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    sku: 'INS-SENS-M18',
    name: 'Sensor Ultrasónico de Proximidad M18 (Componente)',
    category: 'Sensores Industriales',
    bienType: 'COMPONENTE',
    fraccionArancelaria: '9031.80.99',
    unidadMedida: 'PZA',
    costPrice: 14.50,
    salePrice: 32.00,
    stock: 140,
    anexo24Stock: 140,
    anexo30Stock: 160, // Intentionally has a discrepancy for Anexo 30 demo!
    minStock: 50,
    suppliers: ['Shin-Etsu Precision Sensors Co.'],
    locationRack: { pasillo: 'P-02', rack: 'R-01', nivel: 'N-03', posicion: 'POS-05' },
    loteActual: 'LOT-2025-SNS-88',
    createdAt: new Date(Date.now() - 410 * 24 * 60 * 60 * 1000).toISOString(), // ~13.6 months old! Approaching 18m
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    sku: 'PT-MODULO-IOT',
    name: 'Módulo IoT de Telemetría Industrial V4 (Producto Terminado)',
    category: 'Equipos Ensamblados',
    bienType: 'PRODUCTO_TERMINADO',
    fraccionArancelaria: '8517.62.99',
    unidadMedida: 'PZA',
    costPrice: 38.00,
    salePrice: 85.00,
    stock: 220,
    anexo24Stock: 220,
    anexo30Stock: 220,
    minStock: 80,
    suppliers: ['Producción Interna IMMEX'],
    locationRack: { pasillo: 'P-05', rack: 'R-02', nivel: 'N-01', posicion: 'POS-01' },
    loteActual: 'LOT-PT-2026-X1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    sku: 'AF-SMT-YAMAHA',
    name: 'Robot Colocador de Chips SMD Yamaha YSM20R (Activo Fijo)',
    category: 'Maquinaria de Ensamble',
    bienType: 'ACTIVO_FIJO',
    fraccionArancelaria: '8479.89.99',
    unidadMedida: 'PZA',
    costPrice: 185000.00,
    salePrice: 220000.00,
    stock: 2,
    anexo24Stock: 2,
    anexo30Stock: 2,
    minStock: 1,
    suppliers: ['Shin-Etsu Precision Sensors Co.'],
    locationRack: { pasillo: 'LINEA-SMT-A', rack: 'ESTACION-01', nivel: 'SUELO', posicion: 'CELDA-01' },
    placadoActivoFijo: {
      marca: 'YAMAHA MOTOR CO.',
      modelo: 'YSM20R-DUAL',
      numeroSerie: 'SN-YMH-890214-MX',
      pedimentoImportacion: '24 47 3948 4001920',
      marbeteTag: 'MARB-IMMEX-AF-001',
      codigoBarrasRFID: 'RFID-984210048123',
      fechaInstalacion: '2024-03-15'
    },
    createdAt: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    sku: 'CONT-40HC-TRAILER',
    name: 'Contenedor Dry Van 40ft High Cube (Caja / Contenedor)',
    category: 'Contenedores de Tráiler',
    bienType: 'CONTENEDOR_TRAILER',
    fraccionArancelaria: '8609.00.01',
    unidadMedida: 'PZA',
    costPrice: 8500.00,
    salePrice: 12000.00,
    stock: 4,
    anexo24Stock: 4,
    anexo30Stock: 4,
    minStock: 2,
    suppliers: ['Aleaciones & Troquelados del Norte S.A. de C.V.'],
    locationRack: { pasillo: 'PATIO-EXTERIOR', rack: 'BAHIA-SUR', nivel: 'PISO', posicion: 'P-04' },
    createdAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

// Pedimentos semilla
const DEFAULT_PEDIMENTOS: Pedimento[] = [
  {
    id: 'PED-IN-2025-01',
    numeroPedimento: '25 47 3190 5001248', // 15 dígitos oficial SAT
    tipo: 'ENTRADA',
    clave: 'IN', // Importación Temporal IMMEX
    aduana: '470 - Ciudad Juárez, Chih.',
    patente: '3190',
    fechaPago: new Date(Date.now() - 410 * 24 * 60 * 60 * 1000).toISOString(),
    fechaRegistro: new Date(Date.now() - (410 * 24 * 60 * 60 * 1000) + (14 * 60 * 60 * 1000)).toISOString(), // Registrado a las 14h (< 48h)
    horasTranscurridasRegistro: 14,
    cumplePlazo48h: true,
    proveedorCliente: 'Shin-Etsu Precision Sensors Co.',
    paisOrigenDestino: 'Japón (JPN)',
    tipoCambio: 19.85,
    valorTotalUSD: 14500.00,
    creditoIvaIepsTotal: 2320.00,
    partidas: [
      {
        id: 'PART-001',
        sku: 'INS-SENS-M18',
        descripcion: 'Sensor Ultrasónico de Proximidad M18 (Componente)',
        fraccion: '9031.80.99',
        cantidadOriginal: 500,
        cantidadDescargada: 360,
        saldoDisponible: 140,
        unidadMedida: 'PZA',
        valorUnitarioUSD: 14.50,
        valorTotalUSD: 7250.00,
        ivaIepsCredito: 1160.00
      }
    ],
    ...calcularPermanencia(new Date(Date.now() - 410 * 24 * 60 * 60 * 1000).toISOString()),
    expedienteId: 'EXP-PED-254731905001248',
    createdAt: new Date(Date.now() - 410 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'PED-IN-2026-02',
    numeroPedimento: '26 47 3190 6003912',
    tipo: 'ENTRADA',
    clave: 'IN',
    aduana: '470 - Ciudad Juárez, Chih.',
    patente: '3190',
    fechaPago: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    fechaRegistro: new Date(Date.now() - (120 * 24 * 60 * 60 * 1000) + (26 * 60 * 60 * 1000)).toISOString(), // 26 hrs (<48h)
    horasTranscurridasRegistro: 26,
    cumplePlazo48h: true,
    proveedorCliente: 'Microchip Global Components LLC',
    paisOrigenDestino: 'Estados Unidos (USA)',
    tipoCambio: 20.10,
    valorTotalUSD: 28000.00,
    creditoIvaIepsTotal: 4480.00,
    partidas: [
      {
        id: 'PART-002',
        sku: 'INS-ESP32-IC',
        descripcion: 'Microcontrolador ESP32-WROOM-32D (Materia Prima)',
        fraccion: '8542.31.01',
        cantidadOriginal: 1200,
        cantidadDescargada: 350,
        saldoDisponible: 850,
        unidadMedida: 'PZA',
        valorUnitarioUSD: 2.80,
        valorTotalUSD: 3360.00,
        ivaIepsCredito: 537.60
      }
    ],
    ...calcularPermanencia(new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()),
    expedienteId: 'EXP-PED-264731906003912',
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'PED-AF-2024-03',
    numeroPedimento: '24 47 3948 4001920',
    tipo: 'ENTRADA',
    clave: 'AF', // Activo Fijo
    aduana: '470 - Ciudad Juárez, Chih.',
    patente: '3948',
    fechaPago: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString(),
    fechaRegistro: new Date(Date.now() - (500 * 24 * 60 * 60 * 1000) + (38 * 60 * 60 * 1000)).toISOString(),
    horasTranscurridasRegistro: 38,
    cumplePlazo48h: true,
    proveedorCliente: 'Shin-Etsu Precision Sensors Co.',
    paisOrigenDestino: 'Japón (JPN)',
    tipoCambio: 18.90,
    valorTotalUSD: 185000.00,
    creditoIvaIepsTotal: 29600.00,
    partidas: [
      {
        id: 'PART-003',
        sku: 'AF-SMT-YAMAHA',
        descripcion: 'Robot Colocador de Chips SMD Yamaha YSM20R (Activo Fijo)',
        fraccion: '8479.89.99',
        cantidadOriginal: 2,
        cantidadDescargada: 0,
        saldoDisponible: 2,
        unidadMedida: 'PZA',
        valorUnitarioUSD: 185000.00,
        valorTotalUSD: 370000.00,
        ivaIepsCredito: 59200.00
      }
    ],
    // Activo Fijo no vence a 18 meses, dura vigencia IMMEX
    fechaVencimiento18Meses: 'VIGENCIA PROGRAMA IMMEX',
    diasPermanencia: 500,
    diasRestantes: 9999,
    estadoPermanencia: 'VIGENTE',
    expedienteId: 'EXP-PED-244739484001920',
    createdAt: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'PED-RT-2026-04',
    numeroPedimento: '26 47 3190 6009841',
    tipo: 'SALIDA',
    clave: 'RT', // Retorno al extranjero
    aduana: '470 - Ciudad Juárez, Chih.',
    patente: '3190',
    fechaPago: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    fechaRegistro: new Date(Date.now() - (15 * 24 * 60 * 60 * 1000) + (18 * 60 * 60 * 1000)).toISOString(),
    horasTranscurridasRegistro: 18,
    cumplePlazo48h: true,
    proveedorCliente: 'Apex Robotics LLC (Austin, TX)',
    paisOrigenDestino: 'Estados Unidos (USA)',
    tipoCambio: 20.15,
    valorTotalUSD: 29750.00,
    creditoIvaIepsTotal: 0,
    partidas: [
      {
        id: 'PART-004',
        sku: 'PT-MODULO-IOT',
        descripcion: 'Módulo IoT de Telemetría Industrial V4',
        fraccion: '8517.62.99',
        cantidadOriginal: 350,
        cantidadDescargada: 350,
        saldoDisponible: 0,
        unidadMedida: 'PZA',
        valorUnitarioUSD: 85.00,
        valorTotalUSD: 29750.00,
        ivaIepsCredito: 0
      }
    ],
    expedienteId: 'EXP-PED-264731906009841',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Descargos PEPS semilla
const DEFAULT_DESCARGOS_PEPS: DescargoPEPS[] = [
  {
    id: 'DESC-PEPS-1001',
    fechaDescargo: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    pedimentoSalidaId: 'PED-RT-2026-04',
    numeroPedimentoSalida: '26 47 3190 6009841',
    claveSalida: 'RT',
    pedimentoEntradaId: 'PED-IN-2025-01',
    numeroPedimentoEntrada: '25 47 3190 5001248',
    claveEntrada: 'IN',
    sku: 'INS-SENS-M18',
    cantidadDescargada: 350,
    unidadMedida: 'PZA',
    valorAmortizadoUSD: 5075.00,
    creditoIvaAmortizado: 812.00,
    saldoRestanteEntrada: 150,
    estatusAnexo30: 'TRANSMITIDO',
    fechaTransmisionSAT: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    acuseSAT: 'ACUSE-SAT-A30-99481203-TX'
  },
  {
    id: 'DESC-PEPS-1002',
    fechaDescargo: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    pedimentoSalidaId: 'PED-RT-2026-04',
    numeroPedimentoSalida: '26 47 3190 6009841',
    claveSalida: 'RT',
    pedimentoEntradaId: 'PED-IN-2026-02',
    numeroPedimentoEntrada: '26 47 3190 6003912',
    claveEntrada: 'IN',
    sku: 'INS-ESP32-IC',
    cantidadDescargada: 350,
    unidadMedida: 'PZA',
    valorAmortizadoUSD: 980.00,
    creditoIvaAmortizado: 156.80,
    saldoRestanteEntrada: 850,
    estatusAnexo30: 'TRANSMITIDO',
    fechaTransmisionSAT: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    acuseSAT: 'ACUSE-SAT-A30-99481204-TX'
  }
];

// Bill of Materials (BOM) semilla
const DEFAULT_BOMS: BillOfMaterials[] = [
  {
    id: 'BOM-MODULO-IOT-V4',
    skuProductoTerminado: 'PT-MODULO-IOT',
    nombreProducto: 'Módulo IoT de Telemetría Industrial V4',
    version: 'REV-4.2',
    vigencia: '2025-01-01 AL 2027-12-31',
    rendimientoEsperado: 97.5,
    justificacionTecnicaMermas: 'Pérdida por ajuste de calibración SMT en cinta alimentadora (1.5%) y descarte por prueba térmica en cámara climática (1.0%).',
    aprobadoPorIngenieria: 'Ing. Fernando Gamboa (Céd. Prof. 8492019)',
    fechaAprobacion: '2025-01-10',
    componentes: [
      {
        skuInsumo: 'INS-ESP32-IC',
        nombreInsumo: 'Microcontrolador ESP32-WROOM-32D',
        cantidadRequerida: 1.0,
        unidadMedida: 'PZA',
        porcentajeMerma: 1.5,
        porcentajeDesperdicio: 0.5
      },
      {
        skuInsumo: 'INS-SENS-M18',
        nombreInsumo: 'Sensor Ultrasónico de Proximidad M18',
        cantidadRequerida: 1.0,
        unidadMedida: 'PZA',
        porcentajeMerma: 1.0,
        porcentajeDesperdicio: 0.5
      }
    ]
  }
];

// Registro de Mermas y Destrucciones
const DEFAULT_MERMAS: MermaRegistro[] = [
  {
    id: 'MERMA-2026-001',
    fecha: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    sku: 'INS-ESP32-IC',
    nombre: 'Microcontrolador ESP32-WROOM-32D',
    cantidad: 15,
    unidadMedida: 'PZA',
    tipoProceso: 'Soldadura Reflow SMT',
    porcentajeRealVsBOM: 1.4, // dentro del 1.5% justificado en BOM
    motivoTecnico: 'Desalineación térmica por fluctuación en horno de reflujo según norma IPC-A-610G.',
    destino: 'DESTRUCCION_FISCAL',
    folioManifiesto: 'MANIF-DEST-2026-018',
    testigoSAToNotario: 'Lic. Roberto Garza (Notario Público No. 14 de Cd. Juárez)',
    evidenciaFotograficaUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    estatus: 'CONCLUIDO_SAT'
  }
];

// Inventarios Cíclicos semilla
const DEFAULT_INVENTARIOS_CICLICOS: TomaFisicaInventario[] = [
  {
    id: 'INV-CICL-01',
    fechaToma: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    auditorResponsable: 'Lic. Mariana Valdez (Auditoría de Control Interno)',
    zonaAlmacen: 'Pasillo P-01 / Rack R-04',
    sku: 'INS-ESP32-IC',
    nombre: 'Microcontrolador ESP32-WROOM-32D',
    saldoTeoricoAnexo24: 850,
    conteoFisicoReal: 850,
    diferencia: 0,
    tipoDiscrepancia: 'CUADRADO',
    montoRiesgoMultaMXN: 0,
    justificacionInvestigacion: 'Conteo físico exacto. Etiquetas marbetes legibles y sellos intactos.',
    estatusAjuste: 'CONCILIADO',
    actaFolio: 'ACTA-CONF-2026-09'
  },
  {
    id: 'INV-CICL-02',
    fechaToma: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    auditorResponsable: 'Ing. Carlos Mendoza (Auditor Aduanero)',
    zonaAlmacen: 'Pasillo P-02 / Rack R-01',
    sku: 'INS-SENS-M18',
    nombre: 'Sensor Ultrasónico de Proximidad M18',
    saldoTeoricoAnexo24: 140,
    conteoFisicoReal: 140,
    diferencia: 0,
    tipoDiscrepancia: 'CUADRADO',
    montoRiesgoMultaMXN: 0,
    justificacionInvestigacion: 'Cuadrado físico vs Anexo 24. Nota: Se detectó desfase de 20 pzas en Anexo 30 pendiente de transmitir descargo al portal SAT.',
    estatusAjuste: 'CONCILIADO',
    actaFolio: 'ACTA-CONF-2026-10'
  }
];

// Expedientes Electrónicos 5 Años de Materialidad
const DEFAULT_EXPEDIENTES: ExpedienteElectronico[] = [
  {
    id: 'EXP-PED-254731905001248',
    numeroPedimento: '25 47 3190 5001248',
    lote: 'LOT-2025-SNS-88',
    fechaOperacion: new Date(Date.now() - 410 * 24 * 60 * 60 * 1000).toISOString(),
    fechaResguardoObligatorio: new Date(Date.now() - (410 * 24 * 60 * 60 * 1000) + (5 * 365 * 24 * 60 * 60 * 1000)).toISOString(),
    aniosRestantesResguardo: 3.8,
    porcentajeCompletitud: 100,
    nivelMaterialidad: 'OPTIMO_SIN_RIESGO',
    documentos: [
      {
        tipo: 'PEDIMENTO_FACTURA_CFDI',
        nombreArchivo: 'PED-IN-254731905001248_FACT-9921_CFDI.pdf',
        fechaDocumento: '2025-02-10',
        folioFiscalUUID: '4A1B2C3D-E5F6-7890-ABCD-1234567890AB',
        estatusValidacion: 'VALIDADO_COMPLETO',
        observaciones: 'CFDI con complemento CCE timbrado y cotejado en SAT.'
      },
      {
        tipo: 'TRANSPORTE_CARTA_PORTE',
        nombreArchivo: 'BL-MAERSK-JP-MEX-881920_CartaPorte.pdf',
        fechaDocumento: '2025-02-05',
        estatusValidacion: 'VALIDADO_COMPLETO',
        observaciones: 'Bill of Lading marítimo Yokohama-Manzanillo e inspección en puerto.'
      },
      {
        tipo: 'RECEPCION_ALMACEN_WMS',
        nombreArchivo: 'TICKET-WMS-REC-2025-0812.pdf',
        fechaDocumento: '2025-02-12',
        estatusValidacion: 'VALIDADO_COMPLETO',
        observaciones: 'Entrada registrada en WMS con marbetes y pesaje de tarimas.'
      },
      {
        tipo: 'ORDEN_PRODUCCION_BOM',
        nombreArchivo: 'OP-ENSAMBLE-BOM-MODULO-IOT.pdf',
        fechaDocumento: '2025-03-01',
        estatusValidacion: 'VALIDADO_COMPLETO',
        observaciones: 'Vinculación directa a BOM-MODULO-IOT-V4 con consumos reales.'
      },
      {
        tipo: 'PEDIMENTO_RETORNO',
        nombreArchivo: 'PED-RT-264731906009841.pdf',
        fechaDocumento: '2026-10-01',
        estatusValidacion: 'VALIDADO_COMPLETO',
        observaciones: 'Descargo PEPS vinculado con acuse de recepción en destino.'
      },
      {
        tipo: 'PRUEBA_PAGO_CONTRATOS',
        nombreArchivo: 'SPEI_TRANSFER_CONTRATO_MAQUILA.pdf',
        fechaDocumento: '2025-02-18',
        estatusValidacion: 'VALIDADO_COMPLETO',
        observaciones: 'Comprobante bancario CEP Banxico de pago de flete e impuestos locales.'
      }
    ]
  },
  {
    id: 'EXP-PED-264731906003912',
    numeroPedimento: '26 47 3190 6003912',
    lote: 'LOT-2026-ESP-09',
    fechaOperacion: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    fechaResguardoObligatorio: new Date(Date.now() - (120 * 24 * 60 * 60 * 1000) + (5 * 365 * 24 * 60 * 60 * 1000)).toISOString(),
    aniosRestantesResguardo: 4.6,
    porcentajeCompletitud: 83,
    nivelMaterialidad: 'REGULAR_FALTAN_SOPORTES',
    documentos: [
      {
        tipo: 'PEDIMENTO_FACTURA_CFDI',
        nombreArchivo: 'PED-264731906003912_INVOICE_MICROCHIP.pdf',
        fechaDocumento: '2026-06-18',
        estatusValidacion: 'VALIDADO_COMPLETO',
        observaciones: 'Pedimento de importación temporal y factura comercial extranjera.'
      },
      {
        tipo: 'TRANSPORTE_CARTA_PORTE',
        nombreArchivo: 'CP-TERRESTRE-ELPASO-CDJUAREZ.pdf',
        fechaDocumento: '2026-06-19',
        estatusValidacion: 'VALIDADO_COMPLETO',
        observaciones: 'Carta Porte terrestre con cruce de puente internacional.'
      },
      {
        tipo: 'RECEPCION_ALMACEN_WMS',
        nombreArchivo: 'WMS-RECEPCION-DOC-99214.pdf',
        fechaDocumento: '2026-06-20',
        estatusValidacion: 'VALIDADO_COMPLETO',
        observaciones: 'Captura en sistema WMS completada a las 26 horas del cruce.'
      },
      {
        tipo: 'ORDEN_PRODUCCION_BOM',
        nombreArchivo: 'ORDEN-PROD-LOTE-2026-ESP-09.pdf',
        fechaDocumento: '2026-07-05',
        estatusValidacion: 'VALIDADO_COMPLETO',
        observaciones: 'Hoja viajera de ensamble firmada por supervisor de turno.'
      },
      {
        tipo: 'PEDIMENTO_RETORNO',
        nombreArchivo: 'PED-RT-264731906009841.pdf',
        fechaDocumento: '2026-10-01',
        estatusValidacion: 'VALIDADO_COMPLETO',
        observaciones: 'Amortización parcial PEPS de 350 piezas.'
      },
      {
        tipo: 'PRUEBA_PAGO_CONTRATOS',
        nombreArchivo: 'PENDIENTE_COMPROBANTE_NOMINA.pdf',
        fechaDocumento: '2026-07-15',
        estatusValidacion: 'PENDIENTE',
        observaciones: 'Falta anexar recibo de timbrado de nómina del personal de ensamble (Criterio de Materialidad).'
      }
    ]
  }
];

// Acceso SAT Apartado C
const DEFAULT_SAT_AUDIT_ACCESS: SatAuditAccess = {
  tokenAuditor: 'SAT-AUDIT-IMMEX-LIVE-7729104',
  usuarioSAT: 'auditor.fiscalizacion@sat.gob.mx',
  empresaRFC: 'IMX891024KL8',
  programaIMMEX: 'IMMEX-REG-2024-9981-CHIH',
  certificacionIvaIeps: 'AAA',
  fechaGeneracion: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  expiraEn: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(),
  activo: true,
  consultasRealizadas: 42,
  ipUltimaConexion: '187.189.14.92 (Servidores SAT AGS)'
};

const DEFAULT_MOVEMENTS: Movement[] = [
  {
    id: 'MOV-1001',
    sku: 'INS-ESP32-IC',
    productName: 'Microcontrolador ESP32-WROOM-32D',
    type: 'ENTRADA',
    quantity: 1200,
    user: 'Andrés López (Almacén Central)',
    reason: 'Importación Temporal Pedimento IN (Despacho Aduanal)',
    reference: 'PED-IN-26 47 3190 6003912',
    timestamp: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    pedimentoAsociado: '26 47 3190 6003912',
    horasDesdeDespacho: 26
  },
  {
    id: 'MOV-1002',
    sku: 'INS-ESP32-IC',
    productName: 'Microcontrolador ESP32-WROOM-32D',
    type: 'SALIDA',
    quantity: 350,
    user: 'Ing. Fernando Gamboa (Producción)',
    reason: 'Descargo PEPS por Retorno de PT en Pedimento RT',
    reference: 'PED-RT-26 47 3190 6009841',
    timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    pedimentoAsociado: '26 47 3190 6009841'
  },
  {
    id: 'MOV-1003',
    sku: 'INS-SENS-M18',
    productName: 'Sensor Ultrasónico de Proximidad M18',
    type: 'ENTRADA',
    quantity: 500,
    user: 'Andrés López (Almacén Central)',
    reason: 'Importación Temporal Pedimento IN (Japón)',
    reference: 'PED-IN-25 47 3190 5001248',
    timestamp: new Date(Date.now() - 410 * 24 * 60 * 60 * 1000).toISOString(),
    pedimentoAsociado: '25 47 3190 5001248',
    horasDesdeDespacho: 14
  },
  {
    id: 'MOV-1004',
    sku: 'INS-SENS-M18',
    productName: 'Sensor Ultrasónico de Proximidad M18',
    type: 'SALIDA',
    quantity: 360,
    user: 'Ing. Fernando Gamboa (Producción)',
    reason: 'Descargo PEPS por Retorno al extranjero',
    reference: 'PED-RT-26 47 3190 6009841',
    timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    pedimentoAsociado: '26 47 3190 6009841'
  },
  {
    id: 'MOV-1005',
    sku: 'INS-ESP32-IC',
    productName: 'Microcontrolador ESP32-WROOM-32D',
    type: 'MERMA',
    quantity: 15,
    user: 'Diana Cruz (Calidad & Mermas)',
    reason: 'Destrucción fiscal autorizada por merma de proceso',
    reference: 'MANIF-DEST-2026-018',
    timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_ACTIVOS_FIJOS: ActivoFijoItem[] = [
  {
    id: 'AF-FANUC-01',
    noInventario: 'EQ-2026-01',
    descripcion: 'Célula de Ensamble Robotizada',
    marca: 'Fanuc',
    modelo: 'R-2000iC',
    numeroSeriePlaca: 'CF-892341',
    pedimentoAF: '26 43 3123 6001234',
    numeroSeriePedimento: 'CF-892341',
    coincidenciaExactaSerie: true,
    ubicacionFisica: 'Planta 1 - Nave B',
    estatus: 'ACTIVO',
    marbeteRFID: 'RFID-AF-FANUC-892341',
    codigoQR: 'QR-IMMEX-AF-EQ-2026-01-FANUC',
    fotos: {
      vistaGeneralUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      placaFabricanteUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
      marbeteControlInternoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'
    },
    expedienteAF: {
      pedimentoAFUrl: 'PED-AF-264331236001234.pdf',
      facturaComercialInvoiceUrl: 'INV-FANUC-ROBOTICS-9912.pdf',
      fichaTecnicaManualUrl: 'MANUAL-TECNICO-R2000iC.pdf',
      completo: true
    },
    fechaUltimaAuditoriaFisica: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'AF-HUSKY-05',
    noInventario: 'ML-2026-05',
    descripcion: 'Molde de Inyección de Alta Precisión',
    marca: 'Husky',
    modelo: 'HyPET 500',
    numeroSeriePlaca: 'HK-99421',
    pedimentoAF: '26 43 3123 6005678',
    numeroSeriePedimento: 'HK-99421',
    coincidenciaExactaSerie: true,
    ubicacionFisica: 'Bodega de Herramental',
    estatus: 'EN_USO',
    marbeteRFID: 'RFID-AF-HUSKY-99421',
    codigoQR: 'QR-IMMEX-AF-ML-2026-05-HUSKY',
    fotos: {
      vistaGeneralUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
      placaFabricanteUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
      marbeteControlInternoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'
    },
    expedienteAF: {
      pedimentoAFUrl: 'PED-AF-264331236005678.pdf',
      facturaComercialInvoiceUrl: 'COMMERCIAL-INVOICE-HUSKY-4412.pdf',
      fichaTecnicaManualUrl: 'FICHA-TECNICA-MOLDE-HyPET.pdf',
      completo: true
    },
    fechaUltimaAuditoriaFisica: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 220 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'AF-HAAS-08',
    noInventario: 'EQ-2026-08',
    descripcion: 'Centro de Maquinado CNC 5 Ejes',
    marca: 'Haas Automation',
    modelo: 'ST-30Y',
    numeroSeriePlaca: 'ST30-99412',
    pedimentoAF: '25 43 3123 5003310',
    numeroSeriePedimento: 'ST30-9941', // Omite el dígito 2 intencionalmente para simular el caso de fiscalización SAT
    coincidenciaExactaSerie: false,
    discrepanciaDetalle: 'ALERTA DE EMBARGO PRECAUTORIO (Art. 151 Fracc. II Ley Aduanera): La placa metálica indica serie ST30-99412 pero el pedimento ampara ST30-9941 (omisión de dígito "2"). Invalida la legal estancia ante el SAT. Requiere presentar Rectificación R1 (Art. 89 LA) de inmediato.',
    ubicacionFisica: 'Planta 1 - Nave C',
    estatus: 'ACTIVO',
    marbeteRFID: 'RFID-AF-HAAS-ST30-99412',
    codigoQR: 'QR-IMMEX-AF-EQ-2026-08-HAAS',
    fotos: {
      vistaGeneralUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      placaFabricanteUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
      marbeteControlInternoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'
    },
    expedienteAF: {
      pedimentoAFUrl: 'PED-AF-254331235003310.pdf',
      facturaComercialInvoiceUrl: 'INVOICE-HAAS-AUTOMATION-8819.pdf',
      fichaTecnicaManualUrl: 'MANUAL-OPERACION-HAAS-ST30Y.pdf',
      completo: false
    },
    fechaUltimaAuditoriaFisica: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 310 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'AF-MAGNA-12',
    noInventario: 'ML-2026-12',
    descripcion: 'Molde Progresivo de Estampado Automotriz',
    marca: 'Magna Steyr',
    modelo: 'PRG-STP-800',
    numeroSeriePlaca: 'MG-55201',
    pedimentoAF: '25 43 3123 5009182',
    numeroSeriePedimento: 'MG-55201',
    coincidenciaExactaSerie: true,
    ubicacionFisica: 'Instalaciones de Submaquilador Matricería del Norte',
    estatus: 'SUBMAQUILADOR',
    submaquiladorNombre: 'Matricería del Norte S.A. de C.V. (IMMEX 8912-2021)',
    avisoTrasladoFolio: 'AVISO-TRAS-V1-2026-04',
    marbeteRFID: 'RFID-AF-MAGNA-55201',
    codigoQR: 'QR-IMMEX-AF-ML-2026-12-MAGNA',
    fotos: {
      vistaGeneralUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
      placaFabricanteUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
      marbeteControlInternoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'
    },
    expedienteAF: {
      pedimentoAFUrl: 'PED-AF-254331235009182.pdf',
      facturaComercialInvoiceUrl: 'INVOICE-MAGNA-29104.pdf',
      fichaTecnicaManualUrl: 'MANUAL-MOLDE-MAGNA.pdf',
      avisoTrasladoV1Url: 'AVISO-TRAS-SUBMAQUILA-V1.pdf',
      completo: true
    },
    fechaUltimaAuditoriaFisica: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'AF-YAMAHA-01',
    noInventario: 'EQ-2024-03',
    descripcion: 'Robot Colocador de Chips SMD Yamaha YSM20R',
    marca: 'YAMAHA MOTOR CO.',
    modelo: 'YSM20R-DUAL',
    numeroSeriePlaca: 'SN-YMH-890214-MX',
    pedimentoAF: '24 47 3948 4001920',
    numeroSeriePedimento: 'SN-YMH-890214-MX',
    coincidenciaExactaSerie: true,
    ubicacionFisica: 'Línea SMT A - Celda 01',
    estatus: 'ACTIVO',
    marbeteRFID: 'RFID-984210048123',
    codigoQR: 'QR-IMMEX-AF-EQ-2024-03-YAMAHA',
    fotos: {
      vistaGeneralUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      placaFabricanteUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
      marbeteControlInternoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'
    },
    expedienteAF: {
      pedimentoAFUrl: 'PED-AF-244739484001920.pdf',
      facturaComercialInvoiceUrl: 'INVOICE-YAMAHA-SMT-7721.pdf',
      fichaTecnicaManualUrl: 'MANUAL-YSM20R-SPEC.pdf',
      completo: true
    },
    fechaUltimaAuditoriaFisica: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const DEFAULT_AUDITORIAS_ACTIVO_FIJO: AuditoriaActivoFijoResult[] = [
  {
    id: 'AUD-AF-2026-Q1',
    fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    auditorResponsable: 'Lic. Mariana Valdez (Auditoría de Control Interno Aduanero)',
    totalActivosInspeccionados: 5,
    activosConformes: 4,
    inconsistenciasMecanograficas: 1, // Torno Haas EQ-2026-08
    activosFaltantes: 0,
    activosSobrantesSinPedimento: 0,
    activosConSubmaquilador: 1, // Magna ML-2026-12 con aviso V1 vigente
    estatusPlanSaneamiento: 'REQUERIMIENTO_RECTIFICACION_R1',
    resumenHallazgos: 'Se detectó 1 activo (EQ-2026-08 Torno CNC Haas) con omisión mecanográfica del dígito final en el pedimento AF. Se activó protocolo de Rectificación R1 bajo Art. 89 de la Ley Aduanera para evitar presunción de embargo precautorio bajo Art. 151 LA.'
  }
];

const DEFAULT_DISCREPANCIAS_ANEXO30: DiscrepanciaAnexo30Detalle[] = [
  {
    id: 'DISC-A30-001',
    sku: 'INS-SENS-M18',
    descripcion: 'Sensor Ultrasónico de Proximidad M18',
    tipoCausa: 'DESCARGO_NO_TRANSMITIDO',
    pedimentoAfectado: '25 47 3190 5001248',
    montoIvaDiscrepanciaUSD: 320.00,
    detalleTecnico: 'Transmisión al SCCCyG pendiente: Se descargaron 20 piezas en Anexo 24 pero no se ha enviado el informe de descargo electrónico al portal SAT.',
    accionRequerida: 'CORRECCION_RECHAZO_SCCCYG',
    estatusSolucion: 'PENDIENTE'
  },
  {
    id: 'DISC-A30-002',
    sku: 'INS-ESP32-IC',
    descripcion: 'Microcontrolador ESP32-WROOM-32D',
    tipoCausa: 'RECTIFICACION_R1_PENDIENTE',
    pedimentoAfectado: '26 47 3190 6003912',
    montoIvaDiscrepanciaUSD: 184.20,
    detalleTecnico: 'Cambio por Rectificación R1 en valor comercial aduanero actualizado en Anexo 24, pero aún no transmitido vía Aviso de Rectificación en SCCCyG.',
    accionRequerida: 'RECTIFICACION_R1',
    estatusSolucion: 'PENDIENTE'
  },
  {
    id: 'DISC-A30-003',
    sku: 'PT-MODULO-IOT',
    descripcion: 'Módulo IoT de Telemetría Industrial V4',
    tipoCausa: 'VIRTUAL_V1_EXTEMPORANEO',
    pedimentoAfectado: '26 47 3190 6009841',
    montoIvaDiscrepanciaUSD: 450.00,
    detalleTecnico: 'Operación virtual V1 con maquiladora tercera no transmitida dentro del plazo reglamentario en SCCCyG.',
    accionRequerida: 'AVISO_ACLARACION_INCONFORMIDAD_SAT',
    estatusSolucion: 'PENDIENTE'
  },
  {
    id: 'DISC-A30-004',
    sku: 'INS-ESP32-IC',
    descripcion: 'Microcontrolador ESP32-WROOM-32D',
    tipoCausa: 'MERMA_SIN_INFORME',
    pedimentoAfectado: '26 47 3190 6003912',
    montoIvaDiscrepanciaUSD: 24.00,
    detalleTecnico: 'Baja por merma de 15 piezas procesada en Anexo 24 (Manifiesto MANIF-DEST-2026-018) sin informe de descargo correspondiente enviado al portal del SAT.',
    accionRequerida: 'TRANSMISION_INFORME_MERMAS',
    estatusSolucion: 'PENDIENTE'
  }
];

const DEFAULT_SCCCGY_TRANSMISIONES: ScccgyTransmision[] = [
  {
    id: 'TX-SCCCYG-2026-089',
    periodo: '2026-OCTUBRE-Q1',
    fechaTransmision: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    tipoInforme: 'DESCARGO_PEPS',
    totalDescargos: 2,
    montoIvaAbonadoUSD: 968.80,
    estatus: 'ACEPTADO_VALIDADO',
    acuseSATFirma: 'SAT-SCCCYG-AUTORIZADO-8841299-SHA256:7fa1e90d8a43',
    xmlGenerado: `<?xml version="1.0" encoding="UTF-8"?><SCCCyG:InformeDescargos xmlns:SCCCyG="http://www.sat.gob.mx/esquemas/retornos/anexo30" Version="1.2" RFC="IMX891024KL8" ProgramaIMMEX="IMMEX-REG-2024-9981-CHIH"><Descargos><Descargo PedimentoImportacion="25 47 3190 5001248" Fraccion="9031.80.99" Cantidad="350" MontoIVA="812.00" PedimentoRetorno="26 47 3190 6009841"/><Descargo PedimentoImportacion="26 47 3190 6003912" Fraccion="8542.31.01" Cantidad="350" MontoIVA="156.80" PedimentoRetorno="26 47 3190 6009841"/></Descargos></SCCCyG:InformeDescargos>`
  }
];

const DEFAULT_CHECKLIST_MENSUAL: ChecklistMensualItem[] = [
  {
    id: 'CHK-01',
    titulo: '1. Conciliación Mensual SCCCyG vs Anexo 24',
    descripcion: 'Descarga de la consulta de saldos y créditos en el portal del SAT (SCCCyG) y cruce contra el reporte de saldos por pedimento de Anexo 24 desglosado por fracción y valor IVA.',
    frecuencia: 'MENSUAL',
    completado: true,
    fechaVerificacion: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    responsable: 'Lic. Mariana Valdez',
    observaciones: 'Conciliación del mes anterior completada con acuses de descargo archivados.'
  },
  {
    id: 'CHK-02',
    titulo: '2. Monitoreo del Semáforo Preventivo de 18 Meses',
    descripcion: 'Revisión obligatoria de materias primas y componentes próximos a cumplir 18 meses (Ley Aduanera Art. 108). La regla de oro exige no esperar al vencimiento para evitar suspensión de la Certificación IVA/IEPS.',
    frecuencia: 'MENSUAL',
    completado: true,
    fechaVerificacion: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    responsable: 'Ing. Fernando Gamboa',
    observaciones: 'Sensor M18 se encuentra en 410 días de permanencia (~13.6 meses). Se programó retorno en orden de producción vigente.'
  },
  {
    id: 'CHK-03',
    titulo: '3. Auditoría de Rechazos y Descargos Pendientes en Anexo 30',
    descripcion: 'Verificación en el portal del SAT de informes de descargo en estatus "Rechazado" por inconsistencias de clave, fecha o RFC, procediendo a su retransmisión corregida.',
    frecuencia: 'QUINCENAL',
    completado: false,
    responsable: 'Lic. Roberto Garza',
    observaciones: 'Se tienen 4 inconsistencias detectadas pendientes de regularización en el mapeo de discrepancias.'
  },
  {
    id: 'CHK-04',
    titulo: '4. Control de Avisos de Traslado y Pedimentos Virtuales (V1/V5)',
    descripcion: 'Revisión de activos fijos e insumos en submaquila para asegurar que cuenten con pedimento V1 o aviso de traslado vigente y que hayan sido transmitidos a tiempo.',
    frecuencia: 'MENSUAL',
    completado: true,
    fechaVerificacion: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    responsable: 'Lic. Mariana Valdez',
    observaciones: 'Molde Magna ML-2026-12 cuenta con aviso AVISO-TRAS-V1-2026-04 vigente en Matricería del Norte.'
  },
  {
    id: 'CHK-05',
    titulo: '5. Cruce de Bajas por Mermas vs Informes de Descargo SAT',
    descripcion: 'Validar que toda destrucción fiscal o merma técnica descontada del Anexo 24 cuente con su informe de descargo formal en el portal SCCCyG.',
    frecuencia: 'MENSUAL',
    completado: false,
    responsable: 'Diana Cruz (Mermas)',
    observaciones: 'Falta transmitir informe de descargo por la merma de 15 piezas de microcontrolador ESP32.'
  },
  {
    id: 'CHK-06',
    titulo: '6. Barrido Físico de Activo Fijo (Placa vs Pedimento)',
    descripcion: 'Inspección física en bodega de maquinaria con verificación de los 3 requisitos: placa visible del fabricante, etiqueta interna con QR y coincidencia 100% exacta de dígitos en pedimento AF.',
    frecuencia: 'MENSUAL',
    completado: false,
    responsable: 'Ing. Carlos Mendoza',
    observaciones: 'En proceso. Torno Haas ST-30Y requiere rectificación R1 por falta de dígito en pedimento.'
  },
  {
    id: 'CHK-07',
    titulo: '7. Resguardo de 5 Años de Materialidad en Expedientes Digitales',
    descripcion: 'Confirmar que cada pedimento cuente con los 6 soportes: Pedimento/Factura CFDI CCE, Carta de Porte, WMS, Orden de Producción BOM, Retorno PEPS y Comprobantes de pago / contratos.',
    frecuencia: 'MENSUAL',
    completado: true,
    fechaVerificacion: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    responsable: 'Lic. Roberto Garza',
    observaciones: 'Expedientes resguardados en bóveda digital cifrada.'
  }
];

const DEFAULT_WEBHOOKS: Webhook[] = [
  {
    id: 'WH-001',
    url: 'https://sat-ventanilla-unica.gob.mx/api/v2/anexo30/feed',
    events: ['PEDIMENTO_48H_ALERT', 'PERMANENCIA_18M_ALERT', 'DISCREPANCIA_ANEXO30'],
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'WH-002',
    url: 'https://alerta-aduanas.empresa-immex.com/webhook/kardex-sat',
    events: ['STOCK_CRITICAL', 'MOVEMENT_REGISTERED'],
    isActive: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

const DEFAULT_WEBHOOK_LOGS: WebhookLog[] = [
  {
    id: 'WHL-1001',
    webhookId: 'WH-001',
    url: 'https://sat-ventanilla-unica.gob.mx/api/v2/anexo30/feed',
    event: 'DISCREPANCIA_ANEXO30',
    payload: JSON.stringify({
      alerta: 'DESFASE_SALDO_ANEXO30',
      sku: 'INS-SENS-M18',
      saldoAnexo24: 140,
      saldoPortalAnexo30: 160,
      diferencia: 20,
      accion: 'Transmisión de 20 descargos PEPS pendiente para amortizar crédito fiscal IVA.',
      fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }),
    status: 200,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

interface UserSession {
  email: string;
  name: string;
  role: string;
}

const activeSessions = new Map<string, UserSession>();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Atomic Cloud Savers (Firestore)
async function saveToCloudCollection(collectionName: string, docId: string, data: any) {
  if (!dbFirestore) return;
  try {
    await dbFirestore.collection(collectionName).doc(docId).set(data);
  } catch (err) {
    console.error(`[Firebase] Error al guardar en ${collectionName}:`, err);
  }
}

async function deleteFromCloudCollection(collectionName: string, docId: string) {
  if (!dbFirestore) return;
  try {
    await dbFirestore.collection(collectionName).doc(docId).delete();
  } catch (err) {
    console.error(`[Firebase] Error al eliminar de ${collectionName}:`, err);
  }
}

function readDB(): DatabaseState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      // Validate structure
      if (parsed.pedimentos && parsed.descargosPEPS && parsed.boms) {
        // Ensure new collections exist in existing file
        if (!parsed.activosFijos || parsed.activosFijos.length === 0) parsed.activosFijos = DEFAULT_ACTIVOS_FIJOS;
        if (!parsed.auditoriasActivoFijo || parsed.auditoriasActivoFijo.length === 0) parsed.auditoriasActivoFijo = DEFAULT_AUDITORIAS_ACTIVO_FIJO;
        if (!parsed.discrepanciasAnexo30 || parsed.discrepanciasAnexo30.length === 0) parsed.discrepanciasAnexo30 = DEFAULT_DISCREPANCIAS_ANEXO30;
        if (!parsed.scccgyTransmisiones || parsed.scccgyTransmisiones.length === 0) parsed.scccgyTransmisiones = DEFAULT_SCCCGY_TRANSMISIONES;
        if (!parsed.checklistMensual || parsed.checklistMensual.length === 0) parsed.checklistMensual = DEFAULT_CHECKLIST_MENSUAL;

        // Recalculate 18 months stay dynamically
        parsed.pedimentos.forEach((p: Pedimento) => {
          if (p.tipo === 'ENTRADA' && p.clave === 'IN') {
            const stay = calcularPermanencia(p.fechaPago);
            p.diasPermanencia = stay.diasPermanencia;
            p.diasRestantes = stay.diasRestantes;
            p.estadoPermanencia = stay.estadoPermanencia;
            p.fechaVencimiento18Meses = stay.fechaVencimiento18Meses;
          }
        });
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading database file, resetting to rich seed data:', error);
  }

  const initialState: DatabaseState = {
    products: DEFAULT_PRODUCTS,
    movements: DEFAULT_MOVEMENTS,
    suppliers: DEFAULT_SUPPLIERS,
    pedimentos: DEFAULT_PEDIMENTOS,
    descargosPEPS: DEFAULT_DESCARGOS_PEPS,
    boms: DEFAULT_BOMS,
    mermas: DEFAULT_MERMAS,
    activosFijos: DEFAULT_ACTIVOS_FIJOS,
    auditoriasActivoFijo: DEFAULT_AUDITORIAS_ACTIVO_FIJO,
    scccgyTransmisiones: DEFAULT_SCCCGY_TRANSMISIONES,
    discrepanciasAnexo30: DEFAULT_DISCREPANCIAS_ANEXO30,
    checklistMensual: DEFAULT_CHECKLIST_MENSUAL,
    inventariosCiclicos: DEFAULT_INVENTARIOS_CICLICOS,
    expedientes: DEFAULT_EXPEDIENTES,
    satAuditAccess: DEFAULT_SAT_AUDIT_ACCESS,
    webhooks: DEFAULT_WEBHOOKS,
    webhookLogs: DEFAULT_WEBHOOK_LOGS
  };
  writeDB(initialState);
  return initialState;
}

function writeDB(state: any): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to database file:', error);
  }
}

async function runServer() {
  const app = express();
  app.use(express.json());

  // Ensure DB file exists
  let db = readDB();

  // --- API ENDPOINTS ---

  // 1. Get Summary / IMMEX Stats (KPIs, semáforos, alertas de 48h y 18 meses, riesgo multas)
  app.get('/api/compliance/summary', (req, res) => {
    const db = readDB();
    
    // Regla 48 horas
    const pedimentosPendientes48h = db.pedimentos.filter(p => !p.cumplePlazo48h);
    const porcentajeCumplimiento48h = db.pedimentos.length > 0 
      ? Math.round(((db.pedimentos.length - pedimentosPendientes48h.length) / db.pedimentos.length) * 100) 
      : 100;

    // Plazo 18 Meses (Insumos Temporales)
    const pedimentosInsumos = db.pedimentos.filter(p => p.tipo === 'ENTRADA' && p.clave === 'IN');
    const pedimentosVencidos = pedimentosInsumos.filter(p => p.estadoPermanencia === 'VENCIDO');
    const pedimentosProximosVencer = pedimentosInsumos.filter(p => p.estadoPermanencia === 'PROXIMO_A_VENCER');

    // Saldo Total Crédito Fiscal IVA/IEPS Otorgado
    const creditoIvaTotal = db.pedimentos
      .filter(p => p.tipo === 'ENTRADA')
      .reduce((acc, p) => acc + (p.creditoIvaIepsTotal || 0), 0);

    const creditoIvaAmortizado = db.descargosPEPS
      .reduce((acc, d) => acc + (d.creditoIvaAmortizado || 0), 0);

    const creditoIvaSaldoPendiente = Math.max(0, creditoIvaTotal - creditoIvaAmortizado);

    // Calculadora de Riesgo de Sanciones (250% - 300% de valor comercial de mercancía con riesgo o faltante)
    // Multas por mercancía vencida > 18 meses
    const valorMercanciaVencidaUSD = pedimentosVencidos.reduce((acc, p) => acc + (p.valorTotalUSD || 0), 0);
    
    // Multas por discrepancias / faltantes en inventario físico
    const faltantesInventario = db.inventariosCiclicos.filter(i => i.tipoDiscrepancia === 'FALTANTE_RIESGO_CONTRABANDO');
    const valorFaltantesMXN = faltantesInventario.reduce((acc, i) => acc + (i.montoRiesgoMultaMXN || 0), 0);

    const multaEstimadaMinUSD = valorMercanciaVencidaUSD * 2.5; // 250%
    const multaEstimadaMaxUSD = valorMercanciaVencidaUSD * 3.0; // 300%

    // Anexo 30 Conciliación
    const discrepanciasAnexo30 = db.products.filter(p => p.anexo24Stock !== p.anexo30Stock || p.stock !== p.anexo24Stock);

    res.json({
      porcentajeCumplimiento48h,
      pedimentosPendientes48hCount: pedimentosPendientes48h.length,
      pedimentosVencidosCount: pedimentosVencidos.length,
      pedimentosProximosVencerCount: pedimentosProximosVencer.length,
      creditoIvaTotal,
      creditoIvaAmortizado,
      creditoIvaSaldoPendiente,
      multaEstimadaMinUSD,
      multaEstimadaMaxUSD,
      valorFaltantesMXN,
      discrepanciasAnexo30Count: discrepanciasAnexo30.length,
      certificacionIvaIeps: db.satAuditAccess.certificacionIvaIeps,
      totalPedimentos: db.pedimentos.length,
      totalDescargosPEPS: db.descargosPEPS.length,
      totalBOMs: db.boms.length,
      totalExpedientes: db.expedientes.length
    });
  });

  // 2. Get Products (Catálogo de Materiales, Mercancías y Activos Fijos - Apartado A)
  app.get('/api/products', (req, res) => {
    const db = readDB();
    res.json(db.products);
  });

  // 3. Create Product
  app.post('/api/products', (req, res) => {
    const db = readDB();
    const newProduct: Product = req.body;

    if (!newProduct.sku || !newProduct.name || !newProduct.fraccionArancelaria) {
      return res.status(400).json({ error: 'SKU, nombre y Fracción Arancelaria son obligatorios según el SAT.' });
    }

    if (db.products.some(p => p.sku.toLowerCase() === newProduct.sku.toLowerCase())) {
      return res.status(400).json({ error: `El producto o insumo con SKU ${newProduct.sku} ya existe.` });
    }

    newProduct.stock = newProduct.stock || 0;
    newProduct.anexo24Stock = newProduct.stock;
    newProduct.anexo30Stock = newProduct.stock;
    newProduct.createdAt = new Date().toISOString();
    newProduct.updatedAt = new Date().toISOString();

    db.products.push(newProduct);
    saveToCloudCollection('products', newProduct.sku, newProduct);
    writeDB(db);
    res.status(201).json(newProduct);
  });

  // 4. Update Product
  app.put('/api/products/:sku', (req, res) => {
    const db = readDB();
    const { sku } = req.params;
    const index = db.products.findIndex(p => p.sku.toLowerCase() === sku.toLowerCase());

    if (index === -1) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const currentProduct = db.products[index];
    const updateData = req.body;

    // Preserve stocks strictly
    const updatedProduct: Product = {
      ...currentProduct,
      name: updateData.name || currentProduct.name,
      category: updateData.category || currentProduct.category,
      bienType: updateData.bienType || currentProduct.bienType,
      fraccionArancelaria: updateData.fraccionArancelaria || currentProduct.fraccionArancelaria,
      unidadMedida: updateData.unidadMedida || currentProduct.unidadMedida,
      costPrice: updateData.costPrice !== undefined ? Number(updateData.costPrice) : currentProduct.costPrice,
      salePrice: updateData.salePrice !== undefined ? Number(updateData.salePrice) : currentProduct.salePrice,
      minStock: updateData.minStock !== undefined ? Number(updateData.minStock) : currentProduct.minStock,
      suppliers: updateData.suppliers || currentProduct.suppliers,
      locationRack: updateData.locationRack || currentProduct.locationRack,
      placadoActivoFijo: updateData.placadoActivoFijo || currentProduct.placadoActivoFijo,
      updatedAt: new Date().toISOString(),
    };

    db.products[index] = updatedProduct;
    saveToCloudCollection('products', updatedProduct.sku, updatedProduct);
    writeDB(db);
    res.json(updatedProduct);
  });

  // 5. Delete Product
  app.delete('/api/products/:sku', (req, res) => {
    const db = readDB();
    const { sku } = req.params;
    db.products = db.products.filter(p => p.sku.toLowerCase() !== sku.toLowerCase());
    deleteFromCloudCollection('products', sku);
    writeDB(db);
    res.json({ success: true });
  });

  // 6. Get Movements
  app.get('/api/movements', (req, res) => {
    const db = readDB();
    res.json(db.movements);
  });

  // 7. Register Movement
  app.post('/api/movements', (req, res) => {
    const db = readDB();
    const { sku, type, quantity, user, reason, reference, direction, pedimentoAsociado } = req.body;

    if (!sku || !type || !quantity || !user || !reason) {
      return res.status(400).json({ error: 'SKU, tipo, cantidad, usuario y motivo son requeridos.' });
    }

    const productIndex = db.products.findIndex(p => p.sku.toLowerCase() === sku.toLowerCase());
    if (productIndex === -1) {
      return res.status(404).json({ error: `SKU ${sku} no existe.` });
    }

    const product = db.products[productIndex];
    const qty = Number(quantity);

    let newStock = product.stock;
    if (type === 'ENTRADA') {
      newStock += qty;
    } else if (type === 'SALIDA' || type === 'RETORNO_PEPS' || type === 'MERMA') {
      if (product.stock < qty) {
        return res.status(400).json({ error: `Stock insuficiente. Disponible: ${product.stock}, Solicitado: ${qty}` });
      }
      newStock -= qty;
    } else if (type === 'AJUSTE') {
      if (direction === 'INCREMENT') {
        newStock += qty;
      } else {
        if (product.stock < qty) {
          return res.status(400).json({ error: `Ajuste decrementa más del stock disponible.` });
        }
        newStock -= qty;
      }
    }

    const newMovement: Movement = {
      id: `MOV-${Date.now()}`,
      sku: product.sku,
      productName: product.name,
      type,
      quantity: (type === 'SALIDA' || type === 'MERMA' || (type === 'AJUSTE' && direction === 'DECREMENT')) ? -qty : qty,
      user,
      reason,
      reference: reference || 'N/A',
      pedimentoAsociado: pedimentoAsociado || undefined,
      timestamp: new Date().toISOString()
    };

    product.stock = newStock;
    product.anexo24Stock = newStock; // Keeps synchronized
    product.updatedAt = new Date().toISOString();
    db.products[productIndex] = product;
    db.movements.push(newMovement);

    saveToCloudCollection('products', product.sku, product);
    saveToCloudCollection('movements', newMovement.id, newMovement);
    writeDB(db);

    res.status(201).json({ movement: newMovement, product });
  });

  // 8. Get Pedimentos (Entrada y Salida)
  app.get('/api/pedimentos', (req, res) => {
    const db = readDB();
    res.json(db.pedimentos);
  });

  // 9. Register Pedimento (Validador 15 dígitos SAT + Regla 48 Horas)
  app.post('/api/pedimentos', (req, res) => {
    const db = readDB();
    const data = req.body;

    if (!data.numeroPedimento || !data.clave || !data.aduana || !data.patente || !data.fechaPago) {
      return res.status(400).json({ error: 'Número de pedimento, clave, aduana, patente y fecha de pago son obligatorios.' });
    }

    // Strict 15 digits check (or spaced format)
    const rawNumber = data.numeroPedimento.replace(/\s+/g, '');
    if (rawNumber.length !== 15 || !/^\d{15}$/.test(rawNumber)) {
      return res.status(400).json({ 
        error: 'El pedimento debe contener exactamente 15 dígitos numéricos (Formato SAT: 2 año + 2 aduana + 4 patente + 7 consecutivo).' 
      });
    }

    // Regla 48 horas
    const fechaRegistro = data.fechaRegistro || new Date().toISOString();
    const regla48h = calcularRegla48Horas(data.fechaPago, fechaRegistro);

    // Plazo 18 meses
    let permanenciaData = {};
    if (data.tipo === 'ENTRADA' && (data.clave === 'IN' || data.clave === 'AF')) {
      if (data.clave === 'AF') {
        permanenciaData = {
          fechaVencimiento18Meses: 'VIGENCIA PROGRAMA IMMEX',
          diasPermanencia: 0,
          diasRestantes: 9999,
          estadoPermanencia: 'VIGENTE'
        };
      } else {
        permanenciaData = calcularPermanencia(data.fechaPago);
      }
    }

    const formattedPedimento: Pedimento = {
      id: `PED-${data.tipo}-${Date.now()}`,
      numeroPedimento: data.numeroPedimento,
      tipo: data.tipo,
      clave: data.clave,
      aduana: data.aduana,
      patente: data.patente,
      fechaPago: data.fechaPago,
      fechaRegistro,
      horasTranscurridasRegistro: regla48h.horasTranscurridasRegistro,
      cumplePlazo48h: regla48h.cumplePlazo48h,
      proveedorCliente: data.proveedorCliente || 'Proveedor / Destinatario Extranjero',
      paisOrigenDestino: data.paisOrigenDestino || 'ESTADOS UNIDOS (USA)',
      tipoCambio: Number(data.tipoCambio) || 20.00,
      valorTotalUSD: Number(data.valorTotalUSD) || 0,
      creditoIvaIepsTotal: Number(data.creditoIvaIepsTotal) || 0,
      partidas: data.partidas || [],
      ...permanenciaData,
      expedienteId: `EXP-PED-${rawNumber}`,
      createdAt: new Date().toISOString()
    };

    // Auto-create initial Expediente Electrónico for this pedimento
    const initialExpediente: ExpedienteElectronico = {
      id: `EXP-PED-${rawNumber}`,
      numeroPedimento: data.numeroPedimento,
      lote: data.partidas?.[0]?.sku ? `LOT-${Date.now().toString().slice(-6)}` : 'LOT-INITIAL',
      fechaOperacion: data.fechaPago,
      fechaResguardoObligatorio: new Date(new Date(data.fechaPago).getTime() + (5 * 365 * 24 * 60 * 60 * 1000)).toISOString(),
      aniosRestantesResguardo: 5.0,
      porcentajeCompletitud: 50,
      nivelMaterialidad: 'REGULAR_FALTAN_SOPORTES',
      documentos: [
        {
          tipo: 'PEDIMENTO_FACTURA_CFDI',
          nombreArchivo: `PED-${rawNumber}_CFDI.pdf`,
          fechaDocumento: data.fechaPago.slice(0, 10),
          estatusValidacion: 'CARGADO',
          observaciones: 'Pedimento registrado y validado contra VUCEM.'
        },
        {
          tipo: 'TRANSPORTE_CARTA_PORTE',
          nombreArchivo: `CARTA-PORTE-${rawNumber}.pdf`,
          fechaDocumento: data.fechaPago.slice(0, 10),
          estatusValidacion: 'CARGADO',
          observaciones: 'Documento de transporte de cruce fronterizo.'
        },
        {
          tipo: 'RECEPCION_ALMACEN_WMS',
          nombreArchivo: `RECEPCION-ALMACEN-${rawNumber}.pdf`,
          fechaDocumento: fechaRegistro.slice(0, 10),
          estatusValidacion: 'CARGADO',
          observaciones: 'Recepción en bodega y marbetes impresos.'
        },
        {
          tipo: 'ORDEN_PRODUCCION_BOM',
          nombreArchivo: 'PENDIENTE_ORDEN_PROD.pdf',
          fechaDocumento: '',
          estatusValidacion: 'PENDIENTE',
          observaciones: 'Pendiente vincular a orden de transformación y BOM.'
        },
        {
          tipo: 'PEDIMENTO_RETORNO',
          nombreArchivo: 'PENDIENTE_RETORNO_RT.pdf',
          fechaDocumento: '',
          estatusValidacion: 'PENDIENTE',
          observaciones: 'Mercancía en permanencia temporal en almacén.'
        },
        {
          tipo: 'PRUEBA_PAGO_CONTRATOS',
          nombreArchivo: 'PENDIENTE_COMPROBANTES_SPEI.pdf',
          fechaDocumento: '',
          estatusValidacion: 'PENDIENTE',
          observaciones: 'Falta integrar comprobantes de transferencia y nómina.'
        }
      ]
    };

    db.pedimentos.unshift(formattedPedimento);
    db.expedientes.unshift(initialExpediente);

    // If Entrada, update product stocks
    if (formattedPedimento.tipo === 'ENTRADA') {
      formattedPedimento.partidas.forEach(partida => {
        const prod = db.products.find(p => p.sku === partida.sku);
        if (prod) {
          prod.stock += partida.cantidadOriginal;
          prod.anexo24Stock += partida.cantidadOriginal;
          prod.anexo30Stock += partida.cantidadOriginal;
          saveToCloudCollection('products', prod.sku, prod);
        }
      });
    }

    saveToCloudCollection('pedimentos', formattedPedimento.id, formattedPedimento);
    saveToCloudCollection('expedientes', initialExpediente.id, initialExpediente);
    writeDB(db);

    res.status(201).json(formattedPedimento);
  });

  // 10. Get Descargos PEPS
  app.get('/api/descargos/peps', (req, res) => {
    const db = readDB();
    res.json(db.descargosPEPS);
  });

  // 11. Run Automated PEPS Discharge (Motor de Descargos PEPS Anexo 24)
  app.post('/api/descargos/peps/execute', (req, res) => {
    const db = readDB();
    const { pedimentoSalidaId, sku, cantidadSalida } = req.body;

    if (!pedimentoSalidaId || !sku || !cantidadSalida || Number(cantidadSalida) <= 0) {
      return res.status(400).json({ error: 'Pedimento de salida, SKU y cantidad válida son requeridos.' });
    }

    const pedimentoSalida = db.pedimentos.find(p => p.id === pedimentoSalidaId);
    if (!pedimentoSalida) {
      return res.status(404).json({ error: 'Pedimento de salida no encontrado.' });
    }

    // Find all ENTRADA pedimentos that have available balance for this SKU, SORTED ASCENDING BY DATE (PEPS)
    const entradasConSaldo: { pedimento: Pedimento; partida: any }[] = [];
    
    db.pedimentos
      .filter(p => p.tipo === 'ENTRADA' && (p.clave === 'IN' || p.clave === 'AF'))
      .sort((a, b) => new Date(a.fechaPago).getTime() - new Date(b.fechaPago).getTime()) // FIFO oldest first
      .forEach(ped => {
        const partida = ped.partidas.find(pt => pt.sku.toLowerCase() === sku.toLowerCase() && pt.saldoDisponible > 0);
        if (partida) {
          entradasConSaldo.push({ pedimento: ped, partida });
        }
      });

    if (entradasConSaldo.length === 0) {
      return res.status(400).json({ 
        error: `No existen pedimentos de importación temporal con saldo disponible para el SKU ${sku}. Imposible realizar descargo PEPS.` 
      });
    }

    let pendientePorDescargar = Number(cantidadSalida);
    const descargosGenerados: DescargoPEPS[] = [];

    for (const item of entradasConSaldo) {
      if (pendientePorDescargar <= 0) break;

      const cantidadADescargar = Math.min(item.partida.saldoDisponible, pendientePorDescargar);
      item.partida.saldoDisponible -= cantidadADescargar;
      item.partida.cantidadDescargada += cantidadADescargar;
      pendientePorDescargar -= cantidadADescargar;

      const valorAmortizadoUSD = Math.round(cantidadADescargar * (item.partida.valorUnitarioUSD || 0) * 100) / 100;
      const creditoIvaAmortizado = Math.round((valorAmortizadoUSD * 0.16) * 100) / 100;

      const descargo: DescargoPEPS = {
        id: `DESC-PEPS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        fechaDescargo: new Date().toISOString(),
        pedimentoSalidaId: pedimentoSalida.id,
        numeroPedimentoSalida: pedimentoSalida.numeroPedimento,
        claveSalida: pedimentoSalida.clave,
        pedimentoEntradaId: item.pedimento.id,
        numeroPedimentoEntrada: item.pedimento.numeroPedimento,
        claveEntrada: item.pedimento.clave,
        sku,
        cantidadDescargada: cantidadADescargar,
        unidadMedida: item.partida.unidadMedida || 'PZA',
        valorAmortizadoUSD,
        creditoIvaAmortizado,
        saldoRestanteEntrada: item.partida.saldoDisponible,
        estatusAnexo30: 'TRANSMITIDO',
        fechaTransmisionSAT: new Date().toISOString(),
        acuseSAT: `ACUSE-SAT-A30-${Date.now().toString().slice(-8)}-TX`
      };

      descargosGenerados.push(descargo);
      db.descargosPEPS.unshift(descargo);
      saveToCloudCollection('descargosPEPS', descargo.id, descargo);

      // Check if pedimento is fully discharged
      const saldoTotalPedimento = item.pedimento.partidas.reduce((acc, pt) => acc + pt.saldoDisponible, 0);
      if (saldoTotalPedimento <= 0) {
        item.pedimento.estadoPermanencia = 'DESCARGADO_TOTAL';
      }
      saveToCloudCollection('pedimentos', item.pedimento.id, item.pedimento);
    }

    // Update physical and Anexo 24 stocks
    const product = db.products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
    if (product) {
      product.stock = Math.max(0, product.stock - (Number(cantidadSalida) - pendientePorDescargar));
      product.anexo24Stock = product.stock;
      product.anexo30Stock = product.stock; // Discharged in Anexo 30
      product.updatedAt = new Date().toISOString();
      saveToCloudCollection('products', product.sku, product);
    }

    // Register movement log
    const movLog: Movement = {
      id: `MOV-${Date.now()}`,
      sku,
      productName: product?.name || sku,
      type: 'RETORNO_PEPS',
      quantity: -(Number(cantidadSalida) - pendientePorDescargar),
      user: 'Motor PEPS Automático SAT',
      reason: `Descargo automático PEPS contra pedimento de salida ${pedimentoSalida.numeroPedimento}`,
      reference: pedimentoSalida.numeroPedimento,
      timestamp: new Date().toISOString(),
      pedimentoAsociado: pedimentoSalida.numeroPedimento
    };
    db.movements.push(movLog);
    saveToCloudCollection('movements', movLog.id, movLog);

    writeDB(db);

    res.json({
      success: true,
      descargosGenerados,
      pendienteSinSaldo: pendientePorDescargar,
      mensaje: `Descargo PEPS ejecutado exitosamente. Se amortizaron ${descargosGenerados.reduce((a, b) => a + b.cantidadDescargada, 0)} unidades.`
    });
  });

  // 12. Get BOMs (Listas de Materiales)
  app.get('/api/boms', (req, res) => {
    const db = readDB();
    res.json(db.boms);
  });

  // 13. Create BOM
  app.post('/api/boms', (req, res) => {
    const db = readDB();
    const newBOM: BillOfMaterials = req.body;

    if (!newBOM.skuProductoTerminado || !newBOM.componentes || newBOM.componentes.length === 0) {
      return res.status(400).json({ error: 'SKU de producto terminado y al menos un componente insumo son obligatorios.' });
    }

    newBOM.id = `BOM-${newBOM.skuProductoTerminado}-${Date.now().toString().slice(-4)}`;
    newBOM.fechaAprobacion = new Date().toISOString();

    db.boms.push(newBOM);
    saveToCloudCollection('boms', newBOM.id, newBOM);
    writeDB(db);

    res.status(201).json(newBOM);
  });

  // 14. Get Mermas & Destrucciones
  app.get('/api/mermas', (req, res) => {
    const db = readDB();
    res.json(db.mermas);
  });

  // 15. Create Merma / Acta de Destrucción
  app.post('/api/mermas', (req, res) => {
    const db = readDB();
    const mermaData: MermaRegistro = req.body;

    if (!mermaData.sku || !mermaData.cantidad || !mermaData.motivoTecnico) {
      return res.status(400).json({ error: 'SKU, cantidad y motivo técnico de merma son obligatorios.' });
    }

    mermaData.id = `MERMA-${Date.now()}`;
    mermaData.fecha = new Date().toISOString();
    mermaData.folioManifiesto = `MANIF-DEST-${Date.now().toString().slice(-6)}`;
    mermaData.estatus = 'REGISTRADO';

    db.mermas.unshift(mermaData);

    // Deduct stock for destructive merma
    const product = db.products.find(p => p.sku.toLowerCase() === mermaData.sku.toLowerCase());
    if (product && mermaData.destino === 'DESTRUCCION_FISCAL') {
      product.stock = Math.max(0, product.stock - Number(mermaData.cantidad));
      product.anexo24Stock = product.stock;
      saveToCloudCollection('products', product.sku, product);

      const movLog: Movement = {
        id: `MOV-${Date.now()}`,
        sku: product.sku,
        productName: product.name,
        type: 'MERMA',
        quantity: -Number(mermaData.cantidad),
        user: 'Control de Mermas SAT',
        reason: `Merma justificada técnicamente: ${mermaData.motivoTecnico} (Manifiesto ${mermaData.folioManifiesto})`,
        reference: mermaData.folioManifiesto,
        timestamp: new Date().toISOString()
      };
      db.movements.push(movLog);
      saveToCloudCollection('movements', movLog.id, movLog);
    }

    saveToCloudCollection('mermas', mermaData.id, mermaData);
    writeDB(db);

    res.status(201).json(mermaData);
  });

  // 16. Get Tomas Físicas de Inventario Cíclico
  app.get('/api/inventarios-ciclicos', (req, res) => {
    const db = readDB();
    res.json(db.inventariosCiclicos);
  });

  // 17. Register Toma Física de Inventario (Auditoría Cíclica)
  app.post('/api/inventarios-ciclicos', (req, res) => {
    const db = readDB();
    const { sku, auditorResponsable, zonaAlmacen, conteoFisicoReal, justificacionInvestigacion } = req.body;

    const product = db.products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    const conteo = Number(conteoFisicoReal);
    const saldoTeorico = product.anexo24Stock;
    const diferencia = conteo - saldoTeorico;

    let tipoDiscrepancia: 'CUADRADO' | 'FALTANTE_RIESGO_CONTRABANDO' | 'SOBRANTE_SIN_PEDIMENTO' = 'CUADRADO';
    let montoRiesgoMultaMXN = 0;

    if (diferencia < 0) {
      tipoDiscrepancia = 'FALTANTE_RIESGO_CONTRABANDO';
      // Multa 250% a 300% del valor comercial en MXN (tipo cambio aprox 20)
      const faltanteAbs = Math.abs(diferencia);
      const valorComercialMXN = faltanteAbs * (product.costPrice || 10) * 20;
      montoRiesgoMultaMXN = Math.round(valorComercialMXN * 2.75); // promedio 275%
    } else if (diferencia > 0) {
      tipoDiscrepancia = 'SOBRANTE_SIN_PEDIMENTO';
    }

    const nuevaToma: TomaFisicaInventario = {
      id: `INV-CICL-${Date.now()}`,
      fechaToma: new Date().toISOString(),
      auditorResponsable: auditorResponsable || 'Auditor de Almacén',
      zonaAlmacen: zonaAlmacen || product.locationRack ? `${product.locationRack?.pasillo}/${product.locationRack?.rack}` : 'BODEGA GENERAL',
      sku: product.sku,
      nombre: product.name,
      saldoTeoricoAnexo24: saldoTeorico,
      conteoFisicoReal: conteo,
      diferencia,
      tipoDiscrepancia,
      montoRiesgoMultaMXN,
      justificacionInvestigacion: justificacionInvestigacion || (diferencia === 0 ? 'Conteo cuadrado sin observaciones' : 'Discrepancia en proceso de aclaración'),
      estatusAjuste: diferencia === 0 ? 'CONCILIADO' : 'PENDIENTE_AUTORIZACION',
      actaFolio: `ACTA-INV-${Date.now().toString().slice(-6)}`
    };

    // Update physical stock to counted reality
    product.stock = conteo;
    saveToCloudCollection('products', product.sku, product);

    db.inventariosCiclicos.unshift(nuevaToma);
    saveToCloudCollection('inventariosCiclicos', nuevaToma.id, nuevaToma);
    writeDB(db);

    res.status(201).json(nuevaToma);
  });

  // 18. Get Expedientes Electrónicos (5 Años de Materialidad)
  app.get('/api/expedientes', (req, res) => {
    const db = readDB();
    res.json(db.expedientes);
  });

  // 19. Get Conciliación Tripartita Anexo 30
  app.get('/api/anexo30/conciliacion', (req, res) => {
    const db = readDB();
    const items: ConciliacionAnexo30Item[] = db.products.map(p => {
      const diffFisicoVs24 = p.stock - p.anexo24Stock;
      const diff24Vs30 = p.anexo24Stock - p.anexo30Stock;

      let estadoCuadratura: 'CUADRATURA_TOTAL' | 'DISCREPANCIA_FISICA' | 'PENDIENTE_TRANSMISION_SAT' | 'RIESGO_CREDITO_FISCAL' = 'CUADRATURA_TOTAL';
      let accionRequerida = 'Ninguna. Inventario 100% conciliado.';
      let creditoFiscalIVAEnRiesgoUSD = 0;

      if (diffFisicoVs24 !== 0) {
        estadoCuadratura = 'DISCREPANCIA_FISICA';
        accionRequerida = 'Realizar conteo físico cíclico y levantar acta de ajuste.';
        creditoFiscalIVAEnRiesgoUSD = Math.round(Math.abs(diffFisicoVs24) * p.costPrice * 0.16 * 100) / 100;
      } else if (diff24Vs30 !== 0) {
        estadoCuadratura = 'PENDIENTE_TRANSMISION_SAT';
        accionRequerida = 'Transmitir electrónicamente descargos PEPS al Portal Anexo 30 del SAT.';
        creditoFiscalIVAEnRiesgoUSD = Math.round(Math.abs(diff24Vs30) * p.costPrice * 0.16 * 100) / 100;
      }

      return {
        sku: p.sku,
        descripcion: p.name,
        saldoFisicoAlmacen: p.stock,
        saldoAnexo24: p.anexo24Stock,
        saldoPortalAnexo30: p.anexo30Stock,
        diferenciaFisicoVs24: diffFisicoVs24,
        diferencia24Vs30: diff24Vs30,
        estadoCuadratura,
        creditoFiscalIVAEnRiesgoUSD,
        accionRequerida
      };
    });

    res.json(items);
  });

  // 20. Sync Anexo 30 to SAT Portal (Simulación de transmisión electrónica obligatoria)
  app.post('/api/anexo30/transmitir', (req, res) => {
    const db = readDB();
    const { sku } = req.body;

    let affectedCount = 0;
    db.products.forEach(p => {
      if (!sku || p.sku.toLowerCase() === sku.toLowerCase()) {
        if (p.anexo24Stock !== p.anexo30Stock) {
          p.anexo30Stock = p.anexo24Stock;
          affectedCount++;
          saveToCloudCollection('products', p.sku, p);
        }
      }
    });

    // Mark pending descargos as transmitidos
    db.descargosPEPS.forEach(d => {
      if (d.estatusAnexo30 === 'PENDIENTE_ENVIO') {
        d.estatusAnexo30 = 'TRANSMITIDO';
        d.fechaTransmisionSAT = new Date().toISOString();
        d.acuseSAT = `ACUSE-SAT-A30-${Date.now().toString().slice(-8)}-TX`;
        saveToCloudCollection('descargosPEPS', d.id, d);
      }
    });

    writeDB(db);

    res.json({
      success: true,
      mensaje: `Transmisión electrónica al Portal Anexo 30 completada. ${affectedCount} partidas cuadradas al 100%.`,
      acuseSAT: `ACUSE-SAT-A30-TRANSMISION-${Date.now().toString().slice(-8)}`
    });
  });

  // 21. Get/Refresh SAT Audit Access (Apartado C)
  app.get('/api/sat-audit/access', (req, res) => {
    const db = readDB();
    res.json(db.satAuditAccess);
  });

  app.post('/api/sat-audit/refresh-token', (req, res) => {
    const db = readDB();
    db.satAuditAccess.tokenAuditor = `SAT-AUDIT-IMMEX-LIVE-${Math.floor(1000000 + Math.random() * 9000000)}`;
    db.satAuditAccess.fechaGeneracion = new Date().toISOString();
    db.satAuditAccess.expiraEn = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.satAuditAccess.consultasRealizadas = 0;
    
    writeDB(db);
    res.json(db.satAuditAccess);
  });

  // --- ACTIVOS FIJOS (MAQUINARIA Y EQUIPO) Y PROTOCOLO DE AUDITORÍA PREVENTIVA (PARTE 2) ---
  app.get('/api/activos-fijos', (req, res) => {
    const db = readDB();
    res.json(db.activosFijos || []);
  });

  app.post('/api/activos-fijos', (req, res) => {
    const db = readDB();
    const { 
      noInventario, 
      descripcion, 
      marca, 
      modelo, 
      numeroSeriePlaca, 
      pedimentoAF, 
      numeroSeriePedimento, 
      ubicacionFisica,
      estatus,
      submaquiladorNombre,
      avisoTrasladoFolio,
      fotos,
      expedienteAF
    } = req.body;

    if (!noInventario || !descripcion || !marca || !modelo || !numeroSeriePlaca || !pedimentoAF) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para el registro de activo fijo.' });
    }

    const seriePlacaTrim = (numeroSeriePlaca || '').trim();
    const seriePedTrim = (numeroSeriePedimento || '').trim();
    const coincidenciaExactaSerie = seriePlacaTrim === seriePedTrim;

    let discrepanciaDetalle = undefined;
    if (!coincidenciaExactaSerie) {
      discrepanciaDetalle = `DISCREPANCIA CRÍTICA (Art. 151 Fracc. II Ley Aduanera): Placa física="${seriePlacaTrim}" vs Pedimento="${seriePedTrim}". Cualquier errata u omisión de un carácter invalida la legal estancia del bien y faculta al SAT para embargo precautorio. Se requiere Rectificación R1 (Art. 89 LA).`;
    }

    const newAF: ActivoFijoItem = {
      id: `AF-${Date.now()}`,
      noInventario,
      descripcion,
      marca,
      modelo,
      numeroSeriePlaca: seriePlacaTrim,
      pedimentoAF,
      numeroSeriePedimento: seriePedTrim,
      coincidenciaExactaSerie,
      discrepanciaDetalle,
      ubicacionFisica: ubicacionFisica || 'Bodega General',
      estatus: estatus || 'ACTIVO',
      submaquiladorNombre,
      avisoTrasladoFolio,
      marbeteRFID: `RFID-${noInventario}-${Date.now().toString().slice(-4)}`,
      codigoQR: `QR-IMMEX-AF-${noInventario}-${marca.toUpperCase()}`,
      fotos: fotos || {
        vistaGeneralUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        placaFabricanteUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
        marbeteControlInternoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'
      },
      expedienteAF: expedienteAF || { completo: true },
      fechaUltimaAuditoriaFisica: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    db.activosFijos.push(newAF);
    saveToCloudCollection('activosFijos', newAF.id, newAF);
    writeDB(db);

    res.status(201).json(newAF);
  });

  app.patch('/api/activos-fijos/:id', (req, res) => {
    const db = readDB();
    const { id } = req.params;
    const itemIndex = db.activosFijos.findIndex(a => a.id === id);
    if (itemIndex === -1) return res.status(404).json({ error: 'Activo fijo no encontrado' });

    const updated = { ...db.activosFijos[itemIndex], ...req.body };
    
    // Recalculate series matching
    if (req.body.numeroSeriePlaca || req.body.numeroSeriePedimento) {
      const p1 = (updated.numeroSeriePlaca || '').trim();
      const p2 = (updated.numeroSeriePedimento || '').trim();
      updated.coincidenciaExactaSerie = (p1 === p2);
      if (updated.coincidenciaExactaSerie) {
        delete updated.discrepanciaDetalle;
      } else {
        updated.discrepanciaDetalle = `DISCREPANCIA DETECTADA: Placa física="${p1}" vs Pedimento="${p2}". Requiere Rectificación R1.`;
      }
    }

    db.activosFijos[itemIndex] = updated;
    saveToCloudCollection('activosFijos', id, updated);
    writeDB(db);

    res.json(updated);
  });

  // Rectificación R1 de Pedimento AF (Art. 89 de la Ley Aduanera)
  app.post('/api/activos-fijos/:id/rectificar-r1', (req, res) => {
    const db = readDB();
    const { id } = req.params;
    const { patenteAduanal, aduanaClave, justificacion } = req.body;
    const item = db.activosFijos.find(a => a.id === id);
    if (!item) return res.status(404).json({ error: 'Activo fijo no encontrado' });

    const folioR1 = `${item.pedimentoAF.slice(0, 10)} (R1-RECT-${Date.now().toString().slice(-4)})`;
    item.numeroSeriePedimento = item.numeroSeriePlaca; // Saneamiento: serie ahora coincide 100%
    item.coincidenciaExactaSerie = true;
    item.discrepanciaDetalle = undefined;
    item.pedimentoAF = folioR1;
    item.fechaUltimaAuditoriaFisica = new Date().toISOString();
    if (!item.expedienteAF) item.expedienteAF = { completo: true };
    item.expedienteAF.pedimentoAFUrl = `RECTIFICACION-R1-${folioR1.replace(/\s+/g, '_')}.pdf`;
    item.expedienteAF.completo = true;

    // Log the rectification in audit history
    const auditRecord: AuditoriaActivoFijoResult = {
      id: `RECT-R1-${Date.now()}`,
      fecha: new Date().toISOString(),
      auditorResponsable: 'Lic. Mariana Valdez (Auditoría de Control Aduanero)',
      totalActivosInspeccionados: 1,
      activosConformes: 1,
      inconsistenciasMecanograficas: 0,
      activosFaltantes: 0,
      activosSobrantesSinPedimento: 0,
      activosConSubmaquilador: item.estatus === 'SUBMAQUILADOR' ? 1 : 0,
      estatusPlanSaneamiento: 'CONCILIADO_TOTAL',
      resumenHallazgos: `Regularización exitosa mediante Rectificación R1 bajo Art. 89 LA para activo ${item.noInventario} (${item.descripcion}). Serie de pedimento corregida a "${item.numeroSeriePlaca}". Blindaje contra embargo precautorio Art. 151 LA restablecido.`
    };
    db.auditoriasActivoFijo.unshift(auditRecord);

    saveToCloudCollection('activosFijos', id, item);
    writeDB(db);

    res.json({
      success: true,
      mensaje: `Rectificación R1 aplicada exitosamente bajo Art. 89 Ley Aduanera. Pedimento rectificado: ${folioR1}.`,
      activo: item,
      auditRecord
    });
  });

  // Protocolo de Auditoría Preventiva de Activo Fijo (Paso 1: Barrido, Paso 2: Cruce, Paso 3: Plan)
  app.get('/api/auditorias-activo-fijo', (req, res) => {
    const db = readDB();
    res.json(db.auditoriasActivoFijo || []);
  });

  app.post('/api/auditorias-activo-fijo/ejecutar', (req, res) => {
    const db = readDB();
    const { auditorResponsable } = req.body;

    const activos = db.activosFijos || [];
    const total = activos.length;
    let conformes = 0;
    let inconsistencias = 0;
    let conSubmaquilador = 0;

    activos.forEach(a => {
      a.fechaUltimaAuditoriaFisica = new Date().toISOString();
      if (!a.coincidenciaExactaSerie) {
        inconsistencias++;
      } else {
        conformes++;
      }
      if (a.estatus === 'SUBMAQUILADOR') {
        conSubmaquilador++;
      }
    });

    const estatusPlanSaneamiento = inconsistencias > 0 ? 'REQUERIMIENTO_RECTIFICACION_R1' : 'CONCILIADO_TOTAL';
    const resumen = inconsistencias > 0
      ? `Auditoría preventiva finalizada: Se inspeccionaron ${total} equipos en planta. Se detectó ${inconsistencias} activo(s) con erratas mecanográficas en número de serie vs pedimento AF. Riesgo inminente de embargo precautorio según Art. 151 LA si el SAT realiza visita domiciliaria. Se requiere tramitar Rectificación R1 (Art. 89 LA).`
      : `Auditoría preventiva exitosa: 100% de la maquinaria (${total} activos) cuenta con coincidencia exacta de placa vs pedimento AF, placas inalterables visibles y expediente electrónico completo.`;

    const nuevaAuditoria: AuditoriaActivoFijoResult = {
      id: `AUD-AF-${Date.now()}`,
      fecha: new Date().toISOString(),
      auditorResponsable: auditorResponsable || 'Auditor de Control Aduanero Interno',
      totalActivosInspeccionados: total,
      activosConformes: conformes,
      inconsistenciasMecanograficas: inconsistencias,
      activosFaltantes: 0,
      activosSobrantesSinPedimento: 0,
      activosConSubmaquilador: conSubmaquilador,
      estatusPlanSaneamiento,
      resumenHallazgos: resumen
    };

    db.auditoriasActivoFijo.unshift(nuevaAuditoria);
    writeDB(db);

    res.json({
      success: true,
      auditoria: nuevaAuditoria,
      activos
    });
  });

  // --- CONCILIACIÓN SCCCyG (ANEXO 30) Y MAPEO DE DISCREPANCIAS FRECUENTES (PARTE 1) ---
  app.get('/api/anexo30/scccyg-reportes', (req, res) => {
    const db = readDB();
    const pedimentosEntrada = db.pedimentos.filter(p => p.tipo === 'ENTRADA');

    const reportes = pedimentosEntrada.map(ped => {
      const descargosAsociados = db.descargosPEPS.filter(d => d.pedimentoEntradaId === ped.id || d.numeroPedimentoEntrada === ped.numeroPedimento);
      const totalDescargadoPEPS = descargosAsociados.reduce((acc, d) => acc + d.cantidadDescargada, 0);
      const totalIvaAmortizadoPEPS = descargosAsociados.reduce((acc, d) => acc + d.creditoIvaAmortizado, 0);

      // SCCCyG (Portal SAT) simulation:
      // Si hay discrepancias para este pedimento, el saldo en el portal del SAT tiene un desfase
      const discrepancia = db.discrepanciasAnexo30.find(d => d.pedimentoAfectado === ped.numeroPedimento && d.estatusSolucion === 'PENDIENTE');
      const saldoSCCCyG = discrepancia ? (ped.partidas[0]?.saldoDisponible || 0) + 20 : (ped.partidas[0]?.saldoDisponible || 0);
      const creditoIvaSCCCyG = discrepancia ? (ped.creditoIvaIepsTotal - totalIvaAmortizadoPEPS + discrepancia.montoIvaDiscrepanciaUSD) : (ped.creditoIvaIepsTotal - totalIvaAmortizadoPEPS);

      return {
        numeroPedimento: ped.numeroPedimento,
        clave: ped.clave,
        fechaPago: ped.fechaPago,
        fraccionArancelaria: ped.partidas[0]?.fraccion || '8542.31.01',
        sku: ped.partidas[0]?.sku || 'INS-01',
        descripcion: ped.partidas[0]?.descripcion || 'Componente',
        cantidadImportada: ped.partidas[0]?.cantidadOriginal || 0,
        descargadoAnexo24: totalDescargadoPEPS,
        saldoAnexo24: ped.partidas[0]?.saldoDisponible || 0,
        saldoPortalSCCCyG: saldoSCCCyG,
        diferenciaUnidades: (ped.partidas[0]?.saldoDisponible || 0) - saldoSCCCyG,
        creditoIvaTotalUSD: ped.creditoIvaIepsTotal,
        creditoIvaAmortizadoUSD: totalIvaAmortizadoPEPS,
        creditoIvaSaldoAnexo24USD: Math.round((ped.creditoIvaIepsTotal - totalIvaAmortizadoPEPS) * 100) / 100,
        creditoIvaSaldoPortalSCCCyGUSD: Math.round(creditoIvaSCCCyG * 100) / 100,
        estadoConciliacion: (ped.partidas[0]?.saldoDisponible || 0) === saldoSCCCyG ? 'CONCILIADO' : 'DESCUADRADO',
        discrepanciaRef: discrepancia
      };
    });

    res.json(reportes);
  });

  // Mapeo de Discrepancias Frecuentes
  app.get('/api/anexo30/discrepancias', (req, res) => {
    const db = readDB();
    res.json(db.discrepanciasAnexo30 || []);
  });

  app.post('/api/anexo30/discrepancias/:id/resolver', (req, res) => {
    const db = readDB();
    const { id } = req.params;
    const { tipoResolucion, notas } = req.body;
    const disc = db.discrepanciasAnexo30.find(d => d.id === id);
    if (!disc) return res.status(404).json({ error: 'Discrepancia no encontrada' });

    if (tipoResolucion === 'AVISO_ACLARACION_SAT') {
      disc.estatusSolucion = 'ACLARADO_SAT';
      disc.folioAvisoAclaracionSAT = `SAT-ACLARACION-INC-${Date.now().toString().slice(-6)}`;
    } else {
      disc.estatusSolucion = 'TRANSMITIDO_CORREGIDO';
    }

    // Cuadrar el stock de Anexo 30 en el producto correspondiente
    const product = db.products.find(p => p.sku === disc.sku);
    if (product) {
      product.anexo30Stock = product.anexo24Stock;
      saveToCloudCollection('products', product.sku, product);
    }

    writeDB(db);

    res.json({
      success: true,
      mensaje: `Discrepancia solventada exitosamente: ${disc.detalleTecnico}`,
      discrepancia: disc
    });
  });

  // Transmisiones electrónicas al SCCCyG y Generador de Layout XML
  app.get('/api/anexo30/transmisiones-scccyg', (req, res) => {
    const db = readDB();
    res.json(db.scccgyTransmisiones || []);
  });

  app.post('/api/anexo30/transmisiones-scccyg/generar-layout-xml', (req, res) => {
    const db = readDB();
    const { tipoInforme, periodo } = req.body;

    const descargos = db.descargosPEPS;
    const totalDescargos = descargos.length;
    const totalIva = descargos.reduce((a, d) => a + d.creditoIvaAmortizado, 0);

    const timestamp = new Date().toISOString();
    const rfcEmpresa = db.satAuditAccess.empresaRFC || 'IMX891024KL8';
    const immex = db.satAuditAccess.programaIMMEX || 'IMMEX-REG-2024-9981-CHIH';

    // Official SAT SCCCyG Anexo 30 XML Layout
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<SCCCyG:InformeDescargos xmlns:SCCCyG="http://www.sat.gob.mx/esquemas/retornos/anexo30" Version="1.2" RFC="${rfcEmpresa}" ProgramaIMMEX="${immex}" FechaGeneracion="${timestamp}">
  <Encabezado Periodo="${periodo || '2026-OCTUBRE'}" TotalDescargos="${totalDescargos}" MontoTotalCreditoIVA="${totalIva.toFixed(2)}"/>
  <Descargos>
${descargos.map(d => `    <Descargo Folio="${d.id}" PedimentoEntrada="${d.numeroPedimentoEntrada}" ClaveEntrada="${d.claveEntrada}" PedimentoSalida="${d.numeroPedimentoSalida}" ClaveSalida="${d.claveSalida}" FraccionArancelaria="${d.sku}" CantidadDescargada="${d.cantidadDescargada}" MontoIVAAmortizado="${d.creditoIvaAmortizado.toFixed(2)}" FechaDescargo="${d.fechaDescargo.slice(0, 10)}"/>`).join('\n')}
  </Descargos>
  <SelloDigitalSAT FirmaAutorizada="SAT-CERT-VAL-SHA256:${crypto.randomBytes(16).toString('hex')}"/>
</SCCCyG:InformeDescargos>`;

    const nuevaTransmision: ScccgyTransmision = {
      id: `TX-SCCCYG-${Date.now().toString().slice(-6)}`,
      periodo: periodo || '2026-OCTUBRE',
      fechaTransmision: timestamp,
      tipoInforme: tipoInforme || 'DESCARGO_PEPS',
      totalDescargos,
      montoIvaAbonadoUSD: totalIva,
      estatus: 'ACEPTADO_VALIDADO',
      acuseSATFirma: `SAT-SCCCYG-AUTORIZADO-${Date.now().toString().slice(-8)}`,
      xmlGenerado: xml
    };

    db.scccgyTransmisiones.unshift(nuevaTransmision);

    // Synchronize all product anexo30Stock with anexo24Stock
    db.products.forEach(p => {
      p.anexo30Stock = p.anexo24Stock;
    });

    writeDB(db);

    res.json({
      success: true,
      mensaje: 'Layout XML generado y transmitido exitosamente al SCCCyG con Acuse de Aceptación del SAT.',
      transmision: nuevaTransmision,
      xml
    });
  });

  // Presentar formal Aviso de Aclaración de Saldos (Inconformidad ante el SAT)
  app.post('/api/anexo30/aclaracion-sat', (req, res) => {
    const db = readDB();
    const { pedimento, sku, motivoInconformidad } = req.body;

    const folioAclaracion = `SAT-INCONF-A30-${Date.now().toString().slice(-6)}`;
    const acuse = {
      folioAclaracion,
      fechaPresentacion: new Date().toISOString(),
      pedimento,
      sku,
      motivo: motivoInconformidad || 'Error técnico en el cálculo de saldos vencidos del portal SCCCyG del SAT',
      estatus: 'EN_TRAMITE_SAT',
      plazoRespuestaDias: 15,
      fundamentoLegal: 'Regla 7.2.1 de las RGCE y Código Fiscal de la Federación Art. 34'
    };

    // Update discrepancy if matched
    const disc = db.discrepanciasAnexo30.find(d => d.pedimentoAfectado === pedimento);
    if (disc) {
      disc.estatusSolucion = 'ACLARADO_SAT';
      disc.folioAvisoAclaracionSAT = folioAclaracion;
    }

    writeDB(db);

    res.json({
      success: true,
      mensaje: `Aviso de Aclaración registrado con folio oficial: ${folioAclaracion}`,
      acuse
    });
  });

  // Checklist de Control Mensual de Blindaje IMMEX
  app.get('/api/checklist-mensual', (req, res) => {
    const db = readDB();
    res.json(db.checklistMensual || []);
  });

  app.patch('/api/checklist-mensual/:id', (req, res) => {
    const db = readDB();
    const { id } = req.params;
    const { completado, observaciones, responsable } = req.body;

    const item = db.checklistMensual.find(c => c.id === id);
    if (!item) return res.status(404).json({ error: 'Item de checklist no encontrado' });

    if (completado !== undefined) item.completado = completado;
    if (observaciones !== undefined) item.observaciones = observaciones;
    if (responsable !== undefined) item.responsable = responsable;
    if (completado) item.fechaVerificacion = new Date().toISOString().slice(0, 10);

    writeDB(db);
    res.json(item);
  });

  // 22. Get Suppliers
  app.get('/api/suppliers', (req, res) => {
    const db = readDB();
    res.json(db.suppliers);
  });

  // 23. Add Supplier
  app.post('/api/suppliers', (req, res) => {
    const db = readDB();
    const { name, contact, phone, email, rfcTaxId, pais, tipoProveedor } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre y correo del proveedor son obligatorios.' });
    }

    const newSupplier: Supplier = {
      id: `SUP-${Date.now()}`,
      name,
      contact: contact || 'N/A',
      phone: phone || 'N/A',
      email,
      rfcTaxId: rfcTaxId || 'XEXX010101000',
      pais: pais || 'ESTADOS UNIDOS',
      tipoProveedor: tipoProveedor || 'EXTRANJERO',
      productsCount: 0
    };

    db.suppliers.push(newSupplier);
    saveToCloudCollection('suppliers', newSupplier.id, newSupplier);
    writeDB(db);
    res.status(201).json(newSupplier);
  });

  // 24. Webhooks
  app.get('/api/webhooks', (req, res) => {
    const db = readDB();
    res.json(db.webhooks);
  });

  app.post('/api/webhooks', (req, res) => {
    const db = readDB();
    const { url, events } = req.body;
    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'URL y al menos un evento son requeridos.' });
    }

    const newWebhook: Webhook = {
      id: `WH-${Date.now()}`,
      url,
      events,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    db.webhooks.push(newWebhook);
    writeDB(db);
    res.status(201).json(newWebhook);
  });

  app.patch('/api/webhooks/:id/toggle', (req, res) => {
    const db = readDB();
    const { id } = req.params;
    const index = db.webhooks.findIndex(w => w.id === id);
    if (index === -1) return res.status(404).json({ error: 'Webhook no encontrado' });

    db.webhooks[index].isActive = !db.webhooks[index].isActive;
    writeDB(db);
    res.json(db.webhooks[index]);
  });

  app.delete('/api/webhooks/:id', (req, res) => {
    const db = readDB();
    const { id } = req.params;
    db.webhooks = db.webhooks.filter(w => w.id !== id);
    writeDB(db);
    res.json({ success: true });
  });

  app.get('/api/webhook-logs', (req, res) => {
    const db = readDB();
    res.json(db.webhookLogs.slice(0, 100));
  });

  // --- USER AUTHENTICATION ENDPOINTS ---
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const emailKey = email.trim().toLowerCase();
    const passwordHash = hashPassword(password);

    try {
      if (dbFirestore) {
        const userDoc = await dbFirestore.collection('users').doc(emailKey).get();
        if (userDoc.exists) {
          return res.status(400).json({ error: 'El usuario ya existe en la nube.' });
        }

        const newUser = { email: emailKey, passwordHash, name, role, createdAt: new Date().toISOString() };
        await dbFirestore.collection('users').doc(emailKey).set(newUser);
        
        const token = crypto.randomBytes(32).toString('hex');
        const sessionUser = { email: emailKey, name, role };
        activeSessions.set(token, sessionUser);

        res.status(201).json({ user: sessionUser, token });
      } else {
        const token = crypto.randomBytes(32).toString('hex');
        const sessionUser = { email: emailKey, name, role };
        activeSessions.set(token, sessionUser);
        res.status(201).json({ user: sessionUser, token });
      }
    } catch (err) {
      console.error('Error during register:', err);
      res.status(500).json({ error: 'Error del servidor al registrar.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'El correo y la contraseña son requeridos.' });
    }

    const emailKey = email.trim().toLowerCase();
    const passwordHash = hashPassword(password);

    try {
      if (dbFirestore) {
        const userDoc = await dbFirestore.collection('users').doc(emailKey).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData?.passwordHash === passwordHash) {
            const token = crypto.randomBytes(32).toString('hex');
            const sessionUser = { email: emailKey, name: userData.name, role: userData.role };
            activeSessions.set(token, sessionUser);
            return res.json({ user: sessionUser, token });
          }
        }
      }
      
      // Default demo login fallback for easy compliance review
      const demoUser = { email: emailKey, name: 'Auditor Aduanero IMMEX', role: 'Administrador de Anexo 24/30' };
      const token = crypto.randomBytes(32).toString('hex');
      activeSessions.set(token, demoUser);
      res.json({ user: demoUser, token });
    } catch (err) {
      console.error('Error during login:', err);
      res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado.' });
    }

    const token = authHeader.split(' ')[1];
    const sessionUser = activeSessions.get(token);

    if (!sessionUser) {
      // Fallback for seamless developer preview
      return res.json({ user: { email: 'auditor.immex@sat-control.mx', name: 'Ing. Rodrigo Salinas', role: 'Gerente de Cumplimiento Aduanero' } });
    }

    res.json({ user: sessionUser });
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      activeSessions.delete(token);
    }
    res.json({ success: true, message: 'Sesión cerrada correctamente.' });
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

runServer().catch((err) => {
  console.error('Server failed to start:', err);
});
