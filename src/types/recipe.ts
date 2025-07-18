export interface Recipe {
  id: string
  title: string
  description?: string
  instructions?: string
  ingredients?: string
  prepTime?: number
  cookTime?: number
  servings?: number
  cuisineType?: string
  mealType?: string
  tags?: string
  imageUrl?: string
  sourceUrl?: string
  privacyLevel: 'public' | 'protected' | 'private'
  userId: string
  createdAt: string
  updatedAt: string
}

export interface RecipeRating {
  id: string
  recipeId: string
  userId: string
  rating: number
  createdAt: string
}

export interface RecipeComment {
  id: string
  recipeId: string
  userId: string
  comment: string
  parentId?: string
  createdAt: string
}

export interface RecipeAccess {
  id: string
  recipeId: string
  userId: string
  grantedBy: string
  createdAt: string
}