import React, { useState, useEffect } from 'react';
import { DollarSignIcon, SaveIcon } from 'lucide-react';
import { DataService } from '../../services/DataService';
import { useToast } from '../../context/ToastContext';

export const Settings = () => {
  const { addToast } = useToast();
  const [commissionRate, setCommissionRate] = useState<number>(0.50);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalRate, setOriginalRate] = useState<number>(0.50);

  useEffect(() => {
    loadCommissionRate();
  }, []);

  const loadCommissionRate = async () => {
    try {
      const rate = await DataService.getCommissionRate();
      setCommissionRate(rate);
      setOriginalRate(rate);
    } catch (error) {
      addToast('Failed to load commission rate', 'error');
    }
  };

  const handleRateChange = (value: string) => {
    const newRate = parseFloat(value) || 0;
    setCommissionRate(newRate);
    setHasChanges(newRate !== originalRate);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await DataService.updateCommissionRate(commissionRate);
      setOriginalRate(commissionRate);
      setHasChanges(false);
      addToast('Commission rate updated successfully', 'success');
    } catch (error) {
      addToast('Failed to update commission rate', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Commission Settings</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage commission rates for shipments. This rate will be locked in when quotes are created.
          </p>
        </div>

        <div className="p-6">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission Rate (per kg)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSignIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={commissionRate}
                onChange={(e) => handleRateChange(e.target.value)}
                className="pl-10 pr-20 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E2A45] focus:border-transparent"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">per kg</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              This rate applies to new quotes only. Existing quotes retain their locked-in rates.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!hasChanges || loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                hasChanges && !loading
                  ? 'bg-[#1E2A45] text-white hover:bg-[#2A3B5A]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <SaveIcon className="h-4 w-4" />
              Save Changes
            </button>
            {hasChanges && (
              <span className="text-sm text-amber-600">You have unsaved changes</span>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Current Rate:</strong> ${commissionRate.toFixed(2)} per kg
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Example: 100 kg shipment = ${(100 * commissionRate).toFixed(2)} commission
          </div>
        </div>
      </div>
    </div>
  );
};