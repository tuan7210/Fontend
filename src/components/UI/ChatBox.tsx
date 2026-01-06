import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, TrendingUp, Loader2, RotateCcw } from 'lucide-react';
import { chatService, ChatProduct, ChatMode } from '../../services/chatService';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  products?: ChatProduct[];
  mode?: ChatMode;
  timestamp: Date;
}

const ChatBox: React.FC = () => {
  const initialMessages = (): Message[] => ([
    {
      id: '1',
      type: 'ai' as const,
      text: 'Xin chào! 👋 Tôi là trợ lý AI của TechStore. Tôi có thể giúp bạn tìm sản phẩm phù hợp.',
      timestamp: new Date()
    }
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages());
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [topK] = useState(3);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ SESSION ID – QUAN TRỌNG
  const sessionId = useRef<string>(crypto.randomUUID());

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const data = await chatService.askChat({
        query: userMessage.text,
        session_id: sessionId.current, // ✅ GỬI SESSION
        top_k: topK
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: data.answer,
        products: data.products,
        mode: data.mode,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'ai',
          text: 'Xin lỗi, đã có lỗi xảy ra 😔',
          timestamp: new Date()
        }
      ]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + ' đ';
  };

  const handleReset = () => {
    sessionId.current = crypto.randomUUID();
    setMessages(initialMessages());
    setInputValue('');
  };

  const getImageSrc = (u?: string | null) => {
    if (!u) return '';
    // If absolute and not pointing to /images, keep as is
    if (/^https?:\/\//.test(u) && !u.includes('/images/')) return u;
    // Else extract filename and use API route
    const fileName = u.split('/').pop() || u;
    return `http://localhost:5032/api/Product/image/${fileName}`;
  };

  const renderProducts = (products: ChatProduct[]) => {
    if (!products || products.length === 0) return null;

    return (
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
          <TrendingUp className="w-4 h-4" />
          <span>Sản phẩm gợi ý cho bạn:</span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {products.map((product) => (
            <Link
              key={product.productId}
              to={`/product/${product.productId}`}
              className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-lg hover:border-blue-300 transition-all group"
            >
              <div className="flex gap-3">
                {product.imageUrl && (
                  <img
                    src={getImageSrc(product.imageUrl)}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 text-sm mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {product.name}
                  </h4>
                  <div className="text-xs text-gray-500 mb-1">
                    {product.brand} {product.category && `• ${product.category}`}
                  </div>
                  <div className="text-blue-600 font-bold text-sm mb-2">
                    {formatPrice(product.price)}
                  </div>
                  {(product.usp || product.specificationsText) && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {(product.usp || product.specificationsText || '').toString().slice(0, 150)}
                      {(product.usp || product.specificationsText || '').toString().length > 150 && '...'}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Chat Icon Button - Floating */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
          aria-label="Open AI Chat"
        >
          <Bot className="w-7 h-7 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
            AI
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">AI Tư Vấn</h3>
                <div className="flex items-center gap-1 text-xs text-blue-100">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span>Đang hoạt động</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-white text-xs px-2 py-1 rounded border border-white/30" title="Số sản phẩm gợi ý">Top 3</div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`inline-block max-w-[85%] rounded-2xl px-4 py-2 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                        : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                    }`}
                  >
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mb-2 bg-green-100 text-green-700`}>
                        {'🤖 AI'}
                      </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
                  </div>
                  
                  {/* Products */}
                  {message.products && message.products.length > 0 && (
                    <div className="mt-2">
                      {renderProducts(message.products)}
                    </div>
                  )}

                  <div className={`text-xs text-gray-400 mt-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                    {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">AI đang suy nghĩ...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Mô tả nhu cầu của bạn..."
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-sm"
                disabled={loading}
              />
              <button
                onClick={handleReset}
                disabled={loading}
                className="w-12 h-12 rounded-xl border-2 border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Reset chat"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={handleSend}
                disabled={loading || !inputValue.trim()}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Nhấn Enter để gửi • Mô tả chi tiết để có kết quả tốt nhất
            </p>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </>
  );
};

export default ChatBox;
