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
  prompt: `You are an AI assistant that analyzes images and generates prompts for AI image generators, specifically Flux1.Dev.

  Analyze the following image and provide a concise description of its contents. Then, generate a prompt that could be used with Flux1.Dev to recreate a similar image.
  
  The user has specified the desired prompt length and detail level. Adhere to these settings:
  - Prompt Length: {{promptLength}}
  - Prompt Detail: {{promptDetail}}
  
  A 'low' length should be a very short phrase. 'Normal' should be one or two sentences. 'High' can be a full paragraph.
  A 'low' detail should only include the main subjects. 'Normal' should include key objects and the setting. 'High' detail should include intricate details, lighting, and artistic style.

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
    const {output} = await describePhotoForFlux1DevPrompt(input);
    return output!;
  }
);
