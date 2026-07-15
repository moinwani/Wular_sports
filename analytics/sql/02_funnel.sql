-- 02 · Acquisition funnel (unique visitors per stage) + step conversion rates
-- Built from GA4-style events. Shows exactly where drop-off happens.
WITH stage AS (
    SELECT
        COUNT(DISTINCT user_pseudo_id) FILTER (WHERE event_name = 'page_view')      AS visitors,
        COUNT(DISTINCT user_pseudo_id) FILTER (WHERE event_name = 'view_item')      AS viewed_product,
        COUNT(DISTINCT user_pseudo_id) FILTER (WHERE event_name = 'add_to_cart')    AS added_to_cart,
        COUNT(DISTINCT user_pseudo_id) FILTER (WHERE event_name = 'begin_checkout') AS began_checkout,
        COUNT(DISTINCT user_pseudo_id) FILTER (WHERE event_name = 'purchase')       AS purchased
    FROM events
)
SELECT 'Visitors'        AS step, visitors       AS users, 100.0                                        AS pct_of_top, NULL AS step_conv_pct FROM stage
UNION ALL SELECT 'Viewed product', viewed_product, ROUND(100.0*viewed_product/visitors,1), ROUND(100.0*viewed_product/visitors,1) FROM stage
UNION ALL SELECT 'Added to cart',  added_to_cart,  ROUND(100.0*added_to_cart/visitors,1),  ROUND(100.0*added_to_cart/NULLIF(viewed_product,0),1) FROM stage
UNION ALL SELECT 'Began checkout', began_checkout, ROUND(100.0*began_checkout/visitors,1), ROUND(100.0*began_checkout/NULLIF(added_to_cart,0),1) FROM stage
UNION ALL SELECT 'Purchased',      purchased,      ROUND(100.0*purchased/visitors,1),      ROUND(100.0*purchased/NULLIF(began_checkout,0),1) FROM stage;
