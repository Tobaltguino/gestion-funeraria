export interface PlanFunerario {
  id: string;
  nombre: string;
  imagenes: string[];
  incluye: string[];
  fecha_creada?: string;
  fecha_actualizada?: string;
  fecha_eliminacion?: string | null;
}