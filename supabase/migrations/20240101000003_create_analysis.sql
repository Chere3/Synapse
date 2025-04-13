-- Create the analysis table
CREATE TABLE IF NOT EXISTS public.analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    CONSTRAINT fk_document FOREIGN KEY (document_id) REFERENCES public.documents(id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.analysis ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own analysis" ON public.analysis;
DROP POLICY IF EXISTS "Users can insert their own analysis" ON public.analysis;
DROP POLICY IF EXISTS "Users can update their own analysis" ON public.analysis;
DROP POLICY IF EXISTS "Users can delete their own analysis" ON public.analysis;

-- Create policies
CREATE POLICY "Users can view their own analysis"
ON public.analysis FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis"
ON public.analysis FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis"
ON public.analysis FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis"
ON public.analysis FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS analysis_user_id_idx ON public.analysis(user_id);
CREATE INDEX IF NOT EXISTS analysis_document_id_idx ON public.analysis(document_id);
CREATE INDEX IF NOT EXISTS analysis_status_idx ON public.analysis(status); 