import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../../../core/supabase/supabase';
import { ServicioContratado } from '../models/servicio.interface';

@Injectable({
  providedIn: 'root'
})
export class ServiciosService {
  private supabaseService = inject(SupabaseService);

  private get supabase() {
    return this.supabaseService.client;
  }

  // --- OBTENER ---
  async obtenerServicios(): Promise<ServicioContratado[]> {
    const { data, error } = await this.supabase
      .from('adm_servicios')
      .select(`
        *,
        adm_catalogo_planes (nombre),
        adm_servicio_adicionales (
          adicional_id,
          cantidad,
          inv_adicionales (nombre, categoria)
        )
      `)
      .is('fecha_eliminacion', null)
      .order('fecha_servicio', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async obtenerServicioPorId(id: string): Promise<ServicioContratado | null> {
    const { data, error } = await this.supabase
      .from('adm_servicios')
      .select(`
        *,
        adm_catalogo_planes (nombre),
        adm_servicio_adicionales (
          adicional_id,
          cantidad,
          inv_adicionales (nombre, categoria)
        )
      `)
      .eq('id', id)
      .is('fecha_eliminacion', null)
      .single();

    if (error) throw error;
    return data;
  }

  // --- CREAR ---
  async crearServicio(servicio: Partial<ServicioContratado>, adicionales: any[]): Promise<void> {
    // 1. Guardamos los datos principales del servicio
    const { data: servicioCreado, error: servicioError } = await this.supabase
      .from('adm_servicios')
      .insert([{ ...servicio, fecha_creada: new Date().toISOString() }])
      .select('id')
      .single();

    if (servicioError) throw servicioError;

    // 2. Insertamos la configuración personalizada en la tabla intermedia
    if (adicionales && adicionales.length > 0) {
      const insertData = adicionales.map(a => ({
        servicio_id: servicioCreado.id,
        adicional_id: a.adicional_id,
        cantidad: a.cantidad || 1
      }));
      
      const { error: relError } = await this.supabase
        .from('adm_servicio_adicionales')
        .insert(insertData);
        
      if (relError) throw relError;
    }
  }

  // --- ACTUALIZAR ---
  async actualizarServicio(id: string, servicio: Partial<ServicioContratado>, adicionales: any[]): Promise<void> {
    // 1. Actualizamos los datos principales
    const { error: servicioError } = await this.supabase
      .from('adm_servicios')
      .update({ ...servicio, fecha_actualizada: new Date().toISOString() })
      .eq('id', id);

    if (servicioError) throw servicioError;

    // 2. Limpiamos los adicionales viejos y guardamos los nuevos (Estrategia Muchos a Muchos)
    await this.supabase.from('adm_servicio_adicionales').delete().eq('servicio_id', id);

    if (adicionales && adicionales.length > 0) {
      const insertData = adicionales.map(a => ({
        servicio_id: id,
        adicional_id: a.adicional_id,
        cantidad: a.cantidad || 1
      }));
      
      const { error: relError } = await this.supabase
        .from('adm_servicio_adicionales')
        .insert(insertData);
        
      if (relError) throw relError;
    }
  }

  // --- ELIMINAR (Borrado Lógico) ---
  async eliminarServicio(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('adm_servicios')
      .update({ fecha_eliminacion: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }
}