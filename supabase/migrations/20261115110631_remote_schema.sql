SET local check_function_bodies = off;

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "service_role";

CREATE TABLE "public"."objects" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"       text                     NOT NULL,
  "address"    text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "objects_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."objects"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"         uuid                     NOT NULL,
  "role"       text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_role_check" CHECK ((role = ANY (ARRAY['manager'::text, 'executor'::text])))
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."task_status_history" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "task_id"    uuid                     NOT NULL,
  "changed_by" uuid                     NOT NULL,
  "old_status" text,
  "new_status" text                     NOT NULL,
  "comment"    text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "task_status_history_new_status_check" CHECK ((new_status = ANY (ARRAY['new'::text, 'in_progress'::text, 'on_review'::text, 'accepted'::text, 'revision'::text]))),
  CONSTRAINT "task_status_history_old_status_check"
    CHECK (((old_status IS NULL) OR (old_status = ANY (ARRAY['new'::text, 'in_progress'::text, 'on_review'::text, 'accepted'::text, 'revision'::text])))),
  CONSTRAINT "task_status_history_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."task_status_history"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."task_status_history" FROM "anon";

CREATE TABLE "public"."tasks" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "title"       text                     NOT NULL,
  "description" text,
  "object_id"   uuid                     NOT NULL,
  "executor_id" uuid                     NOT NULL,
  "author_id"   uuid                     NOT NULL,
  "status"      text                     NOT NULL DEFAULT 'new'::text,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "tasks_pkey" PRIMARY KEY (id),
  CONSTRAINT "tasks_status_check" CHECK ((status = ANY (ARRAY['new'::text, 'in_progress'::text, 'on_review'::text, 'accepted'::text, 'revision'::text])))
);

ALTER TABLE "public"."tasks"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."tasks" FROM "anon";

CREATE OR REPLACE FUNCTION public.can_access_object (
  p_object_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
    SELECT
        public.is_manager()
        OR EXISTS (
            SELECT 1
            FROM public.tasks t
            WHERE t.object_id = p_object_id
              AND t.executor_id = (SELECT auth.uid())
        );
$function$;

REVOKE ALL ON FUNCTION "public"."can_access_object"(uuid) FROM PUBLIC, "anon", "service_role";

CREATE OR REPLACE FUNCTION public.change_task_status (
  p_task_id    uuid,
  p_new_status text,
  p_comment    text DEFAULT NULL::text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$

DECLARE
    v_user_id uuid;
    v_is_manager boolean;
    v_current_status text;
    v_executor_id uuid;

BEGIN

    -- Получаем ID текущего пользователя
    v_user_id := (SELECT auth.uid());
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Получаем текущий статус и исполнителя.
    -- FOR UPDATE блокирует изменение этой строки
    -- до завершения транзакции.
    SELECT
        t.status,
        t.executor_id
    INTO
        v_current_status,
        v_executor_id
    FROM public.tasks t
    WHERE t.id = p_task_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Task not found';
    END IF;

    -- Определяем роль пользователя
    v_is_manager := public.is_manager();

    -- Проверяем допустимость перехода
    IF v_is_manager THEN

        -- Менеджер может принять задачу
        -- или вернуть её на доработку.
        IF v_current_status <> 'on_review'
           OR p_new_status NOT IN ('accepted', 'revision') THEN
            RAISE EXCEPTION 'Invalid status transition for manager';
        END IF;

    ELSE

        -- Исполнитель может менять только свои задачи.
        IF v_executor_id <> v_user_id THEN
            RAISE EXCEPTION 'Access denied';
        END IF;

        -- Проверяем переходы исполнителя.
        IF NOT (
            (v_current_status = 'new'
                AND p_new_status = 'in_progress')
            OR
            (v_current_status = 'in_progress'
                AND p_new_status = 'on_review')
            OR
            (v_current_status = 'revision'
                AND p_new_status = 'in_progress')
        ) THEN
            RAISE EXCEPTION 'Invalid status transition for executor';
        END IF;
    END IF;

    -- Проверяем обязательный комментарий
    -- при возврате задачи на доработку.
    IF p_new_status = 'revision'
       AND NULLIF(BTRIM(p_comment), '') IS NULL THEN
        RAISE EXCEPTION 'Comment is required for revision';
    END IF;

    -- Обновляем статус задачи
    UPDATE public.tasks
    SET status = p_new_status
    WHERE id = p_task_id;

    -- Автоматически записываем изменение в историю
    INSERT INTO public.task_status_history (
        task_id,
        changed_by,
        old_status,
        new_status,
        comment
    )
    VALUES (
        p_task_id,
        v_user_id,
        v_current_status,
        p_new_status,
        NULLIF(BTRIM(p_comment), '')
    );
END;
$function$;

REVOKE ALL ON FUNCTION "public"."change_task_status"(uuid, text, text) FROM PUBLIC, "anon", "service_role";

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$

BEGIN

    INSERT INTO public.profiles (id, role)

    VALUES (NEW.id, 'executor');

    RETURN NEW;

END;

$function$;

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "anon", "authenticated", "service_role";

CREATE OR REPLACE FUNCTION public.is_manager()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = (SELECT auth.uid())
        AND role = 'manager'
    );
$function$;

REVOKE ALL ON FUNCTION "public"."is_manager"() FROM PUBLIC, "anon", "service_role";

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
  tbl name;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        SELECT c.relname INTO tbl FROM pg_catalog.pg_class c WHERE c.oid = cmd.objid;
        EXECUTE format('alter table if exists %I.%I enable row level security', cmd.schema_name, tbl);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "anon", "authenticated", "service_role";

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."task_status_history"
  ADD CONSTRAINT "task_status_history_changed_by_fkey" FOREIGN KEY (changed_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."tasks"
  ADD CONSTRAINT "tasks_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."tasks"
  ADD CONSTRAINT "tasks_executor_id_fkey" FOREIGN KEY (executor_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."tasks"
  ADD CONSTRAINT "tasks_object_id_fkey" FOREIGN KEY (object_id) REFERENCES public.objects(id) ON DELETE CASCADE;

ALTER TABLE "public"."task_status_history"
  ADD CONSTRAINT "task_status_history_task_id_fkey" FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "Managers can create objects" ON "public"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (( SELECT public.is_manager() AS is_manager));

CREATE POLICY "Managers can delete objects" ON "public"."objects"
  FOR DELETE
  TO "authenticated"
  USING (( SELECT public.is_manager() AS is_manager));

CREATE POLICY "Managers can update objects" ON "public"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (( SELECT public.is_manager() AS is_manager))
  WITH CHECK (( SELECT public.is_manager() AS is_manager));

CREATE POLICY "Users can read accessible objects" ON "public"."objects"
  FOR SELECT
  TO "authenticated"
  USING (public.can_access_object(id));

CREATE POLICY "Authenticated users can read all profiles" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "Managers can read all profiles" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (( SELECT public.is_manager() AS is_manager));

CREATE POLICY "Users can read own profile" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "Executors can view own task history" ON "public"."task_status_history"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.tasks t
  WHERE ((t.id = task_status_history.task_id) AND (t.executor_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "Managers can view all task history" ON "public"."task_status_history"
  FOR SELECT
  TO "authenticated"
  USING (( SELECT public.is_manager() AS is_manager));

CREATE POLICY "Managers can create tasks" ON "public"."tasks"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT public.is_manager() AS is_manager) AND (author_id = ( SELECT auth.uid() AS uid))));

CREATE POLICY "Managers can delete tasks" ON "public"."tasks"
  FOR DELETE
  TO "authenticated"
  USING (( SELECT public.is_manager() AS is_manager));

CREATE POLICY "Managers can update tasks" ON "public"."tasks"
  FOR UPDATE
  TO "authenticated"
  USING (( SELECT public.is_manager() AS is_manager))
  WITH CHECK (( SELECT public.is_manager() AS is_manager));

CREATE POLICY "Users can read accessible tasks" ON "public"."tasks"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT public.is_manager() AS is_manager) OR (executor_id = ( SELECT auth.uid() AS uid))));

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

GRANT EXECUTE ON FUNCTION "public"."can_access_object"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."can_access_object"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."can_access_object"(uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."change_task_status"(uuid, text, text) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."change_task_status"(uuid, text, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."change_task_status"(uuid, text, text) TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_manager"() TO "authenticated";

REVOKE ALL ON FUNCTION "public"."is_manager"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_manager"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO "postgres";

REVOKE ALL ON TABLE "public"."objects" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."objects" TO "anon";

REVOKE ALL ("address") ON TABLE "public"."objects" FROM "authenticated";

GRANT INSERT ("address"), UPDATE ("address") ON TABLE "public"."objects" TO "authenticated";

REVOKE ALL ("name") ON TABLE "public"."objects" FROM "authenticated";

GRANT INSERT ("name"), UPDATE ("name") ON TABLE "public"."objects" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."objects" TO "authenticated";

REVOKE ALL ON TABLE "public"."objects" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."objects" TO "postgres";

REVOKE ALL ON TABLE "public"."objects" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."objects" TO "service_role";

REVOKE ALL ON TABLE "public"."profiles" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."profiles" TO "anon";

REVOKE ALL ON TABLE "public"."profiles" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

REVOKE ALL ON TABLE "public"."profiles" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."task_status_history" FROM "authenticated";

GRANT MAINTAIN, SELECT ON TABLE "public"."task_status_history" TO "authenticated";

REVOKE ALL ON TABLE "public"."task_status_history" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."task_status_history" TO "postgres";

REVOKE ALL ON TABLE "public"."task_status_history" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."task_status_history" TO "service_role";

REVOKE ALL ON TABLE "public"."tasks" FROM "authenticated";

REVOKE ALL ("author_id") ON TABLE "public"."tasks" FROM "authenticated";

GRANT INSERT ("author_id") ON TABLE "public"."tasks" TO "authenticated";

REVOKE ALL ("description") ON TABLE "public"."tasks" FROM "authenticated";

GRANT INSERT ("description"), UPDATE ("description") ON TABLE "public"."tasks" TO "authenticated";

REVOKE ALL ("executor_id") ON TABLE "public"."tasks" FROM "authenticated";

GRANT INSERT ("executor_id"), UPDATE ("executor_id") ON TABLE "public"."tasks" TO "authenticated";

REVOKE ALL ("object_id") ON TABLE "public"."tasks" FROM "authenticated";

GRANT INSERT ("object_id"), UPDATE ("object_id") ON TABLE "public"."tasks" TO "authenticated";

REVOKE ALL ("title") ON TABLE "public"."tasks" FROM "authenticated";

GRANT INSERT ("title"), UPDATE ("title") ON TABLE "public"."tasks" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, SELECT, UPDATE ON TABLE "public"."tasks" TO "authenticated";

REVOKE ALL ON TABLE "public"."tasks" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tasks" TO "postgres";

REVOKE ALL ON TABLE "public"."tasks" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."tasks" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "service_role";

