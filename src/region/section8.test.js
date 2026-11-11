import { describe, expect, it } from 'vitest';
import { createTranslator } from '../i18n/i18n';
import { methodsFor } from '../payments/methods';
import { quote } from './money';
import { listPrice, profileFor } from './profiles';

// Assignment, section 8: the same logical order in the five countries — two lunches, a delivery and
// a tip, placed at 20:30 local time on 15 November. The instant is stored in UTC; each country
// shows it in its own zone and format.
const LUNCH = 66;
const plain = (text) => text.replace(/[\u00a0\u202f]/g, ' ');

const expected = {
  CO: {
    at: '2026-11-16T01:30:00Z', date: '15/11/2026', time: /^08:30:00 p\. ?m\.$/, totalLabel: 'Total',
    subtotal: '$ 37.800', delivery: '$ 5.900', tax: 'Impuesto Nacional al Consumo 8% · $ 2.800 (incluido)', tip: '$ 3.780', total: '$ 47.480',
    receipt: 'Factura electrónica de venta', payments: ['nequi', 'pse', 'card', 'daviplata', 'cash'], tipMode: 'optional'
  },
  BR: {
    at: '2026-11-15T23:30:00Z', date: '15/11/2026', time: /^20:30:00$/, totalLabel: 'Total',
    subtotal: 'R$ 65,80', delivery: 'R$ 7,99', tax: 'ICMS 18% · R$ 10,04 (incluido)', tip: 'R$ 6,58', total: 'R$ 80,37',
    receipt: 'NFC-e', payments: ['pix', 'card', 'boleto', 'cash'], tipMode: 'optional'
  },
  US: {
    at: '2026-11-16T01:30:00Z', date: '11/15/2026', time: /^08:30:00 PM$/, totalLabel: 'Total',
    subtotal: '$29.98', delivery: '$3.99', tax: 'Sales tax 8.875% · $2.66 (sumado)', tip: '$5.40', total: '$42.03',
    receipt: 'Receipt', payments: ['card', 'applepay', 'googlepay', 'ach', 'paypal'], tipMode: 'suggested'
  },
  FR: {
    at: '2026-11-15T19:30:00Z', date: '15/11/2026', time: /^20:30:00$/, totalLabel: 'Total',
    subtotal: '25,80 €', delivery: '2,99 €', tax: 'TVA 10 % · 2,35 € (incluido)', tip: '2,58 €', total: '31,37 €',
    receipt: 'Facture', payments: ['card', 'applepay', 'sepa', 'paypal'], tipMode: 'optional'
  },
  JP: {
    at: '2026-11-15T11:30:00Z', date: '2026/11/15', time: /^20:30:00$/, totalLabel: '合計',
    subtotal: '￥1,960', delivery: '￥330', tax: '消費税 8% · ￥145 (incluido)', tip: '￥0', total: '￥2,290',
    receipt: '適格請求書', payments: ['card', 'paypay', 'konbini'], tipMode: 'none'
  }
};

describe('section 8: the same order in the five countries', () => {
  for (const [country, want] of Object.entries(expected)) {
    it(`gives the expected summary and receipt data in ${country}`, () => {
      const profile = profileFor(country);
      const { t, formatPrice, formatPercent, formatDate, formatTime } = createTranslator(profile.language, profile);
      // The shopper leaves a tip where the country asks for one: the suggested default, or 10 %.
      const tipPercent = profile.tip.mode === 'suggested' ? profile.tip.defaultPercent : 10;
      const totals = quote([{ category: 'meals', price: listPrice(country, LUNCH), quantity: 2 }], { fulfillment: 'delivery', tipPercent }, profile);
      const [tax] = totals.taxes;
      const money = (minor) => plain(formatPrice(minor));
      const instant = Date.parse(want.at);

      expect(t('summary.total')).toBe(want.totalLabel);
      expect(formatDate(instant)).toBe(want.date);
      expect(plain(formatTime(instant))).toMatch(want.time);
      expect(money(totals.subtotal)).toBe(want.subtotal);
      expect(money(totals.delivery)).toBe(want.delivery);
      expect(`${tax.name} ${plain(formatPercent(tax.rate))} · ${money(tax.amount)} (${totals.taxIncluded ? 'incluido' : 'sumado'})`).toBe(want.tax);
      expect(money(totals.tip)).toBe(want.tip);
      expect(money(totals.total)).toBe(want.total);
      expect(profile.receipt.type).toBe(want.receipt);
      expect(profile.tip.mode).toBe(want.tipMode);
      expect(methodsFor(profile).map((method) => method.id)).toEqual(want.payments);
    });
  }
});
