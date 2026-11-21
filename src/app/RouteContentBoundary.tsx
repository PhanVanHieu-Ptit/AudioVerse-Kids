import { Component, type PropsWithChildren } from 'react';
import { RouteErrorContent } from '@/app/RouteErrorPage';

/** Preserve the shared navigation and in-memory progress on page failures. */
export class RouteContentBoundary extends Component<
  PropsWithChildren,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <RouteErrorContent /> : this.props.children;
  }
}
