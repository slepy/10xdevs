-- Migration: Add reason and deleted_at columns to investments table
-- Description: Adds reason field for rejection/cancellation and deleted_at timestamp
-- Tables affected: investments
-- Special notes: These fields support business logic for tracking why investments were rejected/cancelled

-- add reason column for storing rejection/cancellation reason
alter table public.investments
add column reason text null;

-- add deleted_at column for tracking when investment was cancelled/rejected
alter table public.investments
add column deleted_at timestamptz null;

-- add comments to new columns for clarity
comment on column public.investments.reason is 'Reason for rejection or cancellation of the investment';
comment on column public.investments.deleted_at is 'Timestamp when investment was cancelled or rejected';

-- create index on deleted_at for querying active vs deleted investments
create index idx_investments_deleted_at on public.investments(deleted_at);

-- create partial index for active investments (where deleted_at is null)
create index idx_investments_active on public.investments(user_id, status) where deleted_at is null;

-- update the table comment to reflect new fields
comment on table public.investments is 'User investments in various offers with rejection/cancellation tracking';