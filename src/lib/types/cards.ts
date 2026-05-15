export interface Benefit {
  label: string;
  value: string;
}

type CardPresetId = string;

export interface CardPreset {
  id: CardPresetId;
  name: string;
  image: string;
  annualFee: number;
  benefits: Benefit[];
}

export interface TrackedCard {
  id: string;
  presetId: CardPresetId;
  nickname: string;
  annualRenewalDate: string;
  certificateExpiryDate: string;
  freeNightUsed: boolean;
  freeNightRedemptionValue: number;
  createdAt: string;
}

export interface AddTrackedCardInput {
  presetId: CardPreset['id'];
  nickname: string;
  annualRenewalDate: string;
  certificateExpiryDate: string;
  freeNightUsed: boolean;
  freeNightRedemptionValue: number;
}

export interface UpdateTrackedCardInput extends AddTrackedCardInput {
  id: string;
}
