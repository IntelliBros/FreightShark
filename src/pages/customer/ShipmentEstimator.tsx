import React, { useState, useMemo } from 'react';
import { Calculator, AlertTriangle, Package, DollarSign, Calendar, Info } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface WarehouseRate {
  warehouseCode: string;
  warehouseName: string;
  averageRatePerKg: number;
  sampleSize: number;
  lastShipmentDate: Date;
}

export function ShipmentEstimator() {
  const { shipments, quotes } = useData();
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [chargeableWeight, setChargeableWeight] = useState('');
  const [showEstimate, setShowEstimate] = useState(false);

  // Calculate average rates for each warehouse based on recent quotes with pricing
  const warehouseRates = useMemo(() => {
    const rates: { [key: string]: WarehouseRate } = {};
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 45); // 45 days ago

    // Look at all quotes that have pricing (approved or with shipments)
    quotes.forEach(quote => {
      // Parse warehouse data from per_warehouse_costs if it exists
      let warehouses: any[] = [];

      if (quote.per_warehouse_costs) {
        // Parse per_warehouse_costs which is stored as JSON
        try {
          const warehouseCosts = typeof quote.per_warehouse_costs === 'string'
            ? JSON.parse(quote.per_warehouse_costs)
            : quote.per_warehouse_costs;

          if (Array.isArray(warehouseCosts)) {
            warehouses = warehouseCosts;
          } else if (typeof warehouseCosts === 'object') {
            // Convert object to array if needed
            warehouses = Object.entries(warehouseCosts).map(([code, data]: [string, any]) => ({
              warehouseCode: code,
              warehouseName: data.warehouseName || code,
              ...data
            }));
          }
        } catch (e) {
          // Silently skip if parsing fails
        }
      }

      // Fallback to quote.warehouses if it exists
      if ((!warehouses || warehouses.length === 0) && quote.warehouses) {
        warehouses = quote.warehouses;
      }

      if (!warehouses || warehouses.length === 0) {
        return;
      }

      // Use quote creation date or shipment date if available
      const shipment = shipments.find(s => s.quoteId === quote.id);
      const dataDate = new Date(shipment?.createdAt || quote.createdAt || quote.created_at);

      // Skip old data
      if (dataDate < cutoffDate) {
        return;
      }

      warehouses.forEach(warehouse => {
        // Check various possible field names for pricing
        const freightCharge = warehouse.freightCharge || warehouse.freight_charge || warehouse.freightCost || 0;
        const dutyAndTaxes = warehouse.dutyAndTaxes || warehouse.duty_and_taxes || warehouse.dutyTaxes || 0;
        const deliveryFee = warehouse.deliveryFee || warehouse.delivery_fee || warehouse.deliveryCharge || 0;

        // Skip warehouses without any pricing
        if (!freightCharge && !dutyAndTaxes && !deliveryFee) {
          return;
        }

        const warehouseCode = warehouse.warehouseCode || warehouse.warehouse_code || warehouse.code;
        const warehouseName = warehouse.warehouseName || warehouse.warehouse_name || warehouse.name || warehouseCode;

        if (!warehouseCode) {
          return;
        }

        if (!rates[warehouseCode]) {
          rates[warehouseCode] = {
            warehouseCode: warehouseCode,
            warehouseName: warehouseName,
            averageRatePerKg: 0,
            sampleSize: 0,
            lastShipmentDate: dataDate
          };
        }

        // Calculate rate per kg for this warehouse
        const totalWeight = warehouse.estimatedWeight || warehouse.estimated_weight ||
                          warehouse.chargeableWeight || warehouse.chargeable_weight ||
                          warehouse.weight || 0;

        const warehouseTotal = freightCharge + dutyAndTaxes + deliveryFee;

        if (totalWeight > 0 && warehouseTotal > 0) {
          const ratePerKg = warehouseTotal / totalWeight;
          const current = rates[warehouseCode];

          // Update average rate
          current.averageRatePerKg =
            (current.averageRatePerKg * current.sampleSize + ratePerKg) /
            (current.sampleSize + 1);
          current.sampleSize++;

          // Update last shipment date
          if (dataDate > current.lastShipmentDate) {
            current.lastShipmentDate = dataDate;
          }

          // Rate added successfully
        }
      });
    });

    // Also include data from invoiced shipments for better accuracy
    shipments.forEach(shipment => {
      if (!shipment.invoice) return;

      const quote = quotes.find(q => q.id === shipment.quoteId || q.id === shipment.quote_id);
      if (!quote) return;

      // Parse warehouse data from quote
      let warehouses: any[] = [];

      if (quote.per_warehouse_costs) {
        try {
          const warehouseCosts = typeof quote.per_warehouse_costs === 'string'
            ? JSON.parse(quote.per_warehouse_costs)
            : quote.per_warehouse_costs;

          if (Array.isArray(warehouseCosts)) {
            warehouses = warehouseCosts;
          } else if (typeof warehouseCosts === 'object') {
            warehouses = Object.entries(warehouseCosts).map(([code, data]: [string, any]) => ({
              warehouseCode: code,
              warehouseName: data.warehouseName || code,
              ...data
            }));
          }
        } catch (e) {
          // Silently skip if parsing fails
        }
      }

      if ((!warehouses || warehouses.length === 0) && quote.warehouses) {
        warehouses = quote.warehouses;
      }

      if (!warehouses || warehouses.length === 0) return;

      const shipmentDate = new Date(shipment.completedAt || shipment.completed_at || shipment.createdAt || shipment.created_at);
      if (shipmentDate < cutoffDate) return;

      warehouses.forEach(warehouse => {
        const warehouseCode = warehouse.warehouseCode || warehouse.warehouse_code || warehouse.code;
        const warehouseName = warehouse.warehouseName || warehouse.warehouse_name || warehouse.name || warehouseCode;

        if (!warehouseCode) return;

        if (!rates[warehouseCode]) {
          rates[warehouseCode] = {
            warehouseCode: warehouseCode,
            warehouseName: warehouseName,
            averageRatePerKg: 0,
            sampleSize: 0,
            lastShipmentDate: shipmentDate
          };
        }

        // Use actual invoice amounts if available
        const invoiceWarehouse = shipment.invoice?.warehouses?.find(
          (w: any) => (w.warehouseCode || w.warehouse_code) === warehouseCode
        );

        const totalWeight = invoiceWarehouse?.actualWeight || invoiceWarehouse?.actual_weight ||
                          warehouse.estimatedWeight || warehouse.estimated_weight ||
                          warehouse.chargeableWeight || warehouse.chargeable_weight ||
                          warehouse.weight || 0;

        const freightCharge = warehouse.freightCharge || warehouse.freight_charge || warehouse.freightCost || 0;
        const dutyAndTaxes = warehouse.dutyAndTaxes || warehouse.duty_and_taxes || warehouse.dutyTaxes || 0;
        const deliveryFee = warehouse.deliveryFee || warehouse.delivery_fee || warehouse.deliveryCharge || 0;

        const warehouseTotal = invoiceWarehouse?.totalAmount || invoiceWarehouse?.total_amount ||
          (freightCharge + dutyAndTaxes + deliveryFee);

        if (totalWeight > 0 && warehouseTotal > 0) {
          const ratePerKg = warehouseTotal / totalWeight;
          const current = rates[warehouseCode];

          // Update average rate
          current.averageRatePerKg =
            (current.averageRatePerKg * current.sampleSize + ratePerKg) /
            (current.sampleSize + 1);
          current.sampleSize++;

          // Update last shipment date
          if (shipmentDate > current.lastShipmentDate) {
            current.lastShipmentDate = shipmentDate;
          }

          // Rate added successfully
        }
      });
    });

    return rates;
  }, [shipments, quotes]);

  // Get unique warehouses with recent data
  const availableWarehouses = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 45);

    return Object.values(warehouseRates)
      .filter(rate => rate.lastShipmentDate >= cutoffDate && rate.sampleSize > 0)
      .sort((a, b) => a.warehouseName.localeCompare(b.warehouseName));
  }, [warehouseRates]);

  const handleCalculate = () => {
    if (selectedWarehouse && chargeableWeight && parseFloat(chargeableWeight) > 0) {
      setShowEstimate(true);
    }
  };

  const selectedWarehouseRate = selectedWarehouse ? warehouseRates[selectedWarehouse] : null;
  const hasRecentData = selectedWarehouseRate &&
    selectedWarehouseRate.lastShipmentDate >= new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);

  const estimatedCost = selectedWarehouseRate && hasRecentData && chargeableWeight
    ? selectedWarehouseRate.averageRatePerKg * parseFloat(chargeableWeight)
    : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Calculator className="w-8 h-8 text-blue-600" />
          Shipment Estimator
        </h1>
        <p className="text-gray-600">
          Get a quick estimate based on historical shipping rates to your warehouses
        </p>
      </div>

      {/* Important Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900 mb-2">Important Notice</p>
            <p className="text-amber-800">
              This tool provides a very rough estimate only, based on average rates from past shipments.
              The actual quote price will depend on many factors including:
            </p>
            <ul className="list-disc list-inside mt-2 text-amber-700 space-y-1">
              <li>Product type and classification</li>
              <li>Current duty rates and taxes</li>
              <li>Fuel surcharges and seasonal adjustments</li>
              <li>Special handling requirements</li>
              <li>Current market conditions</li>
            </ul>
            <p className="text-amber-800 mt-2 font-medium">
              This estimate does not constitute a quote or price guarantee.
            </p>
          </div>
        </div>
      </div>

      {/* Estimation Form */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6">Calculate Estimate</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4 inline-block mr-1" />
              Select Warehouse
            </label>
            <select
              value={selectedWarehouse}
              onChange={(e) => {
                setSelectedWarehouse(e.target.value);
                setShowEstimate(false);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a warehouse...</option>
              {availableWarehouses.map(warehouse => (
                <option key={warehouse.warehouseCode} value={warehouse.warehouseCode}>
                  {warehouse.warehouseName} ({warehouse.warehouseCode})
                </option>
              ))}
            </select>
            {availableWarehouses.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No warehouses with recent shipment data available
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chargeable Weight (kg)
            </label>
            <input
              type="number"
              value={chargeableWeight}
              onChange={(e) => {
                setChargeableWeight(e.target.value);
                setShowEstimate(false);
              }}
              placeholder="Enter weight in kilograms"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Warning for no recent data */}
        {selectedWarehouse && !hasRecentData && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">No Recent Data Available</p>
                <p className="text-sm text-red-700 mt-1">
                  There is no shipment data in the past 45 days for this warehouse.
                  Please select a different warehouse to get a quick estimate.
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleCalculate}
          disabled={!selectedWarehouse || !chargeableWeight || parseFloat(chargeableWeight) <= 0 || !hasRecentData}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Calculate Estimate
        </button>
      </div>

      {/* Estimate Results */}
      {showEstimate && selectedWarehouseRate && hasRecentData && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">Estimated Cost</h2>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="text-center">
              <p className="text-sm text-blue-600 mb-2">Estimated Total</p>
              <p className="text-4xl font-bold text-blue-900">
                ${estimatedCost.toFixed(2)}
              </p>
              <p className="text-sm text-blue-600 mt-2">
                Based on ${selectedWarehouseRate.averageRatePerKg.toFixed(2)}/kg
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Warehouse</p>
                <p className="text-gray-600">
                  {selectedWarehouseRate.warehouseName} ({selectedWarehouseRate.warehouseCode})
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Average Rate</p>
                <p className="text-gray-600">
                  ${selectedWarehouseRate.averageRatePerKg.toFixed(2)} per kg
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Sample Size</p>
                <p className="text-gray-600">
                  Based on {selectedWarehouseRate.sampleSize} shipment{selectedWarehouseRate.sampleSize !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Last Shipment</p>
                <p className="text-gray-600">
                  {new Date(selectedWarehouseRate.lastShipmentDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <span className="font-medium">Disclaimer:</span> This is an estimate only and should not be used for budgeting purposes.
              Actual shipping costs may vary significantly. Please request a formal quote for accurate pricing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}