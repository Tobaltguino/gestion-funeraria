import { Urna } from '../../urnas/models/urna.interface'; // Ajusta la ruta según tu estructura

export enum PedidoEstado {
  PENDIENTE = 'Pendiente',
  RECIBIDO = 'Recibido',
  CANCELADO = 'Cancelado'
}

export interface Pedido {
  id: string;
  urna_id: string;
  cantidad: number;
  fecha_pedido?: string;
  fecha_llegada?: string | null;
  estado_manual: PedidoEstado;
  fecha_creada?: string;
  fecha_actualizada?: string;
  fecha_eliminacion?: string | null;

  // Propiedad relacional: Supabase inyectará aquí los datos de la urna
  urnas?: Urna; 
}