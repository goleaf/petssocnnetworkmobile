import { NextRequest, NextResponse } from 'next/server';
import { getRecentChangeById, updateRecentChange } from '@/lib/moderation-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const change = getRecentChangeById(id);

    if (!change) {
      return NextResponse.json(
        { error: 'Change not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ change });
  } catch (error) {
    console.error('Error fetching change:', error);
    return NextResponse.json(
      { error: 'Failed to fetch change' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = updateRecentChange(id, body);

    if (!updated) {
      return NextResponse.json(
        { error: 'Change not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ change: updated });
  } catch (error) {
    console.error('Error updating change:', error);
    return NextResponse.json(
      { error: 'Failed to update change' },
      { status: 500 }
    );
  }
}

