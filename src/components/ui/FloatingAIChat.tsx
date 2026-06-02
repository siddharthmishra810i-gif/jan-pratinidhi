import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles } from 'lucide-react';

export function FloatingAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage, history: messages }),
      });

      if (!response.ok) throw new Error('Failed to fetch AI response');
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="liquid-glass rounded-full p-4 text-white flex items-center justify-center shadow-2xl relative group"
            >
              <div className="absolute inset-0 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Sparkles className="w-6 h-6 " />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[350px] sm:w-[400px] max-h-[600px] h-[80vh] flex flex-col liquid-glass rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-white/[0.02]">
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 opacity-80" />
                <span className="font-serif text-xl">AI Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors p-2 liquid-glass rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
              {messages.length === 0 ? (
                <div className="m-auto text-center text-white/40 max-w-[250px]">
                  <Sparkles className="w-8 h-8 opacity-50 mx-auto mb-4" />
                  <p className="text-sm">Ask anything about political performance, constituency data, or representative comparisons.</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-white/10 text-white self-end rounded-br-sm' : 'liquid-glass text-white/90 self-start rounded-bl-sm'} whitespace-pre-wrap`} >
                    {msg.content}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="liquid-glass rounded-2xl p-3 text-sm text-white/60 self-start rounded-bl-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 shrink-0 bg-white/[0.02] flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 bg-transparent border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
              <button 
                type="submit" 
                disabled={isLoading || !query.trim()}
                className="liquid-glass rounded-full p-2.5 text-white disabled:opacity-50 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
