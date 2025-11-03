-- Migration: Fix notification trigger security
-- Description: Allows system-generated notifications to bypass RLS by using SECURITY DEFINER
-- Tables affected: notifications (function modification)
-- Special notes: This fixes the issue where admin status updates fail due to RLS on notification creation

-- Drop the existing function and recreate it with SECURITY DEFINER
-- This allows the function to bypass RLS when creating notifications
drop function if exists public.create_investment_notification() cascade;

create or replace function public.create_investment_notification()
returns trigger
security definer -- This makes the function run with the permissions of the function owner (bypasses RLS)
set search_path = public
language plpgsql
as $$
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
        when 'completed' then
            notification_content := 'Your investment in "' || offer_name || '" has been completed.';
        else
            -- don't create notification for other status changes (pending, cancelled)
            return new;
    end case;

    -- insert notification for the user
    -- This will work even when an admin updates another user's investment
    -- because the function runs with SECURITY DEFINER (bypasses RLS)
    insert into public.notifications (user_id, content)
    values (new.user_id, notification_content);

    return new;
end;
$$;

-- Recreate the trigger (it was dropped with the CASCADE above)
create trigger investments_status_notification
    after update of status on public.investments
    for each row
    when (old.status is distinct from new.status and new.status in ('accepted', 'rejected', 'completed'))
    execute function public.create_investment_notification();

-- Add comment explaining the security definer approach
comment on function public.create_investment_notification() is
'Creates notifications for investment status changes. Uses SECURITY DEFINER to bypass RLS so admins can trigger notifications for other users.';
