import { create } from 'zustand'

const useContentStore = create((set, get) => ({
  // Generated posts grouped by platform
  generatedPosts: {},       // { instagram: [...], linkedin: [...], ... }
  agentSteps: [],           // streaming step messages
  isGenerating: false,
  generationComplete: false,
  error: null,

  // Saved content list
  contentList: [],

  startGeneration: () =>
    set({ isGenerating: true, generationComplete: false, generatedPosts: {}, agentSteps: [], error: null }),

  addAgentStep: (message) =>
    set((state) => ({ agentSteps: [...state.agentSteps, { message, timestamp: Date.now() }] })),

  addGeneratedPost: (platform, post) =>
    set((state) => ({
      generatedPosts: {
        ...state.generatedPosts,
        [platform]: [...(state.generatedPosts[platform] || []), post],
      },
    })),

  completeGeneration: () => set({ isGenerating: false, generationComplete: true }),

  setError: (error) => set({ isGenerating: false, error }),

  updatePost: (platform, index, updates) =>
    set((state) => {
      const posts = [...(state.generatedPosts[platform] || [])]
      posts[index] = { ...posts[index], ...updates }
      return { generatedPosts: { ...state.generatedPosts, [platform]: posts } }
    }),

  clearGeneration: () =>
    set({ generatedPosts: {}, agentSteps: [], isGenerating: false, generationComplete: false, error: null }),

  setContentList: (list) => set({ contentList: list }),
}))

export default useContentStore
