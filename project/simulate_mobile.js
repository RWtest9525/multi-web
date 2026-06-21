import { chromium } from 'playwright';

// A sample pool of real mobile device profiles for emulation
const mobileDevices = [
  {
    name: 'Pixel 5',
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
    viewport: { width: 393, height: 851 },
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true
  },
  {
    name: 'iPhone 12',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  }
];

async function runTestIteration(targetUrl, iteration) {
  // 1. Launch a completely isolated browser instance
  const browser = await chromium.launch({
    headless: true // Set to false to visually inspect the behavior
  });

  // Pick a random device profile from the pool
  const randomDevice = mobileDevices[Math.floor(Math.random() * mobileDevices.length)];

  // 2. Create a fresh, completely isolated browser context (wipes cookies/storage)
  const context = await browser.newContext({
    ...randomDevice,
    locale: 'en-US',
    timezoneId: 'America/New_York',
  });

  const page = await context.newPage();

  try {
    console.log(`[Iteration ${iteration}] Testing with profile: ${randomDevice.name}`);

    // 3. Navigate directly to the URL (avoiding iframe rendering issues)
    await page.goto(targetUrl, { waitUntil: 'networkidle' });

    // 4. Simulate basic human interaction (scrolling) to trigger lifecycle events
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight || totalHeight > 2000) {
            clearInterval(timer);
            resolve();
          }
        }, 200);
      });
    });

    console.log(`[Iteration ${iteration}] Navigation and interaction successful.`);
  } catch (error) {
    console.error(`[Iteration ${iteration}] Error during execution:`, error.message);
  } finally {
    // 5. Close context and browser to ensure memory and session cache are freed
    await context.close();
    await browser.close();
  }
}

// Example execution loop
async function startResearch() {
  // Read the target URL from the command line arguments or use a default
  const testUrl = process.argv[2] || 'https://example.com';
  const iterations = parseInt(process.argv[3], 10) || 3;

  console.log(`Starting simulation for target: ${testUrl} (${iterations} iterations)`);
  for (let i = 1; i <= iterations; i++) {
    await runTestIteration(testUrl, i);
  }
}

startResearch();
