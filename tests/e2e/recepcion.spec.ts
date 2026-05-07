import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from './pages/PageObjects';

test.describe('Recepción de Mercadería', () => {
  test('registra un ingreso completo y aparece en el listado de facturas', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.loginAsTestUser();

    const provName = `ProvRecepcion ${Date.now()}`;
    await dashboardPage.goToProveedores();
    await dashboardPage.createProveedor(provName, 'Descuento Test', '5');

    const stockCode = `RCP-${Date.now()}`;
    await dashboardPage.goToStock();
    await dashboardPage.createStock(provName, stockCode, 'Repuesto Recepción Test', '500');

    const nroFactura = `REM-${Date.now()}`;
    await dashboardPage.goToRecepcion();
    await dashboardPage.registrarIngreso(provName, nroFactura, stockCode, '500');

    await expect(page.getByRole('cell', { name: nroFactura })).toBeVisible();
    await expect(page.getByRole('cell', { name: provName })).toBeVisible();
  });
});
