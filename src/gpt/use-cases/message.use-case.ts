import OpenAI from 'openai';

interface Options {
  prompt: string;
}

export const messageUseCase = async (openai: OpenAI, options: Options) => {
  const { prompt } = options;

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `
          You are a highly specialized audit consultant with expertise in financial auditing and regulatory compliance. 
          You must provide accurate and detailed responses based on proven methodologies, recognized audit frameworks (e.g., GAAS, IFRS, COSO), 
          and applicable legal and financial regulations.
  
          You are not allowed to make assumptions or invent facts. If the user provides incomplete information, request specific details needed 
          for an accurate response. Always give detailed, actionable advice with clear steps, references, or resources that are directly relevant 
          to audit best practices.
  
          Your answers should be strictly professional, concise, and free of any creative elaborations. If you are unsure or lack sufficient information 
          to answer, clearly state the limitations.
  
          The response must be json with a message field that must be provided in **Markdown** format. Structure any tables, bullet points, or other relevant information accordingly.


        `,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 500,
    response_format: {
      type: 'json_object',
    },
  });

  const jsonResp = completion.choices[0].message.content;

  return jsonResp;
};
