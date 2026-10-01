export type ApiResponse<T> = {
  dataResponse: T
  message: string
  statusCode: number
  timestamp: string
}
