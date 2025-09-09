// Environment variable injection for static deployment
(function() {
    'use strict';
    
    console.log('Injecting environment variables...');
    
    // Create global ENV object for environment variables
    window.ENV = {
        VITE_SUPABASE_URL: 'https://ncbqpmlwqernubikpcry.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jYnFwbWx3cWVybnViaWtwY3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDEyMzQsImV4cCI6MjA3MjkxNzIzNH0.k6odDMLIrTzBhXNy7KOK2yjQKK7zJTwz-e0QIRlywW0',
        VITE_APP_NAME: 'GreenTrack',
        VITE_DEFAULT_LOCATION_LAT: '26.8467',
        VITE_DEFAULT_LOCATION_LNG: '80.9462'
    };
    
    console.log('Environment variables injected successfully');
})();
