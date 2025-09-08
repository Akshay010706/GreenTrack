# GreenTrack - Digital Waste Management Platform

GreenTrack is a digital platform designed to empower citizens and streamline waste management. Our mission is to create a cleaner, healthier, and more sustainable environment for everyone.

## Features

*   **Waste Reporting:** Easily report waste-related issues in your area.
*   **Educational Resources:** Learn about waste segregation, composting, and other sustainable practices.
*   **Leaderboard:** Earn points and badges for your contributions.
*   **Map View:** See waste reports and facilities on a map.
*   **Admin Dashboard:** Manage reports, users, and facilities.

## Getting Started

To run the application locally, you will need to have a local web server. You can use Python's built-in HTTP server.

1.  Clone the repository.
2.  Navigate to the `GreenTrack` directory.
3.  Run the following command to start the web server:
    ```bash
    python3 -m http.server 8000
    ```
4.  Open your browser and navigate to `http://localhost:8000/landing.html`.

## Supabase Setup

This project uses Supabase for its backend. To set up the backend, you will need to do the following:

1.  **Create a new Supabase project.**
2.  **Create the database tables.** You can use the SQL migration files in the `supabase/migrations` directory to create the tables.
3.  **Create a storage bucket.** Create a public storage bucket named `reports`.
4.  **Set up environment variables.** You will need to set the following environment variables in your Netlify project:
    *   `SUPABASE_URL`: The URL of your Supabase project.
    *   `SUPABASE_ANON_KEY`: The anon key for your Supabase project.
    *   `SUPABASE_SERVICE_ROLE_KEY`: The service role key for your Supabase project.

You will also need to update the `SUPABASE_ANON_KEY` placeholder in `GreenTrack/js/supabase-client.js` with your anon key.
