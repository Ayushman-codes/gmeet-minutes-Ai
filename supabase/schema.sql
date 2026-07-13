-- profiles mirrors auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz default now()
);

create table meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  agenda_notes text,
  meeting_date timestamptz default now(),
  status text default 'draft' check (status in ('draft','recording','processing','done','failed')),
  audio_url text,
  created_at timestamptz default now()
);

create table summaries (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade not null unique,
  attendees text[],
  summary_text text,
  key_points jsonb,
  decisions jsonb,
  raw_transcript text,
  created_at timestamptz default now()
);

create table action_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade not null,
  description text not null,
  owner_name text,
  due_date date,
  is_completed boolean default false,
  created_at timestamptz default now()
);

create table email_logs (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade not null,
  sent_to text[],
  sent_at timestamptz default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table meetings enable row level security;
alter table summaries enable row level security;
alter table action_items enable row level security;
alter table email_logs enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own meetings" on meetings for all using (auth.uid() = user_id);
create policy "own summaries" on summaries for all using (
  auth.uid() = (select user_id from meetings where meetings.id = summaries.meeting_id)
);
create policy "own action items" on action_items for all using (
  auth.uid() = (select user_id from meetings where meetings.id = action_items.meeting_id)
);
create policy "own email logs" on email_logs for all using (
  auth.uid() = (select user_id from meetings where meetings.id = email_logs.meeting_id)
);

-- auto-create profile row on signup
create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
