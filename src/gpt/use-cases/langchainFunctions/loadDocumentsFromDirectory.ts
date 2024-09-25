import * as path from 'path';
import * as fs from 'fs';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Document } from '@langchain/core/documents';
import { log } from 'console';

const loadDocumentsFromDirectory = async (
  dirPath: string,
): Promise<Document<Record<string, any>>[]> => {
  const documents: Document<Record<string, any>>[] = [];

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.resolve(dirPath, file);
    const fileExtension = file.split('.').pop()?.toLowerCase();

    let loader;

    if (fileExtension === 'pdf') {
      loader = new PDFLoader(filePath, { splitPages: true });
    } else {
      console.log(`Unsupported file type: ${file}`);
      continue;
    }

    const docs = await loader.load();
    docs.forEach((doc) => {
      doc.metadata = {
        ...doc.metadata,
        source: path.basename(filePath),
        page: doc.metadata.loc?.pageNumber || 'unknown',
      };
    });
    documents.push(...docs);
  }

  return documents;
};

const loadADocumentFromDirectory = async (dirPath, file) => {
  const filePath = path.resolve(dirPath, file);
  const fileExtension = file.split('.').pop()?.toLowerCase();

  let loader;

  if (fileExtension === 'pdf') {
    loader = new PDFLoader(filePath, { splitPages: true });
  } else {
    console.log(`Unsupported file type: ${file}`);
  }

  const doc = await loader.load();

  doc.forEach((doc) => {
    const trimmedFileName = path.basename(filePath).replace(/^\d+-/, '');
    doc.metadata = {
      ...doc.metadata,
      source: trimmedFileName,
      page: doc.metadata.loc?.pageNumber || 'unknown',
    };
  });

  return doc;
};

export { loadDocumentsFromDirectory, loadADocumentFromDirectory };
