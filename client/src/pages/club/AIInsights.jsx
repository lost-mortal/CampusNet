import React from 'react';

const AIInsights = () => {
    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                        AI Insights
                    </h1>
                    <p className="text-gray-400">Data-driven recommendations for your club</p>
                </div>
                <button className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors text-sm font-medium">
                    Generate Report
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-zinc-900 border border-blue-500/10 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-50">
                        <svg className="w-24 h-24 text-blue-500/10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z" opacity=".5" /><path d="M12 6a6 6 0 106 6 6 6 0 00-6-6zm0 10a4 4 0 114-4 4 4 0 01-4 4z" /></svg>
                    </div>
                    <h3 className="text-white font-semibold mb-4">Engagement Prediction</h3>
                    <p className="text-gray-400 text-sm mb-6">
                        Based on current trends, posting about <span className="text-white font-medium">Workshops</span> on <span className="text-white font-medium">Tuesday evenings</span> will yield 40% higher engagement.
                    </p>
                    <div className="h-40 bg-zinc-800/50 rounded-lg border border-white/5 flex items-center justify-center">
                        <span className="text-xs text-gray-600">Engagement Graph</span>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-purple-500/10 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-4">Member Sentiment</h3>
                    <p className="text-gray-400 text-sm mb-6">
                        Sentiment analysis of public channels indicates high excitement for the <span className="text-purple-300">RoboWar</span> event.
                    </p>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="w-12 text-xs text-gray-500 text-right">Positive</span>
                            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[75%]"></div>
                            </div>
                            <span className="text-xs text-emerald-500">75%</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-12 text-xs text-gray-500 text-right">Neutral</span>
                            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 w-[20%]"></div>
                            </div>
                            <span className="text-xs text-amber-500">20%</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-12 text-xs text-gray-500 text-right">Negative</span>
                            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500 w-[5%]"></div>
                            </div>
                            <span className="text-xs text-rose-500">5%</span>
                        </div>
                    </div>
                </div>
            </div>

            <h3 className="text-white font-semibold mb-4">Actionable Recommendations</h3>
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                            ✨
                        </div>
                        <div>
                            <h4 className="text-gray-200 font-medium text-sm">Schedule a follow-up meeting</h4>
                            <p className="text-gray-500 text-xs mt-1">Based on the influx of new applications, it's recommended to schedule an orientation session.</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AIInsights;
