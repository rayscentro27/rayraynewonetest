-- Remove client-side inserts for profiles
DROP POLICY IF EXISTS "Profiles: insert own" ON public.profiles;
