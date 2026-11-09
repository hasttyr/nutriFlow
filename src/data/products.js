import {
  Apple, Avocado, Banana, Bean, Beef, Can, CanSoda, Candy, Carrot, Cherry, Citrus, Coffee, Cookie, Croissant,
  CupSoda, Droplet, Drumstick, Egg, Fish, GlassWater, Grape, Ham, LeafyGreen, Leaf, Milk, Nut, Salad, Sandwich,
  Shrimp, Soup, Sprout, Vegan, Wheat
} from 'lucide-react';

export const categories = ['produce', 'meat', 'dairy', 'bakery', 'pantry', 'drinks'];

// Units that read the same in every language.
const same = (unit) => ({ es: unit, en: unit, pt: unit, pl: unit, it: unit });
const each = { es: 'unidad', en: 'each', pt: 'unidade', pl: 'szt.', it: 'pezzo' };
const tray = { es: 'bandeja', en: 'tray', pt: 'bandeja', pl: 'wytłaczanka', it: 'confezione' };
const pack = { es: 'paquete', en: 'pack', pt: 'pacote', pl: 'opakowanie', it: 'confezione' };

// Base prices in Colombian pesos (VAT included). Each branch applies its own factor; see distributed/inventory.js.
const products = [
  { id: 1, category: 'produce', icon: Banana, basePrice: 3600, name: { es: 'Banano', en: 'Bananas', pt: 'Banana', pl: 'Banany', it: 'Banane' }, unit: same('kg') },
  { id: 2, category: 'produce', icon: Apple, basePrice: 9800, name: { es: 'Manzana roja', en: 'Red apples', pt: 'Maçã vermelha', pl: 'Czerwone jabłka', it: 'Mele rosse' }, unit: same('kg') },
  { id: 3, category: 'produce', icon: Citrus, basePrice: 4200, name: { es: 'Naranja tangelo', en: 'Tangelo oranges', pt: 'Laranja tangelo', pl: 'Pomarańcze tangelo', it: 'Arance tangelo' }, unit: same('kg') },
  { id: 4, category: 'produce', icon: Carrot, basePrice: 2900, name: { es: 'Zanahoria', en: 'Carrots', pt: 'Cenoura', pl: 'Marchew', it: 'Carote' }, unit: same('kg') },
  { id: 5, category: 'produce', icon: Grape, basePrice: 8900, name: { es: 'Uvas rojas', en: 'Red grapes', pt: 'Uvas vermelhas', pl: 'Czerwone winogrona', it: 'Uva rossa' }, unit: same('500 g') },
  { id: 6, category: 'produce', icon: LeafyGreen, basePrice: 2700, name: { es: 'Lechuga crespa', en: 'Leaf lettuce', pt: 'Alface crespa', pl: 'Sałata liściowa', it: 'Lattuga riccia' }, unit: each },
  { id: 7, category: 'dairy', icon: Milk, basePrice: 4500, name: { es: 'Leche entera', en: 'Whole milk', pt: 'Leite integral', pl: 'Mleko pełnotłuste', it: 'Latte intero' }, unit: same('1 L') },
  { id: 8, category: 'dairy', icon: Egg, basePrice: 19500, name: { es: 'Huevos AA x30', en: 'AA eggs x30', pt: 'Ovos AA x30', pl: 'Jajka AA x30', it: 'Uova AA x30' }, unit: tray },
  { id: 9, category: 'dairy', icon: Soup, basePrice: 15900, name: { es: 'Yogur griego', en: 'Greek yogurt', pt: 'Iogurte grego', pl: 'Jogurt grecki', it: 'Yogurt greco' }, unit: same('1 kg') },
  { id: 10, category: 'bakery', icon: Wheat, basePrice: 7400, name: { es: 'Pan tajado integral', en: 'Whole wheat bread', pt: 'Pão de forma integral', pl: 'Chleb pełnoziarnisty krojony', it: 'Pane integrale a fette' }, unit: same('600 g') },
  { id: 11, category: 'bakery', icon: Croissant, basePrice: 9200, name: { es: 'Croissants x4', en: 'Croissants x4', pt: 'Croissants x4', pl: 'Croissanty x4', it: 'Cornetti x4' }, unit: pack },
  { id: 12, category: 'bakery', icon: Cookie, basePrice: 6300, name: { es: 'Galletas de avena', en: 'Oat cookies', pt: 'Biscoitos de aveia', pl: 'Ciastka owsiane', it: 'Biscotti d’avena' }, unit: same('300 g') },
  { id: 13, category: 'pantry', icon: Coffee, basePrice: 17900, name: { es: 'Café molido', en: 'Ground coffee', pt: 'Café moído', pl: 'Kawa mielona', it: 'Caffè macinato' }, unit: same('500 g') },
  { id: 14, category: 'pantry', icon: Bean, basePrice: 8600, name: { es: 'Fríjol cargamanto', en: 'Cranberry beans', pt: 'Feijão rajado', pl: 'Fasola borlotti', it: 'Fagioli borlotti' }, unit: same('500 g') },
  { id: 15, category: 'pantry', icon: Droplet, basePrice: 11800, name: { es: 'Aceite de girasol', en: 'Sunflower oil', pt: 'Óleo de girassol', pl: 'Olej słonecznikowy', it: 'Olio di girasole' }, unit: same('1 L') },
  { id: 16, category: 'pantry', icon: Nut, basePrice: 5400, name: { es: 'Maní', en: 'Peanuts', pt: 'Amendoim', pl: 'Orzeszki ziemne', it: 'Arachidi' }, unit: same('250 g') },
  { id: 17, category: 'drinks', icon: CupSoda, basePrice: 8300, name: { es: 'Jugo de naranja', en: 'Orange juice', pt: 'Suco de laranja', pl: 'Sok pomarańczowy', it: 'Succo d’arancia' }, unit: same('1 L') },
  { id: 18, category: 'drinks', icon: GlassWater, basePrice: 9600, name: { es: 'Agua sin gas x6', en: 'Still water x6', pt: 'Água sem gás x6', pl: 'Woda niegazowana x6', it: 'Acqua naturale x6' }, unit: same('6 × 600 ml') }
];

// Compact constructor for the catalog extension: names in es, en, pt, pl, it order.
const lang = ([es, en, pt, pl, it]) => ({ es, en, pt, pl, it });
const item = (id, category, icon, basePrice, names, unit, tags, local = []) =>
  ({ id, category, icon, basePrice, name: lang(names), unit: typeof unit === 'string' ? same(unit) : unit, tags, local });

const LATAM_TROPICS = ['CO', 'VE', 'EC', 'PE', 'PA', 'CR', 'DO', 'PR', 'CU', 'BR', 'MX', 'GT', 'HN', 'NI', 'SV', 'BO'];

const extension = [
  item(19, 'produce', Cherry, 4800, ['Tomate chonto', 'Tomatoes', 'Tomate', 'Pomidory', 'Pomodori'], 'kg', ['vegan', 'veg']),
  item(20, 'produce', Leaf, 3200, ['Cebolla cabezona', 'Onions', 'Cebola', 'Cebula', 'Cipolle'], 'kg', ['vegan', 'veg']),
  item(21, 'produce', Sprout, 3500, ['Papa pastusa', 'Potatoes', 'Batata inglesa', 'Ziemniaki', 'Patate'], 'kg', ['vegan', 'carb'], ['CO', 'PE', 'BO', 'EC', 'PL']),
  item(22, 'produce', Avocado, 3900, ['Aguacate Hass', 'Hass avocado', 'Abacate Hass', 'Awokado Hass', 'Avocado Hass'], each, ['vegan', 'veg', 'breakfast'], ['CO', 'MX', 'PE']),
  item(23, 'produce', Banana, 3300, ['Plátano verde', 'Green plantain', 'Banana-da-terra', 'Plantany', 'Platano verde'], 'kg', ['vegan', 'carb'], LATAM_TROPICS),
  item(24, 'produce', Citrus, 4100, ['Limón Tahití', 'Limes', 'Limão Taiti', 'Limonki', 'Lime'], 'kg', ['vegan', 'fruit']),
  item(25, 'produce', Apple, 6200, ['Mango Tommy', 'Mangoes', 'Manga', 'Mango', 'Mango'], 'kg', ['vegan', 'fruit', 'breakfast'], LATAM_TROPICS),
  item(26, 'produce', LeafyGreen, 4600, ['Espinaca', 'Spinach', 'Espinafre', 'Szpinak', 'Spinaci'], '250 g', ['vegan', 'veg']),
  item(27, 'produce', Salad, 4300, ['Brócoli', 'Broccoli', 'Brócolis', 'Brokuł', 'Broccoli'], each, ['vegan', 'veg']),
  item(28, 'produce', Cherry, 7200, ['Pimentón rojo', 'Red bell pepper', 'Pimentão vermelho', 'Papryka czerwona', 'Peperone rosso'], 'kg', ['vegan', 'veg']),
  item(29, 'produce', Carrot, 2800, ['Yuca', 'Cassava', 'Mandioca', 'Maniok', 'Manioca'], 'kg', ['vegan', 'carb'], LATAM_TROPICS),
  item(30, 'produce', Grape, 7800, ['Maracuyá', 'Passion fruit', 'Maracujá', 'Marakuja', 'Frutto della passione'], 'kg', ['vegan', 'fruit'], LATAM_TROPICS),
  item(31, 'meat', Drumstick, 21900, ['Pechuga de pollo', 'Chicken breast', 'Peito de frango', 'Pierś z kurczaka', 'Petto di pollo'], 'kg', ['protein']),
  item(32, 'meat', Beef, 15900, ['Carne molida de res', 'Ground beef', 'Carne moída', 'Mielona wołowina', 'Macinato di manzo'], '500 g', ['protein']),
  item(33, 'meat', Ham, 24500, ['Lomo de cerdo', 'Pork loin', 'Lombo de porco', 'Schab wieprzowy', 'Lonza di maiale'], 'kg', ['protein'], ['CO', 'PL', 'BR']),
  item(34, 'meat', Fish, 17800, ['Filete de tilapia', 'Tilapia fillet', 'Filé de tilápia', 'Filet z tilapii', 'Filetto di tilapia'], '500 g', ['protein', 'fish']),
  item(35, 'meat', Shrimp, 26900, ['Camarón', 'Shrimp', 'Camarão', 'Krewetki', 'Gamberi'], '400 g', ['protein', 'fish'], ['EC', 'PE', 'BR', 'MX', 'ES', 'IT', 'PT']),
  item(36, 'meat', Ham, 9900, ['Jamón de cerdo', 'Sliced ham', 'Presunto fatiado', 'Szynka w plastrach', 'Prosciutto cotto'], '250 g', ['protein', 'breakfast'], ['IT', 'ES', 'PL']),
  item(37, 'meat', Beef, 13500, ['Chorizo', 'Chorizo sausage', 'Linguiça', 'Kiełbasa', 'Salsiccia'], '500 g', ['protein'], ['CO', 'AR', 'UY', 'ES', 'MX', 'PL', 'BR']),
  item(38, 'dairy', Milk, 12900, ['Queso campesino', 'Fresh farmer’s cheese', 'Queijo minas frescal', 'Twaróg', 'Formaggio fresco'], '500 g', ['vegetarian', 'protein', 'breakfast'], ['CO', 'BR', 'PL']),
  item(39, 'dairy', Milk, 8900, ['Mantequilla', 'Butter', 'Manteiga', 'Masło', 'Burro'], '250 g', ['vegetarian']),
  item(40, 'dairy', Milk, 11500, ['Bebida de almendras', 'Almond milk', 'Bebida de amêndoas', 'Napój migdałowy', 'Bevanda di mandorla'], '1 L', ['vegan', 'breakfast']),
  item(41, 'dairy', Vegan, 9800, ['Tofu firme', 'Firm tofu', 'Tofu firme', 'Tofu naturalne', 'Tofu compatto'], '400 g', ['vegan', 'protein']),
  item(42, 'bakery', Sandwich, 5200, ['Arepas de maíz x5', 'Corn arepas x5', 'Arepas de milho x5', 'Arepy kukurydziane x5', 'Arepas di mais x5'], pack, ['vegan', 'carb', 'breakfast'], ['CO', 'VE']),
  item(43, 'bakery', Sandwich, 6400, ['Tortillas de maíz', 'Corn tortillas', 'Tortilhas de milho', 'Tortille kukurydziane', 'Tortillas di mais'], pack, ['vegan', 'carb'], ['MX', 'GT', 'SV', 'HN', 'NI']),
  item(44, 'bakery', Croissant, 3800, ['Pan francés', 'Baguette', 'Pão francês', 'Bagietka', 'Baguette'], each, ['vegan', 'carb', 'breakfast', 'gluten']),
  item(45, 'bakery', Cookie, 7900, ['Pandebono x6', 'Cheese bread x6', 'Pão de queijo x6', 'Bułeczki serowe x6', 'Panini al formaggio x6'], pack, ['vegetarian', 'breakfast'], ['CO', 'BR']),
  item(46, 'pantry', Wheat, 4900, ['Arroz blanco', 'White rice', 'Arroz branco', 'Ryż biały', 'Riso bianco'], '1 kg', ['vegan', 'carb']),
  item(47, 'pantry', Wheat, 4600, ['Pasta espagueti', 'Spaghetti', 'Espaguete', 'Spaghetti', 'Spaghetti'], '500 g', ['vegan', 'carb', 'gluten'], ['IT']),
  item(48, 'pantry', Bean, 5200, ['Lentejas', 'Lentils', 'Lentilhas', 'Soczewica', 'Lenticchie'], '500 g', ['vegan', 'protein']),
  item(49, 'pantry', Wheat, 5800, ['Avena en hojuelas', 'Rolled oats', 'Aveia em flocos', 'Płatki owsiane', 'Fiocchi d’avena'], '500 g', ['vegan', 'carb', 'breakfast', 'gluten']),
  item(50, 'pantry', Can, 7400, ['Atún en lata', 'Canned tuna', 'Atum em lata', 'Tuńczyk w puszce', 'Tonno in scatola'], '170 g', ['protein', 'fish']),
  item(51, 'pantry', Candy, 3900, ['Panela', 'Panela cane sugar', 'Rapadura', 'Cukier trzcinowy panela', 'Panela'], '500 g', ['vegan'], ['CO', 'EC', 'PE', 'BR', 'VE']),
  item(52, 'pantry', Wheat, 5100, ['Harina de maíz precocida', 'Precooked corn flour', 'Farinha de milho pré-cozida', 'Mąka kukurydziana', 'Farina di mais precotta'], '1 kg', ['vegan', 'carb'], ['CO', 'VE']),
  item(53, 'pantry', Bean, 6100, ['Garbanzos', 'Chickpeas', 'Grão-de-bico', 'Ciecierzyca', 'Ceci'], '500 g', ['vegan', 'protein'], ['ES', 'IT', 'MX']),
  item(54, 'pantry', Soup, 4700, ['Salsa de tomate', 'Tomato passata', 'Molho de tomate', 'Passata pomidorowa', 'Passata di pomodoro'], '400 g', ['vegan'], ['IT']),
  item(55, 'pantry', Droplet, 23900, ['Aceite de oliva', 'Olive oil', 'Azeite de oliva', 'Oliwa z oliwek', 'Olio d’oliva'], '500 ml', ['vegan'], ['ES', 'IT', 'PT']),
  item(56, 'pantry', Nut, 12800, ['Mantequilla de maní', 'Peanut butter', 'Pasta de amendoim', 'Masło orzechowe', 'Burro di arachidi'], '340 g', ['vegan', 'protein', 'breakfast']),
  item(57, 'pantry', Wheat, 14900, ['Quinua', 'Quinoa', 'Quinoa', 'Komosa ryżowa', 'Quinoa'], '500 g', ['vegan', 'protein', 'carb'], ['PE', 'BO', 'EC']),
  item(58, 'pantry', Coffee, 6900, ['Chocolate de mesa', 'Drinking chocolate', 'Chocolate em tablete', 'Czekolada do picia', 'Cioccolata da bere'], '250 g', ['vegetarian', 'breakfast'], ['CO', 'MX', 'EC']),
  item(59, 'drinks', Coffee, 7500, ['Té verde x20', 'Green tea x20', 'Chá verde x20', 'Zielona herbata x20', 'Tè verde x20'], pack, ['vegan']),
  item(60, 'drinks', CanSoda, 6200, ['Gaseosa', 'Soda', 'Refrigerante', 'Napój gazowany', 'Bibita gassata'], '1.5 L', ['vegan']),
  item(61, 'pantry', Croissant, 14500, ['Pierogi ruskie', 'Pierogi', 'Pierogi', 'Pierogi ruskie', 'Pierogi'], '500 g', ['vegetarian', 'carb', 'gluten'], ['PL']),
  item(62, 'dairy', Milk, 21900, ['Queso parmesano', 'Parmesan', 'Parmesão', 'Parmezan', 'Parmigiano Reggiano'], '200 g', ['vegetarian', 'protein'], ['IT']),
  item(63, 'pantry', Bean, 9400, ['Fríjol negro', 'Black beans', 'Feijão preto', 'Czarna fasola', 'Fagioli neri'], '1 kg', ['vegan', 'protein', 'carb'], ['BR', 'MX', 'CR', 'GT', 'CU', 'VE']),
  item(64, 'pantry', Candy, 8700, ['Arequipe', 'Dulce de leche', 'Doce de leite', 'Kajmak', 'Dulce de leche'], '400 g', ['vegetarian'], ['CO', 'AR', 'UY', 'BR']),
  item(65, 'dairy', Egg, 6900, ['Huevos AA x12', 'AA eggs x12', 'Ovos AA x12', 'Jajka AA x12', 'Uova AA x12'], tray, ['vegetarian', 'protein', 'breakfast'])
];

// Diet tags for the original eighteen. 'gluten' marks the few that contain it.
const ORIGINAL_TAGS = {
  1: ['vegan', 'fruit', 'breakfast'], 2: ['vegan', 'fruit'], 3: ['vegan', 'fruit', 'breakfast'], 4: ['vegan', 'veg'],
  5: ['vegan', 'fruit'], 6: ['vegan', 'veg'], 7: ['vegetarian', 'breakfast'], 8: ['vegetarian', 'protein', 'breakfast'],
  9: ['vegetarian', 'protein', 'breakfast'], 10: ['vegan', 'carb', 'breakfast', 'gluten'], 11: ['vegetarian', 'breakfast', 'gluten'],
  12: ['vegetarian', 'gluten'], 13: ['vegan', 'breakfast'], 14: ['vegan', 'protein', 'carb'], 15: ['vegan'], 16: ['vegan', 'protein'],
  17: ['vegan', 'breakfast'], 18: ['vegan']
};
const ORIGINAL_LOCAL = { 1: LATAM_TROPICS, 3: ['CO'], 13: ['CO', 'BR'], 14: ['CO'] };
products.forEach((product) => {
  product.tags = ORIGINAL_TAGS[product.id];
  product.local = ORIGINAL_LOCAL[product.id] ?? [];
});
products.push(...extension);

export const isVegan = (product) => product.tags.includes('vegan');
export const isVegetarian = (product) => isVegan(product) || product.tags.includes('vegetarian');
export const isGlutenFree = (product) => !product.tags.includes('gluten');
export const isLocalTo = (product, countryCode) => product.local.includes(countryCode);

export const getProductById = (id) => products.find((product) => product.id === id);

export default products;
