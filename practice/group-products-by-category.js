
const groupByCategory = (products) => {

  let categories = [];
  products.forEach((each) => {
    if (!categories.includes(each.category)) {
      categories.push(each.category)
    }
  });

  let newObj = {};

  for (let i = 0; i < categories.length; i++) {
    const product = products.filter((each) => each.category === categories[i]).map((each) => ({
      name: each.name,
      price: each.price
    }));
    newObj[categories[i]] = product;
  }

  return newObj;

}


const products = [
  { id: 'p1', name: 'Wireless Mouse', category: 'Electronics', price: 799 },
  { id: 'p2', name: 'Running Shoes', category: 'Sports', price: 2999 },
  { id: 'p3', name: 'USB-C Hub', category: 'Electronics', price: 1299 },
  { id: 'p4', name: 'Yoga Mat', category: 'Sports', price: 999 },
  { id: 'p5', name: 'Notebook', category: 'Stationery', price: 99 },
];


console.log(JSON.stringify(groupByCategory(products), null, 2));