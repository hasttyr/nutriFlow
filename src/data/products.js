import {
  Apple, Banana, Bean, Carrot, Citrus, Coffee, Cookie, Croissant, CupSoda, Droplet,
  Egg, GlassWater, Grape, LeafyGreen, Milk, Nut, Soup, Wheat
} from 'lucide-react';

export const categories = ['produce', 'dairy', 'bakery', 'pantry', 'drinks'];

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

export const getProductById = (id) => products.find((product) => product.id === id);

export default products;
