import { HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Coffee } from './entities/coffee.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { CreateCoffeeDto } from './dto/create-coffee.dto/create-coffee.dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto/update-coffee.dto';
import { Flavor } from './entities/flavor.entity';
import { Event } from '../events/entities/event.entity/event.entity'
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { ConfigService, ConfigType } from '@nestjs/config';
import coffeesConfig from './config/coffees.config';

@Injectable()
export class CoffeesService {

  constructor(
    @InjectRepository(Coffee) private readonly coffeeRepository: Repository<Coffee>,
    @InjectRepository(Flavor) private readonly flavorRepository: Repository<Flavor>,
    private readonly connection: Connection,
    // private readonly configService: ConfigService,
    // @Inject(coffeesConfig.KEY) private readonly coffeesConfiguration: ConfigType<typeof coffeesConfig>
  ) {
    // console.log(this.coffeesConfiguration.foo)
  }

  async findAll(paginationQuery: PaginationQueryDto) {
    const { limit, offset } = paginationQuery

    return await this.coffeeRepository.find({ 
      relations: ['flavors'],
      skip: offset,
      take: limit
    })
  }

  async findOne(id: number) {
    const coffee = await this.coffeeRepository.findOne({ where: { id }, relations: ['flavors']})

    if (!coffee) throw new NotFoundException(`Coffee #${id} not found`)

    return coffee
  }

  async create(createCoffeeDto: CreateCoffeeDto) {
    const flavors = await Promise.all(
      createCoffeeDto.flavors.map(name => this.preloadFlavorByName(name))
    )

    const coffee = this.coffeeRepository.create({
      ...createCoffeeDto,
      flavors
    })

    return await this.coffeeRepository.save(coffee)
  }

  async update(id: string, updateCoffeeDto: UpdateCoffeeDto) {
    const flavors = 
      updateCoffeeDto.flavors && 
      (await Promise.all(
        updateCoffeeDto.flavors.map(name => this.preloadFlavorByName(name))
      ))

    const coffee = await this.coffeeRepository.preload({
      id: +id,
      ...updateCoffeeDto,
      flavors
    })

    if (!coffee) throw new NotFoundException(`Coffee #${id} not found`)
    
    return await this.coffeeRepository.save(coffee)
  
  }

  async remove(id: number) {
    const coffee = await this.findOne(id)

    return await this.coffeeRepository.remove(coffee)
  }

  async recommendCoffee(coffee: Coffee) {
    const queryRunner = this.connection.createQueryRunner()

    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      coffee.recommendations++

      const recommendedEvent = new Event()
      recommendedEvent.name = 'recommended_coffee'
      recommendedEvent.type = 'coffee'
      recommendedEvent.payload = { coffeeId: coffee.id }

      await queryRunner.manager.save(coffee)
      await queryRunner.manager.save(recommendedEvent)

      await queryRunner.commitTransaction()
    } catch (err) {
      await queryRunner.rollbackTransaction()
    } finally {
      await queryRunner.release()
    }
  }

  private async preloadFlavorByName(name: string): Promise<Flavor> {
    const existingFLavor = await this.flavorRepository.findOne({ where: { name }})

    if (existingFLavor) return existingFLavor

    return this.flavorRepository.create({ name })
  }
}
