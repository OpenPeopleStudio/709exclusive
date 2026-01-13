alter table product_variants
add column brand text not null,
add column model text not null,
add column condition_code text not null,
add column sku text unique;

-- Enforce condition codes
alter table product_variants
add constraint valid_condition
check (condition_code in ('DS','VNDS','USED'));

-- Add default values for existing rows (if any)
update product_variants
set
  brand = 'UNKNOWN',
  model = 'UNKNOWN',
  condition_code = 'DS'
where brand is null or model is null or condition_code is null;