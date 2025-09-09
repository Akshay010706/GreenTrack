// Get environment variables (fallback to hardcoded for development)
const SUPABASE_URL = window.ENV?.VITE_SUPABASE_URL || import.meta?.env?.VITE_SUPABASE_URL || 'https://ncbqpmlwqernubikpcry.supabase.co';
const SUPABASE_ANON_KEY = window.ENV?.VITE_SUPABASE_ANON_KEY || import.meta?.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jYnFwbWx3cWVybnViaWtwY3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDEyMzQsImV4cCI6MjA3MjkxNzIzNH0.k6odDMLIrTzBhXNy7KOK2yjQKK7zJTwz-e0QIRlywW0';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase configuration. Please check your environment variables.');
}

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };
