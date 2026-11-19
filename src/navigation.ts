// Back navigation that survives a page refresh. After a reload (or opening a
// link directly) the navigation stack only holds the current screen, so
// router.back() has nowhere to go — fall back to a sensible parent instead.
import { router, type Href } from 'expo-router';

export const goBack = (fallback: Href = '/') => {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
};
