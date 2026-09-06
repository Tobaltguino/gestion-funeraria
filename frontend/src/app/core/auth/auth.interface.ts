import { Role } from '../../shared/enums/role.enum';

export interface PerfilUsuario {
  id: string;
  nombre: string;
  rol: Role;
  rut: string;
  telefono?: string;
  
  // --- Campos de Estado y Fechas (Nuevos) ---
  activo: boolean;
  fecha_creada?: string;
  fecha_actualizada?: string;
  fecha_eliminada?: string | null;
}