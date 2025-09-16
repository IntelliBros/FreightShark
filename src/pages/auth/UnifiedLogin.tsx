import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';

export const UnifiedLogin = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  usePageTitle('Sign In');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    try {
      const result = await login(email, password);
      
      if (result.user) {
        // Redirect based on role
        switch (result.user.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'staff':
            navigate('/staff');
            break;
          case 'user':
          default:
            navigate('/dashboard');
            break;
        }
        
        showToast('Login successful!', 'success');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      showToast(error.message || 'Invalid email or password', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src="/shark-icon.svg" alt="Freight Shark" className="w-20 h-20" />
        </div>
        <h2 className="mt-2 text-center text-xl text-gray-700">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/signup" className="font-medium text-[#00b4d8] hover:text-[#0096b8]">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-xl sm:rounded-xl sm:px-10">
          {/* Demo Credentials */}
          <div className="mb-6 p-4 bg-[#E6EDF8] rounded-lg border border-[#D0D9E8]">
            <h3 className="text-sm font-medium text-[#00b4d8] mb-2">Demo Credentials</h3>
            <div className="space-y-1 text-xs text-[#0096b8]">
              <p><strong>Customer:</strong> customer@example.com</p>
              <p><strong>Staff:</strong> staff@freightshark.com</p>
              <p><strong>Admin:</strong> admin@freightshark.com</p>
              <p className="mt-2"><strong>Password for all:</strong> Password123!</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#00b4d8] focus:border-[#00b4d8] sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#00b4d8] focus:border-[#00b4d8] sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#00b4d8] focus:ring-[#00b4d8] border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-[#00b4d8] hover:text-[#0096b8]">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#00b4d8] hover:bg-[#0096b8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00b4d8] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white rounded-full animate-spin border-t-transparent" />
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            The system will automatically detect your role based on your email address
          </div>
        </div>
      </div>
    </div>
  );
};