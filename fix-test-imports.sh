#!/bin/bash

# Fix UI component imports
find tests/active/components/ui -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./button'|from '@/components/ui/button'|g" {} \;
find tests/active/components/ui -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./badge'|from '@/components/ui/badge'|g" {} \;
find tests/active/components/ui -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./card'|from '@/components/ui/card'|g" {} \;
find tests/active/components/ui -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./input'|from '@/components/ui/input'|g" {} \;
find tests/active/components/ui -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./label'|from '@/components/ui/label'|g" {} \;
find tests/active/components/ui -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./avatar'|from '@/components/ui/avatar'|g" {} \;
find tests/active/components/ui -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./textarea'|from '@/components/ui/textarea'|g" {} \;
find tests/active/components/ui -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./typeahead'|from '@/components/ui/typeahead'|g" {} \;
find tests/active/components/ui -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./search-filters'|from '@/components/ui/search-filters'|g" {} \;

# Fix root component imports
find tests/active/components -maxdepth 1 -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./markdown-editor'|from '@/components/markdown-editor'|g" {} \;
find tests/active/components -maxdepth 1 -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./content-warning'|from '@/components/content-warning'|g" {} \;
find tests/active/components -maxdepth 1 -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./privacy-selector'|from '@/components/privacy-selector'|g" {} \;
find tests/active/components -maxdepth 1 -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./badge-display'|from '@/components/badge-display'|g" {} \;
find tests/active/components -maxdepth 1 -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./image-upload'|from '@/components/image-upload'|g" {} \;
find tests/active/components -maxdepth 1 -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./diff-viewer'|from '@/components/diff-viewer'|g" {} \;
find tests/active/components -maxdepth 1 -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./watch-button'|from '@/components/watch-button'|g" {} \;
find tests/active/components -maxdepth 1 -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./navigation'|from '@/components/navigation'|g" {} \;
find tests/active/components -maxdepth 1 -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./notifications-dropdown'|from '@/components/notifications-dropdown'|g" {} \;

# Fix __tests__ subdirectory imports
find tests/active/components/__tests__ -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./markdown-editor'|from '@/components/markdown-editor'|g" {} \;
find tests/active/components/__tests__ -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./content-warning'|from '@/components/content-warning'|g" {} \;
find tests/active/components/__tests__ -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./privacy-selector'|from '@/components/privacy-selector'|g" {} \;
find tests/active/components/__tests__ -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./badge-display'|from '@/components/badge-display'|g" {} \;
find tests/active/components/__tests__ -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./image-upload'|from '@/components/image-upload'|g" {} \;
find tests/active/components/__tests__ -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./diff-viewer'|from '@/components/diff-viewer'|g" {} \;
find tests/active/components/__tests__ -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./watch-button'|from '@/components/watch-button'|g" {} \;
find tests/active/components/__tests__ -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./navigation'|from '@/components/navigation'|g" {} \;

# Fix groups imports
find tests/active/components/groups -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./GroupCard'|from '@/components/groups/GroupCard'|g" {} \;
find tests/active/components/groups -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./GroupHeader'|from '@/components/groups/GroupHeader'|g" {} \;

# Fix auth imports
find tests/active/components/auth -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./login-form'|from '@/components/auth/login-form'|g" {} \;

# Fix moderation imports
find tests/active/components/moderation -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./blurred-media'|from '@/components/moderation/blurred-media'|g" {} \;

# Fix wiki imports
find tests/active/components/wiki -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./breed-infobox-display'|from '@/components/wiki/breed-infobox-display'|g" {} \;

# Fix analytics imports
find tests/active/components/analytics -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./SearchAnalyticsDashboard'|from '@/components/analytics/SearchAnalyticsDashboard'|g" {} \;
find tests/active/components/analytics -name "*.test.tsx" -type f -exec sed -i '' "s|from '\.\./QualityDashboard'|from '@/components/analytics/QualityDashboard'|g" {} \;

echo "Import paths fixed!"
