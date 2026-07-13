import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ActionItemList({ items, onChange, readOnly = false, meetingId }) {
  const [newDesc, setNewDesc] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newDue, setNewDue] = useState('');

  const updateItem = (index, field, value) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  const addItem = () => {
    if (!newDesc.trim()) return;
    onChange([...items, { description: newDesc, owner_name: newOwner || null, due_date: newDue || null, is_completed: false }]);
    setNewDesc('');
    setNewOwner('');
    setNewDue('');
  };

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const toggleComplete = async (index) => {
    const item = items[index];
    const updated = { ...item, is_completed: !item.is_completed };
    updateItem(index, 'is_completed', updated.is_completed);

    if (item.id) {
      await supabase
        .from('action_items')
        .update({ is_completed: updated.is_completed })
        .eq('id', item.id);
    }
  };

  const deleteItem = async (index) => {
    const item = items[index];
    if (item.id) {
      await supabase.from('action_items').delete().eq('id', item.id);
    }
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-3">Action Items</h3>

      {items.length ? (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={item.id || i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {!readOnly && (
                <input
                  type="checkbox"
                  checked={item.is_completed}
                  onChange={() => toggleComplete(i)}
                  className="mt-1"
                />
              )}
              <div className="flex-1">
                {readOnly ? (
                  <p className={`text-sm ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item.description}
                  </p>
                ) : (
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    className={`w-full text-sm bg-transparent border-0 border-b border-gray-200 focus:outline-none focus:border-blue-500 py-1 ${item.is_completed ? 'line-through text-gray-400' : ''}`}
                  />
                )}
                <div className="flex gap-4 mt-1">
                  {readOnly ? (
                    <>
                      {item.owner_name && (
                        <span className="text-xs text-gray-500">Owner: {item.owner_name}</span>
                      )}
                      {item.due_date && (
                        <span className="text-xs text-gray-500">Due: {item.due_date}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={item.owner_name || ''}
                        onChange={(e) => updateItem(i, 'owner_name', e.target.value || null)}
                        placeholder="Owner"
                        className="text-xs bg-transparent border-0 border-b border-gray-200 focus:outline-none focus:border-blue-500 w-24"
                      />
                      <input
                        type="date"
                        value={item.due_date || ''}
                        onChange={(e) => updateItem(i, 'due_date', e.target.value || null)}
                        className="text-xs bg-transparent border-0 border-b border-gray-200 focus:outline-none focus:border-blue-500"
                      />
                    </>
                  )}
                </div>
              </div>
              {!readOnly && (
                <button
                  onClick={() => deleteItem(i)}
                  className="text-gray-400 hover:text-red-500 text-sm"
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 mb-3">No action items</p>
      )}

      {!readOnly && (
        <div className="mt-4 flex gap-2 items-end">
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Action item description"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder="Owner"
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={addItem}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2 h-10"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
