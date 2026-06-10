import { create } from 'zustand'
import { brandsAPI } from '../services/api'

const useBrandStore = create((set, get) => ({
  brands: [],
  activeBrand: null,
  isLoading: false,
  error: null,

  fetchBrands: async () => {
    set({ isLoading: true })
    try {
      const { data } = await brandsAPI.list()
      set({ brands: data, isLoading: false })
      // Auto-select first brand if none active
      if (!get().activeBrand && data.length > 0) {
        set({ activeBrand: data[0] })
      }
    } catch (err) {
      set({ error: 'Failed to load brands', isLoading: false })
    }
  },

  createBrand: async (brandData) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await brandsAPI.create(brandData)
      set((state) => ({ brands: [...state.brands, data], isLoading: false, activeBrand: data }))
      return { success: true, brand: data }
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to create brand'
      set({ error: message, isLoading: false })
      return { success: false, error: message }
    }
  },

  updateBrand: async (id, brandData) => {
    try {
      const { data } = await brandsAPI.update(id, brandData)
      set((state) => ({
        brands: state.brands.map((b) => (b.id === id ? data : b)),
        activeBrand: state.activeBrand?.id === id ? data : state.activeBrand,
      }))
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.detail }
    }
  },

  deleteBrand: async (id) => {
    try {
      await brandsAPI.delete(id)
      set((state) => ({
        brands: state.brands.filter((b) => b.id !== id),
        activeBrand: state.activeBrand?.id === id ? null : state.activeBrand,
      }))
      return { success: true }
    } catch (err) {
      return { success: false }
    }
  },

  setActiveBrand: (brand) => set({ activeBrand: brand }),
}))

export default useBrandStore
