import { NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../src/database/database.service.js';
import { LocationsService } from '../src/locations/locations.service.js';

const locationRow = {
  user_id: 8,
  latitude: 27.7172,
  longitude: 85.324,
  city: null,
  state: null,
  country: null,
  accuracy_m: 12,
  observed_at: new Date('2026-10-08T10:00:00.000Z'),
  updated_at: new Date('2026-10-08T10:00:01.000Z'),
};

describe('LocationsService', () => {
  let databaseService: { query: ReturnType<typeof vi.fn> };
  let locationsService: LocationsService;

  beforeEach(() => {
    databaseService = { query: vi.fn() };
    locationsService = new LocationsService(
      databaseService as unknown as DatabaseService,
    );
  });

  it('upserts the current location for the authenticated user', async () => {
    databaseService.query.mockResolvedValueOnce({ rows: [locationRow] });

    const result = await locationsService.updateCurrentLocation(8, {
      latitude: locationRow.latitude,
      longitude: locationRow.longitude,
      accuracyM: locationRow.accuracy_m,
      observedAt: locationRow.observed_at.toISOString(),
    });

    expect(databaseService.query.mock.calls[0][1]).toEqual([
      8,
      locationRow.latitude,
      locationRow.longitude,
      locationRow.accuracy_m,
      locationRow.observed_at.toISOString(),
    ]);
    expect(result).toMatchObject({
      userId: 8,
      currentLocation: {
        latitude: locationRow.latitude,
        longitude: locationRow.longitude,
      },
    });
  });

  it('returns only the location belonging to the requested authenticated user', async () => {
    databaseService.query.mockResolvedValueOnce({ rows: [locationRow] });

    const result = await locationsService.getCurrentLocation(8);

    expect(databaseService.query.mock.calls[0][1]).toEqual([8]);
    expect(result.userId).toBe(8);
  });

  it('throws not found when the user has not shared a location', async () => {
    databaseService.query.mockResolvedValueOnce({ rows: [] });

    await expect(locationsService.getCurrentLocation(8)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deletes only the authenticated user location', async () => {
    databaseService.query.mockResolvedValueOnce({
      rows: [{ user_id: 8 }],
      rowCount: 1,
    });

    const result = await locationsService.deleteCurrentLocation(8);

    expect(databaseService.query.mock.calls[0][1]).toEqual([8]);
    expect(result.message).toBe('Location sharing stopped');
  });
});
