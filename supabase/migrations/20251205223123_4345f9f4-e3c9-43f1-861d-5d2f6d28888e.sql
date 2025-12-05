-- Add payment status to submissions
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'rejected'));

-- Add payment_id for tracking
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS payment_id TEXT;