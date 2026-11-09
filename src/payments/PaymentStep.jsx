import { useEffect, useEffectEvent, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Landmark, LoaderCircle, Lock, Smartphone } from 'lucide-react';
import { simulatedWait } from '../distributed/cluster';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import { glassButton, primaryButton } from '../ui/classes';
import { Notice } from '../ui/Field';
import BrandMark from './BrandMark';
import { cardBrand, cardDeclined } from './methods';

// The simulated "talk to the payment provider" screen between the checkout form and the order.
// It resolves with onDone({ approved }) — every outcome is made up, no money moves.

const Spinner = ({ label }) => (
  <p role="status" className="flex items-center justify-center gap-3 py-6 text-ink/80">
    <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-citrus-700 motion-reduce:animate-none" />
    {label}
  </p>
);

// Card: a short 3-D Secure style check, then approved or declined by the test number.
const CardStep = ({ payment, onDone }) => {
  const { t } = useLocale();
  const finish = useEffectEvent(() => onDone({ approved: !cardDeclined(payment.card.number) }));
  useEffect(() => {
    let live = true;
    simulatedWait(1600).then(() => live && finish());
    return () => {
      live = false;
    };
  }, []);

  return (
    <>
      <div className="mb-2 flex items-center justify-center gap-3">
        <BrandMark id={cardBrand(payment.card.number) ?? 'card'} />
        <span className="font-mono text-ink/80">•••• {payment.card.number.slice(-4)}</span>
      </div>
      <Spinner label={t('payment.authorizing')} />
    </>
  );
};

// Wallet apps and BLIK: a push notification on the shopper's phone to approve or reject.
const PhoneStep = ({ method, payment, amount, onDone }) => {
  const { t } = useLocale();
  const [waiting, setWaiting] = useState(false);
  const answer = async (approved) => {
    setWaiting(true);
    await simulatedWait(700);
    onDone({ approved });
  };
  const target = method.kind === 'code' ? t('payment.blikTarget', { code: payment.blikCode }) : t('payment.phoneTarget', { phone: payment.phone });

  return (
    <>
      <p className="mb-5 text-center text-ink/75">{t('payment.phoneText', { method: method.name, target })}</p>
      <div className="mx-auto w-full max-w-[17rem] rounded-[2.2rem] bg-ink p-2.5 shadow-ink">
        <div className="rounded-[1.7rem] bg-linear-to-b from-slate-200 to-slate-100 px-3 pt-3 pb-5">
          <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-ink/80" />
          <div className="rounded-2xl bg-white/90 p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <BrandMark id={method.id} />
              <span className="text-xs text-ink/60">{t('payment.now')}</span>
            </div>
            <p className="text-sm font-semibold text-ink">{t('payment.notification', { amount })}</p>
            <p className="text-xs text-ink/65">nutriFlow</p>
          </div>
          {waiting ? (
            <Spinner label={t('payment.processing')} />
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => answer(false)} className={`${glassButton} px-3 py-2 text-sm`}>{t('payment.reject')}</button>
              <button type="button" onClick={() => answer(true)} className={`${primaryButton} px-3 py-2 text-sm`}>{t('payment.approve')}</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Bank redirect (PSE, Przelewy24, Webpay): a stand-in for the bank's secure page.
const BankStep = ({ method, payment, amount, onDone }) => {
  const { t } = useLocale();
  const [waiting, setWaiting] = useState(false);
  const answer = async (approved) => {
    setWaiting(true);
    await simulatedWait(900);
    onDone({ approved });
  };
  const bank = payment.bank ?? method.name;

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink/10">
      <div className="flex items-center justify-between gap-3 border-b border-ink/10 bg-slate-50 px-4 py-3">
        <BrandMark id={method.id} />
        <span className="flex items-center gap-1.5 text-xs text-ink/65"><Lock aria-hidden="true" className="size-3.5" />{t('payment.secure')}</span>
      </div>
      <div className="p-5 text-center">
        <Landmark aria-hidden="true" className="mx-auto mb-2 size-8 text-ink/60" strokeWidth={1.5} />
        <p className="font-semibold text-ink">{bank}</p>
        <p className="mt-1 text-sm text-ink/70">{t('payment.bankText', { amount })}</p>
        <p className="mt-3 text-2xl font-semibold text-ink tabular-nums">{amount}</p>
        {waiting ? (
          <Spinner label={t('payment.processing')} />
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => answer(false)} className={glassButton}>{t('payment.cancel')}</button>
            <button type="button" onClick={() => answer(true)} className={primaryButton}>{t('payment.authorize')}</button>
          </div>
        )}
      </div>
    </div>
  );
};

// Instant transfer: Pix / Mercado Pago QR with copy-paste code, or SPEI's CLABE.
const InstantStep = ({ method, payment, amount, onDone }) => {
  const { t } = useLocale();
  const [qr, setQr] = useState(null);
  const [copied, setCopied] = useState(false);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!method.qr) return undefined;
    let live = true;
    QRCode.toDataURL(payment.code, { margin: 1, width: 260, errorCorrectionLevel: 'M' })
      .then((image) => live && setQr(image))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [method.qr, payment.code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(method.qr ? payment.code : payment.code.replace(/ /g, ''));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const answer = async (approved) => {
    setWaiting(true);
    await simulatedWait(900);
    onDone({ approved });
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-center gap-3">
        <BrandMark id={method.id} />
        <span className="text-2xl font-semibold text-ink tabular-nums">{amount}</span>
      </div>
      <p className="mb-4 text-center text-ink/75">{t(method.qr ? 'payment.qrText' : 'payment.transferText', { method: method.name })}</p>
      {method.qr && (
        <div className="mx-auto mb-4 flex size-56 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-ink/10">
          {qr ? <img src={qr} alt={t('payment.qrAlt', { method: method.name })} className="size-full" /> : <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-ink/50" />}
        </div>
      )}
      <p className="mb-1 text-sm font-medium text-ink/70">{t(method.qr ? 'payment.copyPaste' : 'payment.clabe')}</p>
      <div className="mb-5 flex items-center gap-2">
        <code data-testid="payment-code" className="min-w-0 flex-1 truncate rounded-xl bg-white/80 px-3 py-2 font-mono text-sm text-ink ring-1 ring-ink/10">{payment.code}</code>
        <button type="button" onClick={copy} className={`${glassButton} shrink-0 px-4 py-2 text-sm`}>
          {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
          {copied ? t('share.copied') : t('payment.copy')}
        </button>
      </div>
      {waiting ? (
        <Spinner label={t('payment.processing')} />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => answer(false)} className={glassButton}>{t('payment.cancel')}</button>
          <button type="button" onClick={() => answer(true)} className={primaryButton}>{t('payment.simulatePaid')}</button>
        </div>
      )}
    </>
  );
};

const steps = { card: CardStep, wallet: PhoneStep, code: PhoneStep, bank: BankStep, instant: InstantStep };

const PaymentStep = ({ method, payment, amount, onDone }) => {
  const { t } = useLocale();
  const Step = steps[method.kind];
  const title = method.kind === 'card' ? t('payment.cardTitle') : t('payment.title', { method: method.name });

  return (
    <div className="px-4 py-10 sm:py-16">
      <Glass tone="solid" className="container mx-auto max-w-md rounded-3xl p-6 sm:p-8">
        <h1 className="mb-5 flex items-center justify-center gap-2 text-center text-2xl font-semibold tracking-tight text-ink">
          {method.kind === 'wallet' || method.kind === 'code' ? <Smartphone aria-hidden="true" className="size-6" /> : <Lock aria-hidden="true" className="size-5" />}
          {title}
        </h1>
        <Step method={method} payment={payment} amount={amount} onDone={onDone} />
        <Notice className="mt-6">{t('payment.simulated')}</Notice>
      </Glass>
    </div>
  );
};

export default PaymentStep;
