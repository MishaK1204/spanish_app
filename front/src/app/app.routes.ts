import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
  },
  {
    path: 'learned',
    loadComponent: () => import('./pages/learned/learned').then((m) => m.Learned),
  },
  {
    path: 'category/:categoryId',
    loadComponent: () => import('./pages/study-shell/study-shell').then((m) => m.StudyShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'flashcards' },
      {
        path: 'flashcards',
        loadComponent: () =>
          import('./pages/flashcards/flashcards').then((m) => m.Flashcards),
      },
      {
        path: 'quiz',
        loadComponent: () => import('./pages/quiz/quiz').then((m) => m.Quiz),
      },
      {
        path: 'browse',
        loadComponent: () => import('./pages/browse/browse').then((m) => m.Browse),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
