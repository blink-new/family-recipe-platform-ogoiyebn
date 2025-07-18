export interface Recipe {
  id: string
  title: string
  description?: string
  instructions?: string[]
  ingredients?: string[]
  prepTime?: number
  cookTime?: number
  servings?: number
  cuisineType?: string
  mealType?: string
  tags?: string[]
  imageUrl?: string
  sourceUrl?: string
  privacy: 'public' | 'protected' | 'private'
  privacyLevel: 'public' | 'protected' | 'private' // Keep for backward compatibility
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Rating {
  id: string
  recipeId: string
  userId: string
  rating: number
  createdAt: string
}

export interface Comment {
  id: string
  recipeId: string
  userId: string
  userEmail?: string
  content: string
  parentId?: string
  createdAt: string
}

// Keep old interfaces for backward compatibility
export type RecipeRating = Rating
export interface RecipeComment extends Comment {
  comment: string
}

export interface RecipeAccess {
  id: string
  recipeId: string
  userId: string
  grantedBy: string
  createdAt: string
}