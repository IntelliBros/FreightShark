import { DataService } from '../services/DataService';

async function addSampleTrackingEvents() {
  console.log('Adding sample tracking events...');

  const shipmentId = 'FS-00013';

  try {
    // Add a series of tracking events
    const events = [
      {
        date: new Date('2025-09-18T09:00:00').toISOString(),
        status: 'Awaiting Pickup',
        location: 'Shenzhen Warehouse',
        description: 'Shipment created and awaiting pickup',
        type: 'tracking'
      },
      {
        date: new Date('2025-09-19T14:30:00').toISOString(),
        status: 'In Progress',
        location: 'Shenzhen Warehouse',
        description: 'Shipment picked up by carrier',
        type: 'tracking'
      },
      {
        date: new Date('2025-09-20T08:15:00').toISOString(),
        status: 'In Transit',
        location: 'Hong Kong International Airport',
        description: 'Shipment departed origin facility',
        type: 'tracking'
      },
      {
        date: new Date('2025-09-21T16:45:00').toISOString(),
        status: 'In Transit',
        location: 'Los Angeles International Airport',
        description: 'Shipment arrived at destination country',
        type: 'tracking'
      },
      {
        date: new Date('2025-09-22T10:00:00').toISOString(),
        status: 'Customs',
        location: 'LAX Customs',
        description: 'Shipment undergoing customs clearance',
        type: 'tracking'
      },
      {
        date: new Date('2025-09-22T15:30:00').toISOString(),
        status: 'In Transit',
        location: 'Local Distribution Center',
        description: 'Shipment cleared customs and en route to final destination',
        type: 'tracking'
      }
    ];

    for (const event of events) {
      console.log(`Adding event: ${event.description}`);
      await DataService.addTrackingEvent(shipmentId, event);
    }

    console.log('Successfully added all tracking events!');

    // Verify by fetching the events
    const trackingEvents = await DataService.getTrackingEvents(shipmentId);
    console.log(`Retrieved ${trackingEvents.length} tracking events for shipment ${shipmentId}`);

  } catch (error) {
    console.error('Error adding tracking events:', error);
  }
}

// Run the function
addSampleTrackingEvents();