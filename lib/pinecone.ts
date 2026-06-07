import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { Embeddings } from '@langchain/core/embeddings';

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || 'dummy-key-for-build',
});

export const indexName = 'review-chatbot';

class CustomPineconeEmbeddings extends Embeddings {
  async embedDocuments(texts: string[]): Promise<number[][]> {
    console.log(`embedDocuments called with ${texts.length} texts`);
    if (texts.length === 0) return [];
    
    const res = await pinecone.inference.embed(
      'multilingual-e5-large',
      texts,
      { inputType: 'passage', truncate: 'END' }
    );
    
    console.log(`embedDocuments Pinecone returned ${res.data?.length} vectors`);
    if (!res.data || res.data.length === 0) {
      throw new Error(`Pinecone inference returned ${res.data?.length} vectors for ${texts.length} texts`);
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return res.data.map((d: any) => d.values);
  }

  async embedQuery(text: string): Promise<number[]> {
    const res = await pinecone.inference.embed(
      'multilingual-e5-large',
      [text],
      { inputType: 'query', truncate: 'END' }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (res.data[0] as any).values;
  }
}

export const getEmbeddings = () => {
  return new CustomPineconeEmbeddings({});
};

export const getVectorStore = async () => {
  const index = pinecone.Index(indexName);
  const embeddings = getEmbeddings();
  
  return await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index,
  });
};
