// import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tnkuquaugcxcgenrrbmx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRua3VxdWF1Z2N4Y2dlbnJyYm14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjgxMTE1MiwiZXhwIjoyMDU4Mzg3MTUyfQ.mrgLsWlda3P2jNrXJ3Nib_qYjb65FM5alqNaCr3YmX8";

// Adapter for Supabase v2+ storage option
const AsyncStorageAdapter = {
  getItem: AsyncStorage.getItem,
  setItem: AsyncStorage.setItem,
  removeItem: AsyncStorage.removeItem,
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
