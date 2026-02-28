
-- Contour B: Degradation trigger
-- Fires when arbiter_score < 6.0 for 3 consecutive evaluations of a model+role

CREATE OR REPLACE FUNCTION public.check_model_degradation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_model_id text;
  v_role_used text;
  v_recent_scores numeric[];
  v_all_below boolean;
  v_avg_score numeric;
  v_existing_notification_id uuid;
BEGIN
  -- Only trigger when arbiter_score is actually updated
  IF NEW.arbiter_eval_count IS NULL OR NEW.arbiter_eval_count < 1 THEN
    RETURN NEW;
  END IF;

  -- Skip if arbiter_score didn't change
  IF OLD.arbiter_score IS NOT DISTINCT FROM NEW.arbiter_score 
     AND OLD.arbiter_eval_count IS NOT DISTINCT FROM NEW.arbiter_eval_count THEN
    RETURN NEW;
  END IF;

  v_user_id := NEW.user_id;
  v_model_id := NEW.model_id;
  v_role_used := COALESCE(NEW.role_used, 'unknown');

  -- Get last 3 arbiter_score values for this user+model (across sessions)
  SELECT array_agg(ms.arbiter_score ORDER BY ms.last_used_at DESC)
  INTO v_recent_scores
  FROM (
    SELECT arbiter_score, last_used_at
    FROM public.model_statistics
    WHERE user_id = v_user_id
      AND model_id = v_model_id
      AND arbiter_eval_count > 0
    ORDER BY last_used_at DESC
    LIMIT 3
  ) ms;

  -- Need at least 3 evaluations
  IF v_recent_scores IS NULL OR array_length(v_recent_scores, 1) < 3 THEN
    RETURN NEW;
  END IF;

  -- Check if ALL 3 are below 6.0
  v_all_below := true;
  FOR i IN 1..3 LOOP
    IF v_recent_scores[i] >= 6.0 THEN
      v_all_below := false;
      EXIT;
    END IF;
  END LOOP;

  IF NOT v_all_below THEN
    RETURN NEW;
  END IF;

  -- Calculate average of the 3 scores
  v_avg_score := (v_recent_scores[1] + v_recent_scores[2] + v_recent_scores[3]) / 3.0;

  -- Check for existing unread notification to avoid duplicates
  SELECT id INTO v_existing_notification_id
  FROM public.supervisor_notifications
  WHERE user_id = v_user_id
    AND entry_code = 'model_degradation'
    AND is_read = false
    AND message LIKE '%' || v_model_id || '%'
  LIMIT 1;

  IF v_existing_notification_id IS NULL THEN
    INSERT INTO public.supervisor_notifications (user_id, entry_code, message)
    VALUES (
      v_user_id,
      'model_degradation',
      'Контур B: Модель «' || split_part(v_model_id, '/', 2) || '» (роль: ' || v_role_used || ') деградирует — среднее арбитра ' || round(v_avg_score, 1) || '/10 за последние 3 оценки. Рекомендуется переаттестация или замена.'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Attach trigger to model_statistics
CREATE TRIGGER trg_model_degradation
  AFTER UPDATE ON public.model_statistics
  FOR EACH ROW
  EXECUTE FUNCTION public.check_model_degradation();
