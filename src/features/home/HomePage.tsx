import { Link } from 'react-router-dom';
import { Icon } from '@/components/atoms/Icon';
import { PageHeading } from '@/components/molecules/PageHeading';
import { discoverySections } from '@/content/sections';
import { VoiceGuidanceButton } from '@/accessibility/VoiceGuidanceButton';
import { voiceMessages } from '@/content/voiceMessages';

export default function HomePage() {
  return (
    <>
      <PageHeading
        title="Chào em, cùng khám phá nhé!"
        description="Một câu chuyện, một giai điệu, một điều mới mỗi ngày."
      />
      <section className="welcome-panel" aria-labelledby="welcome-title">
        <div className="welcome-copy">
          <span className="eyebrow">THẾ GIỚI ÂM THANH CỦA EM</span>
          <h2 id="welcome-title">
            Lắng nghe điều nhỏ bé.
            <br />
            Khám phá thế giới lớn.
          </h2>
          <p>{voiceMessages.welcome.text}</p>
          <VoiceGuidanceButton
            message={voiceMessages.welcome}
            label="Nghe lời chào mừng"
          />
          <Link className="button" to="/settings">
            <Icon name="settings" />
            Tùy chỉnh cho em
          </Link>
        </div>
        <div className="sound-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="art-note note-one">♪</span>
          <span className="art-note note-two">♫</span>
          <span className="art-spark">✦</span>
          <div className="sound-center">
            <Icon name="sound" />
          </div>
          <span className="art-caption">mỗi âm thanh, một khám phá</span>
        </div>
      </section>
      <section className="discovery" aria-labelledby="discovery-title">
        <div className="section-heading">
          <h2 id="discovery-title">Em muốn khám phá gì?</h2>
          <span>Chọn một không gian bên dưới</span>
        </div>
        <div className="category-grid">
          {discoverySections.map((section) => (
            <article
              className={`category-card ${section.color}`}
              key={section.id}
            >
              <span className={`category-icon ${section.color}`}>
                <Icon name={section.icon} />
              </span>
              <h3>{section.title}</h3>
              <p id={`${section.id}-description`}>{section.description}</p>
              <Link
                className="card-action"
                to={section.path}
                aria-describedby={`${section.id}-description`}
              >
                Khám phá {section.title.toLocaleLowerCase('vi')}
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="guidance" aria-labelledby="guidance-title">
        <div className="guidance-symbol">
          <Icon name="keyboard" />
        </div>
        <div>
          <h2 id="guidance-title">Thoải mái theo cách của em</h2>
          <p>
            Dùng phím <kbd>Tab</kbd> để đến các mục, <kbd>Enter</kbd> để mở. Em
            cũng có thể chạm vào màn hình hoặc sử dụng trình đọc màn hình.
          </p>
        </div>
        <Link className="text-link" to="/settings">
          Cài đặt hiển thị
        </Link>
      </section>
    </>
  );
}
