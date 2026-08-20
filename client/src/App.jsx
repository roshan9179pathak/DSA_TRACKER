import React, { useState, useEffect } from 'react';

export default function DSATracker() {
  const [titleOrId, setTitleOrId] = useState('');
  const [platform, setPlatform] = useState('LeetCode');
  const [reminders, setReminders] = useState([]);
  const [message, setMessage] = useState('');

  // Fetch weekend reminders
  const fetchReminders = () => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}api/reminders`)
      .then((res) => res.json())
      .then((data) => setReminders(data))
      .catch((err) => console.error('Error fetching reminders:', err));
  };

  useEffect(() => {
    fetchReminders();
    console.log(reminders);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titleOrId.trim()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titleOrId, platform }),
      });

      if (response.ok) {
        setMessage('Question added! Reminders will trigger on schedule.');
        setTitleOrId('');
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };

  // Handle Snooze logic (1 Day or 7 Days)
  const handleSnooze = async (id, days) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/${id}/snooze`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });

      if (response.ok) {
        // Remove item from UI immediately
        setReminders((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (error) {
      console.error('Failed to snooze:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
            DSA Revision Tracker
          </h1>
        </header>

        {/* Weekend Reminders with Snooze Controls */}
        {reminders.length > 0 && (
          <div className="bg-amber-950/30 border border-amber-500/40 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-bold text-amber-400 mb-1">
              ⚠️ Weekend Re-attempt Queue
            </h2>
            <p className="text-gray-300 text-sm mb-4">
              Review these questions today, or snooze them if you need more time.
            </p>

            <div className="space-y-3">
              {reminders.map((q) => (
                <div 
                  key={q._id} 
                  className="bg-gray-900 border border-gray-700/80 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-lg font-medium text-gray-100">{q.titleOrId}</p>
                    <span className={`text-xs px-2.5 py-0.5 rounded font-medium ${
                      q.platform === 'LeetCode' 
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {q.platform}
                    </span>
                  </div>

                  {/* Snooze Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSnooze(q._id, 1)}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs font-semibold rounded border border-gray-600 transition"
                    >
                      💤 Snooze 1 Day
                    </button>
                    <button
                      onClick={() => handleSnooze(q._id, 7)}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs font-semibold rounded border border-gray-600 transition"
                    >
                      📅 Snooze 1 Week
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-xl">
          <h3 className="text-lg font-bold mb-4 text-gray-200">Log New Question</h3>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g., 3Sum / Trapping Rain Water"
              value={titleOrId}
              onChange={(e) => setTitleOrId(e.target.value)}
              className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-teal-400 transition text-sm"
              required
            />
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-teal-400"
            >
              <option value="LeetCode">LeetCode</option>
              <option value="GeeksforGeeks">GeeksforGeeks</option>
            </select>
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-500 font-semibold px-5 py-2.5 rounded-lg text-sm transition"
            >
              Add Question
            </button>
          </form>

          {message && (
            <p className="mt-3 text-xs text-emerald-400 text-center">{message}</p>
          )}
        </div>

      </div>
    </div>
  );
}