import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { beforeAll, beforeEach, describe, expect, it, Mock, vi } from "vitest";

import UploadForm from "../components/uploadForm";
import { Constants } from "../utils/constants";
import * as validation from "../utils/helpers/validation";

import {
  createAxiosError,
  createInvalidUrl,
  createYouTubeUrl
} from "./factories/commonFactory";
import { createAudioFile, createVideoFile } from "./factories/fileFactory";
import {
  createTranscriptionResponse
} from "./factories/transcriptFactory";

vi.mock("axios");
vi.mock("../utils/helpers/validation");
vi.mock("../components/tags", () => ({
  default: vi.fn(() => <div data-testid="tags-component" />)
}));
vi.mock("uuid", () => ({
  v4: vi.fn(() => "mock-uuid"),
}));

const mockedAxios = axios as unknown as {
  post: Mock;
};

const mockedValidation = validation as {
  youtubeParser: Mock;
  rawCharacters: Mock;
};

const mockedTags = vi.fn((props?: { setTags?: (tags: string[]) => void }) => (
  <div data-testid="tags-component" />
));
vi.doMock("../components/tags", () => ({ default: mockedTags }));

describe("UploadForm Initial State", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeAll(() => {
    Object.defineProperty(window, "scrollTo", {
      value: vi.fn(),
      writable: true,
    });
  });

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  it("renders upload form with file input", () => {
    render(<UploadForm />);

    expect(
      screen.getByLabelText("Upload audio or video file")
    ).toBeInTheDocument();
  });

  it("renders upload form with URL input", () => {
    render(<UploadForm />);

    expect(screen.getByLabelText("YouTube URL input")).toBeInTheDocument();
  });

  it("renders submit button with correct initial state", () => {
    render(<UploadForm />);

    const submitButton = screen.getByLabelText("Start transcription");
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveTextContent("Submit");
    expect(submitButton).not.toBeDisabled();
  });

  it("renders tags component", () => {
    render(<UploadForm />);

    expect(screen.getByTestId("tags-component")).toBeInTheDocument();
  });

  it("does not show error message initially", () => {
    render(<UploadForm />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not show loading spinner initially", () => {
    render(<UploadForm />);

    expect(screen.queryByLabelText("Loading")).not.toBeInTheDocument();
  });

  it("does not show transcription results initially", () => {
    render(<UploadForm />);

    expect(
      screen.queryByLabelText("Full transcript output")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Keyword timestamp matches")
    ).not.toBeInTheDocument();
  });
});

describe("UploadForm File Upload", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  it("validates audio file type", async () => {
    const audioFile = createAudioFile();
    render(<UploadForm />);

    const fileInput = screen.getByLabelText("Upload audio or video file");
    await user.upload(fileInput, audioFile);

    expect(fileInput).toHaveAttribute("accept", "audio/*,video/*");
  });

  it("validates video file type", async () => {
    const videoFile = createVideoFile();
    render(<UploadForm />);

    const fileInput = screen.getByLabelText("Upload audio or video file");
    await user.upload(fileInput, videoFile);

    expect(fileInput).toHaveAttribute("accept", "audio/*,video/*");
  });

  it("shows error when both file and URL are provided", async () => {
    const testFile = createAudioFile();
    const testUrl = createYouTubeUrl();

    mockedValidation.youtubeParser.mockReturnValue(testUrl);
    render(<UploadForm />);

    const fileInput = screen.getByLabelText("Upload audio or video file");
    const urlInput = screen.getByLabelText("YouTube URL input");
    const submitButton = screen.getByLabelText("Start transcription");

    await user.upload(fileInput, testFile);
    await user.type(urlInput, testUrl);
    await user.click(submitButton);

    expect(screen.getByRole("alert")).toHaveTextContent(
      Constants.ERROR_MESSAGES.MULTIPLE_SUBMISSIONS
    );
  });

  it("triggers transcription when file is uploaded and form is submitted", async () => {
    const testFile = createAudioFile();
    const transcriptionResponse = createTranscriptionResponse();

    mockedAxios.post.mockResolvedValue({ data: transcriptionResponse });
    render(<UploadForm />);

    const fileInput = screen.getByLabelText("Upload audio or video file");
    const submitButton = screen.getByLabelText("Start transcription");

    await user.upload(fileInput, testFile);
    await user.click(submitButton);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${Constants.API_BASE_URL}/api/transcribe`,
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  });
});

describe("UploadForm URL Input", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  it("shows error when neither file nor URL is provided", async () => {
    render(<UploadForm />);

    const submitButton = screen.getByLabelText("Start transcription");
    await user.click(submitButton);

    expect(screen.getByRole("alert")).toHaveTextContent(
      Constants.MISSING_SUBMISSION
    );
  });

  it("triggers transcription when URL is provided and form is submitted", async () => {
    const testUrl = createYouTubeUrl();
    const parsedUrl = "parsed-video-id";
    const transcriptionResponse = createTranscriptionResponse();

    mockedValidation.youtubeParser.mockReturnValue(parsedUrl);
    mockedAxios.post.mockResolvedValue({ data: transcriptionResponse });
    render(<UploadForm />);

    const urlInput = screen.getByLabelText("YouTube URL input");
    const submitButton = screen.getByLabelText("Start transcription");

    await user.type(urlInput, testUrl);
    await user.click(submitButton);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${Constants.API_BASE_URL}/api/transcribe`,
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  });

  it("handles invalid URL input gracefully", async () => {
    const invalidUrl = createInvalidUrl();

    mockedValidation.youtubeParser.mockReturnValue(null);
    render(<UploadForm />);

    const urlInput = screen.getByLabelText("YouTube URL input");
    await user.type(urlInput, invalidUrl);

    expect(mockedValidation.youtubeParser).toHaveBeenCalledWith(invalidUrl);
  });
});

describe("UploadForm Transcription Process", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  it("shows loading state during transcription", async () => {
    const testFile = createAudioFile();

    mockedAxios.post.mockImplementation(() => new Promise(() => {}));
    render(<UploadForm />);

    const fileInput = screen.getByLabelText("Upload audio or video file");
    const submitButton = screen.getByLabelText("Start transcription");

    await user.upload(fileInput, testFile);
    await user.click(submitButton);

    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
    expect(submitButton).toHaveTextContent("Processing...");
    expect(submitButton).toBeDisabled();
  });

  it("displays transcription results on successful response", async () => {
    const testFile = createAudioFile();
    const transcriptionResponse = createTranscriptionResponse();

    mockedAxios.post.mockResolvedValue({ data: transcriptionResponse });
    render(<UploadForm />);

    const fileInput = screen.getByLabelText("Upload audio or video file");
    const submitButton = screen.getByLabelText("Start transcription");

    await user.upload(fileInput, testFile);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByLabelText("Full transcript output")).toHaveValue(
        transcriptionResponse.fullTranscript
      );
    });
  });

  it("handles transcription API errors gracefully", async () => {
    const testFile = createAudioFile();
    const axiosError = createAxiosError();

    mockedAxios.post.mockRejectedValue(axiosError);
    render(<UploadForm />);

    const fileInput = screen.getByLabelText("Upload audio or video file");
    const submitButton = screen.getByLabelText("Start transcription");

    await user.upload(fileInput, testFile);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        axiosError.response.data.message
      );
    });
  });

  it("scrolls to top when transcription completes", async () => {
    const testFile = createAudioFile();
    const transcriptionResponse = createTranscriptionResponse();
    const scrollToSpy = vi.spyOn(window, "scrollTo");

    mockedAxios.post.mockResolvedValue({ data: transcriptionResponse });
    render(<UploadForm />);

    const fileInput = screen.getByLabelText("Upload audio or video file");
    const submitButton = screen.getByLabelText("Start transcription");

    await user.upload(fileInput, testFile);
    await user.click(submitButton);

    await waitFor(() => {
      expect(scrollToSpy).toHaveBeenCalledWith({
        top: Constants.HEADER_HEIGHT,
        behavior: "smooth",
      });
    });
  });

  it("handles network errors with default error message", async () => {
    const testFile = createAudioFile();
    const networkError = new Error("Network Error");

    mockedAxios.post.mockRejectedValue(networkError);
    render(<UploadForm />);

    const fileInput = screen.getByLabelText("Upload audio or video file");
    const submitButton = screen.getByLabelText("Start transcription");

    await user.upload(fileInput, testFile);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        Constants.ERROR_MESSAGES.SERVER_CONNECTION
      );
    });
  });
});

describe("UploadForm Keyword Timestamp Generation", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockedValidation.rawCharacters.mockImplementation((str: string) =>
      str.toLowerCase()
    );
  });

  it("handles empty tags array gracefully", async () => {
    const testFile = createAudioFile();
    const transcriptionResponse = createTranscriptionResponse();

    mockedAxios.post.mockResolvedValue({ data: transcriptionResponse });
    render(<UploadForm />);

    const fileInput = screen.getByLabelText("Upload audio or video file");
    const submitButton = screen.getByLabelText("Start transcription");

    await user.upload(fileInput, testFile);
    await user.click(submitButton);

    await waitFor(() => {
      const timestampOutput = screen.getByLabelText(
        "Keyword timestamp matches"
      );
      expect(timestampOutput).toHaveValue("");
    });
  });
});
