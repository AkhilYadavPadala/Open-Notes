import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tnkuquaugcxcgenrrbmx.supabase.co";
const supabaseKey = "SUPABASE-KEY";

export const supabase = createClient(supabaseUrl, supabaseKey); 
