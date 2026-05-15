import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from './pages/PageObjects';

test.describe('Cajas', () => {
  test('Debería crear una caja, asignarle un artículo y luego quitarlo', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.loginAsTestUser();

    // 1. Crear proveedor y artículo de stock para la prueba
    const provName = `Prov-Cajas-${Date.now()}`;
    await dashboardPage.goToProveedores();
    await dashboardPage.createProveedor(provName, 'Descuento', '0');

    const stockCode = `BOX-${Date.now()}`;
    await dashboardPage.goToStock();
    await dashboardPage.createStock(provName, stockCode, 'Artículo para Caja Test', '500');

    // 2. Crear caja
    const cajaNombre = `Caja-Test-${Date.now()}`;
    await dashboardPage.goToCajas();
    await dashboardPage.createCaja(cajaNombre, 'Depósito Test');

    // 3. Seleccionar caja y asignar artículo
    await page.getByText(cajaNombre).click();
    await expect(page.getByRole('heading', { name: cajaNombre })).toBeVisible();
    await page.getByRole('button', { name: /asignar/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByPlaceholder('Buscar por código o descripción...').fill(stockCode);
    await page.waitForTimeout(600); // esperar debounce
    await expect(page.getByText(stockCode)).toBeVisible();
    await page.getByRole('button', { name: /^asignar$/i }).click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 4. Verificar que el artículo aparece en la tabla
    await expect(page.getByRole('cell', { name: stockCode })).toBeVisible();

    // 5. Quitar artículo de la caja
    await page.getByRole('button', { name: /quitar artículo para caja test/i }).click();
    await page.getByRole('button', { name: /^quitar$/i }).click();
    await expect(page.getByRole('cell', { name: stockCode })).not.toBeVisible();
  });
});
