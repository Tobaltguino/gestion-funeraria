import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../supabase/supabase';
import { Session, AuthError } from '@supabase/supabase-js';
import { PerfilUsuario } from './auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService).client;

  // 1. Obtener la sesión actual
  async obtenerSesionActual(): Promise<Session | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  // 2. Obtener el perfil tipado
  async obtenerPerfilUsuario(userId: string): Promise<PerfilUsuario | null> {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('id, nombre, rol, rut, telefono')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error al obtener perfil:', error);
      return null;
    }
    
    // Aquí TypeScript ya sabe que 'rol' respetará tu Role enum gracias a la interfaz
    return data as PerfilUsuario;
  }

  // 3. Login con RUT
  async loginConRut(rut: string, password: string): Promise<{ session: Session | null, error: AuthError | Error | null }> {
    const { data: email, error: rpcError } = await this.supabase.rpc('obtener_correo_por_rut', {
      p_rut: rut
    });

    if (rpcError || !email) {
      return { session: null, error: new Error('RUT no encontrado en el sistema.') };
    }

    const { data, error: loginError } = await this.supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    return { session: data.session, error: loginError };
  }

  // 4. Cerrar Sesión
  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
  }
}