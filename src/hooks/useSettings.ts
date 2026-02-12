import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import { STALE_TIMES, QUERY_KEYS } from '../constants/cache'

interface Setting {
  key: string
  value: string
}

export function useSettings() {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  // Fetch all settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.SETTINGS],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')

      if (error) throw error
      
      // Convert array to object for easier access
      const settingsObj: Record<string, string> = {}
      data?.forEach((setting: Setting) => {
        settingsObj[setting.key] = setting.value
      })
      
      return settingsObj
    },
    staleTime: STALE_TIMES.SETTINGS, // 10 minutes - settings rarely change
  })

  // Get specific setting
  const getSetting = (key: string, defaultValue: string = '') => {
    return settings?.[key] || defaultValue
  }

  // Update setting mutation
  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data, error } = await supabase
        .from('settings')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SETTINGS] })
      success('Setting updated successfully!')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update setting')
    },
  })

  return {
    settings,
    isLoading,
    error,
    getSetting,
    updateSetting,
  }
}
