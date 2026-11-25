import { Link } from 'react-router-dom';
import { AppCard, PageHeader } from '@/design-system';
import { sections } from '@/content/sections';
import { games } from '@/content/games';
import { activityGames } from '@/content/activityGames';
import { activityPath } from '@/types/activity';

export default function GamesPage() {
  return (
    <>
      <PageHeader
        title={sections.games.title}
        description={sections.games.description}
      />
      <div className="category-grid">
        {[...activityGames, ...games].map((game) => (
          <AppCard
            key={game.id}
            headingLevel={2}
            title={game.title}
            description={game.description}
            icon="games"
            tone="teal"
          >
            <span>
              {'challenges' in game
                ? '24 thử thách · 3 cấp độ · Tự lưu tiến độ'
                : 'Âm thanh tạo trên thiết bị · Không cần mạng'}
            </span>
            <Link className="button" to={activityPath('game', game.id)}>
              Mở trò chơi: {game.title}
            </Link>
          </AppCard>
        ))}
      </div>
    </>
  );
}
