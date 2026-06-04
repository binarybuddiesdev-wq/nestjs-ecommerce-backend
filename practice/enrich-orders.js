
const enrichOrders = (products, orderItems) => {

  let items = [];
  let sum = 0;

  for (let i = 0; i < orderItems.length; i++) {

    const productId = orderItems[i].productId;
    const totalQuantity = orderItems[i].quantity;

    const productDetails = products.find((each) => each.id === productId);
    if (!productDetails) continue;
    const updatedProductDetails = {
      name: productDetails.name,
      price: productDetails.price,
      inStock: productDetails.stock > 0
    };
    sum += totalQuantity * productDetails.price;
    let eachItem = { ...orderItems[i], product: updatedProductDetails };
    items.push(eachItem)


  }
  let result = {
    items: items,
    totalAmount: sum
  }

  return result;

}



const products = [
  { id: 'p1', name: 'Wireless Mouse', price: 799, stock: 15 },
  { id: 'p2', name: 'USB-C Hub', price: 1299, stock: 8 },
  { id: 'p3', name: 'Keyboard', price: 2499, stock: 0 },
  { id: 'p4', name: 'Webcam', price: 3999, stock: 5 },
];

const orderItems = [
  { productId: 'p1', quantity: 2 },
  { productId: 'p3', quantity: 1 },
  { productId: 'p4', quantity: 3 },
]


console.log(enrichOrders(products, orderItems));