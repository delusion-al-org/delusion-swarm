import { Agent } from '@mastra/core/agent';
import { getModelChain } from '../providers/registry';

export const echoAgent = new Agent({
  id: 'echo',
  name: 'echo',
  instructions:
    'You are a simple echo agent used for testing the delegation chain. ' +
    'When you receive a message, repeat it back exactly as you received it, ' +
    'prefixed with "[echo] ". Do not add any other commentary.',
  model: getModelChain('echo', 'free'),
});
