import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../../../core/supabase/supabase';
import { PlanFunerario } from '../models/catalogo.interface';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  private supabaseService = inject(SupabaseService);
  
  private readonly BUCKET_NAME = 'catalogo';

  private get supabase() {
    return this.supabaseService.client; 
  }

  // --- OBTENER ---
  async obtenerPlanes(): Promise<PlanFunerario[]> {
    const { data, error } = await this.supabase
      .from('adm_catalogo_planes')
      .select(`
        *,
        adm_plan_adicionales (
          adicional_id,
          cantidad,
          inv_adicionales (
            nombre,
            descripcion,
            categoria
          )
        )
      `)
      .is('fecha_eliminacion', null)
      .order('orden', { ascending: true }) // <-- PRIMERA PRIORIDAD: Tu orden manual
      .order('fecha_creada', { ascending: true }); // Segunda prioridad: Fecha de creación

    if (error) throw error;
    return data || [];
  }

  async obtenerPlanPorId(id: string): Promise<PlanFunerario | null> {
    const { data, error } = await this.supabase
      .from('adm_catalogo_planes')
      .select(`
        *,
        adm_plan_adicionales (
          adicional_id,
          cantidad,
          inv_adicionales (
            nombre,
            descripcion,
            categoria 
          )
        )
      `)
      .eq('id', id)
      .is('fecha_eliminacion', null)
      .single();

    if (error) throw error;
    return data;
  }

  // --- CREAR Y ACTUALIZAR ---
  async crearPlan(plan: Partial<PlanFunerario>, relaciones: any[]): Promise<void> {
    // 1. Guardamos el plan y solicitamos que nos devuelva el ID insertado
    const { data: planCreado, error: planError } = await this.supabase
      .from('adm_catalogo_planes')
      .insert([{ ...plan, fecha_creada: new Date().toISOString() }])
      .select('id')
      .single();

    if (planError) throw planError;

    // 2. Si hay adicionales seleccionados, los insertamos en la tabla intermedia
    if (relaciones && relaciones.length > 0) {
      const insertData = relaciones.map(r => ({
        plan_id: planCreado.id,
        adicional_id: r.adicional_id,
        cantidad: r.cantidad
      }));
      
      const { error: relError } = await this.supabase.from('adm_plan_adicionales').insert(insertData);
      if (relError) throw relError;
    }
  }

  async actualizarPlan(id: string, plan: Partial<PlanFunerario>, relaciones: any[]): Promise<void> {
    // 1. Actualizamos los datos principales del plan
    const { error: planError } = await this.supabase
      .from('adm_catalogo_planes')
      .update({ ...plan, fecha_actualizada: new Date().toISOString() })
      .eq('id', id);

    if (planError) throw planError;

    // 2. Borramos las relaciones antiguas en la tabla intermedia
    await this.supabase.from('adm_plan_adicionales').delete().eq('plan_id', id);

    // 3. Insertamos las nuevas relaciones actualizadas
    if (relaciones && relaciones.length > 0) {
      const insertData = relaciones.map(r => ({
        plan_id: id,
        adicional_id: r.adicional_id,
        cantidad: r.cantidad
      }));
      
      const { error: relError } = await this.supabase.from('adm_plan_adicionales').insert(insertData);
      if (relError) throw relError;
    }
  }

  // --- ELIMINAR (Borrado Lógico) ---
  async eliminarPlan(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('adm_catalogo_planes')
      .update({ fecha_eliminacion: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // --- GESTIÓN DE IMÁGENES (Storage) ---
  async subirImagen(file: File, nombrePlan: string, timestamp: number): Promise<string> {
    const filePath = `${nombrePlan}-${timestamp}.webp`;

    const { error } = await this.supabase.storage
      .from(this.BUCKET_NAME)
      .upload(filePath, file, {
        upsert: true,
        contentType: 'image/webp'
      });

    if (error) throw error;

    const { data } = this.supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async eliminarImagenStorage(url: string): Promise<void> {
    const urlBase = `/storage/v1/object/public/${this.BUCKET_NAME}/`;
    const parts = url.split(urlBase);
    
    if (parts.length > 1) {
      const filePath = parts[1];
      const { error } = await this.supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Error al eliminar la imagen del storage:', error);
      }
    }
  }
}