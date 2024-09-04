import { HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Coffee } from './entities/coffee.entity';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Event } from '../events/entities/event.entity/event.entity'

@Injectable()
export class CoffeesService {

  constructor(
    @InjectModel(Coffee.name) private readonly coffeeModel: Model<Coffee>,
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Event.name) private readonly eventModel: Model<Event>
  ) {}

  async findAll(paginationQuery: PaginationQueryDto) {
    const { limit, offset } = paginationQuery

    return await this.coffeeModel.find().skip(offset).limit(limit)
  }

  async findOne(id: string) {
    const coffee = await this.coffeeModel.findById(id)

    if (!coffee) throw new NotFoundException(`Coffee #${id} not found`)

    return coffee
  }

  async create(createCoffeeDto: any) {
    const coffee = await this.coffeeModel.create(createCoffeeDto)

    return coffee
  }

  async update(id: string, updateCoffeeDto: any) {
    const existingCoffee = await this.coffeeModel
      .findOneAndUpdate({ _id: id }, { $set: updateCoffeeDto }, { new: true })

    if (existingCoffee) throw new NotFoundException(`Coffe #${id} not found`)

    return existingCoffee
  }

  async remove(id: string) {
    await this.coffeeModel.findOneAndDelete({ _id: id })
  }

  async recommendCoffee(coffee: Coffee) {
    const session = await this.connection.startSession()
    session.startTransaction()

    try {
      coffee.recommedations++

      const recommendEvent = new this.eventModel({
        name: 'recommend_coffee',
        type: 'coffe',
        payload: { coffeeId: coffee.id }
      })

      await recommendEvent.save({ session })
      await coffee.save({ session })

      await session.commitTransaction()
    } catch (e) {
      await session.abortTransaction()
    } finally {
      session.endSession()
    }
  }
}
