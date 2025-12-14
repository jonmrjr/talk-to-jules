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
            cancel_button = page.get_by_role("button", name="Cancel")
            if cancel_button.is_visible():
                cancel_button.click()

        page.wait_for_timeout(1000) # Wait for animations
        page.screenshot(path="verification/redesign_snapshot.png")
        print("Screenshot saved to verification/redesign_snapshot.png")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
