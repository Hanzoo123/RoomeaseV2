import { createContext } from 'react'

// Shared by the two account providers: the PHP API one and the in-browser demo one.
export const AuthContext = createContext(null)
