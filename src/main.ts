import { bootstrapApplication } from '@angular/platform-browser';

import * as Sentry from '@sentry/angular';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';
import { version } from './environments/version';

Sentry.init({
  ...environment.sentryConfig,
  release: environment.production ? version : undefined,
});

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err),
);
