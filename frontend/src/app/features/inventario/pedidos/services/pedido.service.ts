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