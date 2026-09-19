import { Adicional } from '../../../inventario/adicionales/models/adicional.interface';
import { PlanFunerario } from '../../catalogo/models/catalogo.interface';

export enum TipoEntidad {
  AFP = 'AFP',
  ASEGURADORA = 'Aseguradora',
  MUTUAL = 'Mutual',
  PARTICULAR = 'Particular',
  OTRO = 'Otro'
}

export interface ServicioAdicional {
  servicio_id?: string;
  adicional_id: string;
  cantidad: number;
  inv_adicionales?: Adicional;
}

export interface ContratoServicio {
  id: string;
  folio?: number;
  
  // --- SECCIÓN 1: DATOS DEL SOLICITANTE ---
  solicitante_nombre?: string;
  solicitante_rut?: string;
  solicitante_direccion?: string;
  solicitante_ciudad?: string;
  solicitante_fono?: string;
  solicitante_email?: string;
  consentimiento_redes?: boolean;

  // --- SECCIÓN 2: DATOS DEL FALLECIDO/A ---
  nombre_fallecido: string; 
  fallecido_rut?: string;      
  retirado_desde?: string;
  velado_en?: string;
  hora_misa?: string;

  // --- SECCIÓN 3: DETALLE DEL SERVICIO ---
  dia_funeral?: string;
  lugar_funeral?: string;
  hora_funeral?: string;
  
  // Relaciones
  plan_base_id: string; 
  adm_catalogo_planes?: PlanFunerario; 
  
  urna_id?: string | null;
  inv_urnas?: { nombre: string; tipo_urna?: string }; 
  
  carroza_id?: string | null;
  inv_carrozas?: { marca: string; modelo: string; patente: string };

  adm_servicio_adicionales?: ServicioAdicional[]; 
  
  fecha_servicio: string;

  // --- SECCIÓN 4: DETALLE DE PAGO ---
  tipo_entidad: TipoEntidad | string;
  entidad_pagadora: string;
  factura_numero?: string;
  
  monto?: number; 
  monto_entidad?: number; 
  diferencia?: number; 
  
  estado: 'Pendiente' | 'Pagado';
  fecha_pago?: string | null;

  // --- METADATA ---
  asignado_a_id?: string;
  fecha_creada?: string;
  fecha_actualizada?: string;
  fecha_eliminacion?: string | null;
}