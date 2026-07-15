-- 04 · RFM segmentation (Recency, Frequency, Monetary)
-- Scores each customer 1-4 on each axis, then labels actionable segments.
WITH paid AS (
    SELECT userId, CAST(createdAt AS TIMESTAMP) AS ts, total
    FROM orders
    WHERE status IN ('confirmed','processing','shipped','delivered')
),
per_customer AS (
    SELECT userId,
           date_diff('day', MAX(ts), CURRENT_TIMESTAMP) AS recency_days,
           COUNT(*)                                     AS frequency,
           SUM(total)                                   AS monetary
    FROM paid GROUP BY userId
),
scored AS (
    SELECT *,
        NTILE(4) OVER (ORDER BY recency_days DESC) AS r,  -- lower recency = better = higher score
        NTILE(4) OVER (ORDER BY frequency ASC)     AS f,
        NTILE(4) OVER (ORDER BY monetary ASC)      AS m
    FROM per_customer
),
segmented AS (
    SELECT *,
        CASE
            WHEN r >= 3 AND f >= 3 AND m >= 3 THEN 'Champions'
            WHEN r >= 3 AND f >= 2            THEN 'Loyal'
            WHEN r >= 3 AND f = 1             THEN 'New / Promising'
            WHEN r = 2                        THEN 'Needs Attention'
            ELSE 'At Risk / Lapsed'
        END AS segment
    FROM scored
)
SELECT segment,
       COUNT(*)                    AS customers,
       ROUND(AVG(recency_days), 0) AS avg_recency_days,
       ROUND(AVG(frequency), 1)    AS avg_orders,
       ROUND(AVG(monetary), 0)     AS avg_spend
FROM segmented
GROUP BY segment
ORDER BY customers DESC;
