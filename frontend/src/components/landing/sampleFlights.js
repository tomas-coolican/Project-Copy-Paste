// Contenido deliberadamente ficticio, tomado del prototipo visual de la landing.
const fecha = (hora) => new Date(`2026-11-14T${hora}:00`);

export const DEMO_NOW = fecha('07:00');
export const DEMO_UPDATED_AT = fecha('09:12');

export const DEMO_FLIGHTS = [
  {
    id: 'demo-ar-1420', tipo: 'salidas', numeroVuelo: 'AR 1420', origen: 'EZE', destino: 'COR',
    origenCiudad: 'Buenos Aires', destinoCiudad: 'Córdoba', fechaSalida: fecha('08:20'), fechaLlegada: fecha('09:45'),
    asientosDisponibles: 42, capacidad: 160, precioBase: 48000, estado: 'Embarcando',
  },
  {
    id: 'demo-ar-1182', tipo: 'salidas', numeroVuelo: 'AR 1182', origen: 'AEP', destino: 'MDZ',
    origenCiudad: 'Buenos Aires', destinoCiudad: 'Mendoza', fechaSalida: fecha('09:05'), fechaLlegada: fecha('10:30'),
    asientosDisponibles: 18, capacidad: 150, precioBase: 52000, estado: 'Programado',
  },
  {
    id: 'demo-ar-1744', tipo: 'salidas', numeroVuelo: 'AR 1744', origen: 'EZE', destino: 'IGR',
    origenCiudad: 'Buenos Aires', destinoCiudad: 'Iguazú', fechaSalida: fecha('09:40'), fechaLlegada: fecha('11:15'),
    asientosDisponibles: 9, capacidad: 150, precioBase: 68000, estado: 'Demorado',
  },
  {
    id: 'demo-ar-1533', tipo: 'salidas', numeroVuelo: 'AR 1533', origen: 'COR', destino: 'EZE',
    origenCiudad: 'Córdoba', destinoCiudad: 'Buenos Aires', fechaSalida: fecha('10:15'), fechaLlegada: fecha('11:40'),
    asientosDisponibles: 64, capacidad: 160, precioBase: 48000, estado: 'Programado',
  },
  {
    id: 'demo-ar-1421', tipo: 'llegadas', numeroVuelo: 'AR 1421', origen: 'COR', destino: 'EZE',
    origenCiudad: 'Córdoba', destinoCiudad: 'Buenos Aires', fechaSalida: fecha('07:10'), fechaLlegada: fecha('08:35'),
    asientosDisponibles: 27, capacidad: 160, precioBase: 48000, estado: 'Aterrizó',
  },
  {
    id: 'demo-ar-1183', tipo: 'llegadas', numeroVuelo: 'AR 1183', origen: 'MDZ', destino: 'AEP',
    origenCiudad: 'Mendoza', destinoCiudad: 'Buenos Aires', fechaSalida: fecha('08:00'), fechaLlegada: fecha('09:20'),
    asientosDisponibles: 12, capacidad: 150, precioBase: 52000, estado: 'En aproximación',
  },
  {
    id: 'demo-ar-1745', tipo: 'llegadas', numeroVuelo: 'AR 1745', origen: 'IGR', destino: 'EZE',
    origenCiudad: 'Iguazú', destinoCiudad: 'Buenos Aires', fechaSalida: fecha('08:30'), fechaLlegada: fecha('09:55'),
    asientosDisponibles: 6, capacidad: 150, precioBase: 68000, estado: 'Demorado',
  },
  {
    id: 'demo-ar-1534', tipo: 'llegadas', numeroVuelo: 'AR 1534', origen: 'EZE', destino: 'COR',
    origenCiudad: 'Buenos Aires', destinoCiudad: 'Córdoba', fechaSalida: fecha('09:05'), fechaLlegada: fecha('10:30'),
    asientosDisponibles: 51, capacidad: 160, precioBase: 48000, estado: 'Programado',
  },
];

export const DEMO_HERO_FLIGHT = DEMO_FLIGHTS[0];
