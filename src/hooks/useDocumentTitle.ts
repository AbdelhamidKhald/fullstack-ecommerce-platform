import { useEffect } from 'react';
import { APP_NAME } from '../lib/constants';

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | ${APP_NAME}` : `${APP_NAME} — Premium E-Commerce`;
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
