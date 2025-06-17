# Contributing to Endereco JavaScript SDK

## General Requirements

- **Repository Structure**: This project maintains a single main branch:
    - `master` - Main development branch for the JavaScript SDK

- **Contribution Process**: All changes must be submitted via pull request after forking the repository

- **Branch Strategy**: Create feature branches from the `master` branch

## Development Environment Setup

### Prerequisites

- **Node.js**: Version 20 (currently used for building)
- **npm**: Latest stable version
- **Git**: For version control

### Initial Setup

1. **Fork and clone the repository**:
```bash
git clone https://github.com/your-username/js-sdk.git
cd js-sdk
```

2. **Install dependencies**:
```bash
npm install
```

3. **Start development environment**:
```bash
npm run demo
```

This starts both the Express server (localhost:8888) and BrowserSync (localhost:3000) for live development.

## Code Quality Standards

Every commit must meet these requirements:

1. **Stable State**: Each commit should leave the codebase in a working, stable state
2. **ESLint Compliance**: Code must pass ESLint checks without errors if the code in the files passed them before your modifications
3. **Build Success**: All build scripts must complete without errors
4. **Demo Functionality**: Changes must not break existing demo cases
5. **Browser Compatibility**: Ensure compatibility with supported browsers (>1%, last 2 versions, not IE ≤9)

### Code Style Guidelines

The project uses ESLint with the following key rules:

- **Indentation**: 4 spaces
- **Semicolons**: Always required
- **Modern JavaScript**: Use `const` when variables aren't reassigned
- **Code Quality**: 
  - Maximum function depth: 4 levels
  - Maximum function parameters: 4
  - Avoid magic numbers (except -1, 0, 1, 2)

### Code Writing Philosophy

When contributing code, follow these principles:

- **Make the smallest reasonable changes** to get to the desired outcome
- **Prefer simple, clean, maintainable solutions** over clever or complex ones, even if the latter are more concise or performant. Readability and maintainability are primary concerns
- **Match the style and formatting of surrounding code** when modifying existing files, even if it differs from standard style guides. Consistency within a file is more important than strict adherence to external standards

### Running Code Quality Checks

```bash
# Check code style (project should have this command)
npm run lint

# Build project to verify no errors
npm run build

# Check specific file with targeted linting
npx eslint modules/integrator.js
```

**Important**: Because we still have many existing lint issues in the codebase, you should use targeted linting to check only the files you've modified. There should be no more lint issues after your changes than there were before. If a file passed lint before your modification, it must pass lint after your modification in every commit.

Example of checking a specific file:
```bash
# Check only the file you modified
npx eslint modules/extensions/fields/YourNewExtension.js

# Check multiple specific files
npx eslint modules/integrator.js modules/ams.js
```

## Git Workflow

### Commit Message Guidelines

Follow our commit message format:

#### Structure
```
Title: Brief description in imperative mood (under 70 characters)

Body:
Explain WHY the changes are needed (4-5 sentences max).
Reference relevant issues, meetings, or discussions.
Keep lines under 70 characters for readability.
You are writing this text for a reviewer. Don't make his life hard.

For implementation details see [ISSUE-NUMBER].
```

#### Requirements

**Title:**
- Use English and imperative language ("Add feature" not "Added feature")
- Answer "WHAT?" - describe what the commit does
- Keep under 70 characters
- No issue numbers in the title

**Body:**
- Explain "WHY?" - provide context for the changes
- Reference issues, emails, or meetings with specific identifiers
- Use professional, neutral language
- Break lines at ~70 characters
- Include 4-5 sentences maximum

**Example Good Commit:**

```
Add autocomplete dropdown keyboard navigation support


Enable users to navigate address suggestions using keyboard inputs
to improve accessibility compliance and user experience. Users can
now use Tab, Enter, and arrow keys to interact with suggestions
without requiring mouse input.

This change addresses accessibility requirements outlined in WCAG 2.1
guidelines and moves the solution towards better EAA compatibility.

For implementation details see SDK-123. Related accessibility
requirements documented in SDK-456.
```

### What to Avoid

- Vague titles like "fixed stuff" or "updates"
- Multiple unrelated changes in one commit
- Missing context about why changes were made
- Unprofessional language or jokes
- Lines exceeding 70 characters
- Mixing different types of changes (bug fixes + new features + refactoring)
- Adding fixes for previous commits. Just amend previous commits yourself. Please.
- Too much text
- Technical details of the implementation, unless they are not understandable from reading the code
- Changing semver in package.json. We do it ourself, when we release.

## Testing and Building

### Build Process

The project uses Webpack and Babel for building:

```bash
# Full production build
npm run build

# Build styles only
npm run build-styles

# Development server with live reload
npm run demo
```

### Manual Testing

1. **Start demo environment**:
```bash
npm run demo
```

2. **Test various use cases**:
   - Navigate to `localhost:8888`
   - Test the comprehensive example at `/use-cases/example/`
   - Verify miniconfig and test scenarios
   - Test with different API keys and configurations

3. **Cross-browser testing**:
   - Test in supported browsers
   - Verify polyfill functionality in older browsers
   - Check responsive behavior

### Integration Testing

- Test SDK integration with the Shopware 6 example
- Verify all services work together (AMS, email, phone, person)
- Test various configuration combinations

## SDK-Specific Guidelines

### Module Development

When creating new modules:

1. **Follow existing patterns** in `modules/` directory
2. **Extend the base component** from `modules/components/base.js`
3. **Use the extension system** for field and validation logic
4. **Implement proper error handling** and user feedback

### Extension Creation

For new field or validation extensions:

1. **Field extensions** go in `modules/extensions/fields/`
3. **Follow naming convention**: `[FieldName]Extension.js`
4. **Implement required interface methods**

### Template and Theming

When modifying UI components:

1. **Use Mustache templating** for dynamic content
2. **Follow SCSS structure** in `themes/` directory
3. **Maintain theme compatibility** across different implementations
4. **Test with various CSS frameworks**

### Breaking Changes

For changes that might break existing integrations:

1. **Document breaking changes** clearly in commit messages and in the PR message
2. **Provide migration guide** when applicable
3. **Consider backward compatibility** options
4. **Update demo cases** to reflect new usage patterns

## Pull Request Requirements

Before submitting your PR:

1. ✅ All commits follow the message guidelines above
2. ✅ Code passes ESLint without errors
3. ✅ All build scripts complete successfully
4. ✅ Demo environment works correctly
5. ✅ Feature branch created from `master` branch
6. ✅ Browser compatibility verified across supported browsers
7. ✅ Integration tested with demo cases

### Pull Request Template

Include in your PR description:

```markdown
## Summary
Brief description of changes

## Changes Made
- List specific changes
- Include any new features or fixes

## Testing
- [ ] Manual testing in demo environment
- [ ] Cross-browser compatibility verified
- [ ] Integration testing completed
- [ ] No breaking changes to existing APIs

## Related Issues
Reference any related GitHub issues
```

## Quality Checklist

Use this checklist for each commit:

- [ ] Commit has clear, imperative title under 70 characters
- [ ] Body explains business reason/context for changes
- [ ] Professional language used throughout
- [ ] Lines broken at ~70 characters for readability
- [ ] References to relevant issues/meetings included
- [ ] Code follows ESLint configuration
- [ ] Build scripts complete without errors
- [ ] Demo cases still function correctly
- [ ] Changes are logically grouped (not mixing unrelated modifications)
- [ ] No fixes for previous commits in new commits
- [ ] Browser compatibility maintained

## Getting Help

If you're unsure about any of these requirements or need clarification on the commit message format, please ask in the issue comments before starting work. For technical questions about the SDK architecture or integration patterns, contact:

- **Technical Support**: support@endereco.de
- **GitHub Issues**: [https://github.com/Endereco/js-sdk/issues](https://github.com/Endereco/js-sdk/issues)

We're happy to provide guidance to ensure your contribution meets our standards and integrates well with the existing codebase.

---

*Note: These guidelines ensure code quality, maintainability, and a clear project history. Following them helps reviewers understand your changes and makes the SDK easier to maintain long-term.*
