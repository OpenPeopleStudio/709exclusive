# User Manual System

## Overview

The platform includes a comprehensive, role-based help system integrated directly into the admin dashboard.

## Features

### Role-Based Content
- **Owner/Admin**: Full documentation access (all sections)
- **Staff**: Limited to operational sections (inventory, orders, messages)
- Content automatically filtered based on user role

### Searchable Documentation
- Full-text search across all help articles
- Instant results with context excerpts
- Jump directly to relevant articles

### Organized by Topic
1. **Getting Started** - Dashboard overview, navigation
2. **Product Management** - Creating, editing products and models
3. **Inventory Management** - Stock tracking, adjustments, intake
4. **Order Management** - Order lifecycle, fulfillment, returns
5. **Customer Messages** - Messaging, privacy, encryption
6. **Reports & Analytics** - Sales, inventory, customer insights
7. **Settings** - Tenant config, features, payments, shipping
8. **Troubleshooting** - Common issues, performance tips

### Interactive UI
- Modal overlay design (doesn't leave current page)
- Markdown-formatted content with syntax highlighting
- Breadcrumb navigation
- Mobile-responsive
- Search with live results

## Accessing Help

### In Admin Dashboard
1. Click the **Help (?)** button in the top navigation
2. Modal opens with documentation sections
3. Browse topics or use search

### Keyboard Shortcuts
- `Esc` - Close help modal
- `Ctrl/Cmd + K` - Focus search (when help is open)

## Content Structure

### Help Sections (`lib/adminHelp.ts`)

```typescript
{
  id: 'section-id',
  title: 'Section Title',
  icon: 'SVG path',
  roles: ['owner', 'admin', 'staff'],  // Who can see it
  subsections: [
    {
      id: 'subsection-id',
      title: 'Article Title',
      content: 'Markdown content...'
    }
  ]
}
```

### Adding New Content

1. Edit `lib/adminHelp.ts`
2. Add new section or subsection
3. Write content in Markdown
4. Specify which roles can access
5. Changes are immediate (no rebuild needed)

## Components

### HelpModal (`components/admin/HelpModal.tsx`)
Main help interface with:
- Section browser
- Search functionality
- Article viewer
- Navigation breadcrumbs

### AdminShell Integration
Help button automatically added to all admin pages:
- `/admin/*` - Tenant admin
- `/super-admin/*` - Platform admin

## Content Guidelines

### Writing Help Articles

**Do**:
- Use clear, concise language
- Include step-by-step instructions
- Add code examples where relevant
- Use screenshots (when adding image support)
- Link to related articles

**Don't**:
- Assume technical knowledge
- Use jargon without explanation
- Write walls of text
- Skip error handling steps

### Markdown Features

Supported:
- Headings (H1-H6)
- Lists (ordered, unordered)
- Code blocks (inline and fenced)
- Tables
- Links
- Bold/italic
- Blockquotes

Example:
```markdown
# Article Title

## Section

Here's how to do something:

1. First step
2. Second step
3. Third step

**Important**: Don't forget to save!

\`\`\`bash
npm run build
\`\`\`

See [Related Article](#link) for more.
```

## Search Implementation

### Algorithm
1. Searches article titles (higher weight)
2. Searches article content
3. Returns excerpts around matches
4. Filters by user role

### Search Tips (for users)
- Use specific terms ("inventory adjustment" vs "stock")
- Try synonyms ("messages" = "chat" = "support")
- Search for error messages
- Use keywords from UI labels

## Customization

### Theming
Help modal uses CSS variables from tenant theme:
- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--accent`, `--accent-hover`
- `--border-primary`

### Per-Tenant Customization (Future)
- Custom help articles per tenant
- Branded help content
- Tenant-specific screenshots
- Custom support links

## Maintenance

### Updating Content
1. Edit `lib/adminHelp.ts`
2. Update relevant section/subsection
3. Test changes locally
4. Deploy (help updates with app)

### Monitoring Usage
Consider adding (future):
- Track which articles are viewed
- Search queries logged
- Identify missing content
- User feedback on articles

## Dependencies

```json
{
  "react-markdown": "^9.x"
}
```

## Future Enhancements

### Planned Features
- [ ] Video tutorials embedded
- [ ] Interactive walkthroughs
- [ ] Contextual help (right-click help)
- [ ] Feedback on articles
- [ ] Print/export articles
- [ ] Keyboard navigation
- [ ] Recent articles list
- [ ] Bookmark favorites

### Content Expansion
- [ ] Add screenshots to articles
- [ ] Create video tutorials
- [ ] Advanced troubleshooting
- [ ] API documentation
- [ ] Webhook guides
- [ ] Integration guides

## File Structure

```
/lib
  adminHelp.ts           → Content & search logic

/components/admin
  HelpModal.tsx          → UI component
  AdminShell.tsx         → Integration point

/docs
  USER_MANUAL_SYSTEM.md  → This file
```

## Troubleshooting

### Help Button Not Showing
- Check user is authenticated
- Verify on admin/super-admin route
- Check AdminShell component import

### Search Not Working
- Verify search query length > 0
- Check role permissions
- Inspect browser console for errors

### Content Not Rendering
- Verify Markdown syntax
- Check react-markdown version
- Test content in Markdown preview

### Role Filtering Issues
- Verify user role in database
- Check role passed to HelpModal
- Review helpSections role arrays

## Support

For issues with the help system:
1. Check browser console for errors
2. Verify user role and permissions
3. Test in different browser
4. Review recent code changes
5. Contact development team
