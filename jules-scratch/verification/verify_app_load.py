from playwright.sync_api import Page, expect
import os

def test_app_html_loads(page: Page):
    # Construct the file path
    file_path = "file://" + os.path.abspath("app/app.html")
    print(f"Navigating to: {file_path}")

    # Go to the app.html page
    page.goto(file_path)
    print("Page loaded.")

    # Expect the page to have the correct title
    expect(page).to_have_title("101Monkeys - Pacer Protocol")
    print("Title verified.")

    # Take a screenshot
    screenshot_path = "jules-scratch/verification/verification.png"
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to: {screenshot_path}")
