/**
 * Database Configuration
 * Controls whether the app uses Supabase (cloud database) or localStorage (offline)
 */

export const DATABASE_CONFIG = {
  /**
   * Set to true to use Supabase cloud database
   * Set to false to use localStorage (offline mode)
   *
   * When USE_SUPABASE is true:
   * - All data is stored in Supabase cloud database
   * - Data is synchronized across all sessions and devices
   * - Real-time updates are possible
   * - Requires internet connection
   *
   * When USE_SUPABASE is false:
   * - All data is stored in browser localStorage
   * - Data is local to this browser only
   * - Works offline
   * - No synchronization between devices
   */
  USE_SUPABASE: true,

  /**
   * Cache configuration
   */
  CACHE: {
    // How long to cache data in milliseconds (5 seconds)
    DURATION: 5000,

    // Whether to use localStorage as a fallback cache
    USE_LOCAL_CACHE: true,

    // Whether to automatically fall back to localStorage if Supabase fails
    AUTO_FALLBACK: true
  },

  /**
   * Feature flags for gradual migration
   */
  FEATURES: {
    // Use Supabase for authentication
    SUPABASE_AUTH: false, // Keep false for now, we'll migrate auth separately

    // Use Supabase for real-time subscriptions
    REALTIME_UPDATES: false,

    // Use Supabase storage for file uploads
    SUPABASE_STORAGE: false
  }
};

// Helper function to check if we should use Supabase
export const useSupabase = () => DATABASE_CONFIG.USE_SUPABASE;

// Helper function to get data source name
export const getDataSource = () => DATABASE_CONFIG.USE_SUPABASE ? 'Supabase' : 'localStorage';