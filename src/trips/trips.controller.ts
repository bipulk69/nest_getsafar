import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { CreateTripRequestDto } from './dto/create-trip-request.dto.js';
import { TripsService } from './trips.service.js';

@Controller('trip-requests')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @UsePipes(ZodValidationPipe)
  createTripRequest(@Body() body: CreateTripRequestDto) {
    return this.tripsService.createTripRequest(body);
  }
}