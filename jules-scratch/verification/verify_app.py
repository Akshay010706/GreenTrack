import asyncio
from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(storage_state=None)
        page = context.new_page()

        # Capture console messages
        messages = []
        page.on("console", lambda msg: messages.append(msg.text))

        try:
            # 1. Navigate to landing page
            page.goto("http://localhost:8000/landing.html")
            expect(page).to_have_title("Welcome to GreenTrack")

            # 2. Go to main application
            page.get_by_role("link", name="Get Started").first.click()
            expect(page).to_have_url("http://localhost:8000/index.html")

            # 3. Login as citizen
            page.get_by_placeholder("e.g., citizen@demo").fill("citizen@demo")
            page.get_by_placeholder("e.g., 1234").fill("1234")
            page.get_by_role("button", name="Login").click()

            # 4. Verify navigation to training page
            expect(page).to_have_url("http://localhost:8000/index.html#/training")
            expect(page.get_by_role("heading", name="🌱 Green Training Program")).to_be_visible()

            # 5. Take screenshot
            page.screenshot(path="jules-scratch/verification/verification.png")

        finally:
            browser.close()

            # Print console messages
            for msg in messages:
                print(msg)

run()
