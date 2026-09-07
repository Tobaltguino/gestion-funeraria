import { Role } from "../../../../shared/enums/role.enum";

// DTO para la creación de un nuevo usuario (Enviado a la Edge Function)
export interface CrearUsuarioDTO {
  nombre: string;
  rut: string;
  email: string;      // Requerido por Supabase Auth
  password: string;   // Requerido por Supabase Auth
  rol: Role;
  telefono?: string;  // Opcional
}

// DTO para la actualización de datos (Enviado directo a tu tabla public.usuarios)
export interface ActualizarUsuarioDTO {
  nombre?: string;
  rut?: string;
  rol?: Role;
  telefono?: string;
}