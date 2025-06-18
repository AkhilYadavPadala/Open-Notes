import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tnkuquaugcxcgenrrbmx.supabase.co";
const supabaseKey = "supabase secret key";
export const supabase = createClient(supabaseUrl, supabaseKey);
