import { AbstractModel } from './model.abstract';
import { Logger, NotFoundException } from '@nestjs/common';
import {
  PaginatedResponse,
  PaginationParams,
  createPaginatedResponse,
  getPaginationParams,
} from '../utils/pagination';
import { PaginationRequestDto } from '../dtos';

export interface FindManyOptions<FilterType = Record<string, unknown>> {
  filters?: FilterType;
  sort?: Record<string, 'asc' | 'desc'>;
  pagination?: PaginationParams;
}

/**
 * Convert PaginationRequestDto to FindManyOptions
 * @param dto PaginationRequestDto instance
 * @returns FindManyOptions object
 */
export function convertDtoToFindOptions<T>(
  dto: PaginationRequestDto<T>
): FindManyOptions<Record<string, unknown>> {
  return {
    filters: dto.filters as Record<string, unknown>,
    sort: dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'asc' } : undefined,
    pagination: {
      page: dto.page,
      pageSize: dto.pageSize,
    },
  };
}

export abstract class AbstractRepository<
  Model extends AbstractModel,
  CreateDto = unknown,
  UpdateDto = unknown,
  FilterType = Record<string, unknown>,
  PrismaDelegate = unknown
> {
  protected abstract readonly logger: Logger;

  // Protected reference to the Prisma model delegate
  protected abstract readonly prismaDelegate: PrismaDelegate;
  /**
   * Create a new entity
   * @param createDto - Data to create the entity
   * @returns The created entity
   */
  abstract create(createDto: CreateDto): Promise<Model>;

  /**
   * Create multiple entities in a batch operation
   * @param createDtos - Array of data to create entities
   * @returns The created entities
   */
  abstract createMany(createDtos: CreateDto[]): Promise<{ count: number }>;

  /**
   * Find an entity by id or other unique identifier
   * @param id - Unique identifier
   * @returns The entity or null if not found
   */
  abstract findOne(id: string): Promise<Model | null>;

  /**
   * Find an entity by filter criteria
   * @param where - Filter conditions
   * @returns The entity or null if not found
   */
  abstract findOneByFilter(where: FilterType): Promise<Model | null>;

  /**
   * Find an entity by id or throw an exception if not found
   * @param id - Unique identifier
   * @returns The entity
   * @throws NotFoundException if entity not found
   */
  async findOneOrThrow(id: string): Promise<Model> {
    const entity = await this.findOne(id);
    if (!entity) {
      this.logger.error(`Entity with id ${id} not found`);
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
    return entity;
  }

  /**
   * Find an entity by filter criteria or throw an exception
   * @param where - Filter conditions
   * @returns The entity
   * @throws NotFoundException if entity not found
   */
  async findOneByFilterOrThrow(where: FilterType): Promise<Model> {
    const entity = await this.findOneByFilter(where);
    if (!entity) {
      this.logger.error(
        `Entity not found with filter: ${JSON.stringify(where)}`
      );
      throw new NotFoundException(`Entity not found with specified criteria`);
    }
    return entity;
  }

  /**
   * Update an entity
   * @param id - Unique identifier
   * @param updateDto - Data to update
   * @returns The updated entity or null if not found
   */
  abstract update(id: string, updateDto: UpdateDto): Promise<Model | null>;
  /**
   * Update an entity or throw an exception if not found
   * @param id - Unique identifier
   * @param updateDto - Data to update
   * @returns The updated entity
   * @throws NotFoundException if entity not found
   */
  async updateOneOrThrow(id: string, updateDto: UpdateDto): Promise<Model> {
    const entity = await this.update(id, updateDto);
    if (!entity) {
      this.logger.error(`Entity with id ${id} not found for update`);
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
    return entity;
  }

  /**
   * Update multiple entities matching filter
   * @param where - Filter conditions
   * @param updateDto - Data to update
   * @returns Number of entities updated
   */
  abstract updateMany(
    where: FilterType,
    updateDto: Partial<UpdateDto>
  ): Promise<{ count: number }>;

  /**
   * Find or create entity if it doesn't exist
   * @param where - Filter conditions
   * @param createDto - Data to create entity if not found
   * @returns The found or created entity
   */
  abstract upsert(
    where: FilterType,
    createDto: CreateDto,
    updateDto: UpdateDto
  ): Promise<Model>;
  /**
   * Find multiple entities with filtering, sorting, and pagination
   * @param options - Query options
   * @returns Array of entities
   */
  abstract findMany(options?: FindManyOptions<FilterType>): Promise<Model[]>;

  /**
   * Find multiple entities using PaginationRequestDto
   * @param dto - Pagination request DTO
   * @returns Array of entities
   */
  async findManyWithDto<T>(dto: PaginationRequestDto<T>): Promise<Model[]> {
    const options = convertDtoToFindOptions(dto);
    return this.findMany(options as FindManyOptions<FilterType>);
  }

  /**
   * Find multiple entities or throw an exception if none found
   * @param options - Query options
   * @returns Array of entities
   * @throws NotFoundException if no entities found
   */
  async findManyOrThrow(
    options?: FindManyOptions<FilterType>
  ): Promise<Model[]> {
    const entities = await this.findMany(options);
    if (!entities.length) {
      this.logger.warn('No entities found matching criteria');
      throw new NotFoundException('No entities found matching criteria');
    }
    return entities;
  }

  /**
   * Find multiple entities with DTO or throw an exception if none found
   * @param dto - Pagination request DTO
   * @returns Array of entities
   * @throws NotFoundException if no entities found
   */
  async findManyWithDtoOrThrow<T>(
    dto: PaginationRequestDto<T>
  ): Promise<Model[]> {
    const options = convertDtoToFindOptions(dto);
    return this.findManyOrThrow(options as FindManyOptions<FilterType>);
  }

  /**
   * Count entities matching filter criteria
   * @param filters - Filter criteria
   * @returns Count of matching entities
   */
  abstract count(filters?: FilterType): Promise<number>;
  /**
   * Get paginated results
   * @param options - Query options
   * @returns Paginated response with data and meta information
   */
  async getPaginatedResults(
    options?: FindManyOptions<FilterType>
  ): Promise<PaginatedResponse<Model>> {
    const filters = options?.filters || ({} as FilterType);
    const sort = options?.sort || { createdAt: 'desc' };
    const pagination = getPaginationParams(options?.pagination || {});

    // Get entities with pagination
    const paginationOptions: FindManyOptions<FilterType> = {
      filters,
      sort,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
      },
    };

    // Execute both queries in parallel for better performance
    const [entities, total] = await Promise.all([
      this.findMany(paginationOptions),
      this.count(filters),
    ]);

    // Create and return paginated response
    return createPaginatedResponse<Model>(
      entities,
      total,
      pagination.page,
      pagination.pageSize
    );
  }

  /**
   * Get paginated results using PaginationRequestDto
   * @param dto - Pagination request DTO
   * @returns Paginated response with data and meta information
   */
  async getPaginatedResultsWithDto<T>(
    dto: PaginationRequestDto<T>
  ): Promise<PaginatedResponse<Model>> {
    const options = convertDtoToFindOptions(dto);
    return this.getPaginatedResults(options as FindManyOptions<FilterType>);
  }
  /**
   * Delete an entity by id (soft delete if supported)
   * @param id - Unique identifier
   * @returns True if deleted, false if not found
   */
  abstract delete(id: string): Promise<boolean>;

  /**
   * Delete multiple entities by filter
   * @param where - Filter conditions
   * @returns Number of entities deleted
   */
  abstract deleteMany(where: FilterType): Promise<{ count: number }>;

  /**
   * Delete an entity by id or throw if not found
   * @param id - Unique identifier
   * @returns True when deleted successfully
   * @throws NotFoundException if entity not found
   */
  async deleteOrThrow(id: string): Promise<boolean> {
    const deleted = await this.delete(id);
    if (!deleted) {
      this.logger.error(`Entity with id ${id} not found for deletion`);
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
    return deleted;
  }

  /**
   * Execute operations within a transaction
   * @param fn - Function containing operations to execute in transaction
   * @returns Result of the transaction function
   */
  abstract transaction<T>(
    fn: (prismaDelegate: PrismaDelegate) => Promise<T>
  ): Promise<T>;
}
