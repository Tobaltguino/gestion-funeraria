import { Role } from '../../shared/enums/role.enum';

export interface PerfilUsuario {
  id: string;
  nombre: string;
  rol: Role;
  rut: string;
  telefono?: string;
  sueldo_imponible?: number;
  porcentaje_comision?: number;
}