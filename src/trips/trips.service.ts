import { Injectable } from "@nestjs/common";
import { CreateTripRequestDto } from './dto/create-trip-request.dto.js';


@Injectable()
export class TripsService {
  createTripRequest(request: CreateTripRequestDto) {
    return {
      message: 'Trip request received',
      status: 'received',
      request,
    };
  }
}