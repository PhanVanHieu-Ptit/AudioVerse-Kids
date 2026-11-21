import { Suspense } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Icon } from '@/components/atoms/Icon';
import { LoadingState } from '@/components/molecules/LoadingState';
import { PwaStatus } from '@/components/organisms/PwaStatus';
import { discoverySections, sections } from '@/content/sections';

export function AppLayout() {
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        Bỏ qua điều hướng, đến nội dung chính
      </a>
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-symbol">
            <Icon name="sound" />
          </span>
          <span>
            AudioVerse <strong>Kids</strong>
            <small>Thế Giới Âm Thanh</small>
          </span>
        </Link>
        <nav aria-label="Điều hướng chính" className="main-nav">
          <NavLink to="/" end>
            <Icon name="home" />
            Khám phá
          </NavLink>
          {discoverySections.map((section) => (
            <NavLink key={section.id} to={section.path}>
              <Icon name={section.icon} />
              {section.title}
            </NavLink>
          ))}
          <div className="nav-divider" />
          <NavLink to={sections.teacher.path}>
            <Icon name="teacher" />
            {sections.teacher.title}
          </NavLink>
          <NavLink to="/cai-dat">
            <Icon name="settings" />
            Cài đặt
          </NavLink>
        </nav>
        <div className="sidebar-note">
          <Icon name="sound" />
          <p>
            Một thế giới rộng mở.
            <br />
            Bằng cách lắng nghe.
          </p>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>Cùng nghe. Cùng học. Cùng lớn.</span>
          <span className="privacy-note">
            <Icon name="shield" />
            Không cần tài khoản
          </span>
        </header>
        <main id="main-content" tabIndex={-1}>
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
        </main>
        <footer className="footer">
          <span>AudioVerse Kids · Dành cho mọi cách khám phá</span>
          <Link to="/cai-dat">Tùy chỉnh khả năng tiếp cận</Link>
        </footer>
      </div>
      <PwaStatus />
    </div>
  );
}
