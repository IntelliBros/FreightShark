// Run this in browser console to inspect users
(() => {
  console.log('=== INSPECTING USERS ===');
  
  const users = JSON.parse(localStorage.getItem('ddp_users') || '[]');
  console.log('Total users:', users.length);
  
  users.forEach((user, index) => {
    console.log(`\nUser ${index + 1}:`);
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Name:', user.name);
    console.log('  Role:', user.role);
    console.log('  Has passwordHash?', !!user.passwordHash);
  });
  
  // Test email matching
  const testEmail = 'customer@example.com';
  console.log(`\nTesting email match for: ${testEmail}`);
  
  const foundByExact = users.find(u => u.email === testEmail);
  console.log('Found by exact match:', foundByExact ? foundByExact.email : 'NOT FOUND');
  
  const foundByLower = users.find(u => u.email && u.email.toLowerCase() === testEmail.toLowerCase());
  console.log('Found by lowercase match:', foundByLower ? foundByLower.email : 'NOT FOUND');
  
  // Show all emails
  console.log('\nAll emails in storage:');
  users.forEach(u => console.log(`  - "${u.email}"`));
})();