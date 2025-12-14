from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000")

        # Check for Settings modal and close it if it exists
        if page.is_visible("text=Settings"):
            print("Settings modal detected. Closing it.")
            # Try to find a cancel button or close button
            # Based on memory, there might be a Cancel button.
            # I will look for button with text "Cancel"
            cancel_button = page.get_by_role("button", name="Cancel")
            if cancel_button.is_visible():
                cancel_button.click()
            else:
                 # If no cancel button, maybe just screenshot the modal
                 print("Cancel button not found on modal.")

        page.wait_for_timeout(1000) # Wait for animations
        page.screenshot(path="verification/initial_snapshot.png")
        print("Screenshot saved to verification/initial_snapshot.png")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
