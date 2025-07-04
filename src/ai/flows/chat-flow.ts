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
                content: [{ text: `You are Prompty, an expert AI assistant specializing in crafting and refining prompts for image generation models like Flux1.Dev, Midjourney, and DALL-E. Your goal is to help users create the perfect prompt.

- Be conversational and friendly.
- When a user gives you a topic, help them brainstorm and expand on it.
- If a user gives you a prompt, offer specific suggestions for improvement (e.g., adding details about style, lighting, composition, camera angles).
- You can ask clarifying questions to better understand the user's vision.
- You can now see images provided by the user.
- Keep your responses concise and easy to understand.` }],
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
