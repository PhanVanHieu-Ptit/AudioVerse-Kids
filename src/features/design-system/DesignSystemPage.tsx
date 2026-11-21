import type { CSSProperties } from 'react';
import { PageHeader } from '@/components/molecules/PageHeader';
import { Icon } from '@/components/atoms/Icon';
import { showcaseSections } from '@/content/designSystem';
import { ThemeShowcase } from './ThemeShowcase';
import { FoundationsShowcase } from './FoundationsShowcase';
import { ControlsShowcase } from './ControlsShowcase';
import { CardsShowcase } from './CardsShowcase';
import { StatesShowcase } from './StatesShowcase';

export default function DesignSystemPage() {
  return (
    <>
      <PageHeader
        title="Design System"
        eyebrow="AUDIOVERSE KIDS · THƯ VIỆN THIẾT KẾ"
        description="Một ngôn ngữ chung cho mọi cách khám phá."
        action={
          <span className="showcase-tag">
            <Icon name="palette" />
            Phiên bản 1.0
          </span>
        }
      />
      <div className="showcase">
        <section
          className="showcase-intro"
          aria-labelledby="design-intro-title"
        >
          <div>
            <h2 id="design-intro-title">
              Lắng nghe thế giới.
              <br />
              Khám phá theo cách của em.
            </h2>
            <p>
              Từ một nút phát đến cả hành trình học tập, mỗi chi tiết đều giúp
              em khám phá độc lập và tự tin hơn.
            </p>
            <div className="showcase-principles">
              <span className="showcase-tag">
                <Icon name="sound" />
                Âm thanh dẫn lối
              </span>
              <span className="showcase-tag">
                <Icon name="keyboard" />
                Bàn phím & cảm ứng
              </span>
              <span className="showcase-tag">
                <Icon name="shield" />
                Mục tiêu WCAG 2.2 AA
              </span>
            </div>
          </div>
          <div className="showcase-wave" aria-hidden="true">
            {[2, 3.5, 5, 3, 6, 4, 2.5, 5, 3.5, 2].map((height, index) => (
              <i
                key={index}
                style={{ '--bar-height': `${height}rem` } as CSSProperties}
              />
            ))}
          </div>
        </section>
        <nav aria-label="Các mục Design System" className="showcase-nav">
          {showcaseSections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.label}
            </a>
          ))}
        </nav>
        <ThemeShowcase />
        <FoundationsShowcase />
        <ControlsShowcase />
        <CardsShowcase />
        <StatesShowcase />
        <aside
          className="showcase-panel showcase-help"
          aria-label="Gợi ý kiểm tra"
        >
          <span className="state-symbol">
            <Icon name="keyboard" />
          </span>
          <p>
            Thử duyệt bằng <kbd>Tab</kbd>, tăng cỡ chữ và đổi giao diện. Trang
            vẫn dùng được khi giảm chuyển động hoặc không phát được âm thanh.
          </p>
        </aside>
      </div>
    </>
  );
}
