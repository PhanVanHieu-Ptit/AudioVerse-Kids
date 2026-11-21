export function LoadingState({
  label = 'Đang mở trang, em chờ một chút nhé…',
}: {
  label?: string;
}) {
  return (
    <div className="state-panel av-state" role="status" aria-atomic="true">
      <span className="loading-indicator" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
