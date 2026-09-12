export enum CategoriaAdicional {
  FIJO = 'Fijo',
  LUCES = 'Luces',
  EXTRA = 'Extra',
  FLORAL = 'Floral',
  COMIDA = 'Comida'
}

export interface Adicional {
  id: string;
  nombre: string;
  descripcion?: string;     
  categoria: CategoriaAdicional | string;
  disponible: boolean;       
  precio_costo: number;
  precio_venta: number;
  imagenes: string[]; 
  fecha_creada?: string;
  fecha_actualizada?: string;
  fecha_eliminacion?: string | null;
}