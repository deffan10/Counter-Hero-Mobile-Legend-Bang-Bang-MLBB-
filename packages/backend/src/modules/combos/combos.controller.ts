import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiQuery, ApiNotFoundResponse } from '@nestjs/swagger';
import { CombosService } from './combos.service';

@ApiTags('Combos')
@Controller('combos')
export class CombosController {
  constructor(private readonly combosService: CombosService) {}

  @Get()
  @ApiOperation({ summary: 'List all hero combos with pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'perPage', required: false, description: 'Items per page', example: 20 })
  @ApiOkResponse({ description: 'Paginated list of hero combos' })
  findAll(@Query('page') page?: string, @Query('perPage') perPage?: string) {
    return this.combosService.findAll(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get combo detail by ID' })
  @ApiParam({ name: 'id', description: 'Combo ID' })
  @ApiOkResponse({ description: 'Combo detail with heroes' })
  @ApiNotFoundResponse({ description: 'Combo not found' })
  findById(@Param('id') id: string) {
    return this.combosService.findById(parseInt(id, 10));
  }
}
