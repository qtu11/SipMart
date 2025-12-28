import { NextRequest, NextResponse } from 'next/server';
import { uploadFeedImage, createFeedPost } from '@/lib/firebase/greenFeed';
import { getUser, addGreenPoints } from '@/lib/supabase/users';

/**
 * API để upload image và tạo post trong Green Feed
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const caption = formData.get('caption') as string | null;
    const cupId = formData.get('cupId') as string | null;
    const file = formData.get('image') as File | null;

    if (!userId || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Get user info
    const user = await getUser(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Upload image to Firebase Storage
    const imageUrl = await uploadFeedImage(file, userId);

    // Create post in Firestore
    const postId = await createFeedPost(
      userId,
      user.displayName || user.email,
      imageUrl,
      caption || undefined,
      cupId || undefined,
      user.avatar
    );

    // Add green points to user (10 points for posting)
    try {
      await addGreenPoints(userId, 10, 'Posted to Green Feed').catch(err => {
        console.error('Error adding green points:', err);
      });
    } catch (pointsError) {
      console.error('Error adding green points:', pointsError);
      // Không throw error để post vẫn được tạo
    }

    return NextResponse.json({
      success: true,
      postId,
      imageUrl,
      message: 'Post created successfully',
    });
  } catch (error: any) {
    console.error('Upload feed image error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload image',
      },
      { status: 500 }
    );
  }
}

