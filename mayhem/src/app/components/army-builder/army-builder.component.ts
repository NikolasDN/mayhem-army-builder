import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BattleScribeService, BattleScribeCatalogue, BattleScribeEntry } from '../../services/battlescribe.service';
import { ModelComponent } from '../model/model.component';

interface ArmyModel {
  entry: BattleScribeEntry;
  quantity: number;
  id: string;
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
    // Filter out upgrades and show only models
    // Typically upgrades have types like 'upgrade', 'wargear', 'equipment', etc.
    // Models usually have types like 'unit', 'model', 'character', etc.
    return entries.filter(entry => {
      const type = entry.type.toLowerCase();
      // Include model-like entries, exclude upgrade-like entries
      return !type.includes('upgrade') && 
             !type.includes('wargear') && 
             !type.includes('equipment') &&
             !type.includes('weapon') &&
             !type.includes('armour') &&
             !type.includes('item');
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
      id: `${this.selectedEntry.id}-${Date.now()}`
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

  removeModelFromArmy(modelId: string) {
    this.armyModels = this.armyModels.filter(m => m.id !== modelId);
  }

  get totalPoints(): number {
    return this.armyModels.reduce((total, model) => {
      return total + (model.entry.points * model.quantity);
    }, 0);
  }

  get totalModels(): number {
    return this.armyModels.reduce((total, model) => {
      return total + model.quantity;
    }, 0);
  }

  get totalRules(): number {
    return this.armyModels.reduce((total, model) => {
      return total + model.entry.rules.length;
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
    
    // Add new army
    existingArmies.push(armyData);
    
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
}
