import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../../../core/supabase/supabase'; // 👇 Tu import correcto
import { Urna } from '../models/urna.interface';

@Injectable({
  providedIn: 'root'
})
export class UrnaService {
  private supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.client; 

  async obtenerUrnas(): Promise<Urna[]> {
    const { data, error } = await this.supabase
      .from('urnas')
      .select('*')
      .is('fecha_eliminacion', null)
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async crearUrna(urna: Partial<Urna>): Promise<Urna> {
    const { data, error } = await this.supabase
      .from('urnas')
      .insert([urna])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async actualizarUrna(id: string, urna: Partial<Urna>): Promise<Urna> {
    const { data, error } = await this.supabase
      .from('urnas')
      .update(urna)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async eliminarUrna(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('urnas')
      .update({ fecha_eliminacion: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // --- MÉTODOS PARA EL STORAGE (IMÁGENES) ---

  async subirImagen(file: File, nombreModelo: string, index: number): Promise<string> {
    // 1. Limpiamos el nombre: "Urna Caoba Premium!" -> "urna-caoba-premium"
    const nombreLimpio = nombreModelo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    
    // 2. Fecha actual: 20260907
    const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    // 3. Nombre final: urna-caoba-premium_20260907_1.webp
    const fileName = `${nombreLimpio}_${fecha}_${index}.webp`;
    const filePath = `urnas/${fileName}`; 

    const { error } = await this.supabase.storage
      .from('inventario')
      .upload(filePath, file, { upsert: true }); // upsert: true sobreescribe si por casualidad se repite el nombre

    if (error) throw error;

    const { data: publicUrlData } = this.supabase.storage
      .from('inventario')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  // Método para eliminar una imagen física del Bucket
  async eliminarImagenStorage(urlPublica: string): Promise<void> {
    try {
      // La URL viene como: https://.../storage/v1/object/public/inventario/urnas/foto.webp
      // Necesitamos extraer solo la ruta final: "urnas/foto.webp"
      const urlSplit = urlPublica.split('/inventario/');
      if (urlSplit.length > 1) {
        const filePath = urlSplit[1];
        await this.supabase.storage.from('inventario').remove([filePath]);
      }
    } catch (error) {
      console.error('Error al intentar borrar la imagen del bucket:', error);
    }
  }
}