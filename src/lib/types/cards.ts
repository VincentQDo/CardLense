export interface Benefit {
  label: string;
  value: string;
}

export type CreditCadence = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'four_year';

export interface CreditDefinition {
  id: string;
  name: string;
  cadence: CreditCadence;
  faceValue: number;
  description: string;
  requiresManualUse: boolean;
}

type CardPresetId = string;

export interface CardPreset {
  id: CardPresetId;
  name: string;
  image: string;
  annualFee: number;
  benefits: Benefit[];
  credits: CreditDefinition[];
}

export interface CreditValuation {
  creditId: string;
  name: string;
  cadence: CreditCadence;
  cadenceLabel: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  faceValue: number;
  userValue: number;
  annualizedValue: number;
  description: string;
  requiresManualUse: boolean;
  used: boolean;
  expiresInDays: number | undefined;
  isExpired: boolean;
  needsAttention: boolean;
}

export interface TrackedCard {
  id: string;
  userId: string;
  presetId: CardPresetId;
  nickname: string;
  annualRenewalDate: string;
  certificateExpiryDate: string;
  freeNightUsed: boolean;
  freeNightRedemptionValue: number;
  creditValuations: CreditValuation[];
  annualFee: number;
  annualizedCreditValue: number;
  netValue: number;
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
