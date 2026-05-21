export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  cache?: CacheInfo;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    status: number;
  };
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface CacheInfo {
  hit: boolean;
  ttl: number;
  cachedAt: string;
}

export interface PaginationQuery {
  page?: number;
  perPage?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface HeroFilterQuery extends PaginationQuery {
  role?: string;
  lane?: string;
  rank?: string;
}
