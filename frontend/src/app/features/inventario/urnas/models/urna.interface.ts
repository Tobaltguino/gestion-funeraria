export enum UrnaTipo {
  FINA = 'Fina',
  TERCIADO = 'Terciado',
  PINO = 'Pino',
  OTRAS = 'Otras'
}

export enum UrnaTamano {
  LARGO = 'Largo',
  BEBE = 'Bebe',
  REDUCCION = 'Reduccion',
  ESTANDAR = 'Estandar',
  OTRAS_MEDIDAS = 'Otras medidas'
}

export enum UrnaCuerpo {
  UN_CUERPO = '1 Cuerpo',
  DOS_CUERPOS = '2 Cuerpos',
  TRES_CUERPOS = '3 Cuerpos',
  CUATRO_CUERPOS = '4 Cuerpos'
}

export interface Urna {
  id: string;
  nombre: string;
  precio_costo: number;
  imagenes: string[];
  stock_actual: number;
  kpi_alerta_stock: number;
  
  // -- NUEVOS CAMPOS --
  tipo_urna?: UrnaTipo;
  tamano?: UrnaTamano;
  cuerpo?: UrnaCuerpo;
  
  fecha_creada?: string;
  fecha_actualizada?: string;
  fecha_eliminacion?: string | null;
}