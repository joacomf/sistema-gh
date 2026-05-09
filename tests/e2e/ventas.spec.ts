import { test, expect } from '@playwright/test'
import { LoginPage, DashboardPage } from './pages/PageObjects'

test.describe('Módulo de Ventas', () => {
  test('happy path: registrar venta con efectivo, omitir reposición, aparece en Libro Diario', async ({ page }) => {
    const loginPage = new LoginPage(page)
    const dash = new DashboardPage(page)

    await loginPage.loginAsTestUser()

    // Create proveedor + stock
    const prov = `ProvVenta ${Date.now()}`
    await dash.goToProveedores()
    await dash.createProveedor(prov, 'Contado', '0')

    const codigo = `VTA-${Date.now()}`
    await dash.goToStock()
    await dash.createStock(prov, codigo, 'Artículo para venta test', '1000')

    // Register the sale
    await dash.goToVentas()
    await dash.registrarVenta(codigo, 'Efectivo')

    // Skip reposition
    await page.getByRole('button', { name: /omitir/i }).click()

    // Cart should be empty after modal closes
    await expect(page.getByText(/no hay artículos/i)).toBeVisible()

    // Verify in Libro Diario — the sale should appear
    await dash.goToLibroDiario()
    await expect(page.getByText(new RegExp(codigo.replace('-', '\\-'), 'i'))).toBeVisible({ timeout: 5000 })
  })

  test('seleccionar crédito muestra aviso de recargo', async ({ page }) => {
    const loginPage = new LoginPage(page)
    const dash = new DashboardPage(page)

    await loginPage.loginAsTestUser()

    const prov = `ProvCred ${Date.now()}`
    await dash.goToProveedores()
    await dash.createProveedor(prov, 'Contado', '0')

    const codigo = `CRD-${Date.now()}`
    await dash.goToStock()
    await dash.createStock(prov, codigo, 'Artículo crédito test', '1000')

    await dash.goToVentas()

    // Search and add item
    await page.fill('input[placeholder*="código"]', codigo)
    await page.waitForSelector(`button:has-text("${codigo}")`, { timeout: 5000 })
    await page.click(`button:has-text("${codigo}")`)

    // Select credit — should show surcharge notice
    await page.getByText('Crédito', { exact: true }).click()
    await expect(page.getByText(/recargo/i)).toBeVisible()
  })
})
