import { useAppSelector } from "./hooks"

export const useAuth = () => {
    const token = useAppSelector((state) => state.auth.accessToken);
    if (!token) {
        return {
            isAuthenticated : false
        }
    }

    return {
        isAuthenticated: true
    }
}