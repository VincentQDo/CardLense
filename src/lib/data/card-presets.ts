import amexPlatinumCard from '$lib/assets/cards/amex-platinum.svg';
import hyattCard from '$lib/assets/cards/hyatt.svg';
import ihgCard from '$lib/assets/cards/ihg.svg';
import ventureXCard from '$lib/assets/cards/venture-x.svg';

import type { CardPreset, TrackedCard } from '$lib/types/cards';
import { getNextAnnualDate } from '$lib/utils/card-dates';

export const cardPresets = [
  {
    id: 'hyatt',
    name: 'World of Hyatt Credit Card',
    image: hyattCard,
    annualFee: 95,
    benefits: [
      { label: 'Free Night', value: 'Cat 1-4 yearly' },
      { label: 'Elite Status', value: 'Discoverist' }
    ],
    credits: [
      {
        id: 'certificate',
        name: 'Free night certificate',
        cadence: 'annual',
        faceValue: 200,
        description: 'Cat 1-4 yearly',
        requiresManualUse: true
      }
    ]
  },
  {
    id: 'ihg',
    name: 'IHG Premier Card',
    image: ihgCard,
    annualFee: 99,
    benefits: [
      { label: 'Free Night', value: 'Up to 40k pts' },
      { label: '4th Night Free', value: 'On award stays' }
    ],
    credits: [
      {
        id: 'certificate',
        name: 'Free night certificate',
        cadence: 'annual',
        faceValue: 200,
        description: 'Up to 40k pts yearly',
        requiresManualUse: true
      }
    ]
  },
  {
    id: 'venture-x',
    name: 'Capital One Venture X Rewards Credit Card',
    image: ventureXCard,
    annualFee: 395,
    benefits: [
      { label: 'Anniversary Bonus', value: '10,000 miles yearly' },
      { label: 'Travel Credit', value: '$300 annually' },
      { label: 'Global Entry/TSA', value: '$120 every 4 years' }
    ],
    credits: [
      {
        id: 'travel-credit',
        name: 'Travel credit',
        cadence: 'annual',
        faceValue: 300,
        description: '$300 annually',
        requiresManualUse: true
      },
      {
        id: 'global-entry-tsa',
        name: 'Global Entry/TSA',
        cadence: 'four_year',
        faceValue: 120,
        description: '$120 every 4 years',
        requiresManualUse: true
      },
      {
        id: 'anniversary-miles',
        name: 'Anniversary miles',
        cadence: 'annual',
        faceValue: 100,
        description: '10,000 miles yearly',
        requiresManualUse: true
      }
    ]
  },
  {
    id: 'amex-platinum',
    name: 'American Express Platinum Card',
    image: amexPlatinumCard,
    annualFee: 895,
    benefits: [
      { label: 'Resy Credit', value: '$400 annually' },
      { label: 'Hotel Credit', value: '$300 semi-annually' },
      { label: 'Uber Cash', value: '$15 monthly, $20 Dec.' },
      { label: 'Uber One', value: '$120 annually' },
      { label: 'Airline Fee Credit', value: '$200 annually' },
      { label: 'lululemon', value: '$75 quarterly' },
      { label: 'Oura Ring', value: '$200 annually' },
      { label: 'Walmart+', value: '$13 monthly' },
      { label: 'Entertainment', value: '$25 monthly' }
    ],
    credits: [
      {
        id: 'resy',
        name: 'Resy credit',
        cadence: 'annual',
        faceValue: 400,
        description: '$400 annually',
        requiresManualUse: true
      },
      {
        id: 'hotel',
        name: 'Hotel credit',
        cadence: 'semi_annual',
        faceValue: 300,
        description: '$300 per half-year period',
        requiresManualUse: true
      },
      {
        id: 'uber-cash',
        name: 'Uber Cash',
        cadence: 'monthly',
        faceValue: 15,
        description: '$15 monthly, $20 December',
        requiresManualUse: false
      },
      {
        id: 'uber-one',
        name: 'Uber One',
        cadence: 'annual',
        faceValue: 120,
        description: '$120 annually',
        requiresManualUse: true
      },
      {
        id: 'airline-fee',
        name: 'Airline fee credit',
        cadence: 'annual',
        faceValue: 200,
        description: '$200 annually',
        requiresManualUse: true
      },
      {
        id: 'lululemon',
        name: 'lululemon',
        cadence: 'quarterly',
        faceValue: 75,
        description: '$75 quarterly',
        requiresManualUse: true
      },
      {
        id: 'oura',
        name: 'Oura Ring',
        cadence: 'annual',
        faceValue: 200,
        description: '$200 annually',
        requiresManualUse: true
      },
      {
        id: 'walmart-plus',
        name: 'Walmart+',
        cadence: 'monthly',
        faceValue: 13,
        description: '$13 monthly',
        requiresManualUse: false
      },
      {
        id: 'entertainment',
        name: 'Entertainment',
        cadence: 'monthly',
        faceValue: 25,
        description: '$25 monthly',
        requiresManualUse: false
      }
    ]
  }
] as const satisfies CardPreset[];

const sampleCardDetails = {
  hyatt: {
    nickname: 'Personal Hyatt',
    annualRenewalDate: '2026-08-15'
  },
  ihg: {
    nickname: 'Personal IHG',
    annualRenewalDate: '2026-10-01'
  },
  'venture-x': {
    nickname: 'Venture X',
    annualRenewalDate: '2026-11-15'
  },
  'amex-platinum': {
    nickname: 'Amex Platinum',
    annualRenewalDate: '2026-12-01'
  }
} as const satisfies Record<CardPreset['id'], { annualRenewalDate: string; nickname: string }>;

export const initialTrackedCards: TrackedCard[] = cardPresets.map((preset) => ({
  id: `sample-${preset.id}`,
  userId: 'sample-user',
  presetId: preset.id,
  nickname: sampleCardDetails[preset.id].nickname,
  annualRenewalDate: sampleCardDetails[preset.id].annualRenewalDate,
  certificateExpiryDate: getNextAnnualDate(sampleCardDetails[preset.id].annualRenewalDate),
  freeNightUsed: false,
  freeNightRedemptionValue: 0,
  creditValuations: [],
  annualFee: preset.annualFee,
  annualizedCreditValue: 0,
  netValue: -preset.annualFee,
  createdAt: '2026-01-01 00:00:00'
}));

export function findCardPreset(presetId: CardPreset['id']): CardPreset {
  return cardPresets.find((preset) => preset.id === presetId) ?? cardPresets[0];
}
