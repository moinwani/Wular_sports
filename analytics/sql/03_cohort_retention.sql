-- 03 · Monthly acquisition cohorts + repeat-purchase behaviour
-- Cohort = month of a customer's FIRST paid order. Shows how many came back.
WITH paid AS (
    SELECT userId, CAST(createdAt AS TIMESTAMP) AS ts, total
    FROM orders
    WHERE status IN ('confirmed','processing','shipped','delivered')
),
first_order AS (
    SELECT userId, date_trunc('month', MIN(ts)) AS cohort_month, MIN(ts) AS first_ts
    FROM paid GROUP BY userId
),
customer_stats AS (
    SELECT p.userId, f.cohort_month,
           COUNT(*) AS orders, SUM(p.total) AS ltv
    FROM paid p JOIN first_order f USING (userId)
    GROUP BY p.userId, f.cohort_month
)
SELECT
    strftime(cohort_month, '%Y-%m')                                   AS cohort,
    COUNT(*)                                                          AS customers,
    SUM(CASE WHEN orders > 1 THEN 1 ELSE 0 END)                      AS repeat_customers,
    ROUND(100.0 * SUM(CASE WHEN orders > 1 THEN 1 ELSE 0 END) / COUNT(*), 1) AS repeat_rate_pct,
    ROUND(AVG(ltv), 0)                                               AS avg_ltv
FROM customer_stats
GROUP BY cohort_month
ORDER BY cohort_month;
