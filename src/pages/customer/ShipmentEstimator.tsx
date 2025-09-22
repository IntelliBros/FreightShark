import React, { useState, useMemo } from 'react';
import { Calculator, AlertTriangle, Package, DollarSign, Calendar, Info, Box, Weight, Ruler } from 'lucide-react';
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

  // Chargeable Weight Calculator State
  const [calcCartonCount, setCalcCartonCount] = useState('');
  const [calcLength, setCalcLength] = useState('');
  const [calcWidth, setCalcWidth] = useState('');
  const [calcHeight, setCalcHeight] = useState('');
  const [calcWeight, setCalcWeight] = useState('');
  const [calcDimensionUnit, setCalcDimensionUnit] = useState<'cm' | 'in'>('cm');
  const [showCalcResults, setShowCalcResults] = useState(false);

  // Calculate average rates for each warehouse based on recent quotes with pricing
  const warehouseRates = useMemo(() => {
    const rates: { [key: string]: WarehouseRate } = {};
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 45); // 45 days ago

    // Process all quotes
    quotes.forEach(quote => {
      // Skip if quote is too old
      const quoteDate = new Date(quote.created_at || quote.createdAt || Date.now());
      if (quoteDate < cutoffDate) return;

      // Parse per_warehouse_costs which contains the warehouse rates
      let warehouseData: any[] = [];

      if (quote.per_warehouse_costs) {
        try {
          // per_warehouse_costs can be a string (JSON) or already parsed object/array
          if (typeof quote.per_warehouse_costs === 'string') {
            warehouseData = JSON.parse(quote.per_warehouse_costs);
          } else if (Array.isArray(quote.per_warehouse_costs)) {
            warehouseData = quote.per_warehouse_costs;
          } else if (typeof quote.per_warehouse_costs === 'object') {
            // If it's an object, convert to array
            warehouseData = Object.values(quote.per_warehouse_costs);
          }
        } catch (e) {
          // Skip if we can't parse the data
          return;
        }
      }

      // Process each warehouse in the quote
      warehouseData.forEach((warehouse: any) => {
        // Extract warehouse identifier - it might be in different fields
        const warehouseName = warehouse.warehouse || warehouse.warehouseName || warehouse.name || '';

        // Skip if no warehouse name
        if (!warehouseName) return;

        // Extract rate and weight data
        const ratePerKg = warehouse.ratePerKg || warehouse.rate_per_kg || 0;
        const weight = warehouse.chargeableWeight || warehouse.weight || warehouse.chargeable_weight || 0;

        // Skip if no valid rate or weight
        if (ratePerKg <= 0 || weight <= 0) return;

        // Initialize or update warehouse data
        if (!rates[warehouseName]) {
          rates[warehouseName] = {
            warehouseCode: warehouseName,
            warehouseName: warehouseName,
            averageRatePerKg: 0,
            sampleSize: 0,
            lastShipmentDate: quoteDate
          };
        }

        const current = rates[warehouseName];

        // Update average rate
        current.averageRatePerKg =
          (current.averageRatePerKg * current.sampleSize + ratePerKg) /
          (current.sampleSize + 1);
        current.sampleSize++;

        // Update last date
        if (quoteDate > current.lastShipmentDate) {
          current.lastShipmentDate = quoteDate;
        }
      });
    });

    // Also check shipments with invoices for additional data
    shipments.forEach(shipment => {
      // Skip if shipment is too old
      const shipmentDate = new Date(shipment.created_at || shipment.createdAt || Date.now());
      if (shipmentDate < cutoffDate) return;

      // Find the related quote
      const quote = quotes.find(q => q.id === shipment.quote_id || q.id === shipment.quoteId);
      if (!quote) return;

      // Parse quote's warehouse data
      let warehouseData: any[] = [];

      if (quote.per_warehouse_costs) {
        try {
          if (typeof quote.per_warehouse_costs === 'string') {
            warehouseData = JSON.parse(quote.per_warehouse_costs);
          } else if (Array.isArray(quote.per_warehouse_costs)) {
            warehouseData = quote.per_warehouse_costs;
          } else if (typeof quote.per_warehouse_costs === 'object') {
            warehouseData = Object.values(quote.per_warehouse_costs);
          }
        } catch (e) {
          return;
        }
      }

      // If shipment has invoice, use actual invoice data
      if (shipment.invoice) {
        warehouseData.forEach((warehouse: any) => {
          const warehouseName = warehouse.warehouse || warehouse.warehouseName || warehouse.name || '';
          if (!warehouseName) return;

          // For invoiced shipments, we can use actual amounts if available
          const invoiceAmount = shipment.invoice.total_amount || shipment.invoice.totalAmount || 0;
          const actualWeight = shipment.actual_weight || shipment.actualWeight ||
                               warehouse.chargeableWeight || warehouse.weight || 0;

          if (invoiceAmount > 0 && actualWeight > 0 && warehouseData.length > 0) {
            // Estimate rate based on invoice (dividing equally among warehouses for simplicity)
            const estimatedRatePerKg = invoiceAmount / (actualWeight * warehouseData.length);

            if (!rates[warehouseName]) {
              rates[warehouseName] = {
                warehouseCode: warehouseName,
                warehouseName: warehouseName,
                averageRatePerKg: 0,
                sampleSize: 0,
                lastShipmentDate: shipmentDate
              };
            }

            const current = rates[warehouseName];
            current.averageRatePerKg =
              (current.averageRatePerKg * current.sampleSize + estimatedRatePerKg) /
              (current.sampleSize + 1);
            current.sampleSize++;

            if (shipmentDate > current.lastShipmentDate) {
              current.lastShipmentDate = shipmentDate;
            }
          }
        });
      }
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

  // Calculate volumetric weight
  const calculateVolumetricWeight = () => {
    const count = parseFloat(calcCartonCount) || 0;
    const length = parseFloat(calcLength) || 0;
    const width = parseFloat(calcWidth) || 0;
    const height = parseFloat(calcHeight) || 0;
    const weightPerCarton = parseFloat(calcWeight) || 0;

    if (count <= 0 || length <= 0 || width <= 0 || height <= 0) {
      return { grossWeight: 0, volumetricWeight: 0, chargeableWeight: 0 };
    }

    let volumetricWeight: number;

    if (calcDimensionUnit === 'in') {
      // For inches: (L x W x H) / 366
      const volumePerCarton = length * width * height;
      const totalVolume = volumePerCarton * count;
      volumetricWeight = totalVolume / 366;
    } else {
      // For cm: (L x W x H) / 6000
      const volumePerCarton = length * width * height;
      const totalVolume = volumePerCarton * count;
      volumetricWeight = totalVolume / 6000;
    }

    // Gross weight is actual weight multiplied by carton count
    const grossWeight = weightPerCarton * count;

    // Chargeable weight is the greater of the two
    const chargeableWeightValue = Math.max(grossWeight, volumetricWeight);

    return {
      grossWeight,
      volumetricWeight,
      chargeableWeight: chargeableWeightValue
    };
  };

  const handleCalculateChargeable = () => {
    if (calcCartonCount && calcLength && calcWidth && calcHeight && calcWeight) {
      setShowCalcResults(true);
    }
  };

  const handleUseCalculatedWeight = () => {
    const { chargeableWeight: calcChargeable } = calculateVolumetricWeight();
    setChargeableWeight(calcChargeable.toFixed(2));
    setShowEstimate(false);
  };

  const { grossWeight, volumetricWeight, chargeableWeight: calculatedChargeable } = calculateVolumetricWeight();

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

      {/* Main Grid Layout */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Left Column - Estimation Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">Calculate Estimate</h2>

          <div className="space-y-4">
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
                    {warehouse.warehouseName}
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
                <Weight className="w-4 h-4 inline-block mr-1" />
                Chargeable Weight (kg)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={chargeableWeight}
                  onChange={(e) => {
                    setChargeableWeight(e.target.value);
                    setShowEstimate(false);
                  }}
                  placeholder="Enter weight in kilograms"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
                {showCalcResults && calculatedChargeable > 0 && (
                  <button
                    onClick={handleUseCalculatedWeight}
                    className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    title="Use calculated chargeable weight"
                  >
                    Use {calculatedChargeable.toFixed(2)} kg
                  </button>
                )}
              </div>
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
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors w-full"
          >
            Calculate Estimate
          </button>
        </div>

        {/* Right Column - Chargeable Weight Calculator */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Ruler className="w-5 h-5" />
            Chargeable Weight Calculator
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Box className="w-4 h-4 inline-block mr-1" />
                Carton Count
              </label>
              <input
                type="number"
                value={calcCartonCount}
                onChange={(e) => {
                  setCalcCartonCount(e.target.value);
                  setShowCalcResults(false);
                }}
                placeholder="Number of cartons"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                step="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Carton Dimensions Unit
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setCalcDimensionUnit('cm')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    calcDimensionUnit === 'cm'
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Centimeters (CM)
                </button>
                <button
                  onClick={() => setCalcDimensionUnit('in')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    calcDimensionUnit === 'in'
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Inches (IN)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dimensions Per Carton
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Length
                  </label>
                <input
                  type="number"
                  value={calcLength}
                  onChange={(e) => {
                    setCalcLength(e.target.value);
                    setShowCalcResults(false);
                  }}
                  placeholder="L"
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Width
                  </label>
                <input
                  type="number"
                  value={calcWidth}
                  onChange={(e) => {
                    setCalcWidth(e.target.value);
                    setShowCalcResults(false);
                  }}
                  placeholder="W"
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Height
                  </label>
                <input
                  type="number"
                  value={calcHeight}
                  onChange={(e) => {
                    setCalcHeight(e.target.value);
                    setShowCalcResults(false);
                  }}
                  placeholder="H"
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Weight className="w-4 h-4 inline-block mr-1" />
                Weight Per Carton (kg)
              </label>
              <input
                type="number"
                value={calcWeight}
                onChange={(e) => {
                  setCalcWeight(e.target.value);
                  setShowCalcResults(false);
                }}
                placeholder="Weight per carton in kilograms"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the weight of a single carton. Total weight will be calculated as weight × carton count.
              </p>
            </div>

            <button
              onClick={handleCalculateChargeable}
              disabled={!calcCartonCount || !calcLength || !calcWidth || !calcHeight || !calcWeight}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Calculate Chargeable Weight
            </button>

            {/* Calculator Results */}
            {showCalcResults && calculatedChargeable > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Gross Weight:</span>
                  <span className="font-medium">{grossWeight.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Total Volumetric Weight
                    <span className="text-xs text-gray-400 ml-1">
                      (÷{calcDimensionUnit === 'in' ? '366' : '6000'})
                    </span>:
                  </span>
                  <span className="font-medium">{volumetricWeight.toFixed(2)} kg</span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Chargeable Weight:</span>
                    <span className={`text-lg font-bold ${
                      grossWeight > volumetricWeight ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {calculatedChargeable.toFixed(2)} kg
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {grossWeight > volumetricWeight
                      ? '(Using gross weight - actual weight is higher)'
                      : '(Using volumetric weight - size/volume is higher)'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
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
                  {selectedWarehouseRate.warehouseName}
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