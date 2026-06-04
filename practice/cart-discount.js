
// Discount rules:
// - If totalAmount > 5000 → 10% off
// - If totalAmount > 10000 → 20% off
// - Items with price < 500 are not eligible for discount

// Expected output:
// {
//   originalTotal: 9087,    // (2*799) + 2499 + 3999 + (3*199)
//   discountPercent: 10,
//   discountAmount: 849,    // 10% of (9087 - non-eligible items)
//   finalTotal: 8238,
//   nonEligibleItems: ['USB Cable']
// }

// Rules:
// 1. Calculate originalTotal = sum of (price * quantity)
// 2. Apply discount only on eligible items (price >= 500)
// 3. Return all fields as shown above


const applyDiscount = (cartItems) => {

  let originalTotal = 0;
  let eligibleTotal = 0;
  let discountAmount = 0;
  let discountPercent = 0;
  const nonEligibleItems = [];

  cartItems.forEach((each) => {

    originalTotal += each.price * each.quantity

    if (each.price < 500) {
      nonEligibleItems.push(each.name);
    } else {
      eligibleTotal += each.price * each.quantity
    }

  });

  if (originalTotal > 10000) {
    discountAmount = (20 / 100) * eligibleTotal;
    discountPercent = 20;
  } else if (originalTotal > 5000) {
    discountAmount = (10 / 100) * eligibleTotal;
    discountPercent = 10;
  } else {
    discountAmount;
  }

  return {
    originalTotal,
    discountPercent,
    discountAmount,
    finalTotal: originalTotal - discountAmount,
    nonEligibleItems
  }


}

const cartItems = [
  { name: 'Wireless Mouse', price: 799, quantity: 2 },
  { name: 'Keyboard', price: 2499, quantity: 1 },
  { name: 'Webcam', price: 3999, quantity: 1 },
  { name: 'USB Cable', price: 199, quantity: 3 },
];


console.log(JSON.stringify(applyDiscount(cartItems), null, 2));
