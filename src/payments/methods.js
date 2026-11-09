// Payment methods by country. Card works everywhere; the countries the app speaks and prices for
// also get their most popular local methods. Everything here is simulated: no money moves.
//
// Kinds decide the checkout flow:
//   card    → card form, then a 3-D Secure style check
//   wallet  → the app on the shopper's phone (contact number) asks them to approve
//   code    → a one-time code typed at checkout (BLIK), then approved in the bank app
//   bank    → redirect to a bank portal (pick the bank first when `banks` is listed)
//   instant → instant transfer: QR + copy-paste code, or an account number (SPEI's CLABE)
//   voucher → a reference to pay later in cash or online; the order waits for the payment

export const METHODS = {
  card: { id: 'card', kind: 'card' },
  nequi: { id: 'nequi', kind: 'wallet', name: 'Nequi' },
  daviplata: { id: 'daviplata', kind: 'wallet', name: 'Daviplata' },
  pse: { id: 'pse', kind: 'bank', name: 'PSE', banks: ['Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA Colombia', 'Nu Colombia'] },
  pix: { id: 'pix', kind: 'instant', name: 'Pix', qr: true },
  boleto: { id: 'boleto', kind: 'voucher', name: 'Boleto' },
  oxxo: { id: 'oxxo', kind: 'voucher', name: 'OXXO Pay' },
  spei: { id: 'spei', kind: 'instant', name: 'SPEI', qr: false },
  mercadopago: { id: 'mercadopago', kind: 'instant', name: 'Mercado Pago', qr: true },
  webpay: { id: 'webpay', kind: 'bank', name: 'Webpay' },
  yape: { id: 'yape', kind: 'wallet', name: 'Yape' },
  plin: { id: 'plin', kind: 'wallet', name: 'Plin' },
  bizum: { id: 'bizum', kind: 'wallet', name: 'Bizum' },
  mbway: { id: 'mbway', kind: 'wallet', name: 'MB WAY' },
  multibanco: { id: 'multibanco', kind: 'voucher', name: 'Multibanco' },
  blik: { id: 'blik', kind: 'code', name: 'BLIK' },
  p24: { id: 'p24', kind: 'bank', name: 'Przelewy24', banks: ['PKO Bank Polski', 'mBank', 'Bank Pekao', 'ING Bank Śląski', 'Santander Bank Polska'] },
  satispay: { id: 'satispay', kind: 'wallet', name: 'Satispay' },
  bancomatpay: { id: 'bancomatpay', kind: 'wallet', name: 'Bancomat Pay' },
  postepay: { id: 'postepay', kind: 'wallet', name: 'Postepay' },
  paypal: { id: 'paypal', kind: 'bank', name: 'PayPal', hint: 'payment.hint.account' },
  venmo: { id: 'venmo', kind: 'wallet', name: 'Venmo' },
  cashapp: { id: 'cashapp', kind: 'wallet', name: 'Cash App Pay' },
  paybybank: { id: 'paybybank', kind: 'bank', name: 'Pay by Bank', banks: ['Barclays', 'HSBC UK', 'Lloyds', 'NatWest', 'Monzo'] },
  interac: { id: 'interac', kind: 'bank', name: 'Interac', banks: ['RBC Royal Bank', 'TD Canada Trust', 'Scotiabank', 'BMO', 'CIBC'] },
  payu: { id: 'payu', kind: 'bank', name: 'PayU', banks: ['PKO Bank Polski', 'mBank', 'Bank Pekao', 'ING Bank Śląski', 'Alior Bank'] }
};

export const COUNTRY_METHODS = {
  CO: ['nequi', 'daviplata', 'pse'],
  BR: ['pix', 'boleto'],
  MX: ['oxxo', 'spei'],
  AR: ['mercadopago'],
  CL: ['webpay'],
  PE: ['yape', 'plin'],
  ES: ['bizum'],
  PT: ['mbway', 'multibanco'],
  PL: ['blik', 'p24', 'payu'],
  IT: ['satispay', 'bancomatpay', 'postepay', 'paypal'],
  US: ['paypal', 'venmo', 'cashapp'],
  GB: ['paybybank', 'paypal'],
  CA: ['interac', 'paypal'],
  IE: ['paypal']
};

// Local methods first (they are what people there reach for), card always last.
export const methodsFor = (country) => [...(COUNTRY_METHODS[country] ?? []), 'card'].map((id) => METHODS[id]);

export const hasLocalMethods = (country) => Boolean(COUNTRY_METHODS[country]);

// Card helpers.
export const digitsOf = (value) => value.replace(/\D/g, '');

export const cardBrand = (number) => {
  const digits = digitsOf(number);
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  return null;
};

// "4242424242424242" → "4242 4242 4242 4242" (Amex: 4-6-5).
export const formatCardNumber = (value) => {
  const digits = digitsOf(value).slice(0, 19);
  const groups = cardBrand(digits) === 'amex' ? [4, 6, 5] : [4, 4, 4, 4, 3];
  const parts = [];
  let index = 0;
  for (const size of groups) {
    if (index >= digits.length) break;
    parts.push(digits.slice(index, index + size));
    index += size;
  }
  return parts.join(' ');
};

export const luhnValid = (number) => {
  const digits = digitsOf(number);
  if (digits.length < 13) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
};

// "MM/YY" still valid this month or later.
export const expiryValid = (value, now = new Date()) => {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
};

export const formatExpiry = (value) => {
  const digits = digitsOf(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

// Same convention as the big card processors' test cards: a number ending in 0002 is declined.
export const cardDeclined = (number) => digitsOf(number).endsWith('0002');

const randomDigits = (count) => Array.from({ length: count }, () => Math.floor(Math.random() * 10)).join('');

// Codes shown to the shopper. They look like the real formats but are made up.
export const paymentCode = (method, amount) => {
  switch (method.id) {
    case 'pix':
      return `00020126580014BR.GOV.BCB.PIX0136${crypto.randomUUID()}5204000053039865406${amount.toFixed(2)}5802BR5909NUTRIFLOW6009SAO PAULO62070503***6304${randomDigits(4)}`;
    case 'mercadopago':
      return `https://mpago.la/nf${randomDigits(7)}`;
    case 'spei':
      return `646180${randomDigits(12)}`.replace(/(\d{3})(\d{3})(\d{11})(\d)/, '$1 $2 $3 $4');
    case 'boleto':
      return `23793.38128 ${randomDigits(5)}.${randomDigits(6)} ${randomDigits(5)}.${randomDigits(6)} ${randomDigits(1)} ${randomDigits(14)}`;
    case 'oxxo':
      return randomDigits(14).replace(/(\d{4})(\d{4})(\d{4})(\d{2})/, '$1 $2 $3 $4');
    case 'multibanco':
      return `21212 · ${randomDigits(3)} ${randomDigits(3)} ${randomDigits(3)}`;
    default:
      return randomDigits(12);
  }
};
