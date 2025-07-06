// src/lib/actions.ts
'use server';

import {generatePromptIdeas as generatePromptIdeasFlow} from '@/ai/flows/generate-prompt-ideas';
import {describePhotoForFlux1Dev as describePhotoForFlux1DevFlow} from '@/ai/flows/describe-photo-for-flux1-dev';
import {chat as chatFlow} from '@/ai/flows/chat-flow';
import {generateImage as generateImageFlow} from '@/ai/flows/generate-image-flow';
import {z} from 'zod';
import {db} from './firebase';
import {redirect} from 'next/navigation';
import {doc, runTransaction, updateDoc} from 'firebase/firestore';

export async function upgradeToProAction(uid: string) {
  if (!uid) {
    return {
      success: false,
      message: 'User not identified. Please log in again.',
    };
  }

  const userRef = doc(db, 'users', uid);
  try {
    await updateDoc(userRef, {plan: 'pro'});
    return {
      success: true,
      message: "Congratulations! You've unlocked Prompty PRO!",
    };
  } catch (error) {
    console.error('Upgrade failed:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Could not update your plan.';
    return {success: false, message: `Upgrade Failed: ${errorMessage}`};
  }
}

export async function addCreditsAction(uid: string) {
  if (!uid) {
    return {
      success: false,
      message: 'User not identified. Please log in again.',
    };
  }

  const userRef = doc(db, 'users', uid);
  try {
    await runTransaction(db, async transaction => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error('User document does not exist!');
      }
      if (userDoc.data().plan !== 'pro') {
        throw new Error('Only PRO users can add credits.');
      }
      const currentCredits = userDoc.data().credits || 0;
      const newCredits = currentCredits + 100;
      transaction.update(userRef, {credits: newCredits});
    });
    return {
      success: true,
      message: '100 credits have been added to your account.',
    };
  } catch (error) {
    console.error('Adding credits failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Could not add credits.';
    return {success: false, message: `Error: ${errorMessage}`};
  }
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
    const {promptIdeas} = await generatePromptIdeasFlow(validatedFields.data);
    return {message: 'success', errors: null, data: promptIdeas};
  } catch (error) {
    console.error(error);
    return {
      message: 'AI error: Could not generate ideas.',
      errors: null,
      data: null,
    };
  }
}

const describePhotoSchema = z.object({
  photoDataUri: z.string().min(1, 'Please upload a photo.'),
  promptLength: z.enum(['low', 'normal', 'high']),
  promptDetail: z.enum(['low', 'normal', 'high']),
  language: z.string(),
  allowNsfw: z.preprocess(val => val === 'on', z.boolean()),
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
    return {message: 'success', errors: null, data: result};
  } catch (error) {
    console.error(error);
    return {
      message: 'AI error: Could not describe photo.',
      errors: null,
      data: null,
    };
  }
}

// Schema for chat history validation
const contentPartSchema = z.union([
  z.object({text: z.string()}),
  z.object({media: z.object({url: z.string()})}),
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
    return {
      message: 'Please enter a message or upload an image.',
      errors: null,
      data: null,
    };
  }

  const validatedFields = chatActionSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  const serverValidatedHistory = chatHistorySchema.safeParse(
    validatedFields.data.history
  );

  if (!serverValidatedHistory.success) {
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
    return {message: 'success', errors: null, data: result};
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      message: `AI error: Could not get a response. ${errorMessage}`,
      errors: null,
      data: null,
    };
  }
}

const generateImageSchema = z.object({
  prompt: z.string().min(1, 'Please enter a prompt.'),
  uid: z.string().min(1, 'You must be logged in to generate images.'),
});

const IMAGE_GENERATION_COST = 1;

export async function generateImageAction(prevState: any, formData: FormData) {
  const validatedFields = generateImageSchema.safeParse({
    prompt: formData.get('prompt'),
    uid: formData.get('uid'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  const userRef = doc(db, 'users', validatedFields.data.uid);

  try {
    // Use a transaction to safely read credits and then update
    const generatedImage = await runTransaction(db, async transaction => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error('User data not found.');
      }

      const userData = userDoc.data();
      if (userData.plan !== 'pro') {
        throw new Error(
          'Image generation is a PRO feature. Please upgrade your plan.'
        );
      }

      const credits = userData.credits || 0;
      if (credits < IMAGE_GENERATION_COST) {
        throw new Error(
          `Not enough credits. You need ${IMAGE_GENERATION_COST} credit(s) to generate an image.`
        );
      }

      // Now that we've checked credits, generate the image
      const {imageUrl} = await generateImageFlow({ prompt: validatedFields.data.prompt });

      // Deduct credits
      const newCreditTotal = credits - IMAGE_GENERATION_COST;
      transaction.update(userRef, {credits: newCreditTotal});

      return imageUrl;
    });

    return {message: 'success', errors: null, data: generatedImage};
  } catch (error) {
    console.error(error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return {message: `AI error: ${errorMessage}`, errors: null, data: null};
  }
}
