const UUID_PATTERN = /\b[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\b/gi;

/** Hide legacy database identifiers from notification copy. */
export const formatNotificationMessage = (message: string): string =>
  message.replace(
    new RegExp(`invoice\\s+${UUID_PATTERN.source}`, "gi"),
    "invoice",
  );
