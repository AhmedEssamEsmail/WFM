import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Department,
  HeadcountDepartmentSummary,
  HeadcountMetricRow,
  HeadcountMetrics,
  HeadcountUser,
} from '../types';

type UserUpdatePayload = Partial<
  Pick<
    HeadcountUser,
    'employee_id' | 'status' | 'department' | 'hire_date' | 'manager_id' | 'role' | 'name'
  >
>;

type ProfileUpdatePayload = Partial<
  Pick<
    HeadcountUser,
    | 'job_title'
    | 'job_level'
    | 'employment_type'
    | 'location'
    | 'time_zone'
    | 'phone'
    | 'skills'
    | 'certifications'
    | 'max_weekly_hours'
    | 'cost_center'
    | 'budget_code'
  >
>;

const userFields: (keyof UserUpdatePayload)[] = [
  'employee_id',
  'status',
  'department',
  'hire_date',
  'manager_id',
  'role',
  'name',
];

const profileFields: (keyof ProfileUpdatePayload)[] = [
  'job_title',
  'job_level',
  'employment_type',
  'location',
  'time_zone',
  'phone',
  'skills',
  'certifications',
  'max_weekly_hours',
  'cost_center',
  'budget_code',
];

export function useHeadcount() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all employees with full details
  const getEmployees = useCallback(
    async (filters?: {
      department?: string;
      status?: string;
      role?: string;
      search?: string;
    }): Promise<HeadcountUser[]> => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase.from('v_headcount_active').select('*').order('name');

        if (filters?.department) {
          query = query.eq('department', filters.department);
        }
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.role) {
          query = query.eq('role', filters.role);
        }
        if (filters?.search) {
          const searchTerm = `%${filters.search}%`;
          query = query.or(
            `name.ilike.${searchTerm},email.ilike.${searchTerm},employee_id.ilike.${searchTerm}`
          );
        }

        const { data, error: supabaseError } = await query;

        if (supabaseError) throw supabaseError;
        return data || [];
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch employees');
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch single employee
  const getEmployee = useCallback(async (id: string): Promise<HeadcountUser | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('v_headcount_active')
        .select('*')
        .eq('id', id)
        .single();

      if (supabaseError) throw supabaseError;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employee');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update employee (WFM only)
  const updateEmployee = useCallback(async (id: string, updates: Partial<HeadcountUser>) => {
    setLoading(true);
    setError(null);

    try {
      const userUpdates: Partial<UserUpdatePayload> = {};
      const profileUpdates: Partial<ProfileUpdatePayload> = {};

      for (const [key, value] of Object.entries(updates) as Array<
        [keyof HeadcountUser, HeadcountUser[keyof HeadcountUser]]
      >) {
        if (userFields.includes(key as keyof UserUpdatePayload)) {
          (userUpdates as Record<string, unknown>)[key] = value;
        } else if (profileFields.includes(key as keyof ProfileUpdatePayload)) {
          (profileUpdates as Record<string, unknown>)[key] = value;
        }
      }

      if (Object.keys(userUpdates).length > 0) {
        const { error: userError } = await supabase.from('users').update(userUpdates).eq('id', id);

        if (userError) throw userError;
      }

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('headcount_profiles')
          .update(profileUpdates)
          .eq('user_id', id);

        if (profileError) throw profileError;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get departments list
  const getDepartments = useCallback(async (): Promise<Department[]> => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  }, []);

  // Get headcount metrics
  const getMetrics = useCallback(async (): Promise<HeadcountMetrics | null> => {
    try {
      const { data, error } = await supabase.rpc('get_headcount_metrics');

      if (error) throw error;

      const metrics: HeadcountMetrics = {
        total_active: 0,
        total_on_leave: 0,
        by_department: {},
        by_role: { agent: 0, tl: 0, wfm: 0 },
      };

      (data as HeadcountMetricRow[] | null)?.forEach((row) => {
        if (row.metric_name === 'total_active' || row.metric_name === 'total_on_leave') {
          metrics[row.metric_name] = parseInt(row.metric_value, 10) || 0;
          return;
        }

        if (row.metric_name === 'by_department') {
          const parsed = JSON.parse(row.metric_value) as Record<string, number>;
          metrics.by_department = parsed || {};
          return;
        }

        if (row.metric_name === 'by_role') {
          const parsed = JSON.parse(row.metric_value) as Record<string, number>;
          metrics.by_role = {
            agent: parsed.agent || 0,
            tl: parsed.tl || 0,
            wfm: parsed.wfm || 0,
          };
        }
      });

      return metrics;
    } catch {
      return null;
    }
  }, []);

  // Get department summary
  const getDepartmentSummary = useCallback(async (): Promise<HeadcountDepartmentSummary[]> => {
    try {
      const { data, error } = await supabase
        .from('v_department_summary')
        .select('*')
        .order('department');

      if (error) throw error;
      return (data || []) as HeadcountDepartmentSummary[];
    } catch {
      return [];
    }
  }, []);

  // Bulk import employees from CSV
  const bulkImportEmployees = useCallback(async (employees: Partial<HeadcountUser>[]) => {
    setLoading(true);
    setError(null);

    try {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as { row: number; email: string; error: string }[],
      };

      for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];

        try {
          if (!emp.email || !emp.name) {
            results.failed++;
            results.errors.push({
              row: i + 2,
              email: emp.email || 'unknown',
              error: 'Missing required fields (email or name)',
            });
            continue;
          }

          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', emp.email)
            .single();

          if (existingUser) {
            const userUpdates: Partial<UserUpdatePayload> = {};
            const profileUpdates: Partial<ProfileUpdatePayload> = {};

            Object.entries(emp).forEach(([key, value]) => {
              if (value !== undefined && value !== '') {
                if (userFields.includes(key as keyof UserUpdatePayload)) {
                  (userUpdates as Record<string, unknown>)[key] = value;
                } else if (profileFields.includes(key as keyof ProfileUpdatePayload)) {
                  (profileUpdates as Record<string, unknown>)[key] = value;
                }
              }
            });

            if (Object.keys(userUpdates).length > 0) {
              const { error: userError } = await supabase
                .from('users')
                .update(userUpdates)
                .eq('id', existingUser.id);

              if (userError) throw userError;
            }

            if (Object.keys(profileUpdates).length > 0) {
              const { error: profileError } = await supabase.from('headcount_profiles').upsert(
                {
                  user_id: existingUser.id,
                  ...profileUpdates,
                },
                {
                  onConflict: 'user_id',
                }
              );

              if (profileError) throw profileError;
            }
          } else {
            results.failed++;
            results.errors.push({
              row: i + 2,
              email: emp.email,
              error: 'User does not exist in auth system. Please create user account first.',
            });
            continue;
          }

          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            email: emp.email || 'unknown',
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import employees');
      return {
        success: 0,
        failed: employees.length,
        errors: [
          { row: 0, email: 'all', error: err instanceof Error ? err.message : 'Unknown error' },
        ],
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getEmployees,
    getEmployee,
    updateEmployee,
    getDepartments,
    getMetrics,
    getDepartmentSummary,
    bulkImportEmployees,
  };
}
