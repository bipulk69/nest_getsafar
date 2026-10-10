import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';

type UserLocationRow = {
  user_id: number;
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
  country: string | null;
  accuracy_m: number | null;
  observed_at: Date | null;
  updated_at: Date;
};

@Injectable()
export class LocationsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async updateCurrentLocation(userId: number, location: UpdateLocationDto) {
    const result = await this.databaseService.query<UserLocationRow>(
      `INSERT INTO user_locations (
        user_id, latitude, longitude, accuracy_m, observed_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        city = NULL,
        state = NULL,
        country = NULL,
        accuracy_m = EXCLUDED.accuracy_m,
        observed_at = EXCLUDED.observed_at,
        updated_at = CURRENT_TIMESTAMP
      RETURNING user_id, latitude, longitude, city, state, country,
        accuracy_m, observed_at, updated_at`,
      [
        userId,
        location.latitude,
        location.longitude,
        location.accuracyM ?? null,
        location.observedAt ?? null,
      ],
    );

    return this.toResponse(result.rows[0]);
  }

  async getCurrentLocation(userId: number) {
    const result = await this.databaseService.query<UserLocationRow>(
      `SELECT user_id, latitude, longitude, city, state, country,
        accuracy_m, observed_at, updated_at
      FROM user_locations
      WHERE user_id = $1`,
      [userId],
    );

    if (!result.rows[0]) {
      throw new NotFoundException('No current location has been saved');
    }

    return this.toResponse(result.rows[0]);
  }

  async deleteCurrentLocation(userId: number) {
    const result = await this.databaseService.query<{ user_id: number }>(
      `DELETE FROM user_locations
      WHERE user_id = $1
      RETURNING user_id`,
      [userId],
    );

    return {
      message: result.rowCount ? 'Location sharing stopped' : 'No location was saved',
    };
  }

  private toResponse(row: UserLocationRow) {
    return {
      userId: row.user_id,
      currentLocation: {
        latitude: row.latitude,
        longitude: row.longitude,
      },
      city: row.city,
      state: row.state,
      country: row.country,
      accuracyM: row.accuracy_m,
      observedAt: row.observed_at,
      updatedAt: row.updated_at,
    };
  }
}