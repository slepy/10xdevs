-- Migration: Create offers table
-- Description: Creates the offers table for investment opportunities
-- Tables affected: offers
-- Special notes: Includes RLS policies for authenticated and anonymous users

-- create offers table with all required fields
create table public.offers (
    id uuid default gen_random_uuid() primary key,
    name varchar(255) not null,
    description text,
    target_amount integer not null, -- amount stored as integer (multiplied by 100 for precision)
    minimum_investment integer not null, -- amount stored as integer (multiplied by 100 for precision)
    end_at timestamptz not null,
    status varchar(50) not null default 'draft',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- add comment to table explaining its purpose
comment on table public.offers is 'Investment offers available on the platform';

-- add comments to columns for clarity
comment on column public.offers.target_amount is 'Target investment amount in cents (multiply by 100 for precision)';
comment on column public.offers.minimum_investment is 'Minimum investment amount in cents (multiply by 100 for precision)';
comment on column public.offers.status is 'Offer status: draft, active, closed, completed';
comment on column public.offers.end_at is 'When the offer ends and no more investments are accepted';

-- enable row level security on offers table
alter table public.offers enable row level security;

-- create rls policy for select operations for anonymous users
-- anonymous users can view all active offers
create policy "offers_select_anon" on public.offers
    for select
    to anon
    using (status = 'active');

-- create rls policy for select operations for authenticated users  
-- authenticated users can view all offers regardless of status
create policy "offers_select_authenticated" on public.offers
    for select
    to authenticated
    using (true);

-- create rls policy for insert operations for authenticated users
-- only authenticated users can create new offers (admin functionality)
create policy "offers_insert_authenticated" on public.offers
    for insert
    to authenticated
    with check (true);

-- create rls policy for update operations for authenticated users
-- only authenticated users can update offers (admin functionality)
create policy "offers_update_authenticated" on public.offers
    for update
    to authenticated
    using (true)
    with check (true);

-- create rls policy for delete operations for authenticated users
-- only authenticated users can delete offers (admin functionality)
create policy "offers_delete_authenticated" on public.offers
    for delete
    to authenticated
    using (true);

-- create index on status column for faster filtering
create index idx_offers_status on public.offers(status);

-- create index on end_at column for filtering active offers
create index idx_offers_end_at on public.offers(end_at);

-- create function to automatically update updated_at column
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- create trigger to automatically update updated_at column
create trigger offers_updated_at
    before update on public.offers
    for each row
    execute function public.handle_updated_at();