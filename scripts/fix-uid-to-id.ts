// Script to help identify all .uid usages that need to be changed to .id
// This is a reference file, not meant to be executed

// Files that need updating:
// - app/friends/page.tsx: user.uid -> user.id
// - app/stories/page.tsx: user.uid -> user.id  
// - app/page.tsx: currentUser.uid -> currentUser.id
// - app/scan/page.tsx: currentUser.uid -> currentUser.id
// - app/feed/page.tsx: user.uid -> user.id (multiple places)
// - app/profile/page.tsx: currentUser.uid -> currentUser.id
// - app/wallet/page.tsx: currentUser.uid -> currentUser.id

