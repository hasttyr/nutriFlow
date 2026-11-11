// Demo account for the profile screen. There is no real sign-in: every visitor sees this customer.
const demoProfile = {
  name: 'Laura Gómez',
  email: 'laura.gomez@example.com',
  phone: '300 123 4567',
  memberSince: new Date(2024, 2, 1),
  stats: { orders: 12 },
  addresses: [
    { id: 'home', line: 'Calle 45 # 12-30, Apto 502', neighborhood: 'Chapinero Alto', isDefault: true },
    { id: 'work', line: 'Carrera 7 # 116-50, Piso 3', neighborhood: 'Usaquén', isDefault: false }
  ],
  orders: [
    // Baskets of [product id, quantity]: totals come from the price list of the shopper's country.
    { id: 'NF-CHA-01038', date: new Date(Date.UTC(2026, 9, 24, 23, 10)), nodeId: 'chapinero', basket: [[8, 1], [7, 4], [46, 2], [31, 1], [1, 1]], status: 'delivered' },
    { id: 'NF-USA-00412', date: new Date(Date.UTC(2026, 9, 17, 15, 40)), nodeId: 'usaquen', basket: [[13, 1], [10, 2], [39, 1]], status: 'pickedUp' },
    { id: 'NF-KEN-00977', date: new Date(Date.UTC(2026, 9, 9, 18, 5)), nodeId: 'kennedy', basket: [[19, 2], [20, 1], [32, 2], [54, 1]], status: 'cancelled' }
  ]
};

export default demoProfile;
