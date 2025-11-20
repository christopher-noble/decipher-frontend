export const Constants = {
    API_BASE_URL: "http://127.0.0.1:5000",
    MISSING_SUBMISSION: "Invalid input. Please include a submission",
    HEADER_HEIGHT: 130,
    RESULTING_ROWS: 20,
    ERROR_MESSAGES: {
        SERVER_CONNECTION: "Could not connect to the server. Please try again.",
        MULTIPLE_SUBMISSIONS: "Please only include one submission"
    }
} as const;