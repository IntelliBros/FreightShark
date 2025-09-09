// Run this in browser console to initialize demo users
(() => {
  const defaultPasswordHash = '$2b$10$JQYNkdcI/nLXtbPT7/Ae0OG7IrcR5JvWRCGlY/eQ5H8rJAqwkHKiq';
  
  const users = [
    {
      id: 'admin-1',
      name: 'John Admin',
      email: 'admin@freightshark.com',
      passwordHash: defaultPasswordHash,
      company: 'FreightShark',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user-1',
      name: 'Demo Customer',
      email: 'customer@example.com',
      passwordHash: defaultPasswordHash,
      company: 'Acme Imports',
      role: 'user',
      amazonSellerId: 'A1B2C3D4E5',
      einTaxId: '12-3456789',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'staff-1',
      name: 'Sarah Chen',
      email: 'staff@freightshark.com',
      passwordHash: defaultPasswordHash,
      company: 'FreightShark',
      role: 'staff',
      staffPosition: 'Shipping Agent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  localStorage.setItem('ddp_users', JSON.stringify(users));
  localStorage.setItem('ddp_sessions', JSON.stringify([]));
  localStorage.setItem('ddp_id_sequences', JSON.stringify({ quote: 0, shipment: 0 }));
  localStorage.setItem('ddp_system_settings', JSON.stringify({ commissionRatePerKg: 0.50 }));
  
  console.log('✅ Demo users initialized!');
  console.log('Users:', users.map(u => `${u.email} (${u.role})`).join(', '));
  console.log('Password for all: Password123!');
})();