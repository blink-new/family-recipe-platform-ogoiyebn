import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { AddRecipeDialog } from '@/components/recipe/AddRecipeDialog'
import { RecipeDetailDialog } from '@/components/recipe/RecipeDetailDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { blink } from '@/blink/client'
import { Recipe } from '@/types/recipe'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [addRecipeOpen, setAddRecipeOpen] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [recipeDetailOpen, setRecipeDetailOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')

  // Auth state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Load recipes when user is authenticated
  useEffect(() => {
    if (user) {
      loadRecipes()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter recipes based on search and filters
  useEffect(() => {
    let filtered = recipes

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(recipe => 
        recipe.title.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query) ||
        recipe.tags?.toLowerCase().includes(query) ||
        recipe.cuisineType?.toLowerCase().includes(query) ||
        recipe.ingredients?.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(recipe => {
        switch (selectedFilter) {
          case 'my-recipes':
            return recipe.userId === user?.id
          case 'public':
            return recipe.privacyLevel === 'public'
          case 'breakfast':
          case 'lunch':
          case 'dinner':
          case 'snack':
          case 'dessert':
            return recipe.mealType === selectedFilter
          default:
            return recipe.cuisineType === selectedFilter
        }
      })
    }

    setFilteredRecipes(filtered)
  }, [recipes, searchQuery, selectedFilter, user])

  const loadRecipes = async () => {
    if (!user) return
    
    setLoadingRecipes(true)
    try {
      // Load all public recipes and user's own recipes
      const allRecipes = await blink.db.recipes.list({
        orderBy: { createdAt: 'desc' },
        limit: 100
      })

      // Filter recipes based on privacy and user access
      const accessibleRecipes = allRecipes.filter(recipe => {
        if (recipe.privacyLevel === 'public') return true
        if (recipe.userId === user.id) return true
        // TODO: Add logic for protected recipes with specific user access
        return false
      })

      setRecipes(accessibleRecipes)
    } catch (error) {
      console.error('Error loading recipes:', error)
    } finally {
      setLoadingRecipes(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleRecipeAdded = () => {
    loadRecipes()
  }

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setRecipeDetailOpen(true)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Welcome to Family Recipes</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Share, discover, and organize your family's favorite recipes
            </p>
            <Button onClick={() => blink.auth.login()} size="lg">
              Sign In to Get Started
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const filters = [
    { key: 'all', label: 'All Recipes' },
    { key: 'my-recipes', label: 'My Recipes' },
    { key: 'public', label: 'Public' },
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'dinner', label: 'Dinner' },
    { key: 'dessert', label: 'Dessert' },
    { key: 'italian', label: 'Italian' },
    { key: 'chinese', label: 'Chinese' },
    { key: 'mexican', label: 'Mexican' },
    { key: 'indian', label: 'Indian' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearch} onAddRecipe={() => setAddRecipeOpen(true)} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.email?.split('@')[0]}!</h1>
          <p className="text-muted-foreground">
            Discover delicious recipes from your family and friends
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Badge
                key={filter.key}
                variant={selectedFilter === filter.key ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setSelectedFilter(filter.key)}
              >
                {filter.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredRecipes.length} results for "{searchQuery}"
            </p>
          </div>
        )}

        {/* Recipes Grid */}
        {loadingRecipes ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => handleRecipeClick(recipe)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold mb-2">No recipes found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery 
                ? `No recipes match "${searchQuery}". Try a different search term.`
                : selectedFilter === 'my-recipes'
                ? "You haven't added any recipes yet. Create your first recipe!"
                : "No recipes available. Be the first to share a recipe!"
              }
            </p>
            <Button onClick={() => setAddRecipeOpen(true)}>
              Add Your First Recipe
            </Button>
          </div>
        )}
      </main>

      {/* Add Recipe Dialog */}
      <AddRecipeDialog
        open={addRecipeOpen}
        onOpenChange={setAddRecipeOpen}
        onRecipeAdded={handleRecipeAdded}
      />

      {/* Recipe Detail Dialog */}
      <RecipeDetailDialog
        recipe={selectedRecipe}
        open={recipeDetailOpen}
        onOpenChange={setRecipeDetailOpen}
      />
    </div>
  )
}

export default App