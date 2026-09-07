export interface Urna {
  id: string;
  nombre: string;
  precio_costo: number;
  precio_venta: number;
  imagenes: string[]; // Arreglo de textos
  stock_actual: number;
  kpi_alerta_stock: number;
  fecha_creada?: string;
  fecha_actualizada?: string;
  fecha_eliminacion?: string | null;
}