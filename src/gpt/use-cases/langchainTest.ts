import 'dotenv/config';
import * as path from 'path';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import splitDocumentsIntoChunks from './langchainFunctions/splitDocumentsIntoChunks';
import { loadDocumentsFromDirectory } from './langchainFunctions/loadDocumentsFromDirectory';

const langchainTest = async (question: string) => {
  const dirPath = path.resolve(__dirname, '../../../documents');
  let documents = await loadDocumentsFromDirectory(dirPath);

  documents = await splitDocumentsIntoChunks(documents);

  const vectorStore = await MemoryVectorStore.fromDocuments(
    documents,
    new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    }),
  );

  const searchResponse = await vectorStore.similaritySearch(question, 6);
  const resultWithMetadata = searchResponse.map((item) => ({
    content: item.pageContent,
    source: item.metadata?.source,
    page: item.metadata?.page,
  }));

  const textRes = resultWithMetadata
    .map(
      (item) =>
        `From document: ${item.source}, Page: ${item.page}\nContent: ${item.content}`,
    )
    .join('\n\n');

  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.3,
    maxTokens: 500,
  });

  const completion = await llm.invoke([
    {
      role: 'system',
      content: `
        You are an expert auditor. 
        Read the following document text carefully and provide precise, short answers to questions based only on the provided text.
        
        The provided text contains references to the source of the information.
        You must tell when are you using each source. Use quotation marks.
        Text: "${textRes}"
        
        The answer must be a valid JSON object (json).
        The response should be provided in **Markdown** format.
        Structure any tables, bullet points, or other relevant information accordingly.
        At the end of the response add all the sources of information that are being used, including the document name and page number.
      `,
    },
    {
      role: 'user',
      content: question,
    },
  ]);

  const formattedResponse = {
    message: completion.content,
    documentos: resultWithMetadata.reduce(
      (acc, item) => {
        const source = item.source;
        const page = item.page;

        if (acc[source]) {
          acc[source].push(page);
        } else {
          acc[source] = [page];
        }
        return acc;
      },
      {} as Record<string, string[]>,
    ),
  };

  console.log(JSON.stringify(formattedResponse, null, 2));

  return formattedResponse;
};

export default langchainTest;
