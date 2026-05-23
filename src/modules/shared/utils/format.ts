import type { Currency } from '../types';

const localeMap: Record<Currency, string> = {
  MXN: 'es-MX',
  USD: 'en-US',
  EUR: 'es-ES',
  CAD: 'en-CA',
  GBP: 'en-GB',
  ARS: 'es-AR',
  CLP: 'es-CL',
  COP: 'es-CO',
  PEN: 'es-PE',
  BRL: 'pt-BR',
};

export function formatCurrency(value: number, currency: Currency = 'MXN'): string {
  return new Intl.NumberFormat(localeMap[currency], {
    style: 'currency',
    currency,
  }).format(value);
}

export const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'MXN', label: 'MXN - Peso Mexicano' },
  { value: 'USD', label: 'USD - Dólar Americano' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'CAD', label: 'CAD - Dólar Canadiense' },
  { value: 'GBP', label: 'GBP - Libra Esterlina' },
  { value: 'ARS', label: 'ARS - Peso Argentino' },
  { value: 'CLP', label: 'CLP - Peso Chileno' },
  { value: 'COP', label: 'COP - Peso Colombiano' },
  { value: 'PEN', label: 'PEN - Sol Peruano' },
  { value: 'BRL', label: 'BRL - Real Brasileño' },
];
