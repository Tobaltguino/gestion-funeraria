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

  // Agrega este método a tu ServiciosService
  async obtenerServiciosPaginados(filtros: any, page: number, pageSize: number): Promise<{ data: ServicioContratado[], total: number }> {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase
      .from('adm_servicios')
      .select(`
        *,
        adm_catalogo_planes (nombre),
        adm_servicio_adicionales (
          adicional_id, cantidad, inv_adicionales (nombre, categoria)
        )
      `, { count: 'exact' })
      .is('fecha_eliminacion', null)
      .order('fecha_servicio', { ascending: false });

    // Filtro de Fecha (Mes y Año)
    if (filtros.anio && filtros.mes) {
      const startDate = new Date(filtros.anio, filtros.mes - 1, 1).toISOString();
      // El día 0 del mes siguiente nos da el último día del mes actual
      const endDate = new Date(filtros.anio, filtros.mes, 0, 23, 59, 59).toISOString(); 
      query = query.gte('fecha_servicio', startDate).lte('fecha_servicio', endDate);
    }

    // Filtros de Texto y Numéricos
    if (filtros.folio) query = query.eq('folio', filtros.folio);
    if (filtros.nombre_fallecido) query = query.ilike('nombre_fallecido', `%${filtros.nombre_fallecido}%`);
    
    // Filtros Exactos (Selects)
    if (filtros.entidad_pagadora) query = query.eq('entidad_pagadora', filtros.entidad_pagadora);
    if (filtros.estado) query = query.eq('estado', filtros.estado);
    if (filtros.plan_base_id) query = query.eq('plan_base_id', filtros.plan_base_id);
    if (filtros.urna_id) query = query.eq('urna_id', filtros.urna_id);
    if (filtros.carroza_id) query = query.eq('carroza_id', filtros.carroza_id);

    // Aplicar Paginación
    const { data, error, count } = await query.range(from, to);

    if (error) throw error;
    return { data: data as any[], total: count || 0 };
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