/**
 * Newsletter sign-up for the website forms. The Firebase database library is
 * fetched only when someone actually subscribes, instead of on every page.
 */
export async function subscribe(email: string): Promise<{ success: boolean; message: string }> {
    try {
        const { subscribeToNewsletter } = await import('./newsletter');
        return await subscribeToNewsletter(email);
    } catch {
        return { success: false, message: 'Could not subscribe right now — please try again.' };
    }
}
