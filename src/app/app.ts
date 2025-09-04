import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';

@Component({
  selector: 'app-root',


  template: `<router-outlet></router-outlet>`,

  imports: [RouterOutlet, NavbarComponent],
  styleUrl: './app.css'


})
export class App {
}
