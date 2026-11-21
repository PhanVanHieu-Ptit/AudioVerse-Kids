import { Link } from 'react-router-dom';
import { AppCard, PageHeader } from '@/design-system';
import { sections } from '@/content/sections';
import { games } from '@/content/games';
import { activityPath } from '@/types/activity';

export default function GamesPage() {
  return (
    <>
      <PageHeader
        title={sections.games.title}
        description={sections.games.description}
      />
      <div className="category-grid">
        {games.map((game) => (
          <AppCard
            key={game.id}
            headingLevel={2}
            title={game.title}
            description={game.description}
            icon="games"
            tone="teal"
          >
            <span>Âm thanh tạo trên thiết bị · Không cần mạng</span>
            <Link className="button" to={activityPath('game', game.id)}>
              Mở trò chơi: {game.title}
            </Link>
          </AppCard>
        ))}
      </div>
    </>
  );
}
