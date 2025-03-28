import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    
    console.log('Sending request to OpenRouter with:', {
      message,
      historyLength: history?.length || 0
    });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "https://localhost:3000",
        "X-Title": "FinGPT",
        "Content-Type": "application/json",
        "OR-ORGANIZATION-ID": process.env.OPENROUTER_ORGANIZATION_ID || "org-123"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          {
            role: "system",
            content: "You are FinGPT, a helpful AI assistant focused on financial topics."
          },
          ...(history || []).map((msg: any) => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('OpenRouter API response:', {
      success: true,
      hasChoices: Boolean(data.choices?.length),
      firstChoice: data.choices?.[0]
    });

    const assistantResponse = data.choices?.[0]?.message?.content;

    if (!assistantResponse) {
      console.error('No response content in API response:', data);
      throw new Error('No response from the model');
    }

    return NextResponse.json({
      success: true,
      response: assistantResponse
    });
  } catch (error) {
    console.error('FinGPT API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while processing your request'
    }, { status: 500 });
  }
} 