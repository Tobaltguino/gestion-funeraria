export enum CarrozaEstado {
  DISPONIBLE = 'Disponible',
  EN_USO = 'En Uso',
  MANTENIMIENTO = 'Mantenimiento'
}

export interface Carroza {
  id: string;
  marca: string;
  modelo: string;
  color: string;
  patente: string;
  estado: CarrozaEstado;
  imagenes: string[];
  eliminado?: boolean;
  fecha_eliminacion?: string | null;
  fecha_creada?: string;
  fecha_actualizada?: string;
}