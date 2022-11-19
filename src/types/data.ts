export interface AddToSetResult<T> {
  alreadyExists: boolean,
  item: T
}

export interface ErrorMessage {
  message: string
}

export interface ListResponse<T> {
  items: Array<T>,
  pageNum: number,
  pageSize: number,
  totalItems: number,
  totalPages: number
}

export interface PointlessError {
  error: Error | ErrorMessage
}

export interface RemoveResult {
  id: string,
  notAMember: boolean
}
