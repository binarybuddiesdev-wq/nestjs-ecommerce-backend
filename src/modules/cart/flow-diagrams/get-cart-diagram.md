User Opens Cart
       |
       v
Find Cart By userId
       |
       +------------------+
       |                  |
     Not Found         Found
       |                  |
Return Empty Cart         |
                           v
                 Extract Product IDs
                           |
                           v
                  Fetch Products
                           |
                           v
                    Create Map
                           |
                           v
              Loop Through Cart Items
                           |
          +----------------+----------------+
          |                                 |
    Product Exists                   Product Missing
          |                                 |
          v                                 v
 Add Product Details              product = null
          |
          v
 Update totalItems
 Update totalAmount
          |
          v
 Build enrichedItems
          |
          v
      Log Result
          |
          v
 Return Final Cart Response