import { faker } from "@faker-js/faker";
import { TranscriptTimestamp } from "../../utils/interfaces/transcriptInterfaces";

export const createTranscriptTimestamp = (
  overrides?: Partial<TranscriptTimestamp>
): TranscriptTimestamp => ({
  timestamp: faker.number.float({ min: 0, max: 3600, fractionDigits: 2 }),
  keyword: faker.lorem.word(),
  ...overrides,
});

export const createTranscriptTimestampArray = (
  count: number = faker.number.int({ min: 1, max: 10 }),
  overrides?: Partial<TranscriptTimestamp>
): TranscriptTimestamp[] =>
  Array.from({ length: count }, () => createTranscriptTimestamp(overrides));

export const createTranscriptionResponse = (overrides?: {
  fullTranscript?: string;
  transcriptTimestampMap?: TranscriptTimestamp[];
}) => ({
  fullTranscript: faker.lorem.paragraphs(3),
  transcriptTimestampMap: createTranscriptTimestampArray(),
  ...overrides,
});