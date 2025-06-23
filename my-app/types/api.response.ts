
// defining my generic api wrapper for any response with the shape of the data returning of <T> 

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
