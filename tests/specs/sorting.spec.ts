import { test, expect } from '../fixtures/test';

/**
 * Ordenamiento — descubrimiento de producto. Verifica que cada modo ordena de verdad.
 */
test.describe('Ordenamiento', () => {
  test.beforeEach(async ({ loginAsStandard }) => {
    await loginAsStandard.expectLoaded();
  });

  test('SORT-01 [P2] Nombre A→Z (orden por defecto)', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('az');
    const names = await inventoryPage.names();
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  test('SORT-02 [P2] Nombre Z→A', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('za');
    const names = await inventoryPage.names();
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });

  test('SORT-03 [P2] Precio de menor a mayor', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('lohi');
    const prices = await inventoryPage.prices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('SORT-04 [P2] Precio de mayor a menor', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('hilo');
    const prices = await inventoryPage.prices();
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test('SORT-05 [P3] la selección de orden se mantiene visible tras aplicarla', async ({
    inventoryPage,
  }) => {
    await inventoryPage.sortBy('hilo');
    await expect(inventoryPage.sortSelect).toHaveValue('hilo');
  });
});
