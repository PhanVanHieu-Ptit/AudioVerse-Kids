import { Component, type PropsWithChildren } from 'react';

export class ErrorBoundary extends Component<
  PropsWithChildren,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error" id="main-content">
          <h1>Ứng dụng đang gặp sự cố</h1>
          <p>
            Em có thể tải lại trang để thử tiếp. Các cài đặt đã lưu trên thiết
            bị vẫn được giữ lại.
          </p>
          <button className="button" onClick={() => window.location.reload()}>
            Tải lại trang
          </button>
          <a className="text-link" href="/">
            Về trang chủ
          </a>
        </main>
      );
    }
    return this.props.children;
  }
}
