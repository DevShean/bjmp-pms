// Shared module-level variable to track if the splash screen has been shown
// in the current browser session (since last full page refresh).
let splashShown = false;

export const isSplashShown = () => splashShown;
export const setSplashShown = (value: boolean) => {
  splashShown = value;
};
