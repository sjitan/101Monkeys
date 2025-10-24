from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # The local frontend server must be running for this script to work.
    # Example: cd app && python3 -m http.server 8080
    page.goto("http://localhost:8080/pacer.html")

    # Example of a verification step:
    # Check that the main application container is attached to the DOM.
    page.wait_for_selector("#pacer-container", state="attached")

    # Take a screenshot to visually verify the UI.
    page.screenshot(path="frontend_verification/screenshot.png")

    print("Frontend verification script completed successfully.")
    print("Screenshot saved to frontend_verification/screenshot.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
