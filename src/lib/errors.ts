/**
 * Turns a failed Firestore write into a message a treasurer can act on.
 * The common real-world failure is "permission-denied": either the user's
 * role isn't admin/treasurer, or the latest firestore.rules were never
 * published in the Firebase Console (rules are pasted in by hand).
 */
export function describeSaveError(e: unknown): string {
  const code =
    typeof e === 'object' && e !== null && 'code' in e
      ? String((e as { code: unknown }).code)
      : '';
  if (code === 'permission-denied' || code.endsWith('/permission-denied')) {
    return (
      'Permission denied by the server. Only admins and treasurers can save ' +
      'this. If you are one, an admin needs to publish the latest ' +
      'firestore.rules (Firebase Console → Firestore → Rules → Publish).'
    );
  }
  if (code === 'unavailable') {
    return 'Could not reach the server. Check your internet connection and try again.';
  }
  return e instanceof Error ? e.message : 'Something went wrong. Please try again.';
}
