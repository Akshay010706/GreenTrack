import asyncio
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # The file path needs to be absolute.
        # The current working directory is the root of the repo.
        page.goto("file:///app/GreenTrack/index_new.html")
        page.screenshot(path="jules-scratch/verification/verification.png")
        browser.close()

run()
