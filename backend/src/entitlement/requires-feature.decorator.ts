import { SetMetadata } from '@nestjs/common';

export const REQUIRES_FEATURE_KEY = 'requires_feature';
export const RequiresFeature = (featureCode: string) => SetMetadata(REQUIRES_FEATURE_KEY, featureCode);
