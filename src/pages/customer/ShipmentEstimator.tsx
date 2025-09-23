import React, { useState, useMemo } from 'react';
import { Calculator, AlertTriangle, Package, DollarSign, Calendar, Info, Box, Weight, Ruler } from 'lucide-react';
import { useData } from '../../context/DataContextV2';

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
    <div className="max-w-5xl mx-auto">
      <div className="mb-3">
        <h1 className="text-xl font-bold mb-1 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          Shipment Estimator
        </h1>
        <p className="text-sm text-gray-600">
          Get a quick estimate based on historical shipping rates to your warehouses
        </p>
      </div>

      {/* Important Notice - More compact */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-4">
        <div className="flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-amber-900">Important Notice</p>
            <p className="text-amber-700 mt-0.5">
              This provides a rough estimate only. Actual pricing depends on product type, duty rates, fuel surcharges, handling requirements, and market conditions.
              <span className="font-medium text-amber-800"> This is not a quote or price guarantee.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Check if there's any historical data at all */}
      {availableWarehouses.length === 0 ? (
        <>
          {/* Full page empty state when no historical data */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-4">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No Historical Data Available</h2>
            <p className="text-sm text-gray-600 mb-6">
              We don't have enough recent shipment data to provide estimates yet.
              As you complete more shipments, we'll be able to provide accurate cost estimates based on your shipping history.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">What you can do:</h3>
              <ul className="text-xs text-gray-600 space-y-1.5 text-left">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Request a quote for accurate, current pricing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Use the chargeable weight calculator to prepare shipment details</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Check back after completing a few shipments</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => window.location.href = '/quotes/new'}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Request a Quote
            </button>
          </div>
        </div>

        {/* Chargeable Weight Calculator - Always Show When No Historical Data */}
        <div className="max-w-md mx-auto mt-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Chargeable Weight Calculator
            </h2>
            <p className="text-xs text-gray-600 mb-3">
              Calculate your shipment's chargeable weight to prepare for your quote request
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Box className="w-3 h-3 inline-block mr-1" />
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
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Carton Dimensions Unit
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCalcDimensionUnit('cm')}
                    className={`flex-1 px-2 py-1 text-xs rounded-lg border transition-colors ${
                      calcDimensionUnit === 'cm'
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    CM
                  </button>
                  <button
                    onClick={() => setCalcDimensionUnit('in')}
                    className={`flex-1 px-2 py-1 text-xs rounded-lg border transition-colors ${
                      calcDimensionUnit === 'in'
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    IN
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Dimensions Per Carton
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">
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
                      className="w-full px-1 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">
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
                      className="w-full px-1 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">
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
                      className="w-full px-1 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Weight className="w-3 h-3 inline-block mr-1" />
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
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-0.5">
                  Weight × carton count = total weight
                </p>
              </div>

              <button
                onClick={handleCalculateChargeable}
                disabled={!calcCartonCount || !calcLength || !calcWidth || !calcHeight || !calcWeight}
                className="w-full px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Calculate Chargeable Weight
              </button>

              {/* Calculator Results */}
              {showCalcResults && calculatedChargeable > 0 && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">Total Gross Weight:</span>
                    <span className="font-medium">{grossWeight.toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">
                      Volumetric (÷{calcDimensionUnit === 'in' ? '366' : '6000'}):
                    </span>
                    <span className="font-medium">{volumetricWeight.toFixed(2)} kg</span>
                  </div>
                  <div className="pt-1.5 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-900">Chargeable Weight:</span>
                      <span className={`text-sm font-bold ${
                        grossWeight > volumetricWeight ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {calculatedChargeable.toFixed(2)} kg
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {grossWeight > volumetricWeight ? 'Using gross weight' : 'Using volumetric weight'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
      ) : (
        /* Main Grid Layout - Dynamic width based on whether estimate is shown */
        <div className={`grid gap-4 mb-4 items-start ${showEstimate ? 'lg:grid-cols-[2fr_1fr]' : 'lg:grid-cols-2'}`}>
          {/* Left Column - Estimation Form with Results */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-3">Calculate Estimate</h2>

            {/* Input Section */}
            <div className="grid md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Package className="w-3 h-3 inline-block mr-1" />
                  Select Warehouse
                </label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => {
                    setSelectedWarehouse(e.target.value);
                    setShowEstimate(false);
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a warehouse...</option>
                  {availableWarehouses.map(warehouse => (
                    <option key={warehouse.warehouseCode} value={warehouse.warehouseCode}>
                      {warehouse.warehouseName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Weight className="w-3 h-3 inline-block mr-1" />
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
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                  {showCalcResults && calculatedChargeable > 0 && (
                    <button
                      onClick={handleUseCalculatedWeight}
                      className="px-2 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors whitespace-nowrap"
                      title="Use calculated chargeable weight"
                    >
                      Use {calculatedChargeable.toFixed(2)} kg
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={!selectedWarehouse || !chargeableWeight || parseFloat(chargeableWeight) <= 0 || !hasRecentData}
              className="w-full px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Calculate Estimate
            </button>

            {/* Results Section - Now below inputs, only show when needed */}
            {(selectedWarehouse && !hasRecentData) || (showEstimate && selectedWarehouseRate && hasRecentData) ? (
              <div className="mt-4">
                {/* Warning for no recent data */}
                {selectedWarehouse && !hasRecentData && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                    <div className="flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-red-900">No Recent Data Available</p>
                        <p className="text-xs text-red-700 mt-0.5">
                          No shipment data in the past 45 days for this warehouse.
                          Please select a different warehouse.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Estimate Results */}
                {showEstimate && selectedWarehouseRate && hasRecentData && (
                  <div>
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-blue-600 mb-1">Estimated Total</p>
                      <p className="text-2xl font-bold text-blue-900">
                        ${estimatedCost.toFixed(2)}
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Based on ${selectedWarehouseRate.averageRatePerKg.toFixed(2)}/kg
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs">
                      <div className="flex justify-between py-1">
                        <span className="text-gray-600">Warehouse:</span>
                        <span className="font-medium">{selectedWarehouse}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-600">Chargeable Weight:</span>
                        <span className="font-medium">{parseFloat(chargeableWeight).toFixed(2)} kg</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-600">Average Rate:</span>
                        <span className="font-medium">${selectedWarehouseRate.averageRatePerKg.toFixed(2)}/kg</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-600">Based on:</span>
                        <span className="font-medium">{selectedWarehouseRate.sampleSize} shipments</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 italic">
                        This estimate is based on historical averages and does not include potential additional charges
                        such as fuel surcharges, special handling fees, or duties and taxes.
                      </p>
                    </div>
                  </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Right Column - Chargeable Weight Calculator */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Chargeable Weight Calculator
            </h2>
            <p className="text-xs text-gray-600 mb-3">
              Calculate your shipment's chargeable weight to prepare for your quote request
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Box className="w-3 h-3 inline-block mr-1" />
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
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                step="1"
              />
            </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Carton Dimensions Unit
                </label>
              <div className="flex gap-1">
                <button
                  onClick={() => setCalcDimensionUnit('cm')}
                  className={`flex-1 px-2 py-1 text-xs rounded-lg border transition-colors ${
                    calcDimensionUnit === 'cm'
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  CM
                </button>
                <button
                  onClick={() => setCalcDimensionUnit('in')}
                  className={`flex-1 px-2 py-1 text-xs rounded-lg border transition-colors ${
                    calcDimensionUnit === 'in'
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  IN
                </button>
              </div>
            </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Dimensions Per Carton
                </label>
              <div className="grid grid-cols-3 gap-1">
                <div>
                    <label className="block text-xs text-gray-500 mb-0.5">
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
                  className="w-full px-1 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-0.5">
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
                  className="w-full px-1 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-0.5">
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
                  className="w-full px-1 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Weight className="w-3 h-3 inline-block mr-1" />
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
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-0.5">
                Weight × carton count = total weight
              </p>
              </div>

              <button
                onClick={handleCalculateChargeable}
              disabled={!calcCartonCount || !calcLength || !calcWidth || !calcHeight || !calcWeight}
              className="w-full px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Calculate Chargeable Weight
              </button>

              {/* Calculator Results */}
              {showCalcResults && calculatedChargeable > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">Total Gross Weight:</span>
                  <span className="font-medium">{grossWeight.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">
                    Volumetric (÷{calcDimensionUnit === 'in' ? '366' : '6000'}):
                  </span>
                  <span className="font-medium">{volumetricWeight.toFixed(2)} kg</span>
                </div>
                <div className="pt-1.5 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-900">Chargeable Weight:</span>
                    <span className={`text-sm font-bold ${
                      grossWeight > volumetricWeight ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {calculatedChargeable.toFixed(2)} kg
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {grossWeight > volumetricWeight ? 'Using gross weight' : 'Using volumetric weight'}
                  </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}