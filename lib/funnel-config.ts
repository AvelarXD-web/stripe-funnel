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
    name: 'Acelerador VIP y Kit de Inicio Rápido',
    price: 4700, // $47.00
    displayPrice: '$47.00',
    tagline: 'Acelera tus resultados 3 veces más rápido con recursos listos',
    description: 'Oferta única: Acceso al kit secreto y módulos avanzados.',
    features: [
      'Plantillas de alta conversión listas para copiar y pegar',
      'Módulos avanzados de automatización y escalado',
      'Acceso a soporte prioritario VIP',
      'Ahorra más del 75% sobre el precio regular',
    ],
  },

  // Upsell 2 (OTO 2): $37.00
  upsell2: {
    id: 'upsell-2',
    name: 'Bóveda Exclusiva y Casos de Estudio Semanales',
    price: 3700, // $37.00
    displayPrice: '$37.00',
    tagline: 'Estrategias ganadoras y casos reales analizados a fondo',
    description: 'La bóveda definitiva con análisis detrás de cámaras y actualizaciones continuas.',
    features: [
      'Más de 20 casos de estudio reales analizados paso a paso',
      'Acceso a comunidad privada y actualizaciones mensuales',
      'Biblioteca de grabaciones exclusivas de preguntas y respuestas',
      'Bloquea el precio preferencial vitalicio hoy',
    ],
  },
};
