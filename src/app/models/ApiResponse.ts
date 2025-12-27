export interface ApiResponse<T> {
  data: T;
  msgError: string;
  errorCode: number; 
}

export interface PageResponse<T> extends ApiResponse<T> {
  totalCount: number;
}
