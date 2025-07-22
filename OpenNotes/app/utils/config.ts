// Configuration for API URLs
// In development, use your local IP
// In production, use your deployed backend URL

const isDevelopment = __DEV__;

// For testing: Set this to true to use local server even in production builds
const USE_LOCAL_SERVER_FOR_TESTING = false;

export const API_CONFIG = {
  // Development: Use your local IP address
  // Production: Use your deployed backend URL
  BACKEND_URL: (isDevelopment || USE_LOCAL_SERVER_FOR_TESTING)
    ? 'http://192.168.0.177:5000'  // Your local development server
    : 'https://balanced-charisma-production.up.railway.app', // Updated to Railway production URL
  
  // You can add more environment-specific configs here
  SUPABASE_URL: "https://tnkuquaugcxcgenrrbmx.supabase.co",
  SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRua3VxdWF1Z2N4Y2dlbnJyYm14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjgxMTE1MiwiZXhwIjoyMDU4Mzg3MTUyfQ.mrgLsWlda3P2jNrXJ3Nib_qYjb65FM5alqNaCr3YmX8"
};

// Helper function to get the backend URL
export const getBackendUrl = () => {
  const url = API_CONFIG.BACKEND_URL;
  console.log('🔗 Backend URL:', url);
  console.log('🔧 Development mode:', isDevelopment);
  console.log('🧪 Testing mode:', USE_LOCAL_SERVER_FOR_TESTING);
  return url;
}; 