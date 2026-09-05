-- Seed Data for Default Platform Configuration & Announcements
INSERT INTO public.announcements (id, title, message, type, is_active, target_audience)
VALUES (
  'ann-init-1',
  'ETH 2.0 SMART NODE UPGRADE',
  '⚡ Ethereum 2.0 Hardfork Node Upgrade Complete across all mining pools. Direct TRC-20 & ERC-20 zero-fee payouts enabled.',
  'info',
  true,
  'all'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.promo_codes (id, code, reward_amount, promo_type, description, max_uses, is_active)
VALUES 
  ('promo-vip100', 'VIP100', 100, 'bonus_usdt', 'VIP Mining Grant Coupon', 500, true),
  ('promo-hash2026', 'HASH2026', 250, 'bonus_usdt', 'Institutional Node Grant', 200, true)
ON CONFLICT (id) DO NOTHING;
