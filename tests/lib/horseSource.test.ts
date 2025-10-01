import { describe, it, expect } from 'vitest';
import { parseHorseRow } from '@/lib/horseSource';

describe('parseHorseRow', () => {
  it('maps database row to Horse with normalized fields', () => {
    const horse = parseHorseRow({
      id: 'abc',
      display_name: 'Rain Dancer',
      bio: 'Friendly and eager to please.',
      age_years: 7,
      breed: 'Arabian',
      gender: 'mare',
      height_cm: 160,
      location_city: 'Amsterdam',
      location_country: 'NL',
      color: 'Chestnut',
      temperament: 'Curious',
      disciplines: ['Dressage', 'Jumping'],
      interests: ['Carrots', 'Trail rides'],
      photos: [
        { url: 'https://example.com/secondary.jpg', is_primary: false, position: 3 },
        { url: 'https://example.com/primary.jpg', is_primary: true, position: 1 },
      ],
    });

    expect(horse).toMatchObject({
      id: 'abc',
      name: 'Rain Dancer',
      age: 7,
      breed: 'Arabian',
      location: 'Amsterdam, NL',
      gender: 'Mare',
      heightCm: 160,
      description: 'Friendly and eager to please.',
      color: 'Chestnut',
      temperament: 'Curious',
      disciplines: ['Dressage', 'Jumping'],
      interests: ['Carrots', 'Trail rides'],
      image: 'https://example.com/primary.jpg',
      photos: ['https://example.com/primary.jpg', 'https://example.com/secondary.jpg'],
    });
  });

  it('falls back to sensible defaults when data is missing', () => {
    const horse = parseHorseRow({});

    expect(horse.name).toBe('Unknown');
    expect(horse.age).toBe(5);
    expect(horse.heightCm).toBe(150);
    expect(horse.gender).toBe('Gelding');
    expect(horse.location).toBe('Unknown');
    expect(horse.image).toBe('/TFH/Tinder-for-Horses-cover-image.png');
  });
});

