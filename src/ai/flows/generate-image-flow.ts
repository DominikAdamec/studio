'use server';
/**
 * @fileOverview A flow for generating images using Vertex AI's Imagen model.
 *
 * - generateImage - A function that handles image generation.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe('The generated image as a data URI.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(
  input: GenerateImageInput
): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async ({prompt}) => {
    // Using imagegeneration@006, a stable version of Imagen 2.
    // This is the recommended model for general use.
    const imagen = googleAI.vertex.model('imagegeneration@006');

    const {media} = await ai.generate({
      model: imagen,
      prompt: prompt,
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    const imageUrl = media.url;
    if (!imageUrl) {
      throw new Error('Image generation failed to produce an image.');
    }

    return {imageUrl};
  }
);
