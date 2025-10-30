export const OutcomeTag = {
  WonTransferred: "won_transferred",
  NoAgreementPrice: "no_agreement_price",
  NoFitFound: "no_fit_found",
} as const;

export type OutcomeTag = (typeof OutcomeTag)[keyof typeof OutcomeTag];

export const outcomeTagValues: OutcomeTag[] = [
  OutcomeTag.WonTransferred,
  OutcomeTag.NoAgreementPrice,
  OutcomeTag.NoFitFound,
];

export const SentimentTag = {
  VeryPositive: "very_positive",
  Positive: "positive",
  Neutral: "neutral",
  Negative: "negative",
  VeryNegative: "very_negative",
} as const;

export type SentimentTag = (typeof SentimentTag)[keyof typeof SentimentTag];

export const sentimentTagValues: SentimentTag[] = [
  SentimentTag.VeryPositive,
  SentimentTag.Positive,
  SentimentTag.Neutral,
  SentimentTag.Negative,
  SentimentTag.VeryNegative,
];


