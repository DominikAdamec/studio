import { config } from 'dotenv';
config();

import '@/ai/flows/describe-photo-for-flux1-dev.ts';
import '@/ai/flows/generate-prompt-ideas.ts';
import '@/ai/flows/chat-flow.ts';
