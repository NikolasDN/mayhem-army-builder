import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DataViewerComponent } from './components/data-viewer/data-viewer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DataViewerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'mayhem';
}
