"use client";

import React, { useState } from "react";
import {
  BarChart2,
  Bell,
  ChevronDown,
  Clock,
  HelpCircle,
  LogOut,
  MessageSquare,
  Paperclip,
  PenTool,
  Phone,
  Plus,
  Send,
  Settings,
  User,
  Zap,
  Battery
} from "lucide-react";

export default function Home() {
  const [hasSearched, setHasSearched] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{role: string, content: string, context?: { content: string, metadata: { title: string, rating: number } }[]}[]>([]);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleIndexData = async () => {
    setIsIndexing(true);
    try {
      const res = await fetch('/api/index-data', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('샘플 데이터 인덱싱이 완료되었습니다.');
      } else {
        alert('인덱싱 실패: ' + data.error);
      }
    } catch (e: unknown) {
      alert('에러 발생: ' + (e as Error).message);
    } finally {
      setIsIndexing(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent, queryText?: string) => {
    if (e) e.preventDefault();
    const query = queryText || inputValue.trim();
    if (!query || isLoading) return;

    setHasSearched(true);
    setInputValue("");
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, chatId })
      });
      const data = await res.json();
      
      if (data.chatId) setChatId(data.chatId);
      
      if (data.error) {
        setMessages(prev => [...prev, { role: 'bot', content: '오류: ' + data.error }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', content: data.response, context: data.context }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'bot', content: '네트워크 오류가 발생했습니다.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    handleSearch(undefined, text);
  };

  const startNewChat = () => {
    setHasSearched(false);
    setChatId(null);
    setMessages([]);
    setInputValue("");
  };

  return (
    <div className="flex h-screen w-full bg-white text-slate-900 font-sans">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-200 bg-[#f8f9fa] flex flex-col justify-between hidden md:flex">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-white shrink-0">
              <BarChart2 size={16} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-700 leading-tight">ReviewPulse</h1>
              <p className="text-xs text-slate-500 font-medium">AI Insights</p>
            </div>
          </div>

          <button 
            onClick={startNewChat}
            className="w-full bg-[#0d52bc] hover:bg-blue-700 text-white rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors mb-2"
          >
            <Plus size={18} />
            New Chat
          </button>

          <button 
            onClick={handleIndexData}
            disabled={isIndexing}
            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors mb-6 disabled:opacity-50"
          >
            <Zap size={18} />
            {isIndexing ? '인덱싱 진행중...' : '샘플 데이터 인덱싱'}
          </button>

          <nav className="space-y-1">
            {hasSearched && (
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#55f2b3] text-slate-900 font-medium text-sm">
                <MessageSquare size={18} className="text-slate-700" />
                Chat
              </a>
            )}
            <a href="#" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${!hasSearched ? "text-slate-700 hover:bg-slate-100" : "text-slate-600 hover:bg-slate-100"}`}>
              <Clock size={18} className="text-slate-500" />
              History
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium transition-colors">
              <BarChart2 size={18} className="text-slate-500" />
              Analytics
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium transition-colors">
              <Settings size={18} className="text-slate-500" />
              Settings
            </a>
          </nav>
        </div>

        <div className="p-6 border-t border-slate-200 space-y-1">
          <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium transition-colors">
            <HelpCircle size={18} className="text-slate-500" />
            Help
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium transition-colors">
            <LogOut size={18} className="text-slate-500" />
            Sign Out
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-[#fcfcfd]">
        {/* Header - Only visible in chat_2 state */}
        {hasSearched && (
          <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
            <h2 className="text-2xl font-bold text-[#0d52bc]">ReviewPulse AI</h2>
            <div className="flex items-center gap-5 text-slate-600">
              <button className="hover:text-slate-900 transition-colors"><Bell size={20} /></button>
              <button className="hover:text-slate-900 transition-colors"><Settings size={20} /></button>
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
                <User size={18} className="text-slate-400" />
              </div>
            </div>
          </header>
        )}

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto">
          {!hasSearched ? (
            /* chat_1 Empty State */
            <div className="h-full flex flex-col items-center justify-center px-6 pb-20">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                <MessageSquare size={40} className="text-[#0d52bc]" />
              </div>
              <h2 className="text-3xl font-bold text-center mb-4 text-slate-900 tracking-tight">
                안녕하세요!<br />
                상품 리뷰에 대해 무엇이든 물어보세요.
              </h2>
              <p className="text-slate-600 text-center text-lg mb-12 max-w-xl leading-relaxed">
                수만 개의 리뷰를 분석하여 제품의 장단점, 주요 키워드, 그리고<br />
                실제 사용자 경험을 요약해 드립니다.
              </p>
              <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
                <button onClick={() => handleSuggestionClick("운동할 때 써도 돼요?")} className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-[#0d52bc] rounded-full border border-blue-100 hover:bg-blue-100 transition-colors text-sm font-medium">
                  <PenTool size={16} />
                  운동할 때 써도 돼요?
                </button>
                <button onClick={() => handleSuggestionClick("배터리 오래 가나요?")} className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-[#0d52bc] rounded-full border border-blue-100 hover:bg-blue-100 transition-colors text-sm font-medium">
                  <Battery size={16} />
                  배터리 오래 가나요?
                </button>
                <button onClick={() => handleSuggestionClick("통화 품질은?")} className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-[#0d52bc] rounded-full border border-blue-100 hover:bg-blue-100 transition-colors text-sm font-medium">
                  <Phone size={16} />
                  통화 품질은?
                </button>
              </div>
            </div>
          ) : (
            /* chat_2 Results State */
            <div className="max-w-4xl mx-auto w-full pt-8 px-6 pb-32 flex flex-col gap-8">
              {messages.map((msg, idx) => (
                <React.Fragment key={idx}>
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="bg-[#0d52bc] text-white px-5 py-4 rounded-2xl rounded-tr-sm max-w-[85%] text-base shadow-sm whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C8.13401 2 5 5.13401 5 9V14C5 17.866 8.13401 21 12 21C15.866 21 19 17.866 19 14V9C19 5.13401 15.866 2 12 2ZM7 9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V14C17 16.7614 14.7614 19 12 19C9.23858 19 7 16.7614 7 14V9Z" fill="#0d52bc"/>
                          <circle cx="9.5" cy="11.5" r="1.5" fill="#0d52bc"/>
                          <circle cx="14.5" cy="11.5" r="1.5" fill="#0d52bc"/>
                          <path d="M10 15H14" stroke="#0d52bc" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M4 10H5V13H4V10Z" fill="#0d52bc"/>
                          <path d="M19 10H20V13H19V10Z" fill="#0d52bc"/>
                          <path d="M11 2L11 4" stroke="#0d52bc" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M13 2L13 4" stroke="#0d52bc" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div className="flex-1 bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-6 shadow-sm">
                        <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        
                        {msg.context && msg.context.length > 0 && (
                          <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden">
                            <button className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors">
                              <span className="flex items-center gap-2 font-medium text-slate-800">
                                <span className="text-xl leading-none font-serif text-slate-400">&quot;</span>
                                참고한 원본 리뷰 데이터 ({msg.context.length}개)
                              </span>
                              <div className="flex items-center gap-3">
                                <ChevronDown size={18} className="text-slate-400" />
                              </div>
                            </button>
                            <div className="bg-slate-50 border-t border-slate-200 p-4 max-h-60 overflow-y-auto">
                               {msg.context.map((ctx: { metadata: { title: string, rating: number }, content: string }, i: number) => (
                                 <div key={i} className="mb-3 pb-3 border-b border-slate-200 last:border-0 last:mb-0 last:pb-0">
                                   <div className="flex items-center gap-2 mb-1">
                                     <span className="font-semibold text-slate-700 text-sm">{ctx.metadata.title}</span>
                                     <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{ctx.metadata.rating}점</span>
                                   </div>
                                   <p className="text-sm text-slate-600 line-clamp-2">{ctx.content}</p>
                                 </div>
                               ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
              
              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                    <div className="w-4 h-4 border-2 border-[#0d52bc] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-6 py-4 shadow-sm flex items-center">
                    <span className="text-slate-500 animate-pulse">답변을 생성하고 있습니다...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area (Fixed at bottom) */}
        <div className="p-4 bg-[#fcfcfd]">
          <div className="max-w-4xl mx-auto w-full relative">
            {hasSearched && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                <button className="whitespace-nowrap px-4 py-1.5 bg-[#eff3f8] text-slate-700 border border-slate-200 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors">
                  장단점 요약
                </button>
                <button className="whitespace-nowrap px-4 py-1.5 bg-[#eff3f8] text-slate-700 border border-slate-200 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors">
                  가격에 대한 반응 분석
                </button>
                <button className="whitespace-nowrap px-4 py-1.5 bg-[#eff3f8] text-slate-700 border border-slate-200 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors">
                  이전 모델과 비교
                </button>
              </div>
            )}
            
            <form onSubmit={handleSearch} className="relative flex items-center bg-white border border-slate-300 rounded-xl shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all overflow-hidden">
              <button type="button" className="pl-4 pr-2 text-slate-400 hover:text-slate-600">
                <Paperclip size={20} />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={!hasSearched ? "분석하고 싶은 상품의 URL이나 제품명을 입력하세요..." : "특정 기능, 반응, 또는 트렌드에 대해 물어보세요..."}
                className="flex-1 py-4 px-2 outline-none text-slate-800 placeholder:text-slate-400 bg-transparent text-base"
              />
              <div className="pr-3 pl-2">
                <button 
                  type="submit" 
                  disabled={!inputValue.trim() && !hasSearched}
                  className="bg-[#0d52bc] hover:bg-blue-700 text-white w-10 h-10 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} className="mr-0.5 mt-0.5" />
                </button>
              </div>
            </form>
            
            <p className="text-center text-xs text-slate-400 mt-3 mb-2">
              AI는 실수를 할 수 있습니다. {!hasSearched ? "중요한 정보는 확인해주세요." : "중요한 리뷰 데이터는 확인해주세요."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
