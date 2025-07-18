import { Clock, Users, Star, Lock, Globe, Shield } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Recipe } from '@/types/recipe'

interface RecipeCardProps {
  recipe: Recipe
  averageRating?: number
  totalRatings?: number
  onClick: () => void
}

export function RecipeCard({ recipe, averageRating = 0, totalRatings = 0, onClick }: RecipeCardProps) {
  const getPrivacyIcon = () => {
    const privacy = recipe.privacy || recipe.privacyLevel
    switch (privacy) {
      case 'public':
        return <Globe className="h-4 w-4 text-green-600" />
      case 'protected':
        return <Shield className="h-4 w-4 text-yellow-600" />
      case 'private':
        return <Lock className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const tags = Array.isArray(recipe.tags) 
    ? recipe.tags 
    : recipe.tags 
    ? recipe.tags.split(',').map(tag => tag.trim()) 
    : []

  return (
    <Card 
      className="recipe-card-hover cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Recipe Image */}
      <div className="aspect-video relative overflow-hidden bg-muted">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        
        {/* Privacy Badge */}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="flex items-center space-x-1">
            {getPrivacyIcon()}
            <span className="capitalize text-xs">{recipe.privacy || recipe.privacyLevel}</span>
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title and Description */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{recipe.title}</h3>
        {recipe.description && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {recipe.description}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Recipe Meta */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            {recipe.prepTime && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{recipe.prepTime}m</span>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{recipe.servings}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-4 py-3 bg-muted/30">
        {/* Rating */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-1">
            <Star className={`h-4 w-4 ${averageRating > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium">
              {averageRating > 0 ? averageRating.toFixed(1) : '—'}
            </span>
            {totalRatings > 0 && (
              <span className="text-xs text-muted-foreground">
                ({totalRatings})
              </span>
            )}
          </div>
          
          {/* Cuisine Type */}
          {recipe.cuisineType && (
            <Badge variant="secondary" className="text-xs">
              {recipe.cuisineType}
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}