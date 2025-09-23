import bcrypt from 'bcryptjs';
import { authAPI } from './api';

// Types
type User = {
  id: string;
  name: string;
  email: string;
  company: string;
  role: 'admin' | 'user' | 'staff';
  amazonSellerId?: string;
  einTaxId?: string;
  staffPosition?: string;
  passwordHash?: string;
};

// Helper functions for password handling
const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Initialize demo users in localStorage if not present
const initializeDemoUsers = async () => {
  const users = localStorage.getItem('users');
  if (!users || users === '[]') {
    const defaultPassword = 'Password123!';
    const passwordHash = await hashPassword(defaultPassword);
    
    const demoUsers = [
      {
        id: 'admin-1',
        name: 'John Admin',
        email: 'admin@freightshark.com',
        passwordHash,
        company: 'FreightShark',
        role: 'admin' as const
      },
      {
        id: 'user-1',
        name: 'Demo Customer',
        email: 'customer@example.com',
        passwordHash,
        company: 'Acme Imports',
        role: 'user' as const,
        amazonSellerId: 'A1B2C3D4E5',
        einTaxId: '12-3456789'
      },
      {
        id: 'staff-1',
        name: 'Sarah Chen',
        email: 'staff@freightshark.com',
        passwordHash,
        company: 'FreightShark',
        role: 'staff' as const,
        staffPosition: 'Shipping Agent'
      }
    ];
    
    localStorage.setItem('users', JSON.stringify(demoUsers));
    console.log('Demo users initialized');
  }
};

// Auth service with fallback to localStorage
export const authService = {
  login: async (email: string, password: string) => {
    try {
      // Try backend API first
      const result = await authAPI.login(email, password);
      return result;
    } catch (error) {
      // Fallback to localStorage
      console.log('Backend unavailable, using localStorage fallback');
      await initializeDemoUsers();
      
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }
      
      // Generate mock token
      const token = btoa(JSON.stringify({ userId: user.id, email: user.email, role: user.role }));
      localStorage.setItem('authToken', token);

      // Ensure user exists in Supabase database for foreign key constraints
      try {
        const { supabase } = await import('../lib/supabase');

        // Always try to upsert the user to ensure they exist
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            name: user.name,
            email: user.email,
            password_hash: user.passwordHash || 'mock_hash',
            company: user.company,
            role: user.role,
            amazon_seller_id: user.amazonSellerId,
            ein_tax_id: user.einTaxId,
            staff_position: user.staffPosition,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (upsertError) {
          console.warn('Error upserting user in Supabase:', upsertError);

          // If upsert fails, try insert as fallback
          const { error: insertError } = await supabase.from('users').insert({
            id: user.id,
            name: user.name,
            email: user.email,
            password_hash: user.passwordHash || 'mock_hash',
            company: user.company,
            role: user.role,
            amazon_seller_id: user.amazonSellerId,
            ein_tax_id: user.einTaxId,
            staff_position: user.staffPosition,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

          if (!insertError) {
            console.log('Created user in Supabase:', user.id);
          } else if (insertError.code !== '23505') {
            console.warn('Error creating user in Supabase:', insertError);
          }
        } else {
          console.log('User synced to Supabase:', user.id);
        }
      } catch (supabaseError) {
        console.warn('Could not sync user to Supabase:', supabaseError);
      }

      // Remove passwordHash from returned user
      const { passwordHash, ...userWithoutPassword } = user;
      
      return {
        user: userWithoutPassword,
        token
      };
    }
  },
  
  register: async (userData: any) => {
    try {
      // Try backend API first
      const result = await authAPI.register(userData);
      return result;
    } catch (error) {
      // Fallback to localStorage
      console.log('Backend unavailable, using localStorage fallback');

      const users = JSON.parse(localStorage.getItem('users') || '[]');

      // Check if user already exists
      if (users.find((u: User) => u.email.toLowerCase() === userData.email.toLowerCase())) {
        throw new Error('User already exists');
      }

      // Create new user
      const passwordHash = await hashPassword(userData.password);
      const newUser = {
        id: `user-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        passwordHash,
        company: userData.company,
        role: userData.role || 'user',
        amazonSellerId: userData.amazonSellerId,
        einTaxId: userData.einTaxId,
        staffPosition: userData.staffPosition
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      // Create user in Supabase immediately for foreign key constraints
      try {
        const { supabase } = await import('../lib/supabase');

        // Use upsert to ensure user exists
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            password_hash: passwordHash || 'mock_hash',
            company: newUser.company,
            role: newUser.role,
            amazon_seller_id: newUser.amazonSellerId,
            ein_tax_id: newUser.einTaxId,
            staff_position: newUser.staffPosition,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (upsertError) {
          console.warn('Error upserting user in Supabase:', upsertError);
        } else {
          console.log('User created in Supabase:', newUser.id);
        }
      } catch (supabaseError) {
        console.warn('Could not sync user to Supabase:', supabaseError);
      }

      // Generate mock token
      const token = btoa(JSON.stringify({ userId: newUser.id, email: newUser.email, role: newUser.role }));
      localStorage.setItem('authToken', token);

      // Remove passwordHash from returned user
      const { passwordHash: _, ...userWithoutPassword } = newUser;

      return {
        user: userWithoutPassword,
        token
      };
    }
  },
  
  validate: async () => {
    try {
      // Try backend API first
      const result = await authAPI.validate();
      return result;
    } catch (error) {
      // Fallback to localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No token found');
      }
      
      try {
        const decoded = JSON.parse(atob(token));
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find((u: User) => u.id === decoded.userId);
        
        if (!user) {
          throw new Error('User not found');
        }
        
        const { passwordHash, ...userWithoutPassword } = user;
        return { user: userWithoutPassword };
      } catch {
        throw new Error('Invalid token');
      }
    }
  },
  
  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Continue with local logout even if API fails
      console.log('Backend logout failed, clearing local session');
    }
    localStorage.removeItem('authToken');
  }
};

// Initialize demo users on load
initializeDemoUsers();