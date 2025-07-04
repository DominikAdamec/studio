// src/lib/actions.ts
'use server';

import { generatePromptIdeas as generatePromptIdeasFlow } from '@/ai/flows/generate-prompt-ideas';
import { describePhotoForFlux1Dev as describePhotoForFlux1DevFlow } from '@/ai/flows/describe-photo-for-flux1-dev';
import { chat as chatFlow, ChatInputSchema as ServerChatInputSchema } from '@/ai/flows/chat-flow';
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
    promptLength: z.enum(['low', 'normal', 'high']),
    promptDetail: z.enum(['low', 'normal', 'high']),
    language: z.string(),
    allowNsfw: z.preprocess((val) => val === 'on', z.boolean()),
});

export async function describePhotoAction(prevState: any, formData: FormData) {
    const validatedFields = describePhotoSchema.safeParse({
        photoDataUri: formData.get('photoDataUri'),
        promptLength: formData.get('promptLength'),
        promptDetail: formData.get('promptDetail'),
        language: formData.get('language'),
        allowNsfw: formData.get('allowNsfw'),
    });

    if (!validatedFields.success) {
        return {
            message: 'Invalid data. Please check your selections.',
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

const chatActionSchema = z.object({
  history: z.string().transform(str => JSON.parse(str)),
  prompt: z.string().min(1, 'Please enter a message.'),
});

export async function chatAction(prevState: any, formData: FormData) {
    const validatedFields = chatActionSchema.safeParse({
        history: formData.get('history'),
        prompt: formData.get('prompt'),
    });

    if (!validatedFields.success) {
        return {
            message: 'Invalid form data.',
            errors: validatedFields.error.flatten().fieldErrors,
            data: null,
        };
    }
    
    const serverValidatedHistory = ServerChatInputSchema.shape.history.safeParse(validatedFields.data.history);

    if(!serverValidatedHistory.success) {
      return {
        message: 'Invalid history format.',
        errors: null,
        data: null,
      };
    }

    try {
        const result = await chatFlow({ 
          history: serverValidatedHistory.data, 
          prompt: validatedFields.data.prompt 
        });
        return { message: 'success', errors: null, data: result };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { message: `AI error: Could not get a response. ${errorMessage}`, errors: null, data: null };
    }
}
