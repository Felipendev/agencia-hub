/** Only enabled by an explicit local environment flag in the development server. */
export const localLoginEnabled = process.env.NODE_ENV === "development"
  && process.env.NEXT_PUBLIC_LOCAL_LOGIN === "true";
