import { ApiProperty } from '@nestjs/swagger';
import { Type } from '@nestjs/common';
import { PaginatedResponse, PaginationMetaResponse } from '../utils/pagination';

// Base class
export abstract class PaginationResultDto<T> {
  data: T[];
  meta: PaginationMetaResponse;

  constructor(data: PaginatedResponse<T>) {
    this.data = data.data;
    this.meta = data.meta;
  }
}

// Factory function
export function createPaginationDto<T>(ItemType: Type<T>) {
  class PaginationDto extends PaginationResultDto<T> {
    @ApiProperty({
      type: ItemType,
      isArray: true,
    })
    declare data: T[];

    @ApiProperty({
      type: 'object',
      properties: {
        total: { type: 'number' },
        page: { type: 'number' },
        pageSize: { type: 'number' },
        totalPages: { type: 'number' },
      },
      additionalProperties: false,
      example: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
    })
    declare meta: PaginationMetaResponse;
  }

  // Return class constructor
  return PaginationDto;
}

export abstract class InfinitePaginationResultDto<T> {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      additionalProperties: true,
      description: 'Array of items in the current page',
    },
    example: [],
    description: 'Array of items in the current page',
  })
  data!: T[];

  @ApiProperty({
    type: 'boolean',
    description: 'Indicates if there are more pages available',
    example: false,
  })
  hasNextPage!: boolean;
}

export function createInfinitePaginationDto<T>(ItemType: Type<T>) {
  class InfinitePaginationDto extends InfinitePaginationResultDto<T> {
    @ApiProperty({
      type: ItemType,
      isArray: true,
    })
    declare data: T[];

    @ApiProperty({
      type: 'boolean',
    })
    declare hasNextPage: boolean;
  }

  return InfinitePaginationDto;
}
