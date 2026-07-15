-- 06 · Channel attribution — revenue and conversion by acquisition source.
-- Ties marketing spend to actual paid revenue, and shows top-of-funnel volume
-- per channel so CPA / channel efficiency can be reasoned about.
WITH src_events AS (
    SELECT source,
           COUNT(DISTINCT user_pseudo_id) FILTER (WHERE event_name = 'page_view') AS visitors
    FROM events GROUP BY source
),
src_orders AS (
    SELECT source,
           COUNT(*) FILTER (WHERE status IN ('confirmed','processing','shipped','delivered')) AS paid_orders,
           ROUND(SUM(total) FILTER (WHERE status IN ('confirmed','processing','shipped','delivered')), 0) AS revenue
    FROM orders GROUP BY source
)
SELECT
    e.source,
    e.visitors,
    COALESCE(o.paid_orders, 0)                                        AS paid_orders,
    COALESCE(o.revenue, 0)                                            AS revenue,
    ROUND(100.0 * COALESCE(o.paid_orders,0) / NULLIF(e.visitors,0), 2) AS visitor_to_order_pct
FROM src_events e
LEFT JOIN src_orders o USING (source)
ORDER BY revenue DESC;
