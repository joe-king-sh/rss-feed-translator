import { fetchHistoryByGuid, putHistory } from '../../src/lib/history';
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: jest.fn(),
    })),
  },
  QueryCommand: jest.fn(),
  PutCommand: jest.fn(),
}));

describe('fetchHistoryByGuid', () => {
  it('fetches history successfully', async () => {
    const mockSend = jest.fn().mockResolvedValue({
      Items: [{ Guid: 'test-guid', Type: 'test-type' }],
    });
    DynamoDBDocumentClient.from = jest.fn(() => ({
      send: mockSend,
    }));

    const result = await fetchHistoryByGuid('test-guid');

    expect(result).toEqual([{ Guid: 'test-guid', Type: 'test-type' }]);
    expect(mockSend).toHaveBeenCalled();
  });

  it('handles errors', async () => {
    const mockSend = jest.fn().mockRejectedValue(new Error('Test Error'));
    DynamoDBDocumentClient.from = jest.fn(() => ({
      send: mockSend,
    }));

    await expect(fetchHistoryByGuid('test-guid')).rejects.toThrow('Test Error');
  });
});

describe('putHistory', () => {
  it('inserts history successfully', async () => {
    const mockSend = jest.fn().mockResolvedValue({});
    DynamoDBDocumentClient.from = jest.fn(() => ({
      send: mockSend,
    }));

    await putHistory({
      Guid: 'test-guid',
      Type: 'test-type',
      Link: 'test-link',
      Description: 'test-description',
      PublishedAt: 'test-publishedAt',
      NotifiedAt: 'test-notifiedAt',
    });

    expect(mockSend).toHaveBeenCalled();
  });

  it('handles errors', async () => {
    const mockSend = jest.fn().mockRejectedValue(new Error('Test Error'));
    DynamoDBDocumentClient.from = jest.fn(() => ({
      send: mockSend,
    }));

    await expect(
      putHistory({
        Guid: 'test-guid',
        Type: 'test-type',
        Link: 'test-link',
        Description: 'test-description',
        PublishedAt: 'test-publishedAt',
        NotifiedAt: 'test-notifiedAt',
      })
    ).rejects.toThrow('Test Error');
  });
});
