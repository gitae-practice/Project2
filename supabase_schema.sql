-- profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  avatar_url text,
  created_at timestamptz default now()
);

-- servers
create table servers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon_url text,
  owner_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- server_members
create table server_members (
  server_id uuid references servers(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz default now(),
  primary key (server_id, user_id)
);

-- channels
create table channels (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references servers(id) on delete cascade,
  name text not null,
  type text not null default 'text' check (type in ('text', 'announcement')),
  created_at timestamptz default now()
);

-- messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references channels(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  is_edited boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- direct_messages
create table direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- RLS 활성화
alter table profiles enable row level security;
alter table servers enable row level security;
alter table server_members enable row level security;
alter table channels enable row level security;
alter table messages enable row level security;
alter table direct_messages enable row level security;

-- profiles 정책
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

-- servers 정책
create policy "Servers viewable by members" on servers for select using (
  exists (select 1 from server_members where server_id = servers.id and user_id = auth.uid())
);
create policy "Authenticated users can create servers" on servers for insert with check (auth.uid() = owner_id);

-- server_members 정책
create policy "Members viewable by server members" on server_members for select using (
  exists (select 1 from server_members sm where sm.server_id = server_members.server_id and sm.user_id = auth.uid())
);
create policy "Users can join servers" on server_members for insert with check (auth.uid() = user_id);

-- channels 정책
create policy "Channels viewable by server members" on channels for select using (
  exists (select 1 from server_members where server_id = channels.server_id and user_id = auth.uid())
);
create policy "Server members can create channels" on channels for insert with check (
  exists (select 1 from server_members where server_id = channels.server_id and user_id = auth.uid())
);

-- messages 정책
create policy "Messages viewable by channel members" on messages for select using (
  exists (
    select 1 from channels c
    join server_members sm on sm.server_id = c.server_id
    where c.id = messages.channel_id and sm.user_id = auth.uid()
  )
);
create policy "Channel members can send messages" on messages for insert with check (
  auth.uid() = user_id and exists (
    select 1 from channels c
    join server_members sm on sm.server_id = c.server_id
    where c.id = messages.channel_id and sm.user_id = auth.uid()
  )
);

-- direct_messages 정책
create policy "DMs viewable by participants" on direct_messages for select using (
  auth.uid() = sender_id or auth.uid() = receiver_id
);
create policy "Authenticated users can send DMs" on direct_messages for insert with check (
  auth.uid() = sender_id
);

-- Realtime 활성화
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table direct_messages;
