export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: ApiError; 
}



//defining my error type here

export interface ApiError {
    code: string;
    message: string;
    details?: 
}