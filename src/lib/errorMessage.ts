// Supabase errors (PostgrestError, StorageError, FunctionsError) are plain
// objects with a `message` field, not `instanceof Error` — this normalizes
// both shapes for display.
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return "Something went wrong.";
}
