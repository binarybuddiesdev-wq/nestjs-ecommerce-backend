// Expected output:
// {
//   delivered: { count: 2, totalAmount: 7000 },
//   pending: { count: 2, totalAmount: 3800 },
//   cancelled: { count: 1, totalAmount: 1200 },
//   shipped: { count: 1, totalAmount: 1800 },
// }

const summarizeOrders = (orders) => {

  let newObj = {};

  for (let i = 0; i < orders.length; i++) {

    let status = orders[i].status;
    if (!(status in newObj)) {
      newObj[status] = { count: 0, totalAmount: 0 }
    }

    newObj[status].count += 1;
    newObj[status].totalAmount += orders[i].amount


  }

  return newObj;


}

const orders = [
  { id: 'ORD-001', status: 'delivered', amount: 2500 },
  { id: 'ORD-002', status: 'pending', amount: 800 },
  { id: 'ORD-003', status: 'delivered', amount: 4500 },
  { id: 'ORD-004', status: 'cancelled', amount: 1200 },
  { id: 'ORD-005', status: 'pending', amount: 3000 },
  { id: 'ORD-006', status: 'shipped', amount: 1800 },
];

console.log(JSON.stringify(summarizeOrders(orders), null, 2));
