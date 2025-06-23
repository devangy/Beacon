import * as SecureStore from 'expo-secure-store';



export async function setToken(refreshToken: string) : Promise<boolean> {
    try {
        await SecureStore.setItemAsync('refreshToken', refreshToken)
        return true
        
    } catch (error) {
        console.error('error setting token', error);
        throw new Error('Failed to store token');
    }
}


export async function getToken() : Promise<string | null> { 
    try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
            return refreshToken;
        } else {
            return null;
        }
    } catch (error) {
        console.error('error getting token', error)
        throw new Error('Failed to retrieve token');
    }
}