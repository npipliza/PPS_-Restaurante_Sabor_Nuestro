import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HomeMetrePageRoutingModule } from './home-metre-routing.module';

import { HomeMetrePage } from './home-metre.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomeMetrePageRoutingModule
  ],
  declarations: [HomeMetrePage]
})
export class HomeMetrePageModule {}
