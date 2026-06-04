User clicks Add To Cart
        |
        v
Find Product
        |
        +--> Product doesn't exist?
        |        |
        |        +--> 404 Error
        |
        +--> Product inactive?
        |        |
        |        +--> Error
        |
        +--> Enough stock?
                 |
                 +--> No -> Error
                 |
                 +--> Yes
                          |
                          v
                  Find User Cart
                          |
          +---------------+---------------+
          |                               |
      No Cart                       Cart Exists
          |                               |
    Create Cart                 Product Already?
                                          |
                            +-------------+------------+
                            |                          |
                           Yes                        No
                            |                          |
                  Increase Quantity           Add New Item
                            |
                            v
                     Save Cart
                            |
                            v
                        Return