import type { CardPreset, TrackedCard } from '$lib/types/cards';
import { getNextAnnualDate } from '$lib/utils/card-dates';

export const cardPresets = [
  {
    id: 'hyatt',
    name: 'World of Hyatt Credit Card',
    image: 'https://img.daisyui.com/images/stock/creditcard.webp',
    annualFee: 95,
    benefits: [
      { label: 'Free Night', value: 'Cat 1-4 yearly' },
      { label: 'Elite Status', value: 'Discoverist' }
    ]
  },
  {
    id: 'ihg',
    name: 'IHG Premier Card',
    image: 'https://img.daisyui.com/images/stock/creditcard.webp',
    annualFee: 99,
    benefits: [
      { label: 'Free Night', value: 'Up to 40k pts' },
      { label: '4th Night Free', value: 'On award stays' }
    ]
  }
] as const satisfies CardPreset[];

export const initialTrackedCards: TrackedCard[] = cardPresets.map((preset) => ({
  id: `sample-${preset.id}`,
  presetId: preset.id,
  nickname: preset.id === 'hyatt' ? 'Personal Hyatt' : 'Personal IHG',
  annualRenewalDate: preset.id === 'hyatt' ? '2026-08-15' : '2026-10-01',
  certificateExpiryDate: getNextAnnualDate(preset.id === 'hyatt' ? '2026-08-15' : '2026-10-01'),
  freeNightUsed: false,
  freeNightRedemptionValue: 0,
  createdAt: '2026-01-01 00:00:00'
}));

export function findCardPreset(presetId: CardPreset['id']): CardPreset {
  return cardPresets.find((preset) => preset.id === presetId) ?? cardPresets[0];
}
