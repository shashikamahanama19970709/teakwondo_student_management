import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"
import { getAvatarData, GravatarOptions } from "@/lib/gravatar"
import { useSignedUrl } from "@/hooks/useSignedUrl"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

interface GravatarAvatarProps {
  user: {
    avatar?: string
    profile_picture?: string
    firstName?: string
    lastName?: string
    email?: string
  }
  size?: number
  className?: string
  gravatarOptions?: GravatarOptions
}

/**
 * Enhanced Avatar component with Gravatar support
 * Falls back to Gravatar if no custom avatar is set, then to default avatar image
 */
export function GravatarAvatar({ 
  user, 
  size = 40, 
  className,
  gravatarOptions = {}
}: GravatarAvatarProps) {
  const { avatarUrl, fallbackInitials } = getAvatarData(user, {
    size,
    ...gravatarOptions
  })

  // Use signed URL for profile pictures
  const isProfilePicture = !!user.profile_picture && !user.profile_picture.startsWith('http')
  const { signedUrl } = useSignedUrl(isProfilePicture ? user.profile_picture : undefined)
  
  // Determine the final avatar URL
  const finalAvatarUrl = isProfilePicture ? signedUrl : avatarUrl

  // Handle image loading state
  const [imageError, setImageError] = React.useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  // Reset error state when avatar URL changes
  React.useEffect(() => {
    setImageError(false)
  }, [finalAvatarUrl])

  // Determine what to show: custom image, default avatar, or initials
  const showCustomImage = finalAvatarUrl && !imageError && finalAvatarUrl !== '/default-avatar.png'
  const showDefaultAvatar = !showCustomImage && (finalAvatarUrl === '/default-avatar.png' || imageError)

  return (
    <Avatar className={cn("h-10 w-10", className)} style={{ height: size, width: size }}>
      {/* Show custom avatar image if available */}
      {showCustomImage && (
        <AvatarImage 
          src={finalAvatarUrl} 
          alt={`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User avatar'}
          onError={handleImageError}
        />
      )}
      
      {/* Show default avatar or initials as fallback */}
      <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-blue-500 to-purple-600 text-white border-2 border-white shadow-md overflow-hidden">
        {showDefaultAvatar ? (
          <img 
            src="/default-avatar.png" 
            alt="Default avatar"
            className="w-full h-full object-cover"
            onError={(e) => {
              // If default avatar fails, show initials
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          fallbackInitials
        )}
      </AvatarFallback>
    </Avatar>
  )
}

export { Avatar, AvatarImage, AvatarFallback }
