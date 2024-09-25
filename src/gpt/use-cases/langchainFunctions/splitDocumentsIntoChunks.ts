import { Document } from '@langchain/core/documents';

import { CharacterTextSplitter } from 'langchain/text_splitter';

const splitDocumentsIntoChunks = async (
  documents: Document<Record<string, any>>[],
): Promise<Document<Record<string, any>>[]> => {
  const textSplitter = new CharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 50,
  });

  const splitDocs = await textSplitter.splitDocuments(documents);

  return splitDocs.map((chunk) => ({
    ...chunk,
    metadata: {
      ...chunk.metadata,
      source: chunk.metadata.source,
      page: chunk.metadata.page || 'unknown',
    },
  }));
};

export default splitDocumentsIntoChunks;
