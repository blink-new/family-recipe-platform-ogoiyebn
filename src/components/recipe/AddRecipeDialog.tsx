import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { blink } from '@/blink/client'

interface AddRecipeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRecipeAdded: () => void
}

export function AddRecipeDialog({ open, onOpenChange, onRecipeAdded }: AddRecipeDialogProps) {
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    ingredients: '',
    prepTime: '',
    cookTime: '',
    servings: '',
    cuisineType: '',
    mealType: '',
    sourceUrl: '',
    privacyLevel: 'public' as 'public' | 'protected' | 'private'
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()])
      setCurrentTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setLoading(true)
    try {
      const user = await blink.auth.me()
      let imageUrl = ''

      // Upload image if provided
      if (imageFile) {
        const { publicUrl } = await blink.storage.upload(
          imageFile,
          `recipes/${Date.now()}-${imageFile.name}`,
          { upsert: true }
        )
        imageUrl = publicUrl
      }

      // Create recipe
      await blink.db.recipes.create({
        id: `recipe_${Date.now()}`,
        title: formData.title,
        description: formData.description || null,
        instructions: formData.instructions || null,
        ingredients: formData.ingredients || null,
        prepTime: formData.prepTime ? parseInt(formData.prepTime) : null,
        cookTime: formData.cookTime ? parseInt(formData.cookTime) : null,
        servings: formData.servings ? parseInt(formData.servings) : null,
        cuisineType: formData.cuisineType || null,
        mealType: formData.mealType || null,
        tags: tags.join(', ') || null,
        imageUrl: imageUrl || null,
        sourceUrl: formData.sourceUrl || null,
        privacyLevel: formData.privacyLevel,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // Reset form
      setFormData({
        title: '',
        description: '',
        instructions: '',
        ingredients: '',
        prepTime: '',
        cookTime: '',
        servings: '',
        cuisineType: '',
        mealType: '',
        sourceUrl: '',
        privacyLevel: 'public'
      })
      setTags([])
      setImageFile(null)
      setImagePreview(null)
      
      onRecipeAdded()
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating recipe:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Recipe</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Recipe Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter recipe title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of your recipe"
                rows={3}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <Label>Recipe Image</Label>
            <div className="mt-2">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Recipe preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-4">
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <span className="text-primary hover:text-primary/80">Upload an image</span>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recipe Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="prepTime">Prep Time (minutes)</Label>
              <Input
                id="prepTime"
                type="number"
                value={formData.prepTime}
                onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                placeholder="30"
              />
            </div>
            <div>
              <Label htmlFor="cookTime">Cook Time (minutes)</Label>
              <Input
                id="cookTime"
                type="number"
                value={formData.cookTime}
                onChange={(e) => setFormData({ ...formData, cookTime: e.target.value })}
                placeholder="45"
              />
            </div>
            <div>
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                type="number"
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                placeholder="4"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cuisineType">Cuisine Type</Label>
              <Select value={formData.cuisineType} onValueChange={(value) => setFormData({ ...formData, cuisineType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cuisine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="italian">Italian</SelectItem>
                  <SelectItem value="chinese">Chinese</SelectItem>
                  <SelectItem value="mexican">Mexican</SelectItem>
                  <SelectItem value="indian">Indian</SelectItem>
                  <SelectItem value="american">American</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="thai">Thai</SelectItem>
                  <SelectItem value="mediterranean">Mediterranean</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mealType">Meal Type</Label>
              <Select value={formData.mealType} onValueChange={(value) => setFormData({ ...formData, mealType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select meal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                  <SelectItem value="dessert">Dessert</SelectItem>
                  <SelectItem value="appetizer">Appetizer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Privacy Level */}
          <div>
            <Label htmlFor="privacyLevel">Privacy Level</Label>
            <Select value={formData.privacyLevel} onValueChange={(value: 'public' | 'protected' | 'private') => setFormData({ ...formData, privacyLevel: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Everyone can see</SelectItem>
                <SelectItem value="protected">Protected - Specific users only</SelectItem>
                <SelectItem value="private">Private - Only me</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                    <span>{tag}</span>
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Ingredients */}
          <div>
            <Label htmlFor="ingredients">Ingredients</Label>
            <Textarea
              id="ingredients"
              value={formData.ingredients}
              onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
              placeholder="List ingredients, one per line"
              rows={4}
            />
          </div>

          {/* Instructions */}
          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Step-by-step cooking instructions"
              rows={6}
            />
          </div>

          {/* Source URL */}
          <div>
            <Label htmlFor="sourceUrl">Source URL (optional)</Label>
            <Input
              id="sourceUrl"
              type="url"
              value={formData.sourceUrl}
              onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
              placeholder="https://example.com/original-recipe"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim()}>
              {loading ? 'Creating...' : 'Create Recipe'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}