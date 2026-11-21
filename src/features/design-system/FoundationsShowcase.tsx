import type { CSSProperties } from 'react';
import {
  colorSamples,
  spacingSamples,
  typeSamples,
} from '@/content/designSystem';
import { ShowcaseSection } from './ShowcaseSection';

export function FoundationsShowcase() {
  return (
    <ShowcaseSection
      id="nen-tang"
      title="Nền tảng thị giác"
      description="Màu sắc có ý nghĩa, chữ dễ đọc và khoảng cách có nhịp điệu."
    >
      <div className="color-grid">
        {colorSamples.map((sample) => (
          <figure className="color-swatch" key={sample.token}>
            <div
              className="color-swatch__paint"
              style={{ '--swatch': `var(${sample.token})` } as CSSProperties}
            />
            <figcaption>
              <strong>{sample.label}</strong>
              <code>{sample.token}</code>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="token-note">
        Màu trạng thái luôn đi cùng chữ hoặc biểu tượng. Màu điểm nhấn dùng với
        chữ tím đậm.
      </p>
      <div className="showcase-grid showcase-grid--two foundation-details">
        <div className="showcase-panel">
          <h3>Chữ rõ, từ nhỏ đến lớn</h3>
          <div className="type-samples">
            {typeSamples.map((sample) => (
              <div key={sample.token}>
                <span
                  style={{
                    fontSize: `var(${sample.token})`,
                    fontWeight: sample.weight,
                  }}
                >
                  {sample.label}
                </span>
                <small>
                  {sample.size} · {sample.weight}
                </small>
              </div>
            ))}
          </div>
          <p className="token-note">
            System font · chiều cao dòng 1.65 · đơn vị rem
          </p>
        </div>
        <div className="showcase-panel">
          <h3>Khoảng cách để dễ tương tác</h3>
          <div className="spacing-samples">
            {spacingSamples.map((sample) => (
              <div key={sample.token}>
                <i
                  style={{ '--sample-space': sample.size } as CSSProperties}
                  aria-hidden="true"
                />
                <code>{sample.size}</code>
              </div>
            ))}
          </div>
          <div className="showcase-table-wrap">
            <table className="showcase-table">
              <caption>Điểm chuyển bố cục</caption>
              <thead>
                <tr>
                  <th scope="col">Từ chiều rộng</th>
                  <th scope="col">Bố cục</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>0</td>
                  <td>Một cột, ưu tiên cảm ứng</td>
                </tr>
                <tr>
                  <td>40rem</td>
                  <td>Hai cột khi đủ chỗ</td>
                </tr>
                <tr>
                  <td>68rem</td>
                  <td>Thanh điều hướng bên</td>
                </tr>
                <tr>
                  <td>86rem</td>
                  <td>Lưới nội dung mở rộng</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ShowcaseSection>
  );
}
