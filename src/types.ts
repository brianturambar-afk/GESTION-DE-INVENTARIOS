/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- TIPOS DE BIENES SEGÚN NORMATIVA IMMEX ---
export type BienType = 
  | 'MATERIA_PRIMA'     // Plazo máx: 18 meses (Anexo 24 / Ley Aduanera Art. 108)
  | 'COMPONENTE'        // Plazo máx: 18 meses
  | 'PRODUCTO_TERMINADO'// Mercancía transformada para retorno
  | 'ACTIVO_FIJO'       // Maquinaria y equipo: Durante vigencia IMMEX (placado obligatorio)
  | 'CONTENEDOR_TRAILER'// Cajas y contenedores: Durante vigencia IMMEX
  | 'MRO_INSUMO';       // Mantenimiento, Reparación y Operación

export interface Product {
  sku: string; // Número de parte / SKU
  name: string;
  category: string;
  bienType: BienType;
  fraccionArancelaria: string; // Fracción arancelaria TIGIE (8 o 10 dígitos)
  unidadMedida: 'PZA' | 'KG' | 'LT' | 'MTR' | 'JGO' | 'MILLAR';
  costPrice: number; // Costo unitario USD
  salePrice: number; // Precio unitario estimado retorno USD
  stock: number; // Stock físico actual en almacén
  anexo24Stock: number; // Saldo registrado en Anexo 24
  anexo30Stock: number; // Saldo reportado en Portal SAT Anexo 30
  minStock: number;
  suppliers: string[];
  
  // Control de Ubicación Física en Almacén
  locationRack?: {
    pasillo: string;
    rack: string;
    nivel: string;
    posicion: string;
  };
  loteActual?: string;

  // Placado para Activo Fijo / Maquinaria
  placadoActivoFijo?: {
    marca: string;
    modelo: string;
    numeroSerie: string;
    pedimentoImportacion: string;
    marbeteTag: string;
    codigoBarrasRFID: string;
    fechaInstalacion: string;
  };

  createdAt: string;
  updatedAt: string;
}

// --- CLAVES Y TIPOS DE PEDIMENTOS ADUANEROS (ANEXO 22 & 24) ---
export type ClavePedimento = 
  | 'IN' // Importación temporal de bienes para elaboración/transformación IMMEX
  | 'AF' // Importación temporal de activo fijo / maquinaria IMMEX
  | 'RT' // Retorno de mercancías elaboradas/transformadas en el extranjero
  | 'V1' // Transferencias virtuales entre empresas con programa IMMEX
  | 'V5' // Retorno de mercancías importadas temporalmente transferidas a residentes en el país
  | 'A1' // Importación o exportación definitiva (nacionalización o regularización)
  | 'R1' // Rectificación de pedimento (corrección de número de serie, modelo, etc.)
  | 'H1';// Retorno en su mismo estado

export interface PedimentoItem {
  id: string;
  sku: string;
  descripcion: string;
  fraccion: string;
  cantidadOriginal: number;
  cantidadDescargada: number;
  saldoDisponible: number;
  unidadMedida: string;
  valorUnitarioUSD: number;
  valorTotalUSD: number;
  ivaIepsCredito: number; // Crédito fiscal otorgado por Certificación IVA/IEPS
}

export interface Pedimento {
  id: string;
  numeroPedimento: string; // Formato oficial SAT: 15 dígitos (AA  AA  PPPP  SSSSSSS)
  tipo: 'ENTRADA' | 'SALIDA';
  clave: ClavePedimento;
  aduana: string; // e.g. "470 - Ciudad Juárez", "240 - Nuevo Laredo", "800 - Colombia NL"
  patente: string; // Patente aduanal (4 dígitos)
  fechaPago: string; // Fecha de pago y despacho aduanero
  fechaRegistro: string; // Fecha de captura en sistema (Regla 48 Horas)
  horasTranscurridasRegistro: number; // Cálculo de horas
  cumplePlazo48h: boolean; // Semáforo 48h
  proveedorCliente: string;
  paisOrigenDestino: string;
  tipoCambio: number;
  valorTotalUSD: number;
  creditoIvaIepsTotal: number;
  
  // Plazo de Permanencia (Solo para Entradas)
  fechaVencimiento18Meses?: string;
  diasPermanencia?: number;
  diasRestantes?: number;
  estadoPermanencia?: 'VIGENTE' | 'PROXIMO_A_VENCER' | 'VENCIDO' | 'DESCARGADO_TOTAL';

  // Partidas del pedimento
  partidas: PedimentoItem[];
  
  // Expediente Digital de Materialidad (5 Años)
  expedienteId?: string;
  
  createdAt: string;
}

// --- DESCARGO PEPS (PRIMERAS ENTRADAS, PRIMERAS SALIDAS) ---
export interface DescargoPEPS {
  id: string;
  fechaDescargo: string;
  pedimentoSalidaId: string;
  numeroPedimentoSalida: string;
  claveSalida: ClavePedimento;
  pedimentoEntradaId: string;
  numeroPedimentoEntrada: string;
  claveEntrada: ClavePedimento;
  sku: string;
  cantidadDescargada: number;
  unidadMedida: string;
  valorAmortizadoUSD: number;
  creditoIvaAmortizado: number;
  saldoRestanteEntrada: number;
  estatusAnexo30: 'TRANSMITIDO' | 'PENDIENTE_ENVIO' | 'RECHAZADO' | 'CONCILIADO';
  fechaTransmisionSAT?: string;
  acuseSAT?: string;
}

// --- LISTA DE MATERIALES (BOM - BILL OF MATERIALS) ---
export interface BOMComponent {
  skuInsumo: string;
  nombreInsumo: string;
  cantidadRequerida: number;
  unidadMedida: string;
  porcentajeMerma: number; // Merma justificada técnicamente (%)
  porcentajeDesperdicio: number; // Desperdicio (%)
}

export interface BillOfMaterials {
  id: string;
  skuProductoTerminado: string;
  nombreProducto: string;
  version: string;
  vigencia: string;
  componentes: BOMComponent[];
  rendimientoEsperado: number; // %
  justificacionTecnicaMermas: string;
  aprobadoPorIngenieria: string;
  fechaAprobacion: string;
}

// --- CONTROL DE MERMAS Y DESTRUCCIONES / DONACIONES ---
export interface MermaRegistro {
  id: string;
  fecha: string;
  sku: string;
  nombre: string;
  cantidad: number;
  unidadMedida: string;
  tipoProceso: string;
  porcentajeRealVsBOM: number;
  motivoTecnico: string;
  destino: 'DESTRUCCION_FISCAL' | 'DONACION_AUTORIZADA' | 'RECICLAJE_MRO' | 'RETORNO';
  folioManifiesto: string;
  testigoSAToNotario?: string;
  evidenciaFotograficaUrl?: string;
  estatus: 'REGISTRADO' | 'ACTA_LEVANTADA' | 'CONCLUIDO_SAT';
  informeDescargoTransmitidoAnexo30?: boolean; // Para prevenir descuadre en Anexo 30
}

// --- MATRIZ DE CONTROL Y AUDITORÍA DE ACTIVO FIJO (PARTE 2) ---
export interface ActivoFijoItem {
  id: string;
  noInventario: string; // Ej: EQ-2026-01, ML-2026-05
  descripcion: string; // Ej: Célula de Ensamble, Molde de Inyección
  marca: string; // Ej: Fanuc, Husky
  modelo: string; // Ej: R-2000iC, HyPET 500
  numeroSeriePlaca: string; // Exactamente lo que dice la placa del fabricante
  pedimentoAF: string; // 15 dígitos oficial SAT (clave AF)
  numeroSeriePedimento: string; // Número de serie tal como aparece en el pedimento AF
  coincidenciaExactaSerie: boolean; // Si hay errata mecanográfica (ej. guión omitido)
  discrepanciaDetalle?: string; // Alerta de riesgo de embargo precautorio
  ubicacionFisica: string; // Ej: Planta 1 - Nave B, Bodega de Herramental
  estatus: 'ACTIVO' | 'EN_USO' | 'MANTENIMIENTO_EXTERNO' | 'SUBMAQUILADOR' | 'EN_DESUSO';
  submaquiladorNombre?: string;
  avisoTrasladoFolio?: string; // Si está con submaquilador o cambio de bodega
  marbeteRFID: string;
  codigoQR: string;
  
  // Las 3 Fotografías obligatorias para blindaje de materialidad
  fotos: {
    vistaGeneralUrl: string; // 1. Vista general del equipo en ubicación actual
    placaFabricanteUrl: string; // 2. Placa del fabricante (serie, modelo y marca)
    marbeteControlInternoUrl: string; // 3. Etiqueta / marbete de inventario interno
  };

  // Expediente electrónico de activo fijo
  expedienteAF: {
    pedimentoAFUrl?: string;
    facturaComercialInvoiceUrl?: string;
    fichaTecnicaManualUrl?: string;
    avisoTrasladoV1Url?: string;
    completo: boolean;
  };

  fechaUltimaAuditoriaFisica: string;
  createdAt: string;
}

// Protocolo de Auditoría Preventiva de Activo Fijo
export interface AuditoriaActivoFijoResult {
  id: string;
  fecha: string;
  auditorResponsable: string;
  totalActivosInspeccionados: number;
  activosConformes: number;
  inconsistenciasMecanograficas: number; // Erratas de serie (Plan: Rectificación R1)
  activosFaltantes: number; // No localizados en bodega (Riesgo embargo / omisión impuestos)
  activosSobrantesSinPedimento: number; // Físicos sin pedimento (Plan: Importación A1)
  activosConSubmaquilador: number; // Con submaquilador (Plan: Aviso de traslado / V1)
  estatusPlanSaneamiento: 'EN_PROCESO' | 'CONCILIADO_TOTAL' | 'REQUERIMIENTO_RECTIFICACION_R1';
  resumenHallazgos: string;
}

// --- CONCILIACIÓN SCCCyG (ANEXO 30) Y MAPEO DE DISCREPANCIAS FRECUENTES ---
export type CausaDiscrepanciaAnexo30 = 
  | 'DESCARGO_NO_TRANSMITIDO'      // Transmisión pendiente
  | 'DESCARGO_RECHAZADO'           // Inconsistencia en clave, fecha o RFC en SCCCyG
  | 'RECTIFICACION_R1_PENDIENTE'   // Pedimento rectificado en A24 pero no avisado a SCCCyG
  | 'VIRTUAL_V1_EXTEMPORANEO'      // Operación virtual no transmitida a tiempo
  | 'MERMA_SIN_INFORME';           // Bajas por merma en A24 sin informe al SAT

export interface DiscrepanciaAnexo30Detalle {
  id: string;
  sku: string;
  descripcion: string;
  tipoCausa: CausaDiscrepanciaAnexo30;
  pedimentoAfectado: string;
  montoIvaDiscrepanciaUSD: number;
  detalleTecnico: string;
  accionRequerida: 'CORRECCION_RECHAZO_SCCCYG' | 'AVISO_ACLARACION_INCONFORMIDAD_SAT' | 'RECTIFICACION_R1' | 'TRANSMISION_INFORME_MERMAS';
  estatusSolucion: 'PENDIENTE' | 'TRANSMITIDO_CORREGIDO' | 'ACLARADO_SAT';
  folioAvisoAclaracionSAT?: string;
}

export interface ScccgyTransmision {
  id: string;
  periodo: string; // Ej: "OCTUBRE-2026-Q1"
  fechaTransmision: string;
  tipoInforme: 'DESCARGO_PEPS' | 'RECTIFICACION_R1' | 'AVISO_TRASLADO_V1' | 'INFORME_MERMAS';
  totalDescargos: number;
  montoIvaAbonadoUSD: number;
  estatus: 'ACEPTADO_VALIDADO' | 'RECHAZADO' | 'PENDIENTE_PROCESAR';
  motivoRechazo?: string;
  acuseSATFirma?: string; // Acuse con firma electrónica (AUTORIZADO)
  xmlGenerado?: string; // Layout oficial SCCCyG
}

// --- CHECKLIST DE CONTROL MENSUAL (BUENAS PRÁCTICAS IMMEX) ---
export interface ChecklistMensualItem {
  id: string;
  titulo: string;
  descripcion: string;
  frecuencia: 'MENSUAL' | 'QUINCENAL';
  completado: boolean;
  fechaVerificacion?: string;
  responsable?: string;
  observaciones?: string;
}

// --- TOMAS DE INVENTARIO CÍCLICO ---
export interface TomaFisicaInventario {
  id: string;
  fechaToma: string;
  auditorResponsable: string;
  zonaAlmacen: string;
  sku: string;
  nombre: string;
  saldoTeoricoAnexo24: number;
  conteoFisicoReal: number;
  diferencia: number;
  tipoDiscrepancia: 'CUADRADO' | 'FALTANTE_RIESGO_CONTRABANDO' | 'SOBRANTE_SIN_PEDIMENTO';
  montoRiesgoMultaMXN: number;
  justificacionInvestigacion: string;
  estatusAjuste: 'PENDIENTE_AUTORIZACION' | 'REGULARIZADO_A1' | 'ACLARADO_MERMA' | 'CONCILIADO';
  actaFolio?: string;
}

// --- EXPEDIENTE ELECTRÓNICO (5 AÑOS DE MATERIALIDAD) ---
export interface DocumentoMaterialidad {
  tipo: 
    | 'PEDIMENTO_FACTURA_CFDI'
    | 'TRANSPORTE_CARTA_PORTE'
    | 'RECEPCION_ALMACEN_WMS'
    | 'ORDEN_PRODUCCION_BOM'
    | 'PEDIMENTO_RETORNO'
    | 'PRUEBA_PAGO_CONTRATOS';
  nombreArchivo: string;
  fechaDocumento: string;
  folioFiscalUUID?: string;
  estatusValidacion: 'CARGADO' | 'VALIDADO_COMPLETO' | 'OBSERVADO' | 'PENDIENTE';
  observaciones: string;
}

export interface ExpedienteElectronico {
  id: string;
  numeroPedimento: string;
  lote: string;
  fechaOperacion: string;
  fechaResguardoObligatorio: string;
  aniosRestantesResguardo: number;
  documentos: DocumentoMaterialidad[];
  porcentajeCompletitud: number;
  nivelMaterialidad: 'OPTIMO_SIN_RIESGO' | 'REGULAR_FALTAN_SOPORTES' | 'CRITICO_RIESGO_SAT';
}

export interface ConciliacionAnexo30Item {
  sku: string;
  descripcion: string;
  saldoFisicoAlmacen: number;
  saldoAnexo24: number;
  saldoPortalAnexo30: number;
  diferenciaFisicoVs24: number;
  diferencia24Vs30: number;
  estadoCuadratura: 'CUADRATURA_TOTAL' | 'DISCREPANCIA_FISICA' | 'PENDIENTE_TRANSMISION_SAT' | 'RIESGO_CREDITO_FISCAL';
  creditoFiscalIVAEnRiesgoUSD: number;
  accionRequerida: string;
  causasDiscrepancia?: DiscrepanciaAnexo30Detalle[];
}

export interface SatAuditAccess {
  tokenAuditor: string;
  usuarioSAT: string;
  empresaRFC: string;
  programaIMMEX: string;
  certificacionIvaIeps: 'AAA' | 'AA' | 'A' | 'NO_CERTIFICADA';
  fechaGeneracion: string;
  expiraEn: string;
  activo: boolean;
  consultasRealizadas: number;
  ipUltimaConexion?: string;
}

export type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'MERMA' | 'RETORNO_PEPS';

export interface Movement {
  id: string;
  sku: string;
  productName: string;
  type: MovementType;
  quantity: number;
  user: string;
  reason: string;
  reference: string;
  timestamp: string;
  pedimentoAsociado?: string;
  horasDesdeDespacho?: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  rfcTaxId: string;
  pais: string;
  tipoProveedor: 'EXTRANJERO' | 'NACIONAL_IMMEX' | 'NACIONAL_DEFINITIVO';
  productsCount: number;
}

export interface Webhook {
  id: string;
  url: string;
  events: ('STOCK_CRITICAL' | 'MOVEMENT_REGISTERED' | 'PEDIMENTO_48H_ALERT' | 'PERMANENCIA_18M_ALERT' | 'DISCREPANCIA_ANEXO30')[];
  isActive: boolean;
  createdAt: string;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  url: string;
  event: string;
  payload: string;
  status: number;
  timestamp: string;
}

export interface DatabaseState {
  products: Product[];
  movements: Movement[];
  suppliers: Supplier[];
  pedimentos: Pedimento[];
  descargosPEPS: DescargoPEPS[];
  boms: BillOfMaterials[];
  mermas: MermaRegistro[];
  activosFijos: ActivoFijoItem[];
  auditoriasActivoFijo: AuditoriaActivoFijoResult[];
  scccgyTransmisiones: ScccgyTransmision[];
  discrepanciasAnexo30: DiscrepanciaAnexo30Detalle[];
  checklistMensual: ChecklistMensualItem[];
  inventariosCiclicos: TomaFisicaInventario[];
  expedientes: ExpedienteElectronico[];
  satAuditAccess: SatAuditAccess;
  webhooks: Webhook[];
  webhookLogs: WebhookLog[];
}
