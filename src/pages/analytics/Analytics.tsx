import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BarChart, TrendingUpIcon, DollarSignIcon, PackageIcon, TruckIcon, CalendarIcon, ChevronDownIcon } from 'lucide-react';
// Mock data for the charts and metrics
const MOCK_MONTHLY_SHIPMENTS = [{
  month: 'Jan',
  count: 12
}, {
  month: 'Feb',
  count: 15
}, {
  month: 'Mar',
  count: 18
}, {
  month: 'Apr',
  count: 14
}, {
  month: 'May',
  count: 21
}, {
  month: 'Jun',
  count: 25
}, {
  month: 'Jul',
  count: 30
}, {
  month: 'Aug',
  count: 28
}, {
  month: 'Sep',
  count: 32
}, {
  month: 'Oct',
  count: 35
}, {
  month: 'Nov',
  count: 38
}, {
  month: 'Dec',
  count: 42
}];
const MOCK_SHIPPING_MODES = [{
  mode: 'Air Express',
  percentage: 45
}, {
  mode: 'Air Freight',
  percentage: 35
}, {
  mode: 'Sea Freight',
  percentage: 20
}];
const MOCK_TOP_DESTINATIONS = [{
  warehouse: 'FBA ONT8',
  count: 28,
  percentage: 25
}, {
  warehouse: 'FBA BFI4',
  count: 22,
  percentage: 20
}, {
  warehouse: 'FBA MDW2',
  count: 18,
  percentage: 16
}, {
  warehouse: 'FBA ATL6',
  count: 15,
  percentage: 14
}, {
  warehouse: 'FBA DFW7',
  count: 12,
  percentage: 11
}];
export const Analytics = () => {
  const [timeRange, setTimeRange] = useState('This Year');
  // Calculate the max value for the chart to scale properly
  const maxShipmentCount = Math.max(...MOCK_MONTHLY_SHIPMENTS.map(item => item.count));
  return <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Track and analyze your shipping performance
          </p>
        </div>
        <div className="flex items-center">
          <Button variant="secondary" className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1" />
            {timeRange}
            <ChevronDownIcon className="h-4 w-4 ml-1" />
          </Button>
          <Button variant="primary" className="ml-3">
            Export Report
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Shipments</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">248</h3>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <TrendingUpIcon className="h-4 w-4 mr-1" />
                <span>+12% from last year</span>
              </div>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <PackageIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Spend</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                $184,250
              </h3>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <TrendingUpIcon className="h-4 w-4 mr-1" />
                <span>+8% from last year</span>
              </div>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSignIcon className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Shipping Cost</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">$742</h3>
              <div className="flex items-center mt-2 text-sm text-red-600">
                <TrendingUpIcon className="h-4 w-4 mr-1" />
                <span>+3% from last year</span>
              </div>
            </div>
            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <TruckIcon className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Delivery Time</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                8.4 days
              </h3>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <TrendingUpIcon className="h-4 w-4 mr-1 transform rotate-180" />
                <span>-5% from last year</span>
              </div>
            </div>
            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Monthly Shipments
          </h2>
          <div className="h-64">
            <div className="flex h-full items-end">
              {MOCK_MONTHLY_SHIPMENTS.map((item, index) => <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full max-w-[30px] bg-blue-500 rounded-t" style={{
                height: `${item.count / maxShipmentCount * 100}%`,
                opacity: 0.6 + 0.4 * (item.count / maxShipmentCount)
              }}></div>
                  <div className="text-xs text-gray-600 mt-2">{item.month}</div>
                </div>)}
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Shipping Modes
          </h2>
          <div className="space-y-4">
            {MOCK_SHIPPING_MODES.map((item, index) => <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{item.mode}</span>
                  <span className="text-gray-900">{item.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{
                width: `${item.percentage}%`
              }}></div>
                </div>
              </div>)}
          </div>
          <h2 className="text-lg font-medium text-gray-900 mt-8 mb-6">
            Top FBA Destinations
          </h2>
          <div className="space-y-3">
            {MOCK_TOP_DESTINATIONS.map((item, index) => <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${index === 0 ? 'bg-blue-100 text-blue-600' : index === 1 ? 'bg-green-100 text-green-600' : index === 2 ? 'bg-yellow-100 text-yellow-600' : index === 3 ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                    <span className="text-xs font-medium">{index + 1}</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {item.warehouse}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.count} shipments
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {item.percentage}%
                </span>
              </div>)}
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Cost Analysis
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Shipping Costs</span>
                <span className="text-gray-900">$142,850 (78%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="h-2.5 rounded-full bg-blue-500" style={{
                width: '78%'
              }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Customs & Duties</span>
                <span className="text-gray-900">$25,400 (14%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="h-2.5 rounded-full bg-green-500" style={{
                width: '14%'
              }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Insurance</span>
                <span className="text-gray-900">$12,000 (6%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="h-2.5 rounded-full bg-yellow-500" style={{
                width: '6%'
              }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Other Fees</span>
                <span className="text-gray-900">$4,000 (2%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="h-2.5 rounded-full bg-purple-500" style={{
                width: '2%'
              }}></div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-base font-medium text-gray-700">
                Total Spend
              </span>
              <span className="text-lg font-bold text-blue-600">$184,250</span>
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Performance Metrics
          </h2>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">On-Time Delivery Rate</p>
                <div className="flex items-center mt-1">
                  <div className="text-xl font-bold text-gray-900 mr-2">
                    94%
                  </div>
                  <div className="text-xs text-green-600">+2%</div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Transit Time</p>
                <div className="flex items-center mt-1">
                  <div className="text-xl font-bold text-gray-900 mr-2">
                    8.4 days
                  </div>
                  <div className="text-xs text-green-600">-0.5 days</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Customs Clearance</p>
                <div className="flex items-center mt-1">
                  <div className="text-xl font-bold text-gray-900 mr-2">
                    1.2 days
                  </div>
                  <div className="text-xs text-green-600">-0.3 days</div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Claims Rate</p>
                <div className="flex items-center mt-1">
                  <div className="text-xl font-bold text-gray-900 mr-2">
                    0.8%
                  </div>
                  <div className="text-xs text-green-600">-0.2%</div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">
                Cost per KG (by Mode)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-gray-200 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">Air Express</div>
                  <div className="text-lg font-bold text-blue-600 mt-1">
                    $14.20
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">Air Freight</div>
                  <div className="text-lg font-bold text-green-600 mt-1">
                    $8.50
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-500">Sea Freight</div>
                  <div className="text-lg font-bold text-yellow-600 mt-1">
                    $4.30
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>;
};