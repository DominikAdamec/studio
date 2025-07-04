// src/lib/actions.ts
'use server';

import { generatePromptIdeas as generatePromptIdeasFlow } from '@/ai/flows/generate-prompt-ideas';
import { describePhotoForFlux1Dev as describePhotoForFlux1DevFlow } from '@/ai/flows/describe-photo-for-flux1-dev';
import { z } from 'zod';

const generateIdeasSchema = z.object({
  topic: z.string().min(1, 'Please enter a topic.'),
  style: z.string().optional(),
  mood: z.string().optional(),
});

export async function generateIdeasAction(prevState: any, formData: FormData) {
  const validatedFields = generateIdeasSchema.safeParse({
    topic: formData.get('topic'),
    style: formData.get('style'),
    mood: formData.get('mood'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    const { promptIdeas } = await generatePromptIdeasFlow(validatedFields.data);
    return { message: 'success', errors: null, data: promptIdeas };
  } catch (error) {
    console.error(error);
    return { message: 'AI error: Could not generate ideas.', errors: null, data: null };
  }
}


const describePhotoSchema = z.object({
    photoDataUri: z.string().min(1, 'Please upload a photo.'),
});

export async function describePhotoAction(prevState: any, formData: FormData) {
    const validatedFields = describePhotoSchema.safeParse({
        photoDataUri: formData.get('photoDataUri'),
    });

    if (!validatedFields.success) {
        return {
            message: 'Invalid data.',
            errors: validatedFields.error.flatten().fieldErrors,
            data: null,
        };
    }

    try {
        const result = await describePhotoForFlux1DevFlow(validatedFields.data);
        return { message: 'success', errors: null, data: result };
    } catch (error) {
        console.error(error);
        return { message: 'AI error: Could not describe photo.', errors: null, data: null };
    }
}
