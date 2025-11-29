'use client'
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ExternalLink, RefreshCw } from 'lucide-react';

interface HackathonEvent {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location: string;
  url: string;
  source: string;
  tags?: string[];
}

interface RedisData {
  timestamp: string;
  total: number;
  events: HackathonEvent[];
}

export default function HackathonDashboard() {
  const [data, setData] = useState<RedisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/scrape');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to fetch events');
      }
    } catch (err) {
      setError('Error fetching events from Redis');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">🚀 Hackathon Events</h1>
              <p className="text-blue-200">Amsterdam & Surrounding Areas • December 2024</p>
            </div>
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
              Refresh
            </button>
          </div>
        </header>

        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400"></div>
            <p className="text-white mt-4 text-lg">Loading events from Redis...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-6 text-center">
            <p className="text-red-200 text-lg">{error}</p>
            <p className="text-red-300 mt-2 text-sm">
              Run: <code className="bg-red-900/50 px-2 py-1 rounded">curl -X POST http://localhost:3000/api/scrape</code>
            </p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8 border border-white/20">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">📊 Stats</h2>
                  <p className="text-blue-200 mt-1">Total Events: <span className="font-bold text-white text-2xl">{data.total}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-blue-200 text-sm">Last Updated</p>
                  <p className="text-white font-semibold">{formatDate(data.timestamp)}</p>
                </div>
              </div>
            </div>

            {data.events.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-12 text-center border border-white/20">
                <p className="text-white text-xl">No hackathon events found for December 2024</p>
                <p className="text-blue-200 mt-2">Check back later or try refreshing!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.events.map((event) => (
                  <div 
                    key={event.id} 
                    className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-all hover:scale-105 hover:shadow-2xl"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-white flex-1">{event.name}</h3>
                      <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-semibold ml-2">
                        {event.source}
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-blue-100 text-sm mb-4 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-blue-200 text-sm">
                        <Calendar size={16} className="mr-2 flex-shrink-0" />
                        <span>{formatDate(event.startDate)}</span>
                      </div>
                      <div className="flex items-center text-blue-200 text-sm">
                        <MapPin size={16} className="mr-2 flex-shrink-0" />
                        <span>{event.location}</span>
                      </div>
                    </div>

                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {event.tags.slice(0, 3).map((tag, idx) => (
                          <span 
                            key={idx}
                            className="bg-purple-500/30 text-purple-100 text-xs px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg font-semibold transition w-full"
                    >
                      View Event
                      <ExternalLink size={16} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}