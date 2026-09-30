import { DriverLicense } from './driver-license';

describe('DriverLicense', () => {
  it.each(['FARME100165AB5EW', '99999740614992TL'])(
    'accepts the valid license %s',
    (license) => {
      expect(DriverLicense.withLicense(license).asString()).toBe(license);
    },
  );

  it.each(['', 'invalid', 'farme100165ab5ew', 'FARME100165AB5EW!'])(
    'rejects the invalid license %s',
    (license) => {
      expect(() => DriverLicense.withLicense(license)).toThrow();
    },
  );

  it('retains an unvalidated license for an inactive candidate', () => {
    expect(DriverLicense.withoutValidation('invalid').asString()).toBe(
      'invalid',
    );
  });
});
