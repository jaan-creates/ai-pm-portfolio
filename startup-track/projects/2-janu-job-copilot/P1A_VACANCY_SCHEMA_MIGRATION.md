# Janu Job Copilot — P1-A Vacancy/Provenance Schema Migration

Status: COMPLETE
Date: 2026-08-20
Production baseline preserved: 1.3.8 / p0-regression-v19

## Applications columns added
- Last Vacancy Verified At
- Vacancy Status
- Vacancy Verification Source
- Vacancy Evidence Hash
- Vacancy Verification URL
- Vacancy Verification Confidence

## Migration discipline
1. Existing Applications grid width was verified at 41 columns.
2. Six columns were appended to the existing sheet; no existing column was overwritten.
3. Headers were written only to the newly appended columns AP:AU.
4. Immediate readback verified AO:AU as:
   - State Consistency
   - Last Vacancy Verified At
   - Vacancy Status
   - Vacancy Verification Source
   - Vacancy Evidence Hash
   - Vacancy Verification URL
   - Vacancy Verification Confidence
5. Existing application rows remain untouched; new fields are blank until actual vacancy verification runs.

## Product purpose
These columns let the real JD worker persist when a vacancy was last checked, whether it is open/closed/unknown/superseded, where the verification came from, and the evidence hash/provenance used for the decision.

This migration is schema readiness only. End-to-end P1-A is not closed until the real JD/source worker writes these fields and the 72-hour tailoring / 24-hour submission revalidation gates are exercised in live acceptance.
