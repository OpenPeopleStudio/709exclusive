create type order_status as enum (
  'pending',     -- order created, payment not confirmed
  'paid',        -- payment succeeded
  'fulfilled',   -- picked/packed
  'shipped',     -- handed to carrier
  'cancelled',   -- admin cancelled before shipment
  'refunded'     -- refunded after payment
);

alter table orders
alter column status type order_status using status::order_status;

alter table orders
add column paid_at timestamp,
add column fulfilled_at timestamp,
add column shipped_at timestamp,
add column cancelled_at timestamp,
add column refunded_at timestamp;