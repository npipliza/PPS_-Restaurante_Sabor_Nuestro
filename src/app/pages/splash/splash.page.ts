import { Component , OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AnimationController, Animation } from '@ionic/angular';
import {Howl, Howler} from 'howler';
const {Howl, Howler} = require('howler');
@Component({
  selector: 'app-splash',
  templateUrl: 'splash.page.html',
  styleUrls: ['splash.page.scss'],
})
export class SplashPage implements OnInit {

  constructor(
    private animationController: AnimationController,
    private router: Router
  ) {}

  ngOnInit(): void {
    setTimeout(()=>{
      this.sonidoBienvenida();
    this.router.navigateByUrl('login');
    }, 2000)
  }

  private sonidoBienvenida(){
    var sound = new Howl({
      src: ['../assets/mario-coin.mp3']
    });
    
    sound.play();
  }

}
