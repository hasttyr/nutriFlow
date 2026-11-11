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
  paypal: () => (
    <Tile bg="#fff">
      <Word fill="#003087" size={13} italic y={25}>
        Pay<tspan fill="#009cde">Pal</tspan>
      </Word>
    </Tile>
  ),
  applepay: () => (
    <Tile bg="#000">
      <Word size={10} weight={600}>Apple Pay</Word>
    </Tile>
  ),
  googlepay: () => (
    <Tile bg="#fff" border="rgb(0 0 0 / 0.18)">
      <Word fill="#3c4043" size={11} weight={600}>G Pay</Word>
    </Tile>
  ),
  ach: () => (
    <Tile bg="#0b3d91">
      <Word size={13}>ACH</Word>
    </Tile>
  ),
  sepa: () => (
    <Tile bg="#10298e">
      <Word fill="#ffcc00" size={12.5} italic>SEPA</Word>
    </Tile>
  ),
  paypay: () => (
    <Tile bg="#ff0033">
      <Word size={11}>PayPay</Word>
    </Tile>
  ),
  konbini: () => (
    <Tile bg="#00873c">
      <Word size={11} weight={700}>コンビニ</Word>
    </Tile>
  ),
  cash: () => (
    <Tile bg="#2f7d4f">
      <rect x="14" y="12" width="36" height="16" rx="3" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="32" cy="20" r="4" fill="none" stroke="#fff" strokeWidth="2" />
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
