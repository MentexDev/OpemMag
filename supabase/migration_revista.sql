-- Mi Revista: store which product IDs the tenant has selected for ambassadors
-- NULL means "show all products"
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS catalog_product_ids TEXT[];
