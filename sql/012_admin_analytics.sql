create view admin_variant_analytics as
select
  pv.id,
  pv.sku,
  pv.stock,
  pv.reserved,
  coalesce(sum(oi.qty), 0) as sold_units,
  case
    when (coalesce(sum(oi.qty),0) + pv.stock) = 0 then 0
    else
      coalesce(sum(oi.qty),0)::float /
      (coalesce(sum(oi.qty),0) + pv.stock)
  end as sell_through_rate,
  pv.first_sold_at,
  case
    when pv.first_sold_at is not null
    then extract(epoch from (pv.first_sold_at - pv.created_at))/86400
    else null
  end as days_to_first_sale
from product_variants pv
left join order_items oi on oi.variant_id = pv.id
group by pv.id;