import { MutationCache, QueryClient } from '@tanstack/react-query'
import { getApiErrorMessage } from '@shared/api'
import { notifyUser } from '@shared/utils'

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      silentGlobalError?: boolean
    }
  }
}

export const createQueryClient = () => {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.silentGlobalError) return
        notifyUser(getApiErrorMessage(error))
      },
    }),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  })
}
