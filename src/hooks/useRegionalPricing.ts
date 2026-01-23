import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export interface RegionalPrice {
  amount: string;
  currency: string;
  symbol: string;
  region: 'brazil' | 'europe' | 'global';
}

export function useRegionalPricing(): RegionalPrice {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  
  return useMemo(() => {
    // Detectar timezone para Europa
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isEurope = timezone.startsWith('Europe/') || 
      ['pt-PT', 'de', 'fr', 'es-ES', 'it', 'nl', 'pl'].some(l => lang.startsWith(l));
    
    // Brasil: R$ 69,90
    if (lang.startsWith('pt-BR') || lang === 'pt') {
      return {
        amount: '69,90',
        currency: 'BRL',
        symbol: 'R$',
        region: 'brazil'
      };
    }
    
    // Europa: €15
    if (isEurope) {
      return {
        amount: '15',
        currency: 'EUR',
        symbol: '€',
        region: 'europe'
      };
    }
    
    // Resto do mundo: $15 USD
    return {
      amount: '15',
      currency: 'USD',
      symbol: '$',
      region: 'global'
    };
  }, [lang]);
}

export function formatPrice(pricing: RegionalPrice): string {
  if (pricing.region === 'brazil') {
    return `${pricing.symbol} ${pricing.amount}`;
  }
  return `${pricing.symbol}${pricing.amount}`;
}
