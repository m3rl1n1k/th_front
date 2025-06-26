const isDebugMode = process.env.NEXT_PUBLIC_APP_DEBUG === 'true';

/**
 * Logs messages to the console only when in debug mode.
 * Checks the NEXT_PUBLIC_APP_DEBUG environment variable.
 * @param {...any} args - The messages or objects to log.
 */
export const devLog = (...args: any[]): void => {
  if (isDebugMode) {
    console.log(...args);
  }
};
