import { ActivatedRoute, Params, Router } from '@angular/router';
import { TaskService } from './../../task.service';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-taskview',
  templateUrl: './taskview.component.html',
  styleUrl: './taskview.component.scss'
})
export class TaskviewComponent implements OnInit {
  lists!: any[];
  tasks!: any[];
  listId!: string;
  selectedListId!: string;
  constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router, private authService: AuthService) { }

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      this.listId = params['listId'] || '';
      if (this.listId) {
        this.selectedListId = params['listId']
        this.taskService.getTasks(this.listId).subscribe(
          (tasks: any) => {
            this.tasks = tasks;
          },
          (error) => {
            console.error('Error fetching tasks:', error);
          }
        );
      }
    });

    this.taskService.getLists().subscribe(
      (lists: any) => {
        this.lists = lists;
      },
      (error) => {
        console.error('Error fetching lists:', error);
      }
    );
  }
  onTaskClick(task: any) {
    this.taskService.complete(task).subscribe(() => {
      console.log("completed successfully");
      task.completed = !task.completed;
    })
  }
  onDeleteList() {
    this.taskService.deleteList(this.selectedListId).subscribe((res: any) => {
      this.router.navigate(['/lists'])
      console.log(res)
    });
  }
  onTaskDelete(id: string) {
    this.taskService.deleteTask(this.selectedListId, id).subscribe((res: any) => {
      this.tasks = this.tasks.filter(val => val._id !== id);
      console.log(res)
    });
  }
  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login'])
  }
}
