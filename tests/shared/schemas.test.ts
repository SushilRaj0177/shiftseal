import { describe, it, expect } from 'vitest';
import {
  checkInOutInputSchema,
  notificationResponseSchema,
  aiClaimRequestSchema,
  submitClaimSchema,
  aiExplainPayRequestSchema,
  aiHazardRequestSchema,
  submitHazardSchema,
  aiFeedbackPreviewRequestSchema,
  submitFeedbackSchema,
  adminEditShiftSchema,
  adminResolveDisputeSchema,
  adminUpdateHazardSchema,
  audioBase64Schema,
  imageBase64Schema,
  textInputSchema,
} from '../../src/shared/schemas.js';

describe('schemas.ts', () => {
  it('validates checkInOutInputSchema valid and invalid inputs', () => {
    expect(
      checkInOutInputSchema.safeParse({
        workerId: 'w-murugan',
        action: 'CHECK_IN',
        zoneCode: 'TB-GATE',
      }).success
    ).toBe(true);
    expect(
      checkInOutInputSchema.safeParse({
        workerId: '',
        action: 'INVALID',
        zoneCode: '',
      }).success
    ).toBe(false);
  });

  it('validates notificationResponseSchema valid and invalid inputs', () => {
    expect(
      notificationResponseSchema.safeParse({
        workerId: 'w-murugan',
        notificationId: 'notif-1',
        response: 'disagree',
      }).success
    ).toBe(true);
    expect(
      notificationResponseSchema.safeParse({
        workerId: 'w-murugan',
        notificationId: 'notif-1',
        response: 'invalid',
      }).success
    ).toBe(false);
  });

  it('validates aiClaimRequestSchema and submitClaimSchema', () => {
    expect(
      aiClaimRequestSchema.safeParse({
        workerId: 'w-murugan',
        lang: 'ta',
        text: 'Worked 2 extra hours',
      }).success
    ).toBe(true);
    expect(aiClaimRequestSchema.safeParse({ workerId: 'w-murugan' }).success).toBe(false);

    expect(
      submitClaimSchema.safeParse({
        workerId: 'w-murugan',
        date: '2026-10-24',
        extraHours: 2,
        reason: 'Slab pouring',
      }).success
    ).toBe(true);
    expect(
      submitClaimSchema.safeParse({
        workerId: 'w-murugan',
        date: '24-10-2026',
        extraHours: 99,
        reason: '',
      }).success
    ).toBe(false);
  });

  it('validates aiExplainPayRequestSchema', () => {
    expect(
      aiExplainPayRequestSchema.safeParse({
        workerId: 'w-murugan',
        question: 'Why?',
      }).success
    ).toBe(true);
    expect(aiExplainPayRequestSchema.safeParse({ workerId: 'w-murugan' }).success).toBe(false);
  });

  it('validates aiHazardRequestSchema and submitHazardSchema', () => {
    expect(
      aiHazardRequestSchema.safeParse({
        workplaceId: 'wp-tower-b',
        zoneId: 'z-scaffold-b',
        text: 'Loose plank',
      }).success
    ).toBe(true);
    expect(
      aiHazardRequestSchema.safeParse({
        workplaceId: 'wp-tower-b',
        zoneId: 'z-scaffold-b',
      }).success
    ).toBe(false);

    expect(
      submitHazardSchema.safeParse({
        workplaceId: 'wp-tower-b',
        zoneId: 'z-scaffold-b',
        hazardType: 'scaffold',
        description: 'Loose plank',
        englishSummary: 'Loose plank',
        aiSeverity: 'medium',
      }).success
    ).toBe(true);
    expect(
      submitHazardSchema.safeParse({
        workplaceId: 'wp-tower-b',
        zoneId: 'z-scaffold-b',
        hazardType: 'unknown_type',
        description: '',
        englishSummary: '',
        aiSeverity: 'medium',
      }).success
    ).toBe(false);
  });

  it('validates aiFeedbackPreviewRequestSchema and submitFeedbackSchema', () => {
    expect(
      aiFeedbackPreviewRequestSchema.safeParse({
        workplaceId: 'wp-tower-b',
        team: 'Structural Crew',
        text: 'No water',
      }).success
    ).toBe(true);
    expect(
      aiFeedbackPreviewRequestSchema.safeParse({
        workplaceId: 'wp-tower-b',
        team: 'Structural Crew',
      }).success
    ).toBe(false);

    expect(
      submitFeedbackSchema.safeParse({
        workplaceId: 'wp-tower-b',
        team: 'Structural Crew',
        cleanText: 'No water',
        cleanTextEnglish: 'No water',
        removed: ['name'],
        themes: ['drinking_water_toilets'],
        sentiment: -0.5,
      }).success
    ).toBe(true);
    expect(
      submitFeedbackSchema.safeParse({
        workplaceId: 'wp-tower-b',
        team: 'Structural Crew',
        cleanText: '',
        cleanTextEnglish: '',
        removed: [],
        themes: [],
        sentiment: 5,
      }).success
    ).toBe(false);
  });

  it('validates adminEditShiftSchema, adminResolveDisputeSchema, and adminUpdateHazardSchema', () => {
    expect(
      adminEditShiftSchema.safeParse({
        workerId: 'w-murugan',
        targetEventId: 'ev-1',
        newTimestamp: '18:00',
        reason: 'Valid reason',
      }).success
    ).toBe(true);
    expect(
      adminEditShiftSchema.safeParse({
        workerId: 'w-murugan',
        targetEventId: 'ev-1',
        newTimestamp: 'bad-time',
        reason: 'no',
      }).success
    ).toBe(false);

    expect(
      adminResolveDisputeSchema.safeParse({
        claimId: 'c-1',
        decision: 'approved',
        reason: 'Verified with log',
      }).success
    ).toBe(true);
    expect(
      adminResolveDisputeSchema.safeParse({
        claimId: 'c-1',
        decision: 'approved',
        reason: 'x',
      }).success
    ).toBe(false);

    expect(
      adminUpdateHazardSchema.safeParse({
        hazardId: 'h-1',
        status: 'resolved',
      }).success
    ).toBe(true);
    expect(
      adminUpdateHazardSchema.safeParse({
        hazardId: 'h-1',
        status: 'deleted',
      }).success
    ).toBe(false);
  });

  it('enforces size caps on text, audio, and image payloads', () => {
    expect(textInputSchema.safeParse('a'.repeat(2001)).success).toBe(false);
    expect(audioBase64Schema.safeParse('a'.repeat(2_900_000)).success).toBe(false);
    expect(imageBase64Schema.safeParse('a'.repeat(1_500_000)).success).toBe(false);
  });
});
