import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

import {
  Observable,
  combineLatest,
  debounceTime,
  filter,
  map,
  switchMap,
  timer,
} from 'rxjs';

import { AccountService } from '@rusbe/services/account/account.service';
import { AccountServiceError } from '@rusbe/services/account/error-handling';
import { FirebaseServiceError } from '@rusbe/services/firebase/error-handling';
import {
  GeneralGoodsLoginError,
  GeneralGoodsRequestError,
  GeneralGoodsTokenVerificationError,
} from '@rusbe/services/general-goods/error-handling';
import {
  GeneralGoodsAccountData,
  GeneralGoodsService,
} from '@rusbe/services/general-goods/general-goods.service';
import { GoogleDriveServiceError } from '@rusbe/services/google-drive/error-handling';
import { RusbeError } from '@rusbe/types/error-handling';

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  private readonly ACCOUNT_DATA_UPDATE_INTERVAL_IN_MILLIS = 10 * 60 * 1000; // 10 minutes
  private readonly DEBOUNCE_TIME_IN_MILLIS = 300;

  private accountService: AccountService = inject(AccountService);
  private generalGoodsService: GeneralGoodsService =
    inject(GeneralGoodsService);
  private accountDataUpdateObservable: Observable<void>;
  private writableAccountAuthState: WritableSignal<
    AccountAuthState | undefined
  > = signal(undefined);
  private writableGeneralGoodsAccountData: WritableSignal<
    GeneralGoodsAccountData | undefined
  > = signal(undefined);
  private readonly currentUserObservable = toObservable(
    this.accountService.currentUser,
  );

  public readonly accountAuthState = this.writableAccountAuthState.asReadonly();
  public readonly generalGoodsAccountData =
    this.writableGeneralGoodsAccountData.asReadonly();

  constructor() {
    // Triggers an update change whenever there's an update in Firebase or General Goods user or every 10 minutes.
    // Skips when either of the observables are undefined, which means that services are still initializing.
    this.accountDataUpdateObservable = combineLatest([
      this.currentUserObservable,
      this.generalGoodsService.isLoggedIn,
    ]).pipe(
      filter(
        ([currentUser, generalGoodsIsLoggedIn]) =>
          currentUser !== undefined && generalGoodsIsLoggedIn !== undefined,
      ),
      debounceTime(this.DEBOUNCE_TIME_IN_MILLIS),
      // Refresh every 10 minutes
      switchMap(() =>
        timer(0, this.ACCOUNT_DATA_UPDATE_INTERVAL_IN_MILLIS).pipe(
          map(() => {
            return;
          }),
        ),
      ),
    );

    this.setupAuthStateAutoRefresh();
  }

  public setupAuthStateAutoRefresh() {
    this.accountDataUpdateObservable.subscribe(async () => {
      await this.updateAccountAuthState();
    });
  }

  public async updateAccountAuthState() {
    const currentUser = this.accountService.currentUser();

    if (currentUser === null) {
      await this.generalGoodsService.clearBearerToken();
      this.writableAccountAuthState.set(AccountAuthState.LoggedOut);
      this.writableGeneralGoodsAccountData.set(undefined);
      return;
    }

    if (currentUser === undefined) {
      this.writableAccountAuthState.set(undefined);
      this.writableGeneralGoodsAccountData.set(undefined);
      return;
    }

    await this.tryFetchGeneralGoodsAccountDataUsingCachedToken({
      allowRetry: true,
    });
  }

  private async tryFetchGeneralGoodsAccountDataUsingCachedToken(
    options: { allowRetry: boolean } = {
      allowRetry: false,
    },
  ) {
    try {
      const generalGoodsAccountData =
        await this.generalGoodsService.getAccountData();
      this.writableAccountAuthState.set(AccountAuthState.LoggedIn);
      this.writableGeneralGoodsAccountData.set(generalGoodsAccountData);
    } catch (error) {
      if (error instanceof RusbeError) {
        if (
          error.message ===
            GeneralGoodsTokenVerificationError.TokenNotAvailable ||
          error.message === GeneralGoodsTokenVerificationError.TokenExpired ||
          error.message === GeneralGoodsRequestError.Unauthorized
        ) {
          if (options.allowRetry) {
            await this.tryFetchGeneralGoodsAuthToken();
          } else {
            this.writableAccountAuthState.set(
              AccountAuthState.CredentialRefreshRequired,
            );
            this.writableGeneralGoodsAccountData.set(undefined);
          }
        }

        this.checkGeneralGoodsServiceAvailability(error);
      }
    }
  }

  private async tryFetchGeneralGoodsAuthToken() {
    try {
      await this.accountService.fetchGeneralGoodsAuthToken();
      await this.tryFetchGeneralGoodsAccountDataUsingCachedToken({
        allowRetry: false,
      });
    } catch (error) {
      if (error instanceof RusbeError) {
        if (
          error.message ===
            AccountServiceError.GeneralGoodsIntegrationDataMissing ||
          error.message === AccountServiceError.EncryptionKeyNotFound
        ) {
          this.writableAccountAuthState.set(
            AccountAuthState.PendingGeneralGoodsIntegrationSetup,
          );
          this.writableGeneralGoodsAccountData.set(undefined);
        }

        if (
          error.message === GoogleDriveServiceError.OperationRequiresCachedToken
        ) {
          this.writableAccountAuthState.set(
            AccountAuthState.CredentialRefreshRequired,
          );
          this.writableGeneralGoodsAccountData.set(undefined);
        }

        if (
          Object.values(FirebaseServiceError).includes(
            error.message as FirebaseServiceError,
          )
        ) {
          console.error(
            'Auth State Service: Firebase error while processing state',
            error,
          );
          // FIXME: Handle Firebase errors
        }

        if (
          error.message === GeneralGoodsLoginError.AccountNotFound ||
          error.message === GeneralGoodsLoginError.InvalidCredentials
        ) {
          await this.inferReasonForGeneralGoodsLoginUnsuccessful();
        }

        this.checkGeneralGoodsServiceAvailability(error);
      }
    }
  }

  async inferReasonForGeneralGoodsLoginUnsuccessful() {
    try {
      const integrationStatus =
        await this.accountService.fetchGeneralGoodsIntegrationStatus();

      if (integrationStatus.integrationCompleted) {
        this.writableAccountAuthState.set(
          AccountAuthState.GeneralGoodsAccountCredentialMismatch,
        );
        this.writableGeneralGoodsAccountData.set(undefined);
      } else {
        this.writableAccountAuthState.set(
          AccountAuthState.PendingGeneralGoodsVerification,
        );
        this.writableGeneralGoodsAccountData.set(undefined);
      }
    } catch (error) {
      // This should not happen. Since login was attempted, integration data is expected to exist.

      console.warn(
        'Auth State Service: Unexpected status when trying to infer reason for unsuccessful General Goods login.',
        error,
      );

      this.writableAccountAuthState.set(
        AccountAuthState.CredentialRefreshRequired,
      );
      this.writableGeneralGoodsAccountData.set(undefined);
    }
  }

  checkGeneralGoodsServiceAvailability(error: RusbeError) {
    if (error.message === GeneralGoodsRequestError.ServiceUnavailable) {
      this.writableAccountAuthState.set(
        AccountAuthState.GeneralGoodsServiceUnavailable,
      );
      this.writableGeneralGoodsAccountData.set(undefined);
    }
  }
}

export enum AccountAuthState {
  LoggedOut = 'logged-out',
  LoggedIn = 'logged-in',
  PendingGeneralGoodsIntegrationSetup = 'pending-general-goods-integration-setup',
  PendingGeneralGoodsVerification = 'pending-general-goods-verification',
  GeneralGoodsAccountCredentialMismatch = 'general-goods-account-credential-mismatch',
  CredentialRefreshRequired = 'credential-refresh-required',
  GeneralGoodsServiceUnavailable = 'general-goods-service-unavailable',
}
