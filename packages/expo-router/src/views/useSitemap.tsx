import { RouteNode, sortRoutes } from '../Route';
import { store } from '../global-state/router-store';
import { matchDeepDynamicRouteName } from '../matchers';

const routeSegments = (route: RouteNode, parents: string[]) => [
  ...parents,
  ...route.route.split('/'),
];

const routeHref = (route: RouteNode, parents: string[]) =>
  '/' +
  routeSegments(route, parents)
    .map((segment) => {
      // add an extra layer of entropy to the url for deep dynamic routes
      if (matchDeepDynamicRouteName(segment)) {
        return segment + '/' + Date.now();
      }
      // index must be erased but groups can be preserved.
      return segment === 'index' ? '' : segment;
    })
    .filter(Boolean)
    .join('/');

const routeFilename = (route: RouteNode) => {
  const segments = route.contextKey.split('/');
  // join last two segments for layout routes
  if (route.contextKey.match(/_layout\.[jt]sx?$/)) {
    return segments[segments.length - 2] + '/' + segments[segments.length - 1];
  }

  const routeSegmentsCount = route.route.split('/').length;

  // Join the segment count in reverse order
  // This presents files without layout routes as children with all relevant segments.
  return segments.slice(-routeSegmentsCount).join('/');
};

export type SitemapType = {
  filename: string;
  href: string;
  isInitial: boolean;
  isVirtual: boolean;
  children: SitemapType[];
};

const routeMap: (route: RouteNode) => SitemapType = (route: RouteNode) => ({
  filename: routeFilename(route),
  href: routeHref(route, []),
  isInitial: route.initialRouteName === route.route,
  isVirtual: route.generated ?? false,
  children: route.children.sort(sortRoutes).map((child: RouteNode) => routeMap(child)),
});

export function useSitemap(): SitemapType | null {
  if (!store.routeNode) return null;
  return routeMap(store.routeNode);
}
