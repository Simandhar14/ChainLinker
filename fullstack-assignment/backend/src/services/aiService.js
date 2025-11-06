// aiService wraps OpenAI or local mock — will swap in later

export async function callModel(prompt, options = {}) {
  // NOTE: right now, just a dummy json
  return {
    reasoning: 'Generic market comment',
    sentiment: 'Neutral',
  };
}
