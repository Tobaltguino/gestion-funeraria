import { Adicional } from '../../../inventario/adicionales/models/adicional.interface';

export interface PlanAdicional {
  adicional_id?: string;
  cantidad: number;
  inv_adicionales?: Adicional;
}

export interface PlanFunerario {
  id: string;
  nombre: string;
  imagenes: string[];
  adm_plan_adicionales?: PlanAdicional[];
  orden?: number; // <-- NUEVO CAMPO
  fecha_creada?: string;
  fecha_actualizada?: string;
  fecha_eliminacion?: string | null;
}