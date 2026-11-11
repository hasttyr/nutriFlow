import {
  Apple, Avocado, Banana, Bean, Beef, Can, CanSoda, Candy, Carrot, Cherry, Citrus, Coffee, Cookie, Croissant,
  CupSoda, Droplet, Drumstick, Egg, Fish, GlassWater, Grape, Ham, LeafyGreen, Leaf, Milk, Nut, Salad, Sandwich,
  Shrimp, Soup, Sprout, UtensilsCrossed, Vegan, Wheat
} from 'lucide-react';

// The catalog is the same in every country; what changes per country is data: prices live in
// src/region/prices/<country>.json (minor units of the local currency), and names and units are
// given in every interface language.

export const categories = ['meals', 'produce', 'meat', 'dairy', 'bakery', 'pantry', 'drinks'];

// Names and units in es, en, pt, fr, ja order.
const lang = ([es, en, pt, fr, ja]) => ({ es, en, pt, fr, ja });
const same = (unit) => lang([unit, unit, unit, unit, unit]);
const each = lang(['unidad', 'each', 'unidade', 'pièce', '個']);
const tray = lang(['bandeja', 'tray', 'bandeja', 'boîte', 'パック']);
const pack = lang(['paquete', 'pack', 'pacote', 'paquet', '袋']);

const item = (id, category, icon, names, unit, tags, local = []) =>
  ({ id, category, icon, name: lang(names), unit: typeof unit === 'string' ? same(unit) : unit, tags, local });

// `local`: countries where the product is typical (the home page and the planner favour them).
const TROPICS = ['CO', 'BR'];

const products = [
  item(1, 'produce', Banana, ['Banano', 'Bananas', 'Banana', 'Bananes', 'バナナ'], 'kg', ['vegan', 'fruit', 'breakfast'], TROPICS),
  item(2, 'produce', Apple, ['Manzana roja', 'Red apples', 'Maçã vermelha', 'Pommes rouges', 'りんご'], 'kg', ['vegan', 'fruit'], ['JP', 'US']),
  item(3, 'produce', Citrus, ['Naranja tangelo', 'Tangelo oranges', 'Laranja tangelo', 'Oranges tangelo', 'タンジェロ'], 'kg', ['vegan', 'fruit', 'breakfast'], ['CO']),
  item(4, 'produce', Carrot, ['Zanahoria', 'Carrots', 'Cenoura', 'Carottes', 'にんじん'], 'kg', ['vegan', 'veg']),
  item(5, 'produce', Grape, ['Uvas rojas', 'Red grapes', 'Uvas vermelhas', 'Raisin rouge', '赤ぶどう'], '500 g', ['vegan', 'fruit']),
  item(6, 'produce', LeafyGreen, ['Lechuga crespa', 'Leaf lettuce', 'Alface crespa', 'Laitue frisée', 'リーフレタス'], each, ['vegan', 'veg']),
  item(7, 'dairy', Milk, ['Leche entera', 'Whole milk', 'Leite integral', 'Lait entier', '牛乳'], '1 L', ['vegetarian', 'breakfast']),
  item(8, 'dairy', Egg, ['Huevos AA x30', 'AA eggs x30', 'Ovos AA x30', 'Œufs x30', '卵 30個'], tray, ['vegetarian', 'protein', 'breakfast']),
  item(9, 'dairy', Soup, ['Yogur griego', 'Greek yogurt', 'Iogurte grego', 'Yaourt grec', 'ギリシャヨーグルト'], '1 kg', ['vegetarian', 'protein', 'breakfast']),
  item(10, 'bakery', Wheat, ['Pan tajado integral', 'Whole wheat bread', 'Pão de forma integral', 'Pain de mie complet', '全粒粉食パン'], '600 g', ['vegan', 'carb', 'breakfast', 'gluten']),
  item(11, 'bakery', Croissant, ['Croissants x4', 'Croissants x4', 'Croissants x4', 'Croissants x4', 'クロワッサン 4個'], pack, ['vegetarian', 'breakfast', 'gluten'], ['FR']),
  item(12, 'bakery', Cookie, ['Galletas de avena', 'Oat cookies', 'Biscoitos de aveia', 'Biscuits à l’avoine', 'オートミールクッキー'], '300 g', ['vegetarian', 'gluten']),
  item(13, 'pantry', Coffee, ['Café molido', 'Ground coffee', 'Café moído', 'Café moulu', 'コーヒー粉'], '500 g', ['vegan', 'breakfast'], TROPICS),
  item(14, 'pantry', Bean, ['Fríjol cargamanto', 'Cranberry beans', 'Feijão rajado', 'Haricots cocos', 'うずら豆'], '500 g', ['vegan', 'protein', 'carb'], ['CO']),
  item(15, 'pantry', Droplet, ['Aceite de girasol', 'Sunflower oil', 'Óleo de girassol', 'Huile de tournesol', 'ひまわり油'], '1 L', ['vegan']),
  item(16, 'pantry', Nut, ['Maní', 'Peanuts', 'Amendoim', 'Cacahuètes', 'ピーナッツ'], '250 g', ['vegan', 'protein']),
  item(17, 'drinks', CupSoda, ['Jugo de naranja', 'Orange juice', 'Suco de laranja', 'Jus d’orange', 'オレンジジュース'], '1 L', ['vegan', 'breakfast'], ['US']),
  item(18, 'drinks', GlassWater, ['Agua sin gas x6', 'Still water x6', 'Água sem gás x6', 'Eau plate x6', '天然水 6本'], '6 × 600 ml', ['vegan']),
  item(19, 'produce', Cherry, ['Tomate chonto', 'Tomatoes', 'Tomate', 'Tomates', 'トマト'], 'kg', ['vegan', 'veg']),
  item(20, 'produce', Leaf, ['Cebolla cabezona', 'Onions', 'Cebola', 'Oignons', '玉ねぎ'], 'kg', ['vegan', 'veg']),
  item(21, 'produce', Sprout, ['Papa pastusa', 'Potatoes', 'Batata inglesa', 'Pommes de terre', 'じゃがいも'], 'kg', ['vegan', 'carb'], ['CO', 'FR']),
  item(22, 'produce', Avocado, ['Aguacate Hass', 'Hass avocado', 'Abacate Hass', 'Avocat Hass', 'アボカド'], each, ['vegan', 'veg', 'breakfast'], ['CO', 'US']),
  item(23, 'produce', Banana, ['Plátano verde', 'Green plantain', 'Banana-da-terra', 'Banane plantain', '調理用バナナ'], 'kg', ['vegan', 'carb'], TROPICS),
  item(24, 'produce', Citrus, ['Limón Tahití', 'Limes', 'Limão Taiti', 'Citrons verts', 'ライム'], 'kg', ['vegan', 'fruit'], ['BR']),
  item(25, 'produce', Apple, ['Mango Tommy', 'Mangoes', 'Manga', 'Mangues', 'マンゴー'], 'kg', ['vegan', 'fruit', 'breakfast'], TROPICS),
  item(26, 'produce', LeafyGreen, ['Espinaca', 'Spinach', 'Espinafre', 'Épinards', 'ほうれん草'], '250 g', ['vegan', 'veg'], ['JP']),
  item(27, 'produce', Salad, ['Brócoli', 'Broccoli', 'Brócolis', 'Brocoli', 'ブロッコリー'], each, ['vegan', 'veg']),
  item(28, 'produce', Cherry, ['Pimentón rojo', 'Red bell pepper', 'Pimentão vermelho', 'Poivron rouge', '赤パプリカ'], 'kg', ['vegan', 'veg']),
  item(29, 'produce', Carrot, ['Yuca', 'Cassava', 'Mandioca', 'Manioc', 'キャッサバ'], 'kg', ['vegan', 'carb'], TROPICS),
  item(30, 'produce', Grape, ['Maracuyá', 'Passion fruit', 'Maracujá', 'Fruit de la passion', 'パッションフルーツ'], 'kg', ['vegan', 'fruit'], TROPICS),
  item(31, 'meat', Drumstick, ['Pechuga de pollo', 'Chicken breast', 'Peito de frango', 'Blanc de poulet', '鶏むね肉'], 'kg', ['protein'], ['US', 'JP']),
  item(32, 'meat', Beef, ['Carne molida de res', 'Ground beef', 'Carne moída', 'Bœuf haché', '牛ひき肉'], '500 g', ['protein'], ['US']),
  item(33, 'meat', Ham, ['Lomo de cerdo', 'Pork loin', 'Lombo de porco', 'Filet de porc', '豚ロース'], 'kg', ['protein'], ['CO', 'BR', 'JP']),
  item(34, 'meat', Fish, ['Filete de tilapia', 'Tilapia fillet', 'Filé de tilápia', 'Filet de tilapia', 'ティラピアの切り身'], '500 g', ['protein', 'fish']),
  item(35, 'meat', Shrimp, ['Camarón', 'Shrimp', 'Camarão', 'Crevettes', 'えび'], '400 g', ['protein', 'fish'], ['BR', 'JP']),
  item(36, 'meat', Ham, ['Jamón de cerdo', 'Sliced ham', 'Presunto fatiado', 'Jambon de Paris', 'ロースハム'], '250 g', ['protein', 'breakfast'], ['FR']),
  item(37, 'meat', Beef, ['Chorizo', 'Chorizo sausage', 'Linguiça', 'Saucisses', 'ソーセージ'], '500 g', ['protein'], ['CO', 'BR']),
  item(38, 'dairy', Milk, ['Queso campesino', 'Fresh farmer’s cheese', 'Queijo minas frescal', 'Fromage frais', 'フレッシュチーズ'], '500 g', ['vegetarian', 'protein', 'breakfast'], ['CO', 'BR']),
  item(39, 'dairy', Milk, ['Mantequilla', 'Butter', 'Manteiga', 'Beurre', 'バター'], '250 g', ['vegetarian'], ['FR']),
  item(40, 'dairy', Milk, ['Bebida de almendras', 'Almond milk', 'Bebida de amêndoas', 'Boisson à l’amande', 'アーモンドミルク'], '1 L', ['vegan', 'breakfast']),
  item(41, 'dairy', Vegan, ['Tofu firme', 'Firm tofu', 'Tofu firme', 'Tofu ferme', '木綿豆腐'], '400 g', ['vegan', 'protein'], ['JP']),
  item(42, 'bakery', Sandwich, ['Arepas de maíz x5', 'Corn arepas x5', 'Arepas de milho x5', 'Arepas de maïs x5', 'アレパ 5枚'], pack, ['vegan', 'carb', 'breakfast'], ['CO']),
  item(43, 'bakery', Sandwich, ['Tortillas de maíz', 'Corn tortillas', 'Tortilhas de milho', 'Tortillas de maïs', 'コーントルティーヤ'], pack, ['vegan', 'carb'], ['US']),
  item(44, 'bakery', Croissant, ['Pan francés', 'Baguette', 'Pão francês', 'Baguette', 'バゲット'], each, ['vegan', 'carb', 'breakfast', 'gluten'], ['FR', 'BR']),
  item(45, 'bakery', Cookie, ['Pandebono x6', 'Cheese bread x6', 'Pão de queijo x6', 'Pains au fromage x6', 'チーズパン 6個'], pack, ['vegetarian', 'breakfast'], ['CO', 'BR']),
  item(46, 'pantry', Wheat, ['Arroz blanco', 'White rice', 'Arroz branco', 'Riz blanc', '白米'], '1 kg', ['vegan', 'carb'], ['CO', 'BR', 'JP']),
  item(47, 'pantry', Wheat, ['Pasta espagueti', 'Spaghetti', 'Espaguete', 'Spaghetti', 'スパゲッティ'], '500 g', ['vegan', 'carb', 'gluten']),
  item(48, 'pantry', Bean, ['Lentejas', 'Lentils', 'Lentilhas', 'Lentilles', 'レンズ豆'], '500 g', ['vegan', 'protein'], ['FR']),
  item(49, 'pantry', Wheat, ['Avena en hojuelas', 'Rolled oats', 'Aveia em flocos', 'Flocons d’avoine', 'オートミール'], '500 g', ['vegan', 'carb', 'breakfast', 'gluten'], ['US']),
  item(50, 'pantry', Can, ['Atún en lata', 'Canned tuna', 'Atum em lata', 'Thon en boîte', 'ツナ缶'], '170 g', ['protein', 'fish'], ['JP']),
  item(51, 'pantry', Candy, ['Panela', 'Panela cane sugar', 'Rapadura', 'Sucre de canne panela', '黒糖'], '500 g', ['vegan'], TROPICS),
  item(52, 'pantry', Wheat, ['Harina de maíz precocida', 'Precooked corn flour', 'Farinha de milho pré-cozida', 'Farine de maïs précuite', 'コーンフラワー'], '1 kg', ['vegan', 'carb'], ['CO']),
  item(53, 'pantry', Bean, ['Garbanzos', 'Chickpeas', 'Grão-de-bico', 'Pois chiches', 'ひよこ豆'], '500 g', ['vegan', 'protein']),
  item(54, 'pantry', Soup, ['Salsa de tomate', 'Tomato passata', 'Molho de tomate', 'Coulis de tomate', 'トマトソース'], '400 g', ['vegan']),
  item(55, 'pantry', Droplet, ['Aceite de oliva', 'Olive oil', 'Azeite de oliva', 'Huile d’olive', 'オリーブオイル'], '500 ml', ['vegan'], ['FR']),
  item(56, 'pantry', Nut, ['Mantequilla de maní', 'Peanut butter', 'Pasta de amendoim', 'Beurre de cacahuète', 'ピーナッツバター'], '340 g', ['vegan', 'protein', 'breakfast'], ['US']),
  item(57, 'pantry', Wheat, ['Quinua', 'Quinoa', 'Quinoa', 'Quinoa', 'キヌア'], '500 g', ['vegan', 'protein', 'carb']),
  item(58, 'pantry', Coffee, ['Chocolate de mesa', 'Drinking chocolate', 'Chocolate em tablete', 'Chocolat à boire', '飲むチョコレート'], '250 g', ['vegetarian', 'breakfast'], ['CO']),
  item(59, 'drinks', Coffee, ['Té verde x20', 'Green tea x20', 'Chá verde x20', 'Thé vert x20', '緑茶 20袋'], pack, ['vegan'], ['JP']),
  item(60, 'drinks', CanSoda, ['Gaseosa', 'Soda', 'Refrigerante', 'Soda', '炭酸飲料'], '1.5 L', ['vegan'], ['US', 'BR']),
  item(61, 'pantry', Soup, ['Pasta de miso', 'Miso paste', 'Pasta de missô', 'Pâte miso', '味噌'], '500 g', ['vegan', 'protein'], ['JP']),
  item(62, 'dairy', Milk, ['Queso camembert', 'Camembert', 'Queijo camembert', 'Camembert', 'カマンベールチーズ'], '250 g', ['vegetarian', 'protein'], ['FR']),
  item(63, 'pantry', Bean, ['Fríjol negro', 'Black beans', 'Feijão preto', 'Haricots noirs', '黒いんげん豆'], '1 kg', ['vegan', 'protein', 'carb'], ['BR']),
  item(64, 'pantry', Candy, ['Arequipe', 'Dulce de leche', 'Doce de leite', 'Confiture de lait', 'ミルクジャム'], '400 g', ['vegetarian'], TROPICS),
  item(65, 'dairy', Egg, ['Huevos AA x12', 'AA eggs x12', 'Ovos AA x12', 'Œufs x12', '卵 12個'], tray, ['vegetarian', 'protein', 'breakfast']),
  // Ready meals are taxed as prepared food (restaurant rate), not as groceries.
  item(66, 'meals', UtensilsCrossed, ['Almuerzo del día', 'Lunch of the day', 'Prato feito do dia', 'Plat du jour', '日替わり弁当'], each, ['protein', 'carb'])
];

export const isVegan = (product) => product.tags.includes('vegan');
export const isVegetarian = (product) => isVegan(product) || product.tags.includes('vegetarian');
export const isGlutenFree = (product) => !product.tags.includes('gluten');
export const isLocalTo = (product, countryCode) => product.local.includes(countryCode);

export const getProductById = (id) => products.find((product) => product.id === id);

export default products;
