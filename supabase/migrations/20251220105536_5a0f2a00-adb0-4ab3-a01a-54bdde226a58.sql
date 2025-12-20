-- Create experiment_requests table for tracking workflow requests
CREATE TABLE public.experiment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'timeout')),
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  experiment_id UUID REFERENCES public.experiments(id) ON DELETE SET NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add request_id column to experiments table to link back
ALTER TABLE public.experiments ADD COLUMN request_id UUID REFERENCES public.experiment_requests(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.experiment_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view their own requests, anyone can view completed ones
CREATE POLICY "Users can view own experiment requests"
ON public.experiment_requests
FOR SELECT
USING (auth.uid() = user_id OR status = 'completed');

CREATE POLICY "Authenticated users can create experiment requests"
ON public.experiment_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own experiment requests"
ON public.experiment_requests
FOR UPDATE
USING (auth.uid() = user_id);

-- Also allow service role to update (for n8n webhook)
CREATE POLICY "Service role can update any experiment request"
ON public.experiment_requests
FOR UPDATE
USING (true);

CREATE POLICY "Service role can insert experiment requests"
ON public.experiment_requests
FOR INSERT
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_experiment_requests_updated_at
BEFORE UPDATE ON public.experiment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_experiment_requests_user_id ON public.experiment_requests(user_id);
CREATE INDEX idx_experiment_requests_status ON public.experiment_requests(status);
CREATE INDEX idx_experiments_request_id ON public.experiments(request_id);