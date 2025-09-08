const SUPABASE_URL = 'https://ncbqpmlwqernubikpcry.supabase.co';
// The user needs to provide this key.
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };
