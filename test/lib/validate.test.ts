import { isNewItem, isValidItem } from '../../src/lib/validate';
import * as dayjs from 'dayjs';

describe('validate.ts tests', () => {
  describe('isNewItem function', () => {
    it('should return true for items published within the last month', async () => {
      const result = await isNewItem({
        title: 'Test Title',
        pubDate: dayjs().subtract(20, 'day'),
        nowDate: dayjs(),
      });
      expect(result).toBeTruthy();
    });

    it('should return false for items published more than a month ago', async () => {
      const result = await isNewItem({
        title: 'Test Title',
        pubDate: dayjs().subtract(2, 'month'),
        nowDate: dayjs(),
      });
      expect(result).toBeFalsy();
    });

    it('should handle date comparisons correctly', async () => {
      const result = await isNewItem({
        title: 'Test Title',
        pubDate: dayjs('2022-01-01'),
        nowDate: dayjs('2022-02-01'),
      });
      expect(result).toBeTruthy();
    });
  });

  describe('isValidItem function', () => {
    it('should return true for valid RSS feed items', () => {
      const result = isValidItem({
        title: 'Test Title',
        link: 'http://example.com',
        description: 'Test Description',
        pubDate: 'Mon, 01 Jan 2022 00:00:00 GMT',
      });
      expect(result).toBeTruthy();
    });

    it('should return false for invalid RSS feed items', () => {
      const result = isValidItem({
        title: '',
        link: '',
        description: '',
        pubDate: '',
      });
      expect(result).toBeFalsy();
    });
  });
});
