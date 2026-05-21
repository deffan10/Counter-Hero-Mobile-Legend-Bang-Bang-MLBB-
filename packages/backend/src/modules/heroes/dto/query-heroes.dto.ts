import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum HeroRole {
  Tank = 'Tank',
  Fighter = 'Fighter',
  Assassin = 'Assassin',
  Mage = 'Mage',
  Marksman = 'Marksman',
  Support = 'Support',
}

export enum HeroLane {
  Gold = 'Gold',
  Exp = 'Exp',
  Mid = 'Mid',
  Roam = 'Roam',
  Jungle = 'Jungle',
}

export enum SortField {
  name = 'name',
  role = 'role',
  difficulty = 'difficulty',
  releaseDate = 'releaseDate',
  winrate = 'winrate',
}

export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

export class QueryHeroesDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  perPage?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by hero role', enum: HeroRole })
  @IsOptional()
  @IsEnum(HeroRole)
  role?: HeroRole;

  @ApiPropertyOptional({ description: 'Filter by hero lane', enum: HeroLane })
  @IsOptional()
  @IsEnum(HeroLane)
  lane?: HeroLane;

  @ApiPropertyOptional({ description: 'Sort field', enum: SortField, default: SortField.name })
  @IsOptional()
  @IsEnum(SortField)
  sort?: SortField = SortField.name;

  @ApiPropertyOptional({ description: 'Sort order', enum: SortOrder, default: SortOrder.asc })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.asc;
}

export class SearchHeroesDto {
  @ApiPropertyOptional({ description: 'Search query string' })
  @IsOptional()
  @IsString()
  q?: string;
}
