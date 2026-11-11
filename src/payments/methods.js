// Payment method adapters. Which ones a country offers, and in which order, is data: the
// `payments` list of its RegionProfile. Everything here is simulated: no money moves.
//
// Kinds decide the checkout flow:
//   card    → card form, then a 3-D Secure style check
//   wallet  → an app on the shopper's phone (or Apple Pay / Google Pay) asks them to approve
//   bank    → redirect to a bank portal (pick the bank first when `banks` is listed)
//   instant → instant payment by QR + copy-paste code
//   voucher → a reference to pay later in cash or online; the order waits for the payment
//   cash    → paid to the courier on delivery
// Generic methods carry a message key (`label`) instead of a brand name.

export const METHODS = {
  card: { id: 'card', kind: 'card' },
  nequi: { id: 'nequi', kind: 'wallet', name: 'Nequi' },
  daviplata: { id: 'daviplata', kind: 'wallet', name: 'Daviplata' },
  pse: { id: 'pse', kind: 'bank', name: 'PSE', banks: ['Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA Colombia', 'Nu Colombia'] },
  pix: { id: 'pix', kind: 'instant', name: 'Pix', qr: true },
  boleto: { id: 'boleto', kind: 'voucher', name: 'Boleto' },
  applepay: { id: 'applepay', kind: 'wallet', name: 'Apple Pay', hint: 'payment.hint.device' },
  googlepay: { id: 'googlepay', kind: 'wallet', name: 'Google Pay', hint: 'payment.hint.device' },
  ach: { id: 'ach', kind: 'bank', name: 'ACH', banks: ['Chase', 'Bank of America', 'Wells Fargo', 'Citi', 'Capital One'] },
  paypal: { id: 'paypal', kind: 'bank', name: 'PayPal', hint: 'payment.hint.account' },
  sepa: { id: 'sepa', kind: 'bank', name: 'SEPA', banks: ['BNP Paribas', 'Société Générale', 'Crédit Agricole', 'LCL', 'La Banque Postale'] },
  paypay: { id: 'paypay', kind: 'instant', name: 'PayPay', qr: true },
  konbini: { id: 'konbini', kind: 'voucher', label: 'payment.method.konbini' },
  cash: { id: 'cash', kind: 'cash', label: 'payment.method.cash' }
};

// The methods a country offers, in the order its profile lists them.
export const methodsFor = (profile) => (profile?.payments ?? ['card']).map((id) => METHODS[id]).filter(Boolean);

// The name shown to the shopper: the brand, or the translated name of a generic method.
export const methodName = (method, t) => (method.label ? t(method.label) : method.name ?? t('payment.card'));

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
// `amount` is in major units (reais, yen…).
export const paymentCode = (method, amount) => {
  switch (method.id) {
    case 'pix':
      return `00020126580014BR.GOV.BCB.PIX0136${crypto.randomUUID()}5204000053039865406${amount.toFixed(2)}5802BR5909NUTRIFLOW6009SAO PAULO62070503***6304${randomDigits(4)}`;
    case 'boleto':
      return `23793.38128 ${randomDigits(5)}.${randomDigits(6)} ${randomDigits(5)}.${randomDigits(6)} ${randomDigits(1)} ${randomDigits(14)}`;
    case 'paypay':
      return `https://qr.paypay.ne.jp/nf${randomDigits(10)}`;
    case 'konbini':
      return `${randomDigits(4)}-${randomDigits(4)}-${randomDigits(4)}`;
    default:
      return randomDigits(12);
  }
};
