import { HttpClient, provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import {
  ScreenTrackingService,
  UserTrackingService,
  getAnalytics,
  provideAnalytics,
  setAnalyticsCollectionEnabled,
  setUserProperties,
} from '@angular/fire/analytics';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

import { provideNgIconLoader } from '@ng-icons/core';

import { routes } from '@rusbe/app.routes';
import { environment } from '@rusbe/environments/environment';
import { version } from '@rusbe/environments/version';
import { AccountService } from '@rusbe/services/account/account.service';
import { PreferencesService } from '@rusbe/services/preferences/preferences.service';
import { viewTransitionHandler } from '@rusbe/view-transition-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAppInitializer(() => {
      inject(PreferencesService);
      inject(AccountService);
    }),
    provideRouter(
      routes,
      withViewTransitions({
        onViewTransitionCreated: viewTransitionHandler,
      }),
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideAnalytics(() => {
      const analytics = getAnalytics();

      setUserProperties(analytics, {
        app_version: version,
      });
      setAnalyticsCollectionEnabled(analytics, environment.production);

      return analytics;
    }),
    ScreenTrackingService,
    UserTrackingService,
    provideNgIconLoader((name) => {
      const http = inject(HttpClient);
      return http.get(`/assets/icons/${name}.svg`, { responseType: 'text' });
    }),
  ],
};
