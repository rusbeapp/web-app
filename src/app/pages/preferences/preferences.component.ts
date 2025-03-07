import { SelectionModel } from '@angular/cdk/collections';
import { Dialog } from '@angular/cdk/dialog';
import { Component, TemplateRef, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { filter, take } from 'rxjs';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronRight,
  lucideEraser,
  lucideFullscreen,
  lucideListStart,
  lucidePalette,
  lucideRotateCcw,
  lucideUtensils,
} from '@ng-icons/lucide';

import {
  HeaderComponent,
  HeaderType,
} from '@rusbe/components/header/header.component';
import { InterludeComponent } from '@rusbe/components/interlude/interlude.component';
import { LocalStorageService } from '@rusbe/services/local-storage/local-storage.service';
import {
  InterfaceTheme,
  PreferencesService,
} from '@rusbe/services/preferences/preferences.service';
import { MealType } from '@rusbe/types/archive';

@Component({
  selector: 'rusbe-preferences-page',
  imports: [NgIcon, HeaderComponent, FormsModule, InterludeComponent],
  templateUrl: './preferences.component.html',
  viewProviders: [
    provideIcons({
      lucidePalette,
      lucideUtensils,
      lucideListStart,
      lucideFullscreen,
      lucideRotateCcw,
      lucideEraser,
      lucideChevronRight,
    }),
  ],
})
export class PreferencesPageComponent {
  readonly HEADER_TYPE = HeaderType.PageNameWithBackButton;
  readonly MEAL_TYPES = Object.values(MealType);
  readonly INTERFACE_THEME_OPTIONS: InterfaceThemeOption[] = [
    { value: InterfaceTheme.System, label: 'Sistema' },
    { value: InterfaceTheme.Light, label: 'Claro' },
    { value: InterfaceTheme.Dark, label: 'Escuro' },
  ];

  confirmDialogTemplate =
    viewChild.required<TemplateRef<Element>>('confirmDialog');
  dialogTitle = '';
  dialogText = '';
  confirmAction?: ConfirmAction;

  preferencesService = inject(PreferencesService);
  localStorageService = inject(LocalStorageService);
  dialog = inject(Dialog);

  relevantMealsModel?: SelectionModel<MealType>;

  async updateShowMainCourseOnTopPreference(value: boolean) {
    await this.preferencesService.setShowMainCourseOnTopPreference(value);
  }

  async updateShowMainCourseWithLargerFontPreference(value: boolean) {
    await this.preferencesService.setShowMainCourseWithLargerFontPreference(
      value,
    );
  }

  async updateInterfaceThemePreference(value: InterfaceTheme) {
    await this.preferencesService.setInterfaceThemePreference(value);
  }

  async updateRelevantMealsPreferenceSelection(
    mealType: MealType,
    value: boolean,
  ) {
    if (!this.relevantMealsModel) {
      return;
    }

    if (value) {
      this.relevantMealsModel.select(mealType);
    } else {
      this.relevantMealsModel.deselect(mealType);
    }

    await this.preferencesService.setRelevantMealsPreference(
      this.relevantMealsModel.selected,
    );
  }

  isMealEnabledForSelection(mealType: MealType): boolean {
    return !(
      this.relevantMealsModel?.isSelected(mealType) &&
      this.relevantMealsModel?.selected.length === 1
    );
  }

  promptResetUserPreferences() {
    this.dialogTitle = 'Tem certeza de que deseja redefinir suas preferências?';
    this.dialogText = 'Esta ação não pode ser desfeita.';
    this.confirmAction = ConfirmAction.ResetUserPreferences;

    this.dialog.open(this.confirmDialogTemplate(), {
      autoFocus: 'button',
      backdropClass: 'bg-beterraba/60',
    });
  }

  promptClearAllData() {
    this.dialogTitle =
      'Tem certeza de que deseja limpar todos os dados do Rusbé?';
    this.dialogText =
      'Esta ação não pode ser desfeita. Após a confirmação, o Rusbé será recarregado.';
    this.confirmAction = ConfirmAction.ClearAllData;

    this.dialog.open(this.confirmDialogTemplate(), {
      autoFocus: 'button',
      backdropClass: 'bg-beterraba/60',
    });
  }

  async performDialogDestructiveAction() {
    if (this.confirmAction === ConfirmAction.ResetUserPreferences) {
      await this.preferencesService.setUserPreferencesToDefault();
      window.location.reload();
    } else if (this.confirmAction === ConfirmAction.ClearAllData) {
      await this.localStorageService.clear();
      window.location.assign(new URL(window.location.href).origin);
    }
  }

  constructor() {
    // When preferences are loaded, the relevant meals model is created with the selected meals
    this.preferencesService.userPreferencesObservable
      .pipe(
        filter((preferences) => preferences !== undefined),
        take(1),
      )
      .subscribe((preferences) => {
        this.relevantMealsModel = new SelectionModel<MealType>(
          true,
          preferences.relevantMeals,
        );
      });
  }
}

interface InterfaceThemeOption {
  value: InterfaceTheme;
  label: string;
}

enum ConfirmAction {
  ResetUserPreferences = 'resetPreferences',
  ClearAllData = 'clearAppData',
}
