-- 07 · Lead capture + WhatsApp engagement (the off-site sales channel)
-- Measures the abandoned-checkout follow-up opportunity and WhatsApp intent.
SELECT
    COUNT(*)                                                          AS total_leads,
    COUNT(*) FILTER (WHERE status = 'converted')                     AS converted,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'converted') / COUNT(*), 1) AS lead_conversion_pct,
    COUNT(*) FILTER (WHERE status = 'browsing' AND phone <> '')      AS reachable_open_leads,
    COUNT(*) FILTER (WHERE whatsappClicks > 0)                       AS leads_who_tapped_whatsapp,
    ROUND(AVG(whatsappClicks) FILTER (WHERE whatsappClicks > 0), 1)  AS avg_taps_when_engaged,
    ROUND(SUM(cartTotal) FILTER (WHERE status = 'browsing'), 0)      AS open_pipeline_value
FROM leads;
