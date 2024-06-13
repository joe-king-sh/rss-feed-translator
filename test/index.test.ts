import { handler } from '../src/index';
import * as indexLib from '../src/index';
import * as historyLib from '../src/lib/history';
import * as notifyLib from '../src/lib/notify';
import * as translateLib from '../src/lib/translate';
import Parser from 'rss-parser';
import { feeds } from '../src/feeds';

jest.mock('rss-parser');
jest.mock('../src/lib/history');
jest.mock('../src/lib/notify');
jest.mock('../src/lib/translate');

describe('handler function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process feeds successfully', async () => {
    const mockParseURL = jest.fn().mockResolvedValue({
      items: [
        {
          title: 'Test Title',
          link: 'http://example.com',
          pubDate: 'Mon, 26 Jul 2021 00:00:00 GMT',
          content: 'Test Content',
          guid: 'test-guid',
        },
      ],
    });
    Parser.mockImplementation(() => ({
      parseURL: mockParseURL,
    }));

    translateLib.translate.mockResolvedValue('Translated Text');
    notifyLib.notify.mockResolvedValue(undefined);
    historyLib.putHistory.mockResolvedValue(undefined);

    process.env.DRY_RUN = 'false';

    await handler();

    expect(mockParseURL).toHaveBeenCalledTimes(feeds.length);
    expect(translateLib.translate).toHaveBeenCalledTimes(2); // title and content
    expect(notifyLib.notify).toHaveBeenCalledTimes(1);
    expect(historyLib.putHistory).toHaveBeenCalledTimes(1);
  });

  it('should skip notification and history update on DRY_RUN', async () => {
    process.env.DRY_RUN = 'true';

    await handler();

    expect(notifyLib.notify).not.toHaveBeenCalled();
    expect(historyLib.putHistory).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    Parser.mockImplementation(() => {
      throw new Error('Failed to parse URL');
    });

    await expect(handler()).resolves.not.toThrow();
  });
});
