// Expected output:
// [
//   { sku: 'MOU-001', name: 'Wireless Mouse', quantity: 25, price: 799 },
//   { sku: 'KEY-002', name: 'Keyboard', quantity: 8, price: 2499 },
//   { sku: 'CBL-003', name: 'USB Cable', quantity: 20, price: 199 },
//   { sku: 'MON-004', name: 'Monitor', quantity: 3, price: 15999 },
// ]

// Rules:
// 1. Same sku in both warehouses → add quantities together
// 2. Items only in warehouse1 → keep as-is
// 3. Items only in warehouse2 → keep as-is (use name/price from warehouse2 or mark missing)
// 4. Order doesn't matter



const mergeInventories = (w1, w2) => {

  let warhouseObj = {};

  for (let i = 0; i < w1.length; i++) {
    warhouseObj[w1[i].sku] = w1[i]
  }

  for (let i = 0; i < w2.length; i++) {
    let key = w2[i].sku;
    if (key in warhouseObj) {
      const product = warhouseObj[key];
      const newQuntatity = w2[i].quantity;
      const newProduct = { ...product, quantity: product.quantity + newQuntatity };
      warhouseObj[key] = newProduct;
    } else {
      warhouseObj[w2[i].sku] = w2[i]
    }
  }

  return Object.values(warhouseObj);

}

const warehouse1 = [
  { sku: 'MOU-001', name: 'Wireless Mouse', quantity: 10, price: 799 },
  { sku: 'KEY-002', name: 'Keyboard', quantity: 5, price: 2499 },
  { sku: 'CBL-003', name: 'USB Cable', quantity: 20, price: 199 },
];

const warehouse2 = [
  { sku: 'MOU-001', quantity: 15 },  // same sku, add quantity
  { sku: 'MON-004', name: 'Monitor', quantity: 3, price: 15999 },
  { sku: 'KEY-002', quantity: 3 },   // same sku, add quantity
];


console.log(JSON.stringify(mergeInventories(warehouse1, warehouse2), null, 2));
