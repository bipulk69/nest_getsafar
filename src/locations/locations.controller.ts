import {
  Body,
  Controller,
  Delete,
  Get,
  Put,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';
import { LocationsService } from './locations.service.js';

@Controller('me/location')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Put()
  @UsePipes(ZodValidationPipe)
  updateCurrentLocation(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateLocationDto,
  ) {
    return this.locationsService.updateCurrentLocation(request.user.userId, body);
  }

  @Get()
  getCurrentLocation(@Req() request: AuthenticatedRequest) {
    return this.locationsService.getCurrentLocation(request.user.userId);
  }

  @Delete()
  deleteCurrentLocation(@Req() request: AuthenticatedRequest) {
    return this.locationsService.deleteCurrentLocation(request.user.userId);
  }
}