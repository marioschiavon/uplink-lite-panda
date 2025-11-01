-- ============================================
-- CRITICAL SECURITY FIXES - RUN THIS SQL IN SUPABASE
-- ============================================
-- This migration fixes critical RLS issues and implements a proper roles system
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/kfsvpbujmetlendgwnrs/sql/new

-- 1. Create app_role enum for roles system
CREATE TYPE IF NOT EXISTS public.app_role AS ENUM ('superadmin', 'admin', 'supervisor', 'agent');

-- 2. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Create function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_highest_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'superadmin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'supervisor' THEN 3
      WHEN 'agent' THEN 4
    END
  LIMIT 1
$$;

-- 6. Add RLS policies for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage roles in their organization" ON public.user_roles;
CREATE POLICY "Admins can manage roles in their organization"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') 
  AND user_id IN (
    SELECT id FROM public.users 
    WHERE organization_id = get_user_organization(auth.uid())
  )
);

DROP POLICY IF EXISTS "Superadmins can manage all roles" ON public.user_roles;
CREATE POLICY "Superadmins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- 7. Fix users table RLS - add SELECT policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can view users in their organization" ON public.users;
CREATE POLICY "Admins can view users in their organization"
ON public.users
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  AND organization_id = get_user_organization(auth.uid())
);

DROP POLICY IF EXISTS "Superadmins can view all users" ON public.users;
CREATE POLICY "Superadmins can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.users;
CREATE POLICY "Allow insert for authenticated users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 8. Fix organizations table - drop overly permissive policies
DROP POLICY IF EXISTS "Allow all inserts temporarily" ON public.organizations;
DROP POLICY IF EXISTS "Allow select org for authenticated users" ON public.organizations;
DROP POLICY IF EXISTS "Allow update org for admins" ON public.organizations;

-- 9. Add proper organizations RLS policies
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Users can view their own organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (id = get_user_organization(auth.uid()));

DROP POLICY IF EXISTS "Superadmins can view all organizations" ON public.organizations;
CREATE POLICY "Superadmins can view all organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Users can insert their own organization" ON public.organizations;
CREATE POLICY "Users can insert their own organization"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can update their organization" ON public.organizations;
CREATE POLICY "Admins can update their organization"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  id = get_user_organization(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (id = get_user_organization(auth.uid()));

-- 10. Enable RLS on user_organization table
ALTER TABLE public.user_organization ENABLE ROW LEVEL SECURITY;

-- 11. Add RLS policies for user_organization
DROP POLICY IF EXISTS "Users can view their own organization memberships" ON public.user_organization;
CREATE POLICY "Users can view their own organization memberships"
ON public.user_organization
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view memberships in their organization" ON public.user_organization;
CREATE POLICY "Admins can view memberships in their organization"
ON public.user_organization
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  AND organization_id = get_user_organization(auth.uid())
);

-- 12. Enable RLS on api_logs table
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

-- 13. Add RLS policies for api_logs
DROP POLICY IF EXISTS "Users can view logs from their organization" ON public.api_logs;
CREATE POLICY "Users can view logs from their organization"
ON public.api_logs
FOR SELECT
TO authenticated
USING (organization_id = get_user_organization(auth.uid()));

DROP POLICY IF EXISTS "Superadmins can view all logs" ON public.api_logs;
CREATE POLICY "Superadmins can view all logs"
ON public.api_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- 14. Enable RLS on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 15. Add RLS policies for companies
DROP POLICY IF EXISTS "Users can view their company data" ON public.companies;
CREATE POLICY "Users can view their company data"
ON public.companies
FOR SELECT
TO authenticated
USING (id = get_user_organization(auth.uid()));

-- 16. Fix existing SECURITY DEFINER functions - add search_path
CREATE OR REPLACE FUNCTION public.rotate_org_api_token(org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token text := 'p42_' || encode(gen_random_bytes(24), 'hex');
BEGIN
  UPDATE public.organizations
  SET api_token = new_token
  WHERE id = org_id;
  RETURN new_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_api_usage(org uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.organizations
  SET api_message_usage = api_message_usage + 1
  WHERE id = org;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_message_org_from_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.organization_id := (
    SELECT organization_id
    FROM public.conversations
    WHERE id = NEW.conversation_id
    LIMIT 1
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role, created_at)
  VALUES (new.id, new.email, 'admin', now());
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_org_and_user(p_user_id uuid, p_org_name text, p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org UUID;
BEGIN
  INSERT INTO public.organizations (name)
  VALUES (p_org_name)
  RETURNING id INTO new_org;

  INSERT INTO public.users (id, name, email, role, organization_id)
  VALUES (p_user_id, split_part(p_email, '@', 1), p_email, 'admin', new_org);

  RETURN new_org;
END;
$$;

-- ============================================
-- IMPORTANT: ASSIGN SUPERADMIN ROLE
-- ============================================
-- After running this migration, you MUST assign the superadmin role to your account.
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users table.
-- You can find your user ID by running: SELECT id, email FROM auth.users;

-- To assign superadmin role, run:
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('YOUR_USER_ID_HERE', 'superadmin');

-- For the specific superadmin email contato@upevolution.com.br:
-- INSERT INTO public.user_roles (user_id, role) 
-- SELECT id, 'superadmin'::app_role FROM auth.users WHERE email = 'contato@upevolution.com.br';
