const products = [
  {
    id: 1,
    name: { en: 'Organic Granola', es: 'Granola orgánica' },
    description: {
      en: 'Packed with nuts and dried fruits for a delicious breakfast',
      es: 'Llena de nueces y frutos secos para un desayuno delicioso'
    },
    price: 5.99,
    calories: 450,
    image: '/images/granola.svg'
  },
  {
    id: 2,
    name: { en: 'Protein Bar', es: 'Barra de proteína' },
    description: {
      en: 'High protein content with natural ingredients',
      es: 'Alto contenido de proteína con ingredientes naturales'
    },
    price: 2.99,
    calories: 220,
    image: '/images/protein-bar.svg'
  },
  {
    id: 3,
    name: { en: 'Fresh Juice Blend', es: 'Mezcla de jugo fresco' },
    description: {
      en: 'Refreshing blend of seasonal fruits',
      es: 'Refrescante mezcla de frutas de temporada'
    },
    price: 4.49,
    calories: 180,
    image: '/images/juice.svg'
  },
  {
    id: 4,
    name: { en: 'Whole Grain Bread', es: 'Pan integral' },
    description: {
      en: 'Nutritious whole grain bread with high fiber content',
      es: 'Pan integral nutritivo con alto contenido de fibra'
    },
    price: 3.49,
    calories: 320,
    image: '/images/bread.svg'
  },
  {
    id: 5,
    name: { en: 'Greek Yogurt', es: 'Yogur griego' },
    description: {
      en: 'Creamy Greek yogurt with probiotics',
      es: 'Yogur griego cremoso con probióticos'
    },
    price: 2.79,
    calories: 150,
    image: '/images/yogurt.svg'
  },
  {
    id: 6,
    name: { en: 'Almond Butter', es: 'Mantequilla de almendra' },
    description: {
      en: 'Natural almond butter with no added sugars',
      es: 'Mantequilla de almendra natural sin azúcares añadidos'
    },
    price: 4.99,
    calories: 190,
    image: '/images/almond-butter.svg'
  }
];

export const featuredProducts = products.slice(0, 3);

export const getProductById = (id) => products.find((product) => product.id === id);

export default products;
