-- 08 · Product performance — units, revenue, and avg review rating per bat.
-- UNNESTs the order line-items and joins moderated review ratings.
WITH line_items AS (
    SELECT it.productId, it.productName, it.quantity, it.price
    FROM orders o, UNNEST(o.items) AS t(it)
    WHERE o.status IN ('confirmed','processing','shipped','delivered')
),
sales AS (
    SELECT productId, ANY_VALUE(productName) AS product,
           SUM(quantity) AS units, ROUND(SUM(quantity * price), 0) AS revenue
    FROM line_items GROUP BY productId
),
ratings AS (
    SELECT productId, ROUND(AVG(rating), 2) AS avg_rating, COUNT(*) AS n_reviews
    FROM reviews WHERE status = 'approved' GROUP BY productId
)
SELECT s.product, s.units, s.revenue,
       COALESCE(r.avg_rating, NULL) AS avg_rating,
       COALESCE(r.n_reviews, 0)     AS reviews
FROM sales s LEFT JOIN ratings r USING (productId)
ORDER BY s.revenue DESC;
