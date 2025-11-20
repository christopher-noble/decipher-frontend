import { faker } from "@faker-js/faker";

export const createYouTubeUrl = (): string => {
  const videoId = faker.string.alphanumeric(11);
  const baseUrls = [
    `https://www.youtube.com/watch?v=${videoId}`,
    `https://youtu.be/${videoId}`,
    `https://youtube.com/watch?v=${videoId}`,
    `https://m.youtube.com/watch?v=${videoId}`,
  ];
  return faker.helpers.arrayElement(baseUrls);
};

export const createInvalidUrl = (): string =>
  faker.helpers.arrayElement([
    faker.internet.url(),
    faker.lorem.word(),
    faker.internet.email(),
    "not-a-url",
    "",
  ]);

export const createTagsArray = (
  count: number = faker.number.int({ min: 1, max: 5 })
): string[] =>
  Array.from({ length: count }, () => faker.lorem.words({ min: 1, max: 3 }));

export const createErrorMessage = (): string => faker.lorem.sentence();

export const createAxiosError = (message?: string) => ({
  response: {
    data: {
      message: message || createErrorMessage(),
    },
  },
  isAxiosError: true,
});
