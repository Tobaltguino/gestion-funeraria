import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../../../core/supabase/supabase';
import { AgendaCarroza } from '../models/agenda-carroza.interface';

@Injectable({
  providedIn: 'root'
})
export class AgendaCarrozasService {
  private supabaseService = inject(SupabaseService);

  private get supabase() {
    return this.supabaseService.client;
  }

  // --- OBTENER ---
  async obtenerAgendas(inicio: string, fin: string): Promise<AgendaCarroza[]> {
    const { data, error } = await this.supabase
      .from('adm_agenda_carrozas')
      .select(`
        *,
        adm_servicios (nombre_fallecido, folio),
        inv_carrozas (marca, modelo, patente)
      `)
      .is('fecha_eliminacion', null)
      .gte('fecha_evento', inicio)
      .lte('fecha_evento', fin) // Filtramos por el rango visible en el calendario
      .order('fecha_evento', { ascending: false })
      .order('hora_inicio', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async obtenerAgendaPorId(id: string): Promise<AgendaCarroza | null> {
    const { data, error } = await this.supabase
      .from('adm_agenda_carrozas')
      .select(`
        *,
        adm_servicios (nombre_fallecido, folio),
        inv_carrozas (marca, modelo, patente)
      `)
      .eq('id', id)
      .is('fecha_eliminacion', null)
      .single();

    if (error) throw error;
    return data;
  }

  // --- CREAR ---
  async crearAgenda(agenda: Partial<AgendaCarroza>): Promise<void> {
    const { error } = await this.supabase
      .from('adm_agenda_carrozas')
      .insert([{ 
        ...agenda, 
        fecha_creada: new Date().toISOString() 
      }]);

    if (error) throw error;
  }

  // --- ACTUALIZAR ---
  async actualizarAgenda(id: string, agenda: Partial<AgendaCarroza>): Promise<void> {
    const { error } = await this.supabase
      .from('adm_agenda_carrozas')
      .update({ 
        ...agenda, 
        fecha_actualizada: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) throw error;
  }

  // --- ELIMINAR (Borrado Lógico) ---
  async eliminarAgenda(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('adm_agenda_carrozas')
      .update({ fecha_eliminacion: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }
}