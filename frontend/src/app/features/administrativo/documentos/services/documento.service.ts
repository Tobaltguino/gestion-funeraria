import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../../core/supabase/supabase';
import { Documento } from '../models/documento.interface';

@Injectable({
  providedIn: 'root'
})
export class DocumentoService {
  private supabase: SupabaseClient;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.client;
  }

  // --- MÉTODOS DE PAGINACIÓN Y FILTRADO ---
  
  async obtenerDocumentosPaginados(filtros: any, page: number, pageSize: number): Promise<{ data: Documento[], total: number }> {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase
      .from('adm_documentos')
      .select('*', { count: 'exact' })
      .is('fecha_eliminacion', null)
      .order('fecha_creada', { ascending: false }); // Los más recientes primero

    // Aplicar filtros dinámicos
    if (filtros.nombre) {
      query = query.ilike('nombre', `%${filtros.nombre}%`);
    }
    if (filtros.tipo) {
      query = query.eq('tipo', filtros.tipo);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;
    return { data: data as Documento[], total: count || 0 };
  }

  // --- CRUD BÁSICO ---

  async crearDocumento(documento: Partial<Documento>): Promise<Documento> {
    const { data, error } = await this.supabase
      .from('adm_documentos')
      .insert(documento)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async actualizarDocumento(id: string, documento: Partial<Documento>): Promise<Documento> {
    const { data, error } = await this.supabase
      .from('adm_documentos')
      .update(documento)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async eliminarDocumento(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('adm_documentos')
      .update({ fecha_eliminacion: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // --- MÉTODOS PARA EL STORAGE (ARCHIVOS) ---

  // 1. Agregamos el parámetro 'tipo' a la función
  async subirDocumento(file: File, nombreDoc: string, tipo: string): Promise<string> {
    
    const extension = file.name.split('.').pop() || 'file';
    const nombreLimpio = nombreDoc.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const uniqueId = Math.random().toString(36).substring(2, 8); 
    
    const fileName = `${nombreLimpio}_${fecha}_${uniqueId}.${extension}`;
    
    // 2. AQUÍ ESTÁ LA MAGIA: Agregamos el tipo como carpeta en la ruta
    // Ejemplo: "Contrato/certificado-medico_20260915_a1b2c3.pdf"
    const filePath = `${tipo}/${fileName}`; 

    const { error } = await this.supabase.storage
      .from('documentos')
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    const { data: publicUrlData } = this.supabase.storage
      .from('documentos')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  async eliminarDocumentoStorage(urlPublica: string): Promise<void> {
    try {
      // Extrae la ruta de la URL: https://.../storage/v1/object/public/documentos/archivo.pdf -> archivo.pdf
      const urlSplit = urlPublica.split('/documentos/');
      if (urlSplit.length > 1) {
        const filePath = urlSplit[1];
        await this.supabase.storage.from('documentos').remove([filePath]);
      }
    } catch (error) {
      console.error('Error al intentar borrar el archivo del bucket:', error);
    }
  }
}