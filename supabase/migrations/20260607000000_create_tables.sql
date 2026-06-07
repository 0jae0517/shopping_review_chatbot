-- 1. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_id TEXT,
    rating INTEGER,
    title TEXT,
    content TEXT,
    author TEXT,
    review_date DATE,
    helpful_votes INTEGER,
    verified_purchase BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'bot', 'system')),
    content TEXT NOT NULL,
    context JSONB, -- 검색된 리뷰 데이터를 저장할 수 있도록
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Allow anon access for this specific project)
-- Reviews: anon can select, insert
CREATE POLICY "Allow anon read access on reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access on reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- Chats: anon can select, insert, update
CREATE POLICY "Allow anon read access on chats" ON public.chats FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access on chats" ON public.chats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update access on chats" ON public.chats FOR UPDATE USING (true);

-- Messages: anon can select, insert
CREATE POLICY "Allow anon read access on messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow anon insert access on messages" ON public.messages FOR INSERT WITH CHECK (true);
