import React, { useState, Fragment, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { TruckIcon, PackageIcon, BuildingIcon, CheckCircleIcon, PlusIcon, MinusIcon, InfoIcon, AlertCircleIcon, XIcon, ChevronRightIcon, CheckIcon, CopyIcon, TrashIcon, SearchIcon, EditIcon } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { DataService } from '../../services/DataService';
import { useAuth } from '../../context/AuthContext';
import { amazonWarehouseService, AmazonWarehouse } from '../../services/amazonWarehouseService';
// Step definitions
const STEPS = [{
  id: 'supplier',
  label: 'Supplier & Pickup'
}, {
  id: 'destinations',
  label: 'Destinations & Cargo'
}, {
  id: 'product',
  label: 'Product Details'
}, {
  id: 'review',
  label: 'Review & Submit'
}];
// Suppliers will be managed dynamically by users
type Supplier = {
  id: string;
  name: string;
  address: string;
  contact: string;
  wechatPhone?: string;
};
type DestinationCarton = {
  cartonConfigId: string;
  quantity: number;
};

type WarehouseDestination = {
  id: string;
  isAmazon: boolean;
  fbaWarehouse: string;
  customAddress?: string;
  cartonSelections: DestinationCarton[];
  cartons: number;
  length: number;
  width: number;
  height: number;
  grossWeight: number;
  volumetricWeight: number;
  chargeableWeight: number;
};
type CartonConfiguration = {
  id: string;
  nickname: string;
  cartonWeight: number;
  length: number;
  width: number;
  height: number;
  volumetricWeight: number;
};
type QuoteFormData = {
  supplier: Supplier | null;
  shipmentDate: string;
  masterCargoDetails: {
    cartonConfigurations: CartonConfiguration[];
    totalGrossWeight: number;
    totalCartonCount: number;
    totalVolumetricWeight: number;
    totalChargeableWeight: number;
    dimensions: {
      unit: 'cm' | 'in';
    };
  };
  destinations: WarehouseDestination[];
  productDetails: {
    description: string;
    competitorASIN: string;
    regulatedGoods: 'fda' | 'wood-bamboo-animal' | 'batteries-hazmat' | 'cream-liquids-powders' | 'none' | '';
  };
  specialInstructions: string;
};
export const NewQuote = () => {
  const navigate = useNavigate();
  const {
    addToast
  } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [showNewCartonForm, setShowNewCartonForm] = useState(false);
  const [showCartonSelectionModal, setShowCartonSelectionModal] = useState(false);
  const [currentDestinationIndex, setCurrentDestinationIndex] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<'select' | 'create' | 'edit'>('select');
  const [editingCartonId, setEditingCartonId] = useState<string | null>(null);
  const [savedCartonConfigs, setSavedCartonConfigs] = useState<CartonConfiguration[]>([]);
  const [newCartonConfig, setNewCartonConfig] = useState<CartonConfiguration>({
    id: '',
    nickname: '',
    cartonWeight: 0,
    length: 0,
    width: 0,
    height: 0,
    volumetricWeight: 0
  });
  const [formData, setFormData] = useState<QuoteFormData>({
    supplier: null,
    shipmentDate: '',
    masterCargoDetails: {
      cartonConfigurations: [{
        id: `carton-${Date.now()}`,
        nickname: '',
        cartonWeight: 0,
        length: 0,
        width: 0,
        height: 0,
        volumetricWeight: 0
      }],
      totalGrossWeight: 0,
      totalCartonCount: 0,
      totalVolumetricWeight: 0,
      totalChargeableWeight: 0,
      dimensions: {
        unit: 'cm'
      }
    },
    destinations: [],
    productDetails: {
      description: '',
      competitorASIN: '',
      regulatedGoods: ''
    },
    specialInstructions: ''
  });
  const [savedSuppliers, setSavedSuppliers] = useState<Supplier[]>([]);
  const [showNewSupplierForm, setShowNewSupplierForm] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    address: '',
    contact: '',
    wechatPhone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [isLoadingCartons, setIsLoadingCartons] = useState(true);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showEditSupplierForm, setShowEditSupplierForm] = useState(false);

  // Load suppliers and carton configurations from database on component mount
  useEffect(() => {
    loadSuppliers();
    loadCartonConfigurations();
  }, []);

  const loadSuppliers = async () => {
    try {
      setIsLoadingSuppliers(true);
      if (!user?.id) {
        console.error('No user ID available');
        return;
      }
      const suppliers = await DataService.getUserSuppliers(user.id);
      // Transform the data to match the component's Supplier type
      const transformedSuppliers = suppliers.map((s: any) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        contact: s.contact_name || '',
        wechatPhone: s.wechat_phone || ''
      }));
      setSavedSuppliers(transformedSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      addToast('Failed to load suppliers', 'error');
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  const loadCartonConfigurations = async () => {
    try {
      setIsLoadingCartons(true);
      if (!user?.id) {
        console.error('No user ID available');
        return;
      }
      const cartons = await DataService.getUserCartonConfigurations(user.id);
      // Transform the data to match the component's CartonConfiguration type
      const transformedCartons = cartons.map((c: any) => ({
        id: c.id,
        nickname: c.name,
        cartonWeight: c.weight,
        length: c.length,
        width: c.width,
        height: c.height,
        volumetricWeight: calculateVolumetricWeight(c.length, c.width, c.height, formData.masterCargoDetails.dimensions.unit)
      }));
      setSavedCartonConfigs(transformedCartons);
    } catch (error) {
      console.error('Error loading carton configurations:', error);
      // Don't show error toast as this might be the first time
    } finally {
      setIsLoadingCartons(false);
    }
  };

  // Amazon warehouse state
  const [availableWarehouses, setAvailableWarehouses] = useState<AmazonWarehouse[]>([]);
  const [warehouseSearch, setWarehouseSearch] = useState('');

  // Load warehouses on component mount
  useEffect(() => {
    const warehouses = amazonWarehouseService.getAllWarehouses();
    setAvailableWarehouses(warehouses);
  }, []);

  // Filter warehouses based on search
  const getFilteredWarehouses = (): AmazonWarehouse[] => {
    if (warehouseSearch.trim()) {
      return amazonWarehouseService.searchWarehouses(warehouseSearch);
    }
    return availableWarehouses;
  };

  // Helper function to get warehouse display address
  const getWarehouseDisplayAddress = (warehouseName: string): string => {
    const warehouse = amazonWarehouseService.getAllWarehouses().find(w => w.name === warehouseName);
    if (!warehouse) return 'Warehouse address not found';
    return `${warehouse.address}, ${warehouse.city}, ${warehouse.state} ${warehouse.zipCode}`;
  };

  const calculateVolumetricWeight = (length: number, width: number, height: number, unit: 'cm' | 'in') => {
    if (unit === 'cm') {
      return length * width * height / 6000;
    } else {
      return length * width * height / 366;
    }
  };
  const calculateChargeableWeight = (gross: number, volumetric: number) => {
    return Math.max(gross, volumetric);
  };
  const handleSupplierSelect = (supplier: Supplier) => {
    setFormData({
      ...formData,
      supplier
    });
  };
  const handleAddNewSupplier = async () => {
    // Validate all required fields
    if (!newSupplier.name || !newSupplier.address || !newSupplier.contact || !newSupplier.wechatPhone) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      if (!user?.id) {
        addToast('Please log in to add suppliers', 'error');
        return;
      }

      // Save to database with user_id
      const savedSupplier = await DataService.createSupplier(user.id, {
        name: newSupplier.name,
        address: newSupplier.address,
        contact: newSupplier.contact,
        wechatPhone: newSupplier.wechatPhone
      });

      // Transform to component's Supplier type
      const newSupplierObj = {
        id: savedSupplier.id,
        name: savedSupplier.name,
        address: savedSupplier.address,
        contact: savedSupplier.contact_name || '',
        wechatPhone: savedSupplier.wechat_phone || ''
      };

      // Update local state
      setSavedSuppliers([...savedSuppliers, newSupplierObj]);
      setFormData({
        ...formData,
        supplier: newSupplierObj
      });
      setShowNewSupplierForm(false);
      setNewSupplier({
        name: '',
        address: '',
        contact: '',
        wechatPhone: ''
      });

      addToast('Supplier added successfully', 'success');
    } catch (error) {
      console.error('Error adding supplier:', error);
      addToast('Failed to add supplier', 'error');
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowEditSupplierForm(true);
    setShowNewSupplierForm(false);
  };

  const handleUpdateSupplier = async () => {
    if (!editingSupplier) return;

    // Validate all required fields
    if (!editingSupplier.name || !editingSupplier.address || !editingSupplier.contact || !editingSupplier.wechatPhone) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      // Update in database
      await DataService.updateSupplier(editingSupplier.id, {
        name: editingSupplier.name,
        address: editingSupplier.address,
        contact_name: editingSupplier.contact,
        wechat_phone: editingSupplier.wechatPhone
      });

      // Update local state
      const updatedSuppliers = savedSuppliers.map(s =>
        s.id === editingSupplier.id ? editingSupplier : s
      );
      setSavedSuppliers(updatedSuppliers);

      // Update selected supplier if it's the one being edited
      if (formData.supplier?.id === editingSupplier.id) {
        setFormData({
          ...formData,
          supplier: editingSupplier
        });
      }

      setShowEditSupplierForm(false);
      setEditingSupplier(null);
      addToast('Supplier updated successfully', 'success');
    } catch (error) {
      console.error('Error updating supplier:', error);
      addToast('Failed to update supplier', 'error');
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) {
      return;
    }

    try {
      // Delete from database
      await DataService.deleteSupplier(supplierId);

      // Update local state
      const updatedSuppliers = savedSuppliers.filter(s => s.id !== supplierId);
      setSavedSuppliers(updatedSuppliers);

      // Clear selection if deleted supplier was selected
      if (formData.supplier?.id === supplierId) {
        setFormData({
          ...formData,
          supplier: null
        });
      }

      addToast('Supplier deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting supplier:', error);
      addToast('Failed to delete supplier', 'error');
    }
  };

  const handleSaveNewCartonConfig = async () => {
    if (!newCartonConfig.nickname || newCartonConfig.cartonWeight <= 0 ||
        newCartonConfig.length <= 0 || newCartonConfig.width <= 0 || newCartonConfig.height <= 0) {
      addToast('Please fill in all carton configuration fields', 'error');
      return;
    }

    try {
      if (!user?.id) {
        addToast('Please log in to save carton configurations', 'error');
        return;
      }

      const cartonToSave = {
        name: newCartonConfig.nickname,
        length: newCartonConfig.length,
        width: newCartonConfig.width,
        height: newCartonConfig.height,
        weight: newCartonConfig.cartonWeight,
        user_id: user.id
      };

      const savedCarton = await DataService.createCartonConfiguration(cartonToSave);

      const volumetricWeight = calculateVolumetricWeight(
        savedCarton.length,
        savedCarton.width,
        savedCarton.height,
        formData.masterCargoDetails.dimensions.unit
      );

      const savedConfig = {
        id: savedCarton.id,
        nickname: savedCarton.name,
        cartonWeight: savedCarton.weight,
        length: savedCarton.length,
        width: savedCarton.width,
        height: savedCarton.height,
        volumetricWeight
      };

      setSavedCartonConfigs([...savedCartonConfigs, savedConfig]);
      setShowNewCartonForm(false);
      setNewCartonConfig({
        id: '',
        nickname: '',
        cartonWeight: 0,
        length: 0,
        width: 0,
        height: 0,
        volumetricWeight: 0
      });
      addToast('Carton configuration saved successfully', 'success');
    } catch (error) {
      console.error('Error saving carton configuration:', error);
      addToast('Failed to save carton configuration', 'error');
    }
  };
  const handleDimensionUnitChange = (unit: 'cm' | 'in') => {
    setFormData({
      ...formData,
      masterCargoDetails: {
        ...formData.masterCargoDetails,
        dimensions: {
          unit
        }
      }
    });
    // Recalculate volumetric weights for saved configs when unit changes
    const updatedSavedConfigs = savedCartonConfigs.map(config => ({
      ...config,
      volumetricWeight: calculateVolumetricWeight(config.length, config.width, config.height, unit)
    }));
    setSavedCartonConfigs(updatedSavedConfigs);
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData({
        ...formData,
        cipl: e.target.files[0]
      });
    }
  };
  const handleMasterCargoChange = (field: string, value: any) => {
    const updatedMasterCargo = {
      ...formData.masterCargoDetails,
      [field]: value
    };
    // Recalculate volumetric weight when dimensions or carton count changes
    if (['length', 'width', 'height', 'cartonCount'].includes(field) || field === 'dimensions' && ('length' in value || 'width' in value || 'height' in value || 'unit' in value)) {
      const {
        length,
        width,
        height,
        unit
      } = updatedMasterCargo.dimensions;
      const cartonCount = updatedMasterCargo.cartonCount;
      const volumetricWeight = calculateVolumetricWeight(length, width, height, cartonCount, unit);
      updatedMasterCargo.volumetricWeight = volumetricWeight;
      // Update chargeable weight
      updatedMasterCargo.chargeableWeight = calculateChargeableWeight(updatedMasterCargo.grossWeight, volumetricWeight);
    }
    // Recalculate chargeable weight when gross weight changes
    if (field === 'grossWeight') {
      updatedMasterCargo.chargeableWeight = calculateChargeableWeight(value, updatedMasterCargo.volumetricWeight);
    }
    setFormData({
      ...formData,
      masterCargoDetails: updatedMasterCargo
    });
  };
  const handleDimensionChange = (field: string, value: any) => {
    const updatedDimensions = {
      ...formData.masterCargoDetails.dimensions,
      [field]: value
    };
    handleMasterCargoChange('dimensions', updatedDimensions);
  };
  const handleAddDestination = () => {
    const newDestination: WarehouseDestination = {
      id: `dest-${Date.now()}`,
      isAmazon: true,
      fbaWarehouse: '',
      cartonSelections: [],
      cartons: 0,
      length: 0,
      width: 0,
      height: 0,
      grossWeight: 0,
      volumetricWeight: 0,
      chargeableWeight: 0
    };
    setFormData({
      ...formData,
      destinations: [...formData.destinations, newDestination]
    });
  };
  const handleRemoveDestination = (index: number) => {
    const updatedDestinations = [...formData.destinations];
    updatedDestinations.splice(index, 1);
    setFormData({
      ...formData,
      destinations: updatedDestinations
    });
  };
  const handleAddCartonToDestination = (destIndex: number, cartonConfigId: string) => {
    const updatedDestinations = [...formData.destinations];
    const destination = updatedDestinations[destIndex];
    
    // Check if this carton config is already added
    const existingSelection = destination.cartonSelections.find(s => s.cartonConfigId === cartonConfigId);
    if (!existingSelection) {
      destination.cartonSelections.push({
        cartonConfigId,
        quantity: 1
      });
      
      // Recalculate totals
      const cartonConfig = savedCartonConfigs.find(c => c.id === cartonConfigId);
      if (cartonConfig) {
        destination.grossWeight += cartonConfig.cartonWeight;
        destination.volumetricWeight += cartonConfig.volumetricWeight;
        destination.chargeableWeight = Math.max(destination.grossWeight, destination.volumetricWeight);
        destination.cartons += 1;
      }
    }
    
    setFormData({
      ...formData,
      destinations: updatedDestinations
    });
  };
  
  const handleCartonQuantityChange = (destIndex: number, cartonConfigId: string, quantity: number) => {
    const updatedDestinations = [...formData.destinations];
    const destination = updatedDestinations[destIndex];
    const selection = destination.cartonSelections.find(s => s.cartonConfigId === cartonConfigId);
    
    if (selection) {
      const oldQuantity = selection.quantity;
      selection.quantity = quantity;
      
      // Recalculate totals
      const cartonConfig = savedCartonConfigs.find(c => c.id === cartonConfigId);
      if (cartonConfig) {
        const quantityDiff = quantity - oldQuantity;
        destination.grossWeight += cartonConfig.cartonWeight * quantityDiff;
        destination.volumetricWeight += cartonConfig.volumetricWeight * quantityDiff;
        destination.chargeableWeight = Math.max(destination.grossWeight, destination.volumetricWeight);
        destination.cartons += quantityDiff;
      }
    }
    
    setFormData({
      ...formData,
      destinations: updatedDestinations
    });
  };
  
  const handleRemoveCartonFromDestination = (destIndex: number, cartonConfigId: string) => {
    const updatedDestinations = [...formData.destinations];
    const destination = updatedDestinations[destIndex];
    const selectionIndex = destination.cartonSelections.findIndex(s => s.cartonConfigId === cartonConfigId);
    
    if (selectionIndex !== -1) {
      const selection = destination.cartonSelections[selectionIndex];
      const cartonConfig = savedCartonConfigs.find(c => c.id === cartonConfigId);
      
      if (cartonConfig) {
        destination.grossWeight -= cartonConfig.cartonWeight * selection.quantity;
        destination.volumetricWeight -= cartonConfig.volumetricWeight * selection.quantity;
        destination.chargeableWeight = Math.max(destination.grossWeight, destination.volumetricWeight);
        destination.cartons -= selection.quantity;
      }
      
      destination.cartonSelections.splice(selectionIndex, 1);
    }
    
    setFormData({
      ...formData,
      destinations: updatedDestinations
    });
  };
  
  const handleDestinationChange = (index: number, field: string, value: any) => {
    const updatedDestinations = [...formData.destinations];
    updatedDestinations[index] = {
      ...updatedDestinations[index],
      [field]: value
    };
    // If toggling to/from Amazon delivery
    if (field === 'isAmazon') {
      updatedDestinations[index].isAmazon = value;
      if (value) {
        // Clear custom address when switching to Amazon
        delete updatedDestinations[index].customAddress;
      } else {
        // Clear FBA warehouse when switching to non-Amazon
        updatedDestinations[index].fbaWarehouse = '';
      }
    }
    // Clear search when warehouse is selected
    if (field === 'fbaWarehouse' && value) {
      setWarehouseSearch('');
    }
    // Recalculate volumetric and chargeable weights when dimensions, cartons, or gross weight changes
    if (['length', 'width', 'height', 'cartons', 'grossWeight'].includes(field)) {
      const {
        length,
        width,
        height,
        cartons,
        grossWeight
      } = updatedDestinations[index];
      const volumetricWeight = calculateVolumetricWeight(length, width, height, cartons, formData.masterCargoDetails.dimensions.unit);
      updatedDestinations[index].volumetricWeight = volumetricWeight;
      updatedDestinations[index].chargeableWeight = calculateChargeableWeight(grossWeight, volumetricWeight);
    }
    setFormData({
      ...formData,
      destinations: updatedDestinations
    });
  };
  const handleProductDetailsChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      productDetails: {
        ...formData.productDetails,
        [field]: value
      }
    });
  };
  const handleNextStep = () => {
    // Add validation here before proceeding to next step
    if (currentStep === 0) {
      if (!formData.supplier) {
        addToast('Please select or add a supplier', 'error');
        return;
      }
      if (!formData.shipmentDate) {
        addToast('Please select an estimated shipment date', 'error');
        return;
      }
    }

    if (currentStep === 1) {
      if (formData.destinations.length === 0) {
        addToast('Please add at least one warehouse destination', 'error');
        return;
      }

      // Check if all destinations have a warehouse selected
      const hasDestinationWithoutWarehouse = formData.destinations.some(dest => {
        if (dest.isAmazon) {
          return !dest.fbaWarehouse || dest.fbaWarehouse.trim() === '';
        } else {
          return !dest.customAddress || dest.customAddress.trim() === '';
        }
      });

      if (hasDestinationWithoutWarehouse) {
        addToast('Please select a warehouse or provide a custom address for each destination', 'error');
        return;
      }

      // Check if any destination has no cartons
      const hasDestinationWithoutCartons = formData.destinations.some(dest => dest.cartonSelections.length === 0);
      if (hasDestinationWithoutCartons) {
        addToast('Please add at least one carton configuration to each warehouse', 'error');
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.productDetails.description.trim()) {
        addToast('Please provide a product description', 'error');
        return;
      }
      if (!formData.productDetails.competitorASIN.trim()) {
        addToast('Please provide a competitor ASIN', 'error');
        return;
      }
      if (!formData.productDetails.regulatedGoods) {
        addToast('Please select a regulatory information option', 'error');
        return;
      }
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  const handleSubmitQuote = async () => {
    // Validate required fields
    if (!formData.supplier) {
      addToast('Please select or add a supplier', 'error');
      return;
    }

    if (!formData.shipmentDate) {
      addToast('Please select an estimated shipment date', 'error');
      return;
    }

    if (formData.destinations.length === 0) {
      addToast('Please add at least one warehouse destination', 'error');
      return;
    }

    // Check if all destinations have a warehouse selected
    const hasDestinationWithoutWarehouse = formData.destinations.some(dest => {
      if (dest.isAmazon) {
        return !dest.fbaWarehouse || dest.fbaWarehouse.trim() === '';
      } else {
        return !dest.customAddress || dest.customAddress.trim() === '';
      }
    });

    if (hasDestinationWithoutWarehouse) {
      addToast('Please select a warehouse or provide a custom address for each destination', 'error');
      return;
    }

    // Check if any destination has no cartons
    const hasDestinationWithoutCartons = formData.destinations.some(dest => dest.cartonSelections.length === 0);
    if (hasDestinationWithoutCartons) {
      addToast('Please add at least one carton configuration to each warehouse', 'error');
      return;
    }

    if (!formData.productDetails.description) {
      addToast('Please provide a product description', 'error');
      return;
    }

    if (!formData.productDetails.competitorASIN) {
      addToast('Please provide a competitor ASIN', 'error');
      return;
    }

    if (!formData.productDetails.regulatedGoods) {
      addToast('Please select regulated goods type', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Format the data for the API
      const quoteRequest = {
        customerId: user?.id || 'user-1',
        status: 'Awaiting Quote',
        requestedDate: new Date().toISOString().split('T')[0],
        dueBy: formData.shipmentDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cargoDetails: {
          cartonCount: totalDestinationCartons,
          grossWeight: totalDestinationGrossWeight,
          cbm: (totalDestinationVolumetricWeight / 167).toFixed(3), // Convert volumetric weight to CBM (1 CBM = 167 kg)
          hazardous: false,
          notes: formData.specialInstructions || '',
          productDescription: formData.productDetails.description,
          competitorASIN: formData.productDetails.competitorASIN,
          regulatedGoods: formData.productDetails.regulatedGoods
        },
        destinations: formData.destinations.map(dest => ({
          id: dest.id,
          fbaWarehouse: dest.isAmazon ? (dest.fbaWarehouse || 'Unnamed Warehouse') : (dest.customAddress || 'Custom Address'),
          amazonShipmentId: '', // No longer needed
          cartons: dest.cartons || 0,
          weight: dest.grossWeight || 0
        })),
        supplierDetails: formData.supplier ? {
          name: formData.supplier.name,
          address: formData.supplier.address,
          city: formData.supplier.address.split(',').slice(-2)[0]?.trim() || '',
          country: 'China',
          contactName: formData.supplier.contact,
          contactPhone: ''
        } : null,
        specialRequirements: formData.specialInstructions || ''
      };
      try {
        // Save the quote request to the data service
        await DataService.createQuoteRequest(quoteRequest);
        addToast('Quote request submitted successfully! Our team will review and provide pricing shortly.', 'success');
        navigate('/quotes');
      } catch (error) {
        console.error('Error submitting quote request:', error);
        addToast('Failed to submit quote request. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error preparing quote request:', error);
      addToast('Failed to submit quote request. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  // Helper function to calculate cubic meters from the carton configurations
  const calculateCBM = (masterCargoDetails: any) => {
    let totalCBM = 0;
    const {
      cartonConfigurations,
      dimensions
    } = masterCargoDetails;
    cartonConfigurations.forEach((config: any) => {
      const {
        length,
        width,
        height,
        count
      } = config;
      // Convert to meters if in cm
      const factor = dimensions.unit === 'cm' ? 1000000 : 1728; // cm³ to m³ or in³ to ft³
      const volumeInCBM = length * width * height * count / factor;
      totalCBM += volumeInCBM;
    });
    return parseFloat(totalCBM.toFixed(2));
  };
  // Calculate total weights across all destinations
  const totalDestinationGrossWeight = formData.destinations.reduce((sum, dest) => sum + dest.grossWeight, 0);
  const totalDestinationVolumetricWeight = formData.destinations.reduce((sum, dest) => sum + dest.volumetricWeight, 0);
  const totalDestinationChargeableWeight = formData.destinations.reduce((sum, dest) => sum + dest.chargeableWeight, 0);
  const totalDestinationCartons = formData.destinations.reduce((sum, dest) => sum + dest.cartons, 0);
  // Get current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // Supplier & Pickup
        return <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Select a Supplier
              </h3>
              {!showNewSupplierForm && !showEditSupplierForm ? <div className="space-y-4">
                  {isLoadingSuppliers ? (
                    <div className="text-center py-6 text-gray-500">
                      <p>Loading suppliers...</p>
                    </div>
                  ) : savedSuppliers.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <p className="mb-2">No suppliers added yet</p>
                      <p className="text-sm">Click below to add your first supplier</p>
                    </div>
                  ) : null}
                  {!isLoadingSuppliers && savedSuppliers.map(supplier => <div key={supplier.id} className={`border rounded-lg p-4 transition ${formData.supplier?.id === supplier.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                      <div className="flex justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => handleSupplierSelect(supplier)}>
                          <h4 className="font-medium text-gray-900">
                            {supplier.name}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {supplier.address}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Contact: {supplier.contact}
                          </p>
                          {supplier.wechatPhone && (
                            <p className="text-sm text-gray-500 mt-1">
                              WeChat/Phone: {supplier.wechatPhone}
                            </p>
                          )}
                        </div>
                        <div className="flex items-start space-x-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSupplier(supplier);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit supplier"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSupplier(supplier.id);
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete supplier"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                          {formData.supplier?.id === supplier.id && <CheckCircleIcon className="h-6 w-6 text-blue-500" />}
                        </div>
                      </div>
                    </div>)}
                  <button type="button" onClick={() => setShowNewSupplierForm(true)} className="flex items-center text-blue-600 hover:text-blue-800 font-medium">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add New Supplier
                  </button>
                </div> : showEditSupplierForm && editingSupplier ? <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">Edit Supplier</h4>
                    <button type="button" onClick={() => {
                      setShowEditSupplierForm(false);
                      setEditingSupplier(null);
                    }} className="text-gray-400 hover:text-gray-600">
                      <XIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">All fields marked with <span className="text-red-500">*</span> are required</p>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="edit-supplier-name" className="block text-sm font-medium text-gray-700">
                        Supplier Name <span className="text-red-500">*</span>
                      </label>
                      <input type="text" id="edit-supplier-name" required value={editingSupplier.name} onChange={e => setEditingSupplier({
                        ...editingSupplier,
                        name: e.target.value
                      })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Enter supplier name" />
                    </div>
                    <div>
                      <label htmlFor="edit-supplier-address" className="block text-sm font-medium text-gray-700">
                        Address in China <span className="text-red-500">*</span>
                      </label>
                      <input type="text" id="edit-supplier-address" required value={editingSupplier.address} onChange={e => setEditingSupplier({
                        ...editingSupplier,
                        address: e.target.value
                      })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Enter supplier address" />
                    </div>
                    <div>
                      <label htmlFor="edit-supplier-contact" className="block text-sm font-medium text-gray-700">
                        Contact Person Name <span className="text-red-500">*</span>
                      </label>
                      <input type="text" id="edit-supplier-contact" required value={editingSupplier.contact} onChange={e => setEditingSupplier({
                        ...editingSupplier,
                        contact: e.target.value
                      })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Enter contact person name" />
                    </div>
                    <div>
                      <label htmlFor="edit-supplier-wechat-phone" className="block text-sm font-medium text-gray-700">
                        Supplier WeChat/Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input type="text" id="edit-supplier-wechat-phone" required value={editingSupplier.wechatPhone || ''} onChange={e => setEditingSupplier({
                        ...editingSupplier,
                        wechatPhone: e.target.value
                      })} placeholder="Enter WeChat ID or Phone Number" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button variant="outline" onClick={() => {
                        setShowEditSupplierForm(false);
                        setEditingSupplier(null);
                      }}>
                        Cancel
                      </Button>
                      <Button variant="primary" onClick={handleUpdateSupplier} disabled={!editingSupplier.name || !editingSupplier.address || !editingSupplier.contact || !editingSupplier.wechatPhone}>
                        Update Supplier
                      </Button>
                    </div>
                  </div>
                </div> : <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">New Supplier</h4>
                    <button type="button" onClick={() => setShowNewSupplierForm(false)} className="text-gray-400 hover:text-gray-600">
                      <XIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">All fields marked with <span className="text-red-500">*</span> are required</p>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="supplier-name" className="block text-sm font-medium text-gray-700">
                        Supplier Name <span className="text-red-500">*</span>
                      </label>
                      <input type="text" id="supplier-name" required value={newSupplier.name} onChange={e => setNewSupplier({
                    ...newSupplier,
                    name: e.target.value
                  })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Enter supplier name" />
                    </div>
                    <div>
                      <label htmlFor="supplier-address" className="block text-sm font-medium text-gray-700">
                        Address in China <span className="text-red-500">*</span>
                      </label>
                      <input type="text" id="supplier-address" required value={newSupplier.address} onChange={e => setNewSupplier({
                    ...newSupplier,
                    address: e.target.value
                  })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Enter supplier address" />
                    </div>
                    <div>
                      <label htmlFor="supplier-contact" className="block text-sm font-medium text-gray-700">
                        Contact Person Name <span className="text-red-500">*</span>
                      </label>
                      <input type="text" id="supplier-contact" required value={newSupplier.contact} onChange={e => setNewSupplier({
                    ...newSupplier,
                    contact: e.target.value
                  })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Enter contact person name" />
                    </div>
                    <div>
                      <label htmlFor="supplier-wechat-phone" className="block text-sm font-medium text-gray-700">
                        Supplier WeChat/Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input type="text" id="supplier-wechat-phone" required value={newSupplier.wechatPhone} onChange={e => setNewSupplier({
                    ...newSupplier,
                    wechatPhone: e.target.value
                  })} placeholder="Enter WeChat ID or Phone Number" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div className="flex justify-end">
                      <Button variant="primary" onClick={handleAddNewSupplier} disabled={!newSupplier.name || !newSupplier.address || !newSupplier.contact || !newSupplier.wechatPhone}>
                        Add Supplier
                      </Button>
                    </div>
                  </div>
                </div>}
            </div>
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Estimated Shipment Date
              </h3>
              <div>
                <label htmlFor="shipment-date" className="block text-sm font-medium text-gray-700">
                  When do you expect the shipment to be ready? <span className="text-red-500">*</span>
                </label>
                <input type="date" id="shipment-date" required value={formData.shipmentDate} onChange={e => setFormData({
                ...formData,
                shipmentDate: e.target.value
              })} min={new Date().toISOString().split('T')[0]} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
            </div>
          </div>;
      case 1:
        // Destinations
        return <div className="space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Delivery Destinations
                </h3>
                <button 
                  type="button"
                  onClick={handleAddDestination}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Warehouse
                </button>
              </div>
              {formData.destinations.length === 0 ? <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                  <BuildingIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No destinations added
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Add at least one delivery destination (Amazon FBA or custom address)
                  </p>
                  <button 
                    type="button"
                    onClick={handleAddDestination}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Warehouse
                  </button>
                </div> : <div className="space-y-6">
                  {formData.destinations.map((destination, index) => <div key={destination.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Header Section */}
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-sm font-medium">
                              Warehouse #{index + 1}
                            </div>
                            {destination.fbaWarehouse && (
                              <Badge variant="info">{destination.fbaWarehouse}</Badge>
                            )}
                            {destination.customAddress && (
                              <Badge variant="default">Custom Address</Badge>
                            )}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveDestination(index)} 
                            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                          >
                            <XIcon className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-3">
                        {/* Delivery Configuration */}
                        <div>
                          {/* FBA Warehouse or Custom Address */}
                          {destination.isAmazon ? (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-semibold text-gray-700 flex items-center">
                                  <BuildingIcon className="h-4 w-4 mr-1" />
                                  Amazon FBA Warehouse
                                </h5>
                                <span className="text-xs text-gray-500">
                                  Want to ship to a non-FBA address?{' '}
                                  <button
                                    type="button"
                                    onClick={() => handleDestinationChange(index, 'isAmazon', false)}
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    Click here
                                  </button>
                                </span>
                              </div>
                              
                              {/* Search Input */}
                              <div className="relative mb-2">
                                <SearchIcon className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder="Search warehouses..."
                                  value={warehouseSearch}
                                  onChange={e => setWarehouseSearch(e.target.value)}
                                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>

                              {/* Selected Warehouse Display */}
                              {destination.fbaWarehouse && (
                                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-blue-900">{destination.fbaWarehouse}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleDestinationChange(index, 'fbaWarehouse', '')}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      <XIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <div className="text-xs text-blue-700 mt-1">
                                    {getWarehouseDisplayAddress(destination.fbaWarehouse)}
                                  </div>
                                </div>
                              )}

                              {/* Warehouse List - Only show when no warehouse is selected */}
                              {!destination.fbaWarehouse && (
                                <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
                                  {warehouseSearch.trim() || getFilteredWarehouses().length <= 20 ? (
                                    getFilteredWarehouses().length > 0 ? (
                                      <div className="divide-y divide-gray-100">
                                        {getFilteredWarehouses().slice(0, 20).map(warehouse => (
                                          <button
                                            key={warehouse.id}
                                            type="button"
                                            onClick={() => handleDestinationChange(index, 'fbaWarehouse', warehouse.name)}
                                            className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:outline-none focus:bg-blue-50 transition-colors"
                                          >
                                            <div className="font-medium text-sm text-gray-900">
                                              {warehouse.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {warehouse.city}, {warehouse.state}
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="p-3 text-center text-sm text-gray-500">
                                        No warehouses found for "{warehouseSearch}"
                                      </div>
                                    )
                                  ) : (
                                    <div className="p-3 text-center text-sm text-gray-500">
                                      Start typing to search {availableWarehouses.length} warehouses...
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-semibold text-gray-700 flex items-center">
                                  <BuildingIcon className="h-4 w-4 mr-1" />
                                  Delivery Address
                                </h5>
                                <span className="text-xs text-gray-500">
                                  Ship to Amazon FBA warehouse instead?{' '}
                                  <button
                                    type="button"
                                    onClick={() => handleDestinationChange(index, 'isAmazon', true)}
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    Click here
                                  </button>
                                </span>
                              </div>
                              <input
                                type="text"
                                id={`custom-address-${index}`}
                                value={destination.customAddress || ''}
                                onChange={e => handleDestinationChange(index, 'customAddress', e.target.value)}
                                placeholder="Enter complete delivery address"
                                className="w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Cargo Details Section */}
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-sm font-semibold text-gray-700 flex items-center">
                              <PackageIcon className="h-4 w-4 mr-1" />
                              Cargo Configuration
                            </h5>
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentDestinationIndex(index);
                                setModalMode('select');
                                setShowCartonSelectionModal(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <PlusIcon className="h-3.5 w-3.5" />
                              Add Carton
                            </button>
                          </div>
                          
                          {/* Selected Cartons List */}
                          {destination.cartonSelections.length > 0 ? (
                            <div className="grid grid-cols-2 gap-1.5 mb-3">
                              {destination.cartonSelections.map(selection => {
                                const cartonConfig = savedCartonConfigs.find(c => c.id === selection.cartonConfigId);
                                if (!cartonConfig) return null;
                                
                                return (
                                  <div key={selection.cartonConfigId} className="bg-gray-50 border border-gray-200 rounded-md p-2.5">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 flex items-center gap-3">
                                        <PackageIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm text-gray-900">
                                              {cartonConfig.nickname}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                              ({cartonConfig.cartonWeight}kg, {cartonConfig.length}×{cartonConfig.width}×{cartonConfig.height} {formData.masterCargoDetails.dimensions.unit})
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 ml-3">
                                        <div className="flex items-center gap-1">
                                          <label className="text-xs font-medium text-gray-600">Qty:</label>
                                          <input
                                            type="number"
                                            min="1"
                                            value={selection.quantity}
                                            onChange={(e) => handleCartonQuantityChange(index, selection.cartonConfigId, parseInt(e.target.value) || 1)}
                                            className="w-14 text-center border border-gray-300 rounded py-0.5 px-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveCartonFromDestination(index, selection.cartonConfigId)}
                                          className="text-red-500 hover:text-red-700 p-0.5"
                                          title="Remove carton"
                                        >
                                          <XIcon className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="mb-3 col-span-2 text-center py-2 border border-dashed border-gray-300 rounded-md bg-gray-50">
                              <p className="text-xs text-gray-500">No cartons added yet</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>)}
                </div>}
              {formData.destinations.length > 0 && <div className="mt-6 border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Total Shipment Summary
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Total Cartons
                        </label>
                        <div className="text-lg font-medium text-gray-900">
                          {totalDestinationCartons}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Total Gross Weight (kg)
                        </label>
                        <div className="text-lg font-medium text-gray-900">
                          {totalDestinationGrossWeight.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Total Volumetric (kg)
                        </label>
                        <div className="text-lg font-medium text-gray-900">
                          {totalDestinationVolumetricWeight.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Total Chargeable (kg)
                        </label>
                        <div className="text-lg font-medium text-blue-600">
                          {totalDestinationChargeableWeight.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Special Instructions Section */}
                  <div className="mt-4">
                    <label htmlFor="special-instructions" className="block text-sm font-medium text-gray-700 mb-2">
                      <InfoIcon className="inline h-4 w-4 mr-1" />
                      Special Instructions (Optional)
                    </label>
                    <textarea 
                      id="special-instructions" 
                      rows={3} 
                      value={formData.specialInstructions}
                      onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Add any special delivery instructions, requirements, or notes for all destinations..." 
                    />
                  </div>
                </div>}
            </div>
            
            {/* Carton Selection Modal */}
            {showCartonSelectionModal && (
              <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                  {/* Background overlay */}
                  <div 
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={() => {
                      setShowCartonSelectionModal(false);
                      setModalMode('select');
                      setEditingCartonId(null);
                      setNewCartonConfig({
                        id: '',
                        nickname: '',
                        cartonWeight: 0,
                        length: 0,
                        width: 0,
                        height: 0,
                        volumetricWeight: 0
                      });
                    }}
                  />
                  
                  {/* Modal panel */}
                  <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {modalMode === 'select' ? 'Select Carton Configuration' :
                           modalMode === 'create' ? 'Create New Carton Configuration' :
                           'Edit Carton Configuration'}
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCartonSelectionModal(false);
                            setModalMode('select');
                            setEditingCartonId(null);
                            setNewCartonConfig({
                              id: '',
                              nickname: '',
                              cartonWeight: 0,
                              length: 0,
                              width: 0,
                              height: 0,
                              volumetricWeight: 0
                            });
                          }}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <XIcon className="h-5 w-5" />
                        </button>
                      </div>
                      
                      {modalMode === 'select' ? (
                        <>
                          <div className="flex justify-between items-center mb-4">
                            <p className="text-sm text-gray-500">
                              Choose a carton configuration or create a new one
                            </p>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setModalMode('create');
                                setNewCartonConfig({
                                  id: '',
                                  nickname: '',
                                  cartonWeight: 0,
                                  length: 0,
                                  width: 0,
                                  height: 0,
                                  volumetricWeight: 0
                                });
                              }}
                            >
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Create New
                            </Button>
                          </div>
                          
                          {savedCartonConfigs.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                              <PackageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-sm text-gray-600 mb-2">No carton configurations yet</p>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setModalMode('create')}
                              >
                                Create Your First Configuration
                              </Button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                              {savedCartonConfigs.map(config => {
                                const destination = formData.destinations[currentDestinationIndex!];
                                const isAlreadyAdded = destination?.cartonSelections.some(
                                  s => s.cartonConfigId === config.id
                                );
                                
                                return (
                                  <div
                                    key={config.id}
                                    className={`
                                      relative p-4 border rounded-lg transition-all
                                      ${isAlreadyAdded 
                                        ? 'border-gray-200 bg-gray-50 opacity-50' 
                                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                      }
                                    `}
                                  >
                                    <div className="flex items-start justify-between">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!isAlreadyAdded && currentDestinationIndex !== null) {
                                            handleAddCartonToDestination(currentDestinationIndex, config.id);
                                            setShowCartonSelectionModal(false);
                                            setCurrentDestinationIndex(null);
                                            setModalMode('select');
                                          }
                                        }}
                                        disabled={isAlreadyAdded}
                                        className="flex-1 text-left"
                                      >
                                        <div className="flex items-center gap-2 mb-2">
                                          <PackageIcon className="h-4 w-4 text-gray-400" />
                                          <span className="font-medium text-sm text-gray-900">
                                            {config.nickname}
                                          </span>
                                          {isAlreadyAdded && (
                                            <Badge variant="default" className="text-xs">Added</Badge>
                                          )}
                                        </div>
                                        <div className="space-y-1">
                                          <div className="text-xs text-gray-600">
                                            <span className="font-medium">Weight:</span> {config.cartonWeight} kg
                                          </div>
                                          <div className="text-xs text-gray-600">
                                            <span className="font-medium">Dimensions:</span> {config.length}×{config.width}×{config.height} {formData.masterCargoDetails.dimensions.unit}
                                          </div>
                                          <div className="text-xs text-gray-600">
                                            <span className="font-medium">Volumetric:</span> {config.volumetricWeight.toFixed(2)} kg
                                          </div>
                                        </div>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCartonId(config.id);
                                          setNewCartonConfig(config);
                                          setModalMode('edit');
                                        }}
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                        title="Edit configuration"
                                      >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      ) : (
                        /* Create/Edit Form */
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Carton Nickname *
                              </label>
                              <input
                                type="text"
                                value={newCartonConfig.nickname}
                                onChange={e => setNewCartonConfig({...newCartonConfig, nickname: e.target.value})}
                                placeholder="e.g., Small Box, Master Carton"
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Carton Weight (kg) *
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={newCartonConfig.cartonWeight || ''}
                                onChange={e => setNewCartonConfig({...newCartonConfig, cartonWeight: parseFloat(e.target.value) || 0})}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Carton Dimensions *
                              </label>
                              <div className="flex items-center text-xs">
                                <span className="mr-2">Units:</span>
                                <div className="flex border border-gray-300 rounded overflow-hidden">
                                  <button
                                    type="button"
                                    className={`px-2 py-1 text-xs ${formData.masterCargoDetails.dimensions.unit === 'cm' ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700'}`}
                                    onClick={() => handleDimensionUnitChange('cm')}
                                  >
                                    cm
                                  </button>
                                  <button
                                    type="button"
                                    className={`px-2 py-1 text-xs ${formData.masterCargoDetails.dimensions.unit === 'in' ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-700'}`}
                                    onClick={() => handleDimensionUnitChange('in')}
                                  >
                                    in
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Length</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={newCartonConfig.length || ''}
                                  onChange={e => setNewCartonConfig({...newCartonConfig, length: parseFloat(e.target.value) || 0})}
                                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Width</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={newCartonConfig.width || ''}
                                  onChange={e => setNewCartonConfig({...newCartonConfig, width: parseFloat(e.target.value) || 0})}
                                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Height</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={newCartonConfig.height || ''}
                                  onChange={e => setNewCartonConfig({...newCartonConfig, height: parseFloat(e.target.value) || 0})}
                                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                              </div>
                            </div>
                          </div>
                          
                          {newCartonConfig.length > 0 && newCartonConfig.width > 0 && newCartonConfig.height > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-sm text-blue-900">
                                <span className="font-medium">Volumetric Weight:</span> {calculateVolumetricWeight(
                                  newCartonConfig.length,
                                  newCartonConfig.width,
                                  newCartonConfig.height,
                                  formData.masterCargoDetails.dimensions.unit
                                ).toFixed(2)} kg
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                      {modalMode !== 'select' ? (
                        <>
                          <Button
                            variant="primary"
                            onClick={() => {
                              if (modalMode === 'edit' && editingCartonId) {
                                // Update existing configuration
                                const volumetricWeight = calculateVolumetricWeight(
                                  newCartonConfig.length,
                                  newCartonConfig.width,
                                  newCartonConfig.height,
                                  formData.masterCargoDetails.dimensions.unit
                                );
                                setSavedCartonConfigs(prev => prev.map(config => 
                                  config.id === editingCartonId 
                                    ? { ...newCartonConfig, volumetricWeight }
                                    : config
                                ));
                                addToast('Carton configuration updated successfully!', 'success');
                              } else {
                                // Create new configuration
                                handleSaveNewCartonConfig();
                              }
                              setModalMode('select');
                              setEditingCartonId(null);
                            }}
                          >
                            {modalMode === 'edit' ? 'Update' : 'Save'}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setModalMode('select');
                              setEditingCartonId(null);
                              setNewCartonConfig({
                                id: '',
                                nickname: '',
                                cartonWeight: 0,
                                length: 0,
                                width: 0,
                                height: 0,
                                volumetricWeight: 0
                              });
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setShowCartonSelectionModal(false);
                            setModalMode('select');
                          }}
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>;
      case 2:
        // Product Details
        return <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Product Information
              </h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="product-description" className="block text-sm font-medium text-gray-700 mb-2">
                    Product Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="product-description"
                    rows={4}
                    required
                    value={formData.productDetails.description}
                    onChange={(e) => handleProductDetailsChange('description', e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your product (e.g., wireless earbuds, kitchen utensils, clothing items, etc.)"
                  />
                  <p className="mt-1 text-xs text-gray-500">This helps our team accurately calculate customs and clearance fees</p>
                </div>
                
                <div>
                  <label htmlFor="competitor-asin" className="block text-sm font-medium text-gray-700 mb-2">
                    Competitor ASIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="competitor-asin"
                    required
                    value={formData.productDetails.competitorASIN}
                    onChange={(e) => handleProductDetailsChange('competitorASIN', e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="B08XXXXXX"
                  />
                  <p className="mt-1 text-xs text-gray-500">Provide an Amazon ASIN of a similar product to help us understand your product better</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Regulatory Information
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Does your shipment contain any of the following goods? <span className="text-red-500">*</span>
              </p>
              <div className="space-y-3">
                <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition">
                  <input
                    type="radio"
                    name="regulated-goods"
                    value="fda"
                    checked={formData.productDetails.regulatedGoods === 'fda'}
                    onChange={() => handleProductDetailsChange('regulatedGoods', 'fda')}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">FDA Certified Product</span>
                    <p className="text-xs text-gray-500 mt-0.5">Food, cosmetics, medical devices, supplements</p>
                  </div>
                </label>
                
                <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition">
                  <input
                    type="radio"
                    name="regulated-goods"
                    value="wood-bamboo-animal"
                    checked={formData.productDetails.regulatedGoods === 'wood-bamboo-animal'}
                    onChange={() => handleProductDetailsChange('regulatedGoods', 'wood-bamboo-animal')}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">Wooden / Bamboo / Animal Product</span>
                    <p className="text-xs text-gray-500 mt-0.5">Furniture, cutting boards, leather goods, fur</p>
                  </div>
                </label>
                
                <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition">
                  <input
                    type="radio"
                    name="regulated-goods"
                    value="batteries-hazmat"
                    checked={formData.productDetails.regulatedGoods === 'batteries-hazmat'}
                    onChange={() => handleProductDetailsChange('regulatedGoods', 'batteries-hazmat')}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">Batteries or Hazardous Materials</span>
                    <p className="text-xs text-gray-500 mt-0.5">Lithium batteries, magnets, flammable items</p>
                  </div>
                </label>
                
                <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition">
                  <input
                    type="radio"
                    name="regulated-goods"
                    value="cream-liquids-powders"
                    checked={formData.productDetails.regulatedGoods === 'cream-liquids-powders'}
                    onChange={() => handleProductDetailsChange('regulatedGoods', 'cream-liquids-powders')}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">Cream / Liquids / Powders</span>
                    <p className="text-xs text-gray-500 mt-0.5">Lotions, oils, protein powder, spices</p>
                  </div>
                </label>
                
                <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition bg-gray-50">
                  <input
                    type="radio"
                    name="regulated-goods"
                    value="none"
                    checked={formData.productDetails.regulatedGoods === 'none'}
                    onChange={() => handleProductDetailsChange('regulatedGoods', 'none')}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">No, my shipment does not contain any of the goods listed</span>
                  </div>
                </label>
              </div>
              {!formData.productDetails.regulatedGoods && (
                <p className="mt-2 text-sm text-red-600">Please select an option</p>
              )}
            </div>
          </div>;
      case 3:
        // Review & Submit
        return <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quote Request Summary
              </h3>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <InfoIcon className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Ready for Submission
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Your quote request is ready to be submitted. Our team
                        will review your request and provide you with a quote
                        as soon as possible.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">
                      Supplier & Shipment Date
                    </h4>
                    <button type="button" onClick={() => setCurrentStep(0)} className="text-sm text-blue-600 hover:text-blue-800">
                      Edit
                    </button>
                  </div>
                  {formData.supplier && <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500">Supplier:</span>
                        <div className="text-gray-900">
                          {formData.supplier.name}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">
                          Supplier Address:
                        </span>
                        <div className="text-gray-900">
                          {formData.supplier.address}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">
                          Estimated Shipment Date:
                        </span>
                        <div className="text-gray-900">
                          {formData.shipmentDate ? formData.shipmentDate : 'Not specified'}
                        </div>
                      </div>
                    </div>}
                </Card>
                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Cargo Details</h4>
                    <button type="button" onClick={() => setCurrentStep(1)} className="text-sm text-blue-600 hover:text-blue-800">
                      Edit
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">
                          Total Cartons:
                        </span>
                        <div className="text-gray-900">
                          {totalDestinationCartons}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">
                          Total Gross Weight:
                        </span>
                        <div className="text-gray-900">
                          {totalDestinationGrossWeight.toFixed(2)}{' '}
                          kg
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">
                          Total Volumetric Weight:
                        </span>
                        <div className="text-gray-900">
                          {totalDestinationVolumetricWeight.toFixed(2)}{' '}
                          kg
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">
                          Total Chargeable Weight:
                        </span>
                        <div className="font-medium text-blue-600">
                          {totalDestinationChargeableWeight.toFixed(2)}{' '}
                          kg
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">
                      Warehouses ({formData.destinations.length})
                    </h4>
                    <button type="button" onClick={() => setCurrentStep(1)} className="text-sm text-blue-600 hover:text-blue-800">
                      Edit
                    </button>
                  </div>
                  {formData.destinations.length === 0 ? <div className="text-gray-500">No destinations added</div> : <div className="space-y-4">
                      {formData.destinations.map((dest, index) => <div key={dest.id} className="border border-gray-200 rounded p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900">
                                {dest.isAmazon ? (dest.fbaWarehouse || 'Amazon Warehouse') : 'Custom Delivery'}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {dest.isAmazon 
                                  ? (dest.fbaWarehouse ? getWarehouseDisplayAddress(dest.fbaWarehouse) : 'No warehouse selected')
                                  : (dest.customAddress || 'No address specified')}
                              </div>
                            </div>
                            <Badge variant="info">
                              {dest.chargeableWeight.toFixed(2)} kg
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm text-gray-700">
                            <span className="text-gray-500">Cartons:</span>{' '}
                            {dest.cartons} •
                            <span className="text-gray-500 ml-2">Gross:</span>{' '}
                            {dest.grossWeight.toFixed(2)} kg
                          </div>
                        </div>)}
                    </div>}
                </Card>
                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">
                      Product Details
                    </h4>
                    <button type="button" onClick={() => setCurrentStep(2)} className="text-sm text-blue-600 hover:text-blue-800">
                      Edit
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">
                        Product Description:
                      </span>
                      <div className="text-gray-900">
                        {formData.productDetails.description || 'Not provided'}
                      </div>
                    </div>
                    {formData.productDetails.competitorASIN && (
                      <div>
                        <span className="text-sm text-gray-500">
                          Competitor ASIN:
                        </span>
                        <div className="text-gray-900">
                          {formData.productDetails.competitorASIN}
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-gray-500">
                        Regulated Goods:
                      </span>
                      <div className="text-gray-900">
                        {formData.productDetails.regulatedGoods === 'fda' ? 'FDA Certified Product' :
                         formData.productDetails.regulatedGoods === 'wood-bamboo-animal' ? 'Wooden / Bamboo / Animal Product' :
                         formData.productDetails.regulatedGoods === 'batteries-hazmat' ? 'Batteries or Hazardous Materials' :
                         formData.productDetails.regulatedGoods === 'cream-liquids-powders' ? 'Cream / Liquids / Powders' :
                         formData.productDetails.regulatedGoods === 'none' ? 'No regulated goods' : 'Not specified'}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              <div className="mt-8">
                <Button variant="primary" fullWidth onClick={handleSubmitQuote} isLoading={isSubmitting}>
                  Submit Quote Request
                </Button>
                <p className="text-sm text-gray-500 text-center mt-4">
                  By submitting, you agree to our{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    Terms of Service
                  </a>
                </p>
              </div>
            </div>
          </div>;
      default:
        return null;
    }
  };
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Quote</h1>
        <p className="text-gray-600 mt-1">
          Create a new DDP shipping quote for your shipment
        </p>
      </div>
      <div className="mb-8">
        <div className="flex items-center">
          {STEPS.map((step, index) => <Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= index ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {currentStep > index ? <CheckIcon className="w-5 h-5" /> : index + 1}
                </div>
                <span className="text-xs mt-2 text-center max-w-[80px]">
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && <div className={`flex-1 h-1 mx-2 ${currentStep > index ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </Fragment>)}
        </div>
      </div>
      <Card>
        {renderStepContent()}
        <div className="mt-8 flex justify-between">
          {currentStep > 0 ? (
            <Button variant="secondary" onClick={handlePrevStep}>
              Back
            </Button>
          ) : (
            <div></div>
          )}
          {currentStep < STEPS.length - 1 ? (
            <Button variant="primary" onClick={handleNextStep}>
              Continue
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
};