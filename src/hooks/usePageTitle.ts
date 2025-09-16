import { useEffect } from 'react';

export const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = title ? `${title} | Freight Shark` : 'Freight Shark - Freight Forwarding Platform';
  }, [title]);
};