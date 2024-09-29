import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../task.service';
import { ActivatedRoute, Params, Router } from '@angular/router';

@Component({
  selector: 'app-new-task',
  templateUrl: './new-task.component.html',
  styleUrl: './new-task.component.scss'
})
export class NewTaskComponent implements OnInit {
  listId: any;
  tasks: any;
  constructor(private taskservice: TaskService, private route: ActivatedRoute, private router: Router) {
  }
  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      console.log('Params:', params);

      // Ensure listId is defined
      this.listId = params['listId'] || '';
      console.log(this.listId);
    })
  }
  createTask(title: string) {
    this.taskservice.createTasks(title, this.listId).subscribe((newTask: any) => {
      this.router.navigate(['../'], { relativeTo: this.route });
    })
  }
}
