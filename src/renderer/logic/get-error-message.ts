export function getErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof Error) {
    const message = error.message.trim();

    if (message) {
      return message;
    }
  }

  if (typeof error === 'string') {
    const message = error.trim();

    if (message) {
      return message;
    }
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    const message = error.message.trim();

    if (message) {
      return message;
    }
  }

  return fallbackMessage;
}
