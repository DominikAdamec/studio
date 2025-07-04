// src/ai/flows/generate-prompt-ideas.ts
'use server';

/**
 * @fileOverview Generates imaginative and unique prompt ideas for AI image generation.
 *
 * - generatePromptIdeas - A function that generates prompt ideas.
 * - GeneratePromptIdeasInput - The input type for the generatePromptIdeas function.
 * - GeneratePromptIdeasOutput - The return type for the generatePromptIdeas function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePromptIdeasInputSchema = z.object({
  topic: z
    .string()
    .describe('The topic or theme for which to generate prompt ideas.'),
  style: z
    .string()
    .optional()
    .describe('Optional artistic style to incorporate into the prompt ideas.'),
  mood: z
    .string()
    .optional()
    .describe('Optional mood or feeling to evoke with the prompt ideas.'),
});
export type GeneratePromptIdeasInput = z.infer<typeof GeneratePromptIdeasInputSchema>;

const GeneratePromptIdeasOutputSchema = z.object({
  promptIdeas: z
    .array(z.string())
    .describe('An array of imaginative and unique prompt ideas.'),
});
export type GeneratePromptIdeasOutput = z.infer<typeof GeneratePromptIdeasOutputSchema>;

export async function generatePromptIdeas(input: GeneratePromptIdeasInput): Promise<GeneratePromptIdeasOutput> {
  return generatePromptIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePromptIdeasPrompt',
  input: {schema: GeneratePromptIdeasInputSchema},
  output: {schema: GeneratePromptIdeasOutputSchema},
  prompt: `You are an AI prompt idea generator. Given a topic, style, and mood, you will generate 5 unique and imaginative prompt ideas for AI image generation.

Topic: {{{topic}}}
Style: {{{style}}}
Mood: {{{mood}}}

Here are 5 prompt ideas:
`,
});

const generatePromptIdeasFlow = ai.defineFlow(
  {
    name: 'generatePromptIdeasFlow',
    inputSchema: GeneratePromptIdeasInputSchema,
    outputSchema: GeneratePromptIdeasOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
