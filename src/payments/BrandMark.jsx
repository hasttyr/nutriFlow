import { CreditCard } from 'lucide-react';

// Small drawn badges in each brand's colours, so the options are recognisable at a glance.
// They are simplified marks for a demo, not the official artwork.

const Tile = ({ bg, children, border }) => (
  <svg viewBox="0 0 64 40" aria-hidden="true" className="h-8 w-[3.2rem] shrink-0 drop-shadow-sm">
    <rect x="0.5" y="0.5" width="63" height="39" rx="7" fill={bg} stroke={border ?? 'rgb(0 0 0 / 0.08)'} />
    {children}
  </svg>
);

const Word = ({ children, fill = '#fff', size = 13, weight = 800, y = 25, italic = false, spacing = 0 }) => (
  <text
    x="32"
    y={y}
    textAnchor="middle"
    fill={fill}
    fontSize={size}
    fontWeight={weight}
    fontStyle={italic ? 'italic' : 'normal'}
    letterSpacing={spacing}
    fontFamily="ui-sans-serif, system-ui, sans-serif"
  >
    {children}
  </text>
);

const marks = {
  nequi: () => (
    <Tile bg="#200040">
      <Word fill="#ff2d92" size={14}>nequi</Word>
    </Tile>
  ),
  daviplata: () => (
    <Tile bg="#e30613">
      <Word size={10.5}>DaviPlata</Word>
    </Tile>
  ),
  pse: () => (
    <Tile bg="#fff">
      <circle cx="32" cy="20" r="15" fill="#0b5ca8" />
      <Word size={11}>PSE</Word>
      <path d="M19 28 a15 15 0 0 0 26 0" fill="none" stroke="#f6c300" strokeWidth="2.5" />
    </Tile>
  ),
  pix: () => (
    <Tile bg="#fff">
      <g transform="translate(13 20) rotate(45)">
        <rect x="-6.5" y="-6.5" width="13" height="13" rx="3" fill="none" stroke="#32bcad" strokeWidth="3" />
      </g>
      <Word fill="#32bcad" size={14} y={25.5}>
        <tspan dx="9">pix</tspan>
      </Word>
    </Tile>
  ),
  boleto: () => (
    <Tile bg="#fff">
      {[8, 11, 13, 17, 19, 22, 26, 28, 31, 35, 37, 41, 44, 46, 50, 53, 55].map((x, index) => (
        <rect key={x} x={x} y="7" width={index % 3 === 0 ? 2 : 1} height="18" fill="#1d1d1b" />
      ))}
      <Word fill="#1d1d1b" size={8} weight={700} y={34}>BOLETO</Word>
    </Tile>
  ),
  oxxo: () => (
    <Tile bg="#e30613">
      <rect x="4" y="5" width="56" height="4" rx="1" fill="#ffd100" />
      <rect x="4" y="31" width="56" height="4" rx="1" fill="#ffd100" />
      <Word size={14} y={25}>OXXO</Word>
    </Tile>
  ),
  spei: () => (
    <Tile bg="#1d3a6b">
      <Word size={14} spacing={1}>SPEI</Word>
    </Tile>
  ),
  mercadopago: () => (
    <Tile bg="#00b1ea">
      <ellipse cx="32" cy="16" rx="13" ry="8" fill="#fff" />
      <path d="M24 16 q4 -4 8 0 q4 4 8 0" fill="none" stroke="#00b1ea" strokeWidth="2" strokeLinecap="round" />
      <Word size={7.5} weight={700} y={33}>mercado pago</Word>
    </Tile>
  ),
  webpay: () => (
    <Tile bg="#fff">
      <Word fill="#d5006d" size={13} y={24}>webpay</Word>
      <rect x="14" y="28" width="36" height="2.5" rx="1.25" fill="#6b1e7b" />
    </Tile>
  ),
  yape: () => (
    <Tile bg="#742284">
      <Word fill="#fff" size={15} italic>yape</Word>
    </Tile>
  ),
  plin: () => (
    <Tile bg="#00c7d4">
      <Word size={15}>plin</Word>
    </Tile>
  ),
  bizum: () => (
    <Tile bg="#05c3dd">
      <Word size={14}>bizum</Word>
    </Tile>
  ),
  mbway: () => (
    <Tile bg="#d60510">
      <Word size={9.5} y={18}>MB</Word>
      <Word size={9.5} y={30} spacing={1}>WAY</Word>
    </Tile>
  ),
  multibanco: () => (
    <Tile bg="#1a5fa5">
      <Word size={16} y={27}>MB</Word>
    </Tile>
  ),
  blik: () => (
    <Tile bg="#000">
      <Word size={15}>blik</Word>
      <circle cx="49" cy="12" r="3" fill="#e5004f" />
    </Tile>
  ),
  p24: () => (
    <Tile bg="#fff">
      <Word fill="#d13239" size={9} weight={800} y={24}>Przelewy24</Word>
    </Tile>
  ),
  satispay: () => (
    <Tile bg="#ef4136">
      <Word size={11}>satispay</Word>
    </Tile>
  ),
  bancomatpay: () => (
    <Tile bg="#004c97">
      <Word size={8.5} y={18}>BANCOMAT</Word>
      <Word fill="#7fd1ff" size={10} y={30}>Pay</Word>
    </Tile>
  ),
  postepay: () => (
    <Tile bg="#ffde00">
      <Word fill="#0047bb" size={11}>postepay</Word>
    </Tile>
  ),
  paypal: () => (
    <Tile bg="#fff">
      <Word fill="#003087" size={13} italic y={25}>
        Pay<tspan fill="#009cde">Pal</tspan>
      </Word>
    </Tile>
  ),
  venmo: () => (
    <Tile bg="#008cff">
      <Word size={14} italic>venmo</Word>
    </Tile>
  ),
  cashapp: () => (
    <Tile bg="#00d632">
      <rect x="20" y="8" width="24" height="24" rx="6" fill="#fff" />
      <Word fill="#00d632" size={17} y={26.5}>$</Word>
    </Tile>
  ),
  paybybank: () => (
    <Tile bg="#0f2a44">
      <path d="M32 7 l12 6 h-24 z" fill="#fff" />
      {[23, 29, 35, 41].map((x) => <rect key={x} x={x - 1.5} y="14" width="3" height="9" fill="#fff" />)}
      <Word size={7.5} weight={700} y={33}>Pay by Bank</Word>
    </Tile>
  ),
  interac: () => (
    <Tile bg="#fdb913">
      <Word fill="#1d1d1b" size={12} weight={800}>Interac</Word>
    </Tile>
  ),
  payu: () => (
    <Tile bg="#a6c307">
      <Word size={15}>PayU</Word>
    </Tile>
  ),
  visa: () => (
    <Tile bg="#1a1f71">
      <Word size={14} italic spacing={0.5}>VISA</Word>
    </Tile>
  ),
  mastercard: () => (
    <Tile bg="#fff">
      <circle cx="26" cy="20" r="11" fill="#eb001b" />
      <circle cx="38" cy="20" r="11" fill="#f79e1b" fillOpacity="0.9" />
    </Tile>
  ),
  amex: () => (
    <Tile bg="#2e77bc">
      <Word size={11} spacing={0.5}>AMEX</Word>
    </Tile>
  ),
  card: () => (
    <span aria-hidden="true" className="flex h-8 w-[3.2rem] shrink-0 items-center justify-center rounded-[0.45rem] bg-ink/85 text-white shadow-sm">
      <CreditCard className="size-5" strokeWidth={1.75} />
    </span>
  )
};

const BrandMark = ({ id }) => {
  const Mark = marks[id] ?? marks.card;
  return <Mark />;
};

export default BrandMark;
