// Filters (all optional, only apply if provided):
// search: string — match in name (case-insensitive)
// category: string — exact match
// brand: string — exact match
// maxPrice: number — price <= maxPrice
// inStockOnly: boolean — only show inStock: true

// Example: { search: 'mouse', inStockOnly: true }
// Expected: [{ name: 'Wireless Mouse', price: 799 }, ...]

const searchProducts = (products, filters) => {

  const result = [];

  for (let i = 0; i < products.length; i++) {

    const product = products[i];

    if (
      filters.search &&
      !product.name.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      continue;
    }

    if (
      filters.category &&
      product.category !== filters.category
    ) {
      continue;
    }

    if (
      filters.brand &&
      product.brand !== filters.brand
    ) {
      continue;
    }

    if (
      filters.maxPrice &&
      product.price > filters.maxPrice
    ) {
      continue;
    }

    if (
      filters.inStockOnly &&
      !product.inStock
    ) {
      continue;
    }

    result.push(product);
  }

  return result;
};

const products = [
  { id: 'p1', name: 'Wireless Mouse', category: 'Electronics', brand: 'Logitech', price: 799, inStock: true },
  { id: 'p2', name: 'Gaming Keyboard', category: 'Electronics', brand: 'Razer', price: 5499, inStock: true },
  { id: 'p3', name: 'Running Shoes', category: 'Sports', brand: 'Nike', price: 2999, inStock: false },
  { id: 'p4', name: 'Office Mouse', category: 'Electronics', brand: 'Logitech', price: 399, inStock: true },
  { id: 'p5', name: 'Yoga Mat', category: 'Sports', brand: 'Nike', price: 999, inStock: true },
  { id: 'p6', name: 'USB-C Hub', category: 'Electronics', brand: 'Anker', price: 1299, inStock: true },
];

// Test cases:
console.log('--- Test 1: search mouse, inStock only ---');
console.log(JSON.stringify(searchProducts(products, { search: 'mouse', inStockOnly: true }), null, 2));

console.log('--- Test 2: Electronics, maxPrice 1500 ---');
console.log(JSON.stringify(searchProducts(products, { category: 'Electronics', maxPrice: 1500 }), null, 2));

console.log('--- Test 3: All filters ---');
console.log(JSON.stringify(searchProducts(products, { search: 'mouse', brand: 'Logitech', inStockOnly: true }), null, 2));
