import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../../../core/supabase/supabase';
import { PlanFunerario } from '../models/catalogo.interface';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  // Inyectamos TU servicio personalizado de Supabase
  private supabaseService = inject(SupabaseService);
  
  private readonly BUCKET_NAME = 'catalogo'; // Nombre del bucket en Supabase Storage

  // Creamos este 'getter' para acceder directamente al cliente y no tener que modificar el resto del código
  private get supabase() {
    return this.supabaseService.client; 
  }

  // --- OBTENER ---
  async obtenerPlanes(): Promise<PlanFunerario[]> {
    const { data, error } = await this.supabase
      .from('catalogo_planes')
      .select('*')
      .is('fecha_eliminacion', null)
      .order('fecha_creada', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async obtenerPlanPorId(id: string): Promise<PlanFunerario | null> {
    const { data, error } = await this.supabase
      .from('catalogo_planes')
      .select('*')
      .eq('id', id)
      .is('fecha_eliminacion', null)
      .single();

    if (error) throw error;
    return data;
  }

  // --- CREAR Y ACTUALIZAR ---
  async crearPlan(plan: Partial<PlanFunerario>): Promise<void> {
    const { error } = await this.supabase
      .from('catalogo_planes')
      .insert([{ ...plan, fecha_creada: new Date().toISOString() }]);

    if (error) throw error;
  }

  async actualizarPlan(id: string, plan: Partial<PlanFunerario>): Promise<void> {
    const { error } = await this.supabase
      .from('catalogo_planes')
      .update({ ...plan, fecha_actualizada: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // --- ELIMINAR (Borrado Lógico) ---
  async eliminarPlan(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('catalogo_planes')
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
    // Extraemos la ruta final del archivo desde la URL pública
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