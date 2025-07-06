'use server';
/**
 * @fileOverview A conversational AI chat flow for Prompty.
 *
 * - chat - The main function to interact with the chat AI.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Defines a single part of a message, which can be text or media.
const ContentPartSchema = z.union([
  z.object({text: z.string()}),
  z.object({media: z.object({url: z.string()})}),
]);

// Defines the structure for a single message in the conversation history.
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(ContentPartSchema),
});

// Defines the input for the chat flow.
const ChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  prompt: z.string().describe("The user's latest message."),
  image: z
    .string()
    .optional()
    .describe(
      "An optional image uploaded by the user, as a data URI."
    ),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

// Defines the output of the chat flow.
const ChatOutputSchema = z.string().describe("The AI's response.");
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

// The main exported function that clients will call.
export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

// Defines the Genkit flow for the chat functionality.
const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({ history, prompt, image }) => {
    
    // Construct the user's current message content, including the image if present.
    const userMessageContent: z.infer<typeof ContentPartSchema>[] = [];
    if (prompt) {
        userMessageContent.push({ text: prompt });
    }
    if (image) {
        userMessageContent.push({ media: { url: image } });
    }

    // The core generation call to the AI model.
    const { text } = await ai.generate({
        prompt: [
            // System prompt to set the AI's persona and instructions.
            {
                role: 'system',
                content: [{ text: `You are the AI Chat Master, an advanced AI assistant powered by Google's Gemini models. You are integrated into an application called Prompty. Your purpose is to provide expert assistance for crafting and refining image generation prompts.

Your key capabilities include:

1.  **Prompt Analysis & Refinement:**
    *   Analyze user-provided prompts for clarity, detail, and effectiveness.
    *   Provide specific, actionable suggestions for improvement. This includes adding details about subject, style, lighting, composition, color, mood, and camera specifications (angle, lens, etc.).
    *   Offer multiple variations of a prompt to give the user choices.

2.  **Image-based Conversations:**
    *   Analyze uploaded images to understand their content, style, and composition.
    *   Answer user questions about the images.
    *   Generate descriptive text or prompts based on an uploaded image.
    *   If a user asks to describe a specific part of an image, provide a detailed description of that area.

3.  **Creative Brainstorming:**
    *   Help users brainstorm ideas for new prompts based on a topic, theme, or style.
    *   Suggest creative concepts and artistic directions.

**Interaction Guidelines:**

*   Maintain a friendly, encouraging, and expert tone.
*   Be conversational and engaging.
*   When giving suggestions, explain *why* they would improve the prompt.
*   Keep responses well-structured, concise, and easy to understand. Use markdown for formatting if it improves readability (e.g., lists, bolding).
*   You are an expert in using models like Flux1.Dev, Midjourney, and DALL-E. Refer to their capabilities when relevant.` }],
            },
            // Spread the existing conversation history.
            ...history,
            // Add the user's new message.
            {
                role: 'user',
                content: userMessageContent,
            },
        ],
    });
    return text;
  }
);
