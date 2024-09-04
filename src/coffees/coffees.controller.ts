import { Controller, Get, Param, Body, Post, HttpCode, HttpStatus, Patch, Delete, Query, SetMetadata } from '@nestjs/common';
import { CoffeesService } from './coffees.service';
import { CreateCoffeeDto } from './dto/create-coffee.dto/create-coffee.dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto/update-coffee.dto';
import { ApiForbiddenResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../src/common/decorators/public.decorator';
import { ParseIntPipe } from '../../src/common/pipes/parse-int/parse-int.pipe';
import { Protocol } from '../../src/common/decorators/protocol.decorator';
import { PaginationQueryDto } from '../../src/common/dto/pagination-query.dto';

@ApiTags('coffees')
@Controller('coffees')
export class CoffeesController {
  constructor(private readonly coffeesService: CoffeesService) {}

  @ApiForbiddenResponse({ status: 403, description: 'Forbidden.' })
  @Public()
  @Get()
  async findAll(@Protocol('https') protocol: string, @Query() paginationQuery: PaginationQueryDto) { 
    // console.log(protocol)
    // await new Promise(resolve => setTimeout(resolve, 5000))
    return this.coffeesService.findAll(paginationQuery)
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.coffeesService.findOne(id)
  }

  @Post()
  create(@Body() createCoffeeDto: CreateCoffeeDto) {
    console.log(createCoffeeDto instanceof CreateCoffeeDto)
    return this.coffeesService.create(createCoffeeDto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCoffeeDto: UpdateCoffeeDto) {
   return this.coffeesService.update(id, updateCoffeeDto)
  }
  
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.coffeesService.remove(id)
  }
}
