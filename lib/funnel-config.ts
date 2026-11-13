export interface FunnelProduct {
  id: string;
  name: string;
  price: number; // in cents
  displayPrice: string;
  tagline: string;
  description: string;
  features: string[];
}

export const FUNNEL_CONFIG = {
  currency: 'usd',

  // URLs for the funnel pages
  urls: {
    upsell1: process.env.NEXT_PUBLIC_UPSELL_1_URL || 'https://premioapp.top/lat/2/up1/',
    upsell2: process.env.NEXT_PUBLIC_UPSELL_2_URL || 'https://premioapp.top/lat/2/up2/',
    thankYou: process.env.NEXT_PUBLIC_THANK_YOU_URL || 'https://premioapp.top/lat/2/sistema/',
  },
  
  // Front-end offer: $27.00
  frontend: {
    id: 'frontend',
    name: 'Start Digital System',
    price: 2700, // $27.00
    displayPrice: '$27.00',
    tagline: 'Acceso instantáneo a Start Digital System',
    description: 'El sistema probado paso a paso para obtener resultados rápidos.',
    features: [
      'Acceso inmediato de por vida',
      'Guía paso a paso de implementación',
      'Recursos y plantillas listas para usar',
      'Garantía de satisfacción de 30 días',
    ],
  },

  // Upsell 1 (OTO 1): $47.00
  upsell1: {
    id: 'upsell-1',
    name: 'ZapSpy - Recuperación de Mensajes Eliminados',
    price: 4700, // $47.00
    displayPrice: '$47.00',
    tagline: 'Accede y ve cada mensaje que eliminaron',
    description: 'Recuperación profunda de textos, fotos y audios eliminados hasta 90 días.',
    features: [
      'Recuperación de mensajes eliminados',
      'Acceso a fotos y audios borrados',
      'Historial de hasta 90 días',
      'Conexión segura e indetectable',
    ],
  },

  // Upsell 2 (OTO 2): $37.00
  upsell2: {
    id: 'upsell-2',
    name: 'ZapSpy - Modo Invisible y Bloqueo de Alerta',
    price: 3700, // $37.00
    displayPrice: '$37.00',
    tagline: 'Bloquea el aviso para que no te descubran',
    description: 'Apaga la notificación en su celular y tu espionaje queda 100% oculto.',
    features: [
      'Bloqueo de alertas en el dispositivo objetivo',
      'Modo 100% invisible y anónimo',
      'Monitoreo en tiempo real sin sospechas',
      'Protección permanente de acceso',
    ],
  },
};
