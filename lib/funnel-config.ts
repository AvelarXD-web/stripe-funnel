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
    name: 'Core System & Masterclass',
    price: 2700, // $27.00
    displayPrice: '$27.00',
    tagline: 'Get instant access to the complete breakthrough system',
    description: 'The proven step-by-step blueprint designed to get you rapid results.',
    features: [
      'Instant lifetime access to the full digital program',
      'Step-by-step implementation roadmap & templates',
      'Plug-and-play resources & worksheets',
      '30-Day 100% Risk-Free Money Back Guarantee',
    ],
  },

  // Upsell 1 (OTO 1): $47.00
  upsell1: {
    id: 'upsell-1',
    name: 'VIP Accelerator & Fast-Track Toolkit',
    price: 4700, // $47.00
    displayPrice: '$47.00',
    tagline: 'Speed up your results 3x faster with done-for-you assets',
    description: 'Special one-time offer: Get access to the secret toolkit and advanced modules.',
    features: [
      'Done-For-You Swipe Files & High-Converting Templates',
      'Advanced Automation & Scaling Video Modules',
      'Priority VIP Support Access',
      'Save over 75% OFF regular pricing (One-Time Opportunity)',
    ],
  },

  // Upsell 2 (OTO 2): $37.00
  upsell2: {
    id: 'upsell-2',
    name: 'Exclusive Insider Vault & Weekly Case Studies',
    price: 3700, // $37.00
    displayPrice: '$37.00',
    tagline: 'Never run out of winning strategies and proven breakthroughs',
    description: 'The ultimate vault with behind-the-scenes breakdowns and monthly updates.',
    features: [
      'Access to 20+ Real-world Breakdowns & Case Studies',
      'Private Community Access & Monthly Updates',
      'Exclusive Q&A Recordings Library',
      'Lock in the lifetime grandfathered price today',
    ],
  },
};
