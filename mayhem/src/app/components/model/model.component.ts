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
  @Output() quantityChange = new EventEmitter<number>();
  @Output() remove = new EventEmitter<void>();
  
  rulesExpanded = true;

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
    return this.entry.points * this.quantity;
  }
}
