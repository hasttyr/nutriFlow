import { use } from 'react';
import { ListContext } from './ListContext';

export const useList = () => {
  const list = use(ListContext);
  if (!list) {
    throw new Error('useList must be used inside <ListProvider>');
  }
  return list;
};
