-- Migration: Create offer_images table
-- Description: Creates a separate table to store multiple images for each offer
-- Tables affected: offer_images (new)
-- Special notes: Maximum 5 images per offer enforced by trigger

-- create offer_images table
create table public.offer_images (
    id uuid default gen_random_uuid() primary key,
    offer_id uuid not null references public.offers(id) on delete cascade,
    url text not null,
    display_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- add comment to table explaining its purpose
comment on table public.offer_images is 'Images associated with investment offers';

-- add comments to columns for clarity
comment on column public.offer_images.offer_id is 'Reference to the offer this image belongs to';
comment on column public.offer_images.url is 'URL of the image stored in Supabase Storage';
comment on column public.offer_images.display_order is 'Order in which images should be displayed (0 = primary image)';

-- enable row level security on offer_images table
alter table public.offer_images enable row level security;

-- create rls policy for select operations for anonymous users
-- anonymous users can view images for active offers
create policy "offer_images_select_anon" on public.offer_images
    for select
    to anon
    using (
        exists (
            select 1 from public.offers
            where offers.id = offer_images.offer_id
            and offers.status = 'active'
        )
    );

-- create rls policy for select operations for authenticated users
-- authenticated users can view all offer images
create policy "offer_images_select_authenticated" on public.offer_images
    for select
    to authenticated
    using (true);

-- create rls policy for insert operations for authenticated users
-- only authenticated users can add images (admin functionality)
create policy "offer_images_insert_authenticated" on public.offer_images
    for insert
    to authenticated
    with check (true);

-- create rls policy for update operations for authenticated users
-- only authenticated users can update images (admin functionality)
create policy "offer_images_update_authenticated" on public.offer_images
    for update
    to authenticated
    using (true)
    with check (true);

-- create rls policy for delete operations for authenticated users
-- only authenticated users can delete images (admin functionality)
create policy "offer_images_delete_authenticated" on public.offer_images
    for delete
    to authenticated
    using (true);

-- create index on offer_id for faster joins and filtering
create index idx_offer_images_offer_id on public.offer_images(offer_id);

-- create index on display_order for sorting
create index idx_offer_images_display_order on public.offer_images(offer_id, display_order);

-- create function to automatically update updated_at column
create trigger offer_images_updated_at
    before update on public.offer_images
    for each row
    execute function public.handle_updated_at();

-- create function to enforce maximum 5 images per offer
create or replace function public.check_offer_images_limit()
returns trigger as $$
declare
    image_count integer;
begin
    select count(*) into image_count
    from public.offer_images
    where offer_id = new.offer_id;
    
    if image_count >= 5 then
        raise exception 'Maximum of 5 images per offer allowed';
    end if;
    
    return new;
end;
$$ language plpgsql;

-- create trigger to enforce image limit on insert
create trigger offer_images_limit_check
    before insert on public.offer_images
    for each row
    execute function public.check_offer_images_limit();
