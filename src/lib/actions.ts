// src/lib/actions.ts
'use server';

import { generatePromptIdeas as generatePromptIdeasFlow } from '@/ai/flows/generate-prompt-ideas';
import { describePhotoForFlux1Dev as describePhotoForFlux1DevFlow } from '@/ai/flows/describe-photo-for-flux1-dev';
import { chat as chatFlow } from '@/ai/flows/chat-flow';
import { z } from 'zod';
import { auth } from './firebase';
import { redirect } from 'next/navigation';

export async function signOutAction() {
    await auth.signOut();
    redirect('/login');
}

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

// Schema for chat history validation
const contentPartSchema = z.union([
    z.object({ text: z.string() }),
    z.object({ media: z.object({ url: z.string() }) }),
]);
const messageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(contentPartSchema),
});
const chatHistorySchema = z.array(messageSchema);

const chatActionSchema = z.object({
  history: z.string().transform(str => {
      try {
        return JSON.parse(str);
      } catch (e) {
        return str; // let zod handle the error
      }
    }),
  prompt: z.string(),
  image: z.string().optional(),
});

export async function chatAction(prevState: any, formData: FormData) {
    const rawData = {
        history: formData.get('history'),
        prompt: formData.get('prompt'),
        image: formData.get('image'),
    };

    // A user can send an image without a prompt
    if (!rawData.prompt && !rawData.image) {
        return { message: "Please enter a message or upload an image.", errors: null, data: null };
    }

    const validatedFields = chatActionSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            message: 'Invalid form data.',
            errors: validatedFields.error.flatten().fieldErrors,
            data: null,
        };
    }
    
    const serverValidatedHistory = chatHistorySchema.safeParse(validatedFields.data.history);

    if(!serverValidatedHistory.success) {
      return {
        message: 'Invalid history format.',
        errors: serverValidatedHistory.error.flatten().fieldErrors,
        data: null,
      };
    }

    try {
        const result = await chatFlow({ 
          history: serverValidatedHistory.data, 
          prompt: validatedFields.data.prompt,
          image: validatedFields.data.image,
        });
        return { message: 'success', errors: null, data: result };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return { message: `AI error: Could not get a response. ${errorMessage}`, errors: null, data: null };
    }
}
