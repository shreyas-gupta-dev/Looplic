alter table public.model_screen_guards
  add column if not exists image_url text;

update public.model_screen_guards as msg
set image_url = sgt.image_url
from public.screen_guard_types as sgt
where msg.image_url is null
  and lower(trim(msg.guard_type)) = lower(trim(sgt.name))
  and sgt.image_url is not null;

notify pgrst, 'reload schema';
