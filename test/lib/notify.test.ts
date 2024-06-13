import { buildMessageBody, notify } from '../../src/lib/notify';

describe('notify.ts tests', () => {
  describe('buildMessageBody function', () => {
    it('should correctly format the Slack message body', () => {
      const source = 'Test Source';
      const posts = [
        {
          link: 'http://example.com',
          title: 'Test Title',
          description: 'Test Description',
        },
      ];

      const result = buildMessageBody({ source, posts });

      expect(result.text).toBe(source);
      expect(result.blocks[0].text.text).toContain(posts[0].title);
      expect(result.blocks[0].text.text).toContain(posts[0].description);
    });
  });

  describe('notify function', () => {
    beforeEach(() => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
        })
      ) as jest.Mock;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should call fetch with correct URL and body', async () => {
      const url = 'http://example-webhook.com';
      const body = {
        text: 'Test Source',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '<http://example.com|Test Title> \n Test Description',
            },
          },
        ],
        unfurl_links: true,
        username: 'Test Source',
        icon_emoji: ':aws-logo:',
      };

      await notify({ url, body });

      expect(global.fetch).toHaveBeenCalledWith(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    });

    it('should throw an error if fetch response is not ok', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
        })
      ) as jest.Mock;

      const url = 'http://example-webhook.com';
      const body = {
        text: 'Test Source',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '<http://example.com|Test Title> \n Test Description',
            },
          },
        ],
        unfurl_links: true,
        username: 'Test Source',
        icon_emoji: ':aws-logo:',
      };

      await expect(notify({ url, body })).rejects.toThrow('Failed to notify');
    });
  });
});
