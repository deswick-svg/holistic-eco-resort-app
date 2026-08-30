export type Stay = {
  id: string;
  name: string;
  guests: number;
  size: string;
  units: number;
  imageUrl?: string;
  description: string;
};

export const stays: Stay[] = [
  {
    id: 'tree-house',
    name: 'Tree House',
    guests: 3,
    size: '180 sq. ft.',
    units: 1,
    imageUrl: 'https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_120%2Cw_1280%2Ch_720%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_900%2Cf_auto%2Cc_fit/holistic-eco-resort-kannur/1000133282_452bcf4c',
    description: 'An elevated nature stay with a unique vantage point over the surrounding greenery.'
  },
  {
    id: 'glass-dome',
    name: 'Glass Dome',
    guests: 4,
    size: '450 sq. ft.',
    units: 2,
    imageUrl: 'https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_202%2Cw_945%2Ch_532%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_900%2Cf_auto%2Cc_fit/holistic-eco-resort-kannur/Glass_Dome_3eab96f2',
    description: 'A spacious transparent dome combining modern comfort with panoramic nature views.'
  },
  { id: 'tent-stay', name: 'Tent Stay', guests: 3, size: '150 sq. ft.', units: 7, description: 'A simple nature-first stay for guests who want to sleep close to the forest.' },
  { id: 'river-rock-villa', name: 'River Rock Villa', guests: 2, size: '300 sq. ft.', units: 1, description: 'A private villa stay with balcony and a traditional character.' },
  { id: 'caravan-stay', name: 'Caravan Stay', guests: 5, size: '300 sq. ft.', units: 1, description: 'A distinctive caravan experience with modern essentials.' },
  { id: 'tower-suite', name: 'Tower Suite', guests: 5, size: '400 sq. ft.', units: 2, description: 'A multi-level suite with private balcony for families and groups.' },
  { id: 'family-suite', name: 'Family Suite', guests: 5, size: '600 sq. ft.', units: 1, description: 'A large family-oriented suite with generous living space.' },
  { id: 'kerala-villa', name: 'Kerala Traditional Villa', guests: 3, size: '300 sq. ft.', units: 1, description: 'A comfortable stay inspired by Kerala traditional design.' },
  { id: 'forest-view-room', name: 'Forest View Room', guests: 4, size: '300 sq. ft.', units: 2, description: 'A private forest-facing room suited to couples and small families.' }
];
