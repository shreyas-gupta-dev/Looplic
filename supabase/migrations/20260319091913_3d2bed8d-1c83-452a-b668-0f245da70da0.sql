
-- Allow authenticated users to read their own roles
create policy "Users can read own roles" on public.user_roles
for select to authenticated
using (user_id = auth.uid());
