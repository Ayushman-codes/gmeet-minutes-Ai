import { useState } from 'react';

export default function SummaryEditor({ summary, onChange, readOnly = false }) {
  const [editing, setEditing] = useState(null);
  const [local, setLocal] = useState({ ...summary });

  const update = (field, value) => {
    const updated = { ...local, [field]: value };
    setLocal(updated);
    onChange(updated);
  };

  const updateListItem = (field, index, value) => {
    const list = [...local[field]];
    list[index] = value;
    update(field, list);
  };

  const addListItem = (field) => {
    update(field, [...local[field], '']);
  };

  const removeListItem = (field, index) => {
    update(
      field,
      local[field].filter((_, i) => i !== index)
    );
  };

  const renderList = (field, label) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-3">{label}</h3>
      {local[field]?.length ? (
        <ul className="space-y-2">
          {local[field].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-gray-400 mt-1">-</span>
              {readOnly ? (
                <span className="text-sm text-gray-700">{item}</span>
              ) : (
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateListItem(field, i, e.target.value)}
                  className="flex-1 text-sm border-0 border-b border-gray-200 focus:outline-none focus:border-blue-500 py-1"
                />
              )}
              {!readOnly && (
                <button
                  onClick={() => removeListItem(field, i)}
                  className="text-gray-400 hover:text-red-500 text-sm"
                >
                  x
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400">None</p>
      )}
      {!readOnly && (
        <button
          onClick={() => addListItem(field)}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          + Add
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Attendees</h3>
        {readOnly ? (
          <p className="text-sm text-gray-700">
            {local.attendees?.length ? local.attendees.join(', ') : 'None identified'}
          </p>
        ) : (
          <input
            type="text"
            value={local.attendees?.join(', ') || ''}
            onChange={(e) =>
              update(
                'attendees',
                e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
              )
            }
            placeholder="Comma-separated names"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
        {readOnly ? (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{local.summary_text}</p>
        ) : (
          <textarea
            value={local.summary_text || ''}
            onChange={(e) => update('summary_text', e.target.value)}
            rows={4}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {renderList('key_points', 'Key Points')}
      {renderList('decisions', 'Decisions')}
    </div>
  );
}
