import { useAuth } from '../../hooks/useAuth'

interface ProtectedEditProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function ProtectedEdit({ children, fallback }: ProtectedEditProps) {
  const { canEditHeadcount } = useAuth()
  
  if (canEditHeadcount()) {
    return <>{children}</>
  }
  
  return fallback ? <>{fallback}</> : null
}



