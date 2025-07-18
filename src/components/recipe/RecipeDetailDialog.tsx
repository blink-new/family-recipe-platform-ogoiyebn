import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Star, Clock, Users, ChefHat, ExternalLink, MessageCircle, Heart } from 'lucide-react'
import { Recipe, Comment, Rating } from '@/types/recipe'
import { blink } from '@/blink/client'

interface RecipeDetailDialogProps {
  recipe: Recipe | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecipeDetailDialog({ recipe, open, onOpenChange }: RecipeDetailDialogProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])
  const [newComment, setNewComment] = useState('')
  const [userRating, setUserRating] = useState(0)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (recipe && open) {
      loadCommentsAndRatings()
    }
  }, [recipe, open, loadCommentsAndRatings])

  const loadCommentsAndRatings = useCallback(async () => {
    if (!recipe) return

    try {
      const [commentsData, ratingsData] = await Promise.all([
        blink.db.comments.list({
          where: { recipeId: recipe.id },
          orderBy: { createdAt: 'desc' }
        }),
        blink.db.ratings.list({
          where: { recipeId: recipe.id }
        })
      ])

      setComments(commentsData)
      setRatings(ratingsData)

      // Set user's existing rating if any
      if (user) {
        const existingRating = ratingsData.find(r => r.userId === user.id)
        if (existingRating) {
          setUserRating(existingRating.rating)
        }
      }
    } catch (error) {
      console.error('Error loading comments and ratings:', error)
    }
  }, [recipe, user])

  const handleRating = async (rating: number) => {
    if (!user || !recipe) return

    try {
      // Check if user already rated this recipe
      const existingRating = ratings.find(r => r.userId === user.id)
      
      if (existingRating) {
        // Update existing rating
        await blink.db.ratings.update(existingRating.id, { rating })
      } else {
        // Create new rating
        await blink.db.ratings.create({
          id: `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          recipeId: recipe.id,
          userId: user.id,
          rating,
          createdAt: new Date().toISOString()
        })
      }

      setUserRating(rating)
      loadCommentsAndRatings() // Refresh to get updated average
    } catch (error) {
      console.error('Error submitting rating:', error)
    }
  }

  const handleCommentSubmit = async () => {
    if (!user || !recipe || !newComment.trim()) return

    setIsSubmittingComment(true)
    try {
      await blink.db.comments.create({
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recipeId: recipe.id,
        userId: user.id,
        userEmail: user.email,
        content: newComment.trim(),
        createdAt: new Date().toISOString()
      })

      setNewComment('')
      loadCommentsAndRatings() // Refresh comments
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  if (!recipe) return null

  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
    : 0

  const getPrivacyBadgeColor = (privacy: string) => {
    switch (privacy) {
      case 'public': return 'bg-green-100 text-green-800'
      case 'protected': return 'bg-yellow-100 text-yellow-800'
      case 'private': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {recipe.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipe Image */}
          {recipe.imageUrl && (
            <div className="w-full h-64 rounded-lg overflow-hidden">
              <img 
                src={recipe.imageUrl} 
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Recipe Meta Info */}
          <div className="flex flex-wrap items-center gap-4">
            <Badge className={getPrivacyBadgeColor(recipe.privacy)}>
              {recipe.privacy}
            </Badge>
            
            {recipe.prepTime && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                Prep: {recipe.prepTime}min
              </div>
            )}
            
            {recipe.cookTime && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <ChefHat className="w-4 h-4" />
                Cook: {recipe.cookTime}min
              </div>
            )}
            
            {recipe.servings && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                Serves {recipe.servings}
              </div>
            )}

            {/* Rating Display */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= averageRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="text-sm text-gray-600 ml-1">
                ({ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'})
              </span>
            </div>
          </div>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          {recipe.description && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{recipe.description}</p>
            </div>
          )}

          {/* Ingredients */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Ingredients</h3>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-gray-700">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions && recipe.instructions.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Instructions</h3>
              <ol className="space-y-3">
                {recipe.instructions.map((instruction, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 leading-relaxed">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Source URL */}
          {recipe.sourceUrl && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Source</h3>
              <a 
                href={recipe.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Original Recipe
              </a>
            </div>
          )}

          <Separator />

          {/* User Rating Section */}
          {user && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Rate this Recipe</h3>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(star)}
                    className="transition-colors hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= userRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    />
                  </button>
                ))}
                {userRating > 0 && (
                  <span className="text-sm text-gray-600 ml-2">
                    You rated this {userRating} star{userRating !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Comments ({comments.length})
            </h3>

            {/* Add Comment */}
            {user && (
              <div className="mb-6 space-y-3">
                <Textarea
                  placeholder="Share your thoughts about this recipe..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button 
                  onClick={handleCommentSubmit}
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No comments yet. Be the first to share your thoughts!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-rose-100 text-rose-600 text-sm">
                        {comment.userEmail?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {comment.userEmail}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}