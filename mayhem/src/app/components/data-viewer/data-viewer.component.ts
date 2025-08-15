import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BattleScribeService, BattleScribeCatalogue, BattleScribeEntry } from '../../services/battlescribe.service';

@Component({
  selector: 'app-data-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-viewer.component.html',
  styleUrls: ['./data-viewer.component.scss']
})
export class DataViewerComponent implements OnInit {
  catalogue: BattleScribeCatalogue | null = null;
  loading = true;
  error: string | null = null;
  
  // Filter properties
  selectedType = '';
  searchTerm = '';
  filteredEntries: BattleScribeEntry[] = [];
  availableTypes: string[] = [];

  constructor(private battleScribeService: BattleScribeService) {}

  ngOnInit() {
    this.loadCatalogueData();
  }

  loadCatalogueData() {
    this.loading = true;
    this.error = null;
    
    this.battleScribeService.loadCatalogue().subscribe({
      next: (data) => {
        this.catalogue = data;
        this.availableTypes = this.getUniqueTypes(data.entries);
        this.filteredEntries = data.entries;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load catalogue data';
        this.loading = false;
      }
    });
  }

  getUniqueTypes(entries: BattleScribeEntry[]): string[] {
    const types = entries.map(entry => entry.type);
    return [...new Set(types)].sort();
  }

  filterEntries() {
    if (!this.catalogue) return;
    
    let filtered = this.catalogue.entries;
    
    // Filter by type
    if (this.selectedType) {
      filtered = filtered.filter(entry => entry.type === this.selectedType);
    }
    
    // Filter by search term
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.name.toLowerCase().includes(search) ||
        entry.id.toLowerCase().includes(search)
      );
    }
    
    this.filteredEntries = filtered;
  }
}
