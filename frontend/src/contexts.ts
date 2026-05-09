import { createContext, useContext } from 'react'
import { User } from './types'

type UserContextType = { user: User | null }
export const UserContext = createContext<UserContextType>({ user: null })
export const useUser = () => useContext(UserContext)
