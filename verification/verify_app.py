
from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the app
            page.goto("http://localhost:3000")

            # Check if the header is visible
            header = page.locator("h1", has_text="Talk to Jules")
            if header.is_visible():
                print("Header is visible")

            # Check if the recording button is visible
            record_button = page.locator("button", has_text="🎤 Start Recording")
            if record_button.is_visible():
                print("Start Recording button is visible")

            # Take a screenshot of the initial state
            page.screenshot(path="verification/initial_state.png")

            print("Screenshot taken at verification/initial_state.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
