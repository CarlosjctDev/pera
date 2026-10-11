import { Routes } from '@angular/router';

import { profileGuard, welcomeGuard } from '@app/core/guards/app.guards';
import { APP_ROUTES } from '@app/core/routing/app.routing';

export const routes: Routes = [
  {
    path: APP_ROUTES.welcome.path,
    canActivate: [welcomeGuard],
    loadComponent: () =>
      import('@app/features/profile/pages/profile/profile').then((m) => m.Profile),
    title: APP_ROUTES.welcome.titleKey,
  },
  {
    path: '',
    canActivate: [profileGuard],
    loadComponent: () => import('@app/core/layouts/app.layout').then((m) => m.AppLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@app/features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard),
        title: APP_ROUTES.dashboard.titleKey,
      },
      {
        path: APP_ROUTES.dashboard.path,
        loadComponent: () =>
          import('@app/features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard),
        title: APP_ROUTES.dashboard.titleKey,
      },
      {
        path: APP_ROUTES.movements.path,
        loadComponent: () =>
          import('@app/features/transactions/pages/transactions/transactions').then(
            (m) => m.Transactions,
          ),
        title: APP_ROUTES.movements.titleKey,
      },
      {
        path: APP_ROUTES.masterData.path,
        children: [
          {
            path: '',
            loadComponent: () =>
              import('@app/features/master-data/pages/master-data/master-data').then(
                (m) => m.MasterData,
              ),
            title: APP_ROUTES.masterData.titleKey,
          },
          {
            path: APP_ROUTES.masterDataCategories.path,
            loadComponent: () =>
              import('@app/features/master-data/pages/categories/categories').then(
                (m) => m.Categories,
              ),
            title: APP_ROUTES.masterDataCategories.titleKey,
          },
          {
            path: APP_ROUTES.masterDataRelationships.path,
            loadComponent: () =>
              import('@app/features/master-data/pages/relationships/relationships').then(
                (m) => m.Relationships,
              ),
            title: APP_ROUTES.masterDataRelationships.titleKey,
          },
          {
            path: APP_ROUTES.masterDataContacts.path,
            loadComponent: () =>
              import('@app/features/master-data/pages/contacts/contacts').then((m) => m.Contacts),
            title: APP_ROUTES.masterDataContacts.titleKey,
          },
        ],
      },
      {
        path: APP_ROUTES.profile.path,
        loadComponent: () =>
          import('@app/features/profile/pages/profile/profile').then((m) => m.Profile),
        title: APP_ROUTES.profile.titleKey,
      },
      {
        path: APP_ROUTES.settings.path,
        loadComponent: () =>
          import('@app/features/settings/pages/settings/settings').then((m) => m.Settings),
        title: APP_ROUTES.settings.titleKey,
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
