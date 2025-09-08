import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
export const StaffLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    staffLogin
  } = useAuth();
  const {
    addToast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await staffLogin(email, password);
      addToast('Successfully logged in!', 'success');
    } catch (error) {
      addToast('Failed to login. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="w-16 h-16 rounded-full bg-[#2E3B55] flex items-center justify-center mx-auto">
          <span className="text-white text-xl font-bold">DDP</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-[#2E3B55]">
          Staff Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to access the shipping agent dashboard
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-xl sm:rounded-xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#2E3B55] focus:border-[#2E3B55] sm:text-sm" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#2E3B55] focus:border-[#2E3B55] sm:text-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-[#2E3B55] focus:ring-[#2E3B55] border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-[#2E3B55] hover:text-[#1e2940]">
                  Forgot your password?
                </a>
              </div>
            </div>
            <div>
              <Button type="submit" variant="primary" fullWidth isLoading={loading}>
                Sign in
              </Button>
            </div>
          </form>
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Other login options
                </span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link to="/login">
                <Button variant="secondary" fullWidth>
                  Customer Login
                </Button>
              </Link>
              <Link to="/admin-login">
                <Button variant="secondary" fullWidth>
                  Admin Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>;
};