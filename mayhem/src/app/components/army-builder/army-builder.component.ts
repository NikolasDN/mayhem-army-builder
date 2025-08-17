import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BattleScribeService, BattleScribeCatalogue, BattleScribeEntry } from '../../services/battlescribe.service';
import { ModelComponent } from '../model/model.component';

interface ArmyModel {
  entry: BattleScribeEntry;
  quantity: number;
  id: string;
  upgrades: BattleScribeEntry[];
  customName?: string; // Optional custom name for the model
}

interface SavedArmy {
  id: string;
  name: string;
  totalPoints: number;
  totalModels: number;
  totalRules: number;
  models: ArmyModel[];
  dateCreated: string;
}

@Component({
  selector: 'app-army-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, ModelComponent],
  templateUrl: './army-builder.component.html',
  styleUrls: ['./army-builder.component.scss']
})
export class ArmyBuilderComponent implements OnInit {
  catalogue: BattleScribeCatalogue | null = null;
  loading = true;
  error: string | null = null;
  
  // Army properties
  armyModels: ArmyModel[] = [];
  filteredEntries: BattleScribeEntry[] = [];
  selectedEntry: BattleScribeEntry | null = null;
  
  // Army name
  armyName = 'My Army';
  
  // Saved armies
  savedArmies: SavedArmy[] = [];

  @ViewChildren(ModelComponent) modelComponents!: QueryList<ModelComponent>;

  constructor(private battleScribeService: BattleScribeService) {}

  ngOnInit() {
    this.loadCatalogueData();
    this.savedArmies = this.getSavedArmies();
  }

  loadCatalogueData() {
    this.loading = true;
    this.error = null;
    
    this.battleScribeService.loadCatalogue().subscribe({
      next: (data) => {
        this.catalogue = data;
        // Filter to show only models (not upgrades)
        this.filteredEntries = this.filterModelsOnly(data.entries);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load catalogue data';
        this.loading = false;
      }
    });
  }

  filterModelsOnly(entries: BattleScribeEntry[]): BattleScribeEntry[] {
    // Show only entries that are actual models/units that can be added to the army
    // Exclude all upgrades, wargear, equipment, etc.
    return entries.filter(entry => {
      const type = entry.type.toLowerCase();
      
      // Only include actual model/unit types
      return type === 'model' || 
             type === 'unit' || 
             type === 'character' ||
             type === 'infantry' ||
             type === 'cavalry' ||
             type === 'monster' ||
             type === 'vehicle';
    });
  }

  onEntrySelect(entry: BattleScribeEntry) {
    this.selectedEntry = entry;
  }

  addModelToArmy() {
    if (!this.selectedEntry) return;
    
    const armyModel: ArmyModel = {
      entry: this.selectedEntry,
      quantity: 1,
      id: `${this.selectedEntry.id}-${Date.now()}`,
      upgrades: []
    };
    
    this.armyModels.push(armyModel);
    this.selectedEntry = null;
  }

  updateModelQuantity(modelId: string, newQuantity: number) {
    const model = this.armyModels.find(m => m.id === modelId);
    if (model) {
      model.quantity = newQuantity;
    }
  }

  updateModelName(modelId: string, newName: string) {
    const model = this.armyModels.find(m => m.id === modelId);
    if (model) {
      model.customName = newName.trim() || undefined; // Remove custom name if empty
    }
  }

  removeModelFromArmy(modelId: string) {
    this.armyModels = this.armyModels.filter(m => m.id !== modelId);
  }

  get totalPoints(): number {
    return this.armyModels.reduce((total, model) => {
      const modelPoints = model.entry.points * model.quantity;
      const upgradePoints = model.upgrades.reduce((upgradeTotal, upgrade) => {
        return upgradeTotal + (upgrade.points * model.quantity);
      }, 0);
      return total + modelPoints + upgradePoints;
    }, 0);
  }

  get totalModels(): number {
    return this.armyModels.reduce((total, model) => {
      return total + model.quantity;
    }, 0);
  }

  get totalRules(): number {
    return this.armyModels.reduce((total, model) => {
      const modelRules = model.entry.rules.length;
      const upgradeRules = model.upgrades.reduce((upgradeTotal, upgrade) => {
        return upgradeTotal + upgrade.rules.length;
      }, 0);
      return total + modelRules + upgradeRules;
    }, 0);
  }

  clearArmy() {
    this.armyModels = [];
  }

  saveArmy() {
    if (!this.armyName.trim()) {
      return; // Don't save if no name
    }
    
    const armyData = {
      id: Date.now().toString(),
      name: this.armyName,
      totalPoints: this.totalPoints,
      totalModels: this.totalModels,
      totalRules: this.totalRules,
      models: this.armyModels,
      dateCreated: new Date().toISOString()
    };
    
    // Get existing armies from localStorage
    const existingArmies = this.getSavedArmies();
    
    // Check if an army with the same name already exists
    const existingArmyIndex = existingArmies.findIndex(army => army.name === this.armyName);
    
    if (existingArmyIndex !== -1) {
      // Overwrite existing army with the same name
      existingArmies[existingArmyIndex] = armyData;
    } else {
      // Add new army if no army with this name exists
      existingArmies.push(armyData);
    }
    
    // Save back to localStorage
    localStorage.setItem('savedArmies', JSON.stringify(existingArmies));
    
    // Update the saved armies list
    this.savedArmies = existingArmies;
  }

  getSavedArmies(): SavedArmy[] {
    const saved = localStorage.getItem('savedArmies');
    return saved ? JSON.parse(saved) : [];
  }

  loadArmy(armyId: string) {
    const army = this.savedArmies.find((a: SavedArmy) => a.id === armyId);
    if (army) {
      this.armyName = army.name;
      this.armyModels = army.models;
    }
  }

  deleteArmy(armyId: string) {
    const army = this.savedArmies.find((a: SavedArmy) => a.id === armyId);
    if (army && confirm(`Are you sure you want to delete "${army.name}"?`)) {
      const updatedArmies = this.savedArmies.filter((a: SavedArmy) => a.id !== armyId);
      localStorage.setItem('savedArmies', JSON.stringify(updatedArmies));
      this.savedArmies = updatedArmies;
    }
  }

    printArmy() {
    // Expand all sections in all model components for printing
    this.modelComponents.forEach(modelComponent => {
      modelComponent.expandForPrint();
    });

    // Small delay to ensure DOM updates are complete
    setTimeout(() => {
      window.print();
    }, 100);
  }

  // Helper methods for the print table
  getProfileValue(entry: BattleScribeEntry, characteristicName: string): string {
    for (const profile of entry.profiles) {
      const characteristic = profile.characteristics.find(char => char.name === characteristicName);
      if (characteristic) {
        return characteristic.value;
      }
    }
    return '-';
  }

  getUpgradeProfileValue(upgrades: BattleScribeEntry[], characteristicName: string): string {
    for (const upgrade of upgrades) {
      for (const profile of upgrade.profiles) {
        const characteristic = profile.characteristics.find(char => char.name === characteristicName);
        if (characteristic) {
          return characteristic.value;
        }
      }
    }
    return '-';
  }

  // Get profile value from model or upgrades, prioritizing model's own profile
  getModelOrUpgradeProfileValue(model: ArmyModel, characteristicName: string): string {
    // First check if the model has this characteristic
    const modelValue = this.getProfileValue(model.entry, characteristicName);
    if (modelValue !== '-') {
      return modelValue;
    }
    
    // If model doesn't have it, check upgrades
    return this.getUpgradeProfileValue(model.upgrades, characteristicName);
  }

  getUpgradeNames(upgrades: BattleScribeEntry[]): string {
    if (upgrades.length === 0) return '-';
    return upgrades.map(upgrade => upgrade.name).join(', ');
  }

  getSpecials(model: ArmyModel): string {
    const specials: string[] = [];
    
    // Add model rules
    if (model.entry.rules && model.entry.rules.length > 0) {
      specials.push(...model.entry.rules.map(rule => rule.name));
    }
    
    // Add upgrade names
    if (model.upgrades && model.upgrades.length > 0) {
      specials.push(...model.upgrades.map(upgrade => upgrade.name));
    }
    
    // Add upgrade rules
    if (model.upgrades && model.upgrades.length > 0) {
      for (const upgrade of model.upgrades) {
        if (upgrade.rules && upgrade.rules.length > 0) {
          specials.push(...upgrade.rules.map(rule => rule.name));
        }
      }
    }
    
    if (specials.length === 0) return '-';
    
    // Remove duplicates while preserving order
    const uniqueSpecials = [...new Set(specials)];
    return uniqueSpecials.join(', ');
  }

  hasUpgradeRules(model: ArmyModel): boolean {
    return model.upgrades && model.upgrades.some(upgrade => upgrade.rules && upgrade.rules.length > 0);
  }

  hasModelRules(model: ArmyModel): boolean {
    return model.entry.rules && model.entry.rules.length > 0;
  }

  getModelTotalPoints(model: ArmyModel): number {
    const basePoints = model.entry.points * model.quantity;
    const upgradePoints = model.upgrades.reduce((total, upgrade) => total + upgrade.points, 0) * model.quantity;
    return basePoints + upgradePoints;
  }

  getModelDisplayName(model: ArmyModel): string {
    return model.customName || model.entry.name;
  }

  addUpgradeToModel(modelId: string, upgrade: BattleScribeEntry) {
    const model = this.armyModels.find(m => m.id === modelId);
    if (model) {
      // Check if upgrade is already added to this model
      const isAlreadyAdded = model.upgrades.some(existingUpgrade => existingUpgrade.id === upgrade.id);
      if (!isAlreadyAdded) {
        model.upgrades.push(upgrade);
      }
    }
  }

  removeUpgradeFromModel(modelId: string, upgrade: BattleScribeEntry) {
    const model = this.armyModels.find(m => m.id === modelId);
    if (model) {
      const index = model.upgrades.findIndex(u => u.id === upgrade.id);
      if (index !== -1) {
        model.upgrades.splice(index, 1);
      }
    }
  }

  // Check if an entry is available based on conditions
  isEntryAvailable(entry: BattleScribeEntry): boolean {
    return this.battleScribeService.checkEntryConditions(entry, this.armyModels);
  }

  // Get condition description for an entry
  getConditionDescription(entry: BattleScribeEntry): string | null {
    if (!entry.modifiers || entry.modifiers.length === 0) {
      return null;
    }

    for (const modifier of entry.modifiers) {
      if (modifier.conditions && modifier.conditions.length > 0) {
        for (const condition of modifier.conditions) {
          if (condition.type === 'at least' && condition.field === 'selections') {
            const requiredCount = parseFloat(condition.value);
            const actualCount = this.armyModels
              .filter(model => model.entry.id === condition.childId)
              .reduce((total, model) => total + model.quantity, 0);
            const requiredEntry = this.catalogue?.entries.find(e => e.id === condition.childId);
            const entryName = requiredEntry ? requiredEntry.name : 'Unknown Entry';
            
            if (actualCount < requiredCount) {
              return `Requires at least ${requiredCount} ${entryName} models (you have ${actualCount})`;
            }
          }
        }
      }
    }

    return null;
  }
}
