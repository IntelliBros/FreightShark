import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, PlayIcon, TruckIcon, ShipIcon, PlaneTakeoffIcon, ChevronDownIcon, StarIcon, CheckCircleIcon, ArrowUpIcon, GlobeIcon, ClockIcon, ShieldCheckIcon, PackageIcon, DollarSignIcon, MapPinIcon, CalendarIcon, FileTextIcon, BellIcon, BuildingIcon, SearchIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, ShieldIcon, ZapIcon, AlertCircleIcon } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

const stats = [
  { value: '10,000+', label: 'Shipments Delivered', icon: TruckIcon },
  { value: '50+', label: 'Countries Served', icon: GlobeIcon },
  { value: '24/7', label: 'Customer Support', icon: ShieldCheckIcon },
];

const features = [
  {
    title: 'Real-Time Tracking',
    description: 'Watch your cargo move across the ocean with live GPS tracking and instant updates.',
    icon: MapPinIcon,
    demo: 'track'
  },
  {
    title: 'Smart Routing',
    description: 'Our AI-powered system finds the fastest, most cost-effective shipping routes.',
    icon: GlobeIcon,
    demo: 'route'
  },
  {
    title: 'Fast Quotes',
    description: 'Get shipping quotes within 1 business day. Quick turnaround, competitive rates.',
    icon: DollarSignIcon,
    demo: 'quote'
  },
  {
    title: 'Document Management',
    description: 'All your shipping documents in one secure, accessible place.',
    icon: FileTextIcon,
    demo: 'docs'
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    company: 'Global Imports Inc.',
    quote: "Freight Shark transformed our shipping operations. What used to take weeks now happens in days!",
    rating: 5,
    image: 'SC'
  },
  {
    name: 'Marcus Rodriguez',
    company: 'Tech Solutions Ltd.',
    quote: "The real-time tracking and automated documentation saves us hours every week. Absolutely game-changing!",
    rating: 5,
    image: 'MR'
  },
  {
    name: 'Emily Johnson',
    company: 'Fashion Forward Co.',
    quote: "Best freight forwarding service we've ever used. The customer support is exceptional!",
    rating: 5,
    image: 'EJ'
  },
];

const shippingRoutes = [
  { from: 'Los Angeles', to: 'Shanghai', days: '12-15', price: '$2,450' },
  { from: 'New York', to: 'London', days: '7-10', price: '$1,890' },
  { from: 'Miami', to: 'Tokyo', days: '14-18', price: '$3,200' },
  { from: 'Hamburg', to: 'Singapore', days: '20-25', price: '$2,780' },
];

export const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [weight, setWeight] = useState('');
  const [volume, setVolume] = useState('');
  const [calculatedQuote, setCalculatedQuote] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [currentDemoStep, setCurrentDemoStep] = useState(0);
  
  usePageTitle('Welcome to Freight Shark');

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTrack = () => {
    if (trackingId) {
      alert(`Tracking shipment: ${trackingId}\nStatus: In Transit\nLocation: Pacific Ocean\nETA: 3 days`);
    }
  };

  const calculateQuote = () => {
    if (weight && volume) {
      const basePrice = parseFloat(weight) * 2.5 + parseFloat(volume) * 15;
      const routeMultiplier = shippingRoutes[selectedRoute].price.replace(/[^0-9]/g, '');
      const total = basePrice + (parseInt(routeMultiplier) * 0.1);
      setCalculatedQuote(total);
    }
  };

  const handleSubscribe = () => {
    if (email && email.includes('@')) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md fixed w-full z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/freight-shark-logo.svg" alt="Freight Shark" className="h-10" />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="text-gray-700 hover:text-[#00b4d8] transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('demo')} className="text-gray-700 hover:text-[#00b4d8] transition-colors">
                Try It Live
              </button>
              <button onClick={() => scrollToSection('testimonials')} className="text-gray-700 hover:text-[#00b4d8] transition-colors">
                Reviews
              </button>
              <Link to="/login" className="bg-[#00b4d8] text-white px-6 py-2 rounded-full hover:bg-[#0096b8] transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col pt-16 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#00b4d8]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative flex-1 flex flex-col justify-center pt-4 pb-12 w-full">
          {/* Main content row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <h1 className="text-4xl lg:text-6xl font-bold text-[#1f2c39] mb-5 leading-tight">
                Ship Smarter
                <span className="text-[#00b4d8] block">Ship Faster</span>
              </h1>
              <p className="text-lg text-gray-600 mb-7 leading-relaxed">
                Experience the future of freight forwarding with Freight Shark's intelligent shipping platform. 
                Track, manage, and optimize your global shipments with ease.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/signup" 
                  className="bg-[#00b4d8] text-white px-7 py-3.5 rounded-full hover:bg-[#0096b8] transition-all transform hover:scale-105 hover:shadow-lg flex items-center justify-center text-base font-semibold"
                >
                  Start Free Trial
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
                <button 
                  onClick={() => scrollToSection('tracking-demo')}
                  className="border-2 border-[#00b4d8] text-[#00b4d8] px-7 py-3.5 rounded-full hover:bg-[#00b4d8] hover:text-white transition-all flex items-center justify-center text-base font-semibold"
                >
                  <PlayIcon className="mr-2 h-4 w-4" />
                  Try Live Demo
                </button>
              </div>
            </div>
            
            {/* Stats Cards Stacked Vertically */}
            <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
              <div className="flex flex-col gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="group cursor-pointer">
                    <div className="bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center">
                      <div className="w-12 h-12 rounded-full bg-[#00b4d8]/10 flex items-center justify-center mr-3.5 group-hover:scale-110 transition-transform">
                        <stat.icon className="h-6 w-6 text-[#00b4d8]" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-[#1f2c39]">{stat.value}</div>
                        <div className="text-xs text-gray-600">{stat.label}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features Section - Now part of hero */}
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#1f2c39] mb-2">
                Powerful Features at Your Fingertips
              </h2>
              <p className="text-lg text-gray-600">
                Click on any feature below to see it in action!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <button 
                  key={index} 
                  onClick={() => setActiveDemo(feature.demo)}
                  className="group bg-white rounded-xl p-5 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 text-left cursor-pointer"
                >
                  <feature.icon className="h-8 w-8 text-[#00b4d8] mb-2.5 group-hover:scale-110 transition-transform" />
                  <h3 className="text-base font-bold text-[#1f2c39] mb-1.5">{feature.title}</h3>
                  <p className="text-xs text-gray-600">{feature.description}</p>
                  <div className="mt-2.5 text-[#00b4d8] font-medium flex items-center text-xs">
                    Try it now
                    <ArrowRightIcon className="ml-1 h-3 w-3 group-hover:translate-x-2 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Real-Time Chat with Shipping Agents Section */}
      <section id="chat-demo" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1f2c39] mb-3">
              Real-Time Communication Hub
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Connect instantly with shipping agents, track conversations, and get updates - all in one place
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Customer Chat View */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-[#00b4d8] to-cyan-500 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                      <span className="text-[#00b4d8] font-bold text-base">SC</span>
                    </div>
                    <div className="ml-3 text-white">
                      <p className="font-semibold text-base">Live Chat with Shipping Agent</p>
                      <p className="text-xs opacity-90">Sarah Chen - Customer</p>
                    </div>
                  </div>
                  <span className="bg-green-400 w-3 h-3 rounded-full animate-pulse"></span>
                </div>
              </div>
              <div className="p-5 h-[480px] overflow-y-auto bg-gray-50">
                {/* Messages */}
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <div className="bg-[#00b4d8] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-xs">
                      <p className="text-sm">Hi, I need an update on my shipment FS-00013</p>
                      <p className="text-xs opacity-75 mt-1">10:30 AM</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-xs shadow">
                      <p className="text-xs font-medium text-gray-700">Agent Li Wei</p>
                      <p className="text-sm text-gray-600">Hello Sarah! Your shipment is currently in transit. It cleared customs yesterday.</p>
                      <p className="text-xs text-gray-400 mt-1">10:32 AM</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-[#00b4d8] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-xs">
                      <p className="text-sm">Great! When is the expected delivery?</p>
                      <p className="text-xs opacity-75 mt-1">10:33 AM</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-xs shadow">
                      <p className="text-xs font-medium text-gray-700">Agent Li Wei</p>
                      <p className="text-sm text-gray-600">Expected delivery is March 15th, 2024. I'll send you tracking details shortly.</p>
                      <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-800">📍 Current Location: Pacific Ocean</p>
                        <p className="text-xs text-blue-800">📦 Container: FSCU1234567</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">10:34 AM</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-[#00b4d8] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-xs">
                      <p className="text-sm">Perfect, thank you for the quick update!</p>
                      <p className="text-xs opacity-75 mt-1">10:35 AM</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-xs shadow">
                      <p className="text-xs font-medium text-gray-700">Agent Li Wei</p>
                      <p className="text-sm text-gray-600">You're welcome! I've also sent the updated invoice to your email. Is there anything else you need help with?</p>
                      <p className="text-xs text-gray-400 mt-1">10:36 AM</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 p-3">
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700">
                    <FileTextIcon className="h-5 w-5" />
                  </button>
                  <input 
                    type="text" 
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-[#00b4d8]"
                  />
                  <button className="bg-[#00b4d8] text-white p-2 rounded-full hover:bg-[#0096b8]">
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Quote Request System Demo */}
      <section id="demo" className="py-20 bg-gradient-to-br from-[#00b4d8]/5 to-cyan-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1f2c39] mb-3">
              Advanced Quote Request System
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Experience our streamlined quote request process with intelligent features designed to save you time and reduce errors
            </p>
          </div>

          {/* Step-by-step demo */}
          <div className="max-w-6xl mx-auto">
            {/* Step indicators */}
            <div className="flex items-center justify-center mb-12">
              {['Supplier Info', 'Destinations', 'Product Details', 'Review'].map((step, index) => (
                <React.Fragment key={index}>
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      index <= currentDemoStep ? 'bg-[#00b4d8] text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      index <= currentDemoStep ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step}
                    </span>
                  </div>
                  {index < 3 && (
                    <div className={`w-12 h-0.5 mx-2 ${
                      index < currentDemoStep ? 'bg-[#00b4d8]' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Demo content */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {currentDemoStep === 0 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Step 1: Supplier & Pickup Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 border-2 border-[#00b4d8]/20 rounded-lg bg-[#00b4d8]/5">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <CheckCircleIcon className="w-5 h-5 text-[#00b4d8] mr-2" />
                          Saved Suppliers
                        </h4>
                        <p className="text-sm text-gray-600">
                          Select from your previously saved suppliers for quick access
                        </p>
                        <div className="mt-3 space-y-2">
                          <div className="p-2 bg-white rounded border border-gray-200 text-sm">
                            Guangzhou Electronics Co.
                          </div>
                          <div className="p-2 bg-white rounded border border-gray-200 text-sm">
                            Shenzhen Tech Manufacturing
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pickup Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          defaultValue="2024-02-15"
                        />
                      </div>
                      <div className="p-4 border rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Person
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          defaultValue="Li Wei"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentDemoStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Step 2: Destinations & Cargo Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 border-2 border-[#00b4d8]/20 rounded-lg bg-[#00b4d8]/5">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <BuildingIcon className="w-5 h-5 text-[#00b4d8] mr-2" />
                          Pre-filled Amazon FBA Warehouses
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          All Amazon warehouses are pre-loaded - just search and select
                        </p>
                        <div className="relative">
                          <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search warehouses..."
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                          <div className="text-sm p-2 hover:bg-gray-50 cursor-pointer rounded">ONT8 - California</div>
                          <div className="text-sm p-2 hover:bg-gray-50 cursor-pointer rounded">LGB8 - California</div>
                          <div className="text-sm p-2 hover:bg-gray-50 cursor-pointer rounded">PHX6 - Arizona</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 border-2 border-[#00b4d8]/20 rounded-lg bg-[#00b4d8]/5">
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <PackageIcon className="w-5 h-5 text-[#00b4d8] mr-2" />
                          Saved Carton Templates
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Reuse your saved carton configurations
                        </p>
                        <div className="space-y-2">
                          <div className="p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">Standard Box A</p>
                                <p className="text-xs text-gray-500">50x40x30cm, 15kg</p>
                              </div>
                              <button className="text-[#00b4d8] text-sm">Use</button>
                            </div>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">Large Box B</p>
                                <p className="text-xs text-gray-500">60x50x40cm, 20kg</p>
                              </div>
                              <button className="text-[#00b4d8] text-sm">Use</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentDemoStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Step 3: Product Details
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Description
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        defaultValue="Electronic Accessories - USB Cables"
                        readOnly
                      />
                    </div>
                    <div className="p-4 border rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Competitor ASIN (for reference)
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="B08XXXXX"
                      />
                    </div>
                    <div className="p-4 border-2 border-yellow-200 rounded-lg bg-yellow-50">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <AlertCircleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                        Regulated Goods Declaration
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Help us ensure compliance by selecting if your products contain:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" className="rounded" />
                          <span>FDA Regulated</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" className="rounded" />
                          <span>Batteries/Hazmat</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" className="rounded" />
                          <span>Wood/Bamboo</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" className="rounded" />
                          <span>Liquids/Powders</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentDemoStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Step 4: Review & Submit
                  </h3>
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                      Quote Request Summary
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-green-200">
                        <span className="text-gray-600">Supplier:</span>
                        <span className="font-medium">Guangzhou Electronics Co.</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-green-200">
                        <span className="text-gray-600">Destinations:</span>
                        <span className="font-medium">3 FBA Warehouses</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-green-200">
                        <span className="text-gray-600">Total Cartons:</span>
                        <span className="font-medium">150 cartons</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-green-200">
                        <span className="text-gray-600">Total Weight:</span>
                        <span className="font-medium">2,250 kg</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Pickup Date:</span>
                        <span className="font-medium">Feb 15, 2024</span>
                      </div>
                    </div>
                    <button className="w-full mt-6 px-6 py-3 bg-[#00b4d8] text-white rounded-lg hover:bg-[#0096c7] transition-colors font-medium">
                      Submit Quote Request
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setCurrentDemoStep(Math.max(0, currentDemoStep - 1))}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    currentDemoStep === 0 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={currentDemoStep === 0}
                >
                  <ChevronLeftIcon className="w-4 h-4 mr-1" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentDemoStep(Math.min(3, currentDemoStep + 1))}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    currentDemoStep === 3
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#00b4d8] text-white hover:bg-[#0096c7]'
                  }`}
                  disabled={currentDemoStep === 3}
                >
                  Next
                  <ChevronRightIcon className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1f2c39] mb-4">
              Real Results from Real Customers
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of businesses shipping smarter with Freight Shark
            </p>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-r from-[#00b4d8]/10 to-cyan-100/50 rounded-3xl p-12">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-[#00b4d8] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {testimonials[currentTestimonial].image}
                </div>
              </div>
              
              <div className="flex justify-center mb-6">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <StarIcon key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <blockquote className="text-2xl text-[#1f2c39] font-medium mb-8 italic text-center max-w-3xl mx-auto">
                "{testimonials[currentTestimonial].quote}"
              </blockquote>
              
              <div className="text-center">
                <div className="font-bold text-[#1f2c39] text-lg">
                  {testimonials[currentTestimonial].name}
                </div>
                <div className="text-gray-600">
                  {testimonials[currentTestimonial].company}
                </div>
              </div>
            </div>

            {/* Interactive Testimonial Navigation */}
            <div className="flex justify-center mt-8 space-x-4">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-12 h-12 rounded-full transition-all flex items-center justify-center font-bold ${
                    index === currentTestimonial 
                      ? 'bg-[#00b4d8] text-white scale-110' 
                      : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Subscription */}
      <section className="py-20 bg-gradient-to-r from-[#00b4d8] to-cyan-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Stay Updated on Shipping Trends
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Get weekly insights and exclusive offers delivered to your inbox
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-6 py-3 rounded-full focus:outline-none focus:ring-4 focus:ring-white/30"
            />
            <button 
              onClick={handleSubscribe}
              className="bg-white text-[#00b4d8] px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              {subscribed ? 'Subscribed!' : 'Subscribe'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1f2c39] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <img src="/shark-icon.svg" alt="Freight Shark" className="h-12 mb-4" />
              <p className="text-gray-400">
                Revolutionizing freight forwarding with intelligent technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/features" className="text-gray-400 hover:text-white">Features</Link></li>
                <li><Link to="/pricing" className="text-gray-400 hover:text-white">Pricing</Link></li>
                <li><Link to="/tracking" className="text-gray-400 hover:text-white">Tracking</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-white">About</Link></li>
                <li><Link to="/careers" className="text-gray-400 hover:text-white">Careers</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link to="/help" className="text-gray-400 hover:text-white">Help Center</Link></li>
                <li><Link to="/docs" className="text-gray-400 hover:text-white">Documentation</Link></li>
                <li><Link to="/status" className="text-gray-400 hover:text-white">Status</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Freight Shark. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Chat Widget */}
      <div className="fixed bottom-8 right-8 z-40 group">
        <button className="bg-[#00b4d8] text-white rounded-full p-4 shadow-2xl hover:bg-[#0096b8] transition-all transform hover:scale-110">
          <BellIcon className="h-6 w-6" />
        </button>
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-gray-900 text-white text-sm px-3 py-1 rounded whitespace-nowrap">
            Need help? Chat with us!
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 left-8 bg-white text-[#00b4d8] rounded-full p-3 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 z-40"
      >
        <ArrowUpIcon className="h-6 w-6" />
      </button>
    </div>
  );
};