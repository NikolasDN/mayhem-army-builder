import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BattleScribeEntry, BattleScribeService } from '../../services/battlescribe.service';

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
  @Input() armyModels: any[] = []; // Add army state input
  @Output() quantityChange = new EventEmitter<number>();
  @Output() remove = new EventEmitter<void>();
  @Output() addUpgrade = new EventEmitter<BattleScribeEntry>();
  @Output() removeUpgrade = new EventEmitter<BattleScribeEntry>();

  constructor(private battleScribeService: BattleScribeService) {}
  
  rulesExpanded = true;
  upgradesExpanded = false;
  selectedUpgradesExpanded = false;
  entryGroupsExpanded = false;

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

  // Check if an upgrade is available based on conditions
  isUpgradeAvailable(upgrade: BattleScribeEntry): boolean {
    return this.battleScribeService.checkEntryConditions(upgrade, this.armyModels);
  }

  // Get condition description for an upgrade
  getUpgradeConditionDescription(upgrade: BattleScribeEntry): string | null {
    if (!upgrade.modifiers || upgrade.modifiers.length === 0) {
      return null;
    }

    for (const modifier of upgrade.modifiers) {
      if (modifier.conditions && modifier.conditions.length > 0) {
        for (const condition of modifier.conditions) {
          if (condition.type === 'at least' && condition.field === 'selections') {
            const requiredCount = parseFloat(condition.value);
            const actualCount = this.armyModels
              .filter(model => model.entry.id === condition.childId)
              .reduce((total, model) => total + model.quantity, 0);
            
            if (actualCount < requiredCount) {
              // Try to find the required entry name
              const requiredEntry = this.armyModels.find(model => model.entry.id === condition.childId)?.entry;
              const entryName = requiredEntry ? requiredEntry.name : 'Unknown Entry';
              return `Requires at least ${requiredCount} ${entryName} models (you have ${actualCount})`;
            }
          }
        }
      }
    }

    return null;
  }

  getEntryGroupEntries(entryGroup: any): BattleScribeEntry[] {
    // Flatten all entries from the entry group and its nested entry groups
    const allEntries: BattleScribeEntry[] = [];
    
    // Add direct entries
    if (entryGroup.entries) {
      allEntries.push(...entryGroup.entries);
    }
    
    // Add entries from nested entry groups
    if (entryGroup.entryGroups) {
      entryGroup.entryGroups.forEach((nestedGroup: any) => {
        allEntries.push(...this.getEntryGroupEntries(nestedGroup));
      });
    }
    
    return allEntries;
  }

  getEntryGroupHierarchy(entryGroup: any): any[] {
    // Return the hierarchical structure of entry groups
    const hierarchy: any[] = [];
    
    // Get all entries from nested groups to check for duplicates
    const nestedEntries = new Set<string>();
    if (entryGroup.entryGroups && entryGroup.entryGroups.length > 0) {
      entryGroup.entryGroups.forEach((nestedGroup: any) => {
        const groupEntries = this.getEntryGroupEntries(nestedGroup);
        groupEntries.forEach((entry: BattleScribeEntry) => nestedEntries.add(entry.id));
      });
    }
    
    // Add direct entries only if they're not already in nested groups
    if (entryGroup.entries && entryGroup.entries.length > 0) {
      const uniqueDirectEntries = entryGroup.entries.filter((entry: BattleScribeEntry) => !nestedEntries.has(entry.id));
      if (uniqueDirectEntries.length > 0) {
        hierarchy.push({
          type: 'entries',
          name: 'Direct Options',
          items: uniqueDirectEntries
        });
      }
    }
    
    // Add nested entry groups
    if (entryGroup.entryGroups && entryGroup.entryGroups.length > 0) {
      entryGroup.entryGroups.forEach((nestedGroup: any) => {
        hierarchy.push({
          type: 'group',
          name: nestedGroup.name,
          group: nestedGroup,
          items: this.getEntryGroupEntries(nestedGroup)
        });
      });
    }
    
    return hierarchy;
  }
}
