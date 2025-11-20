import { faker } from "@faker-js/faker";

export const createFile = (overrides?: Partial<File>): File => {
  const fileName = faker.system.fileName({ extensionCount: 1 });
  const fileContent = faker.lorem.paragraphs(2);
  const blob = new Blob([fileContent], { type: faker.system.mimeType() });

  return new File([blob], fileName, {
    type: blob.type,
    lastModified: faker.date.recent().getTime(),
    ...overrides,
  });
};

export const createAudioFile = (): File =>
  createFile({
    name: `${faker.word.noun()}.mp3`,
    type: "audio/mpeg",
  });

export const createVideoFile = (): File =>
  createFile({
    name: `${faker.word.noun()}.mp4`,
    type: "video/mp4",
  });

export const createFormData = (
  overrides?: Record<string, string | File>
): FormData => {
  const formData = new FormData();
  const defaultData = {
    jobName: faker.string.uuid(),
    ...overrides,
  };

  Object.entries(defaultData).forEach(([key, value]) => {
    formData.append(key, value);
  });

  return formData;
};
