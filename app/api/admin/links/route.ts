import { NextRequest, NextResponse } from 'next/server';
import {
  getLinkRules,
  addLinkRule,
  updateLinkRule,
  getDetectedLinks,
  addDetectedLink,
  checkLinkStatus,
} from '@/lib/moderation-storage';
import { extractLinks } from '@/lib/diff-utils';
import type { LinkRule, DetectedLink } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as 'rules' | 'detected' | null;

    if (type === 'detected') {
      const status = searchParams.get('status') as DetectedLink['status'] | null;
      const contentType = searchParams.get('contentType') as DetectedLink['detectedIn']['contentType'] | null;

      const links = getDetectedLinks({
        status: status || undefined,
        contentType: contentType || undefined,
      });

      return NextResponse.json({ links, total: links.length });
    }

    // Return rules by default
    const rules = getLinkRules();
    return NextResponse.json({ rules, total: rules.length });
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch links' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (type === 'rule') {
      const {
        domain,
        pattern,
        ruleType,
        reason,
        appliesTo,
        createdBy,
        isActive = true,
      } = data;

      const rule = addLinkRule({
        domain,
        pattern,
        type: ruleType,
        reason,
        appliesTo: appliesTo || ['all'],
        createdBy,
        isActive,
      });

      return NextResponse.json({ rule }, { status: 201 });
    } else if (type === 'check') {
      // Check links in content
      const { content, contentType, contentId, field } = data;
      const links = extractLinks(content);
      const detected: DetectedLink[] = [];

      for (const url of links) {
        const status = checkLinkStatus(url);
        const domain = new URL(url).hostname.replace('www.', '');

        const detectedLink = addDetectedLink({
          url,
          domain,
          rule: status.rule,
          status: status.status,
          detectedAt: new Date().toISOString(),
          detectedIn: {
            contentType,
            contentId,
            field,
          },
        });

        detected.push(detectedLink);
      }

      return NextResponse.json({ detected, total: detected.length });
    }

    return NextResponse.json(
      { error: 'Invalid type. Use "rule" or "check"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error creating link rule:', error);
    return NextResponse.json(
      { error: 'Failed to create link rule' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    const updated = updateLinkRule(id, updates);

    if (!updated) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ rule: updated });
  } catch (error) {
    console.error('Error updating link rule:', error);
    return NextResponse.json(
      { error: 'Failed to update link rule' },
      { status: 500 }
    );
  }
}

