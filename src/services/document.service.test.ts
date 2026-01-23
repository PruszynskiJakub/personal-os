import {describe, test, expect, beforeEach, mock} from 'bun:test';
import type {Document} from '../types/agent.ts';

// UUID v4 format regex
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ISO 8601 timestamp format regex
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

// Factory function to create a fresh document service instance for test isolation
async function createFreshDocumentService() {
    // Clear the module cache to get a fresh instance
    const modulePath = './document.service.ts';
    delete require.cache[require.resolve(modulePath)];
    const {documentService} = await import(modulePath);
    return documentService;
}

describe('documentService', () => {
    describe('createDocument', () => {
        test('creates a document with auto-generated UUID when uuid is not provided', async () => {
            const service = await createFreshDocumentService();

            const document = await service.createDocument({
                conversation_uuid: 'conv-123',
                text: 'Test document content',
            });

            expect(document.uuid).toMatch(UUID_V4_REGEX);
            expect(document.conversation_uuid).toBe('conv-123');
            expect(document.text).toBe('Test document content');
        });

        test('uses provided UUID when specified', async () => {
            const service = await createFreshDocumentService();
            const customUuid = '550e8400-e29b-41d4-a716-446655440000';

            const document = await service.createDocument({
                uuid: customUuid,
                conversation_uuid: 'conv-123',
                text: 'Test document content',
            });

            expect(document.uuid).toBe(customUuid);
        });

        test('sets source_uuid to empty string when not provided', async () => {
            const service = await createFreshDocumentService();

            const document = await service.createDocument({
                conversation_uuid: 'conv-123',
                text: 'Test document content',
            });

            expect(document.source_uuid).toBe('');
        });

        test('uses provided source_uuid when specified', async () => {
            const service = await createFreshDocumentService();

            const document = await service.createDocument({
                conversation_uuid: 'conv-123',
                text: 'Test document content',
                source_uuid: 'source-456',
            });

            expect(document.source_uuid).toBe('source-456');
        });

        test('generates valid ISO timestamps for created_at and updated_at', async () => {
            const service = await createFreshDocumentService();
            const beforeCreation = new Date().toISOString();

            const document = await service.createDocument({
                conversation_uuid: 'conv-123',
                text: 'Test document content',
            });

            const afterCreation = new Date().toISOString();

            expect(document.created_at).toMatch(ISO_TIMESTAMP_REGEX);
            expect(document.updated_at).toMatch(ISO_TIMESTAMP_REGEX);
            expect(document.created_at).toBe(document.updated_at);
            expect(document.created_at >= beforeCreation).toBe(true);
            expect(document.created_at <= afterCreation).toBe(true);
        });

        test('creates correct metadata structure', async () => {
            const service = await createFreshDocumentService();

            const document = await service.createDocument({
                conversation_uuid: 'conv-123',
                text: 'Test document content',
                source_uuid: 'source-456',
            });

            expect(document.metadata).toBeDefined();
            expect(document.metadata.uuid).toBe(document.uuid);
            expect(document.metadata.conversation_uuid).toBe('conv-123');
            expect(document.metadata.source_uuid).toBe('source-456');
            expect(document.metadata.content_type).toBe('full');
        });

        test('metadata uuid matches document uuid', async () => {
            const service = await createFreshDocumentService();
            const customUuid = '550e8400-e29b-41d4-a716-446655440001';

            const document = await service.createDocument({
                uuid: customUuid,
                conversation_uuid: 'conv-123',
                text: 'Test document content',
            });

            expect(document.metadata.uuid).toBe(customUuid);
            expect(document.metadata.uuid).toBe(document.uuid);
        });

        test('stores document in internal Map for later retrieval', async () => {
            const service = await createFreshDocumentService();

            const createdDocument = await service.createDocument({
                conversation_uuid: 'conv-123',
                text: 'Test document content',
            });

            const retrievedDocument = await service.getDocumentByUuid(createdDocument.uuid);

            expect(retrievedDocument).toEqual(createdDocument);
        });

        test('creates multiple documents with unique UUIDs', async () => {
            const service = await createFreshDocumentService();

            const doc1 = await service.createDocument({
                conversation_uuid: 'conv-123',
                text: 'Document 1',
            });

            const doc2 = await service.createDocument({
                conversation_uuid: 'conv-123',
                text: 'Document 2',
            });

            const doc3 = await service.createDocument({
                conversation_uuid: 'conv-456',
                text: 'Document 3',
            });

            expect(doc1.uuid).not.toBe(doc2.uuid);
            expect(doc2.uuid).not.toBe(doc3.uuid);
            expect(doc1.uuid).not.toBe(doc3.uuid);
        });

        test('handles empty text content', async () => {
            const service = await createFreshDocumentService();

            const document = await service.createDocument({
                conversation_uuid: 'conv-123',
                text: '',
            });

            expect(document.text).toBe('');
            expect(document.uuid).toMatch(UUID_V4_REGEX);
        });

        test('handles special characters in text content', async () => {
            const service = await createFreshDocumentService();
            const specialText = 'Line 1\nLine 2\tTabbed\r\nWindows line\n"Quotes" & <html>';

            const document = await service.createDocument({
                conversation_uuid: 'conv-123',
                text: specialText,
            });

            expect(document.text).toBe(specialText);
        });
    });

    describe('getDocumentByUuid', () => {
        test('returns document when it exists', async () => {
            const service = await createFreshDocumentService();

            const createdDocument = await service.createDocument({
                conversation_uuid: 'conv-123',
                text: 'Test document content',
            });

            const retrievedDocument = await service.getDocumentByUuid(createdDocument.uuid);

            expect(retrievedDocument).not.toBeNull();
            expect(retrievedDocument?.uuid).toBe(createdDocument.uuid);
            expect(retrievedDocument?.text).toBe('Test document content');
        });

        test('returns null for non-existent UUID', async () => {
            const service = await createFreshDocumentService();

            const result = await service.getDocumentByUuid('non-existent-uuid');

            expect(result).toBeNull();
        });

        test('returns null for empty string UUID', async () => {
            const service = await createFreshDocumentService();

            const result = await service.getDocumentByUuid('');

            expect(result).toBeNull();
        });

        test('returns correct document among multiple stored documents', async () => {
            const service = await createFreshDocumentService();

            const doc1 = await service.createDocument({
                conversation_uuid: 'conv-1',
                text: 'Document 1 content',
            });

            const doc2 = await service.createDocument({
                conversation_uuid: 'conv-2',
                text: 'Document 2 content',
            });

            const doc3 = await service.createDocument({
                conversation_uuid: 'conv-3',
                text: 'Document 3 content',
            });

            const retrieved1 = await service.getDocumentByUuid(doc1.uuid);
            const retrieved2 = await service.getDocumentByUuid(doc2.uuid);
            const retrieved3 = await service.getDocumentByUuid(doc3.uuid);

            expect(retrieved1?.text).toBe('Document 1 content');
            expect(retrieved2?.text).toBe('Document 2 content');
            expect(retrieved3?.text).toBe('Document 3 content');
        });

        test('returns document with all original fields intact', async () => {
            const service = await createFreshDocumentService();
            const customUuid = '550e8400-e29b-41d4-a716-446655440002';

            const createdDocument = await service.createDocument({
                uuid: customUuid,
                conversation_uuid: 'conv-123',
                text: 'Test content',
                source_uuid: 'source-789',
            });

            const retrievedDocument = await service.getDocumentByUuid(customUuid);

            expect(retrievedDocument).toEqual(createdDocument);
            expect(retrievedDocument?.uuid).toBe(customUuid);
            expect(retrievedDocument?.conversation_uuid).toBe('conv-123');
            expect(retrievedDocument?.text).toBe('Test content');
            expect(retrievedDocument?.source_uuid).toBe('source-789');
            expect(retrievedDocument?.metadata.uuid).toBe(customUuid);
            expect(retrievedDocument?.metadata.conversation_uuid).toBe('conv-123');
            expect(retrievedDocument?.metadata.source_uuid).toBe('source-789');
            expect(retrievedDocument?.metadata.content_type).toBe('full');
        });
    });

    describe('createErrorDocument', () => {
        test('creates error document from Error instance', async () => {
            const service = await createFreshDocumentService();
            const error = new Error('Something went wrong');

            const document = await service.createErrorDocument({
                conversation_uuid: 'conv-123',
                error: error,
                error_context: 'Processing user request',
            });

            expect(document.uuid).toMatch(UUID_V4_REGEX);
            expect(document.conversation_uuid).toBe('conv-123');
            expect(document.text).toBe('Error Something went wrong.\nContext: Processing user request');
        });

        test('creates error document from non-Error value with "Unknown error" message', async () => {
            const service = await createFreshDocumentService();

            const document = await service.createErrorDocument({
                conversation_uuid: 'conv-123',
                error: 'string error',
                error_context: 'API call failed',
            });

            expect(document.text).toBe('Error Unknown error.\nContext: API call failed');
        });

        test('handles null error value', async () => {
            const service = await createFreshDocumentService();

            const document = await service.createErrorDocument({
                conversation_uuid: 'conv-123',
                error: null,
                error_context: 'Null error occurred',
            });

            expect(document.text).toBe('Error Unknown error.\nContext: Null error occurred');
        });

        test('handles undefined error value', async () => {
            const service = await createFreshDocumentService();

            const document = await service.createErrorDocument({
                conversation_uuid: 'conv-123',
                error: undefined,
                error_context: 'Undefined error occurred',
            });

            expect(document.text).toBe('Error Unknown error.\nContext: Undefined error occurred');
        });

        test('handles object error value', async () => {
            const service = await createFreshDocumentService();

            const document = await service.createErrorDocument({
                conversation_uuid: 'conv-123',
                error: {code: 500, message: 'Internal Server Error'},
                error_context: 'Server response',
            });

            expect(document.text).toBe('Error Unknown error.\nContext: Server response');
        });

        test('stores error document for later retrieval', async () => {
            const service = await createFreshDocumentService();
            const error = new Error('Test error');

            const errorDocument = await service.createErrorDocument({
                conversation_uuid: 'conv-123',
                error: error,
                error_context: 'Test context',
            });

            const retrievedDocument = await service.getDocumentByUuid(errorDocument.uuid);

            expect(retrievedDocument).toEqual(errorDocument);
        });

        test('creates valid document structure with proper metadata', async () => {
            const service = await createFreshDocumentService();
            const error = new Error('Validation failed');

            const document = await service.createErrorDocument({
                conversation_uuid: 'conv-789',
                error: error,
                error_context: 'Input validation',
            });

            expect(document.uuid).toMatch(UUID_V4_REGEX);
            expect(document.conversation_uuid).toBe('conv-789');
            expect(document.source_uuid).toBe('');
            expect(document.created_at).toMatch(ISO_TIMESTAMP_REGEX);
            expect(document.updated_at).toMatch(ISO_TIMESTAMP_REGEX);
            expect(document.metadata.uuid).toBe(document.uuid);
            expect(document.metadata.conversation_uuid).toBe('conv-789');
            expect(document.metadata.content_type).toBe('full');
        });

        test('handles Error with empty message', async () => {
            const service = await createFreshDocumentService();
            const error = new Error('');

            const document = await service.createErrorDocument({
                conversation_uuid: 'conv-123',
                error: error,
                error_context: 'Empty error message',
            });

            expect(document.text).toBe('Error .\nContext: Empty error message');
        });

        test('handles empty error_context', async () => {
            const service = await createFreshDocumentService();
            const error = new Error('Test error');

            const document = await service.createErrorDocument({
                conversation_uuid: 'conv-123',
                error: error,
                error_context: '',
            });

            expect(document.text).toBe('Error Test error.\nContext: ');
        });

        test('handles special characters in error message and context', async () => {
            const service = await createFreshDocumentService();
            const error = new Error('Error with "quotes" & <special> chars');

            const document = await service.createErrorDocument({
                conversation_uuid: 'conv-123',
                error: error,
                error_context: 'Context with\nnewlines\tand\ttabs',
            });

            expect(document.text).toBe('Error Error with "quotes" & <special> chars.\nContext: Context with\nnewlines\tand\ttabs');
        });
    });

    describe('integration tests', () => {
        test('full document lifecycle: create, retrieve, verify', async () => {
            const service = await createFreshDocumentService();

            // Create document
            const createdDocument = await service.createDocument({
                conversation_uuid: 'integration-test-conv',
                text: 'Integration test content',
                source_uuid: 'integration-source',
            });

            // Verify creation
            expect(createdDocument.uuid).toMatch(UUID_V4_REGEX);

            // Retrieve document
            const retrievedDocument = await service.getDocumentByUuid(createdDocument.uuid);

            // Verify retrieval matches creation
            expect(retrievedDocument).not.toBeNull();
            expect(retrievedDocument).toEqual(createdDocument);
        });

        test('multiple documents with different conversation UUIDs', async () => {
            const service = await createFreshDocumentService();
            const conversationIds = ['conv-a', 'conv-b', 'conv-c'];
            const documents: Document[] = [];

            // Create documents for different conversations
            for (const convId of conversationIds) {
                const doc = await service.createDocument({
                    conversation_uuid: convId,
                    text: `Content for ${convId}`,
                });
                documents.push(doc);
            }

            // Verify all documents are retrievable
            for (let i = 0; i < documents.length; i++) {
                const retrieved = await service.getDocumentByUuid(documents[i].uuid);
                expect(retrieved?.conversation_uuid).toBe(conversationIds[i]);
            }
        });

        test('error document is indistinguishable from regular document in structure', async () => {
            const service = await createFreshDocumentService();

            const regularDoc = await service.createDocument({
                conversation_uuid: 'conv-123',
                text: 'Regular content',
            });

            const errorDoc = await service.createErrorDocument({
                conversation_uuid: 'conv-123',
                error: new Error('Test'),
                error_context: 'Context',
            });

            // Both should have the same structure
            expect(Object.keys(regularDoc).sort()).toEqual(Object.keys(errorDoc).sort());
            expect(Object.keys(regularDoc.metadata).sort()).toEqual(Object.keys(errorDoc.metadata).sort());
        });

        test('service maintains state across multiple operations', async () => {
            const service = await createFreshDocumentService();

            // Create multiple documents
            const doc1 = await service.createDocument({
                conversation_uuid: 'conv-1',
                text: 'First document',
            });

            const doc2 = await service.createDocument({
                conversation_uuid: 'conv-2',
                text: 'Second document',
            });

            const errorDoc = await service.createErrorDocument({
                conversation_uuid: 'conv-3',
                error: new Error('Error doc'),
                error_context: 'Testing',
            });

            // All should be retrievable
            expect(await service.getDocumentByUuid(doc1.uuid)).not.toBeNull();
            expect(await service.getDocumentByUuid(doc2.uuid)).not.toBeNull();
            expect(await service.getDocumentByUuid(errorDoc.uuid)).not.toBeNull();

            // Non-existent should still return null
            expect(await service.getDocumentByUuid('non-existent')).toBeNull();
        });
    });
});
