import { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { AppLayout } from '@/components/templates/AppLayout';
import { RouteErrorPage } from '@/app/RouteErrorPage';

const HomePage = lazy(() => import('@/features/home/HomePage'));
const StoriesPage = lazy(() => import('@/features/stories/StoriesPage'));
const GamesPage = lazy(() => import('@/features/games/GamesPage'));
const StoryPage = lazy(() => import('@/features/stories/StoryPage'));
const GamePage = lazy(() => import('@/features/games/GamePage'));
const MusicPage = lazy(() => import('@/features/music/MusicPage'));
const LearningPage = lazy(() => import('@/features/learning/LearningPage'));
const TeacherPage = lazy(() => import('@/features/teacher/TeacherPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));
const KeyboardHelpPage = lazy(() => import('@/features/help/KeyboardHelpPage'));
const DesignSystemPage = lazy(
  () => import('@/features/design-system/DesignSystemPage'),
);
const NotFoundPage = lazy(() => import('@/app/NotFoundPage'));

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'stories', element: <StoriesPage /> },
      { path: 'stories/:storyId', element: <StoryPage /> },
      { path: 'games', element: <GamesPage /> },
      { path: 'games/:gameId', element: <GamePage /> },
      { path: 'music', element: <MusicPage /> },
      { path: 'learning', element: <LearningPage /> },
      { path: 'teacher', element: <TeacherPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'help', element: <KeyboardHelpPage /> },
      { path: 'truyen', element: <Navigate to="/stories" replace /> },
      { path: 'tro-choi', element: <Navigate to="/games" replace /> },
      { path: 'am-nhac', element: <Navigate to="/music" replace /> },
      { path: 'hoc-tap', element: <Navigate to="/learning" replace /> },
      { path: 'giao-vien', element: <Navigate to="/teacher" replace /> },
      { path: 'cai-dat', element: <Navigate to="/settings" replace /> },
      { path: 'design-system', element: <DesignSystemPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
