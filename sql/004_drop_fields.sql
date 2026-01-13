alter table products
add column drop_starts_at timestamp,
add column drop_ends_at timestamp,
add column is_drop boolean default false;