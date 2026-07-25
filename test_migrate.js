import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER CRASH:', error.message));

  await page.goto('http://localhost:3000');
  
  // Wait for the app to load
  await page.waitForTimeout(2000);
  
  // Navigate to Formative grading (assuming ClassroomManager -> FormativeGradingPortal)
  // Let's click "Cursos y Secciones"
  await page.click('text=Cursos y Secciones');
  await page.waitForTimeout(1000);
  
  // Click the first class
  await page.click('text=Matemática'); // or whatever
  await page.waitForTimeout(1000);
  
  // Click "Calificaciones Formativas"
  await page.click('text=Calificaciones Formativas');
  await page.waitForTimeout(1000);
  
  // Click the migration wand (Migrar)
  await page.click('text=Migrar');
  await page.waitForTimeout(1000);
  
  // Select a desempeno
  await page.selectOption('select', { index: 1 });
  await page.waitForTimeout(500);
  
  // Click Migrar a Matriz
  await page.click('text=Migrar a Matriz');
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
