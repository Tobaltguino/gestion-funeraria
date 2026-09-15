import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../../core/supabase/supabase';
import { Adicional } from '../models/adicional.interface';

@Injectable({
  providedIn: 'root'
})
export class AdicionalService {
  private supabase: SupabaseClient;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.client;
  }

  async obtenerAdicionales(): Promise<Adicional[]> {
    const { data, error } = await this.supabase
      .from('inv_adicionales')
      .select('*')
      .is('fecha_eliminacion', null)
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // --- MÉTODOS DE PAGINACIÓN Y FILTRADO ---
  
  async obtenerAdicionalesPaginadas(filtros: any, page: number, pageSize: number): Promise<{ data: Adicional[], total: number }> {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase
      .from('inv_adicionales')
      .select('*', { count: 'exact' })
      .is('fecha_eliminacion', null)
      .order('nombre', { ascending: true });

    // Aplicar filtros dinámicos
    if (filtros.nombre) {
      query = query.ilike('nombre', `%${filtros.nombre}%`);
    }
    if (filtros.categoria) {
      query = query.eq('categoria', filtros.categoria);
    }
    if (filtros.disponible !== '') {
      // Convertimos el string 'true'/'false' a booleano real
      query = query.eq('disponible', filtros.disponible === 'true');
    }

    // Paginación
    const { data, error, count } = await query.range(from, to);

    if (error) throw error;
    return { data: data as Adicional[], total: count || 0 };
  }

  async crearAdicional(adicional: Partial<Adicional>): Promise<Adicional> {
    const { data, error } = await this.supabase
      .from('inv_adicionales')
      .insert(adicional)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async actualizarAdicional(id: string, adicional: Partial<Adicional>): Promise<Adicional> {
    const { data, error } = await this.supabase
      .from('inv_adicionales')
      .update(adicional)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async eliminarAdicional(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('inv_adicionales')
      .update({ fecha_eliminacion: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // --- MÉTODOS PARA EL STORAGE (IMÁGENES) ---

  async subirImagen(file: File, nombreServicio: string, index: number): Promise<string> {
    const nombreLimpio = nombreServicio.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    const fileName = `${nombreLimpio}_${fecha}_${index}.webp`;
    const filePath = `adicionales/${fileName}`; // Carpeta de adicionales

    const { error } = await this.supabase.storage
      .from('inventario')
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    const { data: publicUrlData } = this.supabase.storage
      .from('inventario')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  async eliminarImagenStorage(urlPublica: string): Promise<void> {
    try {
      const urlSplit = urlPublica.split('/inventario/');
      if (urlSplit.length > 1) {
        const filePath = urlSplit[1];
        await this.supabase.storage.from('inventario').remove([filePath]);
      }
    } catch (error) {
      console.error('Error al intentar borrar la imagen del adicional:', error);
    }
  }
}