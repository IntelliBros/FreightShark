import React, { useEffect, useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
type User = {
  id: string;
  name: string;
  email: string;
  company: string;
  role: 'admin' | 'user' | 'staff';
  amazonSellerId?: string;
  einTaxId?: string;
  staffPosition?: string;
};
type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  staffLogin: (email: string, password: string) => Promise<void>;
  signup: (userData: Partial<User> & {
    password: string;
  }) => Promise<void>;
  logout: () => void;
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    // Simulate checking for existing session
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Mock user for demo
      const mockUser: User = {
        id: 'user-1',
        name: 'John Doe',
        email: email,
        company: 'Acme Imports',
        role: 'admin',
        amazonSellerId: 'A1B2C3D4E5',
        einTaxId: '12-3456789'
      };
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };
  const staffLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Mock staff user for demo
      const mockStaff: User = {
        id: 'staff-1',
        name: 'Sarah Chen',
        email: email,
        company: 'DDP Freight',
        role: 'staff',
        staffPosition: 'Shipping Agent'
      };
      setUser(mockStaff);
      localStorage.setItem('user', JSON.stringify(mockStaff));
      navigate('/staff');
    } finally {
      setIsLoading(false);
    }
  };
  const signup = async (userData: Partial<User> & {
    password: string;
  }) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Mock user creation
      const newUser: User = {
        id: 'user-' + Date.now(),
        name: userData.name || 'New User',
        email: userData.email || '',
        company: userData.company || 'New Company',
        role: 'user',
        amazonSellerId: userData.amazonSellerId,
        einTaxId: userData.einTaxId
      };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      navigate('/onboarding');
    } finally {
      setIsLoading(false);
    }
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Redirect based on user role
    if (user?.role === 'staff') {
      navigate('/staff-login');
    } else {
      navigate('/login');
    }
  };
  return <AuthContext.Provider value={{
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    staffLogin,
    signup,
    logout
  }}>
      {children}
    </AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};