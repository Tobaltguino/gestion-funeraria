import { ServicioContratado } from '../../servicios/models/servicio.interface';
import { Carroza } from '../../../inventario/carrozas/models/carroza.interface';

export enum TipoEvento {
  FUNERAL = 'Funeral',
  VELORIO = 'Velorio'
}

export enum EstadoAgenda {
  PROGRAMADO = 'Programado',
  EN_CURSO = 'En Curso',
  FINALIZADO = 'Finalizado',
  CANCELADO = 'Cancelado'
}

export interface AgendaCarroza {
  id: string;
  servicio_id: string;
  carroza_id: string;
  tipo_evento: TipoEvento | string;
  
  fecha_evento: string; // Formato esperado: YYYY-MM-DD
  hora_inicio: string;  // Formato esperado: HH:mm:ss
  hora_termino: string; // Formato esperado: HH:mm:ss
  
  estado: EstadoAgenda | string;
  
  // Relaciones (Opcionales, útiles para cuando se hace un SELECT con JOIN)
  adm_servicios?: ServicioContratado; 
  inv_carrozas?: Carroza;
  
  fecha_creada?: string;
  fecha_actualizada?: string;
  fecha_eliminacion?: string | null;
}