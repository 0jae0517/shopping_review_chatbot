import { NextResponse } from 'next/server';
import { getVectorStore } from '@/lib/pinecone';
import { supabase } from '@/lib/supabase';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

export async function POST(req: Request) {
  try {
    const { query, chatId: existingChatId } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // 1. Search Vector DB
    const vectorStore = await getVectorStore();
    const results = await vectorStore.similaritySearch(query, 5); // top 5

    const contextData = results.map(r => ({
      content: r.pageContent,
      metadata: r.metadata
    }));

    // 2. Generate Response using Langchain & OpenAI
    const llm = new ChatOpenAI({
      modelName: 'gpt-5-nano',
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const promptTemplate = PromptTemplate.fromTemplate(`
당신은 친절한 쇼핑 도우미 챗봇입니다.
사용자의 질문에 대해 제공된 리뷰 컨텍스트를 바탕으로 정확하고 상세하게 답변해주세요.
컨텍스트를 통해 답변할 수 없는 내용이라면, 알 수 없다고 솔직하게 말해주세요.

[관련 리뷰 컨텍스트]
{context}

사용자 질문: {question}

답변:`);

    const contextText = results.map(r => `[평점: ${r.metadata.rating}점] ${r.metadata.title}\n${r.pageContent.split('\n')[1].replace('내용: ', '')}`).join('\n\n');

    let botResponse = "";
    if (results.length > 0) {
      const chain = promptTemplate.pipe(llm).pipe(new StringOutputParser());
      botResponse = await chain.invoke({
        context: contextText,
        question: query
      });
    } else {
      botResponse = "관련된 리뷰를 찾을 수 없습니다. 다른 검색어나 질문을 입력해주세요.";
    }

    // 3. Save to Supabase
    let chatId = existingChatId;
    if (!chatId) {
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert([{}])
        .select()
        .single();
      
      if (chatError) throw new Error(`Chat creation error: ${chatError.message}`);
      chatId = chatData.id;
    }

    // Save user message
    await supabase.from('messages').insert({
      chat_id: chatId,
      role: 'user',
      content: query,
    });

    // Save bot message with context
    await supabase.from('messages').insert({
      chat_id: chatId,
      role: 'bot',
      content: botResponse,
      context: contextData,
    });

    return NextResponse.json({ 
      chatId, 
      response: botResponse, 
      context: contextData 
    });

  } catch (error: unknown) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
