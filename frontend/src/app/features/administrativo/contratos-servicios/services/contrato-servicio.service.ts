import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../../../core/supabase/supabase';
import { ContratoServicio } from '../models/contrato-servicio.interface';

@Injectable({
  providedIn: 'root'
})
export class ServiciosService {
  private supabaseService = inject(SupabaseService);

  private get supabase() {
    return this.supabaseService.client;
  }

  // --- OBTENER ---
  async obtenerServicios(): Promise<ContratoServicio[]> {
    const { data, error } = await this.supabase
      .from('adm_contratos_servicios')
      .select(`
        *,
        adm_catalogo_planes (nombre),
        inv_urnas (nombre, tipo_urna),
        inv_carrozas (marca, modelo, patente),
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

  async obtenerServicioPorId(id: string): Promise<ContratoServicio | null> {
    const { data, error } = await this.supabase
      .from('adm_contratos_servicios')
      .select(`
        *,
        adm_catalogo_planes (nombre),
        inv_urnas (nombre, tipo_urna),
        inv_carrozas (marca, modelo, patente),
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

  async obtenerServiciosPaginados(filtros: any, page: number, pageSize: number): Promise<{ data: ContratoServicio[], total: number }> {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase
      .from('adm_contratos_servicios')
      .select(`
        *,
        adm_catalogo_planes (nombre),
        inv_urnas (nombre, tipo_urna),
        inv_carrozas (marca, modelo, patente),
        adm_servicio_adicionales (
          adicional_id, cantidad, inv_adicionales (nombre, categoria)
        )
      `, { count: 'exact' })
      .is('fecha_eliminacion', null)
      .order('fecha_servicio', { ascending: false });

    // 1. Filtro de Fecha (Mes y Año)
    if (filtros.anio && filtros.mes) {
      const startDate = new Date(filtros.anio, filtros.mes - 1, 1).toISOString();
      const endDate = new Date(filtros.anio, filtros.mes, 0, 23, 59, 59).toISOString(); 
      query = query.gte('fecha_servicio', startDate).lte('fecha_servicio', endDate);
    }

    // 2. Filtro Numérico (Folio exacto)
    if (filtros.folio) query = query.eq('folio', filtros.folio);
    
    // 3. Filtros de Texto (Búsqueda parcial / ignorando mayúsculas)
    if (filtros.nombre_fallecido) query = query.ilike('nombre_fallecido', `%${filtros.nombre_fallecido}%`);
    if (filtros.fallecido_rut) query = query.ilike('fallecido_rut', `%${filtros.fallecido_rut}%`);
    
    // 4. Filtro de Select Exacto
    if (filtros.estado) query = query.eq('estado', filtros.estado);

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;
    return { data: data as any[], total: count || 0 };
  }

  // --- CREAR ---
  // AHORA RETORNA Promise<ServicioContratado> en lugar de void
  async crearServicio(servicio: Partial<ContratoServicio>, adicionales: any[]): Promise<ContratoServicio> {
    const { data: servicioCreado, error: servicioError } = await this.supabase
      .from('adm_contratos_servicios')
      .insert([{ ...servicio, fecha_creada: new Date().toISOString() }])
      .select() // <-- CLAVE: Le decimos a Supabase que nos devuelva todo el objeto generado (incluyendo el folio)
      .single();

    if (servicioError) throw servicioError;

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

    // Devolvemos el servicio con su nuevo folio
    return servicioCreado as ContratoServicio;
  }

  // --- ACTUALIZAR ---
  // AHORA RETORNA Promise<ServicioContratado> en lugar de void
  async actualizarServicio(id: string, servicio: Partial<ContratoServicio>, adicionales: any[]): Promise<ContratoServicio> {
    const { data: servicioActualizado, error: servicioError } = await this.supabase
      .from('adm_contratos_servicios')
      .update({ ...servicio, fecha_actualizada: new Date().toISOString() })
      .eq('id', id)
      .select() // <-- CLAVE: Devolvemos el registro actualizado
      .single();

    if (servicioError) throw servicioError;

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

    // Devolvemos los datos por si se mandan a imprimir post-edición
    return servicioActualizado as ContratoServicio;
  }

  // --- ELIMINAR ---
  async eliminarServicio(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('adm_contratos_servicios')
      .update({ fecha_eliminacion: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }
}