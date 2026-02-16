import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { skillsService } from '../services/skillsService'
import type { Skill } from '../types'
import { useToast } from '../contexts/ToastContext'
import { QUERY_KEYS, STALE_TIMES } from '../constants/cache'

export function useSkills(activeOnly: boolean = false) {
  const queryClient = useQueryClient()
  const { success, error: showError } = useToast()

  // Fetch skills (active or all)
  const { data: skills, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.SKILLS, activeOnly],
    queryFn: () => skillsService.getSkills(activeOnly),
    staleTime: STALE_TIMES.SETTINGS, // 10 minutes - rarely changes
  })

  // Create skill mutation
  const createSkill = useMutation({
    mutationFn: (newSkill: Omit<Skill, 'id' | 'created_at' | 'updated_at'>) =>
      skillsService.createSkill(newSkill),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SKILLS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] })
      success('Skill created successfully!')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to create skill')
    },
  })

  // Update skill mutation
  const updateSkill = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Skill> }) =>
      skillsService.updateSkill(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SKILLS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] })
      success('Skill updated successfully!')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to update skill')
    },
  })

  // Delete skill mutation
  const deleteSkill = useMutation({
    mutationFn: (id: string) => skillsService.deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SKILLS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] })
      success('Skill deleted successfully!')
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to delete skill')
    },
  })

  return {
    skills: skills || [],
    isLoading,
    error,
    createSkill,
    updateSkill,
    deleteSkill,
  }
}
