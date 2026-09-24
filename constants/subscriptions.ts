export type PlanPeriod = 'mensual' | 'anual';

export type ServiceCategory =
  | 'Streaming'
  | 'Música'
  | 'Almacenamiento'
  | 'Productividad'
  | 'Gaming'
  | 'IA'
  | 'Educación';

export interface Plan {
  nombre: string;
  precio: number;
  periodo: PlanPeriod;
  precioMensual: number;
  descripcion: string;
}

export interface PredefinedSubscription {
  id: string;
  nombre: string;
  categoria: ServiceCategory;
  moneda: 'MXN';
  color: string;
  icono: string;
  planes: Plan[];
}

export const ALL_CATEGORIES: ServiceCategory[] = [
  'Streaming', 'Música', 'Almacenamiento', 'Productividad', 'Gaming', 'IA', 'Educación',
];

export const PREDEFINED_SUBSCRIPTIONS: PredefinedSubscription[] = [
  {
    id: 'netflix',
    nombre: 'Netflix',
    categoria: 'Streaming',
    moneda: 'MXN',
    color: '#E50914',
    icono: '🎬',
    planes: [
      { nombre: 'Estándar con anuncios', precio: 139, periodo: 'mensual', precioMensual: 139, descripcion: 'Calidad Full HD, con anuncios' },
      { nombre: 'Estándar', precio: 269, periodo: 'mensual', precioMensual: 269, descripcion: 'Full HD, sin anuncios, 2 pantallas' },
      { nombre: 'Premium 4K', precio: 369, periodo: 'mensual', precioMensual: 369, descripcion: '4K Ultra HD, sin anuncios, 4 pantallas' },
    ],
  },
  {
    id: 'spotify',
    nombre: 'Spotify',
    categoria: 'Música',
    moneda: 'MXN',
    color: '#1DB954',
    icono: '🎵',
    planes: [
      { nombre: 'Estudiante', precio: 74, periodo: 'mensual', precioMensual: 74, descripcion: 'Para estudiantes verificados' },
      { nombre: 'Individual', precio: 139, periodo: 'mensual', precioMensual: 139, descripcion: '1 cuenta, sin anuncios' },
      { nombre: 'Dúo', precio: 189, periodo: 'mensual', precioMensual: 189, descripcion: '2 cuentas para una misma dirección' },
      { nombre: 'Familiar', precio: 239, periodo: 'mensual', precioMensual: 239, descripcion: 'Hasta 6 cuentas para la familia' },
    ],
  },
  {
    id: 'disney-plus',
    nombre: 'Disney+',
    categoria: 'Streaming',
    moneda: 'MXN',
    color: '#113CCF',
    icono: '🏰',
    planes: [
      { nombre: 'Con anuncios', precio: 149, periodo: 'mensual', precioMensual: 149, descripcion: 'Contenido Disney, Marvel, Star Wars con anuncios' },
      { nombre: 'Sin anuncios', precio: 249, periodo: 'mensual', precioMensual: 249, descripcion: 'Sin anuncios, Full HD' },
      { nombre: 'Premium', precio: 319, periodo: 'mensual', precioMensual: 319, descripcion: '4K Ultra HD, Dolby Atmos' },
    ],
  },
  {
    id: 'max',
    nombre: 'Max (HBO)',
    categoria: 'Streaming',
    moneda: 'MXN',
    color: '#002BE7',
    icono: '📺',
    planes: [
      { nombre: 'Con anuncios', precio: 149, periodo: 'mensual', precioMensual: 149, descripcion: 'Series y películas HBO con anuncios' },
      { nombre: 'Estándar', precio: 239, periodo: 'mensual', precioMensual: 239, descripcion: 'Sin anuncios, Full HD' },
      { nombre: 'Platino', precio: 319, periodo: 'mensual', precioMensual: 319, descripcion: '4K Ultra HD, Dolby Atmos' },
    ],
  },
  {
    id: 'prime-video',
    nombre: 'Prime Video',
    categoria: 'Streaming',
    moneda: 'MXN',
    color: '#00A8E1',
    icono: '🎥',
    planes: [
      { nombre: 'Con anuncios', precio: 99, periodo: 'mensual', precioMensual: 99, descripcion: 'Series y películas Amazon con anuncios' },
      { nombre: 'Sin anuncios', precio: 149, periodo: 'mensual', precioMensual: 149, descripcion: 'Sin anuncios, incluye envíos Prime' },
    ],
  },
  {
    id: 'apple-tv',
    nombre: 'Apple TV+',
    categoria: 'Streaming',
    moneda: 'MXN',
    color: '#1C1C1E',
    icono: '🍎',
    planes: [
      { nombre: 'Estándar', precio: 169, periodo: 'mensual', precioMensual: 169, descripcion: 'Originales Apple en 4K HDR' },
    ],
  },
  {
    id: 'apple-music',
    nombre: 'Apple Music',
    categoria: 'Música',
    moneda: 'MXN',
    color: '#FC3C44',
    icono: '🎶',
    planes: [
      { nombre: 'Estudiante', precio: 69, periodo: 'mensual', precioMensual: 69, descripcion: 'Para estudiantes verificados' },
      { nombre: 'Individual', precio: 109, periodo: 'mensual', precioMensual: 109, descripcion: '100M canciones, sin anuncios' },
      { nombre: 'Familiar', precio: 169, periodo: 'mensual', precioMensual: 169, descripcion: 'Hasta 6 personas' },
    ],
  },
  {
    id: 'apple-one',
    nombre: 'Apple One',
    categoria: 'Productividad',
    moneda: 'MXN',
    color: '#A2AAAD',
    icono: '🍏',
    planes: [
      { nombre: 'Individual', precio: 249, periodo: 'mensual', precioMensual: 249, descripcion: 'TV+, Music, Arcade, iCloud+ 50GB' },
      { nombre: 'Familiar', precio: 349, periodo: 'mensual', precioMensual: 349, descripcion: 'TV+, Music, Arcade, iCloud+ 200GB, hasta 6' },
      { nombre: 'Premier', precio: 479, periodo: 'mensual', precioMensual: 479, descripcion: '+ News+, Fitness+, iCloud+ 2TB' },
    ],
  },
  {
    id: 'icloud',
    nombre: 'iCloud+',
    categoria: 'Almacenamiento',
    moneda: 'MXN',
    color: '#3693F3',
    icono: '☁️',
    planes: [
      { nombre: '50 GB', precio: 17, periodo: 'mensual', precioMensual: 17, descripcion: '50 GB de almacenamiento en iCloud' },
      { nombre: '200 GB', precio: 49, periodo: 'mensual', precioMensual: 49, descripcion: '200 GB, compartible con familia' },
      { nombre: '2 TB', precio: 169, periodo: 'mensual', precioMensual: 169, descripcion: '2 TB, dominio personalizado' },
      { nombre: '6 TB', precio: 499, periodo: 'mensual', precioMensual: 499, descripcion: '6 TB para toda la familia' },
    ],
  },
  {
    id: 'youtube-premium',
    nombre: 'YouTube Premium',
    categoria: 'Streaming',
    moneda: 'MXN',
    color: '#FF0000',
    icono: '▶️',
    planes: [
      { nombre: 'Lite', precio: 99, periodo: 'mensual', precioMensual: 99, descripcion: 'Solo sin anuncios, sin descarga offline' },
      { nombre: 'Individual', precio: 169, periodo: 'mensual', precioMensual: 169, descripcion: 'Sin anuncios, YouTube Music, offline' },
      { nombre: 'Familiar', precio: 259, periodo: 'mensual', precioMensual: 259, descripcion: 'Hasta 5 miembros del hogar' },
    ],
  },
  {
    id: 'google-one',
    nombre: 'Google One',
    categoria: 'Almacenamiento',
    moneda: 'MXN',
    color: '#4285F4',
    icono: '🗄️',
    planes: [
      { nombre: '100 GB', precio: 35, periodo: 'mensual', precioMensual: 35, descripcion: '100 GB para Gmail, Drive y Fotos' },
      { nombre: '200 GB', precio: 59, periodo: 'mensual', precioMensual: 59, descripcion: '200 GB compartible con familia' },
      { nombre: '2 TB', precio: 169, periodo: 'mensual', precioMensual: 169, descripcion: '2 TB + beneficios premium Google' },
    ],
  },
  {
    id: 'microsoft-365',
    nombre: 'Microsoft 365',
    categoria: 'Productividad',
    moneda: 'MXN',
    color: '#D83B01',
    icono: '💼',
    planes: [
      { nombre: 'Personal', precio: 1699, periodo: 'anual', precioMensual: 142, descripcion: '1 usuario, 1TB OneDrive, Office apps' },
      { nombre: 'Familiar', precio: 2199, periodo: 'anual', precioMensual: 183, descripcion: 'Hasta 6 usuarios, 1TB c/u' },
    ],
  },
  {
    id: 'adobe-cc',
    nombre: 'Adobe Creative Cloud',
    categoria: 'Productividad',
    moneda: 'MXN',
    color: '#FF0000',
    icono: '🎨',
    planes: [
      { nombre: 'Express Premium', precio: 199, periodo: 'mensual', precioMensual: 199, descripcion: 'Adobe Express con funciones premium' },
      { nombre: 'Fotografía', precio: 399, periodo: 'mensual', precioMensual: 399, descripcion: 'Photoshop + Lightroom, 20GB' },
      { nombre: 'Todo incluido', precio: 1399, periodo: 'mensual', precioMensual: 1399, descripcion: 'Todas las apps Creative Cloud' },
    ],
  },
  {
    id: 'crunchyroll',
    nombre: 'Crunchyroll',
    categoria: 'Streaming',
    moneda: 'MXN',
    color: '#F47521',
    icono: '⛩️',
    planes: [
      { nombre: 'Fan', precio: 199, periodo: 'mensual', precioMensual: 199, descripcion: 'Anime sin anuncios, 1 stream' },
      { nombre: 'Mega Fan', precio: 279, periodo: 'mensual', precioMensual: 279, descripcion: '4 streams, acceso offline' },
      { nombre: 'Ultimate Fan', precio: 359, periodo: 'mensual', precioMensual: 359, descripcion: '6 streams, descuentos en tienda' },
    ],
  },
  {
    id: 'paramount-plus',
    nombre: 'Paramount+',
    categoria: 'Streaming',
    moneda: 'MXN',
    color: '#0064FF',
    icono: '⭐',
    planes: [
      { nombre: 'Esencial', precio: 179, periodo: 'mensual', precioMensual: 179, descripcion: 'Series y películas Paramount con anuncios' },
      { nombre: 'Premium', precio: 279, periodo: 'mensual', precioMensual: 279, descripcion: 'Sin anuncios, CBS en vivo' },
    ],
  },
  {
    id: 'duolingo',
    nombre: 'Duolingo Plus',
    categoria: 'Educación',
    moneda: 'MXN',
    color: '#58CC02',
    icono: '🦉',
    planes: [
      { nombre: 'Mensual', precio: 133, periodo: 'mensual', precioMensual: 133, descripcion: 'Sin anuncios, vidas ilimitadas' },
      { nombre: 'Anual', precio: 999, periodo: 'anual', precioMensual: 83, descripcion: 'Sin anuncios, ahorra 38% vs mensual' },
    ],
  },
  {
    id: 'chatgpt',
    nombre: 'ChatGPT',
    categoria: 'IA',
    moneda: 'MXN',
    color: '#10A37F',
    icono: '🤖',
    planes: [
      { nombre: 'Plus', precio: 400, periodo: 'mensual', precioMensual: 400, descripcion: 'GPT-4o, acceso prioritario, DALL·E' },
      { nombre: 'Pro', precio: 4000, periodo: 'mensual', precioMensual: 4000, descripcion: 'o1 Pro ilimitado, uso sin límites' },
    ],
  },
  {
    id: 'claude',
    nombre: 'Claude Pro',
    categoria: 'IA',
    moneda: 'MXN',
    color: '#D97757',
    icono: '✨',
    planes: [
      { nombre: 'Pro', precio: 400, periodo: 'mensual', precioMensual: 400, descripcion: 'Claude Sonnet y Opus, prioridad en uso' },
    ],
  },
  {
    id: 'xbox-game-pass',
    nombre: 'Xbox Game Pass',
    categoria: 'Gaming',
    moneda: 'MXN',
    color: '#107C10',
    icono: '🎮',
    planes: [
      { nombre: 'Core', precio: 149, periodo: 'mensual', precioMensual: 149, descripcion: 'Biblioteca de juegos + multijugador online' },
      { nombre: 'Standard', precio: 199, periodo: 'mensual', precioMensual: 199, descripcion: 'Biblioteca completa + descuentos' },
      { nombre: 'Ultimate', precio: 299, periodo: 'mensual', precioMensual: 299, descripcion: 'PC + consola + EA Play + Cloud Gaming' },
    ],
  },
  {
    id: 'nintendo-switch-online',
    nombre: 'Nintendo Switch Online',
    categoria: 'Gaming',
    moneda: 'MXN',
    color: '#E4000F',
    icono: '🕹️',
    planes: [
      { nombre: 'Individual', precio: 89, periodo: 'mensual', precioMensual: 89, descripcion: 'Online + clásicos NES y SNES' },
      { nombre: 'Familiar', precio: 159, periodo: 'mensual', precioMensual: 159, descripcion: 'Hasta 8 usuarios en la familia' },
      { nombre: 'Expansion Pack', precio: 189, periodo: 'mensual', precioMensual: 189, descripcion: '+ N64, Game Boy y DLCs exclusivos' },
    ],
  },
];
