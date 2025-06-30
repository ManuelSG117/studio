declare module 'react-google-recaptcha';

declare interface Window {
  grecaptcha: {
    ready: (cb: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
  };
}
