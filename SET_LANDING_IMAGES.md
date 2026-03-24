# Setting Landing Page Images from Cloudinary

## Quick Setup

To set the Cloudinary images on the landing page, run this command in your browser console (after logging in as an admin):

```javascript
fetch('/api/landing-page/images', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
   
  })
}).then(r => r.json()).then(console.log)
```

## Image Mapping

- **Hero Dashboard**: Main hero section preview
- **Showcase Images**:
  - Tasks: Task management showcase
  - Projects: Project management showcase  
  - Members: Team management showcase
  - TimeLogs: Time tracking showcase
  - Reports: Reporting dashboard showcase
- **Step Images**:
  - Step 1: Blueprint & Import
  - Step 2: Collaborate in Context (Sprint related)
  - Step 3: Forecast & Celebrate (Dashboard)

## Features Added

✅ Modern hover effects with smooth transitions
✅ Image overlays on hover for better visual feedback
✅ Step indicators on step images
✅ Enhanced shadows and borders
✅ Smooth scale animations
✅ Live dashboard indicator on hero image
✅ Responsive design maintained
