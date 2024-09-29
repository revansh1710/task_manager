import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaskviewComponent } from './pages/taskview/taskview.component';
import { NewListComponent } from './pages/new-list/new-list.component';
import { NewTaskComponent } from './pages/new-task/new-task.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { SignupComponent } from './pages/signup/signup.component';
import { EditListComponent } from './pages/edit-list/edit-list.component';
import { EditTaskComponent } from './pages/edit-task/edit-task.component';
import { authGuard } from './auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'new list', component: NewListComponent, canActivate: [authGuard] },
  { path: 'edit-list/:listId', component: EditListComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginPageComponent },
  { path: 'signup', component: SignupComponent, canActivate: [authGuard] },
  { path: 'lists', component: TaskviewComponent, canActivate: [authGuard] },  // To load the lists
  { path: 'lists/:listId', component: TaskviewComponent, canActivate: [authGuard] },
  { path: 'lists/:listId/new task', component: NewTaskComponent, canActivate: [authGuard] },
  { path: 'lists/:listId/edit-task/:taskId', component: EditTaskComponent, canActivate: [authGuard] }, // To load tasks for a specific list
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
