
export interface Point {
  x: number;
  y: number;
  label: string;
}

export interface HeightEstimationResult {
  estimatedHeightCm: number;
  confidenceRangeCm: [number, number];
  landmarks: Point[];
  ratios: {
    headToBody: number;
    legToTorso: number;
    armLengthRatio: number;
  };
  analysis: string;
  cameraPerspective: {
    tiltAngleDegrees: number;
    estimatedDistanceMeters: number;
  };
}

export enum ReferenceType {
  DOOR = 'DOOR', // Standard 203cm
  CREDIT_CARD = 'CREDIT_CARD', // 8.56cm
  A4_PAPER = 'A4_PAPER', // 29.7cm
  SODA_CAN = 'SODA_CAN', // 12.2cm
  NONE = 'NONE'
}

export interface UserInput {
  image: string;
  wearingShoes: boolean;
  postureConfirmed: boolean;
  referenceType: ReferenceType;
}
