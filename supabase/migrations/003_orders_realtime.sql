-- =============================================
-- Migration 003: Enable Supabase Realtime
-- =============================================
-- Enable Realtime on orders table so that kitchen
-- screen receives live updates without polling.

-- REPLICA IDENTITY FULL sends old + new row data on UPDATE/DELETE
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;

-- Add tables to Supabase Realtime publication
-- (supabase_realtime is the default publication)
DO $$
BEGIN
  -- Add orders table to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  -- Add order_items table to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'order_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
  END IF;
END $$;
