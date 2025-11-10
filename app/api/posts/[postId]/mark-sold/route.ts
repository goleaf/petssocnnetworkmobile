import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/posts/[postId]/mark-sold - Mark a marketplace listing as sold
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { postId } = params;

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorUserId: true,
        postType: true,
        marketplaceData: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user is the author
    if (post.authorUserId !== userId) {
      return NextResponse.json(
        { error: 'Only the author can mark this listing as sold' },
        { status: 403 }
      );
    }

    if (post.postType !== 'marketplace') {
      return NextResponse.json(
        { error: 'Post is not a marketplace listing' },
        { status: 400 }
      );
    }

    const marketplaceData = post.marketplaceData as any;
    if (!marketplaceData) {
      return NextResponse.json(
        { error: 'Invalid marketplace data' },
        { status: 400 }
      );
    }

    // Check if already sold
    if (marketplaceData.soldAt) {
      return NextResponse.json(
        { error: 'Listing is already marked as sold' },
        { status: 400 }
      );
    }

    // Update marketplace data
    const updatedMarketplaceData = {
      ...marketplaceData,
      soldAt: new Date().toISOString(),
    };

    await prisma.post.update({
      where: { id: postId },
      data: {
        marketplaceData: updatedMarketplaceData,
      },
    });

    return NextResponse.json({
      success: true,
      marketplace: updatedMarketplaceData,
    });

  } catch (error) {
    console.error('Error marking listing as sold:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[postId]/mark-sold - Unmark a marketplace listing as sold
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { postId } = params;

    // Get the post
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorUserId: true,
        postType: true,
        marketplaceData: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user is the author
    if (post.authorUserId !== userId) {
      return NextResponse.json(
        { error: 'Only the author can unmark this listing' },
        { status: 403 }
      );
    }

    if (post.postType !== 'marketplace') {
      return NextResponse.json(
        { error: 'Post is not a marketplace listing' },
        { status: 400 }
      );
    }

    const marketplaceData = post.marketplaceData as any;
    if (!marketplaceData) {
      return NextResponse.json(
        { error: 'Invalid marketplace data' },
        { status: 400 }
      );
    }

    // Update marketplace data
    const updatedMarketplaceData = {
      ...marketplaceData,
      soldAt: null,
    };

    await prisma.post.update({
      where: { id: postId },
      data: {
        marketplaceData: updatedMarketplaceData,
      },
    });

    return NextResponse.json({
      success: true,
      marketplace: updatedMarketplaceData,
    });

  } catch (error) {
    console.error('Error unmarking listing:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
