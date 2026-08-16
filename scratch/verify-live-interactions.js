/**
 * scratch/verify-live-interactions.js
 * Headless browser automation script using puppeteer-core to verify
 * all 12 Tyre Intelligence interaction click-handlers, modal content,
 * title consistency, and screenshot output.
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\josep\\.gemini\\antigravity-ide\\brain\\973fba9f-8a9a-4753-bcee-d497d9460ed0';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBrowserVerification() {
  console.log('============================================================');
  console.log('FI360 TYRE INTELLIGENCE — LIVE BROWSER VERIFICATION SUITE');
  console.log('============================================================\n');

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    defaultViewport: { width: 1280, height: 900 }
  });

  const page = await browser.newPage();
  
  // Listen to console log messages for debugging
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.toString()));

  const results = [];
  
  try {
    // 1. Navigate to dev server
    console.log('[Step 1] Navigating to http://localhost:5173 ...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await sleep(2000);

    // 2. Perform Login (conditional on login form presence)
    console.log('[Step 2] Checking login state...');
    const loginFormVisible = await page.evaluate(() => {
      return document.getElementById('login-form') !== null;
    });

    if (loginFormVisible) {
      console.log('Logging in as fleet.manager@fi360.com ...');
      await page.$eval('#email', el => el.value = '');
      await page.type('#email', 'fleet.manager@fi360.com');
      await page.$eval('#password', el => el.value = '');
      await page.type('#password', 'Pinkypinky@40');
      await page.click('button[type="submit"]');
      await sleep(3000);
    } else {
      console.log('Already logged in or login form not visible.');
    }

    await page.waitForSelector('#nav-links li', { timeout: 10000 });

    // 3. Navigate to Tyre Intelligence
    console.log('[Step 3] Navigating to Tyre Intelligence dashboard...');
    // Click Tyre Intelligence button (with 🛞 icon) in sidebar
    await page.evaluate(() => {
      const navLinks = Array.from(document.querySelectorAll('#nav-links a'));
      const tyreLink = navLinks.find(a => a.textContent.includes('Tyre Intelligence'));
      if (tyreLink) {
        tyreLink.click();
      } else {
        throw new Error('Tyre Intelligence link not found in sidebar');
      }
    });
    await sleep(2000);

    // 4. Capture Initial Dashboard Screenshot
    console.log('[Step 4] Capturing Tyre Intelligence dashboard...');
    const dashPath = path.join(ARTIFACT_DIR, 'tyre_dashboard.png');
    await page.screenshot({ path: dashPath });
    console.log(`Saved screenshot: ${dashPath}`);

    // Helper functions for modal inspection
    async function verifyModal(elementName, expectedTitle, expectedTextSnippet) {
      await sleep(1000);
      const modalVisible = await page.evaluate(() => {
        const modal = document.getElementById('kpi-drill-modal');
        return modal && !modal.classList.contains('hidden');
      });

      if (!modalVisible) {
        throw new Error(`Modal is not visible after clicking ${elementName}`);
      }

      const modalData = await page.evaluate(() => {
        const titleEl = document.getElementById('kpi-drill-title');
        const bodyEl = document.getElementById('kpi-drill-body');
        return {
          title: titleEl ? titleEl.textContent : '',
          body: bodyEl ? bodyEl.textContent : '',
          html: bodyEl ? bodyEl.innerHTML : ''
        };
      });

      console.log(`  Modal Title: "${modalData.title}"`);
      
      const titleMatches = modalData.title.toLowerCase().includes(expectedTitle.toLowerCase());
      const contentMatches = modalData.body.toLowerCase().includes(expectedTextSnippet.toLowerCase());
      const rotationBugPresent = modalData.title.includes('TYRE_ROTATION_COMPLIANCE — Analytical Operational Drill-Down');

      const isOk = titleMatches && contentMatches && !rotationBugPresent;
      
      results.push({
        element: elementName,
        title: modalData.title,
        correct: isOk ? 'PASS' : 'FAIL',
        details: `Expected Title: "${expectedTitle}", Snippet: "${expectedTextSnippet}". Bug Present: ${rotationBugPresent}`
      });

      if (!isOk) {
        console.error(`❌ Verification failed for ${elementName}! Title match: ${titleMatches}, Content match: ${contentMatches}, Rotation Bug: ${rotationBugPresent}`);
      } else {
        console.log(`✅ Verified: ${elementName} modal conforms to spec.`);
      }

      // Capture Modal Screenshot
      const screenshotName = `drill_${elementName.toLowerCase().replace(/[\s/]/g, '_')}.png`;
      const screenshotPath = path.join(ARTIFACT_DIR, screenshotName);
      await page.screenshot({ path: screenshotPath });
      console.log(`  Saved screenshot: ${screenshotPath}`);

      // Close the modal
      await page.click('#close-kpi-drill-modal');
      await sleep(1000);

      // Verify modal is closed
      const isClosed = await page.evaluate(() => {
        const modal = document.getElementById('kpi-drill-modal');
        return modal && modal.classList.contains('hidden');
      });
      if (!isClosed) {
        throw new Error(`Modal did not close cleanly for ${elementName}`);
      }
    }

    // --- 5.1 TOTAL TYRES ---
    console.log('\nTesting: TOTAL TYRES');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.kpi-grid .kpi-card'));
      const totalTyresCard = cards.find(c => c.textContent.includes('TOTAL TYRES'));
      totalTyresCard.click();
    });
    await verifyModal('Total Tyres', 'Tyre Inventory Detail', 'In Stock');

    // --- 5.2 INSPECTION COMPLIANCE ---
    console.log('\nTesting: INSPECTION COMPLIANCE');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.kpi-grid .kpi-card'));
      const complianceCard = cards.find(c => c.textContent.includes('INSPECTION COMPLIANCE'));
      complianceCard.click();
    });
    await verifyModal('Inspection Compliance', 'Inspection Compliance & Schedule Audit', 'Recent Tyre Inspection');

    // --- 5.3 ATTENTION REQUIRED ---
    console.log('\nTesting: ATTENTION REQUIRED');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.kpi-grid .kpi-card'));
      const attentionCard = cards.find(c => c.textContent.includes('ATTENTION REQUIRED') && !c.textContent.includes('QUEUE'));
      attentionCard.click();
    });
    await verifyModal('Attention Required', 'Open Defects', 'defect(s) requiring action');

    // --- 5.4 AVERAGE TREAD ---
    console.log('\nTesting: AVERAGE TREAD');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.kpi-grid .kpi-card'));
      const treadCard = cards.find(c => c.textContent.includes('AVERAGE TREAD'));
      treadCard.click();
    });
    await verifyModal('Average Tread', 'Tyre Tread Depth & Condition Analysis', 'Average Fleet Tread');

    // --- 5.5 TYRE COST / KM ---
    console.log('\nTesting: TYRE COST / KM');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.kpi-grid .kpi-card'));
      const costCard = cards.find(c => c.textContent.includes('TYRE COST / KM'));
      costCard.click();
    });
    await verifyModal('Tyre Cost/km', 'Tyre Cost Efficiency', 'KES 0.50');

    // --- 6.1 Critical ---
    console.log('\nTesting: Queue - Critical');
    await page.evaluate(() => {
      const queueCards = Array.from(document.querySelectorAll('.card-header + .kpi-grid .kpi-card'));
      const criticalCard = queueCards.find(c => c.textContent.includes('CRITICAL DEFECTS'));
      criticalCard.click();
    });
    await verifyModal('Critical', 'Critical Tyre Safety Defects & Alerts Queue', 'Affected Vehicles');

    // --- 6.2 Replacement Due ---
    console.log('\nTesting: Queue - Replacement Due');
    await page.evaluate(() => {
      const queueCards = Array.from(document.querySelectorAll('.card-header + .kpi-grid .kpi-card'));
      const replCard = queueCards.find(c => c.textContent.includes('REPLACEMENT DUE'));
      replCard.click();
    });
    await verifyModal('Replacement Due', 'Tyres Due for Replacement', '0 tyres due');

    // --- 6.3 Inspection Due ---
    console.log('\nTesting: Queue - Inspection Due');
    await page.evaluate(() => {
      const queueCards = Array.from(document.querySelectorAll('.card-header + .kpi-grid .kpi-card'));
      const inspCard = queueCards.find(c => c.textContent.includes('INSPECTION DUE'));
      inspCard.click();
    });
    await verifyModal('Inspection Due', 'Tyres & Vehicles Due for Scheduled Inspection', '14 Days');

    // --- 6.4 Open Defects ---
    console.log('\nTesting: Queue - Open Defects');
    await page.evaluate(() => {
      const queueCards = Array.from(document.querySelectorAll('.card-header + .kpi-grid .kpi-card'));
      const defectsCard = queueCards.find(c => c.textContent.includes('OPEN DEFECTS'));
      defectsCard.click();
    });
    await verifyModal('Open Defects', 'Open Defects', 'defect(s) requiring action');

    // --- 7. Investigate button ---
    console.log('\nTesting: Investigate Button');
    await page.evaluate(() => {
      const btn = document.querySelector('#fm-tyre-risk-vehicles-table tbody tr button');
      btn.click();
    });
    await verifyModal('Investigate', 'Safety Defect Investigation', 'Grounded');

    // --- 8. AI recommendation ---
    console.log('\nTesting: AI Recommendation (Axle Rotation)');
    await page.evaluate(() => {
      const rec = Array.from(document.querySelectorAll('.card .clickable')).find(el => el.textContent.includes('Axle Rotation'));
      rec.click();
    });
    await verifyModal('AI Recommendation', 'Axle Rotation Optimization', '+14% Estimated Lifespan');

    // --- 9. Tyre Row ---
    console.log('\nTesting: Tyre Row Click');
    await page.evaluate(() => {
      const link = document.querySelector('#fm-tyres-table tbody tr strong.clickable');
      link.click();
    });
    await verifyModal('Tyre Row', 'Tyre Asset Profile', 'FI360 Identifier');

    // --- 13. Test Refresh Behavior ---
    console.log('\n[Step 5] Testing page refresh behavior...');
    await page.reload({ waitUntil: 'networkidle2' });
    await sleep(2000);
    await page.waitForSelector('#nav-links li', { timeout: 10000 });

    // Verify Tyre Intelligence is still rendered and correct
    const viewTitle = await page.evaluate(() => document.getElementById('page-title').textContent);
    console.log(`Current page title post-refresh: "${viewTitle}"`);
    
    // Switch to Tyre Intelligence again to be sure
    await page.evaluate(() => {
      const navLinks = Array.from(document.querySelectorAll('#nav-links a'));
      const tyreLink = navLinks.find(a => a.textContent.includes('Tyre Intelligence'));
      if (tyreLink) tyreLink.click();
    });
    await sleep(1000);

    // Re-verify Total Tyres click
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.kpi-grid .kpi-card'));
      const totalTyresCard = cards.find(c => c.textContent.includes('TOTAL TYRES'));
      totalTyresCard.click();
    });
    await sleep(500);
    const postRefreshModalOk = await page.evaluate(() => {
      const modal = document.getElementById('kpi-drill-modal');
      const title = document.getElementById('kpi-drill-title')?.textContent;
      return modal && !modal.classList.contains('hidden') && title.includes('Tyre Inventory Detail');
    });
    console.log(`Post-Refresh Total Tyres modal visible: ${postRefreshModalOk}`);
    await page.click('#close-kpi-drill-modal');
    await sleep(500);

    // --- 14. Test Back Navigation ---
    console.log('\n[Step 6] Testing browser history back navigation...');
    // We navigate to Fleet Operations
    await page.evaluate(() => {
      const navLinks = Array.from(document.querySelectorAll('#nav-links a'));
      const fleetLink = navLinks.find(a => a.textContent.includes('Fleet Operations'));
      if (fleetLink) fleetLink.click();
    });
    await sleep(1000);
    
    // Navigate Back
    await page.goBack();
    await sleep(2000);
    const postBackTitle = await page.evaluate(() => {
      const el = document.getElementById('page-title');
      return el ? el.textContent : 'Null (Session Reset/Login Page)';
    });
    console.log(`Post Back-navigation title: "${postBackTitle}"`);

    // --- 15. Mobile Responsive Audit ---
    console.log('\n[Step 7] Testing Mobile/Responsive layout...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await sleep(2000);

    const loginFormVisibleMobile = await page.evaluate(() => {
      return document.getElementById('login-form') !== null;
    });

    if (loginFormVisibleMobile) {
      console.log('Logging in for mobile layout check...');
      await page.$eval('#email', el => el.value = '');
      await page.type('#email', 'fleet.manager@fi360.com');
      await page.$eval('#password', el => el.value = '');
      await page.type('#password', 'Pinkypinky@40');
      await page.evaluate(() => document.getElementById('login-btn').click());
      await sleep(3000);
    }

    await page.waitForSelector('#nav-links li', { timeout: 10000 });

    await page.evaluate(() => {
      const navLinks = Array.from(document.querySelectorAll('#nav-links a'));
      const tyreLink = navLinks.find(a => a.textContent.includes('Tyre Intelligence'));
      if (tyreLink) tyreLink.click();
    });
    await sleep(2000);

    await page.setViewport({ width: 375, height: 812, isMobile: true });
    await sleep(1000);
    const mobileDashPath = path.join(ARTIFACT_DIR, 'mobile_dashboard.png');
    await page.screenshot({ path: mobileDashPath });
    console.log(`Saved mobile view screenshot: ${mobileDashPath}`);

    // Click Average Tread on Mobile
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.kpi-grid .kpi-card'));
      const treadCard = cards.find(c => c.textContent.includes('AVERAGE TREAD'));
      treadCard.click();
    });
    await sleep(500);
    const mobileModalOk = await page.evaluate(() => {
      const modal = document.getElementById('kpi-drill-modal');
      const title = document.getElementById('kpi-drill-title')?.textContent;
      return modal && !modal.classList.contains('hidden') && title.includes('Tyre Tread Depth');
    });
    console.log(`Mobile View Average Tread Modal visible: ${mobileModalOk}`);
    await page.click('#close-kpi-drill-modal');
    await sleep(500);

  } catch (err) {
    console.error('❌ Exception during live browser verification:', err);
  } finally {
    await browser.close();
  }

  // Generate matrix markdown table
  console.log('\n============================================================');
  console.log('INTERACTION CONSISTENCY MATRIX');
  console.log('============================================================');
  console.log('| Clicked | What appeared | Correct? |');
  console.log('| ------- | ------------- | -------- |');
  results.forEach(r => {
    console.log(`| ${r.element} | ${r.title} | ${r.correct} |`);
  });
  console.log('============================================================');
}

runBrowserVerification().catch(console.error);
