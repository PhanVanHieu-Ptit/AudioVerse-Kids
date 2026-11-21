import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { AppLayout } from '@/components/templates/AppLayout';
import { RouteErrorPage } from '@/app/RouteErrorPage';

const HomePage = lazy(() => import('@/features/home/HomePage'));
const StoriesPage = lazy(() => import('@/features/stories/StoriesPage'));
const GamesPage = lazy(() => import('@/features/games/GamesPage'));
const MusicPage = lazy(() => import('@/features/music/MusicPage'));
const LearningPage = lazy(() => import('@/features/learning/LearningPage'));
const TeacherPage = lazy(() => import('@/features/teacher/TeacherPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));
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
      { path: 'truyen', element: <StoriesPage /> },
      { path: 'tro-choi', element: <GamesPage /> },
      { path: 'am-nhac', element: <MusicPage /> },
      { path: 'hoc-tap', element: <LearningPage /> },
      { path: 'giao-vien', element: <TeacherPage /> },
      { path: 'cai-dat', element: <SettingsPage /> },
      { path: 'design-system', element: <DesignSystemPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
