
-- ============================================
-- Contour A: Knowledge Staleness Detection
-- Triggers on role_knowledge and user_settings
-- ============================================

-- 1. Trigger function: detect ≥2 knowledge updates since last assignment
CREATE OR REPLACE FUNCTION public.check_knowledge_staleness()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  v_user_id uuid;
  v_last_assigned_at timestamptz;
  v_updates_since_hire int;
  v_existing_notification_id uuid;
BEGIN
  v_role := NEW.role;
  v_user_id := NEW.user_id;

  -- Find the latest active assignment for this role
  SELECT assigned_at INTO v_last_assigned_at
  FROM public.role_assignment_history
  WHERE user_id = v_user_id
    AND role = v_role
    AND removed_at IS NULL
  ORDER BY assigned_at DESC
  LIMIT 1;

  -- No active assignment — nothing to check
  IF v_last_assigned_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count knowledge entries updated after last hire
  SELECT count(*) INTO v_updates_since_hire
  FROM public.role_knowledge
  WHERE user_id = v_user_id
    AND role = v_role
    AND updated_at > v_last_assigned_at;

  -- Threshold: ≥2 updates without recertification
  IF v_updates_since_hire >= 2 THEN
    -- Check for existing unread notification to avoid duplicates
    SELECT id INTO v_existing_notification_id
    FROM public.supervisor_notifications
    WHERE user_id = v_user_id
      AND entry_code = 'knowledge_drift'
      AND is_read = false
      AND message LIKE '%' || v_role || '%'
    LIMIT 1;

    IF v_existing_notification_id IS NULL THEN
      INSERT INTO public.supervisor_notifications (user_id, entry_code, message)
      VALUES (
        v_user_id,
        'knowledge_drift',
        'Роль «' || v_role || '»: знания обновлены ' || v_updates_since_hire || ' раз(а) после найма. Рекомендуется переаттестация.'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Trigger function: detect default model change for a role
CREATE OR REPLACE FUNCTION public.check_model_change_staleness()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old_defaults jsonb;
  v_new_defaults jsonb;
  v_role text;
  v_old_model text;
  v_new_model text;
  v_has_active_assignment boolean;
  v_existing_notification_id uuid;
BEGIN
  -- Only process tech-role-defaults key
  IF NEW.setting_key != 'tech-role-defaults' THEN
    RETURN NEW;
  END IF;

  v_old_defaults := COALESCE(OLD.setting_value::jsonb, '{}'::jsonb);
  v_new_defaults := COALESCE(NEW.setting_value::jsonb, '{}'::jsonb);

  -- Iterate over roles in new defaults
  FOR v_role IN SELECT jsonb_object_keys(v_new_defaults)
  LOOP
    v_new_model := v_new_defaults ->> v_role;
    v_old_model := v_old_defaults ->> v_role;

    -- Skip if model didn't change
    IF v_old_model IS NOT DISTINCT FROM v_new_model THEN
      CONTINUE;
    END IF;

    -- Check if there's an active assignment for this role
    SELECT EXISTS(
      SELECT 1 FROM public.role_assignment_history
      WHERE user_id = NEW.user_id
        AND role = v_role
        AND removed_at IS NULL
    ) INTO v_has_active_assignment;

    IF NOT v_has_active_assignment THEN
      CONTINUE;
    END IF;

    -- Check for duplicate unread notification
    SELECT id INTO v_existing_notification_id
    FROM public.supervisor_notifications
    WHERE user_id = NEW.user_id
      AND entry_code = 'model_changed'
      AND is_read = false
      AND message LIKE '%' || v_role || '%'
    LIMIT 1;

    IF v_existing_notification_id IS NULL THEN
      INSERT INTO public.supervisor_notifications (user_id, entry_code, message)
      VALUES (
        NEW.user_id,
        'model_changed',
        'Роль «' || v_role || '»: модель по умолчанию изменена с «' || COALESCE(v_old_model, '—') || '» на «' || COALESCE(v_new_model, '—') || '». Рекомендуется переаттестация.'
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- 3. Create triggers
CREATE TRIGGER trg_knowledge_staleness
  AFTER INSERT OR UPDATE ON public.role_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION public.check_knowledge_staleness();

CREATE TRIGGER trg_model_change_staleness
  AFTER UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_model_change_staleness();
