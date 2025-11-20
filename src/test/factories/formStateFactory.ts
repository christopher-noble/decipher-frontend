import { faker } from "@faker-js/faker";
import { TranscriptTimestamp } from "../../utils/interfaces/transcriptInterfaces";

interface FormState {
  fullTranscript: string;
  fileBody: File | null;
  fileName: string | null;
  isLoading: boolean;
  transcriptionComplete: boolean;
  transcriptTimestampMap: TranscriptTimestamp[];
  tags: string[];
  inputUrlRef: string;
  error: string | null;
  attemptedSubmission: boolean;
}

export const createFormState = (overrides?: Partial<FormState>): FormState => ({
  fullTranscript: faker.lorem.paragraphs(2),
  fileBody: null,
  fileName: null,
  isLoading: faker.datatype.boolean(),
  transcriptionComplete: faker.datatype.boolean(),
  transcriptTimestampMap: [],
  tags: [],
  inputUrlRef: faker.internet.url(),
  error: null,
  attemptedSubmission: faker.datatype.boolean(),
  ...overrides,
});

export const createInitialFormState = (): FormState => ({
  fullTranscript: "",
  fileBody: null,
  fileName: null,
  isLoading: false,
  transcriptionComplete: false,
  transcriptTimestampMap: [],
  tags: [],
  inputUrlRef: "",
  error: null,
  attemptedSubmission: false,
});