// Run this in the browser console to fix authentication
// Go to http://localhost:5173, open Developer Tools (F12), go to Console tab, paste this code and press Enter

// Clear any existing auth data
localStorage.removeItem('users');
localStorage.removeItem('authToken');

// Create demo users with pre-hashed passwords
const demoUsers = [
  {
    id: 'admin-1',
    name: 'John Admin',
    email: 'admin@freightshark.com',
    passwordHash: '$2a$10$YZP5o3YNlnXQKNgmzHbPxu8JZRHM5MqVKlKvRCzFpYJCCOHGvtLH.',
    company: 'FreightShark',
    role: 'admin'
  },
  {
    id: 'user-1',
    name: 'Demo Customer',
    email: 'customer@example.com',
    passwordHash: '$2a$10$YZP5o3YNlnXQKNgmzHbPxu8JZRHM5MqVKlKvRCzFpYJCCOHGvtLH.',
    company: 'Acme Imports',
    role: 'user',
    amazonSellerId: 'A1B2C3D4E5',
    einTaxId: '12-3456789'
  },
  {
    id: 'staff-1',
    name: 'Sarah Chen',
    email: 'staff@freightshark.com',
    passwordHash: '$2a$10$YZP5o3YNlnXQKNgmzHbPxu8JZRHM5MqVKlKvRCzFpYJCCOHGvtLH.',
    company: 'FreightShark',
    role: 'staff',
    staffPosition: 'Shipping Agent'
  }
];

localStorage.setItem('users', JSON.stringify(demoUsers));

console.log('✅ Demo users created! You can now login with:');
console.log('📧 customer@example.com / Password123!');
console.log('📧 staff@freightshark.com / Password123!');
console.log('📧 admin@freightshark.com / Password123!');
console.log('');
console.log('🔄 Refresh the page and try logging in again.');

// Refresh the page
setTimeout(() => {
  window.location.reload();
}, 1000);