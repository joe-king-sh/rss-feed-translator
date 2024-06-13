import { translate } from '../../src/lib/translate';
import { Translate } from '@aws-sdk/client-translate';

jest.mock('@aws-sdk/client-translate', () => ({
  Translate: jest.fn().mockImplementation(() => ({
    translateText: jest.fn().mockResolvedValue({ TranslatedText: '翻訳されたテキスト' }),
  })),
}));

describe('translate function', () => {
  it('translates text successfully', async () => {
    const text = 'Test text';
    const translatedText = await translate(text);

    expect(translatedText).toBe('翻訳されたテキスト');
    expect(Translate).toHaveBeenCalledTimes(1);
    expect(Translate.prototype.translateText).toHaveBeenCalledWith({
      Text: text,
      SourceLanguageCode: 'en',
      TargetLanguageCode: 'ja',
    });
  });

  it('handles translation errors', async () => {
    Translate.prototype.translateText.mockRejectedValueOnce(new Error('Translation failed'));

    await expect(translate('Test text')).rejects.toThrow('Translation failed');
  });
});
