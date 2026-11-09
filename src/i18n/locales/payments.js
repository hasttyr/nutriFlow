// Copy for the simulated payment methods, all five languages side by side (es, en, pt, pl, it).
// Brand names (Nequi, Pix, BLIK…) are never translated.
const L = (es, en, pt, pl, it) => ({ es, en, pt, pl, it });

const payments = {
  'payment.localFor': L('Populares en {country}', 'Popular in {country}', 'Populares em {country}', 'Popularne w kraju: {country}', 'Popolari in {country}'),
  'payment.cardOnly': L(
    'En {country} el pago es con tarjeta.',
    'In {country} you pay by card.',
    'Em {country} o pagamento é com cartão.',
    'W kraju {country} płacisz kartą.',
    'In {country} si paga con carta.'
  ),
  'payment.card': L('Tarjeta de crédito o débito', 'Credit or debit card', 'Cartão de crédito ou débito', 'Karta kredytowa lub debetowa', 'Carta di credito o debito'),
  'payment.hint.card': L('Visa, Mastercard o American Express', 'Visa, Mastercard or American Express', 'Visa, Mastercard ou American Express', 'Visa, Mastercard lub American Express', 'Visa, Mastercard o American Express'),
  'payment.hint.wallet': L('Apruebas el cobro en la app, con tu celular', 'Approve the charge in the app on your phone', 'Aprove a cobrança no app do celular', 'Zatwierdzasz płatność w aplikacji na telefonie', 'Approvi il pagamento nell’app sul telefono'),
  'payment.hint.code': L('Código de 6 dígitos de la app de tu banco', '6-digit code from your banking app', 'Código de 6 dígitos do app do banco', '6-cyfrowy kod z aplikacji banku', 'Codice di 6 cifre dall’app della banca'),
  'payment.hint.bank': L('Pagas desde el portal seguro de tu banco', 'Pay from your bank’s secure page', 'Pague pela página segura do seu banco', 'Płacisz na bezpiecznej stronie banku', 'Paghi dalla pagina sicura della tua banca'),
  'payment.hint.instant': L('Transferencia instantánea con QR o código', 'Instant transfer by QR or code', 'Transferência instantânea por QR ou código', 'Natychmiastowy przelew kodem QR', 'Bonifico istantaneo con QR o codice'),
  'payment.hint.transfer': L('Transferencia instantánea desde tu banco', 'Instant transfer from your bank', 'Transferência instantânea do seu banco', 'Natychmiastowy przelew z banku', 'Bonifico istantaneo dalla tua banca'),
  'payment.hint.account': L('Entras a tu cuenta y apruebas el pago', 'Log in to your account and approve', 'Entre na sua conta e aprove o pagamento', 'Logujesz się na konto i zatwierdzasz', 'Accedi al tuo account e approvi il pagamento'),
  'payment.country': L('País del pago', 'Paying from', 'País do pagamento', 'Kraj płatności', 'Paese di pagamento'),
  'payment.hint.voucher': L('Recibes una referencia y pagas en efectivo o en línea', 'Get a reference and pay in cash or online', 'Receba uma referência e pague em dinheiro ou online', 'Dostajesz numer referencyjny i płacisz gotówką lub online', 'Ricevi un riferimento e paghi in contanti o online'),

  'payment.cardNumber': L('Número de tarjeta', 'Card number', 'Número do cartão', 'Numer karty', 'Numero della carta'),
  'payment.cardName': L('Nombre en la tarjeta', 'Name on card', 'Nome no cartão', 'Imię i nazwisko na karcie', 'Nome sulla carta'),
  'payment.cardExpiry': L('Vence (MM/AA)', 'Expiry (MM/YY)', 'Validade (MM/AA)', 'Ważna do (MM/RR)', 'Scadenza (MM/AA)'),
  'payment.cardCvc': L('CVC', 'CVC', 'CVV', 'CVC', 'CVV'),
  'payment.cardInvalid': L('Revisa el número de la tarjeta.', 'Check the card number.', 'Confira o número do cartão.', 'Sprawdź numer karty.', 'Controlla il numero della carta.'),
  'payment.expiryInvalid': L('La fecha no es válida o ya venció.', 'The date is invalid or has passed.', 'A data é inválida ou já venceu.', 'Data jest błędna lub minęła.', 'La data non è valida o è scaduta.'),
  'payment.cardTest': L(
    'Prueba: 4242 4242 4242 4242 se aprueba; 4000 0000 0000 0002 se rechaza.',
    'Test: 4242 4242 4242 4242 is approved; 4000 0000 0000 0002 is declined.',
    'Teste: 4242 4242 4242 4242 é aprovado; 4000 0000 0000 0002 é recusado.',
    'Test: 4242 4242 4242 4242 przechodzi; 4000 0000 0000 0002 jest odrzucana.',
    'Prova: 4242 4242 4242 4242 viene approvata; 4000 0000 0000 0002 viene rifiutata.'
  ),
  'payment.bank': L('Tu banco', 'Your bank', 'Seu banco', 'Twój bank', 'La tua banca'),
  'payment.blikCode': L('Código BLIK', 'BLIK code', 'Código BLIK', 'Kod BLIK', 'Codice BLIK'),
  'payment.blikHint': L('6 dígitos', '6 digits', '6 dígitos', '6 cyfr', '6 cifre'),

  'payment.title': L('Pagar con {method}', 'Pay with {method}', 'Pagar com {method}', 'Zapłać przez {method}', 'Paga con {method}'),
  'payment.cardTitle': L('Pago con tarjeta', 'Card payment', 'Pagamento com cartão', 'Płatność kartą', 'Pagamento con carta'),
  'payment.authorizing': L('Verificando con tu banco…', 'Checking with your bank…', 'Verificando com seu banco…', 'Weryfikacja w banku…', 'Verifica con la tua banca…'),
  'payment.processing': L('Procesando el pago…', 'Processing the payment…', 'Processando o pagamento…', 'Przetwarzanie płatności…', 'Elaborazione del pagamento…'),
  'payment.phoneText': L(
    'Enviamos una solicitud de cobro a {method} ({target}). Apruébala en la app.',
    'We sent a payment request to {method} ({target}). Approve it in the app.',
    'Enviamos uma solicitação de cobrança ao {method} ({target}). Aprove no app.',
    'Wysłaliśmy żądanie płatności do {method} ({target}). Zatwierdź je w aplikacji.',
    'Abbiamo inviato una richiesta di pagamento a {method} ({target}). Approvala nell’app.'
  ),
  'payment.phoneTarget': L('celular {phone}', 'phone {phone}', 'celular {phone}', 'telefon {phone}', 'telefono {phone}'),
  'payment.blikTarget': L('código {code}', 'code {code}', 'código {code}', 'kod {code}', 'codice {code}'),
  'payment.now': L('ahora', 'now', 'agora', 'teraz', 'ora'),
  'payment.notification': L('Solicitud de pago: {amount}', 'Payment request: {amount}', 'Pedido de pagamento: {amount}', 'Prośba o płatność: {amount}', 'Richiesta di pagamento: {amount}'),
  'payment.approve': L('Aprobar', 'Approve', 'Aprovar', 'Zatwierdź', 'Approva'),
  'payment.reject': L('Rechazar', 'Reject', 'Recusar', 'Odrzuć', 'Rifiuta'),
  'payment.secure': L('Conexión segura', 'Secure connection', 'Conexão segura', 'Bezpieczne połączenie', 'Connessione sicura'),
  'payment.bankText': L('nutriFlow solicita un pago de {amount}.', 'nutriFlow requests a payment of {amount}.', 'nutriFlow solicita um pagamento de {amount}.', 'nutriFlow prosi o płatność {amount}.', 'nutriFlow richiede un pagamento di {amount}.'),
  'payment.authorize': L('Autorizar', 'Authorize', 'Autorizar', 'Autoryzuj', 'Autorizza'),
  'payment.cancel': L('Cancelar', 'Cancel', 'Cancelar', 'Anuluj', 'Annulla'),
  'payment.qrText': L(
    'Escanea el QR con la app de tu banco o de {method}, o copia el código.',
    'Scan the QR with your bank or {method} app, or copy the code.',
    'Escaneie o QR com o app do seu banco ou do {method}, ou copie o código.',
    'Zeskanuj QR w aplikacji banku lub {method} albo skopiuj kod.',
    'Scansiona il QR con l’app della banca o di {method}, oppure copia il codice.'
  ),
  'payment.transferText': L(
    'Transfiere desde la app de tu banco a esta cuenta CLABE. Se acredita al instante.',
    'Transfer from your banking app to this CLABE account. It arrives instantly.',
    'Transfira do app do seu banco para esta conta CLABE. Cai na hora.',
    'Przelej z aplikacji banku na to konto CLABE. Środki docierają natychmiast.',
    'Trasferisci dall’app della banca a questo conto CLABE. Arriva subito.'
  ),
  'payment.qrAlt': L('Código QR de {method}', '{method} QR code', 'QR code do {method}', 'Kod QR {method}', 'Codice QR {method}'),
  'payment.copyPaste': L('Código para copiar y pegar', 'Copy-and-paste code', 'Pix copia e cola', 'Kod do skopiowania', 'Codice da copiare'),
  'payment.clabe': L('CLABE', 'CLABE', 'CLABE', 'CLABE', 'CLABE'),
  'payment.copy': L('Copiar', 'Copy', 'Copiar', 'Kopiuj', 'Copia'),
  'payment.simulatePaid': L('Ya pagué (simular)', 'I’ve paid (simulate)', 'Já paguei (simular)', 'Zapłaciłem (symulacja)', 'Ho pagato (simula)'),
  'payment.simulated': L(
    'Pago simulado: no se mueve dinero real ni se contacta a ningún banco.',
    'Simulated payment: no real money moves and no bank is contacted.',
    'Pagamento simulado: nenhum dinheiro real se move e nenhum banco é contatado.',
    'Płatność symulowana: żadne prawdziwe pieniądze nie są przesyłane, nie kontaktujemy się z bankiem.',
    'Pagamento simulato: non si muove denaro reale e nessuna banca viene contattata.'
  ),
  'payment.paidWith': L('Pagado con {method}', 'Paid with {method}', 'Pago com {method}', 'Zapłacono przez {method}', 'Pagato con {method}'),
  'payment.cardLabel': L('tarjeta •••• {last4}', 'card •••• {last4}', 'cartão •••• {last4}', 'kartę •••• {last4}', 'carta •••• {last4}'),
  'payment.voucherTitle': L('Pendiente de pago con {method}', 'Awaiting payment with {method}', 'Aguardando pagamento com {method}', 'Oczekuje na płatność przez {method}', 'In attesa di pagamento con {method}'),
  'payment.voucherText': L(
    'Paga {amount} con esta referencia en las próximas 48 h. Al recibir el pago, la tienda prepara el pedido.',
    'Pay {amount} with this reference within 48 h. Once it arrives, the store prepares your order.',
    'Pague {amount} com esta referência em até 48 h. Ao receber o pagamento, a loja prepara o pedido.',
    'Zapłać {amount} z tym numerem w ciągu 48 h. Po wpłacie sklep przygotuje zamówienie.',
    'Paga {amount} con questo riferimento entro 48 h. Ricevuto il pagamento, il negozio prepara l’ordine.'
  ),
  'payment.reference': L('Referencia', 'Reference', 'Linha digitável', 'Numer referencyjny', 'Riferimento'),
  'payment.refunded': L(
    'Ya habías pagado: el cobro se reversó automáticamente (simulado).',
    'You had already paid: the charge was reversed automatically (simulated).',
    'Você já tinha pago: a cobrança foi estornada automaticamente (simulado).',
    'Płatność została już pobrana: zwrócono ją automatycznie (symulacja).',
    'Avevi già pagato: l’addebito è stato stornato automaticamente (simulato).'
  ),
  'order.error.paymentDeclined': L(
    'El pago fue rechazado. No se hizo ningún cargo; prueba otro método.',
    'The payment was declined. Nothing was charged; try another method.',
    'O pagamento foi recusado. Nada foi cobrado; tente outro método.',
    'Płatność została odrzucona. Nic nie pobrano; wybierz inną metodę.',
    'Il pagamento è stato rifiutato. Nessun addebito; prova un altro metodo.'
  )
};

export const paymentMessages = (locale) => Object.fromEntries(Object.entries(payments).map(([key, value]) => [key, value[locale]]));
