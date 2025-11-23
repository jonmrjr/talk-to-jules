from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_settings(page: Page):
    # 1. Arrange: Go to the homepage.
    page.goto("http://localhost:3000")

    # Wait for the page to load
    page.wait_for_selector("h1", state="visible")

    # Check if settings modal is already open (it should be if no keys are set)
    # The modal has text "Settings" in h2
    try:
        expect(page.locator("h2").filter(has_text="Settings")).to_be_visible(timeout=2000)
        print("Settings modal is already open.")
    except:
        print("Settings modal not open, clicking button.")
        # 2. Act: Click the Settings button if modal is not open
        settings_button = page.get_by_label("Settings")
        settings_button.click()

    # 3. Assert: Verify the modal is open and "Default Repo" input is visible
    # We wait for the text "Default Repo (Source)" to be visible
    expect(page.get_by_text("Default Repo (Source)")).to_be_visible()

    # Also check if the input field is there
    expect(page.get_by_placeholder("e.g. sources/github/user/repo")).to_be_visible()

    # 4. Screenshot
    page.screenshot(path="verification/settings_verification.png")
    print("Screenshot saved.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_settings(page)
        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()
