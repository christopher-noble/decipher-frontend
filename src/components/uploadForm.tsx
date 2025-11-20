import axios, { AxiosError } from "axios";
import React, {
  CSSProperties,
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Button, Col, Form, Row, Spinner } from "react-bootstrap";
const { v4: uuidv4 } = require("uuid");

import { Constants } from "../utils/constants";
import { formatTimestamp } from "../utils/helpers/formatting";
import { rawCharacters, youtubeParser } from "../utils/helpers/validation";
import { TranscriptTimestamp } from "../utils/interfaces/transcriptInterfaces";
import Tags from "./tags";

import "./styles/tagsStyles.css";
import "./styles/uploadFormStyles.css";

interface TranscriptionResponse {
  fullTranscript?: string;
  transcriptTimestampMap?: TranscriptTimestamp[];
}

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

const UploadForm: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({
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

  const {
    fullTranscript,
    fileBody,
    fileName,
    isLoading,
    transcriptionComplete,
    transcriptTimestampMap,
    tags,
    inputUrlRef,
    error,
    attemptedSubmission,
  } = formState;

  useEffect(() => {
    if (transcriptionComplete) {
      window.scrollTo({ top: Constants.HEADER_HEIGHT, behavior: "smooth" });
    }
  }, [transcriptionComplete]);

  const updateFormState = useCallback((updates: Partial<FormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  }, []);

  const validateSubmission = useCallback(
    (currentFileName: string, currentInputUrlRef: string): string | null => {
      if (currentFileName && currentInputUrlRef) {
        return Constants.ERROR_MESSAGES.MULTIPLE_SUBMISSIONS;
      }
      if (!currentFileName && !currentInputUrlRef) {
        return Constants.MISSING_SUBMISSION;
      }
      return null;
    },
    []
  );

  const startTranscriptionJob = useCallback(async (): Promise<void> => {
    updateFormState({ isLoading: true, error: null });

    try {
      const formData = new FormData();
      formData.append("jobName", uuidv4());

      if (fileName && fileBody) {
        formData.append("file", fileBody);
      } else if (inputUrlRef) {
        formData.append("inputUrlRef", inputUrlRef);
      } else {
        updateFormState({
          isLoading: false,
          error: Constants.MISSING_SUBMISSION,
        });
        return;
      }

      const response = await axios.post<TranscriptionResponse>(
        `${Constants.API_BASE_URL}/api/transcribe`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const data = response.data;

      updateFormState({
        fullTranscript: data.fullTranscript || "",
        transcriptTimestampMap: data.transcriptTimestampMap || [],
        transcriptionComplete: !!data.fullTranscript,
        isLoading: false,
      });
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message ||
        Constants.ERROR_MESSAGES.SERVER_CONNECTION;

      updateFormState({ isLoading: false, error: errorMessage });
      console.error("Transcription error:", err);
    }
  }, [fileName, fileBody, inputUrlRef, updateFormState]);

  const generateKeywordTimestamps = useCallback((): string => {
    const results: string[] = [];

    tags.forEach((tag) => {
      const words = tag.split(" ");
      const timestampsForTag: string[] = [];

      for (let i = 0; i <= transcriptTimestampMap.length - words.length; i++) {
        const isMatch = words.every((word, wordIndex) => {
          const transcript = transcriptTimestampMap[i + wordIndex];
          return (
            transcript &&
            rawCharacters(transcript.keyword) === rawCharacters(word)
          );
        });

        if (isMatch) {
          timestampsForTag.push(
            formatTimestamp(transcriptTimestampMap[i].timestamp)
          );
        }
      }

      if (timestampsForTag.length > 0) {
        results.push(`${tag} - ${timestampsForTag.join(", ")}`);
      }
    });

    return results.join("\n");
  }, [tags, transcriptTimestampMap]);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const file = event.target.files?.[0];
      if (!file) return;

      const newError = validateSubmission(file.name, inputUrlRef);
      updateFormState({
        fileBody: file,
        fileName: file.name,
        error: newError,
      });
    },
    [inputUrlRef, updateFormState, validateSubmission]
  );

  const handleUrlChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      event.preventDefault();
      const parsedUrl = youtubeParser(event.target.value) || "";
      const newError = validateSubmission(fileName || "", parsedUrl);

      updateFormState({
        inputUrlRef: parsedUrl,
        error: newError,
      });
    },
    [fileName, updateFormState, validateSubmission]
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      updateFormState({ attemptedSubmission: true });

      if (!error) {
        startTranscriptionJob();
      }
    },
    [error, startTranscriptionJob, updateFormState]
  );

  const handleTagsChange = useCallback(
    (newTags: string[]): void => {
      updateFormState({ tags: newTags });
    },
    [updateFormState]
  );

  const errorStyle: CSSProperties = {
    color: "red",
    paddingTop: "5px",
  };

  return (
    <>
      <Tags tags={tags} setTags={handleTagsChange} />

      <Form onSubmit={handleSubmit}>
        <Row className="content-input-row">
          <Col>
            <Form.Group controlId="formFile" className="mb-2 custom-file">
              <Form.Control
                className="custom-file-input"
                name="file-input"
                type="file"
                onChange={handleFileChange}
                accept="audio/*,video/*"
                aria-label="Upload audio or video file"
              />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group controlId="formUrl" className="mb-2 url-input-area">
              <Form.Control
                className="url-input"
                name="url-input"
                type="url"
                onChange={handleUrlChange}
                placeholder="Or insert YouTube link..."
                aria-label="YouTube URL input"
              />
            </Form.Group>
          </Col>
        </Row>

        {error && attemptedSubmission && (
          <Row>
            <Col>
              <Form.Label style={errorStyle} role="alert">
                {error}
              </Form.Label>
            </Col>
          </Row>
        )}

        <Row className="submit-button-row">
          <Col>
            <Form.Group controlId="formSubmit" className="mb-2">
              <Button
                type="submit"
                className="btn btn-dark submit"
                disabled={isLoading}
                aria-label="Start transcription"
              >
                {isLoading ? "Processing..." : "Submit"}
              </Button>
            </Form.Group>
          </Col>
        </Row>
      </Form>
      {isLoading && (
        <Row className="spinner-row">
          <Col className="spinner-col" xs={12}>
            <Spinner animation="border" role="status" aria-label="Loading">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </Col>
        </Row>
      )}

      {transcriptionComplete && !isLoading && (
        <Row className="transcription-row">
          <Col>
            <Form.Group className="mb-2" controlId="transcriptOutput">
              <Form.Label className="visually-hidden">
                Full Transcript
              </Form.Label>
              <Form.Control
                as="textarea"
                className="transcription-output"
                readOnly
                rows={Constants.RESULTING_ROWS}
                value={fullTranscript}
                aria-label="Full transcript output"
              />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group className="mb-2" controlId="timestampOutput">
              <Form.Label className="visually-hidden">
                Keyword Timestamps
              </Form.Label>
              <Form.Control
                as="textarea"
                className="transcription-output"
                readOnly
                rows={Constants.RESULTING_ROWS}
                value={generateKeywordTimestamps()}
                aria-label="Keyword timestamp matches"
              />
            </Form.Group>
          </Col>
        </Row>
      )}
    </>
  );
};

export default UploadForm;
