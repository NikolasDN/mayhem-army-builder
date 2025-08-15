import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BattleScribeService, BattleScribeCatalogue, BattleScribeEntry } from '../../services/battlescribe.service';

@Component({
  selector: 'app-service-examples',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-examples.component.html',
  styleUrls: ['./service-examples.component.scss']
})
export class ServiceExamplesComponent implements OnInit {
  basicData: BattleScribeCatalogue | null = null;
  loading = false;
  loadingAll = false;
  
  availableTypes: string[] = [];
  filteredByType: BattleScribeEntry[] = [];
  searchId = '';
  foundEntry: BattleScribeEntry | null = null;
  
  allData: {
    catalogue?: BattleScribeCatalogue;
    gameSystem?: any;
    dataIndex?: any;
  } | null = null;

  constructor(private battleScribeService: BattleScribeService) {}

  ngOnInit() {
    // Auto-load basic data on component init
    this.loadBasicData();
  }

  loadBasicData() {
    this.loading = true;
    this.battleScribeService.loadCatalogue().subscribe({
      next: (data) => {
        this.basicData = data;
        this.availableTypes = this.getUniqueTypes(data.entries);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading catalogue:', err);
        this.loading = false;
      }
    });
  }

  filterByType(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedType = target.value;
    
    if (!this.basicData) return;
    
    if (selectedType) {
      this.filteredByType = this.battleScribeService.getEntriesByType(this.basicData, selectedType);
    } else {
      this.filteredByType = [];
    }
  }

  findEntry() {
    if (!this.basicData || !this.searchId.trim()) return;
    
    this.foundEntry = this.battleScribeService.getEntryById(this.basicData, this.searchId.trim()) || null;
  }

  loadAllData() {
    this.loadingAll = true;
    
    // Load all three data types
    const catalogue$ = this.battleScribeService.loadCatalogue();
    const gameSystem$ = this.battleScribeService.loadGameSystem();
    const dataIndex$ = this.battleScribeService.loadDataIndex();
    
    // Combine all observables
    catalogue$.subscribe({
      next: (catalogue) => {
        gameSystem$.subscribe({
          next: (gameSystem) => {
            dataIndex$.subscribe({
              next: (dataIndex) => {
                this.allData = { catalogue, gameSystem, dataIndex };
                this.loadingAll = false;
              },
              error: (err) => {
                console.error('Error loading data index:', err);
                this.loadingAll = false;
              }
            });
          },
          error: (err) => {
            console.error('Error loading game system:', err);
            this.loadingAll = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading catalogue:', err);
        this.loadingAll = false;
      }
    });
  }

  private getUniqueTypes(entries: BattleScribeEntry[]): string[] {
    const types = entries.map(entry => entry.type);
    return [...new Set(types)].sort();
  }
}
