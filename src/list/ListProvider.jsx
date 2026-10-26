import { useEffect, useMemo, useReducer } from 'react';
import { ListContext } from './ListContext';
import { listReducer, loadList, saveList } from './list';

const ListProvider = ({ children }) => {
  const [entries, dispatch] = useReducer(listReducer, undefined, loadList);

  useEffect(() => {
    saveList(entries);
  }, [entries]);

  const value = useMemo(() => ({
    entries,
    pending: entries.filter((entry) => !entry.checked),
    addItem: (id, quantity = 1) => dispatch({ type: 'add', id, quantity }),
    toggleItem: (id) => dispatch({ type: 'toggle', id }),
    checkItems: (ids) => dispatch({ type: 'check', ids }),
    removeItem: (id) => dispatch({ type: 'remove', id }),
    clearChecked: () => dispatch({ type: 'clearChecked' })
  }), [entries]);

  return <ListContext value={value}>{children}</ListContext>;
};

export default ListProvider;
