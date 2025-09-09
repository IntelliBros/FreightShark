import React, { useEffect, useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
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
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  staffLogin: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
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
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        try {
          const { user } = await authService.validate();
          if (user) {
            setUser(user);
            setToken(storedToken);
          } else {
            // Invalid or expired token
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          // Token validation failed
          localStorage.removeItem('authToken');
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      if (result) {
        setUser(result.user);
        setToken(result.token);
        localStorage.setItem('authToken', result.token);
        
        // Navigate based on role
        if (result.user.role === 'admin') {
          navigate('/admin');
        } else if (result.user.role === 'staff') {
          navigate('/staff');
        } else {
          navigate('/');
        }
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };
  const staffLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      if (result && result.user.role === 'staff') {
        setUser(result.user);
        setToken(result.token);
        localStorage.setItem('authToken', result.token);
        navigate('/staff');
      } else {
        throw new Error('Invalid staff credentials');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Invalid staff credentials');
    } finally {
      setIsLoading(false);
    }
  };
  
  const adminLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      if (result && result.user.role === 'admin') {
        setUser(result.user);
        setToken(result.token);
        localStorage.setItem('authToken', result.token);
        navigate('/admin');
      } else {
        throw new Error('Invalid admin credentials');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Invalid admin credentials');
    } finally {
      setIsLoading(false);
    }
  };
  const signup = async (userData: Partial<User> & {
    password: string;
  }) => {
    setIsLoading(true);
    try {
      const result = await authService.register({
        name: userData.name || '',
        email: userData.email || '',
        password: userData.password,
        company: userData.company || '',
        role: 'user', // Only customers can self-register
        amazonSellerId: userData.amazonSellerId,
        einTaxId: userData.einTaxId,
        staffPosition: userData.staffPosition
      });
      
      if (result) {
        // Registration returns user and token
        setUser(result.user);
        setToken(result.token);
        localStorage.setItem('authToken', result.token);
        // Navigate to customer dashboard (only customers can self-register)
        navigate('/');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };
  const logout = async () => {
    try {
      if (token) {
        await authService.logout();
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    // Redirect based on user role
    if (user?.role === 'staff') {
      navigate('/staff-login');
    } else if (user?.role === 'admin') {
      navigate('/admin-login');
    } else {
      navigate('/login');
    }
  };
  return <AuthContext.Provider value={{
    user,
    isAuthenticated: !!user,
    isLoading,
    token,
    login,
    staffLogin,
    adminLogin,
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