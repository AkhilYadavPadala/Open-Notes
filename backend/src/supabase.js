import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tnkuquaugcxcgenrrbmx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRua3VxdWF1Z2N4Y2dlbnJyYm14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjgxMTE1MiwiZXhwIjoyMDU4Mzg3MTUyfQ.mrgLsWlda3P2jNrXJ3Nib_qYjb65FM5alqNaCr3YmX8";
export const supabase = createClient(supabaseUrl, supabaseKey);