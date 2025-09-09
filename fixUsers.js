// Run this in browser console to fix users
(() => {
  console.log('=== FIXING USERS ===');
  
  // Clear old users
  localStorage.removeItem('ddp_users');
  console.log('✓ Cleared old users');
  
  // Set up new users with proper password hashes
  const defaultPasswordHash = '$2b$10$JQYNkdcI/nLXtbPT7/Ae0OG7IrcR5JvWRCGlY/eQ5H8rJAqwkHKiq';
  
  const newUsers = [
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
  
  localStorage.setItem('ddp_users', JSON.stringify(newUsers));
  console.log('✓ Added new users with password hashes');
  
  // Also ensure other required storage keys are set
  if (!localStorage.getItem('ddp_sessions')) {
    localStorage.setItem('ddp_sessions', JSON.stringify([]));
    console.log('✓ Initialized sessions');
  }
  
  if (!localStorage.getItem('ddp_id_sequences')) {
    localStorage.setItem('ddp_id_sequences', JSON.stringify({ quote: 0, shipment: 0 }));
    console.log('✓ Initialized ID sequences');
  }
  
  if (!localStorage.getItem('ddp_system_settings')) {
    localStorage.setItem('ddp_system_settings', JSON.stringify({ commissionRatePerKg: 0.50 }));
    console.log('✓ Initialized system settings');
  }
  
  console.log('\n✅ USERS FIXED! You can now login with:');
  console.log('   Customer: customer@example.com / Password123!');
  console.log('   Staff: staff@freightshark.com / Password123!');
  console.log('   Admin: admin@freightshark.com / Password123!');
  
  // Verify the fix
  const verifyUsers = JSON.parse(localStorage.getItem('ddp_users'));
  console.log('\nVerification - Users now in storage:');
  verifyUsers.forEach(u => {
    console.log(`   - ${u.email} (${u.role}) - has password: ${!!u.passwordHash}`);
  });
})();