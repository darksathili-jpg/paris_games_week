-- 1) Créez d'abord le compte enseignant dans Supabase Authentication > Users.
-- 2) Remplacez l'adresse ci-dessous puis exécutez ce script dans SQL Editor.

insert into public.profiles (id, pseudo, role)
select u.id, 'Enseignant', 'teacher'
from auth.users u
where lower(u.email) = lower('VOTRE.ADRESSE@EXEMPLE.FR')
on conflict (id) do update set
  role = 'teacher',
  pseudo = excluded.pseudo;

-- Vérification
select u.email, p.id, p.role, p.pseudo
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'teacher';
