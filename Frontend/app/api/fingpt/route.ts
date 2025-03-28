import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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",
        "HTTP-Referer": "http://localhost:3001",
        "X-Title": "FinGPT",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          {
            role: "system",
            content: "You are FinGPT, a helpful AI assistant focused on financial topics."
          },
          ...history.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: "user",
            content: message
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const assistantResponse = data.choices[0]?.message?.content;

    if (!assistantResponse) {
      throw new Error('No response from the model');
    }

    return NextResponse.json({
      success: true,
      response: assistantResponse
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred'
    }, { status: 500 });
  }
} 