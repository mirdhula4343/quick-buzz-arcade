
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  host_client_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  locked BOOLEAN NOT NULL DEFAULT false,
  current_round INT NOT NULL DEFAULT 0,
  round_active BOOLEAN NOT NULL DEFAULT false,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX rooms_code_idx ON public.rooms(code);

CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  name TEXT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  is_host BOOLEAN NOT NULL DEFAULT false,
  is_eliminated BOOLEAN NOT NULL DEFAULT false,
  connected BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, client_id)
);
CREATE INDEX players_room_idx ON public.players(room_id);

CREATE TABLE public.buzzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  round INT NOT NULL,
  buzzed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(room_id, player_id, round)
);
CREATE INDEX buzzes_room_round_idx ON public.buzzes(room_id, round, buzzed_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buzzes TO anon, authenticated;
GRANT ALL ON public.rooms TO service_role;
GRANT ALL ON public.players TO service_role;
GRANT ALL ON public.buzzes TO service_role;

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buzzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms open" ON public.rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "players open" ON public.players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "buzzes open" ON public.buzzes FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.buzzes;

ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.players REPLICA IDENTITY FULL;
ALTER TABLE public.buzzes REPLICA IDENTITY FULL;
