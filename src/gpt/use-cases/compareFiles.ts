import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { MessageDTO } from '../dtos';
import { loadADocumentFromDirectory } from './langchainFunctions/loadDocumentsFromDirectory';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import * as path from 'path';
import splitDocumentsIntoChunks from './langchainFunctions/splitDocumentsIntoChunks';

const compareFiles = async (messageDto: MessageDTO, filenames: string[]) => {
  const dirPath = path.resolve(__dirname, '../../../uploads');
  const vectorStoreList: MemoryVectorStore[] = [];

  for (const filename of filenames) {
    const document = await loadADocumentFromDirectory(dirPath, filename);
    const documentChunks = await splitDocumentsIntoChunks(document);
    const vectorStore = await MemoryVectorStore.fromDocuments(
      documentChunks,
      new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
      }),
    );

    vectorStoreList.push(vectorStore);
  }

  const results = await Promise.all(
    vectorStoreList.map(async (store) => {
      const searchResponse = await store.similaritySearch(messageDto.prompt, 5);
      const responseWithMetadata = searchResponse.map((item) => ({
        content: item.pageContent,
        source: item.metadata?.source,
        page: item.metadata?.page,
      }));
      return responseWithMetadata;
    }),
  );
  const flatResults = results.flat();

  const textRes = flatResults
    .map(
      (item) =>
        `From document: ${item.source}, Page: ${item.page}\nContent: ${item.content}`,
    )
    .join('\n\n');

  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.3,
    maxTokens: 1500,
  });

  const completion = await llm.invoke([
    {
      role: 'system',
      content: `
          You are an expert auditor. 
          Read the following document text carefully and provide precise answers to questions based only on the provided text.
          Answers must be complete and relevant
          
          The provided text contains references to the source of the information.
          You must tell when are you using each source. Use quotation marks. 
          Text: "${textRes}"
          
          The answer must be a valid JSON object (json).
          The response should be provided in **Markdown** format.
          Structure any tables, bullet points, or other relevant information accordingly. So its well Presented
          At the end of the response add all the sources of information that are being used, including the document name and page number.
        `,
    },
    {
      role: 'user',
      content: messageDto.prompt,
    },
  ]);

  const formattedResponse = {
    message: completion.content,
    documentos: flatResults.reduce(
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

export default compareFiles;
