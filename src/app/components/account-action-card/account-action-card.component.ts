import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronRight, lucideExternalLink } from '@ng-icons/lucide';

import {
  AccountAuthState,
  AuthStateService,
} from '@rusbe/services/auth-state/auth-state.service';

@Component({
  selector: 'rusbe-account-action-card',
  imports: [CommonModule, RouterModule, NgIcon],
  templateUrl: './account-action-card.component.html',
  providers: [provideIcons({ lucideChevronRight, lucideExternalLink })],
})
export class AccountActionCardComponent {
  authStateService = inject(AuthStateService);

  AccountAuthState = AccountAuthState;
  loginStatus = this.authStateService.accountAuthState;
  cardContent = computed<AccountActionCardContent | undefined>(() => {
    const loginStatus = this.authStateService.accountAuthState();

    if (!loginStatus) {
      return undefined;
    }

    const loginStatusToCardContent: Record<
      AccountAuthState,
      AccountActionCardContent
    > = {
      [AccountAuthState.LoggedIn]: {
        title: 'Você entrou no Rusbé',
        text: 'Aproveite todas as funcionalidades do app.',
        action: {
          icon: 'lucideChevronRight',
          routerLink: '/',
          label: 'Voltar para o início',
        },
      },
      [AccountAuthState.LoggedOut]: {
        title: 'Faça login ou crie uma conta Rusbé',
        text: 'Entre para ver seu saldo e fazer recargas diretamente pelo app.',
        action: {
          icon: 'lucideChevronRight',
          routerLink: '/account/login',
          label: 'Fazer login',
        },
      },
      [AccountAuthState.CredentialRefreshRequired]: {
        title: 'Precisamos confirmar que é você',
        text: 'Para ver seu saldo e fazer recargas, confirme sua identidade.',
        action: {
          icon: 'lucideChevronRight',
          routerLink: '/account/wizard',
          label: 'Confirmar identidade',
        },
      },
      [AccountAuthState.PendingGeneralGoodsIntegrationSetup]: {
        title: 'Termine de configurar sua conta',
        text: 'Para ver seu saldo e fazer recargas, termine de configurar sua conta.',
        action: {
          icon: 'lucideChevronRight',
          routerLink: '/account/wizard',
          label: 'Configure sua conta',
        },
      },
      [AccountAuthState.PendingGeneralGoodsVerification]: {
        title: 'Termine de configurar sua conta',
        text: 'Falta só verificar sua conta para usar todas as funcionalidades do Rusbé.',
        action: {
          icon: 'lucideChevronRight',
          routerLink: '/account/wizard',
          label: 'Configure sua conta',
        },
      },
      [AccountAuthState.GeneralGoodsAccountCredentialMismatch]: {
        title: 'Precisamos reconfigurar sua conta',
        text: 'Parece que você trocou a senha ou apagou a sua conta da General Goods. Precisamos reconfigurar sua conta para continuar usando o Rusbé.',
        action: {
          icon: 'lucideChevronRight',
          routerLink: '/account/wizard',
          label: 'Reconfigurar conta',
        },
      },
      [AccountAuthState.GeneralGoodsServiceUnavailable]: {
        title: 'Parece que o sistema da General Goods está fora do ar',
        text: 'Não estamos conseguindo nos comunicar com o sistema da General Goods. Algumas funcionalidades, como ver seu saldo e fazer recargas, podem estar indisponíveis.',
        action: {
          icon: 'lucideExternalLink',
          externalLink: 'https://status.rusbe.app',
          label: 'Ver status da plataforma',
        },
      },
    };

    return loginStatusToCardContent[loginStatus];
  });
}

export interface AccountActionCardContent {
  title: string;
  text: string;
  action: {
    routerLink?: string;
    externalLink?: string;
    icon: string;
    label: string;
  };
}
