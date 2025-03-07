import { Component, inject, input, output, signal } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';

import { WizardStep } from '@rusbe/pages/account/wizard/wizard.component';
import {
  AccountService,
  GeneralGoodsIntegrationType,
} from '@rusbe/services/account/account.service';

import { InterludeComponent } from '../../interlude/interlude.component';

@Component({
  selector: 'rusbe-wizard-account-setup-disclaimer',
  imports: [NgIcon, InterludeComponent],
  templateUrl: './account-setup-disclaimer.component.html',
  viewProviders: [provideIcons({ lucideChevronDown })],
})
export class WizardAccountSetupDisclaimerComponent {
  accountService = inject(AccountService);

  goToStep = output<WizardStep>();
  integrationType = input.required<GeneralGoodsIntegrationType>();

  GeneralGoodsIntegrationType = GeneralGoodsIntegrationType;
  WizardStep = WizardStep;

  isSavingLegalConsent = signal<boolean>(false);

  faqEntries: FAQEntry[] = [
    {
      question: 'Como o Rusbé protege meus dados?',
      answer: `A sua chave aleatória usada para se comunicar com a General Goods é
        armazenada de forma criptografada e apenas sua UFPE ID pode acessá-la.
        Não conseguíriamos acessar sua conta nem se quiséssemos. Além disso, o
        código do Rusbé é aberto e pode ser auditado por qualquer pessoa.
        Para saber mais detalhes, leia nossa política de privacidade.`,
    },
    {
      question: 'A equipe do Rusbé tem acesso à minha senha?',
      answer: `Não; nem a de sua UFPE ID, nem a da sua conta da General Goods. A sua
        chave aleatória é armazenada de forma criptografada e apenas sua UFPE ID
        poderá acessá-la.`,
    },
    {
      question: 'Posso usar o app da General Goods também?',
      answer: `Sim. Você pode usar o seu e-mail da UFPE e sua chave aleatória gerada
        pelo Rusbé como a senha para acessar o app da General Goods. Você poderá
        visualizar sua chave na seção
        <em>Sua conta</em> do Rusbé.`,
    },
    {
      question: 'Posso trocar a minha senha da General Goods?',
      answer: `Você pode trocar a sua senha a qualquer momento no app da General Goods.
        No entanto, <strong>ao fazer isso, o Rusbé não conseguirá mais se comunicar com
        a sua conta</strong>. Neste caso, caso volte a utilizar o Rusbé, você será solicitado a
        gerar uma nova chave aleatória.`,
    },
  ];

  async accept() {
    this.isSavingLegalConsent.set(true);
    await this.accountService.saveLegalConsent();

    if (
      this.integrationType() === GeneralGoodsIntegrationType.ExistingAccount
    ) {
      this.goToStep.emit(WizardStep.ExistingGeneralGoodsAccountEmailCheck);
    }

    if (this.integrationType() === GeneralGoodsIntegrationType.NewAccount) {
      this.goToStep.emit(WizardStep.NewGeneralGoodsAccountIdentifierInput);
    }
  }
}

interface FAQEntry {
  question: string;
  answer: string;
}
