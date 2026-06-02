export const CACHE_KEYS = {
    PRODUCTS_LIST: 'cache:products:list',
    PRODUCT_DETAIL: 'cache:products:detail',
    PRODUCTS_SELLER: 'cache:products:seller',
    PRODUCTS_ADMIN: 'cache:products:admin',
    CATEGORIES_TREE: 'cache:categories:tree',
} as const;

export const CACHE_TTL = {
    PRODUCTS_LIST: 300_000,
    PRODUCT_DETAIL: 600_000,
    PRODUCTS_SELLER: 60_000,
    PRODUCTS_ADMIN: 60_000,
    CATEGORIES_TREE: 3_600_000,
} as const;
