import {
  Apple, Banana, Bean, Carrot, Citrus, Coffee, Cookie, Croissant, CupSoda, Droplet,
  Egg, GlassWater, Grape, LeafyGreen, Milk, Nut, Soup, Wheat
} from 'lucide-react';

export const categories = ['produce', 'dairy', 'bakery', 'pantry', 'drinks'];

// Base prices in Colombian pesos (VAT included). Each branch applies its own factor; see distributed/inventory.js.
const products = [
  { id: 1, category: 'produce', icon: Banana, basePrice: 3600, name: { es: 'Banano', en: 'Bananas' }, unit: { es: 'kg', en: 'kg' } },
  { id: 2, category: 'produce', icon: Apple, basePrice: 9800, name: { es: 'Manzana roja', en: 'Red apples' }, unit: { es: 'kg', en: 'kg' } },
  { id: 3, category: 'produce', icon: Citrus, basePrice: 4200, name: { es: 'Naranja tangelo', en: 'Tangelo oranges' }, unit: { es: 'kg', en: 'kg' } },
  { id: 4, category: 'produce', icon: Carrot, basePrice: 2900, name: { es: 'Zanahoria', en: 'Carrots' }, unit: { es: 'kg', en: 'kg' } },
  { id: 5, category: 'produce', icon: Grape, basePrice: 8900, name: { es: 'Uvas rojas', en: 'Red grapes' }, unit: { es: '500 g', en: '500 g' } },
  { id: 6, category: 'produce', icon: LeafyGreen, basePrice: 2700, name: { es: 'Lechuga crespa', en: 'Leaf lettuce' }, unit: { es: 'unidad', en: 'each' } },
  { id: 7, category: 'dairy', icon: Milk, basePrice: 4500, name: { es: 'Leche entera', en: 'Whole milk' }, unit: { es: '1 L', en: '1 L' } },
  { id: 8, category: 'dairy', icon: Egg, basePrice: 19500, name: { es: 'Huevos AA x30', en: 'AA eggs x30' }, unit: { es: 'bandeja', en: 'tray' } },
  { id: 9, category: 'dairy', icon: Soup, basePrice: 15900, name: { es: 'Yogur griego', en: 'Greek yogurt' }, unit: { es: '1 kg', en: '1 kg' } },
  { id: 10, category: 'bakery', icon: Wheat, basePrice: 7400, name: { es: 'Pan tajado integral', en: 'Whole wheat bread' }, unit: { es: '600 g', en: '600 g' } },
  { id: 11, category: 'bakery', icon: Croissant, basePrice: 9200, name: { es: 'Croissants x4', en: 'Croissants x4' }, unit: { es: 'paquete', en: 'pack' } },
  { id: 12, category: 'bakery', icon: Cookie, basePrice: 6300, name: { es: 'Galletas de avena', en: 'Oat cookies' }, unit: { es: '300 g', en: '300 g' } },
  { id: 13, category: 'pantry', icon: Coffee, basePrice: 17900, name: { es: 'Café molido', en: 'Ground coffee' }, unit: { es: '500 g', en: '500 g' } },
  { id: 14, category: 'pantry', icon: Bean, basePrice: 8600, name: { es: 'Fríjol cargamanto', en: 'Cranberry beans' }, unit: { es: '500 g', en: '500 g' } },
  { id: 15, category: 'pantry', icon: Droplet, basePrice: 11800, name: { es: 'Aceite de girasol', en: 'Sunflower oil' }, unit: { es: '1 L', en: '1 L' } },
  { id: 16, category: 'pantry', icon: Nut, basePrice: 5400, name: { es: 'Maní', en: 'Peanuts' }, unit: { es: '250 g', en: '250 g' } },
  { id: 17, category: 'drinks', icon: CupSoda, basePrice: 8300, name: { es: 'Jugo de naranja', en: 'Orange juice' }, unit: { es: '1 L', en: '1 L' } },
  { id: 18, category: 'drinks', icon: GlassWater, basePrice: 9600, name: { es: 'Agua sin gas x6', en: 'Still water x6' }, unit: { es: '6 × 600 ml', en: '6 × 600 ml' } }
];

export const getProductById = (id) => products.find((product) => product.id === id);

export default products;
