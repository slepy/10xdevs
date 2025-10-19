-- Migration: Create investments table
-- Description: Creates the investments table for tracking user investments in offers
-- Tables affected: investments
-- Special notes: Includes foreign keys to auth.users and offers, indexes, and RLS policies

-- create investments table with all required fields and relationships
create table public.investments (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    offer_id uuid not null references public.offers(id) on delete cascade,
    amount integer not null, -- amount stored as integer (multiplied by 100 for precision)
    status varchar(50) not null default 'pending',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    completed_at timestamptz null
);

-- add comment to table explaining its purpose
comment on table public.investments is 'User investments in various offers';

-- add comments to columns for clarity
comment on column public.investments.user_id is 'Reference to the user who made the investment';
comment on column public.investments.offer_id is 'Reference to the offer being invested in';
comment on column public.investments.amount is 'Investment amount in cents (multiply by 100 for precision)';
comment on column public.investments.status is 'Investment status: pending, accepted, rejected, closed';
comment on column public.investments.completed_at is 'When the investment was completed/finalized';

-- enable row level security on investments table
alter table public.investments enable row level security;

-- create rls policy for select operations for anonymous users
-- anonymous users cannot view any investments (private data)
create policy "investments_select_anon" on public.investments
    for select
    to anon
    using (false);

-- create rls policy for select operations for authenticated users
-- authenticated users can only view their own investments
create policy "investments_select_authenticated" on public.investments
    for select
    to authenticated
    using (auth.uid() = user_id);

-- create rls policy for insert operations for anonymous users
-- anonymous users cannot create investments
create policy "investments_insert_anon" on public.investments
    for insert
    to anon
    with check (false);

-- create rls policy for insert operations for authenticated users
-- authenticated users can only create investments for themselves
create policy "investments_insert_authenticated" on public.investments
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- create rls policy for update operations for anonymous users
-- anonymous users cannot update investments
create policy "investments_update_anon" on public.investments
    for update
    to anon
    using (false);

-- create rls policy for update operations for authenticated users
-- authenticated users can only update their own investments
create policy "investments_update_authenticated" on public.investments
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- create rls policy for delete operations for anonymous users
-- anonymous users cannot delete investments
create policy "investments_delete_anon" on public.investments
    for delete
    to anon
    using (false);

-- create rls policy for delete operations for authenticated users
-- authenticated users can only delete their own investments
create policy "investments_delete_authenticated" on public.investments
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- create index on user_id column for faster user-specific queries
create index idx_investments_user_id on public.investments(user_id);

-- create index on offer_id column for faster offer-specific queries
create index idx_investments_offer_id on public.investments(offer_id);

-- create index on status column for filtering by investment status
create index idx_investments_status on public.investments(status);

-- create composite index for user and status queries
create index idx_investments_user_status on public.investments(user_id, status);

-- create composite index for offer and status queries
create index idx_investments_offer_status on public.investments(offer_id, status);

-- create trigger to automatically update updated_at column
create trigger investments_updated_at
    before update on public.investments
    for each row
    execute function public.handle_updated_at();

-- create function to validate investment amount against offer minimum
create or replace function public.validate_investment_amount()
returns trigger as $$
declare
    min_investment integer;
begin
    -- get minimum investment for the offer
    select minimum_investment into min_investment
    from public.offers
    where id = new.offer_id;
    
    -- check if investment amount meets minimum requirement
    if new.amount < min_investment then
        raise exception 'Investment amount % is below minimum required amount %', new.amount, min_investment;
    end if;
    
    return new;
end;
$$ language plpgsql;

-- create trigger to validate investment amount before insert or update
create trigger investments_validate_amount
    before insert or update on public.investments
    for each row
    execute function public.validate_investment_amount();