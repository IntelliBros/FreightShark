import React, { useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CheckIcon } from 'lucide-react';
export const OnBoarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    addToast
  } = useToast();
  const [suppliers, setSuppliers] = useState([{
    name: '',
    address: '',
    contact: ''
  }]);
  const [boxDefaults, setBoxDefaults] = useState({
    length: '',
    width: '',
    height: '',
    unit: 'cm'
  });
  const [preferredMode, setPreferredMode] = useState('air');
  const handleSupplierChange = (index: number, field: string, value: string) => {
    const newSuppliers = [...suppliers];
    newSuppliers[index] = {
      ...newSuppliers[index],
      [field]: value
    };
    setSuppliers(newSuppliers);
  };
  const addSupplier = () => {
    setSuppliers([...suppliers, {
      name: '',
      address: '',
      contact: ''
    }]);
  };
  const removeSupplier = (index: number) => {
    const newSuppliers = [...suppliers];
    newSuppliers.splice(index, 1);
    setSuppliers(newSuppliers);
  };
  const handleBoxDefaultsChange = (field: string, value: string) => {
    setBoxDefaults({
      ...boxDefaults,
      [field]: value
    });
  };
  const handleComplete = async () => {
    setLoading(true);
    try {
      // Simulate API call to save onboarding data
      await new Promise(resolve => setTimeout(resolve, 1000));
      addToast('Onboarding completed successfully!', 'success');
      navigate('/');
    } catch (error) {
      addToast('Failed to complete onboarding. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to DDP Freight
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Let's set up your account in just a few steps
          </p>
        </div>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map(stepNumber => <Fragment key={stepNumber}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {step > stepNumber ? <CheckIcon className="w-5 h-5" /> : stepNumber}
                  </div>
                  <span className="text-sm mt-2 text-gray-500">
                    {stepNumber === 1 ? 'Suppliers' : stepNumber === 2 ? 'Box Defaults' : 'Shipping Preferences'}
                  </span>
                </div>
                {stepNumber < 3 && <div className={`flex-1 h-1 ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </Fragment>)}
          </div>
        </div>
        <Card>
          {step === 1 && <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Add Your Suppliers
              </h2>
              <p className="text-gray-600 mb-6">
                Add your frequently used suppliers to speed up the quote
                process.
              </p>
              {suppliers.map((supplier, index) => <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Supplier {index + 1}</h3>
                    {suppliers.length > 1 && <button type="button" onClick={() => removeSupplier(index)} className="text-red-600 hover:text-red-800 text-sm">
                        Remove
                      </button>}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor={`supplier-name-${index}`} className="block text-sm font-medium text-gray-700">
                        Supplier Name
                      </label>
                      <input type="text" id={`supplier-name-${index}`} value={supplier.name} onChange={e => handleSupplierChange(index, 'name', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label htmlFor={`supplier-address-${index}`} className="block text-sm font-medium text-gray-700">
                        Address in China
                      </label>
                      <input type="text" id={`supplier-address-${index}`} value={supplier.address} onChange={e => handleSupplierChange(index, 'address', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label htmlFor={`supplier-contact-${index}`} className="block text-sm font-medium text-gray-700">
                        Contact Person
                      </label>
                      <input type="text" id={`supplier-contact-${index}`} value={supplier.contact} onChange={e => handleSupplierChange(index, 'contact', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                  </div>
                </div>)}
              <button type="button" onClick={addSupplier} className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
                + Add Another Supplier
              </button>
              <div className="mt-8 flex justify-end">
                <Button variant="primary" onClick={() => setStep(2)}>
                  Continue
                </Button>
              </div>
            </div>}
          {step === 2 && <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Default Box Dimensions
              </h2>
              <p className="text-gray-600 mb-6">
                Set your default box dimensions to speed up the quote process.
              </p>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label htmlFor="box-length" className="block text-sm font-medium text-gray-700">
                      Length
                    </label>
                    <input type="number" id="box-length" value={boxDefaults.length} onChange={e => handleBoxDefaultsChange('length', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="box-width" className="block text-sm font-medium text-gray-700">
                      Width
                    </label>
                    <input type="number" id="box-width" value={boxDefaults.width} onChange={e => handleBoxDefaultsChange('width', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="box-height" className="block text-sm font-medium text-gray-700">
                      Height
                    </label>
                    <input type="number" id="box-height" value={boxDefaults.height} onChange={e => handleBoxDefaultsChange('height', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Units
                  </label>
                  <div className="mt-1 flex space-x-4">
                    <label className="inline-flex items-center">
                      <input type="radio" className="form-radio h-4 w-4 text-blue-600" checked={boxDefaults.unit === 'cm'} onChange={() => handleBoxDefaultsChange('unit', 'cm')} />
                      <span className="ml-2 text-sm text-gray-700">
                        Centimeters (cm)
                      </span>
                    </label>
                    <label className="inline-flex items-center">
                      <input type="radio" className="form-radio h-4 w-4 text-blue-600" checked={boxDefaults.unit === 'in'} onChange={() => handleBoxDefaultsChange('unit', 'in')} />
                      <span className="ml-2 text-sm text-gray-700">
                        Inches (in)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button variant="primary" onClick={() => setStep(3)}>
                  Continue
                </Button>
              </div>
            </div>}
          {step === 3 && <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Shipping Preferences
              </h2>
              <p className="text-gray-600 mb-6">
                Set your preferred shipping methods and options.
              </p>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Preferred Shipping Mode
                  </label>
                  <div className="mt-2 space-y-4">
                    <label className="flex items-center">
                      <input type="radio" className="form-radio h-4 w-4 text-blue-600" checked={preferredMode === 'air'} onChange={() => setPreferredMode('air')} />
                      <span className="ml-3">
                        <span className="block text-sm font-medium text-gray-700">
                          Air Express
                        </span>
                        <span className="block text-sm text-gray-500">
                          Fastest option, 5-7 days transit time
                        </span>
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" className="form-radio h-4 w-4 text-blue-600" checked={preferredMode === 'sea'} onChange={() => setPreferredMode('sea')} />
                      <span className="ml-3">
                        <span className="block text-sm font-medium text-gray-700">
                          Sea Freight
                        </span>
                        <span className="block text-sm text-gray-500">
                          Most economical, 30-35 days transit time
                        </span>
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" className="form-radio h-4 w-4 text-blue-600" checked={preferredMode === 'best'} onChange={() => setPreferredMode('best')} />
                      <span className="ml-3">
                        <span className="block text-sm font-medium text-gray-700">
                          Best Value (Recommended)
                        </span>
                        <span className="block text-sm text-gray-500">
                          We'll suggest the best option based on your shipment
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input id="notifications" name="notifications" type="checkbox" className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded" />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="notifications" className="font-medium text-gray-700">
                        Email Notifications
                      </label>
                      <p className="text-gray-500">
                        Receive updates about your shipments via email.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button variant="primary" onClick={handleComplete} isLoading={loading}>
                  Complete Setup
                </Button>
              </div>
            </div>}
        </Card>
      </div>
    </div>;
};