const DEFAULT_PAGESIZE = 10;

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginationMetaResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMetaResponse;
}

export const getPaginationParams = (params: PaginationParams) => {
  const page = params.page || 1;
  const pageSize = params.pageSize || DEFAULT_PAGESIZE;
  const skip = (page - 1) * pageSize;

  return {
    skip,
    take: pageSize,
    page,
    pageSize,
  };
};

export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> => {
  return {
    data,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};
