// Demo account for the profile screen. There is no real sign-in: every visitor sees this customer.
const demoProfile = {
  name: 'Laura Gómez',
  email: 'laura.gomez@example.com',
  phone: '300 123 4567',
  memberSince: new Date(2024, 2, 1),
  stats: { orders: 12, saved: 48300 },
  addresses: [
    { id: 'home', line: 'Calle 45 # 12-30, Apto 502', neighborhood: 'Chapinero Alto', isDefault: true },
    { id: 'work', line: 'Carrera 7 # 116-50, Piso 3', neighborhood: 'Usaquén', isDefault: false }
  ],
  orders: [
    { id: 'NF-CHA-01038', date: new Date(2026, 9, 24), nodeId: 'chapinero', items: 9, total: 86400, status: 'delivered' },
    { id: 'NF-USA-00412', date: new Date(2026, 9, 17), nodeId: 'usaquen', items: 4, total: 31700, status: 'pickedUp' },
    { id: 'NF-KEN-00977', date: new Date(2026, 9, 9), nodeId: 'kennedy', items: 6, total: 52900, status: 'cancelled' }
  ]
};

export default demoProfile;
