-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User Roles
create table if not exists user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'teacher', 'parent', 'student')),
  created_at timestamptz default now(),
  unique(user_id)
);

-- Students
create table if not exists students (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  age integer,
  class text not null,
  gender text not null,
  department text,
  student_email text,
  parent_email text,
  parent_phone text,
  hobby text,
  club text,
  blood_group text,
  genotype text,
  allergies text,
  medical_conditions text,
  is_boarder boolean default false,
  room_number text,
  created_at timestamptz default now()
);

-- Teachers
create table if not exists teachers (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text not null unique,
  phone text,
  type text not null check (type in ('primary', 'secondary')),
  assigned_class text,
  subject text,
  created_at timestamptz default now()
);

-- Grades
create table if not exists grades (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references students(id) on delete cascade,
  subject text not null,
  class text not null,
  term text not null,
  session text not null,
  ca1 integer default 0,
  ca2 integer default 0,
  exam integer default 0,
  total integer default 0,
  grade_letter text,
  remark text,
  created_at timestamptz default now(),
  unique(student_id, subject, term, session)
);

-- Attendance
create table if not exists attendance (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references students(id) on delete cascade,
  class text not null,
  date date not null,
  status text not null check (status in ('present', 'absent', 'late')),
  created_at timestamptz default now(),
  unique(student_id, date)
);

-- Notices
create table if not exists notices (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  recipient text not null,
  class text,
  created_at timestamptz default now()
);

-- Report Card Access
create table if not exists report_card_access (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references students(id) on delete cascade,
  parent_email text not null,
  term text not null,
  session text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'revoked')),
  created_at timestamptz default now(),
  unique(student_id, term, session)
);

-- Timetable
create table if not exists timetable (
  id uuid primary key default uuid_generate_v4(),
  class text not null,
  day text not null,
  period text not null,
  subject text not null,
  created_at timestamptz default now(),
  unique(class, day, period)
);

-- Calendar Events
create table if not exists calendar_events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  date date not null,
  end_date date,
  type text not null,
  description text,
  created_at timestamptz default now()
);

-- RLS Policies
alter table user_roles enable row level security;
alter table students enable row level security;
alter table teachers enable row level security;
alter table grades enable row level security;
alter table attendance enable row level security;
alter table notices enable row level security;
alter table report_card_access enable row level security;
alter table timetable enable row level security;
alter table calendar_events enable row level security;

-- User Roles Policies
create policy "Users can read own role"
  on user_roles for select
  using (auth.uid() = user_id);

create policy "Users can insert own role"
  on user_roles for insert
  with check (auth.uid() = user_id);

create policy "Admins can do everything on user_roles"
  on user_roles for all
  using (exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = 'admin'
  ));

-- Students Policies
create policy "Authenticated users can read students"
  on students for select
  using (auth.role() = 'authenticated');

create policy "Admins and teachers can insert students"
  on students for insert
  with check (exists (
    select 1 from user_roles
    where user_id = auth.uid()
    and role in ('admin', 'teacher')
  ));

create policy "Admins and teachers can update students"
  on students for update
  using (exists (
    select 1 from user_roles
    where user_id = auth.uid()
    and role in ('admin', 'teacher')
  ));

create policy "Admins can delete students"
  on students for delete
  using (exists (
    select 1 from user_roles
    where user_id = auth.uid()
    and role = 'admin'
  ));

-- Teachers Policies
create policy "Authenticated users can read teachers"
  on teachers for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage teachers"
  on teachers for all
  using (exists (
    select 1 from user_roles
    where user_id = auth.uid()
    and role = 'admin'
  ));

-- Grades Policies
create policy "Authenticated users can read grades"
  on grades for select
  using (auth.role() = 'authenticated');

create policy "Admins and teachers can manage grades"
  on grades for all
  using (exists (
    select 1 from user_roles
    where user_id = auth.uid()
    and role in ('admin', 'teacher')
  ));

-- Attendance Policies
create policy "Authenticated users can read attendance"
  on attendance for select
  using (auth.role() = 'authenticated');

create policy "Admins and teachers can manage attendance"
  on attendance for all
  using (exists (
    select 1 from user_roles
    where user_id = auth.uid()
    and role in ('admin', 'teacher')
  ));

-- Notices Policies
create policy "Authenticated users can read notices"
  on notices for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage notices"
  on notices for all
  using (exists (
    select 1 from user_roles
    where user_id = auth.uid()
    and role = 'admin'
  ));

-- Report Card Access Policies
create policy "Authenticated users can read report access"
  on report_card_access for select
  using (auth.role() = 'authenticated');

create policy "Parents can insert report access"
  on report_card_access for insert
  with check (auth.role() = 'authenticated');

create policy "Admins can manage report access"
  on report_card_access for all
  using (exists (
    select 1 from user_roles
    where user_id = auth.uid()
    and role = 'admin'
  ));

-- Timetable Policies
create policy "Authenticated users can read timetable"
  on timetable for select
  using (auth.role() = 'authenticated');

create policy "Admins and teachers can manage timetable"
  on timetable for all
  using (exists (
    select 1 from user_roles
    where user_id = auth.uid()
    and role in ('admin', 'teacher')
  ));

-- Calendar Events Policies
create policy "Authenticated users can read calendar"
  on calendar_events for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage calendar"
  on calendar_events for all
  using (exists (
    select 1 from user_roles
    where user_id = auth.uid()
    and role = 'admin'
  ));
