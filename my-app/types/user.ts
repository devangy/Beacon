export interface User {
    id: string;
    username: string;
    avatarUrl: string;
    createdAt?: string;
    publicKeys?: PublicKey[];
}

export interface PublicKey {
    id: string;
    userId: string;
    key: string;
    isActive: boolean; // key active or revoked
    createdAt: string;
}
