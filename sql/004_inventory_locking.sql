alter table product_variants
add column reserved integer not null default 0;

-- Safety: stock and reserved can never go negative
alter table product_variants
add constraint stock_non_negative check (stock >= 0),
add constraint reserved_non_negative check (reserved >= 0);

-- Helper view (optional but useful)
create view variant_availability as
select
  id,
  stock,
  reserved,
  (stock - reserved) as available
from product_variants;