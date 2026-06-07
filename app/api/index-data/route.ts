import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { Document } from '@langchain/core/documents';
import { indexName, pinecone, getEmbeddings } from '@/lib/pinecone';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('Starting indexing process...');
    
    // 1. Read CSV
    const csvFilePath = path.join(process.cwd(), 'samples', 'review.csv');
    if (!fs.existsSync(csvFilePath)) {
      throw new Error('CSV file not found at ' + csvFilePath);
    }
    
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    
    console.log(`Parsed ${records.length} records from CSV`);
    console.log('Records type:', typeof records, Array.isArray(records));

    // 2. Prepare Documents for Langchain
    console.log('Mapping records to documents...');
    const documents = records.map((record: Record<string, string>) => {
      const pageContent = `제목: ${record.title}\n내용: ${record.content}\n평점: ${record.rating}점`;
      
      return new Document({
        pageContent,
        metadata: {
          original_id: record.id,
          rating: parseInt(record.rating),
          author: record.author,
          date: record.date,
          helpful_votes: parseInt(record.helpful_votes),
          verified_purchase: record.verified_purchase === 'true',
        },
      });
    });

    // 3. Upload to Pinecone
    console.log('Fetching existing Pinecone indexes...');
    const existingIndexes = await pinecone.listIndexes();
    console.log('Existing indexes response:', existingIndexes);
    const indexExists = existingIndexes.indexes?.some(i => i.name === indexName);
    
    if (!indexExists) {
       console.log(`Index ${indexName} does not exist. Please create it in the Pinecone console.`);
       throw new Error(`Index ${indexName} not found.`);
    }

    console.log('Uploading documents to Pinecone...');
    console.log('Vector store initialized');
    
    // Batch upload to prevent payload size issues
    const batchSize = 50;
    const embeddings = getEmbeddings();
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      console.log(`Uploading batch ${i / batchSize + 1} to Pinecone...`);
      
      const vectors = await embeddings.embedDocuments(batch.map((d: Document) => d.pageContent));
      const pineconeVectors = batch.map((doc: Document, idx: number) => ({
        id: doc.metadata.original_id,
        values: vectors[idx],
        metadata: {
          ...doc.metadata,
          text: doc.pageContent
        }
      }));

      await pinecone.Index(indexName).upsert(pineconeVectors);
      console.log(`Uploaded batch ${i / batchSize + 1}`);
    }

    // 4. Upload to Supabase
    console.log('Mapping records for Supabase...');
    const supabaseRecords = records.map((record: Record<string, string>) => ({
      original_id: record.id,
      rating: parseInt(record.rating),
      title: record.title,
      content: record.content,
      author: record.author,
      review_date: record.date,
      helpful_votes: parseInt(record.helpful_votes),
      verified_purchase: record.verified_purchase === 'true',
    }));

    // Optional: Delete existing to prevent duplication on multiple runs
    // await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('Inserting records to Supabase...');
    const { error } = await supabase.from('reviews').insert(supabaseRecords);

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }

    console.log('Indexing completed successfully');
    return NextResponse.json({ success: true, message: 'Data indexed successfully' });
  } catch (error: unknown) {
    console.error('Indexing error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message, stack: (error as Error).stack }, { status: 500 });
  }
}
