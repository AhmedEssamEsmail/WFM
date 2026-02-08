-- Migration: Atomic Swap Execution Stored Procedure
-- Purpose: Execute shift swaps atomically to prevent partial updates and data inconsistency
-- Date: 2024

-- Drop function if exists (for idempotency)
DROP FUNCTION IF EXISTS execute_shift_swap(UUID, UUID, DATE, DATE);

-- Create stored procedure for atomic shift swap execution
CREATE OR REPLACE FUNCTION execute_shift_swap(
  p_requester_id UUID,
  p_target_user_id UUID,
  p_requester_date DATE,
  p_target_date DATE
) RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_requester_shift_on_requester_date shifts%ROWTYPE;
  v_target_shift_on_requester_date shifts%ROWTYPE;
  v_requester_shift_on_target_date shifts%ROWTYPE;
  v_target_shift_on_target_date shifts%ROWTYPE;
  v_result JSON;
BEGIN
  -- Step 1: Find all 4 shift records within transaction
  -- Lock rows for update to prevent concurrent modifications
  
  -- Requester's shift on requester's date
  SELECT * INTO v_requester_shift_on_requester_date
  FROM shifts
  WHERE user_id = p_requester_id AND date = p_requester_date
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shift not found for requester on requester date: user_id=%, date=%', 
      p_requester_id, p_requester_date;
  END IF;
  
  -- Target's shift on requester's date
  SELECT * INTO v_target_shift_on_requester_date
  FROM shifts
  WHERE user_id = p_target_user_id AND date = p_requester_date
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shift not found for target on requester date: user_id=%, date=%', 
      p_target_user_id, p_requester_date;
  END IF;
  
  -- Requester's shift on target's date
  SELECT * INTO v_requester_shift_on_target_date
  FROM shifts
  WHERE user_id = p_requester_id AND date = p_target_date
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shift not found for requester on target date: user_id=%, date=%', 
      p_requester_id, p_target_date;
  END IF;
  
  -- Target's shift on target's date
  SELECT * INTO v_target_shift_on_target_date
  FROM shifts
  WHERE user_id = p_target_user_id AND date = p_target_date
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shift not found for target on target date: user_id=%, date=%', 
      p_target_user_id, p_target_date;
  END IF;
  
  -- Step 2: Execute all 4 shift updates atomically
  -- Swap shift types between requester and target on both dates
  
  -- Update requester's shift on requester's date (gets target's shift type from requester's date)
  UPDATE shifts
  SET shift_type = v_target_shift_on_requester_date.shift_type,
      updated_at = NOW()
  WHERE user_id = p_requester_id AND date = p_requester_date;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update requester shift on requester date';
  END IF;
  
  -- Update target's shift on requester's date (gets requester's shift type from requester's date)
  UPDATE shifts
  SET shift_type = v_requester_shift_on_requester_date.shift_type,
      updated_at = NOW()
  WHERE user_id = p_target_user_id AND date = p_requester_date;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update target shift on requester date';
  END IF;
  
  -- Update requester's shift on target's date (gets target's shift type from target's date)
  UPDATE shifts
  SET shift_type = v_target_shift_on_target_date.shift_type,
      updated_at = NOW()
  WHERE user_id = p_requester_id AND date = p_target_date;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update requester shift on target date';
  END IF;
  
  -- Update target's shift on target's date (gets requester's shift type from target's date)
  UPDATE shifts
  SET shift_type = v_requester_shift_on_target_date.shift_type,
      updated_at = NOW()
  WHERE user_id = p_target_user_id AND date = p_target_date;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update target shift on target date';
  END IF;
  
  -- Step 3: Build success response
  v_result := json_build_object(
    'success', true,
    'message', 'Shift swap executed successfully',
    'updated_shifts', json_build_object(
      'requester_on_requester_date', json_build_object(
        'id', v_requester_shift_on_requester_date.id,
        'user_id', p_requester_id,
        'date', p_requester_date,
        'old_shift_type', v_requester_shift_on_requester_date.shift_type,
        'new_shift_type', v_target_shift_on_requester_date.shift_type
      ),
      'target_on_requester_date', json_build_object(
        'id', v_target_shift_on_requester_date.id,
        'user_id', p_target_user_id,
        'date', p_requester_date,
        'old_shift_type', v_target_shift_on_requester_date.shift_type,
        'new_shift_type', v_requester_shift_on_requester_date.shift_type
      ),
      'requester_on_target_date', json_build_object(
        'id', v_requester_shift_on_target_date.id,
        'user_id', p_requester_id,
        'date', p_target_date,
        'old_shift_type', v_requester_shift_on_target_date.shift_type,
        'new_shift_type', v_target_shift_on_target_date.shift_type
      ),
      'target_on_target_date', json_build_object(
        'id', v_target_shift_on_target_date.id,
        'user_id', p_target_user_id,
        'date', p_target_date,
        'old_shift_type', v_target_shift_on_target_date.shift_type,
        'new_shift_type', v_requester_shift_on_target_date.shift_type
      )
    )
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error details in JSON format
    v_result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE,
      'message', 'Shift swap failed: ' || SQLERRM
    );
    RETURN v_result;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION execute_shift_swap(UUID, UUID, DATE, DATE) IS 
'Atomically executes a shift swap between two users on two dates. All 4 shift updates occur within a single transaction to ensure data consistency. Returns JSON with success status and updated shift details.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_shift_swap(UUID, UUID, DATE, DATE) TO authenticated;
