import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from './pages/PageObjects';

test.describe('Consulta de Artículo', () => {
  test('Debería buscar un artículo y mostrar su detalle completo', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.loginAsTestUser();

    // 1. Crear proveedor y artículo con imagen para la prueba
    const provName = `Prov-Consulta-${Date.now()}`;
    await dashboardPage.goToProveedores();
    await dashboardPage.createProveedor(provName, 'Dto', '0');

    const stockCode = `CONS-${Date.now()}`;
    await dashboardPage.goToStock();
    await dashboardPage.createStock(provName, stockCode, 'Pieza de Consulta Test', '300');

    // 2. Ir a Consulta de Artículo y buscar
    await dashboardPage.goToConsultaArticulo();
    await page.getByPlaceholder('Buscar por código o descripción...').fill(stockCode);
    await page.waitForTimeout(600); // esperar debounce

    // 3. Verificar que aparece el detalle del artículo
    await expect(page.getByText('Pieza de Consulta Test')).toBeVisible();
    await expect(page.getByText(new RegExp(stockCode))).toBeVisible();
    await expect(page.getByText(new RegExp(provName))).toBeVisible();

    // 4. Verificar secciones de stock y precios
    await expect(page.getByText('Stock actual')).toBeVisible();
    await expect(page.getByText('Costo')).toBeVisible();
    await expect(page.getByText('Venta')).toBeVisible();

    // 5. Verificar sección cajas (sin cajas asignadas)
    await expect(page.getByText(/sin cajas asignadas/i)).toBeVisible();
  });
});
