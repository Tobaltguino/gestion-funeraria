import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../../core/supabase/supabase';
import { Carroza } from '../models/carroza.interface';

@Injectable({
  providedIn: 'root'
})
export class CarrozaService {
  private supabase: SupabaseClient;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.client;
  }

  // --- CRUD BASE DE DATOS ---

  async obtenerCarrozas(): Promise<Carroza[]> {
    const { data, error } = await this.supabase
      .from('inv_carrozas')
      .select('*')
      .is('fecha_eliminacion', null)
      .order('marca', { ascending: true }); // Ordenamos por marca

    if (error) throw error;
    return data || [];
  }

  async crearCarroza(carroza: Partial<Carroza>): Promise<Carroza> {
    const { data, error } = await this.supabase
      .from('inv_carrozas')
      .insert(carroza)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async actualizarCarroza(id: string, carroza: Partial<Carroza>): Promise<Carroza> {
    const { data, error } = await this.supabase
      .from('inv_carrozas')
      .update(carroza)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async eliminarCarroza(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('inv_carrozas')
      .update({ 
        fecha_eliminacion: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) throw error;
  }

  // --- MÉTODOS PARA EL STORAGE (IMÁGENES) ---

  async subirImagen(file: File, nombreModelo: string, index: number): Promise<string> {
    const nombreLimpio = nombreModelo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    const fileName = `${nombreLimpio}_${fecha}_${index}.webp`;
    const filePath = `carrozas/${fileName}`; 

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
      console.error('Error al intentar borrar la imagen de la carroza:', error);
    }
  }
}