import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

import { Observable, lastValueFrom, map } from 'rxjs';

import { jwtDecode } from 'jwt-decode';

import { environment } from '@rusbe/environments/environment';
import {
  GeneralGoodsAccountRecoveryError,
  GeneralGoodsAccountVerificationError,
  GeneralGoodsLoginError,
  GeneralGoodsRegistrationError,
  GeneralGoodsRequestError,
  GeneralGoodsTokenVerificationError,
  GeneralGoodsTransactionError,
} from '@rusbe/services/general-goods/error-handling';
import {
  LocalStorageService,
  StorageKey,
} from '@rusbe/services/local-storage/local-storage.service';
import { BrlCurrency } from '@rusbe/types/brl-currency';
import { RusbeError, ensureError } from '@rusbe/types/error-handling';

@Injectable({
  providedIn: 'root',
})
export class GeneralGoodsService {
  private BEARER_TOKEN_REFRESH_THRESHOLD = 3 * 24 * 60 * 60; // 3 days

  private generalGoodsBaseUrl = new URL('api/', environment.generalGoodsApiUrl);
  private http: HttpClient = inject(HttpClient);
  private localStorage: LocalStorageService = inject(LocalStorageService);
  // Using same pattern as Firebase Auth, where `undefined` means the service is
  // still loading, while `null` means the token is not available.
  private bearerTokenSignal: WritableSignal<string | null | undefined> =
    signal(undefined);
  public isLoggedIn: Observable<boolean | undefined> = toObservable(
    this.bearerTokenSignal,
  ).pipe(
    map((bearerToken) => {
      if (bearerToken === undefined) {
        return undefined;
      } else {
        return bearerToken !== null;
      }
    }),
  );

  constructor() {
    this.retrieveBearerTokenFromLocalStorage();
  }

  private async performRequest<T>(
    requestDetails: {
      url: URL;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      bearerToken?: string;
      errorHandler?: (cause: HttpErrorResponse) => void;
    },
    body?: unknown,
  ): Promise<T> {
    try {
      let additionalHeaders: Record<string, string> = {};

      if (requestDetails.bearerToken) {
        additionalHeaders = {
          Authorization: `Bearer ${requestDetails.bearerToken}`,
        };
      }

      const headers = new HttpHeaders({
        Accept: 'application/json',
        ...additionalHeaders,
      });

      const response = await lastValueFrom(
        this.http.request<T>(
          requestDetails.method,
          requestDetails.url.toString(),
          { body, headers },
        ),
      );
      return response;
    } catch (error) {
      const cause = ensureError(error);

      if (cause instanceof HttpErrorResponse) {
        // First, we check if the request wasn't successful due to an internal server error (500),
        // or if there some other network or CORS error (status 0).
        if (cause.status === 500 || cause.status === 0) {
          throw new RusbeError(GeneralGoodsRequestError.ServiceUnavailable, {
            cause,
          });
        }

        // Then, we try to handle specific request errors using the provided error handler, if any.
        requestDetails.errorHandler?.(cause);

        // Finally, we check some special cases: unauthorized (401) can be returned when a token is invalid or expired,
        // but also in other cases depending on the request. That's why we check it after the specific error handler.
        if (requestDetails.bearerToken && cause.status === 401) {
          throw new RusbeError(GeneralGoodsRequestError.Unauthorized, {
            cause,
          });
        }

        // Also, there's this weird behavior where the API returns this object with a success message when it cannot
        // process the request due to some internal error.
        const responseBody = cause.error as GeneralGoodsResponseStatus;

        if (
          responseBody.status === 'success' &&
          responseBody.message === 'hi'
        ) {
          throw new RusbeError(GeneralGoodsRequestError.ServiceUnavailable, {
            cause,
          });
        }
      }

      // If we couldn't handle the issue, we throw a generic error.
      throw new RusbeError(
        GeneralGoodsRequestError.RequestFailedWithUnknownError,
        {
          cause,
        },
      );
    }
  }

  public async registerAccount(accountRegisterData: {
    email: string;
    identifier: string;
    password: string;
  }) {
    const requestUrl = new URL(`register/`, this.generalGoodsBaseUrl);
    const requestBody = {
      email: accountRegisterData.email,
      email_confirmation: accountRegisterData.email,
      identifier: accountRegisterData.identifier,
      password: accountRegisterData.password,
      password_confirmation: accountRegisterData.password,
    };
    const errorHandler = (cause: HttpErrorResponse) => {
      const responseBody = cause.error as GeneralGoodsResponseStatus;

      if (responseBody.message?.includes('Cadastro não realizado')) {
        throw new RusbeError(
          GeneralGoodsRegistrationError.IdentifierAlreadyRegisteredOrInvalid,
          { cause },
        );
      }

      if (
        responseBody.message?.includes('O campo email já está sendo utilizado')
      ) {
        throw new RusbeError(GeneralGoodsRegistrationError.EmailAlreadyInUse, {
          cause,
        });
      }
    };

    const accountData = await this.performRequest<
      GeneralGoodsAccountDataResponseBody & GeneralGoodsResponseStatus
    >({ url: requestUrl, method: 'POST', errorHandler }, requestBody);

    await this.saveBearerToken(accountData.authorisation.token);
  }

  public async sendPasswordResetEmail(email: string) {
    const requestUrl = new URL(`recovery/`, this.generalGoodsBaseUrl);
    const requestBody = { email };
    const errorHandler = (cause: HttpErrorResponse) => {
      const responseBody = cause.error as GeneralGoodsResponseStatus;

      if (responseBody.message?.includes('Credenciais inválidas')) {
        throw new RusbeError(
          GeneralGoodsAccountRecoveryError.InvalidCredentialsOrUnverifiedAccount,
          { cause },
        );
      }
    };

    return await this.performRequest(
      { url: requestUrl, method: 'POST', errorHandler },
      requestBody,
    );
  }

  public async sendVerificationEmail(email: string) {
    const requestUrl = new URL(`verification/send/`, this.generalGoodsBaseUrl);
    const requestBody = { email };
    const errorHandler = (cause: HttpErrorResponse) => {
      const responseBody = cause.error as GeneralGoodsResponseStatus;

      if (responseBody.message?.includes('Email já validado')) {
        throw new RusbeError(
          GeneralGoodsAccountVerificationError.AccountAlreadyVerified,
          { cause },
        );
      }

      if (responseBody.message?.includes('Usuário não encontrado')) {
        throw new RusbeError(
          GeneralGoodsAccountVerificationError.AccountNotFound,
          { cause },
        );
      }
    };

    return await this.performRequest(
      { url: requestUrl, method: 'POST', errorHandler },
      requestBody,
    );
  }

  public async login({ email, password }: { email: string; password: string }) {
    const requestUrl = new URL(`login/`, this.generalGoodsBaseUrl);
    const requestBody = { email, password };
    const errorHandler = (cause: HttpErrorResponse) => {
      const responseBody = cause.error as GeneralGoodsResponseStatus;

      if (cause.status === 404) {
        throw new RusbeError(GeneralGoodsLoginError.AccountNotFound, { cause });
      }

      if (responseBody.message?.includes('Credenciais inválidas')) {
        throw new RusbeError(GeneralGoodsLoginError.InvalidCredentials, {
          cause,
        });
      }
    };

    const accountData =
      await this.performRequest<GeneralGoodsAccountDataResponseBody>(
        { url: requestUrl, method: 'POST', errorHandler },
        requestBody,
      );

    await this.saveBearerToken(accountData.authorisation.token);
  }

  public async refreshToken() {
    const requestUrl = new URL(`refresh/`, this.generalGoodsBaseUrl);
    const bearerToken = await this.ensureBearerToken({
      skipRefreshCheck: true,
    });

    const accountData =
      await this.performRequest<GeneralGoodsAccountDataResponseBody>({
        url: requestUrl,
        method: 'POST',
        bearerToken,
        // We don't do any error handling here because if the token is invalid, the API returns an error
        // with no useful information, which will be handled by `performRequest` itself. We also implement
        // some checks to minimize the chances of this happening and do a full login if needed.
      });

    await this.saveBearerToken(accountData.authorisation.token);
  }

  public async logout() {
    if (this.bearerTokenSignal() === null) {
      return;
    }

    const requestUrl = new URL(`logout/`, this.generalGoodsBaseUrl);
    const bearerToken = await this.ensureBearerToken();
    await this.clearBearerToken();
    await this.performRequest({ url: requestUrl, method: 'POST', bearerToken });
  }

  public async getAccountData(): Promise<GeneralGoodsAccountData> {
    const requestUrl = new URL(`user-data/`, this.generalGoodsBaseUrl);
    const bearerToken = await this.ensureBearerToken();

    const responseData =
      await this.performRequest<GeneralGoodsAccountDataResponseBody>({
        url: requestUrl,
        method: 'POST',
        bearerToken,
      });
    return this.parseAccountData(responseData);
  }

  public async startAddCreditsTransactionUsingPix(
    amount: BrlCurrency,
  ): Promise<GeneralGoodsPixTransactionData> {
    const requestUrl = new URL(`payment/pix/`, this.generalGoodsBaseUrl);
    const requestBody = { amount: amount.toNumber(), type: 'Pix' };
    const bearerToken = await this.ensureBearerToken();

    const responseData =
      await this.performRequest<GeneralGoodsPixTransactionDataResponseBody>(
        { url: requestUrl, method: 'POST', bearerToken },
        requestBody,
      );

    if (responseData.errors) {
      throw new RusbeError(GeneralGoodsTransactionError.Failed, {
        context: { responseErrors: responseData.errors },
      });
    }

    return this.parsePixTransactionData(responseData);
  }

  async clearBearerToken() {
    await this.localStorage.remove(StorageKey.GeneralGoodsBearerToken);
    this.bearerTokenSignal.set(null);
  }

  private async retrieveBearerTokenFromLocalStorage() {
    const bearerToken = await this.localStorage.get<string>(
      StorageKey.GeneralGoodsBearerToken,
    );
    if (bearerToken) {
      this.bearerTokenSignal.set(bearerToken);
    } else {
      this.bearerTokenSignal.set(null);
    }
  }

  private async saveBearerToken(token: string) {
    await this.localStorage.set(StorageKey.GeneralGoodsBearerToken, token);
    this.bearerTokenSignal.set(token);
  }

  private async ensureBearerToken(
    options: { skipRefreshCheck?: boolean } = { skipRefreshCheck: false },
  ): Promise<string> {
    const bearerToken = this.bearerTokenSignal();

    if (!bearerToken) {
      throw new RusbeError(
        GeneralGoodsTokenVerificationError.TokenNotAvailable,
      );
    }

    // If token is expired, throw an error
    const decodedToken = jwtDecode(bearerToken) as { exp: number };
    const now = Date.now() / 1000;

    if (decodedToken.exp < now) {
      throw new RusbeError(GeneralGoodsTokenVerificationError.TokenExpired, {
        context: { tokenExpiration: decodedToken.exp },
      });
    }

    // If token expires within the threshold, refresh it
    if (
      !options.skipRefreshCheck &&
      decodedToken.exp - now < this.BEARER_TOKEN_REFRESH_THRESHOLD
    ) {
      await this.refreshToken();
      // TODO: Instead of refreshing the token if it's about to expire, schedule it to be refreshed in the background
    }

    return bearerToken;
  }

  private parseAccountData(
    responseBody: GeneralGoodsAccountDataResponseBody,
  ): GeneralGoodsAccountData {
    const accountData: GeneralGoodsAccountData = {
      apiUserId: responseBody.user.id.toString(),
      personId: responseBody.user.pessoa_id,
      cpfNumber: responseBody.user.pessoa.cpf,
      fullName: responseBody.user.pessoa.nome,
      email: responseBody.user.email,
      balance: this.parseBalance(responseBody),
    };

    return accountData;
  }

  private parseBalance(
    responseBody: GeneralGoodsAccountDataResponseBody,
  ): GeneralGoodsBalance {
    if (
      responseBody.user.pessoa.classificacao_id == '2' ||
      responseBody.user.pessoa.consumo_limite_credito == null
    ) {
      if (
        responseBody.user.pessoa.horarios.find(
          (horario) => horario.inicio === '07:00',
        )
      ) {
        return { type: GeneralGoodsBalanceType.FullGrantStudentHousing };
      } else {
        return { type: GeneralGoodsBalanceType.FullGrant };
      }
    }

    return {
      type: GeneralGoodsBalanceType.PartialGrant,
      value: BrlCurrency.fromGeneralGoodsApiString(
        responseBody.user.pessoa.consumo_limite_credito,
      ),
    };
  }

  private parsePixTransactionData(
    responseBody: GeneralGoodsPixTransactionDataResponseBody,
  ): GeneralGoodsPixTransactionData {
    return {
      apiUserId: responseBody.paymentOrder!.api_user_id.toString(),
      holder: responseBody.paymentOrder!.holder,
      amount: BrlCurrency.fromCents(responseBody.paymentOrder!.amount),
      type: responseBody.paymentOrder!.type,
      paymentId: responseBody.paymentOrder!.paymentId,
      transactionId: responseBody.paymentOrder!.tid,
      receivedDate: new Date(responseBody.paymentOrder!.receivedDate),
      qrCodeString: responseBody.paymentOrder!.qrCodeString,
      qrCodeBase64Image: responseBody.paymentOrder!.qrcodeBase64Image,
    };
  }
}

interface GeneralGoodsAccountDataResponseBody {
  user: {
    id: number;
    pessoa_id: string;
    email: string;
    email_verified_at: Date;
    remember_token: null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    pessoa: {
      id: number;
      n_identificador: string;
      nome: string;
      cpf: string;
      empresa_id: string;
      horario_id: string;
      estado: string;
      classificacao_id: string;
      consumo_limite_credito: string;
      horarios: {
        id: number;
        horario_id: string;
        inicio: string;
        fim: string;
        seg: string;
        ter: string;
        qua: string;
        qui: string;
        sex: string;
        sab: string;
        dom: string;
        fer: string;
        tipo_limite: string;
        limite_acessos: string;
        dias_escala: null;
        ciclo: string;
        liberar: string;
        t_minimo_sentido: string;
        t_minimo_tempo: string;
        t_minimo_fora_faixa: string;
      }[];
    };
  };
  authorisation: {
    token: string;
    type: string;
  };
}

interface GeneralGoodsPixTransactionDataResponseBody {
  paymentOrder?: {
    api_user_id: number;
    holder: string;
    amount: number;
    type: GeneralGoodsTransactionType.Pix;
    status: number;
    updated_at: Date;
    created_at: Date;
    id: number;
    tid: string;
    receivedDate: string;
    paymentId: string;
    returnMessage: string;
    returnCode: string;
    acquirerTransactionId: string;
    qrcodeBase64Image: string;
    qrCodeString: string;
  };
  errors?: unknown;
}

interface GeneralGoodsResponseStatus {
  status?: string | number;
  message?: string;
}

export interface GeneralGoodsAccountData {
  apiUserId: string;
  personId: string;
  cpfNumber: string;
  fullName: string;
  email: string;
  balance: GeneralGoodsBalance;
}

export interface GeneralGoodsPixTransactionData {
  apiUserId: string;
  holder: string;
  amount: BrlCurrency;
  type: GeneralGoodsTransactionType.Pix;
  paymentId: string;
  transactionId: string;
  receivedDate: Date;
  qrCodeString: string;
  qrCodeBase64Image: string;
}

export type GeneralGoodsBalance =
  | GeneralGoodsPartialGrantBalance
  | GeneralGoodsFullGrantBalance;

export interface GeneralGoodsPartialGrantBalance {
  type: GeneralGoodsBalanceType.PartialGrant;
  value: BrlCurrency;
}

export interface GeneralGoodsFullGrantBalance {
  type:
    | GeneralGoodsBalanceType.FullGrant
    | GeneralGoodsBalanceType.FullGrantStudentHousing;
}

export enum GeneralGoodsBalanceType {
  FullGrantStudentHousing = 'full-grant-student-housing',
  FullGrant = 'full-grant',
  PartialGrant = 'partial-grant',
  NoGrant = 'no-grant',
}

export enum GeneralGoodsTransactionType {
  Pix = 'Pix',
  CreditCard = 'Cartão de crédito',
}
