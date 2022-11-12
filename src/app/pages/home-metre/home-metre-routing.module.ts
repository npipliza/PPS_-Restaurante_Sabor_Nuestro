import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeMetrePage } from './home-metre.page';

const routes: Routes = [
  {
    path: '',
    component: HomeMetrePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeMetrePageRoutingModule {}
