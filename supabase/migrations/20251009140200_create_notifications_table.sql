-- Migration: Create notifications table
-- Description: Creates the notifications table for user notifications
-- Tables affected: notifications
-- Special notes: Includes foreign key to auth.users and RLS policies for user privacy

-- create notifications table with all required fields
create table public.notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    content text not null,
    is_read boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- add comment to table explaining its purpose
comment on table public.notifications is 'User notifications for various platform events';

-- add comments to columns for clarity
comment on column public.notifications.user_id is 'Reference to the user who should receive the notification';
comment on column public.notifications.content is 'The notification message content';
comment on column public.notifications.is_read is 'Whether the user has read this notification';

-- enable row level security on notifications table
alter table public.notifications enable row level security;

-- create rls policy for select operations for anonymous users
-- anonymous users cannot view any notifications (private data)
create policy "notifications_select_anon" on public.notifications
    for select
    to anon
    using (false);

-- create rls policy for select operations for authenticated users
-- authenticated users can only view their own notifications
create policy "notifications_select_authenticated" on public.notifications
    for select
    to authenticated
    using (auth.uid() = user_id);

-- create rls policy for insert operations for anonymous users
-- anonymous users cannot create notifications
create policy "notifications_insert_anon" on public.notifications
    for insert
    to anon
    with check (false);

-- create rls policy for insert operations for authenticated users
-- authenticated users can only create notifications for themselves (system will handle most creation)
create policy "notifications_insert_authenticated" on public.notifications
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- create rls policy for update operations for anonymous users
-- anonymous users cannot update notifications
create policy "notifications_update_anon" on public.notifications
    for update
    to anon
    using (false);

-- create rls policy for update operations for authenticated users
-- authenticated users can only update their own notifications (mainly for marking as read)
create policy "notifications_update_authenticated" on public.notifications
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- create rls policy for delete operations for anonymous users
-- anonymous users cannot delete notifications
create policy "notifications_delete_anon" on public.notifications
    for delete
    to anon
    using (false);

-- create rls policy for delete operations for authenticated users
-- authenticated users can only delete their own notifications
create policy "notifications_delete_authenticated" on public.notifications
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- create index on user_id column for faster user-specific queries
create index idx_notifications_user_id on public.notifications(user_id);

-- create index on is_read column for filtering read/unread notifications
create index idx_notifications_is_read on public.notifications(is_read);

-- create composite index for user and read status queries
create index idx_notifications_user_read on public.notifications(user_id, is_read);

-- create index on created_at for chronological ordering
create index idx_notifications_created_at on public.notifications(created_at desc);

-- create composite index for user notifications ordered by creation date
create index idx_notifications_user_created on public.notifications(user_id, created_at desc);

-- create trigger to automatically update updated_at column
create trigger notifications_updated_at
    before update on public.notifications
    for each row
    execute function public.handle_updated_at();

-- create function to automatically create notification for investment status changes
create or replace function public.create_investment_notification()
returns trigger as $$
declare
    notification_content text;
    offer_name text;
begin
    -- get offer name for the notification
    select name into offer_name
    from public.offers
    where id = new.offer_id;
    
    -- create notification content based on status change
    case new.status
        when 'accepted' then
            notification_content := 'Your investment in "' || offer_name || '" has been accepted.';
        when 'rejected' then
            notification_content := 'Your investment in "' || offer_name || '" has been rejected.';
        when 'closed' then
            notification_content := 'Your investment in "' || offer_name || '" has been closed.';
        else
            -- don't create notification for other status changes
            return new;
    end case;
    
    -- insert notification for the user
    insert into public.notifications (user_id, content)
    values (new.user_id, notification_content);
    
    return new;
end;
$$ language plpgsql;

-- create trigger to automatically create notifications on investment status changes
create trigger investments_status_notification
    after update of status on public.investments
    for each row
    when (old.status is distinct from new.status and new.status in ('accepted', 'rejected', 'closed'))
    execute function public.create_investment_notification();