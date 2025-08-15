import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BattleScribeEntry } from '../../services/battlescribe.service';

@Component({
  selector: 'app-model',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './model.component.html',
  styleUrls: ['./model.component.scss']
})
export class ModelComponent {
  @Input() entry!: BattleScribeEntry;
  @Input() quantity: number = 1;
  @Input() upgrades: BattleScribeEntry[] = [];
  @Output() quantityChange = new EventEmitter<number>();
  @Output() remove = new EventEmitter<void>();
  @Output() addUpgrade = new EventEmitter<BattleScribeEntry>();
  @Output() removeUpgrade = new EventEmitter<BattleScribeEntry>();
  
  rulesExpanded = true;
  upgradesExpanded = false;
  selectedUpgradesExpanded = false;

  updateQuantity(newQuantity: number) {
    if (newQuantity >= 1) {
      this.quantity = newQuantity;
      this.quantityChange.emit(this.quantity);
    }
  }

  removeModel() {
    this.remove.emit();
  }

  get totalPoints(): number {
    const modelPoints = this.entry.points * this.quantity;
    const upgradePoints = this.upgrades.reduce((total, upgrade) => {
      return total + (upgrade.points * this.quantity);
    }, 0);
    return modelPoints + upgradePoints;
  }

  addUpgradeToModel(upgrade: BattleScribeEntry) {
    this.addUpgrade.emit(upgrade);
  }

  removeUpgradeFromModel(upgrade: BattleScribeEntry) {
    this.removeUpgrade.emit(upgrade);
  }

  isUpgradeAlreadyAdded(upgrade: BattleScribeEntry): boolean {
    return this.upgrades.some(existingUpgrade => existingUpgrade.id === upgrade.id);
  }
}
