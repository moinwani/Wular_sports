import { useEffect, useState } from 'react';
import { getVisitorRef } from '../utils/helpers';

/**
 * The visitor's Ref code (e.g. "WS-4X7KQ2") for links rendered on the server.
 * The server can't know it, and React keeps the server's link when the page
 * loads — so links built while rendering used to go out without the Ref, and
 * the WhatsApp chat couldn't be matched to the lead or the ad. This returns ''
 * on the server and the real code right after the page loads.
 */
export function useVisitorRef(): string {
    const [ref, setRef] = useState('');
    useEffect(() => { setRef(getVisitorRef()); }, []);
    return ref;
}
