# Reconnaissance: Document Service Tests

## Overview
- **Purpose**: Create comprehensive unit tests for the document service to ensure reliability and prevent regressions
- **Scope**: Testing all public methods of the document service including document creation, retrieval, and error document creation
- **Priority**: High

## Requirements Analysis
1. Test all three public methods of the document service
2. Verify UUID generation and assignment
3. Test metadata structure and field population
4. Validate timestamp generation
5. Test error handling and edge cases
6. Ensure proper data structure and typing

## Current State
### Existing Related Code
- `src/services/document.service.ts`: Main service file implementing document CRUD operations using in-memory Map storage
- `src/types/agent.ts`: Type definitions for Document and DocumentMetadata

### Patterns & Conventions
- **Runtime**: Bun (based on package.json and @types/bun dependency)
- **Test Framework**: Bun's built-in test runner (no external testing libraries like Jest/Vitest found)
- **File Naming**: No existing `.test.ts` files in src directory, but Zod in node_modules uses `.test.ts` pattern
- **Architecture**: Factory pattern with singleton export (`createDocumentService()` returns service object)
- **Storage**: In-memory Map-based storage (not persistent)
- **Module System**: ES modules (`"type": "module"` in package.json)
- **UUID**: Using uuid v4 via `import {v4 as uuidv4} from 'uuid'`

## Implementation Approach

### Architecture Decision
- Use Bun's native test runner (`bun test`)
- Follow the standard `.test.ts` naming convention
- Test file location: `src/services/document.service.test.ts` (colocated with implementation)
- Use `describe` and `test`/`it` blocks for test organization
- Focus on behavior testing rather than implementation details

### Files to Modify/Create
| File | Type | Purpose |
|------|------|---------|
| src/services/document.service.test.ts | create | Main test file for document service |

### Implementation Steps

1. **Create test file structure**
   - Set up imports (document service, types, uuid)
   - Create top-level `describe` block for document service

2. **Test `createDocument` method**
   - Test basic document creation with minimal params
   - Test document creation with all optional params
   - Verify UUID generation when not provided
   - Verify UUID usage when provided
   - Validate metadata structure
   - Validate timestamp generation (created_at, updated_at)
   - Test source_uuid handling (provided vs empty string)

3. **Test `getDocumentByUuid` method**
   - Test successful document retrieval
   - Test retrieval of non-existent document (returns null)
   - Verify error handling with console.error

4. **Test `createErrorDocument` method**
   - Test error document creation with Error instance
   - Test error document creation with non-Error value
   - Verify error message formatting
   - Verify context inclusion

5. **Add integration tests**
   - Test full lifecycle: create → retrieve → verify
   - Test multiple document creation and retrieval

### Integration Points
- **uuid library**: Verify UUID format and uniqueness
- **Type system**: Ensure Document and DocumentMetadata types are satisfied
- **Map storage**: Verify in-memory persistence across method calls

## Dependencies & Considerations
- **Bun test runner**: Built-in, no additional dependencies needed
- **UUID validation**: May want to validate UUID format (regex or library)
- **Isolation**: Each test should work with fresh service instance or clear state
- **Timestamps**: ISO string format validation
- **Error scenarios**: Console.error mocking for getDocumentByUuid error path

## Testing Strategy

### Unit Test Areas
1. **createDocument**
   - UUID generation and assignment
   - Timestamp creation
   - Metadata structure
   - Field defaults (source_uuid)
   - Parameter passing

2. **getDocumentByUuid**
   - Successful retrieval
   - Failed retrieval (null return)
   - Error logging

3. **createErrorDocument**
   - Error message extraction
   - Context formatting
   - Document creation delegation

### Test Organization
```typescript
describe('documentService', () => {
  describe('createDocument', () => {
    // Multiple test cases
  });

  describe('getDocumentByUuid', () => {
    // Multiple test cases
  });

  describe('createErrorDocument', () => {
    // Multiple test cases
  });
});
```

### Assertions to Include
- UUID format validation (regex: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
- ISO timestamp format validation
- Object structure matching
- Null checks
- Type assertions
- Error message formatting

## Risks & Mitigations
| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| State pollution between tests | M | Use beforeEach to clear Map or create fresh service instances |
| Time-dependent tests (timestamps) | L | Use relative timestamp checks or mock Date |
| UUID collision in tests | L | Unlikely with v4, but can validate uniqueness |
| Error console.error spam | L | Mock console.error in error path tests |

---
*Generated: 2026-01-23T16:00:00Z*
