import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(public readonly page: Page) {}

  async navigate() {
    await this.page.goto('/login');
  }

  async loginAsTestUser() {
    await this.navigate();
    
    // Inyectamos un formulario oculto para simular el Provider "Credentials" de Auth.js
    await this.page.evaluate(() => {
      const form = document.createElement('form');
      form.method = 'post';
      form.action = '/api/auth/callback/credentials';
      
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'email';
      input.value = 'test@playwright.com';
      
      const csrf = document.createElement('input');
      csrf.type = 'hidden';
      csrf.name = 'csrfToken';
      // NextAuth requires csrfToken, we'll extract it from the page
      
      form.appendChild(input);
      form.appendChild(csrf);
      document.body.appendChild(form);
    });

    // Extract CSRF token and submit
    const csrfToken = await this.page.evaluate(() => {
      // Find csrf token from a form input if available, or fetch it
      return fetch('/api/auth/csrf').then(r => r.json()).then(d => d.csrfToken);
    });

    await this.page.evaluate((token) => {
      const form = document.querySelector('form[action="/api/auth/callback/credentials"]') as HTMLFormElement;
      (form.querySelector('input[name="csrfToken"]') as HTMLInputElement).value = token;
      form.submit();
    }, csrfToken);
    
    // Debería redirigir al dashboard
    await this.page.waitForURL('**/dashboard**');
  }
}

export class DashboardPage {
  constructor(public readonly page: Page) {}

  async goToProveedores() {
    await this.page.getByText('Gestión').click();
    await this.page.getByRole('link', { name: 'Proveedores' }).click();
    await expect(this.page.getByRole('heading', { name: 'Proveedores' })).toBeVisible();
  }

  async createProveedor(nombre: string, descripcionDescuento: string, porcentaje: string) {
    await this.page.getByRole('button', { name: 'Nuevo Proveedor' }).click();
    await this.page.getByLabel('Nombre').fill(nombre);
    
    await this.page.getByRole('button', { name: '+ Agregar Descuento' }).click();
    await this.page.getByPlaceholder('Descripción (ej. Pago Contado)').fill(descripcionDescuento);
    await this.page.getByPlaceholder('%').fill(porcentaje);
    
    await this.page.getByRole('button', { name: 'Guardar Proveedor' }).click();
    
    // Validar que se cerró el modal
    await expect(this.page.getByRole('dialog')).not.toBeVisible();
    
    // Validar que aparece en la lista
    await expect(this.page.getByRole('cell', { name: nombre })).toBeVisible();
  }

  async goToStock() {
    await this.page.getByText('Gestión').click();
    await this.page.getByRole('link', { name: 'Stock' }).click();
    await expect(this.page.getByRole('heading', { name: 'Inventario de Stock' })).toBeVisible();
  }

  async goToRecepcion() {
    await this.page.getByText('Gestión').click();
    await this.page.getByRole('link', { name: 'Recepción' }).click();
    await expect(this.page.getByRole('heading', { name: 'Recepción de mercadería' })).toBeVisible();
  }

  async registrarIngreso(provName: string, nroFactura: string, stockCodigo: string, importe: string) {
    await this.page.selectOption('select', { label: provName });
    await this.page.fill('input[placeholder*="0001"]', nroFactura);

    await this.page.fill('input[placeholder*="código"]', stockCodigo);
    await this.page.waitForSelector('button:has-text("' + stockCodigo + '")', { timeout: 3000 });
    await this.page.click('button:has-text("' + stockCodigo + '")');

    await expect(this.page.locator('td.font-mono', { hasText: stockCodigo })).toBeVisible();

    await this.page.fill('input[placeholder="0.00"]', importe);
    await this.page.getByRole('button', { name: 'Confirmar Ingreso' }).click();
    await this.page.waitForURL('**/dashboard/facturas');
  }

  async createStock(provName: string, codigo: string, desc: string, precioLista: string) {
    await this.page.getByRole('button', { name: 'Nueva Pieza' }).click();

    // Select provider
    await this.page.getByLabel('Proveedor').selectOption({ label: provName });

    await this.page.getByLabel('Código interno').fill(codigo);
    await this.page.getByLabel('Descripción').fill(desc);
    await this.page.getByLabel('Cantidad Actual').fill('10');
    await this.page.getByLabel('Precio Lista').fill(precioLista);
    await this.page.getByLabel('Precio Venta').fill('1500'); // Fijo para el test

    await this.page.getByRole('button', { name: 'Guardar Pieza' }).click();

    // Validar que se cerró el modal
    await expect(this.page.getByRole('dialog')).not.toBeVisible();

    // Validar que aparece en la lista
    await expect(this.page.getByRole('cell', { name: codigo })).toBeVisible();
  }

  async goToVentas() {
    await this.page.getByText('Ventas').click();
    await this.page.getByRole('link', { name: 'Punto de Venta' }).click();
    await expect(this.page.getByRole('heading', { name: 'Punto de Venta' })).toBeVisible();
  }

  async goToLibroDiario() {
    await this.page.getByText('Ventas').click();
    await this.page.getByRole('link', { name: 'Libro Diario' }).click();
    await expect(this.page.getByRole('heading', { name: 'Libro Diario' })).toBeVisible();
  }

  async registrarVenta(stockCodigo: string, metodoPago: 'Efectivo' | 'Débito' | 'Crédito' | 'Mercado Pago' = 'Efectivo') {
    await this.page.fill('input[placeholder*="código"]', stockCodigo);
    await this.page.waitForSelector(`button:has-text("${stockCodigo}")`, { timeout: 5000 });
    await this.page.click(`button:has-text("${stockCodigo}")`);
    await expect(this.page.locator('td', { hasText: stockCodigo })).toBeVisible();

    await this.page.getByText(metodoPago, { exact: true }).click();
    await this.page.getByRole('button', { name: /finalizar venta/i }).click();
    // Wait for reposition modal
    await expect(this.page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
  }
}
