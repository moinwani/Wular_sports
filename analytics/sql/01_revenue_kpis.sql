-- 01 · Revenue KPIs
-- Paid revenue only. 'pending' orders are abandoned checkouts (payment never
-- completed) and must be excluded from revenue — a common analytics mistake.
SELECT
    COUNT(*) FILTER (WHERE status IN ('confirmed','processing','shipped','delivered'))      AS paid_orders,
    COUNT(*) FILTER (WHERE status = 'pending')                                              AS abandoned_checkouts,
    COUNT(*) FILTER (WHERE status = 'cancelled')                                            AS cancelled,
    ROUND(SUM(total) FILTER (WHERE status IN ('confirmed','processing','shipped','delivered')), 0) AS paid_revenue,
    ROUND(AVG(total) FILTER (WHERE status IN ('confirmed','processing','shipped','delivered')), 0) AS avg_order_value,
    ROUND(SUM(discount) FILTER (WHERE status IN ('confirmed','processing','shipped','delivered')), 0) AS total_discount_given,
    COUNT(DISTINCT userId) FILTER (WHERE status IN ('confirmed','processing','shipped','delivered')) AS unique_paying_customers
FROM orders;
