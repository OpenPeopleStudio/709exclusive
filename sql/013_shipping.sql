alter table orders
add column shipping_address jsonb not null,
add column shipping_cents integer not null default 0,
add column shipping_method text,
add column tracking_number text,
add column carrier text;