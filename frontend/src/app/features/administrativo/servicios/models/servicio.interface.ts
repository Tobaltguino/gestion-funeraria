import { Adicional } from '../../../inventario/adicionales/models/adicional.interface';
import { PlanFunerario } from '../../catalogo/models/catalogo.interface';

// Enum para los tipos de entidades comunes en Chile
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
  inv_adicionales?: Adicional; // Datos del adicional cuando hacemos SELECT
}

export interface ServicioContratado {
  id: string;
  folio?: number;
  fecha_servicio: string; // Fecha en que se realiza el servicio
  nombre_fallecido: string;
  
  tipo_entidad: TipoEntidad | string; // <-- NUEVO CAMPO
  entidad_pagadora: string;
  
  estado: 'Pendiente' | 'Pagado';
  fecha_pago?: string | null; // Solo se llena si estado es 'Pagado'
  
  plan_base_id: string;
  adm_catalogo_planes?: PlanFunerario; // Datos del plan base (Lectura)

  urna_id?: string | null;
  diferencia_valor_urna?: number;
  
  carroza_id?: string | null;
  
  asignado_a_id?: string;
  monto?: number; // Costo total del servicio
  
  adm_servicio_adicionales?: ServicioAdicional[]; // Relación Muchos a Muchos
  
  fecha_creada?: string;
  fecha_actualizada?: string;
  fecha_eliminacion?: string | null;
}