const SUPABASE_URL = 'https://ncbqpmlwqernubikpcry.supabase.co';
// The user needs to provide this key.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jYnFwbWx3cWVybnViaWtwY3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDEyMzQsImV4cCI6MjA3MjkxNzIzNH0.k6odDMLIrTzBhXNy7KOK2yjQKK7zJTwz-e0QIRlywW0';

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };
