import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, LoaderCircle, Share2, X } from 'lucide-react';
import { encodeShare, shareUrl } from '../share/share';
import { useLocale } from '../i18n/useLocale';
import Glass from '../ui/Glass';
import { glassButton, iconButton, primaryButton, sectionHeading } from '../ui/classes';

// Button + panel that turns a list (and optionally a plan) into a link and a QR code to open on
// another device.
const ShareDialog = ({ items, plan, label }) => {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState(null);
  const [qr, setQr] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    encodeShare({ items, plan }).then(async (code) => {
      const url = shareUrl(code);
      const image = await QRCode.toDataURL(url, { margin: 1, width: 320, errorCorrectionLevel: 'L' }).catch(() => null);
      if (!cancelled) {
        setLink(url);
        setQr(image);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, items, plan]);

  const close = () => {
    setOpen(false);
    setLink(null);
    setQr(null);
    setCopied(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const nativeShare = () => navigator.share?.({ title: 'nutriFlow', url: link }).catch(() => {});

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={items.length === 0} className={glassButton}>
        <Share2 aria-hidden="true" className="size-5" />
        {label ?? t('share.button')}
      </button>
      {open && (
        <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-ink/30 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={close}>
          <Glass tone="solid" className="w-full max-w-md rounded-3xl p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 id="share-title" className={sectionHeading}>{t('share.title')}</h2>
              <button type="button" onClick={close} aria-label={t('map.close')} className={iconButton}>
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-ink/75">{t('share.hint')}</p>
            {!link ? (
              <p className="flex items-center gap-2 text-ink/70"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />{t('share.preparing')}</p>
            ) : (
              <>
                {qr && <img src={qr} alt={t('share.qrAlt')} className="mx-auto mb-4 size-64 rounded-2xl bg-white p-2 shadow-glass-sm" />}
                <input readOnly value={link} aria-label={t('share.link')} onFocus={(event) => event.target.select()} className="mb-3 w-full truncate rounded-2xl border border-white/80 bg-white/70 px-4 py-2.5 text-sm text-ink" />
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={copy} className={`${primaryButton} flex-1`}>
                    {copied ? <Check aria-hidden="true" className="size-5" /> : <Copy aria-hidden="true" className="size-5" />}
                    {copied ? t('share.copied') : t('share.copy')}
                  </button>
                  {typeof navigator.share === 'function' && (
                    <button type="button" onClick={nativeShare} className={`${glassButton} flex-1`}>
                      <Share2 aria-hidden="true" className="size-5" />
                      {t('share.native')}
                    </button>
                  )}
                </div>
              </>
            )}
          </Glass>
        </div>
      )}
    </>
  );
};

export default ShareDialog;
