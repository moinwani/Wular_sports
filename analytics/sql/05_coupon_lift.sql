-- 05 · Coupon impact (WELCOME100)
-- Compares paid orders with vs without the coupon: volume, AOV, discount cost.
-- Question it answers: is the discount buying incremental orders or just
-- discounting orders that would have happened anyway?
SELECT
    CASE WHEN couponCode = 'WELCOME100' THEN 'With coupon' ELSE 'No coupon' END AS segment,
    COUNT(*)                                  AS orders,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct_of_orders,
    ROUND(AVG(total), 0)                      AS avg_order_value,
    ROUND(AVG(subtotal), 0)                   AS avg_cart_before_discount,
    ROUND(SUM(discount), 0)                   AS total_discount_cost
FROM orders
WHERE status IN ('confirmed','processing','shipped','delivered')
GROUP BY 1
ORDER BY orders DESC;
