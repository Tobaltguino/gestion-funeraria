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
      .from('adicionales')
      .select('*')
      .is('fecha_eliminacion', null)
      .order('categoria', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async crearAdicional(adicional: Partial<Adicional>): Promise<Adicional> {
    const { data, error } = await this.supabase
      .from('adicionales')
      .insert(adicional)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async actualizarAdicional(id: string, adicional: Partial<Adicional>): Promise<Adicional> {
    const { data, error } = await this.supabase
      .from('adicionales')
      .update(adicional)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async eliminarAdicional(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('adicionales')
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