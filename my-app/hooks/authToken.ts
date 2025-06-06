import * as SecureStore from 'expo-secure-store';



export async function setToken(jwtToken: string) {
    try {
        await SecureStore.setItemAsync('jwtToken', jwtToken)
        
    } catch (error) {
        console.error('error setting token', error);
    }
}


export async function getToken() { 
    try {
        const token = await SecureStore.getItemAsync('jwtToken');
        if (token) {
            return token;
        } else {
            return null;
        }
    } catch (error) {
        console.error('error getting token', error)
    }
}