import { test, expect } from '@playwright/test'
import { LoginPage, DashboardPage } from './pages/PageObjects'

test.describe('Módulo de Ventas', () => {
  test('happy path: registrar venta con efectivo, omitir reposición, aparece en Libro Diario', async ({ page }) => {
    const loginPage = new LoginPage(page)
    const dash = new DashboardPage(page)

    await loginPage.loginAsTestUser()

    const prov = `ProvVenta ${Date.now()}`
    await dash.goToProveedores()
    await dash.createProveedor(prov, 'Contado', '0')

    // Use codigo as description so the venta description in Libro Diario contains it
    const codigo = `VTA-${Date.now()}`
    await dash.goToStock()
    await dash.createStock(prov, codigo, codigo, '1000')

    await dash.goToVentas()
    await dash.registrarVenta(codigo, 'Efectivo')

    await page.getByRole('button', { name: /omitir/i }).click()
    await expect(page.getByText(/no hay artículos/i)).toBeVisible()

    // Verify venta appears in Libro Diario
    await dash.goToLibroDiario()
    const ventaRow = page.locator('tr', { hasText: codigo }).first()
    await expect(ventaRow).toBeVisible({ timeout: 5000 })

    // Click venta row to open detail modal
    await ventaRow.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 })
    await expect(page.getByRole('dialog').getByText(codigo)).toBeVisible()
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
    await dash.createStock(prov, codigo, codigo, '1000')

    await dash.goToVentas()

    await page.fill('input[placeholder*="código"]', codigo)
    await page.waitForSelector(`button:has-text("${codigo}")`, { timeout: 5000 })
    await page.click(`button:has-text("${codigo}")`)

    await page.getByText('Crédito', { exact: true }).click()
    await expect(page.getByText(/recargo/i)).toBeVisible()
  })
})
