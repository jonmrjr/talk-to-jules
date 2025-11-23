
from playwright.sync_api import Page, expect, sync_playwright
import time

def test_home_page_load(page: Page):
    # 1. Arrange: Go to the home page.
    # Assuming dev server runs on localhost:3000
    page.goto("http://localhost:3000")

    # 2. Assert: Confirm the page title or header.
    # We expect the header to say "Talk to Jules".
    expect(page.get_by_role("heading", name="Talk to Jules")).to_be_visible()

    # 3. Screenshot: Capture the home page.
    page.screenshot(path="verification/home_page.png")
    print("Screenshot saved to verification/home_page.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_home_page_load(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
