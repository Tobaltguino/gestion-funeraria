import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../../../core/supabase/supabase';
import { PerfilUsuario } from '../../../../core/auth/auth.interface';
import { CrearUsuarioDTO, ActualizarUsuarioDTO } from '../models/usuario.dto';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private supabase = inject(SupabaseService).client;

  // 1. Obtener todos los usuarios activos (excluyendo eliminados)
  async obtenerUsuarios(): Promise<PerfilUsuario[]> {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .is('fecha_eliminada', null)
      .order('fecha_creada', { ascending: false });

    if (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
    return data as PerfilUsuario[];
  }

  // 2. Crear usuario (Llama a la Edge Function)
  // Busca tu método crearUsuario y reemplázalo por este:
  async crearUsuario(nuevoUsuario: any): Promise<any> {
    try {
      // Usamos functions.invoke pasándole el nombre exacto de la carpeta que subimos
      const { data, error } = await this.supabase.functions.invoke('crear-usuario-admin', {
        body: nuevoUsuario // Angular se encarga de enviarlo en formato JSON automáticamente
      });

      if (error) {
        console.error('Error del servidor Edge:', error);
        throw new Error('No se pudo crear el usuario en el servidor.');
      }

      return data;
    } catch (err) {
      console.error('Excepción al invocar la función:', err);
      throw err;
    }
  }

  // 3. Editar usuario (Actualiza solo la tabla pública)
  async actualizarUsuario(id: string, datosActualizados: ActualizarUsuarioDTO): Promise<void> {
    const { error } = await this.supabase
      .from('usuarios')
      .update({
        ...datosActualizados,
        fecha_actualizada: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  }

  // 4. Cambiar estado (Activar / Desactivar)
  async alternarEstado(id: string, estadoActual: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('usuarios')
      .update({ 
        activo: !estadoActual, 
        fecha_actualizada: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) {
      console.error('Error al cambiar estado del usuario:', error);
      throw error;
    }
  }

  // 5. Eliminar usuario (Soft Delete)
  async eliminarUsuario(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('usuarios')
      .update({ 
        fecha_eliminada: new Date().toISOString(),
        activo: false
      })
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  }
}