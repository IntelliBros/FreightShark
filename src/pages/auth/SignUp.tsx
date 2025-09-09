import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
export const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    amazonSellerId: '',
    einTaxId: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const {
    signup
  } = useAuth();
  const {
    addToast
  } = useToast();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {
          ...prev
        };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.company.trim()) newErrors.company = 'Company name is required';
    if (!formData.password) newErrors.password = 'Password is required';else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await signup({
        name: formData.name,
        email: formData.email,
        company: formData.company,
        amazonSellerId: formData.amazonSellerId,
        einTaxId: formData.einTaxId,
        password: formData.password
      });
      addToast('Account created successfully!', 'success');
    } catch (error) {
      addToast('Failed to create account. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-blue-600">
          DDP Freight
        </h1>
        <h2 className="mt-2 text-center text-2xl font-bold text-gray-900">
          Create your customer account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join as a freight customer. Staff and admin accounts require an invitation.
        </p>
        <p className="mt-1 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            sign in here
          </Link>
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <div className="mt-1">
                <input id="name" name="name" type="text" autoComplete="name" required value={formData.name} onChange={handleChange} className={`appearance-none block w-full px-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`} />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} className={`appearance-none block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`} />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                Company name
              </label>
              <div className="mt-1">
                <input id="company" name="company" type="text" required value={formData.company} onChange={handleChange} className={`appearance-none block w-full px-3 py-2 border ${errors.company ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`} />
                {errors.company && <p className="mt-1 text-sm text-red-600">{errors.company}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="amazonSellerId" className="block text-sm font-medium text-gray-700">
                Amazon Seller ID (optional)
              </label>
              <div className="mt-1">
                <input id="amazonSellerId" name="amazonSellerId" type="text" value={formData.amazonSellerId} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="einTaxId" className="block text-sm font-medium text-gray-700">
                EIN/Tax ID (optional)
              </label>
              <div className="mt-1">
                <input id="einTaxId" name="einTaxId" type="text" value={formData.einTaxId} onChange={handleChange} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input id="password" name="password" type="password" autoComplete="new-password" required value={formData.password} onChange={handleChange} className={`appearance-none block w-full px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`} />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <div className="mt-1">
                <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required value={formData.confirmPassword} onChange={handleChange} className={`appearance-none block w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`} />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword}
                  </p>}
              </div>
            </div>
            <div>
              <Button type="submit" variant="primary" fullWidth isLoading={loading}>
                Create account
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>;
};