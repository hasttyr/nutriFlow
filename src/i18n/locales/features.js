// Copy for the location, map, planner and sharing features, all five languages side by side.
// Order of every entry: es, en, pt, pl, it. Plural entries pass one object per language.
const L = (es, en, pt, pl, it) => ({ es, en, pt, pl, it });

const features = {
  'nav.map': L('Mapa', 'Map', 'Mapa', 'Mapa', 'Mappa'),
  'nav.planner': L('Plan', 'Planner', 'Plano', 'Plan', 'Piano'),

  'category.meat': L('Carnes y pescados', 'Meat & fish', 'Carnes e peixes', 'Mięso i ryby', 'Carne e pesce'),

  'region.locating': L('Buscando tu ubicación…', 'Finding your location…', 'Procurando sua localização…', 'Szukamy twojej lokalizacji…', 'Cerchiamo la tua posizione…'),
  'region.unknownPlace': L('Ubicación sin nombre', 'Unnamed place', 'Local sem nome', 'Miejsce bez nazwy', 'Luogo senza nome'),
  'region.source.gps': L('GPS del dispositivo', 'Device GPS', 'GPS do dispositivo', 'GPS urządzenia', 'GPS del dispositivo'),
  'region.source.ip': L('Aproximada por tu IP', 'Approximate, from your IP', 'Aproximada pelo seu IP', 'Przybliżona z adresu IP', 'Approssimata dal tuo IP'),
  'region.source.timezone': L('Estimada por tu zona horaria', 'Guessed from your time zone', 'Estimada pelo fuso horário', 'Szacowana ze strefy czasowej', 'Stimata dal fuso orario'),
  'region.source.manual': L('Elegida en el mapa', 'Picked on the map', 'Escolhida no mapa', 'Wybrana na mapie', 'Scelta sulla mappa'),
  'region.source.default': L('Ubicación por defecto', 'Default location', 'Localização padrão', 'Domyślna lokalizacja', 'Posizione predefinita'),
  'region.gpsDenied': L('GPS sin permiso', 'GPS permission denied', 'GPS sem permissão', 'Brak zgody na GPS', 'GPS non autorizzato'),
  'region.gpsFailed': L('GPS no disponible', 'GPS unavailable', 'GPS indisponível', 'GPS niedostępny', 'GPS non disponibile'),
  'region.precise': L('Ubicación precisa', 'Precise location', 'Localização precisa', 'Dokładna lokalizacja', 'Posizione precisa'),
  'region.country': L('País y moneda', 'Country and currency', 'País e moeda', 'Kraj i waluta', 'Paese e valuta'),

  'map.title': L('Tiendas cerca de ti', 'Stores near you', 'Lojas perto de você', 'Sklepy w pobliżu', 'Negozi vicino a te'),
  'map.subtitle': L(
    'Las tiendas son reales (OpenStreetMap); sus productos, precios y stock son simulados. Toca una para ver qué tiene.',
    'The stores are real (OpenStreetMap); their products, prices and stock are simulated. Tap one to see what it sells.',
    'As lojas são reais (OpenStreetMap); produtos, preços e estoque são simulados. Toque em uma para ver o que tem.',
    'Sklepy są prawdziwe (OpenStreetMap); produkty, ceny i stany są symulowane. Dotknij sklepu, aby zobaczyć ofertę.',
    'I negozi sono reali (OpenStreetMap); prodotti, prezzi e scorte sono simulati. Tocca un negozio per vedere cosa vende.'
  ),
  'map.close': L('Cerrar', 'Close', 'Fechar', 'Zamknij', 'Chiudi'),
  'map.shopHere': L('Comprar en esta tienda', 'Shop at this store', 'Comprar nesta loja', 'Kupuj w tym sklepie', 'Compra in questo negozio'),
  'map.loadingShelf': L('Consultando el inventario…', 'Reading the inventory…', 'Consultando o estoque…', 'Odczytujemy asortyment…', 'Leggiamo l’inventario…'),
  'map.shelfError': L('La tienda y sus réplicas no respondieron.', 'The store and its replicas did not answer.', 'A loja e suas réplicas não responderam.', 'Sklep i jego repliki nie odpowiedziały.', 'Il negozio e le sue repliche non hanno risposto.'),
  'map.shelfCount': {
    es: { one: '{count} producto disponible', other: '{count} productos disponibles' },
    en: { one: '{count} product available', other: '{count} products available' },
    pt: { one: '{count} produto disponível', other: '{count} produtos disponíveis' },
    pl: { one: '{count} produkt dostępny', few: '{count} produkty dostępne', many: '{count} produktów dostępnych', other: '{count} produktu dostępnego' },
    it: { one: '{count} prodotto disponibile', other: '{count} prodotti disponibili' }
  },
  'map.loadingStores': L('Buscando tiendas en OpenStreetMap…', 'Looking for stores on OpenStreetMap…', 'Procurando lojas no OpenStreetMap…', 'Szukamy sklepów w OpenStreetMap…', 'Cerchiamo negozi su OpenStreetMap…'),
  'map.storesOsm': {
    es: { one: '{count} tienda real cercana, cada una es un nodo del sistema', other: '{count} tiendas reales cercanas, cada una es un nodo del sistema' },
    en: { one: '{count} real store nearby, each one a node of the system', other: '{count} real stores nearby, each one a node of the system' },
    pt: { one: '{count} loja real perto, cada uma é um nó do sistema', other: '{count} lojas reais perto, cada uma é um nó do sistema' },
    pl: { one: '{count} prawdziwy sklep w pobliżu, każdy to węzeł systemu', few: '{count} prawdziwe sklepy w pobliżu, każdy to węzeł systemu', many: '{count} prawdziwych sklepów w pobliżu, każdy to węzeł systemu', other: '{count} prawdziwego sklepu w pobliżu' },
    it: { one: '{count} negozio reale vicino, ognuno è un nodo del sistema', other: '{count} negozi reali vicini, ognuno è un nodo del sistema' }
  },
  'map.storesSynthetic': {
    es: { one: 'OpenStreetMap no respondió: {count} tienda de demostración', other: 'OpenStreetMap no respondió: {count} tiendas de demostración' },
    en: { one: 'OpenStreetMap did not answer: {count} demo store', other: 'OpenStreetMap did not answer: {count} demo stores' },
    pt: { one: 'O OpenStreetMap não respondeu: {count} loja de demonstração', other: 'O OpenStreetMap não respondeu: {count} lojas de demonstração' },
    pl: { one: 'OpenStreetMap nie odpowiada: {count} sklep demo', few: 'OpenStreetMap nie odpowiada: {count} sklepy demo', many: 'OpenStreetMap nie odpowiada: {count} sklepów demo', other: 'OpenStreetMap nie odpowiada: {count} sklepu demo' },
    it: { one: 'OpenStreetMap non ha risposto: {count} negozio demo', other: 'OpenStreetMap non ha risposto: {count} negozi demo' }
  },
  'map.storesIdle': L('Mostrando las sucursales de demostración de Bogotá.', 'Showing the Bogotá demo branches.', 'Mostrando as filiais de demonstração de Bogotá.', 'Pokazujemy demonstracyjne oddziały w Bogocie.', 'Mostriamo le filiali demo di Bogotá.'),
  'map.pick': L('Elegir mi ubicación en el mapa', 'Pick my location on the map', 'Escolher minha localização no mapa', 'Wybierz lokalizację na mapie', 'Scegli la posizione sulla mappa'),
  'map.pickActive': L('Toca el mapa…', 'Tap the map…', 'Toque no mapa…', 'Dotknij mapy…', 'Tocca la mappa…'),
  'map.you': L('Estás aquí', 'You are here', 'Você está aqui', 'Jesteś tutaj', 'Sei qui'),
  'map.nearby': L('Tiendas cercanas', 'Nearby stores', 'Lojas próximas', 'Sklepy w pobliżu', 'Negozi vicini'),
  'map.nearbyHint': L('Ordenadas por distancia. Toca una para ver sus productos.', 'Sorted by distance. Tap one to see its products.', 'Ordenadas por distância. Toque em uma para ver os produtos.', 'Według odległości. Dotknij, aby zobaczyć produkty.', 'Ordinati per distanza. Toccane uno per vedere i prodotti.'),
  'map.toPlanner': L('Planear mi semana con estas tiendas', 'Plan my week with these stores', 'Planejar minha semana com estas lojas', 'Zaplanuj tydzień z tymi sklepami', 'Pianifica la settimana con questi negozi'),

  'share.button': L('Compartir', 'Share', 'Compartilhar', 'Udostępnij', 'Condividi'),
  'share.title': L('Abrir en otro dispositivo', 'Open on another device', 'Abrir em outro dispositivo', 'Otwórz na innym urządzeniu', 'Apri su un altro dispositivo'),
  'share.hint': L(
    'Escanea el QR o abre el enlace en tu celular, tablet o computador. Los datos viajan dentro del enlace; no pasan por ningún servidor.',
    'Scan the QR code or open the link on your phone, tablet or computer. The data travels inside the link; no server sees it.',
    'Escaneie o QR ou abra o link no celular, tablet ou computador. Os dados viajam dentro do link; nenhum servidor os vê.',
    'Zeskanuj kod QR lub otwórz link na telefonie, tablecie albo komputerze. Dane są w samym linku; nie widzi ich żaden serwer.',
    'Scansiona il QR o apri il link su telefono, tablet o computer. I dati viaggiano nel link; nessun server li vede.'
  ),
  'share.preparing': L('Preparando…', 'Preparing…', 'Preparando…', 'Przygotowujemy…', 'Preparazione…'),
  'share.qrAlt': L('Código QR del enlace', 'QR code for the link', 'Código QR do link', 'Kod QR linku', 'Codice QR del link'),
  'share.link': L('Enlace para compartir', 'Share link', 'Link para compartilhar', 'Link do udostępnienia', 'Link da condividere'),
  'share.copy': L('Copiar enlace', 'Copy link', 'Copiar link', 'Kopiuj link', 'Copia link'),
  'share.copied': L('¡Copiado!', 'Copied!', 'Copiado!', 'Skopiowano!', 'Copiato!'),
  'share.native': L('Enviar…', 'Send…', 'Enviar…', 'Wyślij…', 'Invia…'),
  'share.importTitle': L('Lista compartida', 'Shared list', 'Lista compartilhada', 'Udostępniona lista', 'Lista condivisa'),
  'share.invalid': L('Este enlace está incompleto o dañado.', 'This link is incomplete or damaged.', 'Este link está incompleto ou danificado.', 'Ten link jest niekompletny lub uszkodzony.', 'Questo link è incompleto o danneggiato.'),
  'share.received': {
    es: { one: 'Recibiste {count} producto', other: 'Recibiste {count} productos' },
    en: { one: 'You received {count} product', other: 'You received {count} products' },
    pt: { one: 'Você recebeu {count} produto', other: 'Você recebeu {count} produtos' },
    pl: { one: 'Otrzymano {count} produkt', few: 'Otrzymano {count} produkty', many: 'Otrzymano {count} produktów', other: 'Otrzymano {count} produktu' },
    it: { one: 'Hai ricevuto {count} prodotto', other: 'Hai ricevuto {count} prodotti' }
  },
  'share.withPlan': L('Incluye el menú de la semana.', 'Includes the weekly menu.', 'Inclui o cardápio da semana.', 'Zawiera jadłospis na tydzień.', 'Include il menù della settimana.'),
  'share.import': L('Agregar a mi lista', 'Add to my list', 'Adicionar à minha lista', 'Dodaj do mojej listy', 'Aggiungi alla mia lista'),

  'planner.title': L('Plan de la semana', 'Weekly planner', 'Plano da semana', 'Plan na tydzień', 'Piano della settimana'),
  'planner.subtitle': L(
    'Cuéntanos qué quieres comer y te armamos el menú, la lista de mercado y el presupuesto con las tiendas cercanas.',
    'Tell us what you want to eat and we build the menu, the shopping list and the budget with the stores near you.',
    'Conte o que quer comer e montamos o cardápio, a lista de compras e o orçamento com as lojas próximas.',
    'Napisz, co chcesz jeść, a przygotujemy jadłospis, listę zakupów i budżet ze sklepami w pobliżu.',
    'Dicci cosa vuoi mangiare e prepariamo menù, lista della spesa e budget con i negozi vicini.'
  ),
  'planner.prompt': L('¿Qué quieres comer esta semana?', 'What do you want to eat this week?', 'O que você quer comer esta semana?', 'Co chcesz jeść w tym tygodniu?', 'Cosa vuoi mangiare questa settimana?'),
  'planner.placeholder': L(
    'Ej.: comida saludable, poca carne roja, almuerzos rápidos y presupuesto bajo',
    'E.g. healthy food, little red meat, quick lunches and a low budget',
    'Ex.: comida saudável, pouca carne vermelha, almoços rápidos e orçamento baixo',
    'Np. zdrowo, mało czerwonego mięsa, szybkie obiady i niski budżet',
    'Es.: cibo sano, poca carne rossa, pranzi veloci e budget basso'
  ),
  'planner.example1': L('Vegetariano, alto en proteína', 'Vegetarian, high in protein', 'Vegetariano, rico em proteína', 'Wegetariańsko, dużo białka', 'Vegetariano, ricco di proteine'),
  'planner.example2': L('Comida típica de mi zona y barata', 'Cheap local food from my area', 'Comida típica da minha região e barata', 'Tanie, lokalne jedzenie z mojej okolicy', 'Cibo tipico della mia zona ed economico'),
  'planner.example3': L('Sin gluten, con pescado dos veces', 'Gluten-free, fish twice', 'Sem glúten, peixe duas vezes', 'Bez glutenu, ryba dwa razy', 'Senza glutine, pesce due volte'),
  'planner.people': L('Personas', 'People', 'Pessoas', 'Osoby', 'Persone'),
  'planner.generate': L('Generar plan', 'Generate plan', 'Gerar plano', 'Utwórz plan', 'Genera piano'),
  'planner.thinking': L('La IA está pensando…', 'The AI is thinking…', 'A IA está pensando…', 'AI myśli…', 'L’IA sta pensando…'),
  'planner.cancel': L('Cancelar', 'Cancel', 'Cancelar', 'Anuluj', 'Annulla'),
  'planner.disclaimer': L(
    'Usa una IA gratuita (Pollinations). Si no responde, un planificador por reglas arma el plan. No es consejo médico ni nutricional.',
    'Uses a free AI (Pollinations). If it does not answer, a rule-based planner builds the plan. This is not medical or nutrition advice.',
    'Usa uma IA gratuita (Pollinations). Se ela não responder, um planejador por regras monta o plano. Não é conselho médico nem nutricional.',
    'Korzysta z darmowej AI (Pollinations). Jeśli nie odpowie, plan ułoży planer regułowy. To nie jest porada medyczna ani dietetyczna.',
    'Usa un’IA gratuita (Pollinations). Se non risponde, un pianificatore a regole crea il piano. Non è un consiglio medico o nutrizionale.'
  ),
  'planner.waiting': L(
    'La IA gratuita está ocupada; reintentamos en {seconds} s…',
    'The free AI is busy; retrying in {seconds} s…',
    'A IA gratuita está ocupada; tentamos de novo em {seconds} s…',
    'Darmowa AI jest zajęta; ponawiamy za {seconds} s…',
    'L’IA gratuita è occupata; riproviamo tra {seconds} s…'
  ),
  'planner.byAi': L('Plan creado por IA', 'Plan created by AI', 'Plano criado por IA', 'Plan utworzony przez AI', 'Piano creato dall’IA'),
  'planner.byRules': L('Plan creado por reglas', 'Rule-based plan', 'Plano criado por regras', 'Plan z reguł', 'Piano creato da regole'),
  'planner.aiFallback': L('La IA no respondió a tiempo; usamos el planificador por reglas.', 'The AI did not answer in time; the rule-based planner took over.', 'A IA não respondeu a tempo; usamos o planejador por regras.', 'AI nie odpowiedziała na czas; użyliśmy planera regułowego.', 'L’IA non ha risposto in tempo; abbiamo usato il pianificatore a regole.'),
  'planner.menu': L('Menú de la semana', 'Weekly menu', 'Cardápio da semana', 'Jadłospis na tydzień', 'Menù della settimana'),
  'planner.meal.breakfast': L('Desayuno', 'Breakfast', 'Café da manhã', 'Śniadanie', 'Colazione'),
  'planner.meal.lunch': L('Almuerzo', 'Lunch', 'Almoço', 'Obiad', 'Pranzo'),
  'planner.meal.dinner': L('Cena', 'Dinner', 'Jantar', 'Kolacja', 'Cena'),
  'planner.shopping': {
    es: { one: 'Lista de mercado · {count} producto', other: 'Lista de mercado · {count} productos' },
    en: { one: 'Shopping list · {count} product', other: 'Shopping list · {count} products' },
    pt: { one: 'Lista de compras · {count} produto', other: 'Lista de compras · {count} produtos' },
    pl: { one: 'Lista zakupów · {count} produkt', few: 'Lista zakupów · {count} produkty', many: 'Lista zakupów · {count} produktów', other: 'Lista zakupów · {count} produktu' },
    it: { one: 'Lista della spesa · {count} prodotto', other: 'Lista della spesa · {count} prodotti' }
  },
  'planner.notThere': L('No disponible', 'Not available', 'Indisponível', 'Niedostępne', 'Non disponibile'),
  'planner.budget': L('Presupuesto', 'Budget', 'Orçamento', 'Budżet', 'Budget'),
  'planner.budgetHint': L(
    'Cada tienda cotiza la canasta en paralelo; gana la más barata que tenga todo.',
    'Every store quotes the basket in parallel; the cheapest one with everything wins.',
    'Cada loja cota a cesta em paralelo; vence a mais barata que tem tudo.',
    'Każdy sklep wycenia koszyk równolegle; wygrywa najtańszy, który ma wszystko.',
    'Ogni negozio quota il carrello in parallelo; vince il più economico che ha tutto.'
  ),
  'planner.quoting': L('Cotizando en las tiendas cercanas…', 'Getting quotes from nearby stores…', 'Cotando nas lojas próximas…', 'Pobieramy wyceny ze sklepów…', 'Chiediamo i prezzi ai negozi vicini…'),
  'planner.bestStore': L('Tienda más barata con todo', 'Cheapest store with everything', 'Loja mais barata com tudo', 'Najtańszy sklep ze wszystkim', 'Negozio più economico con tutto'),
  'planner.bestPartial': {
    es: { one: 'Mejor opción (le falta {count} producto)', other: 'Mejor opción (le faltan {count} productos)' },
    en: { one: 'Best option ({count} product missing)', other: 'Best option ({count} products missing)' },
    pt: { one: 'Melhor opção (falta {count} produto)', other: 'Melhor opção (faltam {count} produtos)' },
    pl: { one: 'Najlepsza opcja (brakuje {count} produktu)', few: 'Najlepsza opcja (brakuje {count} produktów)', many: 'Najlepsza opcja (brakuje {count} produktów)', other: 'Najlepsza opcja (brakuje {count} produktu)' },
    it: { one: 'Opzione migliore (manca {count} prodotto)', other: 'Opzione migliore (mancano {count} prodotti)' }
  },
  'planner.split': {
    es: { one: 'Dividiendo la compra en {count} tienda: {total}', other: 'Dividiendo la compra en {count} tiendas: {total}' },
    en: { one: 'Splitting the order across {count} store: {total}', other: 'Splitting the order across {count} stores: {total}' },
    pt: { one: 'Dividindo a compra em {count} loja: {total}', other: 'Dividindo a compra em {count} lojas: {total}' },
    pl: { one: 'Zakupy w {count} sklepie: {total}', few: 'Zakupy w {count} sklepach: {total}', many: 'Zakupy w {count} sklepach: {total}', other: 'Zakupy w {count} sklepu: {total}' },
    it: { one: 'Dividendo la spesa in {count} negozio: {total}', other: 'Dividendo la spesa in {count} negozi: {total}' }
  },
  'planner.buyAt': L('Comprar todo en {branch}', 'Buy everything at {branch}', 'Comprar tudo em {branch}', 'Kup wszystko w {branch}', 'Compra tutto da {branch}'),
  'planner.toList': L('Pasar a mi lista', 'Add to my list', 'Passar para minha lista', 'Dodaj do mojej listy', 'Aggiungi alla mia lista'),

  'status.members.demo': L(
    'Nodos: las 3 sucursales de demostración de Bogotá.',
    'Nodes: the 3 Bogotá demo branches.',
    'Nós: as 3 filiais de demonstração de Bogotá.',
    'Węzły: 3 demonstracyjne oddziały w Bogocie.',
    'Nodi: le 3 filiali demo di Bogotá.'
  ),
  'status.members.stores': L(
    'Nodos: tiendas reales cercanas a ti (OpenStreetMap). Cada pedido se replica en la tienda principal y sus 2 réplicas más cercanas.',
    'Nodes: real stores near you (OpenStreetMap). Each order is stored on the primary store and its 2 closest replicas.',
    'Nós: lojas reais perto de você (OpenStreetMap). Cada pedido fica na loja principal e nas 2 réplicas mais próximas.',
    'Węzły: prawdziwe sklepy w pobliżu (OpenStreetMap). Każde zamówienie trafia do sklepu głównego i 2 najbliższych replik.',
    'Nodi: negozi reali vicino a te (OpenStreetMap). Ogni ordine è salvato sul negozio principale e sulle 2 repliche più vicine.'
  ),
  'status.members.synthetic': L(
    'Nodos: tiendas de demostración alrededor de tu ubicación (OpenStreetMap no respondió).',
    'Nodes: demo stores around your location (OpenStreetMap did not answer).',
    'Nós: lojas de demonstração ao redor da sua localização (o OpenStreetMap não respondeu).',
    'Węzły: sklepy demo wokół twojej lokalizacji (OpenStreetMap nie odpowiedział).',
    'Nodi: negozi demo intorno alla tua posizione (OpenStreetMap non ha risposto).'
  ),

  'home.near': L('Cerca de ti', 'Near you', 'Perto de você', 'W pobliżu', 'Vicino a te'),
  'home.nearIn': L('Cerca de ti en {place}', 'Near you in {place}', 'Perto de você em {place}', 'W pobliżu: {place}', 'Vicino a te a {place}'),
  'home.mapTitle': L('Mapa de tiendas', 'Store map', 'Mapa de lojas', 'Mapa sklepów', 'Mappa dei negozi'),
  'home.mapText': L(
    'Supermercados, fruvers, carnicerías y panaderías reales a tu alrededor. Toca una para ver sus productos.',
    'Real supermarkets, greengrocers, butchers and bakeries around you. Tap one to see its products.',
    'Supermercados, hortifrutis, açougues e padarias reais ao seu redor. Toque em uma para ver os produtos.',
    'Prawdziwe supermarkety, warzywniaki, sklepy mięsne i piekarnie wokół ciebie. Dotknij, aby zobaczyć produkty.',
    'Supermercati, fruttivendoli, macellerie e panetterie reali intorno a te. Toccane uno per vedere i prodotti.'
  ),
  'home.plannerTitle': L('Plan de la semana con IA', 'AI weekly planner', 'Plano da semana com IA', 'Plan tygodnia z AI', 'Piano settimanale con IA'),
  'home.plannerText': L(
    'Escribe tu dieta y recibe menú, lista de mercado y la tienda cercana más barata.',
    'Write your diet and get a menu, a shopping list and the cheapest nearby store.',
    'Escreva sua dieta e receba cardápio, lista de compras e a loja próxima mais barata.',
    'Opisz swoją dietę i otrzymaj jadłospis, listę zakupów i najtańszy sklep w pobliżu.',
    'Scrivi la tua dieta e ricevi menù, lista della spesa e il negozio vicino più economico.'
  ),
  'home.local': L('Productos de tu zona', 'Local products', 'Produtos da sua região', 'Produkty z twojej okolicy', 'Prodotti della tua zona'),
  'home.from': L('desde {price}', 'from {price}', 'a partir de {price}', 'od {price}', 'da {price}')
};

// { key: { es, en, … } } → { es: { key: … }, en: { key: … }, … }
export const featureMessages = (locale) => Object.fromEntries(Object.entries(features).map(([key, value]) => [key, value[locale]]));
