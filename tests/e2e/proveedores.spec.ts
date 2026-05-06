import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from './pages/PageObjects';

test.describe('Proveedores ABM', () => {
  test('Debería permitir crear un proveedor con descuentos', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // 1. Log in (Mocked via Credentials provider)
    await loginPage.loginAsTestUser();

    // 2. Navigate to Proveedores
    await dashboardPage.goToProveedores();

    // 3. Create new provider
    const provName = `Prov Test ${Date.now()}`;
    await dashboardPage.createProveedor(provName, 'Pago Contado', '15.5');
    
    // 4. Verify it was created properly with correct discount shown
    await expect(page.getByText('Pago Contado: 15.5%')).toBeVisible();
  });
});
