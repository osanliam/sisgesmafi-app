import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
      if (msg.type() === 'error') console.error('BROWSER ERROR:', msg.text());
      else console.log('BROWSER LOG:', msg.text());
  });
  page.on('pageerror', error => console.error('BROWSER CRASH:', error.message, error.stack));

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  
  // Try to find "Ingresar Demo" or "Docente"
  try {
      await page.click('text=Ingresar al Demo');
  } catch(e) {}
  
  await page.waitForTimeout(1000);
  
  try {
      await page.click('text=Profesor');
  } catch(e) {}
  
  await page.waitForTimeout(1000);
  
  // Let's inject a global script to trigger migration
  await page.evaluate(() => {
    // We can't access React context easily from outside, but we can click around.
    console.log("Ready to click...");
  });
  
  // Click first class
  try {
      await page.click('.grid > div'); 
  } catch(e) {
      console.log("Could not click class", e.message);
  }
  
  await page.waitForTimeout(1000);
  
  try {
      await page.click('text=Calificaciones Formativas');
  } catch(e) {
      console.log("Could not click Calificaciones Formativas", e.message);
  }
  
  await page.waitForTimeout(1000);
  
  try {
      await page.click('text=Migrar');
  } catch(e) {
      console.log("Could not click Migrar", e.message);
  }
  
  await page.waitForTimeout(1000);
  
  try {
      await page.selectOption('select', { index: 1 });
  } catch(e) {
      console.log("Could not select option", e.message);
  }
  
  await page.waitForTimeout(500);
  
  // mock window.confirm
  await page.evaluate(() => {
      window.confirm = () => true;
  });
  
  try {
      await page.click('text=Migrar a Matriz');
  } catch(e) {
      console.log("Could not click Migrar a Matriz", e.message);
  }
  
  await page.waitForTimeout(3000);
  
  await browser.close();
})();
