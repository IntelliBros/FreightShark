# FreightShark Database Migration Guide

## Overview
This guide explains how to migrate FreightShark from localStorage to Supabase cloud database.

## Current Status
The application has been prepared for database migration with:
- ✅ Supabase database schema created
- ✅ SupabaseDataService implemented
- ✅ DataContextV2 created with feature flag
- ✅ Migration tools and scripts ready
- ✅ Fallback mechanisms in place

## Migration Steps

### Step 1: Run Database Migration
1. Open your browser and navigate to: `http://localhost:5555/runCompleteMigration.html`
2. Click "Test Supabase Connection" to verify connectivity
3. Click "Run Migration SQL" to set up tables
4. Click "Migrate Local Data to Database" to transfer existing data
5. Click "Verify All Data" to confirm migration success

### Step 2: Enable Supabase in the Application

#### Option A: Quick Switch (Recommended for Testing)
1. Edit `src/config/database.ts`
2. Set `USE_SUPABASE: true` to enable database mode
3. Restart the development server

#### Option B: Full Migration (Recommended for Production)
1. Replace DataContext import in `src/App.tsx`:
```typescript
// Old:
import { DataProvider } from './context/DataContext';

// New:
import { DataProvider } from './context/DataContextV2';
```

2. Update all service imports to use SupabaseDataService:
```typescript
// Old:
import { DataService } from '../services/DataService';

// New:
import { supabaseDataService } from '../services/SupabaseDataService';
```

### Step 3: Update Components

Components that directly use DataService need to be updated:

1. **Quote Creation** (`src/pages/quotes/NewQuote.tsx`):
   - Replace `DataService.createQuoteRequest()` with `supabaseDataService.createQuoteRequest()`

2. **Staff Quote Management** (`src/pages/staff/quotes/*.tsx`):
   - Replace all DataService calls with supabaseDataService equivalents

3. **Shipment Updates** (`src/pages/staff/shipments/*.tsx`):
   - Update to use supabaseDataService methods

4. **Invoice Management** (new feature with Supabase):
   - Use `supabaseDataService.createInvoice()` and related methods

### Step 4: Authentication Migration (Optional - Phase 2)

Currently, authentication still uses localStorage. To migrate to Supabase Auth:

1. Enable Supabase Auth in `src/config/database.ts`:
```typescript
FEATURES: {
  SUPABASE_AUTH: true
}
```

2. Update AuthService to use Supabase Auth (future implementation)

## Data Storage Comparison

### localStorage (Old)
- **Location**: Browser storage
- **Persistence**: Per browser/device
- **Capacity**: ~5-10MB limit
- **Sync**: No synchronization
- **Offline**: Works offline
- **Performance**: Fast, no network latency

### Supabase (New)
- **Location**: Cloud database (PostgreSQL)
- **Persistence**: Permanent, cloud-backed
- **Capacity**: Unlimited (within plan limits)
- **Sync**: Real-time across all devices
- **Offline**: Requires internet (with cache fallback)
- **Performance**: Network dependent, but cached

## Feature Compatibility

| Feature | localStorage | Supabase | Notes |
|---------|-------------|----------|-------|
| Quote Requests | ✅ | ✅ | Fully migrated |
| Quotes | ✅ | ✅ | Fully migrated |
| Shipments | ✅ | ✅ | Fully migrated |
| Invoices | ❌ | ✅ | New feature |
| Tracking | ✅ | ✅ | Fully migrated |
| Documents | ✅ | ✅ | Metadata only |
| Notifications | ✅ | ✅ | Already using Supabase |
| Samples | ✅ | ✅ | Already using Supabase |
| Messages | ✅ | ✅ | Already using Supabase |
| Authentication | ✅ | 🔄 | Phase 2 migration |
| File Storage | ❌ | 🔄 | Future enhancement |

## Rollback Plan

If issues occur, you can instantly rollback to localStorage:

1. Edit `src/config/database.ts`
2. Set `USE_SUPABASE: false`
3. Restart the application

The app will immediately revert to using localStorage with all previous data intact.

## Performance Optimization

The new SupabaseDataService includes:
- **5-second cache** for frequently accessed data
- **localStorage fallback** for offline support
- **Parallel data fetching** for faster loads
- **Automatic retry** on network failures

## Testing Checklist

After migration, test these critical flows:

- [ ] User login/logout
- [ ] Create new quote request
- [ ] Staff creates quote from request
- [ ] Accept quote and create shipment
- [ ] Update shipment status
- [ ] Add tracking information
- [ ] Generate invoice
- [ ] Send notifications
- [ ] Upload documents
- [ ] Sample management

## Troubleshooting

### Connection Issues
- Verify Supabase URL and anon key in `src/lib/supabase.ts`
- Check network connectivity
- Ensure RLS is disabled (development only)

### Data Not Syncing
- Clear browser cache
- Check browser console for errors
- Verify Supabase dashboard for data

### Performance Issues
- Check cache configuration in `src/config/database.ts`
- Monitor network tab for excessive requests
- Consider increasing cache duration

## Support

For issues or questions:
1. Check browser console for detailed error messages
2. Verify data in Supabase dashboard: https://supabase.com/dashboard
3. Review migration logs at `/runCompleteMigration.html`

## Next Steps

After successful migration:
1. Enable real-time subscriptions for live updates
2. Implement Supabase Auth for better security
3. Use Supabase Storage for file uploads
4. Set up proper RLS policies for production