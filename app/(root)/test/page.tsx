import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export default function Page() {
  const textSplitter = async (text: string) => {
    const splitter = new RecursiveCharacterTextSplitter({
      separators: ["\n\n", ",", "\n", " "],
      chunkSize: 100,
      chunkOverlap: 20,
    });

    const chunks: string[] = await splitter.splitText(text);
    console.log(chunks);
    return chunks;
  };

  const sampleText = `
    This is a sample text that demonstrates the recursive text splitting algorithm. 
    The goal is to create meaningful chunks that can be used for embedding models. 
    By using multiple separators and respecting token limits, we can create high-quality 
    text segments that preserve context and minimize information loss.
    `;
  textSplitter(sampleText);

  return <div>Test</div>;
}
