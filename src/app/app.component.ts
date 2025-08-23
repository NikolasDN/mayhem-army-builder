import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ArmyBuilderComponent } from './components/army-builder/army-builder.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ArmyBuilderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'mayhem';
}
