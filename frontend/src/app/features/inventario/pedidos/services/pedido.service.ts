import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '../../../../core/supabase/supabase';
import { Pedido } from '../models/pedido.interface';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private supabase: SupabaseClient;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.client;
  }

  // --- CRUD DE PEDIDOS ---

  async obtenerPedidos(): Promise<Pedido[]> {
    const { data, error } = await this.supabase
      .from('inv_pedidos')
      .select('*, inv_urnas(*)') // ¡Magia relacional! Trae el pedido y los datos de la urna
      .is('fecha_eliminacion', null)
      .order('fecha_pedido', { ascending: false }); // Los más recientes primero

    if (error) throw error;
    return data || [];
  }

  // --- MÉTODOS DE PAGINACIÓN Y FILTRADO ---

  async obtenerPedidosPaginados(filtros: any, page: number, pageSize: number): Promise<{ data: Pedido[], total: number }> {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase
      .from('inv_pedidos')
      .select('*, inv_urnas(*)', { count: 'exact' }) // Mantenemos la magia relacional
      .is('fecha_eliminacion', null)
      .order('fecha_pedido', { ascending: false });

    // Filtro de Fecha (Mes y Año)
    if (filtros.anio && filtros.mes) {
      const startDate = new Date(filtros.anio, filtros.mes - 1, 1).toISOString();
      // El día 0 del mes siguiente nos da el último día del mes actual
      const endDate = new Date(filtros.anio, filtros.mes, 0, 23, 59, 59).toISOString(); 
      query = query.gte('fecha_pedido', startDate).lte('fecha_pedido', endDate);
    }

    // Filtros Exactos
    if (filtros.urna_id) {
      query = query.eq('urna_id', filtros.urna_id);
    }
    if (filtros.estado_manual) {
      query = query.eq('estado_manual', filtros.estado_manual);
    }

    // Paginación
    const { data, error, count } = await query.range(from, to);

    if (error) throw error;
    return { data: data as Pedido[], total: count || 0 };
  }

  async crearPedido(pedido: Partial<Pedido>): Promise<Pedido> {
    // Si no viene fecha_pedido, le asignamos la actual
    if (!pedido.fecha_pedido) {
      pedido.fecha_pedido = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('inv_pedidos')
      .insert(pedido)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async actualizarPedido(id: string, pedido: Partial<Pedido>): Promise<Pedido> {
    const { data, error } = await this.supabase
      .from('inv_pedidos')
      .update(pedido)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async eliminarPedido(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('inv_pedidos')
      .update({ fecha_eliminacion: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }
}