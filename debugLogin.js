// Debug script to test login flow
import bcrypt from 'bcryptjs';

async function debugLogin() {
  console.log('=== DEBUG LOGIN ===');
  
  // 1. Check localStorage
  const users = JSON.parse(localStorage.getItem('ddp_users') || '[]');
  console.log('Users in storage:', users);
  
  // 2. Find customer user
  const email = 'customer@example.com';
  const password = 'Password123!';
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  console.log('Found user:', user);
  
  if (!user) {
    console.error('User not found!');
    return;
  }
  
  // 3. Test password verification
  console.log('Password to test:', password);
  console.log('Hash from storage:', user.passwordHash);
  
  try {
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log('Password valid?', isValid);
    
    // Also test with a fresh hash
    const freshHash = await bcrypt.hash(password, 10);
    console.log('Fresh hash:', freshHash);
    const freshValid = await bcrypt.compare(password, freshHash);
    console.log('Fresh hash valid?', freshValid);
  } catch (error) {
    console.error('Error verifying password:', error);
  }
}

// Export for use in console
window.debugLogin = debugLogin;

console.log('Run debugLogin() in console to test');