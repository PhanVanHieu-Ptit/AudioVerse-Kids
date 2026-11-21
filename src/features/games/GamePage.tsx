import { Link, useParams } from 'react-router-dom';
import { EmptyState, PageHeader } from '@/design-system';
import { games } from '@/content/games';
import { ToneGame } from '@/features/games/ToneGame';

export default function GamePage() {
  const { gameId } = useParams();
  const game = games.find((item) => item.id === gameId);
  return (
    <>
      <PageHeader
        title={game?.title ?? 'Chơi trò chơi'}
        description={
          game?.description ?? 'Mỗi lần lắng nghe là một lần khám phá.'
        }
      />
      {game ? (
        <ToneGame key={game.id} game={game} />
      ) : (
        <EmptyState
          headingLevel={2}
          icon="games"
          title="Chưa tìm thấy trò chơi này"
          description="Trò chơi có thể chưa được bổ sung hoặc đường dẫn chưa đúng. Em hãy chọn một trò chơi trong danh sách."
          action={
            <Link className="button" to="/games">
              Về danh sách trò chơi
            </Link>
          }
        />
      )}
    </>
  );
}
