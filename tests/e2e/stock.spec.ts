import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from './pages/PageObjects';

test.describe('Stock ABM', () => {
  test('Debería crear una pieza de stock asignada a un proveedor', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.loginAsTestUser();

    // 1. Crear proveedor
    const provName = `ProvParaStock ${Date.now()}`;
    await dashboardPage.goToProveedores();
    await dashboardPage.createProveedor(provName, 'Descuento Test', '10');

    // 2. Crear stock
    const stockCode = `STK-${Date.now()}`;
    await dashboardPage.goToStock();
    await dashboardPage.createStock(provName, stockCode, 'Filtro de Aceite Test', '1000');
    
    // 3. Verificar el costo automático (Precio Lista = 1000, desc = 10% -> Costo = 900)
    // Para ver si calculó bien podemos ver si en el modal de edición aparece bien, pero
    // por ahora validamos que el stock exista en la tabla con la información correcta.
    await expect(page.getByRole('cell', { name: stockCode })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Filtro de Aceite Test' })).toBeVisible();
    await expect(page.getByRole('cell', { name: provName })).toBeVisible();
  });
});
