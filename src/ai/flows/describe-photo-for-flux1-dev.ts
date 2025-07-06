'use server';

/**
 * @fileOverview Describes the contents of a photo and generates a prompt for the Flux1.Dev AI image generator.
 *
 * - describePhotoForFlux1Dev - A function that handles the photo description and prompt generation.
 * - DescribePhotoForFlux1DevInput - The input type for the describePhotoForFlux1Dev function.
 * - DescribePhotoForFlux1DevOutput - The return type for the describePhotoForFlux1Dev function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DescribePhotoForFlux1DevInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to be described, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  promptLength: z.enum(['low', 'normal', 'high']).default('normal').describe('The desired length of the generated prompt.'),
  promptDetail: z.enum(['low', 'normal', 'high']).default('normal').describe('The desired level of detail in the generated prompt.'),
  language: z.string().default('English').describe('The output language for the description and prompt.'),
  allowNsfw: z.boolean().default(false).describe('Whether to allow potentially unsafe content.'),
});
export type DescribePhotoForFlux1DevInput = z.infer<typeof DescribePhotoForFlux1DevInputSchema>;

const DescribePhotoForFlux1DevOutputSchema = z.object({
  description: z.string().describe('A description of the photo.'),
  prompt: z.string().describe('A prompt tailored for the Flux1.Dev AI image generator.'),
});
export type DescribePhotoForFlux1DevOutput = z.infer<typeof DescribePhotoForFlux1DevOutputSchema>;

export async function describePhotoForFlux1Dev(input: DescribePhotoForFlux1DevInput): Promise<DescribePhotoForFlux1DevOutput> {
  return describePhotoForFlux1DevFlow(input);
}

const describePhotoForFlux1DevPrompt = ai.definePrompt({
  name: 'describePhotoForFlux1DevPrompt',
  input: {schema: DescribePhotoForFlux1DevInputSchema},
  output: {schema: DescribePhotoForFlux1DevOutputSchema},
  prompt: `You are the AI Chat Master, an advanced AI assistant powered by Google's Gemini models, integrated into an application called Prompty. Your purpose is to provide expert assistance for crafting and refining image generation prompts. You are an expert in using models like Flux1.Dev, Midjourney, and DALL-E.

  Analyze the following image and provide a concise description of its contents. Then, generate a prompt that could be used with Flux1.Dev to recreate a similar image.
  
  The user has specified the desired prompt length, detail level, and language. Adhere to these settings:
  - Prompt Length: {{promptLength}}
  - Prompt Detail: {{promptDetail}}
  - Output Language: {{language}}
  
  A 'low' length should be a very short phrase. 'Normal' should be one or two sentences. 'High' can be a full paragraph.
  A 'low' detail should only include the main subjects. 'Normal' should include key objects and the setting. 'High' detail should include intricate details, lighting, and artistic style.

  Ensure both the description and the prompt are in {{language}}.

  Image: {{media url=photoDataUri}}

  Description:
  Prompt:`, 
});

const describePhotoForFlux1DevFlow = ai.defineFlow(
  {
    name: 'describePhotoForFlux1DevFlow',
    inputSchema: DescribePhotoForFlux1DevInputSchema,
    outputSchema: DescribePhotoForFlux1DevOutputSchema,
  },
  async input => {
    const safetySettings = input.allowNsfw ? [{
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      }, {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      }, {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      }, {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      }] : [];

    const {output} = await describePhotoForFlux1DevPrompt(input, { safetySettings });
    return output!;
  }
);
